import React from 'react';
import { readingService, Reading } from '../services/api';
import { authService } from '../services/auth';
import TrendChart from './TrendChart';
import PetCard from './PetCard';
import BreathingCoach from './BreathingCoach';
import CircularLogo from './CircularLogo';
import { startSimulator } from '../services/bracelet-simulator';

// Helper function to generate fallback readings (#11)
const generateFallbackReadings = (): Reading[] => {
  const now = Date.now();
  const count = 12;
  const intervalMs = 5 * 60 * 1000;
  const baseHr = 78;
  const baseHrv = 40;
  return Array.from({ length: count }, (_, i) => ({
    heart_rate: Math.max(60, Math.min(100, Math.round(baseHr + (Math.random() - 0.5) * 12))),
    stress_level: Math.max(20, Math.min(80, Math.round(baseHrv + (Math.random() - 0.5) * 16))),
    timestamp: new Date(now - (count - i) * intervalMs).toISOString(),
  })) as Reading[];
};

const Dashboard: React.FC = () => {
  const [readings, setReadings] = React.useState<Reading[]>([]);
  const [loading, setLoading] = React.useState<boolean>(true);
  const [error, setError] = React.useState<string | null>(null);
  const [coachOpen, setCoachOpen] = React.useState<boolean>(false);
  const [username, setUsername] = React.useState<string>('');
  const [authed, setAuthed] = React.useState<boolean>(false);

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
      const data = await readingService.getReadings();
      if (!Array.isArray(data) || data.length === 0) {
        setReadings(generateFallbackReadings());
      } else {
        setReadings(data);
      }
      setError(null);
    } catch (e) {
      setReadings(generateFallbackReadings());
      setError(null);
    } finally {
      setLoading(false);
    }
  };

  React.useEffect(() => {
    authService.getMe().then((u) => {
      setUsername(u.username);
      setAuthed(true);
      fetchReadings();
    }).catch(() => {
      setAuthed(false);
      fetchReadings();
    });
  }, []);

  React.useEffect(() => {
    if (!authed) return;
    startSimulator(6000);
    const loop = setInterval(() => { fetchReadings(); }, 6000);
    return () => { clearInterval(loop); };
  }, [authed]);

  const addTestReading = async () => {
    try {
      const created = await readingService.createReading({
        heart_rate: Math.floor(Math.random() * 40) + 60,
        stress_level: Math.floor(Math.random() * 50) + 20,
      });
      // Optimistic update
      setReadings((r) => [...r, { ...created, id: Date.now(), hrv: 0, heart_rate: 60, stress_level: 20, timestamp: new Date().toISOString() }]);
      fetchReadings();
    } catch (e) {
      setError('Failed to create reading');
    }
  };

  const last = readings[readings.length - 1];
  const heartRate = last?.heart_rate ?? null;
  const hrv = last?.stress_level ?? null;

  const stressLabel = hrv == null ? 'Unknown' : hrv < 30 ? 'High' : hrv < 50 ? 'Medium' : 'Low';
  const coherenceLabel = hrv == null ? 'Unknown' : hrv >= 60 ? 'High' : hrv >= 40 ? 'Medium' : 'Low';

  const [dailyOpen, setDailyOpen] = React.useState<boolean>(false);
  const todayStart = new Date(); todayStart.setHours(0,0,0,0);
  const todayEnd = new Date(); todayEnd.setHours(23,59,59,999);
  const todayReadings = readings.filter(r => {
    if (!r.timestamp) return false;
    const d = new Date(r.timestamp);
    return d >= todayStart && d <= todayEnd;
  });
  const dayBpmAvg = todayReadings.length ? Math.round(todayReadings.reduce((s, r) => s + (r.heart_rate || 0), 0) / todayReadings.length) : null;
  const dayBpmMin = todayReadings.length ? Math.min(...todayReadings.map(r => r.heart_rate || 0)) : null;
  const dayBpmMax = todayReadings.length ? Math.max(...todayReadings.map(r => r.heart_rate || 0)) : null;
  const dayMood = (() => {
    const avgHrv = todayReadings.length ? (todayReadings.reduce((s, r) => s + (r.stress_level || 0), 0) / todayReadings.length) : null;
    if (avgHrv == null) return 'Unknown';
    return avgHrv < 30 ? 'High' : avgHrv < 50 ? 'Medium' : 'Low';
  })();

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
          <div style={{ width: 80, height: 80 }}>
            <CircularLogo size={80} />
          </div>
        </div>
      </div>

      <div style={{
        background: 'var(--bg-secondary)',
        border: '1px solid var(--border-color)',
        borderRadius: 18,
        padding: 20,
        boxShadow: 'var(--shadow-lg)',
        marginBottom: 16,
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 20 }}>
          <div style={{ flex: 1, borderRight: '1px solid var(--border-color)', paddingRight: 16 }}>
            <div style={{ color: 'var(--text-secondary)', fontSize: 13, marginBottom: 4 }}>Heart Rate</div>
            <div style={{ fontSize: 32, fontWeight: 800, color: 'var(--accent-primary)' }}>
              {heartRate ? `${heartRate}` : '--'}
              <span style={{ fontSize: 16, color: 'var(--text-secondary)', fontWeight: 600, marginLeft: 4 }}>BPM</span>
            </div>
          </div>
          <div style={{ flex: 1, paddingLeft: 16 }}>
            <div style={{ color: 'var(--text-secondary)', fontSize: 13, marginBottom: 4 }}>HRV (Stress)</div>
            <div style={{ fontSize: 32, fontWeight: 800, color: 'var(--accent-secondary)' }}>
              {hrv ? `${Math.round(hrv)}` : '--'}
              <span style={{ fontSize: 16, color: 'var(--text-secondary)', fontWeight: 600, marginLeft: 4 }}>ms</span>
            </div>
          </div>
        </div>
        <div style={{ display: 'flex', gap: 8, marginTop: 16 }}>
          <div style={{
            background: 'var(--bg-tertiary)', padding: '6px 12px', borderRadius: 12, fontSize: 13, fontWeight: 600, color: 'var(--text-secondary)'
          }}>
            Status: <span style={{ color: 'var(--text-primary)' }}>{stressLabel} Stress</span>
          </div>
          <div style={{
            background: 'var(--bg-tertiary)', padding: '6px 12px', borderRadius: 12, fontSize: 13, fontWeight: 600, color: 'var(--text-secondary)'
          }}>
            Coherence: <span style={{ color: 'var(--text-primary)' }}>{coherenceLabel}</span>
          </div>
        </div>
      </div>

      <PetCard hrv={hrv} />

      <div style={{
        background: 'var(--bg-secondary)',
        border: '1px solid var(--border-color)',
        borderRadius: 18,
        padding: 20,
        boxShadow: 'var(--shadow-lg)',
        marginBottom: 16,
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <div style={{ fontSize: 18, fontWeight: 700 }}>HRV Trend</div>
          <div style={{ fontSize: 13, color: 'var(--text-secondary)', fontWeight: 600 }}>Last 20 readings</div>
        </div>
        <div style={{ height: 140, margin: '0 -10px' }}>
          <TrendChart readings={readings.slice(-20)} />
        </div>
      </div>

      <div style={{ display: 'flex', gap: 12, marginBottom: 16 }}>
        <button
          onClick={() => setCoachOpen(true)}
          style={{
            flex: 1,
            background: 'var(--accent-primary)',
            color: 'white',
            border: 'none',
            padding: 16,
            borderRadius: 16,
            fontSize: 16,
            fontWeight: 700,
            cursor: 'pointer',
            boxShadow: '0 4px 12px rgba(99, 102, 241, 0.3)',
          }}
        >
          Breathe
        </button>
        <button
          onClick={() => setDailyOpen(true)}
          style={{
            flex: 1,
            background: 'var(--bg-secondary)',
            color: 'var(--text-primary)',
            border: '1px solid var(--border-color)',
            padding: 16,
            borderRadius: 16,
            fontSize: 16,
            fontWeight: 700,
            cursor: 'pointer',
          }}
        >
          Daily Summary
        </button>
      </div>

      <div style={{
        background: 'var(--bg-secondary)',
        border: '1px solid var(--border-color)',
        borderRadius: 18,
        padding: 20,
        boxShadow: 'var(--shadow-lg)',
        marginBottom: 16,
      }}>
        <div style={{ fontSize: 16, fontWeight: 700, marginBottom: 12 }}>Settings & Debug</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <button
            onClick={addTestReading}
            style={{
              background: 'var(--bg-tertiary)',
              color: 'var(--text-primary)',
              border: '1px solid var(--border-color)',
              padding: '12px 16px',
              borderRadius: 12,
              fontSize: 14,
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            Add Test Reading
          </button>
          <button
            onClick={handleLogout}
            style={{
              background: 'var(--bg-tertiary)',
              color: 'var(--text-primary)',
              border: '1px solid var(--border-color)',
              padding: '12px 16px',
              borderRadius: 12,
              fontSize: 14,
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            Log Out
          </button>
          <button
            onClick={handleDelete}
            style={{
              background: 'transparent',
              color: '#ef4444',
              border: '1px solid rgba(239, 68, 68, 0.3)',
              padding: '12px 16px',
              borderRadius: 12,
              fontSize: 14,
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            Delete Account
          </button>
        </div>
      </div>

      {coachOpen && (
        <div style={{
          position: 'fixed',
          top: 0, left: 0, right: 0, bottom: 0,
          background: 'var(--bg-primary)',
          zIndex: 100,
          display: 'flex',
          flexDirection: 'column',
        }}>
          <BreathingCoach onClose={() => setCoachOpen(false)} />
        </div>
      )}

      {dailyOpen && (
        <div style={{
          position: 'fixed',
          top: 0, left: 0, right: 0, bottom: 0,
          background: 'var(--bg-primary)',
          zIndex: 100,
          display: 'flex',
          flexDirection: 'column',
          padding: 20,
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
            <div style={{ fontSize: 24, fontWeight: 800 }}>Daily Summary</div>
            <button onClick={() => setDailyOpen(false)} style={{
              background: 'var(--bg-secondary)', border: 'none', width: 40, height: 40, borderRadius: 20, color: 'var(--text-primary)', fontSize: 20, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center'
            }}>×</button>
          </div>

          <div style={{
            background: 'var(--bg-secondary)', borderRadius: 18, padding: 20, marginBottom: 16, border: '1px solid var(--border-color)'
          }}>
            <div style={{ color: 'var(--text-secondary)', fontSize: 14, marginBottom: 16 }}>Today's Overview</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--text-secondary)' }}>Readings Today</span>
                <span style={{ fontWeight: 700 }}>{todayReadings.length}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--text-secondary)' }}>Avg Heart Rate</span>
                <span style={{ fontWeight: 700 }}>{dayBpmAvg ? `${dayBpmAvg} BPM` : '--'}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--text-secondary)' }}>Heart Rate Range</span>
                <span style={{ fontWeight: 700 }}>{dayBpmMin && dayBpmMax ? `${dayBpmMin} - ${dayBpmMax}` : '--'}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--text-secondary)' }}>Average Mood</span>
                <span style={{ fontWeight: 700 }}>{dayMood} Stress</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;