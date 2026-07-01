import React, { createContext, useState, useContext, useEffect } from 'react';

const AuthContext = createContext();

const readStoredToken = () => {
  const stored = localStorage.getItem('bio_token');
  if (!stored) return null;
  try {
    const payload = JSON.parse(atob(stored.split('.')[1]));
    if (payload.exp * 1000 < Date.now()) {
      localStorage.removeItem('bio_token');
      return null;
    }
    return stored;
  } catch {
    localStorage.removeItem('bio_token');
    return null;
  }
};

const userFromToken = (value) => {
  const payload = JSON.parse(atob(value.split('.')[1]));
  return {
    username: payload.sub || 'user',
    role: payload.role || 'health_officer',
    full_name: payload.full_name || payload.sub || 'User',
  };
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(readStoredToken);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (token) {
      try {
        setUser(userFromToken(token));
      } catch {
        setToken(null);
      }
    }
    setIsLoading(false);
  }, [token]);

  const login = (newToken, userData) => {
    localStorage.setItem('bio_token', newToken);
    setToken(newToken);
    try {
      setUser({ ...userFromToken(newToken), ...userData });
    } catch {
      setUser(userData);
    }
  };

  const logout = () => {
    localStorage.removeItem('bio_token');
    setToken(null);
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, token, login, logout, isLoading }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
