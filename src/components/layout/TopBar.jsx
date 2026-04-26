import React from 'react';
import { usePatient } from '../../context/PatientContext';
import { useLanguage } from '../../context/LanguageContext';
import { User, ChevronDown, Search, Menu } from 'lucide-react';

export const TopBar = ({ onMenuClick }) => {
  const { selectedPatient, patients, setSelectedPatient } = usePatient();
  const { language, setLanguage, t } = useLanguage();

  return (
    <header className="h-20 border-b border-[var(--border-color)] bg-[var(--bg-main)]/80 backdrop-blur-md px-4 md:px-8 flex items-center justify-between sticky top-0 z-30 transition-colors duration-300">
      
      <div className="flex items-center gap-3">
        {/* Mobile Menu Toggle */}
        <button 
          onClick={onMenuClick}
          className="lg:hidden p-2 hover:bg-black/5 rounded-xl transition-all text-[var(--text-main)]"
        >
          <Menu size={24} />
        </button>

        {/* Search Bar - Hidden on small mobile */}
        <div className="hidden sm:flex items-center gap-2 px-4 py-2 bg-black/5 rounded-xl border border-[var(--border-color)]">
           <Search size={16} className="text-[var(--text-muted)]" />
           <input 
              type="text" 
              placeholder={t('search_placeholder')}
              className="bg-transparent border-none outline-none text-xs font-medium w-32 md:w-64 placeholder:opacity-50 text-[var(--text-main)]"
           />
        </div>
      </div>

      <div className="flex items-center gap-2 md:gap-4">
        {/* Language Toggle - Compact on mobile */}
        <div className="flex bg-black/5 rounded-full p-1 border border-[var(--border-color)]">
           <button 
             onClick={() => setLanguage('en')}
             className={`px-2 md:px-3 py-1 rounded-full text-[9px] md:text-[10px] font-black transition-all ${language === 'en' ? 'bg-sky-500 text-white shadow-lg' : 'text-[var(--text-muted)]'}`}
           >
             EN
           </button>
           <button 
             onClick={() => setLanguage('th')}
             className={`px-2 md:px-3 py-1 rounded-full text-[9px] md:text-[10px] font-black transition-all ${language === 'th' ? 'bg-sky-500 text-white shadow-lg' : 'text-[var(--text-muted)]'}`}
           >
             TH
           </button>
        </div>

        {selectedPatient && (
          <div className="flex items-center gap-2 md:gap-3 px-2 md:px-0 md:pr-6 md:border-r border-[var(--border-color)]">
             <div className="text-right hidden xs:block">
                <p className="text-[9px] font-black text-[var(--text-muted)] uppercase tracking-widest leading-none mb-1">{t('in_focus')}</p>
                <p className="text-xs md:text-sm font-bold text-sky-500 tracking-tight leading-none truncate max-w-[80px] md:max-w-none">{selectedPatient.name}</p>
             </div>
             <div className="w-8 h-8 md:w-10 md:h-10 rounded-lg md:rounded-xl bg-sky-500/10 flex items-center justify-center text-sky-500 border border-sky-500/20">
                <User size={18} className="md:w-5 md:h-5" />
             </div>
          </div>
        )}

        {/* Quick Switch - Compact on mobile */}
        <div className="relative group">
           <button className="p-2 md:px-4 md:py-2 hover:bg-black/5 rounded-xl transition-all flex items-center gap-2">
              <ChevronDown size={18} className="text-[var(--text-muted)]" />
              <span className="hidden md:inline text-xs font-bold text-[var(--text-main)]">{t('quick_switch')}</span>
           </button>
           
           <div className="absolute right-0 top-full mt-2 w-64 bg-[var(--bg-card)] border border-[var(--border-color)] rounded-2xl shadow-2xl p-2 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-50">
              <p className="text-[9px] font-black text-[var(--text-muted)] uppercase tracking-widest p-3">{t('recent_subjects')}</p>
              <div className="max-h-64 overflow-auto custom-scrollbar">
                 {patients.map(p => (
                   <button 
                      key={p.id}
                      onClick={() => setSelectedPatient(p)}
                      className={`w-full text-left px-4 py-3 rounded-xl text-xs font-bold transition-all flex items-center justify-between ${selectedPatient?.id === p.id ? 'bg-sky-500 text-white' : 'text-[var(--text-muted)] hover:bg-black/5'}`}
                   >
                      {p.name}
                      {selectedPatient?.id === p.id && <div className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />}
                   </button>
                 ))}
              </div>
           </div>
        </div>
      </div>
    </header>
  );
};
