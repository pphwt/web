import React, { useState } from 'react';
import { ChevronDown, User, Search, SlidersHorizontal } from 'lucide-react';
import { usePatient } from '../../context/PatientContext';

const PatientSelector = () => {
  const { patients, selectedPatient, setSelectedPatient } = usePatient();
  const [showSelector, setShowSelector] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  const filteredPatients = patients.filter(p => 
    p.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (!selectedPatient) return null;

  return (
    <div className="relative">
      <p className="text-white text-[10px] font-bold mb-2 ml-1 uppercase tracking-tight">Select People</p>
      
      {/* Trigger */}
      <div 
        onClick={() => setShowSelector(!showSelector)}
        className="bg-[#1a1f2e] border border-white/10 rounded-lg p-4 min-w-[420px] flex items-center gap-4 cursor-pointer hover:bg-white/5 transition-all shadow-xl"
      >
        <div className="w-12 h-12 bg-[#2d3748] rounded-md flex items-center justify-center overflow-hidden flex-shrink-0">
           <User className="text-[#8e95a5]" size={28} />
        </div>
        <div className="flex-1">
          <p className="text-white text-sm font-bold leading-tight">{selectedPatient.name}</p>
          <p className="text-[#8e95a5] text-[10px] mt-1 uppercase tracking-tighter">
            Age : {selectedPatient.age}y , H : {selectedPatient.height}cm , W : {selectedPatient.weight}kg
          </p>
        </div>
        <ChevronDown size={14} className={`text-white transition-transform ${showSelector ? 'rotate-180' : ''}`} />
      </div>

      {/* Dropdown Content (Overlay) */}
      {showSelector && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-[#1a1f2e] border border-white/10 rounded-lg shadow-2xl z-[100] p-4 space-y-4 animate-in fade-in zoom-in-95 duration-200">
          {/* Search Bar */}
          <div className="relative flex items-center gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-[#4a5568]" size={16} />
              <input 
                type="text" 
                placeholder="Search"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                autoFocus
                className="w-full bg-[#0e121d] text-white text-sm rounded-md py-2.5 pl-10 pr-4 outline-none border border-white/5 focus:border-[#4FD1C5]/30"
              />
            </div>
            <button className="p-2.5 bg-[#0e121d] rounded-md border border-white/5 text-[#8e95a5] hover:text-white transition-colors">
              <SlidersHorizontal size={18} />
            </button>
          </div>

          {/* List of Patients */}
          <div className="space-y-3 max-h-[350px] overflow-y-auto pr-1">
            {filteredPatients.map((p) => (
              <div 
                key={p.id}
                onClick={() => {
                  setSelectedPatient(p);
                  setShowSelector(false);
                  setSearchTerm('');
                }}
                className="bg-[#0e121d] p-3 rounded-lg flex items-center gap-4 cursor-pointer hover:ring-1 hover:ring-[#4FD1C5]/30 transition-all border border-transparent shadow-md"
              >
                <div className="w-10 h-10 bg-[#2d3748] rounded-md flex items-center justify-center overflow-hidden flex-shrink-0">
                  <User className="text-[#8e95a5]" size={24} />
                </div>
                <div className="flex-1">
                  <p className="text-white text-xs font-bold leading-tight">{p.name}</p>
                  <p className="text-[#8e95a5] text-[9px] mt-1 uppercase tracking-tighter">
                    Age : {p.age} , Height : {p.height} , Weight : {p.weight}
                  </p>
                </div>
              </div>
            ))}
            {filteredPatients.length === 0 && (
              <p className="text-center text-[#4a5568] text-xs py-10">No patients found</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default PatientSelector;
