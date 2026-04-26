import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';

import { PatientProvider } from './context/PatientContext';
import { AuthProvider } from './context/AuthContext';
import { StreamProvider } from './context/StreamContext';
import { ThemeProvider } from './context/ThemeContext';
import { ToastProvider } from './context/ToastContext';
import { LanguageProvider } from './context/LanguageContext';
import { MainLayout } from './components/layout/MainLayout';
import ProtectedRoute from './components/auth/ProtectedRoute';

import PatientList from './pages/PatientList';
import LiveMonitoring from './pages/LiveMonitoring';
import Reports from './pages/Reports';
import Analysis from './pages/Analysis';
import Login from './pages/Login';
import Register from './pages/Register';
import PatientArchives from './pages/PatientArchives';
import EducationalLab from './pages/EducationalLab';
import NeuralSandbox from './pages/NeuralSandbox';
import AIDiagnostics from './pages/AIDiagnostics';
import BrainDiagnostics from './pages/BrainDiagnostics';
import HelpManual from './pages/HelpManual';

function App() {
  return (
    <ThemeProvider>
      <LanguageProvider>
        <ToastProvider>
          <AuthProvider>
            <StreamProvider>
              <PatientProvider>
                <Router>
                  <Routes>
                    {/* Public Routes */}
                    <Route path="/login" element={<Login />} />
                    <Route path="/register" element={<Register />} />

                    {/* Protected Dashboard Routes */}
                    <Route path="/*" element={
                      <ProtectedRoute>
                        <MainLayout>
                          <Routes>
                            <Route path="/" element={<PatientList />} />
                            <Route path="/live" element={<LiveMonitoring />} />
                            <Route path="/reports" element={<Reports />} />
                            <Route path="/analysis" element={<Analysis />} />
                            <Route path="/sandbox" element={<NeuralSandbox />} />
                            <Route path="/ai-diagnostics" element={<AIDiagnostics />} />
                            <Route path="/brain-diagnostics" element={<BrainDiagnostics />} />
                            <Route path="/archives" element={<PatientArchives />} />
                            <Route path="/lab" element={<EducationalLab />} />
                            <Route path="/help" element={<HelpManual />} />
                            <Route path="*" element={<Navigate to="/" replace />} />
                          </Routes>
                        </MainLayout>
                      </ProtectedRoute>
                    } />
                  </Routes>
                </Router>
              </PatientProvider>
            </StreamProvider>
          </AuthProvider>
        </ToastProvider>
      </LanguageProvider>
    </ThemeProvider>
  );
}

export default App;
