import React, { useState, useEffect } from 'react';
import { readingService, Reading, NewReading } from '../services/api';
import { authService } from '../services/auth';
import './ReadingList.css';

const ReadingList: React.FC = () => {
  const [readings, setReadings] = useState<Reading[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refreshData = React.useCallback(() => {
    if (!authService.isAuthenticated()) {
      setError('Please log in to view readings');
      setLoading(false);
      return;
    }
    
    setLoading(true);
    authService.getMe().then(() => {
      fetchReadings();
    }).catch((err) => {
      console.error('[ReadingList] Auth check failed:', err);
      if (err?.response?.status === 401 || err?.response?.status === 404) {
        authService.logout();
        setError('Please log in to view readings');
      } else {
        // Network error or other, still try to fetch readings if we have a token
        fetchReadings();
      }
    }).finally(() => {
      setLoading(false);
    });
  }, []);

  useEffect(() => {
    refreshData();
    
    window.addEventListener('calmipet-auth-changed', refreshData);
    return () => window.removeEventListener('calmipet-auth-changed', refreshData);
  }, [refreshData]);

  const fetchReadings = async () => {
    try {
      setLoading(true);
      const data = await readingService.getReadings();
      setReadings(data);
      setError(null);
    } catch (err) {
      setError('Failed to fetch readings');
      console.error('Error fetching readings:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateReading = async () => {
    try {
      const newReading: NewReading = {
        heart_rate: Math.floor(Math.random() * 40) + 60,
        stress_level: Math.floor(Math.random() * 50) + 20,
      };
      await readingService.createReading(newReading);
      // Optimistic update
      setReadings([...readings, {
        id: Date.now(),
        heart_rate: newReading.heart_rate,
        hrv: newReading.hrv || 0,
        stress_level: newReading.stress_level || 0,
        timestamp: new Date().toISOString()
      }]);
    } catch (err) {
      setError('Failed to create reading');
      console.error('Error creating reading:', err);
    }
  };

  const handleExportCsv = async () => {
    try {
      const blob = await readingService.exportCsv();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `calmipet_readings_${new Date().toISOString().slice(0,10)}.csv`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      setError('Failed to export CSV. Backend endpoint may not be implemented yet.');
      console.error('Error exporting CSV:', err);
    }
  };

  if (loading) return <div className="reading-list-container"><div className="loading">Loading readings...</div></div>;
  if (error) return <div className="reading-list-container"><div className="error-message">{error}</div></div>;

  return (
    <div className="reading-list-container">
      <h1 className="reading-list-title">CalmiPet Wellness Readings</h1>
      <div style={{ display: 'flex', gap: 12, marginBottom: 24 }}>
        <button 
          onClick={handleCreateReading}
          className="add-reading-button"
        >
          Add Test Reading
        </button>
        <button 
          onClick={handleExportCsv}
          className="add-reading-button"
        >
          Export CSV
        </button>
      </div>
      
      {readings.length === 0 ? (
        <p className="no-readings">No readings available. Click "Add Test Reading" to create one.</p>
      ) : (
        <div className="readings-grid">
          <h2 className="readings-section-title">Recent Readings</h2>
          {readings.map((reading) => (
            <div key={reading.id} className="reading-card">
              <p className="reading-item"><strong>Date:</strong> {reading.timestamp ? new Date(reading.timestamp).toLocaleString() : 'N/A'}</p>
              <p className="reading-item"><strong>Heart Rate:</strong> {Math.round(reading.heart_rate)} BPM</p>
              <p className="reading-item"><strong>HRV:</strong> {Math.round(reading.hrv)} ms</p>
              {reading.spo2 != null && <p className="reading-item"><strong>SpO₂:</strong> {Math.round(reading.spo2)}%</p>}
              <p className="reading-item"><strong>Stress:</strong> {reading.stress_level}/100</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default ReadingList;