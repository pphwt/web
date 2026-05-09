import React, { useState, useEffect } from 'react';
import { usePatient } from '../context/PatientContext';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { useTheme } from '../context/ThemeContext';
import {
  UserPlus, Search, User, CreditCard, Droplets,
  AlertTriangle, Phone, Calendar, ChevronRight, X, Users, Menu,
} from 'lucide-react';
import { useMobileMenu } from '../components/layout/MainLayout';
import { motion, AnimatePresence } from 'framer-motion';

// ─── helpers ──────────────────────────────────────────────────────────────────

const calculateAge = (dob) => {
  if (!dob) return 0;
  const diff = Date.now() - new Date(dob).getTime();
  return Math.abs(new Date(diff).getUTCFullYear() - 1970);
};

const BLOOD_TYPES  = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];
const CASE_TYPES   = ['General', 'Emergency', 'Urgent', 'Referral'];
const GENDER_OPTS  = ['ชาย (Male)', 'หญิง (Female)', 'อื่นๆ'];

const EMPTY_FORM = {
  name: '', id_card: '', dob: '', gender: 'Male',
  blood_type: 'O', allergies: '', emergency_contact: '', case_type: 'General',
};

// ─── sub-components ───────────────────────────────────────────────────────────

const FormInput = ({ label, icon, required, dk, ...props }) => (
  <div className="space-y-1.5">
    <label className={`flex items-center gap-1.5 text-xs font-semibold ${dk ? 'text-slate-400' : 'text-slate-600'}`}>
      {icon && <span className="opacity-60">{icon}</span>}
      {label}
      {required && <span className="text-rose-500 ml-0.5">*</span>}
    </label>
    <input
      {...props}
      required={required}
      className={`w-full rounded-xl border px-4 py-3 text-sm outline-none transition focus:ring-2 ${
        dk
          ? 'bg-white/[0.04] border-white/[0.08] text-white placeholder:text-slate-600 focus:border-sky-500/50 focus:ring-sky-500/10'
          : 'bg-slate-50 border-slate-200 text-slate-900 placeholder:text-slate-400 focus:border-sky-500 focus:ring-sky-500/15'
      }`}
    />
  </div>
);

const FormSelect = ({ label, dk, children, ...props }) => (
  <div className="space-y-1.5">
    <label className={`block text-xs font-semibold ${dk ? 'text-slate-400' : 'text-slate-600'}`}>{label}</label>
    <select
      {...props}
      className={`w-full rounded-xl border px-4 py-3 text-sm outline-none transition appearance-none focus:ring-2 ${
        dk
          ? 'bg-white/[0.04] border-white/[0.08] text-white focus:border-sky-500/50 focus:ring-sky-500/10'
          : 'bg-slate-50 border-slate-200 text-slate-900 focus:border-sky-500 focus:ring-sky-500/15'
      }`}
    >
      {children}
    </select>
  </div>
);

const FormTextarea = ({ label, icon, dk, ...props }) => (
  <div className="space-y-1.5">
    <label className={`flex items-center gap-1.5 text-xs font-semibold ${dk ? 'text-slate-400' : 'text-slate-600'}`}>
      {icon && <span className="opacity-60">{icon}</span>}
      {label}
    </label>
    <textarea
      {...props}
      rows={3}
      className={`w-full rounded-xl border px-4 py-3 text-sm outline-none transition resize-none focus:ring-2 ${
        dk
          ? 'bg-white/[0.04] border-white/[0.08] text-white placeholder:text-slate-600 focus:border-sky-500/50 focus:ring-sky-500/10'
          : 'bg-slate-50 border-slate-200 text-slate-900 placeholder:text-slate-400 focus:border-sky-500 focus:ring-sky-500/15'
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
  const openMenu = useMobileMenu();

  const [searchTerm, setSearchTerm]   = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [activeTab, setActiveTab]     = useState('basic');
  const [formData, setFormData]       = useState(EMPTY_FORM);

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
            {filtered.map((p) => (
              <motion.div
                key={p.id}
                layout
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.2 }}
                onClick={() => setSelectedPatient(p)}
                className={`group cursor-pointer rounded-2xl border p-5 transition-all duration-200 hover:shadow-lg ${cardBg}`}
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
                  <span className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold border ${
                    dk ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                       : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                  }`}>
                    ● {t('status_active')}
                  </span>
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
              </motion.div>
            ))}
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
                  <div className="flex items-center gap-3">
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
                          <FormInput dk={dk} label={t('label_idcard')} icon={<CreditCard size={14}/>} value={formData.id_card} onChange={(e) => patch('id_card', e.target.value)} placeholder="เลขบัตร 13 หลัก" />
                          <FormInput dk={dk} label={t('label_dob')} icon={<Calendar size={14}/>} type="date" value={formData.dob} onChange={(e) => patch('dob', e.target.value)} required />
                          <FormSelect dk={dk} label={t('label_gender')} value={formData.gender} onChange={(e) => patch('gender', e.target.value)}>
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
                          <FormSelect dk={dk} label={t('label_blood')} value={formData.blood_type} onChange={(e) => patch('blood_type', e.target.value)}>
                            {BLOOD_TYPES.map(o => <option key={o} value={o}>{o}</option>)}
                          </FormSelect>
                          <FormSelect dk={dk} label={t('label_priority')} value={formData.case_type} onChange={(e) => patch('case_type', e.target.value)}>
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
