import React, { useState, useEffect, useRef, createContext, useContext } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { TopBar } from './TopBar';
import { Menu, X } from 'lucide-react';
import { PdpaNoticeBanner } from './PdpaNoticeBanner';
import { NavigationLockProvider, useNavigationLock } from '../../context/NavigationLockContext';

export const MobileMenuContext = createContext(() => {});
export const useMobileMenu = () => useContext(MobileMenuContext);

const HIDE_TOPBAR_ROUTES = ['/page/overview'];

const MainLayoutContent = ({ children }) => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { isLocked, reason, cancel } = useNavigationLock();
  const lastAllowedLocation = useRef(`${location.pathname}${location.search}${location.hash}`);
  const currentLocation = `${location.pathname}${location.search}${location.hash}`;

  useEffect(() => {
    if (!isLocked) {
      lastAllowedLocation.current = currentLocation;
      return;
    }
    if (currentLocation !== lastAllowedLocation.current) {
      navigate(lastAllowedLocation.current, { replace: true });
    }
  }, [currentLocation, isLocked, navigate]);

  useEffect(() => {
    if (!isLocked) return undefined;
    const preventUnload = (event) => {
      event.preventDefault();
      event.returnValue = '';
    };
    window.addEventListener('beforeunload', preventUnload);
    return () => window.removeEventListener('beforeunload', preventUnload);
  }, [isLocked]);

  const { pathname } = location;
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

        {/* PDPA Cookie Consent Banner */}
        <PdpaNoticeBanner />

        {isLocked && (
          <div
            role="alert"
            aria-live="assertive"
            aria-label="กำลังประมวลผล ห้ามเปลี่ยนหน้า"
            className="fixed inset-0 z-[200] flex cursor-wait items-center justify-center bg-slate-950/25 p-4 backdrop-blur-[1px]"
          >
            <div className="flex max-w-xl flex-wrap items-center justify-center gap-3 rounded-2xl border border-sky-200/40 bg-white/95 px-5 py-4 text-sm font-semibold text-slate-700 shadow-2xl dark:border-sky-400/20 dark:bg-[#0d1628]/95 dark:text-slate-200">
              <span className="h-5 w-5 shrink-0 animate-spin rounded-full border-2 border-sky-200 border-t-sky-600 dark:border-sky-900 dark:border-t-sky-300" />
              <span className="min-w-0 flex-1 text-center sm:text-left">{reason || 'กำลังประมวลผลข้อมูล… กรุณารอให้เสร็จก่อนเปลี่ยนหน้า'}</span>
              {cancel && (
                <button
                  type="button"
                  onClick={cancel}
                  className="shrink-0 rounded-lg bg-rose-600 px-3 py-2 text-xs font-bold text-white shadow-sm transition hover:bg-rose-700 focus:outline-none focus:ring-2 focus:ring-rose-300 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  ยกเลิก
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </MobileMenuContext.Provider>
  );
};

export const MainLayout = ({ children }) => (
  <NavigationLockProvider>
    <MainLayoutContent>{children}</MainLayoutContent>
  </NavigationLockProvider>
);
