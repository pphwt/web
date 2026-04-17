import React from 'react';
import { NavLink } from 'react-router-dom';
import { Activity, Brain, FileText, Settings, LogOut, Zap, Users } from 'lucide-react';

const navItems = [
  { id: '/', icon: Users, label: 'Patient List' },
  { id: '/monitoring', icon: Activity, label: 'Live Monitoring' },
  { id: '/analysis', icon: Brain, label: '3D Analysis' },
  { id: '/reports', icon: FileText, label: 'Reports' },
];

export const Sidebar = () => {
  return (
    <aside className="w-64 border-r border-white/5 flex flex-col glass z-20 bg-[#0B0F1A]">
      <div className="p-6 mb-4">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-[#4FD1C5]/20 rounded-lg text-[#4FD1C5]">
            <Zap className="w-6 h-6" />
          </div>
          <h1 className="text-xl font-bold tracking-tighter text-white">
            BIOELECTRIC<span className="text-[#4FD1C5] text-xs ml-1">AI</span>
          </h1>
        </div>
      </div>

      <nav className="flex-1 px-4 space-y-2">
        {navItems.map((item) => (
          <NavLink
            key={item.id}
            to={item.id}
            className={({ isActive }) =>
              `w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 ${isActive
                ? 'bg-[#4FD1C5]/20 text-[#4FD1C5] border border-[#4FD1C5]/20 shadow-lg glow-blue'
                : 'hover:bg-white/5 text-slate-400'
              }`
            }
          >
            <item.icon className="w-5 h-5" />
            <span className="text-sm font-medium">{item.label}</span>
          </NavLink>
        ))}
      </nav>

      <div className="p-4 mt-auto border-t border-white/5">
        <button className="w-full flex items-center gap-3 px-4 py-3 text-slate-400 hover:text-white transition-colors">
          <LogOut className="w-5 h-5" />
          <span className="text-sm">Logout Session</span>
        </button>
      </div>
    </aside>
  );
};
