import React, { createContext, useCallback, useContext, useMemo, useState } from 'react';

const NavigationLockContext = createContext({
  isLocked: false,
  reason: '',
  cancel: null,
  setNavigationLocked: () => {},
});

export const NavigationLockProvider = ({ children }) => {
  const [state, setState] = useState({ isLocked: false, reason: '', cancel: null });
  const setNavigationLocked = useCallback((isLocked, reason = '', cancel = null) => {
    setState({ isLocked: Boolean(isLocked), reason: reason || 'กำลังประมวลผลข้อมูล…', cancel: isLocked ? cancel : null });
  }, []);

  const value = useMemo(() => ({
    ...state,
    setNavigationLocked,
  }), [setNavigationLocked, state]);

  return (
    <NavigationLockContext.Provider value={value}>
      {children}
    </NavigationLockContext.Provider>
  );
};

export const useNavigationLock = () => useContext(NavigationLockContext);
