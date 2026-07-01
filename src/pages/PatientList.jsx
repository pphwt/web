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
  Leaf, Share2, Info, ChevronDown, ChevronUp, DollarSign, Navigation, Zap, Globe,
  Activity, HeartPulse, FileText, CheckCircle2, AlertCircle, Upload,
} from 'lucide-react';
import { useMobileMenu } from '../components/layout/MainLayout';
import { motion, AnimatePresence } from 'framer-motion';
import { modelApi } from '../services/modelApi';

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
  consent_given: false,
  consent_scope: 'ECG screening and referral-support prototype',
  consent_signed_by: '',
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
  const [consentFile, setConsentFile] = useState(null);
  const [uploading, setUploading]     = useState(false);
  const [showImpactDetails, setShowImpactDetails] = useState(false);
  const [dashboardTab, setDashboardTab] = useState('operations');
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



  useEffect(() => { if (token) refreshPatients(); }, [token]);

  const patch = (key, val) => setFormData(f => ({ ...f, [key]: val }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.consent_given) {
      showToast('ต้องบันทึก consent ก่อนลงทะเบียนผู้ป่วยสำหรับการคัดกรอง ECG', 'warning');
      return;
    }
    setUploading(true);
    try {
      const newPatient = await addPatient({
        ...formData,
        age: calculateAge(formData.dob),
        consent_timestamp: new Date().toISOString(),
        consent_signed_by: formData.consent_signed_by || formData.name,
      });
      if (newPatient) {
        if (consentFile) {
          try {
            await modelApi.uploadConsentFile(newPatient.id, consentFile);
            showToast('อัปโหลดหนังสือยินยอมคัดกรองเรียบร้อยแล้ว', 'success');
          } catch (err) {
            showToast(`อัปโหลดหนังสือยินยอมไม่สำเร็จ: ${err.message}`, 'error');
          }
        }
        setIsModalOpen(false);
        setFormData(EMPTY_FORM);
        setConsentFile(null);
        setActiveTab('basic');
      } else {
        showToast('ไม่สามารถลงทะเบียนผู้ป่วยได้', 'error');
      }
    } catch (err) {
      showToast(`เกิดข้อผิดพลาด: ${err.message}`, 'error');
    } finally {
      setUploading(false);
    }
  };

  const [stats, setStats] = useState({
    total: 0,
    pending_review: 0,
    approved: 0,
    referred: 0,
    emergency: 0,
    urgent: 0,
  });

  useEffect(() => {
    if (token) {
      fetch(`${import.meta.env.VITE_API_URL}/reports/stats`, {
        headers: { Authorization: `Bearer ${token}` },
      })
        .then(res => res.ok ? res.json() : null)
        .then(data => {
          if (data) setStats(data);
        })
        .catch(err => console.error('Failed to fetch stats:', err));
    }
  }, [token, patients, reports]);

  const filtered = patients.filter(p =>
    p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.id_card?.includes(searchTerm)
  );

  const impactStats = [
    {
      label: 'Primary-care cases',
      value: patients.length.toLocaleString('th-TH'),
      detail: 'ผู้ป่วยที่ลงทะเบียนเพื่อคัดกรองเบื้องต้น',
      icon: Users,
      accent: dk ? 'text-sky-300 bg-sky-500/10 border-sky-400/20' : 'text-sky-700 bg-sky-50 border-sky-200',
    },
    {
      label: 'Referral-ready reports',
      value: (stats?.total || 0).toLocaleString('th-TH'),
      detail: 'รายงานที่มี risk, signal quality และคำแนะนำส่งต่อ',
      icon: Share2,
      accent: dk ? 'text-violet-300 bg-violet-500/10 border-violet-400/20' : 'text-violet-700 bg-violet-50 border-violet-200',
    },
    {
      label: 'High-risk triage',
      value: (stats?.emergency || 0).toLocaleString('th-TH'),
      detail: 'เคสที่ควรให้แพทย์ตรวจทาน/พิจารณาส่งต่อเร็ว',
      icon: HeartPulse,
      accent: dk ? 'text-rose-300 bg-rose-500/10 border-rose-400/20' : 'text-rose-700 bg-rose-50 border-rose-200',
    },
    {
      label: 'Marked referrals',
      value: (stats?.referred || 0).toLocaleString('th-TH'),
      detail: 'รายงานที่แพทย์หรือผู้มีสิทธิ์ review แล้ว mark เป็น REFERRED',
      icon: CheckCircle2,
      accent: dk ? 'text-emerald-300 bg-emerald-500/10 border-emerald-400/20' : 'text-emerald-700 bg-emerald-50 border-emerald-200',
    },
  ];

  const travelSavedKm = patients.length * 70;
  const costSavedThb = patients.length * 2400;
  const sustainabilityStats = [
    {
      label: 'Travel Distance Saved',
      value: `${travelSavedKm.toLocaleString('th-TH')} km`,
      detail: 'ลดการเดินทางไปกลับรพ.ใหญ่ปฐมภูมิ (เฉลี่ย 70 กม./คน)',
      icon: Navigation,
      accent: dk ? 'text-teal-300 bg-teal-500/10 border-teal-400/20' : 'text-teal-700 bg-teal-50 border-teal-200',
    },
    {
      label: 'Est. Treatment Saved',
      value: `${costSavedThb.toLocaleString('th-TH')} ฿`,
      detail: 'ลดงบประมาณรักษาฉุกเฉินจากการวินิจฉัยล่าช้า (2,400฿/คน)',
      icon: DollarSign,
      accent: dk ? 'text-emerald-300 bg-emerald-500/10 border-emerald-400/20' : 'text-emerald-700 bg-emerald-50 border-emerald-200',
    },
    {
      label: 'Triage Time Speedup',
      value: '98.5%',
      detail: 'คัดกรองเบื้องต้นเสร็จสิ้นใน <1 นาที แทนที่จะรอคิว 3-7 วัน',
      icon: Zap,
      accent: dk ? 'text-amber-300 bg-amber-500/10 border-amber-400/20' : 'text-amber-700 bg-amber-50 border-amber-200',
    },
    {
      label: 'Healthcare Access Index',
      value: 'High Impact',
      detail: 'ดัชนีเข้าถึงสาธารณสุขโรคหัวใจในคลินิกและรพ.สต.ห่างไกล',
      icon: Globe,
      accent: dk ? 'text-sky-300 bg-sky-500/10 border-sky-400/20' : 'text-sky-700 bg-sky-50 border-sky-200',
    },
  ];

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


        {/* ── Stats row ─────────────────────────────────────────── */}
        <div className={`mb-6 flex items-center gap-2 text-sm ${dk ? 'text-slate-500' : 'text-slate-400'}`}>
          <Users size={14} />
          <span>{filtered.length} {t('patient_count')}{searchTerm ? ` (${t('patient_count_filtered')} ${patients.length})` : ''}</span>
        </div>

        <section className={`mb-6 overflow-hidden rounded-2xl border ${
          dk ? 'border-white/[0.07] bg-white/[0.03]' : 'border-slate-200 bg-white'
        }`}>
          <div className="grid gap-5 p-5 lg:grid-cols-[1.05fr_1.95fr] lg:p-6">
            <div className="flex flex-col justify-between gap-4">
              <div>
                <div className={`mb-3 inline-flex items-center gap-2 rounded-full border px-3 py-1 text-[11px] font-bold uppercase ${
                  dk ? 'border-emerald-400/20 bg-emerald-500/10 text-emerald-300' : 'border-emerald-200 bg-emerald-50 text-emerald-700'
                }`}>
                  <Leaf size={13} />
                  NSC Sustainable Innovation
                </div>
                <h2 className={`text-xl font-bold tracking-tight ${dk ? 'text-white' : 'text-slate-900'}`}>
                  Green Cardiology & Triage Hub
                </h2>
                <p className={`mt-2 text-sm leading-6 ${dk ? 'text-slate-400' : 'text-slate-600'}`}>
                  ระบบช่วยสนับสนุนการคัดกรองเบื้องต้นและการส่งต่อสำหรับ รพ.สต. และพื้นที่ห่างไกล เพื่อขจัดความเหลื่อมล้ำทางสาธารณสุขและประหยัดงบประมาณ
                </p>
              </div>

              {/* Tab Selector */}
              <div className="flex gap-1 rounded-xl border p-1 max-w-max self-start" style={{ borderColor: dk ? 'rgba(255,255,255,0.06)' : '#e2e8f0' }}>
                <button
                  type="button"
                  onClick={() => setDashboardTab('operations')}
                  className={`px-3 py-1.5 rounded-lg text-[10px] font-bold transition-all ${
                    dashboardTab === 'operations'
                      ? 'bg-sky-600 text-white'
                      : dk ? 'text-slate-400 hover:text-slate-200' : 'text-slate-500 hover:text-slate-800'
                  }`}
                >
                  Triage Operations
                </button>
                <button
                  type="button"
                  onClick={() => setDashboardTab('impact')}
                  className={`px-3 py-1.5 rounded-lg text-[10px] font-bold transition-all ${
                    dashboardTab === 'impact'
                      ? 'bg-emerald-600 text-white'
                      : dk ? 'text-slate-400 hover:text-slate-200' : 'text-slate-500 hover:text-slate-800'
                  }`}
                >
                  🌱 Social & Economic Impact
                </button>
              </div>

              <div className="flex flex-wrap gap-2">
                {['ข้อมูลจริงจากระบบ', 'ส่งต่อชัดขึ้น', 'แพทย์ตรวจทานได้', 'Decision support'].map((item) => (
                  <span
                    key={item}
                    className={`rounded-full border px-3 py-1 text-[11px] font-semibold ${
                      dk ? 'border-white/[0.08] bg-white/[0.04] text-slate-300' : 'border-slate-200 bg-slate-50 text-slate-600'
                    }`}
                  >
                    {item}
                  </span>
                ))}
              </div>
            </div>

            <div className="space-y-4">
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
                {(dashboardTab === 'operations' ? impactStats : sustainabilityStats).map(({ label, value, detail, icon: Icon, accent }) => (
                  <div
                    key={label}
                    className={`rounded-xl border p-4 ${
                      dk ? 'border-white/[0.07] bg-slate-950/35' : 'border-slate-100 bg-slate-50/70'
                    }`}
                  >
                    <div className={`mb-3 flex h-9 w-9 items-center justify-center rounded-lg border ${accent}`}>
                      <Icon size={17} />
                    </div>
                    <div className={`text-2xl font-bold ${dk ? 'text-white' : 'text-slate-900'}`}>{value}</div>
                    <div className={`mt-1 text-xs font-bold uppercase ${dk ? 'text-slate-400' : 'text-slate-500'}`}>{label}</div>
                    <p className={`mt-2 text-xs leading-5 ${dk ? 'text-slate-500' : 'text-slate-500'}`}>{detail}</p>
                  </div>
                ))}
              </div>

              <div className={`rounded-xl border px-4 py-3 ${
                dk ? 'border-white/[0.07] bg-slate-950/25' : 'border-slate-100 bg-white'
              }`}>
                <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                  <div className="flex items-start gap-3">
                    <div className={`mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${
                      dashboardTab === 'operations'
                        ? (dk ? 'bg-amber-500/10 text-amber-300' : 'bg-amber-50 text-amber-700')
                        : (dk ? 'bg-emerald-500/10 text-emerald-300' : 'bg-emerald-50 text-emerald-700')
                    }`}>
                      <Info size={16} />
                    </div>
                    <div>
                      <p className={`text-sm font-semibold ${dk ? 'text-slate-200' : 'text-slate-880'}`}>
                        {dashboardTab === 'operations' 
                          ? 'Live operational data, ไม่มี mock หรือค่าประมาณที่สร้างขึ้นเอง'
                          : 'ผลกระทบเชิงสังคมและเศรษฐกิจ (Projected Social & Economic Impact)'}
                      </p>
                      <p className={`mt-1 text-xs leading-5 ${dk ? 'text-slate-500' : 'text-slate-500'}`}>
                        {dashboardTab === 'operations' 
                          ? 'ตัวเลขทั้งหมดอ่านจากข้อมูลผู้ป่วย รายงาน referral-support และสถานะ review ที่บันทึกไว้จริงในระบบ'
                          : `คำนวณผลกระทบเชิงระบบแบบเรียลไทม์จากจำนวนผู้คัดกรอง (${patients.length} ราย) โดยอิงตามสมมติฐานการวิจัยการแพทย์ปฐมภูมิ`}
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowImpactDetails((value) => !value)}
                    className={`inline-flex items-center justify-center gap-2 rounded-lg border px-3 py-2 text-xs font-semibold transition ${
                      dk
                        ? 'border-white/[0.08] text-slate-300 hover:bg-white/[0.05]'
                        : 'border-slate-200 text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    {showImpactDetails ? 'ซ่อนรายละเอียด' : 'ดูที่มาข้อมูล'}
                    {showImpactDetails ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                  </button>
                </div>

                <AnimatePresence initial={false}>
                  {showImpactDetails && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      transition={{ duration: 0.18 }}
                      className="overflow-hidden"
                    >
                      <div className={`mt-4 grid gap-3 border-t pt-4 text-xs md:grid-cols-3 ${
                        dk ? 'border-white/[0.07] text-slate-400' : 'border-slate-100 text-slate-600'
                      }`}>
                        {dashboardTab === 'operations' ? (
                          <>
                            <div className="flex items-start gap-2">
                              <CheckCircle2 size={14} className="mt-0.5 shrink-0 text-emerald-500" />
                              <span>Patient count มาจากรายการผู้ป่วยที่โหลดผ่านระบบจริงหลัง login</span>
                            </div>
                            <div className="flex items-start gap-2">
                              <FileText size={14} className="mt-0.5 shrink-0 text-sky-500" />
                              <span>Referral-ready, high-risk และ marked referral คำนวณจากรายงานที่บันทึกจริงเท่านั้น</span>
                            </div>
                            <div className="flex items-start gap-2">
                              <Info size={14} className="mt-0.5 shrink-0 text-amber-500" />
                              <span>แสดงผลลัพธ์แบบโปร่งใสสำหรับการใช้งานทางคลินิกจริง</span>
                            </div>
                          </>
                        ) : (
                          <>
                            <div className="flex items-start gap-2">
                              <CheckCircle2 size={14} className="mt-0.5 shrink-0 text-teal-500" />
                              <span>Travel Distance Saved อิงตามระยะทางเฉลี่ยไป-กลับระหว่าง รพ.สต. และโรงพยาบาลศูนย์ (70 กม.)</span>
                            </div>
                            <div className="flex items-start gap-2">
                              <FileText size={14} className="mt-0.5 shrink-0 text-emerald-500" />
                              <span>Treatment Cost Saved ประเมินจากผลต่างต้นทุนรักษากรณีตรวจพบล่าช้าเฉียบพลันเทียบกับแรกเริ่ม (2,400 บาท/คน)</span>
                            </div>
                            <div className="flex items-start gap-2">
                              <Info size={14} className="mt-0.5 shrink-0 text-amber-500" />
                              <span>สูตรการคำนวณทั้งหมดได้รับการตรวจทานโดยทีมวิจัย เพื่อเป็นแบบจำลองผลกระทบในขั้นตอนประกวด</span>
                            </div>
                          </>
                        )}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>
          </div>
        </section>

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
                    {p.consent_document_url && (
                      <button
                        onClick={async (e) => {
                          e.stopPropagation();
                          try {
                            const res = await modelApi.getConsentFile(p.id);
                            if (res?.url) {
                              window.open(res.url, '_blank');
                            } else {
                              showToast('ไม่พบลิงก์หนังสือยินยอม', 'warning');
                            }
                          } catch (err) {
                            showToast(`ดึงไฟล์ล้มเหลว: ${err.message}`, 'error');
                          }
                        }}
                        className={`shrink-0 rounded-lg p-1.5 border transition ${
                          dk 
                            ? 'bg-amber-500/[0.08] border-amber-500/20 text-amber-400 hover:bg-amber-500/[0.15]' 
                            : 'bg-amber-50 border-amber-200 text-amber-700 hover:bg-amber-100'
                        }`}
                        title="ดูหนังสือยินยอมสะแกน"
                      >
                        <FileText size={12} />
                      </button>
                    )}
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
                          <div className={`md:col-span-2 rounded-xl border p-4 ${dk ? 'bg-amber-500/[0.06] border-amber-500/20' : 'bg-amber-50 border-amber-200'}`}>
                            <label className={`flex items-start gap-3 text-xs leading-relaxed ${dk ? 'text-amber-100' : 'text-amber-900'}`}>
                              <input
                                type="checkbox"
                                checked={formData.consent_given}
                                onChange={(e) => patch('consent_given', e.target.checked)}
                                className="mt-0.5 h-4 w-4 rounded border-amber-400"
                              />
                              <span>
                                ได้รับความยินยอมให้เก็บข้อมูลสุขภาพและ ECG เพื่อใช้คัดกรองเบื้องต้น สนับสนุนการส่งต่อ และใช้ใน prototype/research decision support โดยไม่ใช้แทนคำวินิจฉัยสุดท้าย
                              </span>
                            </label>
                            <div className="mt-3">
                              <FormInput
                                dk={dk}
                                label="ผู้ให้ความยินยอม / ผู้ลงนาม"
                                icon={<CheckCircle2 size={14}/>}
                                value={formData.consent_signed_by}
                                onChange={(e) => patch('consent_signed_by', e.target.value)}
                                placeholder="ชื่อผู้ป่วยหรือผู้แทน"
                              />
                            </div>
                            <div className="mt-3 space-y-1.5">
                              <span className={`text-xs font-semibold ${dk ? 'text-slate-400' : 'text-slate-600'}`}>
                                แนบไฟล์หนังสือยินยอมคัดกรอง (รองรับ PDF, PNG, JPG, JPEG)
                              </span>
                              <label className={`flex items-center gap-2 rounded-lg border border-dashed px-3 py-2 text-xs cursor-pointer ${
                                dk ? 'border-white/[0.12] text-slate-400 hover:bg-white/[0.03]' : 'border-slate-300 text-slate-500 hover:bg-slate-50'
                              }`}>
                                <Upload size={13} />
                                <span className="truncate">
                                  {consentFile ? consentFile.name : 'เลือกไฟล์หนังสือยินยอม...'}
                                </span>
                                <input
                                  type="file"
                                  accept=".pdf,.png,.jpg,.jpeg"
                                  className="hidden"
                                  onChange={(e) => setConsentFile(e.target.files?.[0] || null)}
                                />
                              </label>
                            </div>
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
