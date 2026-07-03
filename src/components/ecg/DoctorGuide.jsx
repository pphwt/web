import React, { useState } from 'react';
import {
  BookOpen, ChevronDown, ChevronUp, ListChecks, Ruler, ShieldAlert, Stethoscope,
} from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';

const WORKFLOW = [
  ['เลือก ECG', 'เลือกตัวอย่างจริง (PTB-XL มี label) หรืออัปโหลดไฟล์ WFDB/DICOM/CSV/รูปถ่าย'],
  ['วัดผล', 'ระบบวัด HR/PR/QRS/QT/QTc/axis จากสัญญาณจริง + วินิจฉัยเบื้องต้น'],
  ['อ่านค่า', 'ดูค่าเทียบช่วงปกติ + คลื่นทุก lead + ระดับความเสี่ยง'],
  ['ตัดสินใจ', 'ใช้ประกอบอาการ/สัญญาณชีพ เพื่อติดตามหรือส่งต่อ — แพทย์ยืนยันผลสุดท้าย'],
];

const RANGES = [
  ['HR', '60–100 bpm', 'อัตราการเต้น'],
  ['PR', '120–200 ms', 'AV conduction'],
  ['QRS', '< 120 ms', 'depolarization ventricle'],
  ['QTc', 'ช < 450 / ญ < 470 ms', 'repolarization (Bazett)'],
  ['Axis', '−30° ถึง +90°', 'แกนไฟฟ้า'],
];

const LIMITS = [
  ['ค่าที่มี ≈ (PR/QRS/QT/QTc)', 'open-source delineation (neurokit2) = ค่าประมาณคร่าวๆ คลาดเคลื่อนได้มาก โดยเฉพาะ QRS width (มักกว้างเกินจริง) — ไม่ใช้วัดทางคลินิก ยืนยันด้วยตาเสมอ. HR และ rhythm เชื่อได้กว่า'],
  ['3D localization', 'โมเดลเทรนจาก simulation → ปิดสำหรับ clinical ECG (แสดง null พร้อมเหตุผล) ไม่โชว์ตำแหน่งมั่ว'],
  ['รูปถ่าย/สแกน ECG', 'digitize เต็ม 12-lead ได้ (3x4, 2x6, 4x3, มี/ไม่มี rhythm strip) — รูปเบลอ/แสงไม่พอ/มุมเอียงมาก อาจอ่านได้ไม่ครบ ระบบจะบอกจำนวน lead ที่อ่านได้จริงเสมอ ไม่เดา'],
  ['วินิจฉัยเบื้องต้น (classifier)', 'เทรนจริงบน PTB-XL แล้ว (ดูเลข val macroAUC จริงต่อผลแต่ละครั้งในการ์ด AI Predictions) — ยังเป็น decision support เท่านั้น แพทย์ยืนยันผลสุดท้ายเสมอ'],
];

export default function DoctorGuide() {
  const { isDarkMode: dk } = useTheme();
  const [open, setOpen] = useState(false);

  const surface = dk ? 'bg-[#0d1525] border-white/[0.06]' : 'bg-white border-slate-200';
  const mainText = dk ? 'text-white' : 'text-slate-900';
  const subText = dk ? 'text-slate-400' : 'text-slate-500';
  const secLabel = dk ? 'text-slate-500' : 'text-slate-400';
  const chip = dk ? 'bg-white/[0.03] border-white/[0.06]' : 'bg-slate-50 border-slate-100';

  return (
    <div className={`rounded-2xl border ${surface}`}>
      <button
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center justify-between gap-3 px-4 py-3"
      >
        <span className="flex items-center gap-2">
          <BookOpen size={16} className={dk ? 'text-sky-400' : 'text-sky-600'} />
          <span className={`text-sm font-bold ${mainText}`}>คู่มือแพทย์ · วิธีอ่านและใช้ผล ECG</span>
        </span>
        {open ? <ChevronUp size={16} className={subText} /> : <ChevronDown size={16} className={subText} />}
      </button>

      {open && (
        <div className={`px-4 pb-4 border-t ${dk ? 'border-white/[0.06]' : 'border-slate-100'}`}>
          {/* Golden rule — matches clinician feedback */}
          <div className={`mt-4 flex gap-2 rounded-xl border p-3 ${dk ? 'bg-emerald-500/[0.06] border-emerald-500/20' : 'bg-emerald-50 border-emerald-200'}`}>
            <Stethoscope size={15} className="shrink-0 mt-0.5 text-emerald-500" />
            <p className={`text-[11px] leading-relaxed ${dk ? 'text-emerald-200' : 'text-emerald-800'}`}>
              <b>กฎทอง:</b> ระบบนี้ช่วย<b>คัดกรองและให้ข้อมูล</b> ไม่ใช่คำวินิจฉัยสุดท้าย.
              AI ตัดสินใจแทนแพทย์ไม่ได้ — แพทย์เป็นผู้ยืนยันผลและตัดสินใจส่งต่อเสมอ.
            </p>
          </div>

          {/* Workflow */}
          <div className="mt-4">
            <div className={`flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider mb-2 ${secLabel}`}>
              <ListChecks size={12} /> ขั้นตอนใช้งาน
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2">
              {WORKFLOW.map(([t, d], i) => (
                <div key={t} className={`rounded-xl border p-3 ${chip}`}>
                  <div className={`text-xs font-bold ${mainText}`}>{i + 1}. {t}</div>
                  <p className={`mt-1 text-[10px] leading-relaxed ${subText}`}>{d}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Reference ranges */}
          <div className="mt-4">
            <div className={`flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider mb-2 ${secLabel}`}>
              <Ruler size={12} /> ค่ามาตรฐานผู้ใหญ่ (อ้างอิง)
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2">
              {RANGES.map(([k, r, m]) => (
                <div key={k} className={`rounded-xl border p-2.5 text-center ${chip}`}>
                  <div className={`text-[10px] font-bold ${dk ? 'text-sky-300' : 'text-sky-700'}`}>{k}</div>
                  <div className={`text-[11px] font-semibold mt-0.5 ${mainText}`}>{r}</div>
                  <div className={`text-[9px] mt-0.5 ${secLabel}`}>{m}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Limits / honesty */}
          <div className="mt-4">
            <div className={`flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider mb-2 ${secLabel}`}>
              <ShieldAlert size={12} /> ข้อจำกัดที่ต้องรู้ (ความโปร่งใส)
            </div>
            <div className="flex flex-col gap-2">
              {LIMITS.map(([t, d]) => (
                <div key={t} className={`rounded-xl border p-3 ${chip}`}>
                  <div className={`text-[11px] font-bold ${dk ? 'text-amber-300' : 'text-amber-700'}`}>{t}</div>
                  <p className={`mt-0.5 text-[10px] leading-relaxed ${subText}`}>{d}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
