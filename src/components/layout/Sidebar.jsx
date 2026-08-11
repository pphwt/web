import React, { useState, useRef, useEffect } from 'react';
import { NavLink } from 'react-router-dom';
import {
  Activity, FileText, LogOut, Users, Archive,
  FlaskConical, Sun, Moon, Database, ShieldCheck, HelpCircle,
  X, ChevronUp, HeartPulse, Type, Minus, Plus, RotateCcw,
  BookOpen,
} from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { useLanguage } from '../../context/LanguageContext';
import { useAccessibility } from '../../context/AccessibilityContext';
import { useNavigationLock } from '../../context/NavigationLockContext';

const buildSections = (t, language, role) => [
  {
    label: 'หลัก',
    items: [
      { icon: Users,      label: t('nav_patients'),  path: '/page/overview' },
      { icon: ShieldCheck, label: language === 'th' ? 'หลักฐาน AI' : 'AI Evidence', path: '/page/ai-diagnostics' },
      ...(['doctor', 'admin'].includes(role) ? [{ icon: ShieldCheck, label: language === 'th' ? 'Audit และความปลอดภัย' : 'Audit & Security', path: '/page/audit' }] : []),
      { icon: HeartPulse, label: language === 'th' ? 'วิเคราะห์ ECG และหัวใจ 3D' : 'ECG Analysis & 3D Heart', path: '/page/clinical-ecg' },
      { icon: Activity,   label: t('nav_monitoring'), path: '/page/live' },
    ],
  },
  {
    label: 'ข้อมูล',
    items: [
      { icon: Archive,      label: t('nav_archives'), path: '/page/archives' },
      { icon: FileText,     label: t('nav_reports'),  path: '/page/reports' },
    ],
  },
  {
    label: 'อื่นๆ',
    items: [
      { icon: HelpCircle, label: t('nav_help'), path: '/page/help' },
    ],
  },
];

export const Sidebar = ({ onClose }) => {
  const { user, logout } = useAuth();
  const { isDarkMode, toggleTheme } = useTheme();
  const { language, setLanguage, t } = useLanguage();
  const { isLocked } = useNavigationLock();
  const {
    fontScale,
    fontPercent,
    minScale,
    maxScale,
    setFontScale,
    increaseFont,
    decreaseFont,
    resetFont,
  } = useAccessibility();
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef(null);

  const sections = buildSections(t, language, user?.role);
  const dk = isDarkMode;

  // Close dropdown on outside click
  useEffect(() => {
    const handler = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const handleNavClick = (event) => {
    if (isLocked) {
      event?.preventDefault();
      return;
    }
    if (onClose) onClose();
  };

  // ── tokens ────────────────────────────────────────────────────
  const sidebar  = dk ? 'bg-[#080e1a] border-white/[0.06]' : 'bg-white border-slate-200';
  const divider  = dk ? 'border-white/[0.06]'              : 'border-slate-100';
  const secLabel = dk ? 'text-slate-600'                    : 'text-slate-400';
  const logoText = dk ? 'text-white'                        : 'text-slate-900';
  const logoSub  = dk ? 'text-sky-400/60'                   : 'text-sky-600/60';
  const logoIcon = dk
    ? 'bg-sky-500/15 border-sky-500/20 text-sky-400'
    : 'bg-sky-50 border-sky-200 text-sky-600';

  const navBase     = 'clinical-focus w-full flex items-center gap-3 px-3 py-3 rounded-xl transition-all duration-150 text-sm';
  const navActive   = dk
    ? `${navBase} bg-sky-500/[0.12] text-sky-300 font-semibold`
    : `${navBase} bg-sky-50 text-sky-700 font-semibold`;
  const navInactive = dk
    ? `${navBase} text-slate-400 hover:bg-white/[0.04] hover:text-slate-100`
    : `${navBase} text-slate-500 hover:bg-slate-100 hover:text-slate-800`;

  const initials = user?.username ? user.username.slice(0, 2).toUpperCase() : '??';

  // ── dropdown items ────────────────────────────────────────────
  const dropdownBg     = dk ? 'bg-[#0d1628] border-white/[0.08]' : 'bg-white border-slate-200';
  const dropdownItem   = dk
    ? 'flex items-center gap-3 w-full px-3 py-2.5 rounded-lg text-sm text-slate-400 hover:bg-white/[0.05] hover:text-slate-100 transition-all'
    : 'flex items-center gap-3 w-full px-3 py-2.5 rounded-lg text-sm text-slate-500 hover:bg-slate-100 hover:text-slate-800 transition-all';
  const dropdownLogout = dk
    ? 'flex items-center gap-3 w-full px-3 py-2.5 rounded-lg text-sm text-slate-400 hover:bg-rose-500/[0.08] hover:text-rose-400 transition-all'
    : 'flex items-center gap-3 w-full px-3 py-2.5 rounded-lg text-sm text-slate-500 hover:bg-rose-50 hover:text-rose-600 transition-all';
  const langTrack = dk ? 'bg-white/[0.04] border-white/[0.06]' : 'bg-slate-100 border-slate-200';
  const langBtnActive = dk
    ? 'bg-sky-500/[0.15] text-sky-300 font-semibold'
    : 'bg-white text-sky-700 font-semibold shadow-sm';
  const langBtnInactive = dk
    ? 'text-slate-500 hover:text-slate-300'
    : 'text-slate-400 hover:text-slate-600';

  return (
    <aside className={`w-64 h-full border-r ${sidebar} flex flex-col z-50`}>

      {/* ── Logo ─────────────────────────────────────────────── */}
      <div className="px-4 py-5 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border ${logoIcon}`}>
            <HeartPulse size={17} />
          </div>
          <div>
            <p className={`text-sm font-bold leading-none tracking-tight ${logoText}`}>Bioelectric</p>
            <p className={`mt-0.5 text-[10px] uppercase tracking-[0.18em] ${logoSub}`}>PINN System</p>
          </div>
        </div>
        <button
          onClick={handleNavClick}
          className={`lg:hidden p-1.5 rounded-lg transition-colors ${dk ? 'text-slate-500 hover:text-slate-200 hover:bg-white/5' : 'text-slate-400 hover:text-slate-700 hover:bg-slate-100'}`}
        >
          <X size={17} />
        </button>
      </div>

      {/* ── Nav ──────────────────────────────────────────────── */}
      <nav className="flex-1 overflow-y-auto custom-scrollbar px-3 pb-3 space-y-4">
        {sections.map(({ label, items }) => (
          <div key={label}>
            <p className={`mb-1.5 px-3 text-[11px] font-semibold uppercase tracking-[0.12em] ${secLabel}`}>
              {label}
            </p>
            <div className="space-y-0.5">
              {items.map((item) => (
                <NavLink
                  key={item.path}
                  to={item.path}
                  onClick={handleNavClick}
                  aria-disabled={isLocked}
                  tabIndex={isLocked ? -1 : 0}
                  className={({ isActive }) => `${isActive ? navActive : navInactive} ${isLocked ? 'pointer-events-none opacity-50' : ''}`}
                >
                  {({ isActive }) => (
                    <>
                      <item.icon
                        size={15}
                        className={isActive ? (dk ? 'text-sky-400' : 'text-sky-600') : 'opacity-70'}
                      />
                      <span className="tracking-tight truncate">{item.label}</span>
                      {isActive && (
                        <span className={`ml-auto h-1.5 w-1.5 shrink-0 rounded-full ${dk ? 'bg-sky-400' : 'bg-sky-600'}`} />
                      )}
                    </>
                  )}
                </NavLink>
              ))}
            </div>
          </div>
        ))}
      </nav>

      {/* ── Footer: system documentation link ───────────────── */}
      <div className={`px-3 pb-1 border-t ${divider} pt-2`}>
        <a
          href="/docs/system-explainer.html"
          target="_blank"
          rel="noopener noreferrer"
          className={`flex items-center gap-2.5 px-3 py-2 rounded-lg text-[11px] transition-colors ${
            dk ? 'text-slate-500 hover:text-sky-400 hover:bg-white/[0.04]' : 'text-slate-400 hover:text-sky-600 hover:bg-slate-50'
          }`}
        >
          <BookOpen size={13} className="opacity-70 shrink-0" />
          <span className="truncate">เอกสารระบบ (System Docs)</span>
        </a>
      </div>

      {/* ── User card + dropdown ─────────────────────────────── */}
      <div className={`px-3 pt-3 pb-4 border-t ${divider}`} ref={menuRef}>
        <AnimatePresence>
          {menuOpen && (
            <motion.div
              initial={{ opacity: 0, y: 8, scale: 0.97 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 6, scale: 0.97 }}
              transition={{ duration: 0.18, ease: [0.22, 1, 0.36, 1] }}
              className={`mb-2 overflow-hidden rounded-2xl border p-1.5 shadow-xl ${dropdownBg}`}
            >
              <div className="mb-1.5 px-1">
                <p className={`mb-2 px-1 text-[9px] font-semibold uppercase tracking-[0.16em] ${secLabel}`}>
                  {t('language') || 'Language'}
                </p>
                <div className={`flex gap-1 rounded-xl border p-1 ${langTrack}`}>
                  {[{ val: 'th', label: 'ภาษาไทย' }, { val: 'en', label: 'English' }].map(({ val, label }) => (
                    <button
                      key={val}
                      onClick={() => { setLanguage(val); }}
                      className={`flex-1 rounded-lg px-2 py-1.5 text-xs transition-all duration-150 ${language === val ? langBtnActive : langBtnInactive}`}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </div>

              <div className={`my-1 h-px ${divider}`} />

              <div className="px-1 py-1.5">
                <div className="mb-2 flex items-center justify-between gap-2">
                  <p className={`flex items-center gap-1.5 px-1 text-[9px] font-semibold uppercase tracking-[0.16em] ${secLabel}`}>
                    <Type size={12} /> Text Size
                  </p>
                  <span className={`rounded-md px-1.5 py-0.5 text-[10px] font-bold ${
                    dk ? 'bg-white/[0.05] text-slate-300' : 'bg-slate-100 text-slate-600'
                  }`}>
                    {fontPercent}%
                  </span>
                </div>
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={decreaseFont}
                    className={`flex h-8 w-8 items-center justify-center rounded-lg transition-all ${dropdownItem.replace('w-full px-3 py-2.5 text-sm', '')}`}
                    title="Decrease text size"
                  >
                    <Minus size={13} />
                  </button>
                  <input
                    type="range"
                    min={minScale}
                    max={maxScale}
                    step="0.05"
                    value={fontScale}
                    onChange={(event) => setFontScale(event.target.value)}
                    className="flex-1"
                    aria-label="Text size"
                  />
                  <button
                    type="button"
                    onClick={increaseFont}
                    className={`flex h-8 w-8 items-center justify-center rounded-lg transition-all ${dropdownItem.replace('w-full px-3 py-2.5 text-sm', '')}`}
                    title="Increase text size"
                  >
                    <Plus size={13} />
                  </button>
                  <button
                    type="button"
                    onClick={resetFont}
                    className={`flex h-8 w-8 items-center justify-center rounded-lg transition-all ${dropdownItem.replace('w-full px-3 py-2.5 text-sm', '')}`}
                    title="Reset text size"
                  >
                    <RotateCcw size={12} />
                  </button>
                </div>
              </div>

              <button
                onClick={() => { toggleTheme(); setMenuOpen(false); }}
                className={dropdownItem}
              >
                {dk ? <Sun size={15} className="opacity-70" /> : <Moon size={15} className="opacity-70" />}
                <span>{dk ? t('nav_light_mode') : t('nav_dark_mode')}</span>
              </button>

              <div className={`my-1 h-px ${divider}`} />

              <button
                onClick={() => { logout(); setMenuOpen(false); }}
                className={dropdownLogout}
              >
                <LogOut size={15} className="opacity-70" />
                <span>{t('nav_terminate')}</span>
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        <button
          onClick={() => setMenuOpen((v) => !v)}
          className={`w-full flex items-center gap-3 rounded-xl px-3 py-2.5 border transition-all duration-150 ${
            menuOpen
              ? dk ? 'border-sky-500/30 bg-sky-500/[0.07]' : 'border-sky-300 bg-sky-50'
              : dk ? 'border-white/[0.06] bg-white/[0.03] hover:bg-white/[0.06]' : 'border-slate-100 bg-slate-50 hover:bg-slate-100'
          }`}
        >
          <div className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-[11px] font-bold ${dk ? 'bg-sky-500/20 text-sky-300' : 'bg-sky-100 text-sky-700'}`}>
            {initials}
          </div>
          <div className="min-w-0 flex-1 text-left">
            <p className={`truncate text-xs font-semibold ${dk ? 'text-slate-200' : 'text-slate-700'}`}>
              {user?.username ?? 'Guest'}
            </p>
            <p className={`text-[10px] ${dk ? 'text-slate-500' : 'text-slate-400'}`}>Online</p>
          </div>
          <div className="flex items-center gap-1.5 shrink-0">
            <span className="h-2 w-2 rounded-full bg-emerald-400" />
            <motion.div
              animate={{ rotate: menuOpen ? 0 : 180 }}
              transition={{ duration: 0.2 }}
            >
              <ChevronUp size={13} className={dk ? 'text-slate-500' : 'text-slate-400'} />
            </motion.div>
          </div>
        </button>
      </div>
    </aside>
  );
};
