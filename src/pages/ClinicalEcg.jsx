import React from 'react';
import ClinicalEcgAnalyzer from '../components/ecg/ClinicalEcgAnalyzer';

export default function ClinicalEcg() {
  return (
    <div className="min-h-full bg-[var(--bg-main)] px-2 py-3 text-[var(--text-main)] sm:px-4 lg:px-6">
      <div className="clinical-page flex flex-col gap-4 lg:gap-5">
        <ClinicalEcgAnalyzer />
      </div>
    </div>
  );
}
