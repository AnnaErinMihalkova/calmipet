import React from 'react';
import { Reading } from '../services/api';

const TrendChart: React.FC<{ readings: Reading[] }> = ({ readings }) => {
  const last = readings.slice(-20);
  const values = last.map((r) => r.hr_bpm || 0);
  const max = Math.max(100, ...values);
  return (
    <div style={{ padding: 16, border: '1px solid var(--border-color)', borderRadius: 12 }}>
      <div style={{ marginBottom: 8, fontWeight: 600 }}>Trend (BPM)</div>
      <div style={{ display: 'flex', alignItems: 'flex-end', gap: 6, height: 120 }}>
        {values.map((v, i) => (
          <div key={i} title={`${v} bpm`} style={{ width: 10, height: Math.max(4, Math.round((v / max) * 110)), background: 'var(--accent-color)', borderRadius: 6 }} />
        ))}
      </div>
    </div>
  );
};

export default TrendChart;