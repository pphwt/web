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
                    <Route path="/auth/login" element={<Login />} />

                    {/* Protected Dashboard Routes */}
                    <Route path="/*" element={
                      <ProtectedRoute>
                        <MainLayout>
                          <Routes>
                            <Route path="/page/overview" element={<PatientList />} />
                            <Route path="/" element={<Navigate to="/page/overview" replace />} />
                            <Route path="/page/live" element={<LiveMonitoring />} />
                            <Route path="/page/reports" element={<Reports />} />
                            <Route path="/page/analysis" element={<Analysis />} />
                            <Route path="/page/sandbox" element={<NeuralSandbox />} />
                            <Route path="/page/ai-diagnostics" element={<AIDiagnostics />} />
                            <Route path="/page/brain-diagnostics" element={<BrainDiagnostics />} />
                            <Route path="/page/archives" element={<PatientArchives />} />
                            <Route path="/page/lab" element={<EducationalLab />} />
                            <Route path="/page/help" element={<HelpManual />} />
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
