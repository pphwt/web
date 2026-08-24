import { useEffect, useState } from 'react';
import { CheckCircle2, RefreshCw, ShieldAlert, ShieldCheck } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';
import { modelApi } from '../services/modelApi';

export default function Audit() {
  const { isDarkMode: dk } = useTheme();
  const [data, setData] = useState(null);
  const [integrity, setIntegrity] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const surface = dk ? 'border-white/[0.06] bg-[#0d1525]' : 'border-slate-200 bg-white';
  const text = dk ? 'text-white' : 'text-slate-900';
  const sub = dk ? 'text-slate-400' : 'text-slate-500';

  const load = () => {
    setLoading(true); setError('');
    Promise.all([modelApi.auditEvents(), modelApi.auditIntegrity()])
      .then(([events, chain]) => { setData(events); setIntegrity(chain); })
      .catch((err) => setError(err.message || 'Audit data unavailable'))
      .finally(() => setLoading(false));
  };
  useEffect(() => { load(); }, []);

  return (
    <div className="min-h-full bg-[var(--bg-main)] px-3 py-4 text-[var(--text-main)] sm:px-5 lg:px-7">
      <div className="mx-auto max-w-[1600px] space-y-5">
        <header className={`rounded-2xl border p-5 ${surface}`}><div className="flex flex-wrap items-center justify-between gap-3"><div className="flex items-start gap-3"><ShieldCheck className={dk ? 'text-emerald-300' : 'text-emerald-700'} /><div><h1 className={`text-xl font-black ${text}`}>Audit & Security</h1><p className={`mt-1 text-xs ${sub}`}>Facility-scoped clinical activity with append-only hash-chain verification.</p></div></div><button type="button" onClick={load} disabled={loading} className={`inline-flex items-center gap-2 rounded-xl border px-3 py-2 text-[10px] font-bold ${dk ? 'border-white/[0.08] text-slate-300' : 'border-slate-200 text-slate-700'}`}><RefreshCw size={13} className={loading ? 'animate-spin' : ''} /> Refresh</button></div></header>
        {error && <div className="rounded-xl border border-amber-300 bg-amber-50 p-3 text-xs text-amber-800"><ShieldAlert size={14} className="mr-2 inline" />{error}</div>}
        <section className={`rounded-2xl border p-4 ${surface}`}><div className="flex flex-wrap items-center justify-between gap-3"><div><h2 className={`text-sm font-black ${text}`}>Chain integrity</h2><p className={`mt-1 text-[10px] ${sub}`}>Only events visible in your facility scope are checked.</p></div><span className={`rounded-full border px-3 py-1 text-[10px] font-black ${integrity?.verified ? 'border-emerald-300 bg-emerald-50 text-emerald-700' : 'border-amber-300 bg-amber-50 text-amber-700'}`}>{integrity ? (integrity.verified ? 'VERIFIED' : 'REVIEW REQUIRED') : '—'}</span></div><div className={`mt-3 grid grid-cols-2 gap-3 text-[10px] sm:grid-cols-4 ${sub}`}><div>Scope: <b className={text}>{integrity?.scope || '—'}</b></div><div>Checked: <b className={text}>{integrity?.checked_events ?? '—'}</b></div><div>Failures: <b className={text}>{integrity?.failures?.length ?? '—'}</b></div><div>Events: <b className={text}>{data?.count ?? '—'}</b></div></div></section>
        <section className={`overflow-hidden rounded-2xl border ${surface}`}><div className={`border-b px-4 py-3 text-[10px] font-black uppercase tracking-wider ${dk ? 'border-white/[0.06] text-slate-400' : 'border-slate-100 text-slate-500'}`}>Recent events</div><div className="divide-y divide-slate-200/60 dark:divide-white/[0.06]">{(data?.events || []).map((event) => <div key={event.id || `${event.created_at}-${event.action}`} className="grid gap-1 px-4 py-3 text-[10px] sm:grid-cols-[150px_1fr_150px] sm:items-center"><div className={sub}>{event.created_at || '—'}</div><div><p className={`font-black ${text}`}>{event.action}</p><p className={sub}>{event.actor || 'system'} · patient scope {event.patient_id || 'none'}</p></div><div className={`font-mono ${sub}`}>{event.event_hash ? `${event.event_hash.slice(0, 12)}…` : 'legacy event'}</div></div>)}{!loading && !(data?.events || []).length && <div className={`p-6 text-center text-xs ${sub}`}><CheckCircle2 className="mr-1 inline text-emerald-500" size={14} />No visible audit events.</div>}</div></section>
      </div>
    </div>
  );
}
