import React, { createContext, useState, useContext, useEffect } from 'react';
import { useAuth } from './AuthContext';
import { API_BASE } from '../utils/constants';

export const PatientContext = createContext();

export const PatientProvider = ({ children }) => {
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [patients, setPatients] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const { token } = useAuth();

  const fetchPatients = async () => {
    if (!token) return;
    try {
      setIsLoading(true);
      const response = await fetch(`${API_BASE}/patients/`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (response.ok) {
        const data = await response.json();
        setPatients(data);
        // Default to first patient if none selected
        if (!selectedPatient && data.length > 0) {
          setSelectedPatient(data[0]);
        }
      }
    } catch (error) {
      console.error('Failed to fetch patients:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchPatients();
  }, [token]);

  const addPatient = async (patientData) => {
    try {
      const response = await fetch(`${API_BASE}/patients/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(patientData)
      });
      if (response.ok) {
        const data = await response.json();
        await fetchPatients(); // Refresh list
        return data;
      }
      return null;
    } catch (error) {
      console.error('Failed to add patient:', error);
      return null;
    }
  };

  return (
    <PatientContext.Provider value={{ 
      selectedPatient, 
      setSelectedPatient, 
      patients, 
      isLoading, 
      refreshPatients: fetchPatients,
      addPatient
    }}>
      {children}
    </PatientContext.Provider>
  );
};

export const usePatient = () => {
  const context = useContext(PatientContext);
  if (!context) {
    throw new Error('usePatient must be used within a PatientProvider');
  }
  return context;
};
