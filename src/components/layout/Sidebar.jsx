import React from 'react';
import { NavLink } from 'react-router-dom';
import { Activity, Brain, FileText, LogOut, Zap, Users, Archive, FlaskConical, Sun, Moon, Database, ShieldCheck, HelpCircle, X } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { useLanguage } from '../../context/LanguageContext';

export const Sidebar = ({ onClose }) => {
  const { logout } = useAuth();
  const { isDarkMode, toggleTheme } = useTheme();
  const { t } = useLanguage();

  const menuItems = [
    { icon: Users, label: t('nav_patients'), path: '/' },
    { icon: Activity, label: t('nav_monitoring'), path: '/live' },
    
    // Diagnostic Modules
    { icon: Database, label: t("sandbox_title"), path: "/sandbox" },
    { icon: Brain, label: "Brain Source Mapping", path: "/brain-diagnostics" },
    { icon: ShieldCheck, label: t("ai_diag_title"), path: "/ai-diagnostics" },
    
    // Archives & Research
    { icon: Archive, label: t('nav_archives'), path: '/archives' },
    { icon: FlaskConical, label: t('nav_lab'), path: '/lab' },
    { icon: FileText, label: t('nav_reports'), path: '/reports' },
    { icon: HelpCircle, label: t('nav_help'), path: '/help' },
  ];

  // Helper to handle navigation on mobile
  const handleNavClick = () => {
    if (onClose) onClose();
  };

  return (
    <aside className="w-64 h-full border-r border-[var(--border-color)] flex flex-col glass z-50 bg-[var(--bg-sidebar)]">
      <div className="p-6 mb-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-sky-500/20 rounded-lg text-sky-500">
            <Zap className="w-6 h-6" />
          </div>
          <h1 className="text-xl font-bold tracking-tighter text-[var(--text-main)] uppercase italic leading-none">
            BIOELECTRIC<br/>
            <span className="text-sky-500 text-xs font-black">PINN SYSTEM</span>
          </h1>
        </div>
        {/* Mobile Close Button */}
        <button 
          onClick={handleNavClick} 
          className="lg:hidden p-2 text-[var(--text-muted)] hover:text-rose-500 transition-colors"
        >
          <X size={24} />
        </button>
      </div>

      <nav className="flex-1 px-4 space-y-1 overflow-y-auto custom-scrollbar">
        {menuItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            onClick={handleNavClick}
            className={({ isActive }) =>
              `w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 ${isActive
                ? 'bg-sky-500 text-white shadow-[0_10px_20px_rgba(14,165,233,0.2)] font-bold'
                : 'hover:bg-black/5 text-[var(--text-muted)] hover:text-[var(--text-main)]'
              }`
            }
          >
            <item.icon className="w-5 h-5" />
            <span className="text-sm font-medium tracking-tight">{item.label}</span>
          </NavLink>
        ))}
      </nav>

      <div className="p-4 mt-auto border-t border-[var(--border-color)] space-y-1 bg-black/5 lg:bg-transparent">
        <button 
          onClick={toggleTheme}
          className="w-full flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-black/5 transition-all text-[var(--text-muted)] hover:text-sky-500"
        >
          {isDarkMode ? <Sun size={18} /> : <Moon size={18} />}
          <span className="text-[10px] font-black uppercase tracking-widest">
            {isDarkMode ? t('nav_light_mode') : t('nav_dark_mode')}
          </span>
        </button>

        <button 
          onClick={logout}
          className="w-full flex items-center gap-4 px-6 py-4 rounded-2xl hover:bg-rose-500/5 transition-all text-slate-400 hover:text-rose-500 font-black text-[10px] uppercase tracking-[0.2em]"
        >
          <LogOut size={18} />
          <span>{t('nav_terminate')}</span>
        </button>
      </div>
    </aside>
  );
};
