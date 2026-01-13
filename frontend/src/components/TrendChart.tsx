import React from 'react';
import { Reading } from '../services/api';

const TrendChart: React.FC<{ readings: Reading[]; smooth?: boolean; window?: number }> = ({ readings, smooth = false, window = 5 }) => {
  const last = readings.slice(-20);
  const rawValues = last.map((r) => r.hr_bpm || 0);
  const values = React.useMemo(() => {
    if (!smooth) return rawValues;
    const w = Math.max(1, Math.min(window, rawValues.length || 1));
    const out: number[] = [];
    for (let i = 0; i < rawValues.length; i++) {
      const start = Math.max(0, i - (w - 1));
      let sum = 0;
      let count = 0;
      for (let j = start; j <= i; j++) {
        sum += rawValues[j];
        count++;
      }
      out.push(Math.round(sum / count));
    }
    return out;
  }, [rawValues, smooth, window]);
  const max = Math.max(100, ...values);
  return (
    <div
      style={{
        padding: 16,
        border: '1px solid var(--border-color)',
        borderRadius: 12,
        maxWidth: '100%',
        overflow: 'hidden',
      }}
    >
      <div style={{ marginBottom: 8, fontWeight: 600 }}>Trend (BPM)</div>
      <div
        style={{
          display: 'flex',
          alignItems: 'flex-end',
          gap: 4,
          height: 120,
          width: '100%',
          overflow: 'hidden',
          justifyContent: 'space-between',
        }}
      >
        {values.map((v, i) => (
          <div
            key={i}
            title={`${v} bpm`}
            style={{
              flex: 1,
              minWidth: 4,
              maxWidth: 12,
              height: Math.max(4, Math.round((v / max) * 110)),
              background: 'var(--accent-color)',
              borderRadius: 6,
            }}
          />
        ))}
      </div>
    </div>
  );
};

export default TrendChart;
