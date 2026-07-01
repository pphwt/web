import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';

const AccessibilityContext = createContext();

const STORAGE_KEY = 'bio_font_scale';
const MIN_SCALE = 0.85;
const MAX_SCALE = 1.35;
const STEP = 0.05;

const clampScale = (value) => {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return 1;
  return Math.min(MAX_SCALE, Math.max(MIN_SCALE, parsed));
};

export const AccessibilityProvider = ({ children }) => {
  const [fontScale, setFontScaleState] = useState(() => {
    return clampScale(localStorage.getItem(STORAGE_KEY) || 1);
  });

  useEffect(() => {
    const root = document.documentElement;
    const nextScale = clampScale(fontScale);
    root.style.setProperty('--app-font-scale', String(nextScale));
    root.style.setProperty('--app-font-percent', `${Math.round(nextScale * 100)}%`);
    localStorage.setItem(STORAGE_KEY, String(nextScale));
  }, [fontScale]);

  const controls = useMemo(() => {
    const setFontScale = (value) => setFontScaleState(clampScale(value));
    return {
      fontScale,
      fontPercent: Math.round(fontScale * 100),
      minScale: MIN_SCALE,
      maxScale: MAX_SCALE,
      setFontScale,
      increaseFont: () => setFontScaleState((value) => clampScale(value + STEP)),
      decreaseFont: () => setFontScaleState((value) => clampScale(value - STEP)),
      resetFont: () => setFontScaleState(1),
    };
  }, [fontScale]);

  return (
    <AccessibilityContext.Provider value={controls}>
      {children}
    </AccessibilityContext.Provider>
  );
};

export const useAccessibility = () => useContext(AccessibilityContext);
