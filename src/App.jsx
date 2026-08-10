import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';

import { PatientProvider } from './context/PatientContext';
import { AuthProvider } from './context/AuthContext';
import { StreamProvider } from './context/StreamContext';
import { ThemeProvider } from './context/ThemeContext';
import { ToastProvider } from './context/ToastContext';
import { LanguageProvider } from './context/LanguageContext';
import { AccessibilityProvider } from './context/AccessibilityContext';
import { MainLayout } from './components/layout/MainLayout';
import ProtectedRoute from './components/auth/ProtectedRoute';

import PatientList from './pages/PatientList';
import LiveMonitoring from './pages/LiveMonitoring';
import Reports from './pages/Reports';
import Analysis from './pages/Analysis';
import ClinicalEcg from './pages/ClinicalEcg';
import Login from './pages/Login';
import PatientArchives from './pages/PatientArchives';
import HelpManual from './pages/HelpManual';
import Progress from './pages/Progress';
import AIDiagnostics from './pages/AIDiagnostics';
import Audit from './pages/Audit';
import Showcase from './pages/Showcase';
import ResearchLab from './pages/ResearchLab';

function App() {
  return (
    <ThemeProvider>
      <AccessibilityProvider>
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
                              <Route path="/page/progress" element={<Progress />} />
                              <Route path="/page/showcase" element={<Showcase />} />
                              <Route path="/page/research-lab" element={<ResearchLab />} />
                              <Route path="/page/audit" element={<Audit />} />
                              <Route path="/page/ai-diagnostics" element={<AIDiagnostics />} />
                              <Route path="/page/live" element={<LiveMonitoring />} />
                              <Route path="/page/reports" element={<Reports />} />
                              <Route path="/page/analysis" element={<Analysis />} />
                              <Route path="/page/clinical-ecg" element={<ClinicalEcg />} />
                              <Route path="/page/archives" element={<PatientArchives />} />
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
      </AccessibilityProvider>
    </ThemeProvider>
  );
}

export default App;
