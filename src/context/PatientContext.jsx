import React, { createContext, useState } from 'react';
import { mockPatients } from '../lib/mockData';

export const PatientContext = createContext();

export const PatientProvider = ({ children }) => {
  const [currentPatient, setCurrentPatient] = useState(mockPatients[0]);
  const [patients, setPatients] = useState(mockPatients);

  return (
    <PatientContext.Provider value={{ currentPatient, setCurrentPatient, patients, setPatients }}>
      {children}
    </PatientContext.Provider>
  );
};
