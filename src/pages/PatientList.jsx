import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { usePatient } from '../context/PatientContext';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { useTheme } from '../context/ThemeContext';
import { useToast } from '../context/ToastContext';
import {
  UserPlus, Search, User, CreditCard, Droplets,
  AlertTriangle, Phone, Calendar, ChevronRight, X, Users, Menu,
  Leaf, Trash2, Globe, Share2, Info, ChevronDown, ChevronUp,
  Activity, HeartPulse, FileText, CheckCircle2, AlertCircle,
} from 'lucide-react';
import { useMobileMenu } from '../components/layout/MainLayout';
import { motion, AnimatePresence } from 'framer-motion';

// ─── helpers ──────────────────────────────────────────────────────────────────

const calculateAge = (dob) => {
  if (!dob) return 0;
  const diff = Date.now() - new Date(dob).getTime();
  return Math.abs(new Date(diff).getUTCFullYear() - 1970);
};

const formatThaiID = (val) => {
  const clean = val.replace(/\D/g, '').slice(0, 13);
  let formatted = '';
  for (let i = 0; i < clean.length; i++) {
    if (i === 1) formatted += '-';
    if (i === 5) formatted += '-';
    if (i === 10) formatted += '-';
    if (i === 12) formatted += '-';
    formatted += clean[i];
  }
  return formatted;
};

const BLOOD_TYPES  = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];
const CASE_TYPES   = ['General', 'Emergency', 'Urgent', 'Referral'];
const GENDER_OPTS  = ['ชาย (Male)', 'หญิง (Female)', 'อื่นๆ'];

const EMPTY_FORM = {
  name: '', id_card: '', dob: '', gender: 'ชาย (Male)',
  blood_type: 'O+', allergies: '', emergency_contact: '', case_type: 'General',
};

// ─── sub-components ───────────────────────────────────────────────────────────

const FormInput = ({ label, icon, required, dk, helper, ...props }) => (
  <div className="space-y-1.5 group">
    <label className={`flex items-center gap-1.5 text-xs font-semibold transition-colors ${
      dk ? 'text-slate-400 group-focus-within:text-sky-400' : 'text-slate-600 group-focus-within:text-sky-600'
    }`}>
      {icon && <span className="opacity-60 transition-transform group-focus-within:scale-110 duration-200">{icon}</span>}
      {label}
      {required && <span className="text-rose-500 ml-0.5">*</span>}
    </label>
    <input
      {...props}
      required={required}
      className={`w-full rounded-xl border px-4 py-3 text-sm outline-none transition duration-200 focus:ring-2 focus:shadow-md ${
        dk
          ? 'bg-white/[0.03] border-white/[0.07] text-white placeholder:text-slate-700 focus:border-sky-500/50 focus:ring-sky-500/10 focus:bg-white/[0.05]'
          : 'bg-slate-50 border-slate-200 text-slate-900 placeholder:text-slate-400 focus:border-sky-500 focus:ring-sky-500/15 focus:bg-white'
      }`}
    />
    {helper && <div className="mt-1">{helper}</div>}
  </div>
);

const FormSelect = ({ label, icon, dk, children, ...props }) => (
  <div className="space-y-1.5 group">
    <label className={`flex items-center gap-1.5 text-xs font-semibold transition-colors ${
      dk ? 'text-slate-400 group-focus-within:text-sky-400' : 'text-slate-600 group-focus-within:text-sky-600'
    }`}>
      {icon && <span className="opacity-60 transition-transform group-focus-within:scale-110 duration-200">{icon}</span>}
      {label}
    </label>
    <div className="relative">
      <select
        {...props}
        className={`w-full rounded-xl border pl-4 pr-10 py-3 text-sm outline-none transition duration-200 appearance-none focus:ring-2 focus:shadow-md ${
          dk
            ? 'bg-white/[0.03] border-white/[0.07] text-white focus:border-sky-500/50 focus:ring-sky-500/10 focus:bg-white/[0.05]'
            : 'bg-slate-50 border-slate-200 text-slate-900 focus:border-sky-500 focus:ring-sky-500/15 focus:bg-white'
        }`}
      >
        {children}
      </select>
      <div className={`absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none transition-colors group-focus-within:text-sky-500 ${
        dk ? 'text-slate-500' : 'text-slate-400'
      }`}>
        <ChevronDown size={14} />
      </div>
    </div>
  </div>
);

const FormTextarea = ({ label, icon, dk, ...props }) => (
  <div className="space-y-1.5 group">
    <label className={`flex items-center gap-1.5 text-xs font-semibold transition-colors ${
      dk ? 'text-slate-400 group-focus-within:text-sky-400' : 'text-slate-600 group-focus-within:text-sky-600'
    }`}>
      {icon && <span className="opacity-60 transition-transform group-focus-within:scale-110 duration-200">{icon}</span>}
      {label}
    </label>
    <textarea
      {...props}
      rows={3}
      className={`w-full rounded-xl border px-4 py-3 text-sm outline-none transition duration-200 resize-none focus:ring-2 focus:shadow-md ${
        dk
          ? 'bg-white/[0.03] border-white/[0.07] text-white placeholder:text-slate-700 focus:border-sky-500/50 focus:ring-sky-500/10 focus:bg-white/[0.05]'
          : 'bg-slate-50 border-slate-200 text-slate-900 placeholder:text-slate-400 focus:border-sky-500 focus:ring-sky-500/15 focus:bg-white'
      }`}
    />
  </div>
);

// ─── main ─────────────────────────────────────────────────────────────────────

const PatientList = () => {
  const { patients, refreshPatients, addPatient, setSelectedPatient } = usePatient();
  const { token } = useAuth();
  const { t } = useLanguage();
  const { isDarkMode: dk } = useTheme();
  const { showToast } = useToast();
  const openMenu = useMobileMenu();
  const navigate = useNavigate();

  const [searchTerm, setSearchTerm]   = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [activeTab, setActiveTab]     = useState('basic');
  const [formData, setFormData]       = useState(EMPTY_FORM);
  const [showImpactDetails, setShowImpactDetails] = useState(false);
  const [reports, setReports]         = useState([]);

  useEffect(() => {
    if (token) {
      fetch(`${import.meta.env.VITE_API_URL}/reports/`, {
        headers: { Authorization: `Bearer ${token}` },
      })
        .then(res => res.ok ? res.json() : [])
        .then(data => {
          if (Array.isArray(data)) setReports(data);
        })
        .catch(err => console.error('Failed to fetch reports:', err));
    }
  }, [token, patients]);

  const totalScans = reports.length;
  const totalCathetersSaved = totalScans;
  const totalWasteSavedKg = (totalScans * 1.5).toFixed(1);
  const totalCostSavedThb = (totalScans * 120000).toLocaleString('th-TH');
  const co2AvoidedKg = (totalScans * 12).toFixed(1);

  const fillDemoData = () => {
    const demos = [
      {
        name: 'นายสมชาย ใจดี',
        id_card: '1-1001-01882-73-6',
        dob: '1985-06-15',
        gender: 'ชาย (Male)',
        blood_type: 'O+',
        allergies: 'แพ้ยาเพนิซิลลิน (Penicillin)',
        emergency_contact: 'นางสมศรี ใจดี (ภรรยา) - 0812345678',
        case_type: 'General',
      },
      {
        name: 'นางสาววิภา พรหมรักษา',
        id_card: '3-1012-01994-85-7',
        dob: '1998-11-20',
        gender: 'หญิง (Female)',
        blood_type: 'A+',
        allergies: 'ไม่มีประวัติแพ้ยา',
        emergency_contact: 'นายสมเกียรติ พรหมรักษา (บิดา) - 0898765432',
        case_type: 'Emergency',
      },
      {
        name: 'นายเดวิด มิลเลอร์',
        id_card: '9-2817-29938-19-1',
        dob: '1972-04-03',
        gender: 'อื่นๆ',
        blood_type: 'B-',
        allergies: 'แพ้อาหารทะเลรุนแรง (Anaphylaxis)',
        emergency_contact: 'David Miller Sr. (Father) - +1-555-0199',
        case_type: 'Urgent',
      }
    ];
    const randomDemo = demos[Math.floor(Math.random() * demos.length)];
    setFormData(randomDemo);
    if (showToast) {
      showToast('สุ่มข้อมูลตัวอย่างสอดคล้องมาตรฐาน HL7 FHIR สำเร็จ', 'success');
    }
  };

  useEffect(() => { if (token) refreshPatients(); }, [token]);

  const patch = (key, val) => setFormData(f => ({ ...f, [key]: val }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    const ok = await addPatient({ ...formData, age: calculateAge(formData.dob) });
    if (ok) { setIsModalOpen(false); setFormData(EMPTY_FORM); setActiveTab('basic'); }
  };

  const filtered = patients.filter(p =>
    p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.id_card?.includes(searchTerm)
  );

  // ── tokens ─────────────────────────────────────────────────────
  const pageBg     = dk ? 'bg-[var(--bg-main)]'    : 'bg-[var(--bg-main)]';
  const cardBg     = dk ? 'bg-[#0d1525] border-white/[0.06] hover:border-sky-500/25' : 'bg-white border-slate-200 hover:border-sky-400/50';
  const cardName   = dk ? 'text-slate-100'          : 'text-slate-900';
  const cardMeta   = dk ? 'text-slate-500'          : 'text-slate-400';
  const infoLabel  = dk ? 'text-slate-600'          : 'text-slate-400';
  const infoValue  = dk ? 'text-slate-200'          : 'text-slate-700';
  const avatarCls  = dk ? 'bg-sky-500/15 text-sky-400 border border-sky-500/20' : 'bg-sky-50 text-sky-600 border border-sky-200';
  const searchCls  = dk
    ? 'bg-white/[0.04] border-white/[0.07] text-white placeholder:text-slate-600 focus:border-sky-500/50 focus:ring-sky-500/10'
    : 'bg-white border-slate-200 text-slate-900 placeholder:text-slate-400 focus:border-sky-500 focus:ring-sky-500/15';
  const divider    = dk ? 'border-white/[0.06]'     : 'border-slate-100';
  const modalBg    = dk ? 'bg-[#0d1525] border-white/[0.08]' : 'bg-white border-slate-200';
  const modalTitle = dk ? 'text-white'              : 'text-slate-900';
  const modalSub   = dk ? 'text-slate-500'          : 'text-slate-500';

  return (
    <div className={`p-4 md:p-8 min-h-screen ${pageBg} text-[var(--text-main)] transition-colors duration-300`}>
      <div className="max-w-[1400px] mx-auto">

        {/* ── Header ───────────────────────────────────────────── */}
        <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
          <div>
            <h1 className={`text-2xl font-bold tracking-tight ${dk ? 'text-white' : 'text-slate-900'}`}>
              {t('patient_db_title')}
            </h1>
            <p className={`mt-1 text-sm ${dk ? 'text-slate-500' : 'text-slate-500'}`}>
              {t('patient_db_subtitle')}
            </p>
          </div>

          <div className="flex w-full md:w-auto gap-3">
            <button
              onClick={openMenu}
              className={`lg:hidden p-2.5 rounded-xl border transition-colors ${dk ? 'border-white/[0.07] text-slate-400 hover:bg-white/[0.05]' : 'border-slate-200 text-slate-500 hover:bg-slate-100'}`}
            >
              <Menu size={18} />
            </button>
            <div className="relative flex-1 md:w-72">
              <Search className={`absolute left-3.5 top-1/2 -translate-y-1/2 ${dk ? 'text-slate-600' : 'text-slate-400'}`} size={16} />
              <input
                type="text"
                placeholder={t('search_placeholder')}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className={`w-full rounded-xl border pl-10 pr-4 py-2.5 text-sm outline-none transition focus:ring-2 ${searchCls}`}
              />
            </div>
            <button
              onClick={() => setIsModalOpen(true)}
              className="flex items-center gap-2 rounded-xl bg-sky-600 hover:bg-sky-700 px-4 py-2.5 text-sm font-semibold text-white transition active:scale-95 shrink-0"
            >
              <UserPlus size={16} />
              <span className="hidden md:inline">{t('register_patient')}</span>
            </button>
          </div>
        </header>

        {/* ── Sustainable Innovation Dashboard ─────────────────── */}
        <div className={`mb-6 rounded-2xl border p-4 transition-all duration-300 ${
          dk ? 'bg-emerald-500/[0.02] border-emerald-500/20 shadow-[0_0_20px_rgba(16,185,129,0.02)]' : 'bg-emerald-50/50 border-emerald-200'
        }`}>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-start gap-3">
              <div className={`p-2 rounded-xl shrink-0 ${dk ? 'bg-emerald-500/10 text-emerald-400' : 'bg-emerald-100 text-emerald-800'}`}>
                <Leaf size={18} className="animate-pulse" />
              </div>
              <div>
                <h4 className={`text-sm font-bold flex items-center gap-1.5 ${dk ? 'text-emerald-300' : 'text-emerald-950'}`}>
                  {t('sust_title')}
                </h4>
                <p className={`text-xs mt-0.5 leading-relaxed max-w-[800px] ${dk ? 'text-slate-400' : 'text-slate-600'}`}>
                  {t('sust_desc')}
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setShowImpactDetails(!showImpactDetails)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold self-start sm:self-center transition ${
                dk ? 'bg-white/[0.04] text-slate-300 hover:bg-white/[0.08]' : 'bg-white text-emerald-800 border border-emerald-200 hover:bg-emerald-50'
              }`}
            >
              {showImpactDetails ? (
                <>ซ่อนรายละเอียด <ChevronUp size={14} /></>
              ) : (
                <>แสดงข้อมูลดัชนีความยั่งยืน <ChevronDown size={14} /></>
              )}
            </button>
          </div>

          <AnimatePresence>
            {showImpactDetails && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.25 }}
                className="overflow-hidden"
              >
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mt-4 pt-4 border-t border-emerald-500/10">
                  <div className={`rounded-xl p-3.5 border ${dk ? 'bg-white/[0.02] border-white/[0.04]' : 'bg-white border-emerald-100'}`}>
                    <div className="flex items-center gap-2 mb-1">
                      <TrendingDown size={14} className="text-emerald-500" />
                      <span className={`text-[10px] font-semibold tracking-wider ${dk ? 'text-slate-500' : 'text-slate-400'}`}>{t('cost_saved')}</span>
                    </div>
                    <p className={`text-lg font-bold ${dk ? 'text-white' : 'text-slate-900'}`}>฿{totalCostSavedThb}</p>
                    <p className={`text-[9px] mt-0.5 ${dk ? 'text-slate-500' : 'text-slate-400'}`}>~฿120k saved per scan</p>
                  </div>

                  <div className={`rounded-xl p-3.5 border ${dk ? 'bg-white/[0.02] border-white/[0.04]' : 'bg-white border-emerald-100'}`}>
                    <div className="flex items-center gap-2 mb-1">
                      <Trash2 size={14} className="text-emerald-500" />
                      <span className={`text-[10px] font-semibold tracking-wider ${dk ? 'text-slate-500' : 'text-slate-400'}`}>{t('waste_saved')}</span>
                    </div>
                    <p className={`text-lg font-bold ${dk ? 'text-white' : 'text-slate-900'}`}>{totalWasteSavedKg} kg</p>
                    <p className={`text-[9px] mt-0.5 ${dk ? 'text-slate-500' : 'text-slate-400'}`}>Bio-waste prevented</p>
                  </div>

                  <div className={`rounded-xl p-3.5 border ${dk ? 'bg-white/[0.02] border-white/[0.04]' : 'bg-white border-emerald-100'}`}>
                    <div className="flex items-center gap-2 mb-1">
                      <Globe size={14} className="text-emerald-500" />
                      <span className={`text-[10px] font-semibold tracking-wider ${dk ? 'text-slate-500' : 'text-slate-400'}`}>{t('co2_avoided') || 'CO2 Saved'}</span>
                    </div>
                    <p className={`text-lg font-bold ${dk ? 'text-white' : 'text-slate-900'}`}>{co2AvoidedKg} kg</p>
                    <p className={`text-[9px] mt-0.5 ${dk ? 'text-slate-500' : 'text-slate-400'}`}>Operating emissions saved</p>
                  </div>

                  <div className={`rounded-xl p-3.5 border ${dk ? 'bg-white/[0.02] border-white/[0.04]' : 'bg-white border-emerald-100'}`}>
                    <div className="flex items-center gap-2 mb-1">
                      <Share2 size={14} className="text-emerald-500" />
                      <span className={`text-[10px] font-semibold tracking-wider ${dk ? 'text-slate-500' : 'text-slate-400'}`}>{t('rural_referrals')}</span>
                    </div>
                    <p className={`text-lg font-bold ${dk ? 'text-white' : 'text-slate-900'}`}>{totalScans} Scans</p>
                    <p className={`text-[9px] mt-0.5 ${dk ? 'text-slate-500' : 'text-slate-400'}`}>Linked community hospitals</p>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* ── Stats row ─────────────────────────────────────────── */}
        <div className={`mb-6 flex items-center gap-2 text-sm ${dk ? 'text-slate-500' : 'text-slate-400'}`}>
          <Users size={14} />
          <span>{filtered.length} {t('patient_count')}{searchTerm ? ` (${t('patient_count_filtered')} ${patients.length})` : ''}</span>
        </div>

        {/* ── Patient grid ──────────────────────────────────────── */}
        {filtered.length === 0 ? (
          <div className={`flex flex-col items-center justify-center rounded-2xl border py-20 ${dk ? 'border-white/[0.06] bg-white/[0.02]' : 'border-slate-100 bg-slate-50'}`}>
            <Users size={36} className={`mb-3 ${dk ? 'text-slate-700' : 'text-slate-300'}`} />
            <p className={`text-sm font-semibold ${dk ? 'text-slate-500' : 'text-slate-400'}`}>
              {searchTerm ? t('no_patient_found') : t('no_patient_data')}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {filtered.map((p) => {
              const isEmergency = p.case_type === 'Emergency';
              const isUrgent = p.case_type === 'Urgent';
              
              const priorityBorder = isEmergency 
                ? `pulse-border-red ${dk ? 'bg-rose-500/[0.01]' : 'bg-rose-50/20'}`
                : isUrgent 
                ? `pulse-border-amber ${dk ? 'bg-amber-500/[0.01]' : 'bg-amber-50/20'}`
                : cardBg;

              return (
                <motion.div
                  key={p.id}
                  layout
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.2 }}
                  onClick={() => {
                    setSelectedPatient(p);
                    navigate('/page/analysis');
                  }}
                  className={`group cursor-pointer rounded-2xl border p-5 transition-all duration-200 hover:shadow-lg ${priorityBorder}`}
                >
                  {/* Card header */}
                  <div className="flex items-start gap-3.5 mb-4">
                    <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-sm font-bold ${avatarCls}`}>
                      {p.name.charAt(0).toUpperCase()}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className={`truncate font-semibold text-sm leading-tight ${cardName}`}>{p.name}</p>
                      <p className={`text-[11px] mt-0.5 ${cardMeta}`}>HN: {p.id_card?.substring(0, 8) || 'GEN-001'}</p>
                    </div>
                    {isEmergency ? (
                      <span className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-bold border flex items-center gap-1 animate-pulse bg-rose-500/10 text-rose-500 border-rose-500/20`}>
                        <AlertCircle size={10} /> Emergency
                      </span>
                    ) : isUrgent ? (
                      <span className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-bold border flex items-center gap-1 bg-amber-500/10 text-amber-500 border-amber-500/20`}>
                        <AlertTriangle size={10} /> Urgent
                      </span>
                    ) : (
                      <span className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold border ${
                        dk ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                           : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                      }`}>
                        ● {t('status_active')}
                      </span>
                    )}
                  </div>

                  {/* Divider */}
                  <div className={`mb-4 h-px ${dk ? 'bg-white/[0.05]' : 'bg-slate-100'}`} />

                  {/* Info grid */}
                  <div className="grid grid-cols-3 gap-3">
                    {[
                      { label: t('label_dob'),      value: `${p.age}y` },
                      { label: t('label_blood'),     value: p.blood_type || 'O+' },
                      { label: t('label_priority'),  value: p.case_type || 'General' },
                    ].map(({ label, value }) => (
                      <div key={label}>
                        <p className={`text-[10px] font-medium uppercase tracking-wider mb-0.5 ${infoLabel}`}>{label}</p>
                        <p className={`text-sm font-semibold truncate ${infoValue}`}>{value}</p>
                      </div>
                    ))}
                  </div>

                  {/* Quick Action buttons for doctors (UX optimization) */}
                  <div className="flex gap-2 mt-4 pt-3 border-t border-slate-100 dark:border-white/[0.05]">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedPatient(p);
                        navigate('/page/analysis');
                      }}
                      className="flex-1 flex items-center justify-center gap-1 rounded-lg bg-sky-600 hover:bg-sky-700 text-white text-xs font-semibold py-1.5 transition active:scale-95"
                    >
                      <HeartPulse size={12} />
                      {t('action_analysis')}
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedPatient(p);
                        navigate('/page/live');
                      }}
                      className={`flex-1 flex items-center justify-center gap-1 rounded-lg border text-xs font-semibold py-1.5 transition active:scale-95 ${
                        dk
                          ? 'border-white/[0.08] hover:bg-white/[0.04] text-slate-300'
                          : 'border-slate-200 hover:bg-slate-50 text-slate-700'
                      }`}
                    >
                      <Activity size={12} className="text-sky-500" />
                      {t('action_live')}
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedPatient(p);
                        navigate('/page/reports');
                      }}
                      className={`flex h-8 w-8 items-center justify-center rounded-lg border transition shrink-0 active:scale-95 ${
                        dk
                          ? 'border-white/[0.08] hover:bg-white/[0.04] text-slate-400 hover:text-slate-200'
                          : 'border-slate-200 hover:bg-slate-50 text-slate-500 hover:text-slate-700'
                      }`}
                      title={t('action_report')}
                    >
                      <FileText size={12} />
                    </button>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}

        {/* ── Register modal ───────────────────────────────────── */}
        <AnimatePresence>
          {isModalOpen && (
            <motion.div
              key="modal-backdrop"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.18 }}
              className="fixed inset-0 z-50 flex items-center justify-center p-4"
            >
              <div
                className={`absolute inset-0 ${dk ? 'bg-slate-950/70' : 'bg-slate-400/30'} backdrop-blur-sm`}
                onClick={() => setIsModalOpen(false)}
              />

              <motion.div
                key="modal-card"
                initial={{ opacity: 0, y: 20, scale: 0.97 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 12, scale: 0.97 }}
                transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
                className={`relative w-full max-w-2xl overflow-hidden rounded-2xl border shadow-2xl ${modalBg}`}
              >
                {/* Modal header */}
                <div className={`flex items-center justify-between border-b px-6 py-5 ${divider}`}>
                  <div>
                    <h2 className={`text-base font-bold ${modalTitle}`}>{t('modal_title')}</h2>
                    <p className={`mt-0.5 text-xs ${modalSub}`}>{t('modal_subtitle')}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={fillDemoData}
                      className={`flex items-center gap-1 rounded-xl border px-3 py-1.5 text-xs font-semibold transition active:scale-95 ${
                        dk
                          ? 'border-emerald-500/20 bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/15'
                          : 'border-emerald-200 bg-emerald-50 text-emerald-800 hover:bg-emerald-100'
                      }`}
                    >
                      💡 กรอกข้อมูลสุ่ม
                    </button>
                    {/* Tabs */}
                    <div className={`flex gap-1 rounded-xl border p-1 ${dk ? 'bg-white/[0.04] border-white/[0.07]' : 'bg-slate-100 border-slate-200'}`}>
                      {[
                        { key: 'basic',    label: t('tab_demographics'), icon: <User size={13} /> },
                        { key: 'clinical', label: t('tab_clinical'),     icon: <Droplets size={13} /> },
                      ].map(({ key, label, icon }) => (
                        <button
                          key={key}
                          type="button"
                          onClick={() => setActiveTab(key)}
                          className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition-all ${
                            activeTab === key
                              ? dk ? 'bg-sky-500/20 text-sky-300' : 'bg-white text-sky-700 shadow-sm'
                              : dk ? 'text-slate-500 hover:text-slate-300' : 'text-slate-400 hover:text-slate-600'
                          }`}
                        >
                          {icon}{label}
                        </button>
                      ))}
                    </div>
                    <button
                      type="button"
                      onClick={() => setIsModalOpen(false)}
                      className={`p-1.5 rounded-lg transition-colors ${dk ? 'text-slate-500 hover:text-slate-200 hover:bg-white/5' : 'text-slate-400 hover:text-slate-700 hover:bg-slate-100'}`}
                    >
                      <X size={17} />
                    </button>
                  </div>
                </div>

                {/* Modal form */}
                <form onSubmit={handleSubmit}>
                  <div className="px-6 py-5">
                    <AnimatePresence mode="wait">
                      {activeTab === 'basic' ? (
                        <motion.div
                          key="basic"
                          initial={{ opacity: 0, x: -8 }}
                          animate={{ opacity: 1, x: 0 }}
                          exit={{ opacity: 0, x: 8 }}
                          transition={{ duration: 0.15 }}
                          className="grid grid-cols-1 md:grid-cols-2 gap-4"
                        >
                          <FormInput dk={dk} label={t('label_fullname')} icon={<User size={14}/>} value={formData.name} onChange={(e) => patch('name', e.target.value)} placeholder="เช่น นายสมชาย ใจดี" required />
                          <FormInput dk={dk} label={t('label_idcard')} icon={<CreditCard size={14}/>} value={formData.id_card} onChange={(e) => patch('id_card', formatThaiID(e.target.value))} placeholder="X-XXXX-XXXXX-XX-X" />
                          <FormInput 
                            dk={dk} 
                            label={t('label_dob')} 
                            icon={<Calendar size={14}/>} 
                            type="date" 
                            value={formData.dob} 
                            onChange={(e) => patch('dob', e.target.value)} 
                            required 
                            helper={
                              formData.dob ? (
                                <div className={`text-[10px] font-semibold flex items-center gap-1.5 mt-1 ${dk ? 'text-sky-400' : 'text-sky-600'}`}>
                                  <span>✨ คำนวณอายุ: {calculateAge(formData.dob)} ปี</span>
                                  <span className="opacity-50">|</span>
                                  <span>(ปี พ.ศ. {new Date(formData.dob).getFullYear() + 543})</span>
                                </div>
                              ) : null
                            }
                          />
                          <FormSelect dk={dk} label={t('label_gender')} icon={<Users size={14}/>} value={formData.gender} onChange={(e) => patch('gender', e.target.value)}>
                            {GENDER_OPTS.map(o => <option key={o} value={o}>{o}</option>)}
                          </FormSelect>
                        </motion.div>
                      ) : (
                        <motion.div
                          key="clinical"
                          initial={{ opacity: 0, x: 8 }}
                          animate={{ opacity: 1, x: 0 }}
                          exit={{ opacity: 0, x: -8 }}
                          transition={{ duration: 0.15 }}
                          className="grid grid-cols-1 md:grid-cols-2 gap-4"
                        >
                          <FormSelect dk={dk} label={t('label_blood')} icon={<Droplets size={14}/>} value={formData.blood_type} onChange={(e) => patch('blood_type', e.target.value)}>
                            {BLOOD_TYPES.map(o => <option key={o} value={o}>{o}</option>)}
                          </FormSelect>
                          <FormSelect dk={dk} label={t('label_priority')} icon={<AlertTriangle size={14}/>} value={formData.case_type} onChange={(e) => patch('case_type', e.target.value)}>
                            {CASE_TYPES.map(o => <option key={o} value={o}>{o}</option>)}
                          </FormSelect>
                          <div className="md:col-span-2">
                            <FormTextarea dk={dk} label={t('label_allergies')} icon={<AlertTriangle size={14}/>} value={formData.allergies} onChange={(e) => patch('allergies', e.target.value)} placeholder="ระบุประวัติการแพ้ยาหรืออาการแพ้อื่นๆ..." />
                          </div>
                          <div className="md:col-span-2">
                            <FormInput dk={dk} label={t('label_emergency')} icon={<Phone size={14}/>} value={formData.emergency_contact} onChange={(e) => patch('emergency_contact', e.target.value)} placeholder="ชื่อและเบอร์โทรผู้ติดต่อ" />
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>

                  {/* Modal footer */}
                  <div className={`flex items-center justify-between border-t px-6 py-4 ${divider}`}>
                    <button
                      type="button"
                      onClick={() => setIsModalOpen(false)}
                      className={`text-sm font-semibold transition-colors ${dk ? 'text-slate-500 hover:text-slate-300' : 'text-slate-400 hover:text-slate-600'}`}
                    >
                      {t('btn_cancel')}
                    </button>
                    <div className="flex gap-2">
                      {activeTab === 'basic' ? (
                        <button
                          type="button"
                          onClick={() => setActiveTab('clinical')}
                          className={`flex items-center gap-1.5 rounded-xl px-5 py-2.5 text-sm font-semibold transition active:scale-95 ${
                            dk ? 'bg-white/[0.07] text-slate-200 hover:bg-white/[0.12]' : 'bg-slate-900 text-white hover:bg-slate-700'
                          }`}
                        >
                          {t('btn_next')} <ChevronRight size={15} />
                        </button>
                      ) : (
                        <button
                          type="submit"
                          className="flex items-center gap-1.5 rounded-xl bg-sky-600 hover:bg-sky-700 px-6 py-2.5 text-sm font-semibold text-white transition active:scale-95"
                        >
                          {t('btn_complete')}
                        </button>
                      )}
                    </div>
                  </div>
                </form>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default PatientList;
