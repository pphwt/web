import React from 'react';
import { Sidebar } from './Sidebar';

export const MainLayout = ({ children }) => {
  return (
    <div className="flex h-screen w-screen bg-[#0b0f1a] text-slate-200 overflow-hidden font-sans">
      <Sidebar />
      <main className="flex-1 flex flex-col relative overflow-hidden bg-background">
        <div className="flex-1 overflow-auto relative">
          {children}
        </div>
      </main>
    </div>
  );
};
