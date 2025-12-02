import React, { useState, useEffect } from 'react';
import { readingService, Reading } from '../services/api';

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

  if (loading) return <div>Loading readings...</div>;
  if (error) return <div>Error: {error}</div>;

  return (
    <div style={{ padding: '20px' }}>
      <h1>CalmiPet Wellness Readings</h1>
      <button 
        onClick={handleCreateReading}
        style={{
          padding: '10px 20px',
          backgroundColor: '#4CAF50',
          color: 'white',
          border: 'none',
          borderRadius: '4px',
          cursor: 'pointer',
          marginBottom: '20px'
        }}
      >
        Add Test Reading
      </button>
      
      {readings.length === 0 ? (
        <p>No readings available. Click "Add Test Reading" to create one.</p>
      ) : (
        <div>
          <h2>Recent Readings</h2>
          {readings.map((reading) => (
            <div key={reading.id} style={{
              border: '1px solid #ddd',
              padding: '15px',
              marginBottom: '10px',
              borderRadius: '8px',
              backgroundColor: '#f9f9f9'
            }}>
              <p><strong>Date:</strong> {new Date(reading.ts).toLocaleString()}</p>
              <p><strong>Heart Rate:</strong> {reading.hr_bpm} BPM</p>
              <p><strong>HRV:</strong> {reading.hrv_rmssd} ms</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default ReadingList;