import React, { useState, useEffect } from 'react';
import { ShieldCheck, X } from 'lucide-react';

export const CookieConsent = () => {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    // Show banner after a slight delay if not accepted yet
    const accepted = localStorage.getItem('cookie_consent_accepted');
    if (!accepted) {
      const timer = setTimeout(() => setVisible(true), 1200);
      return () => clearTimeout(timer);
    }
  }, []);

  const handleAccept = () => {
    localStorage.setItem('cookie_consent_accepted', 'true');
    setVisible(false);
  };

  if (!visible) return null;

  return (
    <div className="fixed bottom-5 right-5 left-5 md:left-auto md:w-[420px] z-[9999] animate-fade-in-up">
      <div className="bg-slate-950/80 backdrop-blur-xl border border-sky-500/20 rounded-2xl p-5 shadow-[0_10px_30px_rgba(4,10,24,0.4),0_0_20px_rgba(56,189,248,0.15)] text-slate-200">
        <div className="flex items-start gap-4">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-sky-500/20 text-sky-400 border border-sky-500/25">
            <ShieldCheck size={18} />
          </div>
          
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-bold uppercase tracking-wider text-sky-400">
                การแจ้งเตือนสิทธิ์การใช้คุกกี้ (PDPA)
              </h4>
              <button 
                onClick={() => setVisible(false)}
                className="text-slate-500 hover:text-slate-300 transition-colors p-1"
                aria-label="Close banner"
              >
                <X size={14} />
              </button>
            </div>
            
            <p className="mt-2 text-xs leading-relaxed text-slate-400">
              ระบบหลังบ้านโรงพยาบาลนี้มีการใช้เฉพาะคุกกี้ที่จำเป็นอย่างยิ่ง (Strictly Necessary Cookies & LocalStorage) เพื่อรักษาความปลอดภัยของข้อมูลผู้ป่วยและคงสถานะการล็อกอินของท่าน เพื่อให้เป็นไปตามกฎหมาย PDPA
            </p>
            
            <div className="mt-4 flex items-center justify-end gap-3">
              <button 
                onClick={() => setVisible(false)}
                className="px-3 py-1.5 rounded-lg text-[11px] font-semibold text-slate-500 hover:text-slate-300 hover:bg-white/5 transition-all active:scale-95"
              >
                ปิดหน้าต่าง
              </button>
              <button 
                onClick={handleAccept}
                className="px-4 py-1.5 rounded-lg text-[11px] font-semibold bg-sky-600 hover:bg-sky-500 text-white shadow-lg shadow-sky-600/20 transition-all active:scale-95 border border-sky-500/30"
              >
                ยอมรับการใช้งาน
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
