import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Activity, Users, ArrowRight, Search, Plus } from 'lucide-react';
import { usePatient } from '../context/PatientContext';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';

const PatientList = () => {
  const [patients, setPatients] = useState([]);
  const [loading, setLoading] = useState(true);
  const { setSelectedPatient } = usePatient();
  const { token } = useAuth();
  const { t } = useLanguage();
  const navigate = useNavigate();

  useEffect(() => {
    if (token) fetchPatients();
  }, [token]);

  const fetchPatients = async () => {
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/patients/`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (response.status === 401) {
          // Handle unauthorized (redirect to login or clear state)
          return setPatients([]);
      }

      const data = await response.json();
      if (Array.isArray(data)) {
        setPatients(data);
      } else {
        setPatients([]);
      }
    } catch (error) {
      console.error('Error fetching patients:', error);
      setPatients([]);
    } finally {
      setLoading(false);
    }
  };

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newPatient, setNewPatient] = useState({ name: '', age: '', case_type: 'General' });

  const handleAddPatient = async (e) => {
    e.preventDefault();
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/patients/`, {
        method: 'POST',
        headers: { 
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}` 
        },
        body: JSON.stringify(newPatient)
      });
      if (response.ok) {
        setIsModalOpen(false);
        fetchPatients();
      }
    } catch (err) {
      console.error("Failed to add patient");
    }
  };

  return (
    <div className="p-10 bg-[var(--bg-main)] min-h-screen font-sans text-[var(--text-main)] transition-colors duration-300">
      <div className="max-w-7xl mx-auto">
        <header className="mb-12 flex justify-between items-end">
            <div>
                <h1 className="text-4xl font-black text-sky-500 tracking-tighter uppercase italic">{t('dir_title')}</h1>
                <p className="text-[var(--text-muted)] text-[10px] font-bold tracking-[0.2em] mt-2 uppercase">{t('dir_subtitle')}</p>
            </div>
            <div className="flex gap-4">
                <button 
                    onClick={() => setIsModalOpen(true)}
                    className="bg-sky-500 hover:bg-sky-600 text-white px-6 py-3 rounded-2xl font-black text-xs uppercase tracking-widest transition-all flex items-center gap-2 shadow-lg"
                >
                    <Plus className="w-4 h-4" /> {t('add_patient')}
                </button>
            </div>
        </header>

        {/* Add Patient Modal */}
        {isModalOpen && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
                <div className="bg-[var(--bg-card)] border border-[var(--border-color)] p-10 rounded-[3rem] w-full max-w-md shadow-2xl animate-in zoom-in duration-300">
                    <h2 className="text-2xl font-black text-[var(--text-main)] mb-8 uppercase italic tracking-tighter">{t('new_subject')}</h2>
                    <form onSubmit={handleAddPatient} className="space-y-6">
                        <div>
                            <label className="text-[10px] font-black text-[var(--text-muted)] uppercase tracking-widest mb-2 block">{t('full_name')}</label>
                            <input 
                                type="text" required
                                className="w-full bg-[var(--bg-main)] border border-[var(--border-color)] rounded-2xl px-6 py-4 text-[var(--text-main)] focus:border-sky-500 outline-none transition-all"
                                onChange={(e) => setNewPatient({...newPatient, name: e.target.value})}
                            />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="text-[10px] font-black text-[var(--text-muted)] uppercase tracking-widest mb-2 block">{t('age')}</label>
                                <input 
                                    type="number" required
                                    className="w-full bg-[var(--bg-main)] border border-[var(--border-color)] rounded-2xl px-6 py-4 text-[var(--text-main)] focus:border-sky-500 outline-none transition-all"
                                    onChange={(e) => setNewPatient({...newPatient, age: e.target.value})}
                                />
                            </div>
                            <div>
                                <label className="text-[10px] font-black text-[var(--text-muted)] uppercase tracking-widest mb-2 block">{t('case_type')}</label>
                                <select 
                                    className="w-full bg-[var(--bg-main)] border border-[var(--border-color)] rounded-2xl px-6 py-4 text-[var(--text-main)] focus:border-sky-500 outline-none transition-all"
                                    onChange={(e) => setNewPatient({...newPatient, case_type: e.target.value})}
                                >
                                    <option value="General">General</option>
                                    <option value="Arrhythmia">Arrhythmia</option>
                                    <option value="Ischemia">Ischemia</option>
                                </select>
                            </div>
                        </div>
                        <div className="flex gap-4 mt-10">
                            <button type="button" onClick={() => setIsModalOpen(false)} className="flex-1 py-4 text-[var(--text-muted)] font-bold uppercase text-xs tracking-widest">{t('cancel')}</button>
                            <button type="submit" className="flex-1 py-4 bg-sky-500 text-white font-black rounded-2xl uppercase text-xs tracking-widest hover:bg-sky-600 transition-all">{t('initialize')}</button>
                        </div>
                    </form>
                </div>
            </div>
        )}

        {loading ? (
          <div className="flex justify-center items-center h-64">
            <div className="w-12 h-12 border-4 border-sky-500/30 border-t-sky-500 rounded-full animate-spin" />
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {patients.map((patient) => (
              <div
                key={patient.id}
                onClick={() => {
                  setSelectedPatient(patient);
                  navigate('/live');
                }}
                className="bg-[var(--bg-card)] border border-[var(--border-color)] p-8 rounded-[2.5rem] cursor-pointer transition-all duration-500 hover:-translate-y-2 group relative overflow-hidden shadow-lg hover:shadow-2xl"
              >
                <div className="absolute top-0 right-0 p-8 opacity-0 group-hover:opacity-10 transition-opacity">
                    <Activity className="w-24 h-24 text-sky-500" />
                </div>
                
                <div className="flex items-start justify-between mb-8">
                  <div className="w-16 h-16 bg-gradient-to-br from-sky-500 to-indigo-600 rounded-3xl shadow-lg flex items-center justify-center text-white font-black text-2xl">
                      {patient.name.charAt(0)}
                  </div>
                  <div className="text-right">
                      <span className="text-[9px] font-black text-[var(--text-muted)] uppercase tracking-widest block mb-1">Status</span>
                      <span className="text-emerald-500 text-xs font-bold px-3 py-1 bg-emerald-500/10 rounded-full border border-emerald-500/20 uppercase tracking-tighter">{t('status_live')}</span>
                  </div>
                </div>

                <h3 className="text-2xl font-bold text-[var(--text-main)] mb-2 tracking-tight">{patient.name}</h3>
                <div className="flex gap-4 mb-8">
                    <div className="flex flex-col">
                        <span className="text-[9px] text-[var(--text-muted)] font-bold uppercase tracking-widest">{t('age')}</span>
                        <span className="text-[var(--text-main)] font-bold">{patient.age}y</span>
                    </div>
                    <div className="h-8 w-px bg-[var(--border-color)] mx-2" />
                    <div className="flex flex-col">
                        <span className="text-[9px] text-[var(--text-muted)] font-bold uppercase tracking-widest">Case ID</span>
                        <span className="text-sky-500 font-bold">{patient.id.substring(0, 5).toUpperCase()}</span>
                    </div>
                </div>

                <div className="pt-6 border-t border-[var(--border-color)] flex justify-between items-center">
                    <span className="text-[10px] text-[var(--text-muted)] font-mono">HASH: {patient.id.substring(0, 8)}</span>
                    <div className="p-2 bg-sky-500 text-white rounded-xl opacity-0 group-hover:opacity-100 transition-all duration-300 translate-x-4 group-hover:translate-x-0 shadow-lg">
                        <ArrowRight className="w-4 h-4" />
                    </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default PatientList;
