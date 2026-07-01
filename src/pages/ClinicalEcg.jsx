import React from 'react';
import { Stethoscope } from 'lucide-react';
import ClinicalEcgAnalyzer from '../components/ecg/ClinicalEcgAnalyzer';
import DoctorGuide from '../components/ecg/DoctorGuide';
import { useTheme } from '../context/ThemeContext';

export default function ClinicalEcg() {
  const { isDarkMode: dk } = useTheme();
  const surface = dk ? 'bg-[#0d1525] border-white/[0.06]' : 'bg-white border-slate-200';
  const mainText = dk ? 'text-white' : 'text-slate-900';
  const subText = dk ? 'text-slate-400' : 'text-slate-500';

  return (
    <div className="p-4 md:p-6 min-h-screen bg-[var(--bg-main)] text-[var(--text-main)]">
      <div className="max-w-[1100px] mx-auto flex flex-col gap-5">
        <header className={`flex items-center justify-between gap-4 rounded-2xl border p-4 ${surface}`}>
          <div className="flex items-center gap-3">
            <div className={`flex h-9 w-9 items-center justify-center rounded-xl border ${dk ? 'bg-sky-500/15 border-sky-500/20 text-sky-400' : 'bg-sky-50 border-sky-200 text-sky-600'}`}>
              <Stethoscope size={17} />
            </div>
            <div>
              <h1 className={`text-sm font-bold ${mainText}`}>อ่านผล ECG จากไฟล์จริง — วัด interval + แสดงคลื่น</h1>
              <p className={`mt-0.5 text-xs ${subText}`}>
                อัปโหลด ECG มาตรฐาน (WFDB/DICOM/CSV/NumPy) เพื่อวัดค่าจริงและแสดงคลื่น — เพื่อคัดกรอง ไม่ใช่คำวินิจฉัยสุดท้าย
              </p>
            </div>
          </div>
          <span className={`rounded-lg border px-2.5 py-1 text-[10px] font-semibold ${dk ? 'border-emerald-500/30 text-emerald-400 bg-emerald-500/10' : 'border-emerald-300 text-emerald-700 bg-emerald-50'}`}>
            REAL MEASUREMENTS
          </span>
        </header>

        <DoctorGuide />
        <ClinicalEcgAnalyzer />
      </div>
    </div>
  );
}
