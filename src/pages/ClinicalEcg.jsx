import React from 'react';
import ClinicalEcgAnalyzer from '../components/ecg/ClinicalEcgAnalyzer';

export default function ClinicalEcg() {
  return (
    <div className="p-4 md:p-6 min-h-screen bg-[var(--bg-main)] text-[var(--text-main)]">
      <div className="max-w-[1800px] mx-auto flex flex-col gap-5">
        <ClinicalEcgAnalyzer />
      </div>
    </div>
  );
}
