import React, { createContext, useContext, useState, useEffect } from 'react';

const ThemeContext = createContext();

const readSavedTheme = () => {
  try {
    return localStorage.getItem('theme');
  } catch {
    return null;
  }
};

const writeSavedTheme = (theme) => {
  try {
    localStorage.setItem('theme', theme);
  } catch {
    // The app can still render if browser storage is blocked or unavailable.
  }
};

export const ThemeProvider = ({ children }) => {
  const [isDarkMode, setIsDarkMode] = useState(() => {
    const saved = readSavedTheme();
    return saved ? saved === 'dark' : false; // Default to light if no saved preference
  });

  useEffect(() => {
    const root = window.document.documentElement;
    if (isDarkMode) {
      root.classList.add('dark');
      writeSavedTheme('dark');
    } else {
      root.classList.remove('dark');
      writeSavedTheme('light');
    }
  }, [isDarkMode]);

  const toggleTheme = () => setIsDarkMode(!isDarkMode);

  return (
    <ThemeContext.Provider value={{ isDarkMode, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => useContext(ThemeContext);
