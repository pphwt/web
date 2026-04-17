export const mockPatients = [
  { id: 'PAT-8829-X', name: 'Mr. John Doe', age: 20, height: 170, weight: 55, gender: 'Male', status: 'URGENT ALERT', color: '#ef4444', bpm: 124, type: 'Tachycardia', actionLabel: 'VIEW ANALYSIS', diagnosticTags: ['EEG DELTA+', 'AFIB DETECTED'] },
  { id: 'PAT_01', name: 'Mr. John Doe (Sample)', age: 20, height: 170, weight: 55, status: 'ANALYZING', color: '#3b82f6', bpm: 72, type: 'Sinus Rhythm', actionLabel: 'OPEN FEED', diagnosticTags: ['ECG ALPHA', 'CALIBRATING'] },
  { id: 'PAT_02', name: 'Ms. Jane Doe', age: 20, height: 170, weight: 55, status: 'COMPLETED', color: '#10b981', bpm: 64, type: 'Stable Resting', actionLabel: 'PRINT', diagnosticTags: ['ARCHIVED'] },
  { id: 'PAT_03', name: 'Ms. Somsri', age: 20, height: 170, weight: 55, status: 'URGENT ALERT', color: '#ef4444', bpm: 132, type: 'Tachycardia', actionLabel: 'REPORT PEF', diagnosticTags: ['EEG DELTA+', 'AFIB DETECTED'] },
];

export const cardioData = [65, 72, 58, 80, 74, 88, 60, 78, 83, 70, 65, 90, 55, 78, 84, 72, 61, 79, 88, 74];
export const neuroData  = [80, 90, 94, 88, 76, 72, 85, 91, 95, 88, 72, 80, 94, 88, 82, 90, 78, 85, 93, 94];

export const recentReports = [
  {
    patientId: 'PAT_01', type: 'Cardiovascular — Tachycardia Pattern', status: 'URGENT ALERT',
    icon: 'Heart', time: '09:41',
    details: [
      { label: 'Avg BPM', value: '124', color: '#f87171' },
      { label: 'Signal Q.', value: '78%', color: '#fbbf24' },
      { label: 'Duration', value: '18 min' },
      { label: 'Risk', value: 'HIGH', color: '#ef4444' },
    ],
  },
  {
    patientId: 'PAT_02', type: 'Neural Activity — GMs Index Monitoring', status: 'ANALYZING',
    icon: 'Brain', time: '09:12',
    details: [
      { label: 'GMs Index', value: '94.2', color: '#38bdf8' },
      { label: 'Accuracy', value: '52.4%', color: '#a78bfa' },
      { label: 'Anomalies', value: '25' },
      { label: 'Risk', value: 'MOD', color: '#fbbf24' },
    ],
  },
  {
    patientId: 'PAT_03', type: 'Cardiovascular — Stable Resting Rhythm', status: 'COMPLETED',
    icon: 'Activity', time: '08:55',
    details: [
      { label: 'Avg BPM', value: '64', color: '#10b981' },
      { label: 'Signal Q.', value: '96%', color: '#10b981' },
      { label: 'Duration', value: '24 min' },
      { label: 'Risk', value: 'LOW', color: '#10b981' },
    ],
  },
];
