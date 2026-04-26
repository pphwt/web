import React from 'react';
import { usePatient } from '../../context/PatientContext';
import { useLanguage } from '../../context/LanguageContext';
import { User, ChevronDown, Search, Globe } from 'lucide-react';

export const TopBar = () => {
  const { selectedPatient, patients, setSelectedPatient } = usePatient();
  const { lang, setLang, t } = useLanguage();

  return (
    <header className="h-20 border-b border-[var(--border-color)] bg-[var(--bg-main)]/80 backdrop-blur-md px-8 flex items-center justify-between sticky top-0 z-30 transition-colors duration-300">
      <div className="flex items-center gap-4 text-[var(--text-muted)]">
        <div className="flex items-center gap-2 px-4 py-2 bg-black/5 rounded-xl border border-[var(--border-color)]">
           <Search size={16} />
           <input 
              type="text" 
              placeholder={t('search_placeholder')}
              className="bg-transparent border-none outline-none text-xs font-medium w-64 placeholder:opacity-50"
           />
        </div>
      </div>

      <div className="flex items-center gap-4">
        {/* Language Toggle */}
        <div className="flex bg-black/5 rounded-full p-1 border border-[var(--border-color)] mr-4">
           <button 
             onClick={() => setLang('en')}
             className={`px-3 py-1 rounded-full text-[10px] font-black transition-all ${lang === 'en' ? 'bg-sky-500 text-white shadow-lg' : 'text-[var(--text-muted)]'}`}
           >
             EN
           </button>
           <button 
             onClick={() => setLang('th')}
             className={`px-3 py-1 rounded-full text-[10px] font-black transition-all ${lang === 'th' ? 'bg-sky-500 text-white shadow-lg' : 'text-[var(--text-muted)]'}`}
           >
             TH
           </button>
        </div>

        {selectedPatient && (
          <div className="flex items-center gap-3 pr-6 border-r border-[var(--border-color)]">
             <div className="text-right">
                <p className="text-[10px] font-black text-[var(--text-muted)] uppercase tracking-widest leading-none mb-1">{t('in_focus')}</p>
                <p className="text-sm font-bold text-sky-500 tracking-tight leading-none">{selectedPatient.name}</p>
             </div>
             <div className="w-10 h-10 rounded-xl bg-sky-500/10 flex items-center justify-center text-sky-500 border border-sky-500/20">
                <User size={20} />
             </div>
          </div>
        )}

        <div className="relative group">
           <button className="flex items-center gap-2 px-4 py-2 hover:bg-black/5 rounded-xl transition-all">
              <span className="text-xs font-bold text-[var(--text-main)]">{t('quick_switch')}</span>
              <ChevronDown size={14} className="text-[var(--text-muted)]" />
           </button>
           
           <div className="absolute right-0 top-full mt-2 w-64 bg-[var(--bg-card)] border border-[var(--border-color)] rounded-2xl shadow-2xl p-2 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-50">
              <p className="text-[9px] font-black text-[var(--text-muted)] uppercase tracking-widest p-3">{t('recent_subjects')}</p>
              <div className="max-h-64 overflow-auto">
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
