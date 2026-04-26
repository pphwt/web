import React from 'react';
import { BookOpen, Activity, Zap, Brain, Database, ShieldCheck, Heart, Info, CheckCircle2, AlertTriangle } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';

const HelpManual = () => {
  const { t } = useLanguage();

  return (
    <div className="p-10 font-sans h-full min-h-screen bg-[var(--bg-main)] flex flex-col text-[var(--text-main)] transition-colors duration-300">
      <div className="max-w-[1200px] w-full mx-auto space-y-16">
        <header className="border-b border-[var(--border-color)] pb-12">
            <div className="flex items-center gap-4 mb-6">
                <div className="p-3 bg-sky-500 rounded-2xl text-white shadow-lg">
                    <BookOpen size={28} />
                </div>
                <h1 className="text-5xl font-black tracking-tighter uppercase italic text-sky-500">{t('manual_title')}</h1>
            </div>
            <p className="text-[var(--text-muted)] text-sm font-bold tracking-[0.2em] uppercase">{t('manual_subtitle')}</p>
        </header>

        <section className="space-y-24">
            {/* Module 1: Live Monitoring */}
            <ManualSection 
                icon={<Activity className="text-rose-500" />}
                title={t('man_mod1_title')}
                description={t('man_mod1_desc')}
            >
                <div className="grid grid-cols-2 gap-10">
                    <InstructionCard title={t('man_instr1_title')}>
                        <p>{t('man_instr1_body')}</p>
                        <div className="mt-4 space-y-2 opacity-70 text-xs italic">
                            <p>{t('man_instr1_list').split('•')[1] && `• ${t('man_instr1_list').split('•')[1]}`}</p>
                            <p>{t('man_instr1_list').split('•')[2] && `• ${t('man_instr1_list').split('•')[2]}`}</p>
                        </div>
                    </InstructionCard>
                    <InstructionCard title={t('man_instr2_title')}>
                        <p>{t('man_instr2_body')}</p>
                        <p className="mt-2 text-sky-500 font-bold underline">{t('man_instr2_standard')}</p>
                    </InstructionCard>
                </div>
            </ManualSection>

            {/* Module 2: Clinical Diagnostic Hub */}
            <ManualSection 
                icon={<Database className="text-sky-500" />}
                title={t('man_mod2_title')}
                description={t('man_mod2_desc')}
            >
                <div className="space-y-8">
                    <div className="bg-[var(--bg-card)] p-10 rounded-[2.5rem] border border-[var(--border-color)] shadow-xl">
                        <h4 className="text-xs font-black uppercase tracking-widest text-sky-500 mb-6 flex items-center gap-2">
                             <Zap size={14} fill="currentColor" /> {t('man_vital_title')}
                        </h4>
                        <div className="grid grid-cols-5 gap-6">
                            <VitalGuide label={t('man_vital_pr')} range="120-200ms" meaning={t('man_vital_pr_desc')} />
                            <VitalGuide label={t('man_vital_qrs')} range="< 120ms" meaning={t('man_vital_qrs_desc')} />
                            <VitalGuide label={t('man_vital_qtc')} range="< 450ms" meaning={t('man_vital_qtc_desc')} />
                            <VitalGuide label={t('man_vital_hr')} range="60-100 BPM" meaning={t('man_vital_hr_desc')} />
                            <VitalGuide label={t('man_vital_axis')} range="-30° to +90°" meaning={t('man_vital_axis_desc')} />
                        </div>
                    </div>
                    <div className="grid grid-cols-2 gap-8">
                        <InstructionCard title={t('man_sandbox_logic_title')}>
                            <p>{t('man_sandbox_logic_body')}</p>
                        </InstructionCard>
                        <InstructionCard title={t('man_sandbox_map_title')}>
                            <p>{t('man_sandbox_map_body')}</p>
                        </InstructionCard>
                    </div>
                </div>
            </ManualSection>

            {/* Module 3: Neural Lab */}
            <ManualSection 
                icon={<FlaskIcon className="text-emerald-500" />}
                title={t('man_mod3_title')}
                description={t('man_mod3_desc')}
            >
                <div className="bg-[var(--bg-card)] p-8 rounded-3xl border border-[var(--border-color)]">
                    <div className="grid grid-cols-3 gap-8">
                        <ParamGuide name={t('man_param_a_title')} impact={t('man_param_a_desc')} />
                        <ParamGuide name={t('man_param_k_title')} impact={t('man_param_k_desc')} />
                        <ParamGuide name={t('man_param_d_title')} impact={t('man_param_d_desc')} />
                    </div>
                    <p className="mt-8 text-[10px] text-[var(--text-muted)] italic text-center uppercase tracking-widest">
                        {t('man_lab_tip')}
                    </p>
                </div>
            </ManualSection>

            {/* References Section */}
            <div className="pt-20 border-t border-[var(--border-color)]">
                <h3 className="text-xs font-black uppercase tracking-widest text-[var(--text-muted)] mb-8 flex items-center gap-2">
                    <Info size={14} /> {t('ref_title')}
                </h3>
                <div className="grid grid-cols-2 gap-8">
                    <div className="bg-[var(--bg-card)]/50 p-6 rounded-2xl border border-[var(--border-color)]">
                        <h4 className="text-[10px] font-black text-sky-500 uppercase mb-2">{t('ref_physionet')}</h4>
                        <p className="text-[10px] leading-relaxed opacity-60">
                            Moody GB, Mark RG. The impact of the MIT-BIH Arrhythmia Database. IEEE Eng in Med and Biol 20(3):45-50 (May-June 2001). (PMID: 11446209)
                        </p>
                    </div>
                    <div className="bg-[var(--bg-card)]/50 p-6 rounded-2xl border border-[var(--border-color)]">
                        <h4 className="text-[10px] font-black text-emerald-500 uppercase mb-2">{t('ref_pinn_paper')}</h4>
                        <p className="text-[10px] leading-relaxed opacity-60">
                            Aliev RR, Panfilov AV. A simple two-variable model of cardiac excitation. Chaos, Solitons & Fractals. 1996;7(3):293-301.
                        </p>
                    </div>
                </div>
                <p className="mt-8 text-[9px] text-center italic opacity-40">{t('ref_disclaimer')}</p>
            </div>
        </section>

        <footer className="pt-20 border-t border-[var(--border-color)] opacity-40 text-center">
            <p className="text-[10px] font-black uppercase tracking-[0.5em]">Bioelectric PINN v1.0.4 Clinical Build</p>
            <p className="text-[9px] mt-2 italic">Designed for Medical Professionals & Neural Researchers</p>
        </footer>
      </div>
    </div>
  );
};

const ManualSection = ({ icon, title, description, children }) => (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-8 duration-700">
        <div className="flex items-start gap-6">
            <div className="p-4 bg-[var(--bg-card)] rounded-2xl border border-[var(--border-color)] shadow-md">
                {icon}
            </div>
            <div>
                <h2 className="text-3xl font-black tracking-tight text-[var(--text-main)] mb-2 italic">{title}</h2>
                <p className="text-[var(--text-muted)] text-sm max-w-2xl leading-relaxed">{description}</p>
            </div>
        </div>
        <div className="pl-20">
            {children}
        </div>
    </div>
);

const InstructionCard = ({ title, children }) => (
    <div className="bg-[var(--bg-card)] p-10 rounded-3xl border border-[var(--border-color)] shadow-sm hover:border-sky-500/30 transition-all">
        <h4 className="text-[10px] font-black uppercase tracking-widest text-sky-500 mb-6">{title}</h4>
        <div className="text-sm text-[var(--text-main)] leading-relaxed opacity-90">
            {children}
        </div>
    </div>
);

const VitalGuide = ({ label, range, meaning }) => (
    <div className="p-4 bg-[var(--bg-main)] rounded-2xl border border-[var(--border-color)] text-center">
        <span className="text-[9px] font-black text-sky-500 uppercase tracking-widest block mb-2">{label}</span>
        <span className="text-xs font-black text-[var(--text-main)] block mb-1">{range}</span>
        <span className="text-[8px] text-[var(--text-muted)] leading-tight">{meaning}</span>
    </div>
);

const ParamGuide = ({ name, impact }) => (
    <div className="space-y-2">
        <h5 className="text-[10px] font-black text-emerald-500 uppercase tracking-widest">{name}</h5>
        <p className="text-[11px] text-[var(--text-muted)] leading-relaxed italic">"{impact}"</p>
    </div>
);

const FlaskIcon = ({ className }) => (
    <svg className={`w-6 h-6 ${className}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.022.547l-2.387 2.387a2 2 0 000 2.828l.707.707a2 2 0 002.828 0l2.387-2.387zM14.5 9V5a2 2 0 00-2-2h-1a2 2 0 00-2 2v4m5 0a2 2 0 00-2-2h-1a2 2 0 00-2 2v0a2 2 0 002 2h1a2 2 0 002-2v0z" />
    </svg>
);

export default HelpManual;
