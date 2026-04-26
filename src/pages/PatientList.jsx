import React, { useState, useEffect } from 'react';
import { usePatient } from '../context/PatientContext';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { UserPlus, Search, User, CreditCard, Droplets, AlertTriangle, Phone, Calendar, ChevronRight } from 'lucide-react';

const PatientList = () => {
  const { patients, refreshPatients, addPatient, setSelectedPatient } = usePatient();
  const { token } = useAuth();
  const { t } = useLanguage();
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('basic'); // 'basic', 'clinical', 'contact'
  
  const [formData, setFormData] = useState({
    name: '',
    id_card: '',
    dob: '',
    gender: 'Male',
    blood_type: 'O',
    allergies: '',
    emergency_contact: '',
    case_type: 'General'
  });

  useEffect(() => {
    if (token) refreshPatients();
  }, [token]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const success = await addPatient({
        ...formData,
        age: calculateAge(formData.dob) // คำนวณอายุอัตโนมัติจากวันเกิด
    });
    if (success) {
      setIsModalOpen(false);
      setFormData({ name: '', id_card: '', dob: '', gender: 'Male', blood_type: 'O', allergies: '', emergency_contact: '', case_type: 'General' });
    }
  };

  const calculateAge = (dob) => {
    if (!dob) return 0;
    const birthDate = new Date(dob);
    const difference = Date.now() - birthDate.getTime();
    const ageDate = new Date(difference);
    return Math.abs(ageDate.getUTCFullYear() - 1970);
  };

  const filteredPatients = patients.filter(p => 
    p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.id_card?.includes(searchTerm)
  );

  return (
    <div className="p-4 md:p-10 font-sans min-h-screen bg-[var(--bg-main)] text-[var(--text-main)] transition-colors duration-300">
      <div className="max-w-[1400px] mx-auto">
        <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-10">
          <div>
            <h1 className="text-4xl font-black text-sky-500 tracking-tighter uppercase italic">{t('patient_db_title')}</h1>
            <p className="text-[var(--text-muted)] text-xs font-bold tracking-[0.2em] mt-2 uppercase">{t('patient_db_subtitle')}</p>
          </div>
          <div className="flex w-full md:w-auto gap-4">
            <div className="relative flex-1 md:w-80">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" size={18} />
              <input 
                type="text" 
                placeholder={t('search_placeholder')}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full bg-[var(--bg-card)] border border-[var(--border-color)] rounded-2xl py-4 pl-12 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500/50 transition-all shadow-sm"
              />
            </div>
            <button 
              onClick={() => setIsModalOpen(true)}
              className="bg-sky-500 hover:bg-sky-600 text-white p-4 rounded-2xl shadow-lg shadow-sky-500/20 transition-all active:scale-95 flex items-center gap-3 font-black text-xs uppercase tracking-widest"
            >
              <UserPlus size={20} />
              <span className="hidden md:inline">{t('register_patient')}</span>
            </button>
          </div>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {filteredPatients.map(p => (
            <div 
              key={p.id}
              onClick={() => setSelectedPatient(p)}
              className="bg-[var(--bg-card)] p-8 rounded-[3rem] border border-[var(--border-color)] hover:border-sky-500/50 transition-all cursor-pointer group shadow-sm hover:shadow-xl relative overflow-hidden"
            >
              <div className="absolute top-0 right-0 w-32 h-32 bg-sky-500/5 rounded-full -mr-16 -mt-16 group-hover:bg-sky-500/10 transition-colors" />
              <div className="flex items-center gap-6 mb-6">
                <div className="w-16 h-16 bg-sky-500/10 text-sky-500 rounded-3xl flex items-center justify-center font-black text-xl shadow-inner">
                  {p.name.charAt(0)}
                </div>
                <div>
                  <h3 className="text-xl font-black text-slate-800">{p.name}</h3>
                  <p className="text-[10px] font-black text-sky-500 uppercase tracking-widest mt-1">HN: {p.id_card?.substring(0,8) || 'GEN-001'}</p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <InfoItem label={t('label_dob')} value={`${p.age}y`} />
                <InfoItem label={t('label_blood')} value={p.blood_type || 'O+'} />
                <InfoItem label={t('label_priority')} value={p.case_type} />
                <div className="flex flex-col">
                  <span className="text-[8px] font-black text-[var(--text-muted)] uppercase tracking-widest">สถานะ</span>
                  <span className="text-[10px] font-bold text-emerald-500 uppercase mt-1">● {t('status_active')}</span>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Professional Registration Modal */}
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-300">
            <div className="bg-white w-full max-w-2xl rounded-[3.5rem] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300">
              <div className="bg-slate-50 p-10 border-b border-slate-100 flex justify-between items-center">
                <div>
                  <h2 className="text-3xl font-black text-slate-800 italic uppercase tracking-tighter">{t('modal_title')}</h2>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">{t('modal_subtitle')}</p>
                </div>
                <div className="flex gap-2">
                    <TabBtn active={activeTab === 'basic'} onClick={() => setActiveTab('basic')} label={t('tab_demographics')} icon={<User size={14}/>} />
                    <TabBtn active={activeTab === 'clinical'} onClick={() => setActiveTab('clinical')} label={t('tab_clinical')} icon={<Droplets size={14}/>} />
                </div>
              </div>

              <form onSubmit={handleSubmit} className="p-10 space-y-8">
                {activeTab === 'basic' ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <InputField label={t('label_fullname')} icon={<User size={16}/>} value={formData.name} onChange={v => setFormData({...formData, name: v})} placeholder="เช่น นายสมชาย ใจดี" required />
                    <InputField label={t('label_idcard')} icon={<CreditCard size={16}/>} value={formData.id_card} onChange={v => setFormData({...formData, id_card: v})} placeholder="เลขบัตร 13 หลัก" />
                    <InputField label={t('label_dob')} icon={<Calendar size={16}/>} type="date" value={formData.dob} onChange={v => setFormData({...formData, dob: v})} required />
                    <SelectField label={t('label_gender')} value={formData.gender} onChange={v => setFormData({...formData, gender: v})} options={['ชาย (Male)', 'หญิง (Female)', 'อื่นๆ']} />
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <SelectField label={t('label_blood')} value={formData.blood_type} onChange={v => setFormData({...formData, blood_type: v})} options={['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-']} />
                    <SelectField label={t('label_priority')} value={formData.case_type} onChange={v => setFormData({...formData, case_type: v})} options={['General', 'Emergency', 'Urgent', 'Referral']} />
                    <div className="md:col-span-2">
                        <TextAreaField label={t('label_allergies')} icon={<AlertTriangle size={16}/>} value={formData.allergies} onChange={v => setFormData({...formData, allergies: v})} placeholder="ระบุประวัติการแพ้ยาหรืออาการแพ้อื่นๆ..." />
                    </div>
                    <div className="md:col-span-2">
                        <InputField label={t('label_emergency')} icon={<Phone size={16}/>} value={formData.emergency_contact} onChange={v => setFormData({...formData, emergency_contact: v})} placeholder="ชื่อและเบอร์โทรผู้ติดต่อ" />
                    </div>
                  </div>
                )}

                <div className="flex justify-between items-center pt-8 border-t border-slate-100">
                  <button type="button" onClick={() => setIsModalOpen(false)} className="px-8 py-4 text-xs font-black uppercase text-slate-400 hover:text-slate-600 transition-colors tracking-widest">{t('btn_cancel')}</button>
                  <div className="flex gap-4">
                    {activeTab === 'basic' ? (
                        <button type="button" onClick={() => setActiveTab('clinical')} className="bg-slate-800 text-white px-10 py-4 rounded-2xl text-xs font-black uppercase tracking-widest flex items-center gap-2 shadow-xl shadow-slate-800/20 active:scale-95">{t('btn_next')} <ChevronRight size={16}/></button>
                    ) : (
                        <button type="submit" className="bg-sky-500 hover:bg-sky-600 text-white px-12 py-4 rounded-2xl text-xs font-black uppercase tracking-widest shadow-xl shadow-sky-500/20 transition-all active:scale-95">{t('btn_complete')}</button>
                    )}
                  </div>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

const InfoItem = ({ label, value }) => (
  <div className="flex flex-col">
    <span className="text-[8px] font-black text-[var(--text-muted)] uppercase tracking-widest">{label}</span>
    <span className="text-sm font-bold text-slate-700 mt-1">{value}</span>
  </div>
);

const TabBtn = ({ active, onClick, label, icon }) => (
    <button type="button" onClick={onClick} className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center gap-2 transition-all ${active ? 'bg-sky-500 text-white shadow-lg shadow-sky-500/20' : 'text-slate-400 hover:bg-slate-200'}`}>
        {icon} {label}
    </button>
);

const InputField = ({ label, icon, value, onChange, placeholder, type = "text", required = false }) => (
    <div className="space-y-2">
        <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-2 ml-1">
            {icon} {label} {required && <span className="text-rose-500">*</span>}
        </label>
        <input 
            type={type}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder={placeholder}
            required={required}
            className="w-full bg-slate-50 border border-slate-200 rounded-2xl py-4 px-5 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500/30 transition-all font-bold text-slate-700"
        />
    </div>
);

const SelectField = ({ label, value, onChange, options }) => (
    <div className="space-y-2">
        <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">{label}</label>
        <select 
            value={value}
            onChange={(e) => onChange(e.target.value)}
            className="w-full bg-slate-50 border border-slate-200 rounded-2xl py-4 px-5 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500/30 transition-all font-bold text-slate-700 appearance-none"
        >
            {options.map(opt => <option key={opt} value={opt}>{opt}</option>)}
        </select>
    </div>
);

const TextAreaField = ({ label, icon, value, onChange, placeholder }) => (
    <div className="space-y-2">
        <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-2 ml-1">
            {icon} {label}
        </label>
        <textarea 
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder={placeholder}
            rows={3}
            className="w-full bg-slate-50 border border-slate-200 rounded-2xl py-4 px-5 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500/30 transition-all font-bold text-slate-700 resize-none"
        />
    </div>
);

export default PatientList;
