import React from 'react';
import { AlertTriangle, CheckCircle2, Info, Loader2 } from 'lucide-react';

const STATUS_STYLES = {
  normal: {
    icon: CheckCircle2,
    label: 'ปกติ / Normal',
    light: 'border-emerald-200 bg-emerald-50 text-emerald-800',
    dark: 'border-emerald-500/25 bg-emerald-500/[0.08] text-emerald-200',
  },
  review: {
    icon: AlertTriangle,
    label: 'ต้องตรวจสอบ / Review',
    light: 'border-amber-300 bg-amber-50 text-amber-800',
    dark: 'border-amber-500/25 bg-amber-500/[0.08] text-amber-200',
  },
  abnormal: {
    icon: AlertTriangle,
    label: 'ผิดปกติ / Review',
    light: 'border-rose-300 bg-rose-50 text-rose-800',
    dark: 'border-rose-500/25 bg-rose-500/[0.08] text-rose-200',
  },
  urgent: {
    icon: AlertTriangle,
    label: 'เร่งด่วน / Urgent',
    light: 'border-rose-300 bg-rose-50 text-rose-800',
    dark: 'border-rose-500/30 bg-rose-500/[0.10] text-rose-200',
  },
  unavailable: {
    icon: Info,
    label: 'ไม่มีข้อมูล / Unavailable',
    light: 'border-slate-200 bg-slate-50 text-slate-600',
    dark: 'border-white/[0.08] bg-white/[0.03] text-slate-300',
  },
  loading: {
    icon: Loader2,
    label: 'กำลังประมวลผล / Processing',
    light: 'border-sky-200 bg-sky-50 text-sky-700',
    dark: 'border-sky-500/25 bg-sky-500/[0.08] text-sky-200',
  },
};

export const ClinicalStatusBadge = ({ status = 'unavailable', dark = false, label }) => {
  const token = STATUS_STYLES[status] || STATUS_STYLES.unavailable;
  const Icon = token.icon;
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-bold ${dark ? token.dark : token.light}`}>
      <Icon size={13} className={status === 'loading' ? 'animate-spin' : ''} />
      {label || token.label}
    </span>
  );
};

export const ClinicalWarning = ({ children, dark = false, tone = 'review', className = '' }) => {
  const token = STATUS_STYLES[tone] || STATUS_STYLES.review;
  const Icon = token.icon;
  return (
    <div className={`flex gap-2.5 rounded-xl border px-3.5 py-3 text-[12px] font-semibold leading-relaxed ${dark ? token.dark : token.light} ${className}`} role="status">
      <Icon size={16} className="mt-0.5 shrink-0" />
      <div>{children}</div>
    </div>
  );
};

export const ClinicalSectionHeader = ({ eyebrow, title, description, actions, dark = false }) => (
  <div className="mb-3 flex flex-wrap items-start justify-between gap-3">
    <div className="min-w-0">
      {eyebrow && <p className={`mb-1 text-[11px] font-bold uppercase tracking-[0.12em] ${dark ? 'text-sky-300' : 'text-sky-700'}`}>{eyebrow}</p>}
      <h2 className={`text-lg font-black leading-tight ${dark ? 'text-white' : 'text-slate-900'}`}>{title}</h2>
      {description && <p className={`mt-1 text-[12px] leading-relaxed ${dark ? 'text-slate-400' : 'text-slate-500'}`}>{description}</p>}
    </div>
    {actions && <div className="flex shrink-0 flex-wrap items-center gap-2">{actions}</div>}
  </div>
);

export const ClinicalMetricCard = ({ label, value, unit, status = 'unavailable', dark = false, detail }) => {
  const token = STATUS_STYLES[status] || STATUS_STYLES.unavailable;
  return (
    <div className={`rounded-xl border p-3.5 ${dark ? token.dark : token.light}`}>
      <div className="flex items-start justify-between gap-2">
        <p className={`text-[11px] font-bold uppercase tracking-[0.08em] ${dark ? 'text-slate-300' : 'text-slate-600'}`}>{label}</p>
        <ClinicalStatusBadge status={status} dark={dark} />
      </div>
      <p className={`mt-2 text-2xl font-black leading-none ${dark ? 'text-white' : 'text-slate-950'}`}>
        {value ?? '—'}{unit && <span className={`ml-1.5 text-xs font-bold ${dark ? 'text-slate-400' : 'text-slate-500'}`}>{unit}</span>}
      </p>
      {detail && <p className={`mt-2 text-[11px] leading-relaxed ${dark ? 'text-slate-400' : 'text-slate-600'}`}>{detail}</p>}
    </div>
  );
};
