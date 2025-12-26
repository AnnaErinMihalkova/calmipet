import React, { useState, useEffect } from 'react';
import { readingService, Reading, CreateReading } from '../services/api';
import { authService } from '../services/auth';
import './ReadingList.css';

const ReadingList: React.FC = () => {
  const [readings, setReadings] = useState<Reading[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    authService.me().then(() => {
      fetchReadings();
    }).catch(() => {
      setError('Please log in to view readings');
      setLoading(false);
    });
  }, []);

  const fetchReadings = async () => {
    try {
      setLoading(true);
      const data = await readingService.getAllReadings();
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
      const newReading: CreateReading = {
        hr_bpm: Math.floor(Math.random() * 40) + 60,
        hrv_rmssd: Math.floor(Math.random() * 50) + 20,
      };
      
      const created = await readingService.createReading(newReading);
      setReadings([...readings, created]);
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
      setError('Failed to export CSV');
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
              <p className="reading-item"><strong>Date:</strong> {reading.ts ? new Date(reading.ts).toLocaleString() : 'N/A'}</p>
              <p className="reading-item"><strong>Heart Rate:</strong> {reading.hr_bpm} BPM</p>
              <p className="reading-item"><strong>HRV:</strong> {reading.hrv_rmssd} ms</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default ReadingList;
