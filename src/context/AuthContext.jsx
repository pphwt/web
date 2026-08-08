import React, { createContext, useState, useContext, useEffect } from 'react';
import { modelApi } from '../services/modelApi';

const AuthContext = createContext();

const getStoredItem = (key) => {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
};

const setStoredItem = (key, value) => {
  try {
    localStorage.setItem(key, value);
  } catch {
    // Auth state still updates in memory for the current tab.
  }
};

const removeStoredItem = (key) => {
  try {
    localStorage.removeItem(key);
  } catch {
    // Ignore storage failures so render can continue.
  }
};

const readStoredToken = () => {
  const stored = getStoredItem('bio_token');
  if (!stored) return null;
  try {
    const payload = JSON.parse(atob(stored.split('.')[1]));
    if (payload.exp * 1000 < Date.now()) {
      removeStoredItem('bio_token');
      return null;
    }
    return stored;
  } catch {
    removeStoredItem('bio_token');
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
    if (!token) {
      setUser(null);
      setIsLoading(false);
      return undefined;
    }

    let refreshTimer;
    try {
      const parsedUser = userFromToken(token);
      setUser(parsedUser);
      const payload = JSON.parse(atob(token.split('.')[1]));
      const refreshDelay = Math.max(30_000, (payload.exp * 1000) - Date.now() - (5 * 60 * 1000));
      refreshTimer = window.setTimeout(async () => {
        try {
          const refreshed = await modelApi.refreshAccessToken();
          setStoredItem('bio_token', refreshed.access_token);
          setToken(refreshed.access_token);
          setUser(userFromToken(refreshed.access_token));
        } catch {
          // A revoked token must end the browser session rather than retrying
          // indefinitely or keeping a stale role in memory.
          removeStoredItem('bio_token');
          setToken(null);
          setUser(null);
        }
      }, refreshDelay);
    } catch {
      removeStoredItem('bio_token');
      setToken(null);
      setUser(null);
    }
    setIsLoading(false);
    return () => {
      if (refreshTimer) window.clearTimeout(refreshTimer);
    };
  }, [token]);

  const login = (newToken, userData) => {
    setStoredItem('bio_token', newToken);
    setToken(newToken);
    try {
      setUser({ ...userFromToken(newToken), ...userData });
    } catch {
      setUser(userData);
    }
  };

  const logout = () => {
    removeStoredItem('bio_token');
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
