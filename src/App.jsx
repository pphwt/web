import React from 'react';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import { LayoutDashboard, Users, Activity, FileText } from 'lucide-react';
import PatientList from './pages/PatientList';
import LiveMonitoring from './pages/LiveMonitoring';

// ส่วนของแถบเมนูด้านซ้าย (Sidebar)
const Sidebar = () => (
  <div className="w-64 bg-[#0B0F1A] h-screen border-r border-gray-800 p-6 flex flex-col fixed left-0 top-0">
    <h1 className="text-[#4FD1C5] font-bold text-xl mb-10">BIOELECTRIC <span className="text-white">AI</span></h1>
    <nav className="flex-1 space-y-4">
      {/* ลิงก์ไปหน้าตารางคนไข้ */}
      <Link to="/" className="flex items-center space-x-3 text-gray-400 hover:text-white transition-colors group">
        <Users size={20} className="group-hover:text-[#4FD1C5]" /> <span>Patient List</span>
      </Link>
      {/* ลิงก์ไปหน้ามอนิเตอร์ที่มีหัวใจ 3D */}
      <Link to="/monitoring" className="flex items-center space-x-3 text-gray-400 hover:text-white transition-colors group">
        <Activity size={20} className="group-hover:text-[#4FD1C5]" /> <span>Live Monitoring</span>
      </Link>
    </nav>
  </div>
);

function App() {
  return (
    <Router>
      <div className="flex bg-[#0B0F1A] min-h-screen text-white">
        <Sidebar />
        {/* พื้นที่แสดงเนื้อหาด้านขวา */}
        <main className="flex-1 ml-64 p-8">
          <Routes>
            <Route path="/" element={<PatientList />} />
            <Route path="/monitoring" element={<LiveMonitoring />} />
          </Routes>
        </main>
      </div>
    </Router>
  );
}

export default App;