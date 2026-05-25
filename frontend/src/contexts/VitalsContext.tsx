import React, { createContext, useContext, useState, ReactNode } from 'react';

export interface Vitals {
  heartRate: number | null;
  hrv: number | null;
  spo2: number | null;
  stressLevel: number | null;
  coherence: 'Low' | 'Medium' | 'High' | 'Unknown';
  status: 'Low' | 'Medium' | 'High' | 'Unknown';
}

interface VitalsContextType {
  vitals: Vitals;
  setVitals: (vitals: Partial<Vitals>) => void;
  resetVitals: () => void;
}

const initialVitals: Vitals = {
  heartRate: null,
  hrv: null,
  spo2: null,
  stressLevel: null,
  coherence: 'Unknown',
  status: 'Unknown',
};

const VitalsContext = createContext<VitalsContextType | undefined>(undefined);

export const VitalsProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [vitals, setVitalsState] = useState<Vitals>(initialVitals);

  const setVitals = (newVitals: Partial<Vitals>) => {
    setVitalsState((prev) => {
      const updated = { ...prev, ...newVitals };
      
      // Auto-calculate labels if needed
      if (newVitals.stressLevel !== undefined) {
        if (updated.stressLevel == null) updated.status = 'Unknown';
        else if (updated.stressLevel >= 65) updated.status = 'High';
        else if (updated.stressLevel >= 35) updated.status = 'Medium';
        else updated.status = 'Low';
      }
      
      if (newVitals.hrv !== undefined) {
        if (updated.hrv == null) updated.coherence = 'Unknown';
        else if (updated.hrv >= 60) updated.coherence = 'High';
        else if (updated.hrv >= 40) updated.coherence = 'Medium';
        else updated.coherence = 'Low';
      }
      
      return updated;
    });
  };

  const resetVitals = () => setVitalsState(initialVitals);

  return (
    <VitalsContext.Provider value={{ vitals, setVitals, resetVitals }}>
      {children}
    </VitalsContext.Provider>
  );
};

export const useVitals = () => {
  const context = useContext(VitalsContext);
  if (context === undefined) {
    throw new Error('useVitals must be used within a VitalsProvider');
  }
  return context;
};
