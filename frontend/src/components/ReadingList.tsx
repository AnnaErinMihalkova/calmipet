import React, { useState, useEffect } from 'react';
import { readingService, Reading } from '../services/api';
import './ReadingList.css';

const ReadingList: React.FC = () => {
  const [readings, setReadings] = useState<Reading[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchReadings();
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
      const newReading: Omit<Reading, 'id'> = {
        user: 1, // Default user ID for now
        ts: new Date().toISOString(),
        hr_bpm: Math.floor(Math.random() * 40) + 60, // Random heart rate 60-100
        hrv_rmssd: Math.floor(Math.random() * 50) + 20, // Random HRV 20-70
      };
      
      const created = await readingService.createReading(newReading);
      setReadings([...readings, created]);
    } catch (err) {
      setError('Failed to create reading');
      console.error('Error creating reading:', err);
    }
  };

  if (loading) return <div className="reading-list-container"><div className="loading">Loading readings...</div></div>;
  if (error) return <div className="reading-list-container"><div className="error-message">{error}</div></div>;

  return (
    <div className="reading-list-container">
      <h1 className="reading-list-title">CalmiPet Wellness Readings</h1>
      <button 
        onClick={handleCreateReading}
        className="add-reading-button"
      >
        Add Test Reading
      </button>
      
      {readings.length === 0 ? (
        <p className="no-readings">No readings available. Click "Add Test Reading" to create one.</p>
      ) : (
        <div className="readings-grid">
          <h2 className="readings-section-title">Recent Readings</h2>
          {readings.map((reading) => (
            <div key={reading.id} className="reading-card">
              <p className="reading-item"><strong>Date:</strong> {new Date(reading.ts).toLocaleString()}</p>
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