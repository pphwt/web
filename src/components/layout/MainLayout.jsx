import React from 'react';
import { Sidebar } from './Sidebar';
import { TopBar } from './TopBar';

export const MainLayout = ({ children }) => {
  return (
    <div className="flex h-screen bg-[var(--bg-main)] text-[var(--text-main)] transition-colors duration-300 overflow-hidden">
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0">
        <TopBar />
        <main className="flex-1 overflow-auto p-8">
          {children}
        </main>
      </div>
    </div>
  );
};
