import React, { useState, createContext, useContext } from 'react';
import { useLocation } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { TopBar } from './TopBar';
import { Menu, X } from 'lucide-react';

export const MobileMenuContext = createContext(() => {});
export const useMobileMenu = () => useContext(MobileMenuContext);

const HIDE_TOPBAR_ROUTES = ['/page/overview'];

export const MainLayout = ({ children }) => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const { pathname } = useLocation();
  const hideTopBar = HIDE_TOPBAR_ROUTES.includes(pathname);

  return (
    <MobileMenuContext.Provider value={() => setIsSidebarOpen(true)}>
      <div className="flex h-screen bg-[var(--bg-main)] text-[var(--text-main)] transition-colors duration-300 overflow-hidden relative">

        {/* Mobile Overlay */}
        {isSidebarOpen && (
          <div
            className="fixed inset-0 bg-black/50 z-40 lg:hidden backdrop-blur-sm transition-opacity"
            onClick={() => setIsSidebarOpen(false)}
          />
        )}

        {/* Sidebar */}
        <div className={`
          fixed lg:static inset-y-0 left-0 z-50 transform
          ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}
          lg:translate-x-0 transition-transform duration-300 ease-in-out
        `}>
          <Sidebar onClose={() => setIsSidebarOpen(false)} />
        </div>

        <div className="flex-1 flex flex-col min-w-0">
          {!hideTopBar && <TopBar onMenuClick={() => setIsSidebarOpen(true)} />}
          <main className="flex-1 overflow-auto p-4 md:p-8 custom-scrollbar">
            {children}
          </main>
        </div>
      </div>
    </MobileMenuContext.Provider>
  );
};
