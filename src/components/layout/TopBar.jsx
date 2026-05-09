import React from 'react';
import { usePatient } from '../../context/PatientContext';
import { useLanguage } from '../../context/LanguageContext';
import { useTheme } from '../../context/ThemeContext';
import { ChevronDown, Menu, User } from 'lucide-react';

export const TopBar = ({ onMenuClick }) => {
  const { selectedPatient, patients, setSelectedPatient } = usePatient();
  const { t } = useLanguage();
  const { isDarkMode: dk } = useTheme();

  const initials = selectedPatient?.name
    ? selectedPatient.name.trim().split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase()
    : null;

  return (
    <header className={`h-16 border-b px-4 md:px-6 flex items-center justify-between sticky top-0 z-30 transition-colors duration-300 ${
      dk ? 'bg-[#080e1a]/90 border-white/[0.06] backdrop-blur-md' : 'bg-white/90 border-slate-200 backdrop-blur-md'
    }`}>

      {/* Left: hamburger + patient card */}
      <div className="flex items-center gap-3">
        <button
          onClick={onMenuClick}
          className={`lg:hidden p-2 rounded-xl transition-all ${dk ? 'text-slate-400 hover:bg-white/[0.06]' : 'text-slate-500 hover:bg-slate-100'}`}
        >
          <Menu size={20} />
        </button>

        {selectedPatient ? (
          <div className="flex items-center gap-2.5">
            <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-[11px] font-bold ${
              dk ? 'bg-sky-500/20 text-sky-300' : 'bg-sky-100 text-sky-700'
            }`}>
              {initials}
            </div>
            <div className="hidden sm:block">
              <p className={`text-xs font-semibold leading-none ${dk ? 'text-white' : 'text-slate-800'}`}>
                {selectedPatient.name}
              </p>
              <div className="flex items-center gap-1.5 mt-1">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                <span className={`text-[10px] ${dk ? 'text-slate-500' : 'text-slate-400'}`}>
                  {t('status_active')}
                </span>
              </div>
            </div>
          </div>
        ) : (
          <div className={`flex items-center gap-2 rounded-xl border px-3 py-1.5 ${
            dk ? 'border-white/[0.07] bg-white/[0.03]' : 'border-slate-200 bg-slate-50'
          }`}>
            <User size={13} className={dk ? 'text-slate-500' : 'text-slate-400'} />
            <span className={`text-xs ${dk ? 'text-slate-500' : 'text-slate-400'}`}>ไม่ได้เลือกคนไข้</span>
          </div>
        )}
      </div>

      {/* Right: quick switch */}
      <div className="relative group">
        <button className={`flex items-center gap-2 rounded-xl border px-3 py-2 text-xs font-semibold transition-all ${
          dk
            ? 'border-white/[0.07] text-slate-400 hover:bg-white/[0.05] hover:text-slate-200'
            : 'border-slate-200 text-slate-500 hover:bg-slate-100 hover:text-slate-700'
        }`}>
          <span className="hidden sm:inline">{t('quick_switch')}</span>
          <ChevronDown size={14} />
        </button>

        <div className={`absolute right-0 top-full mt-2 w-64 rounded-2xl border shadow-2xl p-2 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-50 ${
          dk ? 'bg-[#0d1628] border-white/[0.08]' : 'bg-white border-slate-200'
        }`}>
          <p className={`text-[9px] font-semibold uppercase tracking-[0.16em] px-3 py-2 ${dk ? 'text-slate-600' : 'text-slate-400'}`}>
            {t('recent_subjects')}
          </p>
          <div className="max-h-64 overflow-auto custom-scrollbar space-y-0.5">
            {patients.map(p => {
              const isActive = selectedPatient?.id === p.id;
              const pts = p.name.trim().split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase();
              return (
                <button
                  key={p.id}
                  onClick={() => setSelectedPatient(p)}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left transition-all ${
                    isActive
                      ? dk ? 'bg-sky-500/[0.12] text-sky-300' : 'bg-sky-50 text-sky-700'
                      : dk ? 'text-slate-400 hover:bg-white/[0.04] hover:text-slate-100' : 'text-slate-500 hover:bg-slate-100 hover:text-slate-800'
                  }`}
                >
                  <div className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-[10px] font-bold ${
                    isActive
                      ? dk ? 'bg-sky-500/20 text-sky-300' : 'bg-sky-100 text-sky-700'
                      : dk ? 'bg-white/[0.06] text-slate-400' : 'bg-slate-100 text-slate-500'
                  }`}>
                    {pts}
                  </div>
                  <span className="text-xs font-semibold truncate flex-1">{p.name}</span>
                  {isActive && <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-sky-400" />}
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </header>
  );
};
