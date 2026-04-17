import React, { useState } from 'react';
import { Activity, LayoutDashboard, Brain, FileText, Settings, LogOut, ChevronRight, Zap } from 'lucide-react';
import ECGViewer from '../components/ECGViewer';
import HeartModel3D from '../components/HeartModel3D';

const Dashboard = () => {
  const [activeTab, setActiveTab] = useState('live');
  const [patient, setPatient] = useState({
    id: 'PAT-8829-X',
    name: 'Jonathan Doe',
    age: 54,
    gender: 'Male',
    status: 'Critical - Arrythmia Detected'
  });

  const [sessionData, setSessionData] = useState({
    heartRate: 112,
    rhythm: 'Atrial Flutter',
    currentSource: { x: -42, y: 31, z: -15 },
    region: 'Left Atrial Wall (Posterior)'
  });

  return (
    <div className="flex h-screen w-screen bg-background text-slate-200 overflow-hidden font-sans">
      
      {/* 1. Sidebar */}
      <aside className="w-64 border-r border-white/5 flex flex-col glass z-20">
        <div className="p-6 mb-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary/20 rounded-lg">
              <Zap className="w-6 h-6 text-primary" />
            </div>
            <h1 className="text-xl font-bold tracking-tighter text-white">BIOELECTRIC<span className="text-primary text-xs ml-1">AI</span></h1>
          </div>
        </div>

        <nav className="flex-1 px-4 space-y-2">
          {[
            { id: 'live', icon: Activity, label: 'Live Monitoring' },
            { id: '3d', icon: Brain, label: '3D Analysis' },
            { id: 'reports', icon: FileText, label: 'Patient Reports' },
            { id: 'settings', icon: Settings, label: 'Lab Settings' },
          ].map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 ${
                activeTab === item.id 
                  ? 'bg-primary/20 text-primary border border-primary/20 shadow-lg glow-blue' 
                  : 'hover:bg-white/5 text-slate-400'
              }`}
            >
              <item.icon className="w-5 h-5" />
              <span className="text-sm font-medium">{item.label}</span>
              {activeTab === item.id && <ChevronRight className="w-4 h-4 ml-auto" />}
            </button>
          ))}
        </nav>

        <div className="p-4 mt-auto border-t border-white/5">
          <button className="w-full flex items-center gap-3 px-4 py-3 text-slate-400 hover:text-white transition-colors">
            <LogOut className="w-5 h-5" />
            <span className="text-sm">Logout Session</span>
          </button>
        </div>
      </aside>

      {/* 2. Main Content */}
      <main className="flex-1 flex flex-col relative overflow-hidden">
        
        {/* Top Header */}
        <header className="h-20 border-b border-white/5 px-8 flex items-center justify-between glass z-10">
          <div className="flex items-center gap-6">
            <div className="flex flex-col">
              <span className="text-[10px] text-slate-500 uppercase tracking-widest">Active Patient</span>
              <span className="text-sm font-bold text-white uppercase">{patient.name}</span>
            </div>
            <div className="h-8 w-px bg-white/5" />
            <div className="flex flex-col">
              <span className="text-[10px] text-slate-500 uppercase tracking-widest">Global Status</span>
              <span className="text-sm font-bold text-anomaly animate-pulse uppercase">{patient.status}</span>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="flex -space-x-2">
              <div className="w-8 h-8 rounded-full border-2 border-surface bg-slate-700" />
              <div className="w-8 h-8 rounded-full border-2 border-surface bg-slate-600 flex items-center justify-center text-[10px]">MD</div>
            </div>
            <div className="px-3 py-1 bg-normal/20 text-normal text-[10px] rounded-full border border-normal/30 flex items-center gap-2">
              <div className="w-1.5 h-1.5 rounded-full bg-normal" />
              PINN ENGINE LINKED
            </div>
          </div>
        </header>

        {/* Dynamic Workspace */}
        <div className="flex-1 p-8 overflow-hidden grid grid-cols-12 gap-6 relative">
          
          {/* Signal Stream (Left Panel) */}
          <div className="col-span-12 lg:col-span-7 flex flex-col gap-6 overflow-hidden">
            <div className="flex-1 min-h-[500px]">
              <ECGViewer 
                heartRate={sessionData.heartRate} 
                rhythm={sessionData.rhythm} 
                anomalies={[{start: 400, end: 600}]}
              />
            </div>
          </div>

          {/* 3D Visualizer (Right Panel) */}
          <div className="col-span-12 lg:col-span-5 flex flex-col gap-6">
            <div className="flex-1 min-h-[500px]">
              <HeartModel3D 
                anomalyPos={sessionData.currentSource}
                regionLabel={sessionData.region}
              />
            </div>
          </div>

        </div>

        {/* Ambient Glows */}
        <div className="absolute top-1/4 -right-20 w-96 h-96 bg-primary/10 rounded-full blur-[100px] pointer-events-none" />
        <div className="absolute bottom-1/4 -left-20 w-96 h-96 bg-secondary/10 rounded-full blur-[100px] pointer-events-none" />
      </main>
    </div>
  );
};

export default Dashboard;
