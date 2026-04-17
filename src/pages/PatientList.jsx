import React from 'react';

const PatientList = () => {
  const patients = [
    { id: 'PAT_01', status: 'URGENT ALERT', color: '#ef4444', bpm: 124, type: 'Tachycardia' },
    { id: 'PAT_01', status: 'ANALYZING', color: '#3b82f6', bpm: 72, type: 'Sinus Rhythm' },
    { id: 'PAT_01', status: 'COMPLETED', color: '#10b981', bpm: 64, type: 'Stable Resting' },
    { id: 'PAT_01', status: 'URGENT ALERT', color: '#ef4444', bpm: 132, type: 'Tachycardia' },
  ];

  return (
    <div style={{ backgroundColor: '#0b0f1a', minHeight: '100vh', color: 'white', padding: '40px', fontFamily: 'sans-serif' }}>
      <h1 style={{ fontSize: '28px', marginBottom: '30px' }}>Patient List</h1>
      
      {/* Cards Section */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '30px' }}>
        <div style={{ backgroundColor: '#161b2a', padding: '20px', borderRadius: '12px', border: '1px solid #2d3748' }}>
          <p style={{ color: '#94a3b8', fontSize: '14px' }}>Signal Quality</p>
          <p style={{ fontSize: '32px', color: '#f87171' }}>25% <span style={{ fontSize: '16px', color: '#94a3b8' }}>+ (Default : 45.2%)</span></p>
        </div>
        <div style={{ backgroundColor: '#161b2a', padding: '20px', borderRadius: '12px', border: '1px solid #f87171' }}>
          <p style={{ color: '#94a3b8', fontSize: '14px' }}>Risk Level</p>
          <p style={{ fontSize: '32px', color: '#ef4444', fontWeight: 'bold' }}>Critical</p>
        </div>
      </div>

      {/* Table Section */}
      <div style={{ backgroundColor: '#161b2a', borderRadius: '12px', overflow: 'hidden', border: '1px solid #2d3748' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
          <thead style={{ backgroundColor: '#1e2538', color: '#94a3b8', fontSize: '12px' }}>
            <tr>
              <th style={{ padding: '15px' }}>PATIENT IDENTITY</th>
              <th>STATUS</th>
              <th>VITALS (BPM)</th>
              <th>ACTION</th>
            </tr>
          </thead>
          <tbody>
            {patients.map((p, i) => (
              <tr key={i} style={{ borderBottom: '1px solid #2d3748' }}>
                <td style={{ padding: '20px' }}>{p.id}</td>
                <td><span style={{ backgroundColor: p.color + '22', color: p.color, padding: '4px 8px', borderRadius: '4px', fontSize: '10px' }}>{p.status}</span></td>
                <td><span style={{ color: p.color, fontWeight: 'bold' }}>{p.bpm}</span> <br/><span style={{ fontSize: '10px', color: '#64748b' }}>{p.type}</span></td>
                <td><button style={{ backgroundColor: '#2d3748', color: 'white', border: 'none', padding: '6px 12px', borderRadius: '4px', fontSize: '11px', cursor: 'pointer' }}>VIEW ANALYSIS</button></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default PatientList;
