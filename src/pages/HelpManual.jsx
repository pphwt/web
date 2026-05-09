import React, { useState } from 'react';
import { BookOpen, Activity, Database, FlaskConical, Zap, Info } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import { useTheme } from '../context/ThemeContext';

// ─── sub-components ───────────────────────────────────────────────────────────

const SectionHeader = ({ icon, title, description, dk }) => (
  <div className="flex items-start gap-3 mb-4">
    <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-xl border mt-0.5 ${
      dk ? 'bg-white/[0.04] border-white/[0.06]' : 'bg-slate-100 border-slate-200'
    }`}>
      {icon}
    </div>
    <div>
      <h2 className={`text-sm font-bold ${dk ? 'text-white' : 'text-slate-900'}`}>{title}</h2>
      <p className={`mt-0.5 text-xs leading-relaxed ${dk ? 'text-slate-400' : 'text-slate-500'}`}>{description}</p>
    </div>
  </div>
);

const InstructionCard = ({ title, children, dk }) => (
  <div className={`rounded-xl border p-4 ${dk ? 'bg-white/[0.03] border-white/[0.06]' : 'bg-slate-50 border-slate-200'}`}>
    <p className={`text-[10px] font-semibold uppercase tracking-wider mb-2 ${dk ? 'text-sky-400' : 'text-sky-600'}`}>{title}</p>
    <div className={`text-xs leading-relaxed ${dk ? 'text-slate-300' : 'text-slate-600'}`}>{children}</div>
  </div>
);

const VitalGuide = ({ label, range, meaning, dk }) => (
  <div className={`rounded-xl border p-3 text-center ${dk ? 'bg-white/[0.03] border-white/[0.06]' : 'bg-white border-slate-200'}`}>
    <p className={`text-[9px] font-semibold uppercase tracking-wider ${dk ? 'text-sky-400' : 'text-sky-600'}`}>{label}</p>
    <p className={`text-xs font-bold mt-1 ${dk ? 'text-white' : 'text-slate-800'}`}>{range}</p>
    <p className={`text-[9px] mt-1 leading-tight ${dk ? 'text-slate-500' : 'text-slate-400'}`}>{meaning}</p>
  </div>
);

const ParamGuide = ({ name, impact, dk }) => (
  <div className={`rounded-xl border p-3 ${dk ? 'bg-white/[0.03] border-white/[0.06]' : 'bg-slate-50 border-slate-200'}`}>
    <p className={`text-[10px] font-semibold uppercase tracking-wider mb-1.5 ${dk ? 'text-emerald-400' : 'text-emerald-600'}`}>{name}</p>
    <p className={`text-[11px] leading-relaxed ${dk ? 'text-slate-400' : 'text-slate-500'}`}>{impact}</p>
  </div>
);

// ─── main ─────────────────────────────────────────────────────────────────────

const HelpManual = () => {
  const { t } = useLanguage();
  const { isDarkMode: dk } = useTheme();

  const surface  = dk ? 'bg-[#0d1525] border-white/[0.06]'  : 'bg-white border-slate-200';
  const divider  = dk ? 'border-white/[0.06]'               : 'border-slate-100';
  const secLabel = dk ? 'text-slate-500'                    : 'text-slate-400';
  const mainText = dk ? 'text-white'                        : 'text-slate-900';
  const subText  = dk ? 'text-slate-400'                    : 'text-slate-500';

  return (
    <div className="p-4 md:p-6 min-h-screen bg-[var(--bg-main)] text-[var(--text-main)] transition-colors duration-300">
      <div className="max-w-[1000px] mx-auto flex flex-col gap-5">

        {/* Header */}
        <header className={`rounded-2xl border p-4 ${surface}`}>
          <div className="flex items-center gap-3">
            <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border ${
              dk ? 'bg-sky-500/15 border-sky-500/20 text-sky-400' : 'bg-sky-50 border-sky-200 text-sky-600'
            }`}>
              <BookOpen size={17} />
            </div>
            <div>
              <h1 className={`text-sm font-bold ${mainText}`}>{t('manual_title')}</h1>
              <p className={`mt-0.5 text-xs ${subText}`}>{t('manual_subtitle')}</p>
            </div>
          </div>
        </header>

        {/* Module 1 */}
        <div className={`rounded-2xl border p-5 ${surface}`}>
          <SectionHeader dk={dk}
            icon={<Activity size={15} className={dk ? 'text-rose-400' : 'text-rose-600'} />}
            title={t('man_mod1_title')}
            description={t('man_mod1_desc')}
          />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <InstructionCard dk={dk} title={t('man_instr1_title')}>
              <p>{t('man_instr1_body')}</p>
              <div className={`mt-2 space-y-1 text-[10px] ${dk ? 'text-slate-500' : 'text-slate-400'}`}>
                {t('man_instr1_list').split('•').filter(Boolean).map((item, i) => (
                  <p key={i}>• {item.trim()}</p>
                ))}
              </div>
            </InstructionCard>
            <InstructionCard dk={dk} title={t('man_instr2_title')}>
              <p>{t('man_instr2_body')}</p>
              <p className={`mt-2 font-semibold ${dk ? 'text-sky-400' : 'text-sky-600'}`}>{t('man_instr2_standard')}</p>
            </InstructionCard>
          </div>
        </div>

        {/* Module 2 */}
        <div className={`rounded-2xl border p-5 ${surface}`}>
          <SectionHeader dk={dk}
            icon={<Database size={15} className={dk ? 'text-sky-400' : 'text-sky-600'} />}
            title={t('man_mod2_title')}
            description={t('man_mod2_desc')}
          />

          <div className={`rounded-xl border p-4 mb-3 ${dk ? 'bg-white/[0.03] border-white/[0.06]' : 'bg-slate-50 border-slate-200'}`}>
            <p className={`text-[10px] font-semibold uppercase tracking-wider mb-3 flex items-center gap-1.5 ${dk ? 'text-sky-400' : 'text-sky-600'}`}>
              <Zap size={12} fill="currentColor" /> {t('man_vital_title')}
            </p>
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
              <VitalGuide dk={dk} label={t('man_vital_pr')}   range="120-200ms"   meaning={t('man_vital_pr_desc')} />
              <VitalGuide dk={dk} label={t('man_vital_qrs')}  range="< 120ms"     meaning={t('man_vital_qrs_desc')} />
              <VitalGuide dk={dk} label={t('man_vital_qtc')}  range="< 450ms"     meaning={t('man_vital_qtc_desc')} />
              <VitalGuide dk={dk} label={t('man_vital_hr')}   range="60-100 BPM"  meaning={t('man_vital_hr_desc')} />
              <VitalGuide dk={dk} label={t('man_vital_axis')} range="-30° to +90°" meaning={t('man_vital_axis_desc')} />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <InstructionCard dk={dk} title={t('man_sandbox_logic_title')}><p>{t('man_sandbox_logic_body')}</p></InstructionCard>
            <InstructionCard dk={dk} title={t('man_sandbox_map_title')}><p>{t('man_sandbox_map_body')}</p></InstructionCard>
          </div>
        </div>

        {/* Module 3 */}
        <div className={`rounded-2xl border p-5 ${surface}`}>
          <SectionHeader dk={dk}
            icon={<FlaskConical size={15} className={dk ? 'text-emerald-400' : 'text-emerald-600'} />}
            title={t('man_mod3_title')}
            description={t('man_mod3_desc')}
          />
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-3">
            <ParamGuide dk={dk} name={t('man_param_a_title')} impact={t('man_param_a_desc')} />
            <ParamGuide dk={dk} name={t('man_param_k_title')} impact={t('man_param_k_desc')} />
            <ParamGuide dk={dk} name={t('man_param_d_title')} impact={t('man_param_d_desc')} />
          </div>
          <p className={`text-[10px] text-center ${dk ? 'text-amber-400/60' : 'text-amber-600/70'}`}>{t('man_lab_tip')}</p>
        </div>

        {/* References */}
        <div className={`rounded-2xl border p-5 ${surface}`}>
          <div className="flex items-center gap-2 mb-4">
            <Info size={14} className={dk ? 'text-sky-400' : 'text-sky-600'} />
            <span className={`text-xs font-semibold ${secLabel}`}>{t('ref_title')}</span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div className={`rounded-xl border p-3 ${dk ? 'bg-white/[0.03] border-white/[0.06]' : 'bg-slate-50 border-slate-200'}`}>
              <p className={`text-[10px] font-semibold mb-1.5 ${dk ? 'text-sky-400' : 'text-sky-600'}`}>{t('ref_physionet')}</p>
              <p className={`text-[10px] leading-relaxed ${subText}`}>
                Moody GB, Mark RG. The impact of the MIT-BIH Arrhythmia Database. IEEE Eng in Med and Biol 20(3):45-50 (2001).
              </p>
            </div>
            <div className={`rounded-xl border p-3 ${dk ? 'bg-white/[0.03] border-white/[0.06]' : 'bg-slate-50 border-slate-200'}`}>
              <p className={`text-[10px] font-semibold mb-1.5 ${dk ? 'text-emerald-400' : 'text-emerald-600'}`}>{t('ref_pinn_paper')}</p>
              <p className={`text-[10px] leading-relaxed ${subText}`}>
                Aliev RR, Panfilov AV. A simple two-variable model of cardiac excitation. Chaos, Solitons & Fractals. 1996;7(3):293-301.
              </p>
            </div>
          </div>
          <p className={`mt-4 text-[9px] text-center ${dk ? 'text-slate-600' : 'text-slate-400'}`}>{t('ref_disclaimer')}</p>
        </div>

        {/* Footer */}
        <div className={`text-center py-3 border-t ${divider}`}>
          <p className={`text-[10px] font-semibold ${secLabel}`}>Bioelectric PINN v1.0.4 Clinical Build</p>
          <p className={`text-[9px] mt-1 ${dk ? 'text-slate-700' : 'text-slate-300'}`}>Designed for Medical Professionals & Neural Researchers</p>
        </div>
      </div>
    </div>
  );
};

export default HelpManual;
