import React from 'react';

const PinnsInsightsCard = () => {
  return (
    <div className="bg-[#1a1f2e] p-6 rounded-2xl border border-white/5 shadow-xl h-full">
      <p className="text-[#8e95a5] text-[10px] font-bold uppercase tracking-widest mb-6">PINNS Insights</p>
      
      <div className="space-y-6">
        <div>
          <p className="text-[#4FD1C5] text-xs font-bold mb-2">Predictive Haemodynamics</p>
          <p className="text-[#8e95a5] text-[11px] leading-relaxed">
            System predicts 4% increase in aortic pressure within 2 hours based on fluid retention trends.
          </p>
        </div>

        <div>
          <p className="text-[#EAB308] text-xs font-bold mb-2">Myocardial Fatigue Index</p>
          <p className="text-[#8e95a5] text-[11px] leading-relaxed mb-4">
            Strain analysis shows minor localized decoupling in the left ventricle apex.
          </p>
          
          <div className="space-y-2">
            <div className="h-1.5 w-full bg-[#2d3748] rounded-full overflow-hidden">
              <div className="h-full bg-[#4FD1C5] w-[98.2%] shadow-[0_0_10px_rgba(79,209,197,0.5)]"></div>
            </div>
            <p className="text-[10px] text-[#4FD1C5] font-bold">Model Confidence: 98.2% Accurate</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PinnsInsightsCard;
