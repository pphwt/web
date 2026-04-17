import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';

import { PatientProvider } from './context/PatientContext';
import { MainLayout } from './components/layout/MainLayout';

import PatientList from './pages/PatientList';
import LiveMonitoring from './pages/LiveMonitoring';
import Reports from './pages/Reports';
import Analysis from './pages/Analysis';

function App() {
  return (
    <PatientProvider>
      <Router>
        <MainLayout>
          <Routes>
            <Route path="/" element={<PatientList />} />
            <Route path="/monitoring" element={<LiveMonitoring />} />
            <Route path="/reports" element={<Reports />} />
            <Route path="/analysis" element={<Analysis />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </MainLayout>
      </Router>
    </PatientProvider>
  );
}

export default App;
