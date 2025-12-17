import React from 'react';
import { readingService, Reading } from '../services/api';
import { authService } from '../services/auth';
import TrendChart from './TrendChart';
import PetCard from './PetCard';
import BreathingCoach from './BreathingCoach';

const Dashboard: React.FC = () => {
  const [readings, setReadings] = React.useState<Reading[]>([]);
  const [loading, setLoading] = React.useState<boolean>(true);
  const [error, setError] = React.useState<string | null>(null);
  const [coachOpen, setCoachOpen] = React.useState<boolean>(false);
  const [username, setUsername] = React.useState<string>('');
  const handleLogout = async () => {
    try { await authService.logout(); } catch {}
    try { localStorage.removeItem('hb_onboarded'); } catch {}
    window.location.hash = 'home';
    window.location.reload();
  };
  const handleDelete = async () => {
    if (!window.confirm('Delete your account? This cannot be undone.')) return;
    try { await authService.deleteAccount(); } catch {}
    try { localStorage.clear(); } catch {}
    window.location.hash = 'home';
    window.location.reload();
  };

  const fetchReadings = async () => {
    try {
      setLoading(true);
      const data = await readingService.getAllReadings();
      setReadings(data);
      setError(null);
    } catch (e) {
      setError('Failed to fetch readings');
    } finally {
      setLoading(false);
    }
  };

  React.useEffect(() => { fetchReadings(); authService.me().then((u) => setUsername(u.username)).catch(() => setUsername('')); }, []);

  const addTestReading = async () => {
    try {
      const created = await readingService.createReading({
        hr_bpm: Math.floor(Math.random() * 40) + 60,
        hrv_rmssd: Math.floor(Math.random() * 50) + 20,
      });
      setReadings((r) => [...r, created]);
    } catch (e) {
      setError('Failed to create reading');
    }
  };

  const last = readings[readings.length - 1];
  const heartRate = last?.hr_bpm ?? null;
  const hrv = last?.hrv_rmssd ?? null;
  const stressLabel = hrv == null ? 'Unknown' : hrv < 30 ? 'High' : hrv < 50 ? 'Medium' : 'Low';
  const coherenceLabel = hrv == null ? 'Unknown' : hrv >= 60 ? 'High' : hrv >= 40 ? 'Medium' : 'Low';

  return (
    <div className="content" style={{ padding: 20 }}>
      <div style={{
        background: 'var(--bg-secondary)',
        border: '1px solid var(--border-color)',
        borderRadius: 18,
        padding: 20,
        boxShadow: 'var(--shadow-lg)',
        marginBottom: 16,
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <div style={{ color: 'var(--text-secondary)', fontSize: 14 }}>MindRaccoon</div>
            <div style={{ fontSize: 24, fontWeight: 800 }}>Hello{username ? `, ${username}` : ''}</div>
            <div style={{ color: 'var(--text-secondary)', marginTop: 4, fontSize: 14 }}>Your biofeedback is {readings.length ? 'active' : 'waiting'}</div>
          </div>
          <div style={{ width: 80, height: 80, borderRadius: '50%', background: 'radial-gradient(60% 60% at 50% 50%, rgba(124,58,237,0.25), transparent)', display: 'grid', placeItems: 'center', border: '2px solid var(--border-color)' }}>
            <div style={{ width: 48, height: 48, borderRadius: '50%', background: 'var(--bg-tertiary)' }} />
          </div>
        </div>
      </div>

      <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', marginBottom: 12 }}>
        <button className="ghost-cta" onClick={handleLogout}>Log Out</button>
        <button className="ghost-cta" onClick={handleDelete} style={{ color: 'var(--accent-color)' }}>Delete Account</button>
      </div>

      <div style={{ display: 'grid', placeItems: 'center', marginBottom: 12 }}>
        <div style={{ width: 220, height: 220, borderRadius: '50%', background: 'radial-gradient(60% 60% at 50% 50%, rgba(124,58,237,0.25), transparent)', display: 'grid', placeItems: 'center', border: '2px solid var(--border-color)' }}>
          <svg viewBox="0 0 200 200" width="160" height="160">
            <circle cx="100" cy="110" r="46" fill="#2c2c2c" />
            <path d="M60 110c8-24 30-40 40-40c10 0 32 16 40 40" fill="#1f1f1f" />
            <circle cx="85" cy="118" r="12" fill="#ffffff" />
            <circle cx="115" cy="118" r="12" fill="#ffffff" />
            <circle cx="85" cy="118" r="6" fill="#1a1a1a">
              <animate attributeName="r" values="6;5;6" dur="2s" repeatCount="indefinite" />
            </circle>
            <circle cx="115" cy="118" r="6" fill="#1a1a1a">
              <animate attributeName="r" values="6;5;6" dur="2s" repeatCount="indefinite" />
            </circle>
            <ellipse cx="100" cy="128" rx="8" ry="6" fill="#1a1a1a" />
            <path d="M80 88l16-16" stroke="#2c2c2c" strokeWidth="8" strokeLinecap="round">
              <animateTransform attributeName="transform" type="rotate" values="-3 88 80;3 88 80;-3 88 80" dur="4s" repeatCount="indefinite" />
            </path>
            <path d="M120 88l-16-16" stroke="#2c2c2c" strokeWidth="8" strokeLinecap="round">
              <animateTransform attributeName="transform" type="rotate" values="3 112 80;-3 112 80;3 112 80" dur="4s" repeatCount="indefinite" />
            </path>
            <path d="M140 140c20 10 26 18 26 24" stroke="#2c2c2c" strokeWidth="6" fill="none">
              <animateTransform attributeName="transform" type="rotate" values="-10 140 140;10 140 140;-10 140 140" dur="3s" repeatCount="indefinite" />
            </path>
          </svg>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 12, marginBottom: 12 }}>
        <div style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-color)', borderRadius: 16, padding: 16 }}>
          <div style={{ color: 'var(--text-secondary)', fontSize: 12, marginBottom: 6 }}>Heart Rate</div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
            <div style={{ fontSize: 28, fontWeight: 800 }}>{heartRate ?? '--'}</div>
            <div style={{ color: 'var(--text-secondary)' }}>BPM</div>
          </div>
        </div>
        <div style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-color)', borderRadius: 16, padding: 16 }}>
          <div style={{ color: 'var(--text-secondary)', fontSize: 12, marginBottom: 6 }}>Stress</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{ fontSize: 18, fontWeight: 700 }}>{stressLabel}</div>
            <div style={{ height: 6, flex: 1, background: 'var(--border-color)', borderRadius: 3 }}>
              <div style={{ width: hrv == null ? '0%' : hrv < 30 ? '80%' : hrv < 50 ? '50%' : '20%', height: 6, background: 'var(--accent-color)', borderRadius: 3 }} />
            </div>
          </div>
        </div>
        <div style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-color)', borderRadius: 16, padding: 16 }}>
          <div style={{ color: 'var(--text-secondary)', fontSize: 12, marginBottom: 6 }}>Coherence</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{ fontSize: 18, fontWeight: 700 }}>{coherenceLabel}</div>
            <div style={{ width: 18, height: 18, borderRadius: '50%', background: 'var(--accent-color)' }} />
          </div>
        </div>
      </div>

      <div style={{ display: 'flex', gap: 12, marginBottom: 12 }}>
        <button className="primary-cta" onClick={() => setCoachOpen(true)}>Start Breathing</button>
        <button className="ghost-cta" onClick={addTestReading}>Log Mood</button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
        <PetCard />
        <TrendChart readings={readings} />
      </div>

      <div style={{ marginTop: 16 }}>
        {loading ? 'Loading readings…' : error ? error : ''}
      </div>

      <BreathingCoach open={coachOpen} onClose={() => setCoachOpen(false)} onCompleted={() => fetchReadings()} />
    </div>
  );
};

export default Dashboard;