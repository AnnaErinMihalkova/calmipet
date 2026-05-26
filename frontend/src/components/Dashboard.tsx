import React from 'react';
import { useNavigate } from 'react-router-dom';
import { readingService, Reading } from '../services/api';
import { authService } from '../services/auth';
import TrendChart from './TrendChart';
import PetCard from './PetCard';
import BreathingCoach from './BreathingCoach';
import CircularLogo from './CircularLogo';
import BleDevicePanel from './BleDevicePanel';
import { useVitals } from '../contexts/VitalsContext';

const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  const [readings, setReadings] = React.useState<Reading[]>([]);
  const [loading, setLoading] = React.useState<boolean>(true);
  const [error, setError] = React.useState<string | null>(null);
  const [coachOpen, setCoachOpen] = React.useState<boolean>(false);
  const [username, setUsername] = React.useState<string>('');
  const [authed, setAuthed] = React.useState<boolean>(() => authService.isAuthenticated());
  const [bleConnected, setBleConnected] = React.useState<boolean>(false);
  const { vitals } = useVitals();
  const isFetching = React.useRef(false);

  const handleLogout = async () => {
    try { await authService.logout(); } catch {}
    try { localStorage.removeItem('hb_onboarded'); } catch {}
    navigate('/');
  };

  const handleDelete = async () => {
    if (!window.confirm('Delete your account? This cannot be undone.')) return;
    try { await authService.deleteAccount(); } catch {}
    try { localStorage.clear(); } catch {}
    navigate('/');
  };

  const fetchReadings = async () => {
    if (isFetching.current) return;
    try {
      isFetching.current = true;
      setLoading(true);
      const data = await readingService.getReadings();
      if (Array.isArray(data)) {
        setReadings(data);
      }
      setError(null);
    } catch (e: any) {
      // Suppress network suspension noise in UI
      if (e.code === 'ERR_NETWORK_IO_SUSPENDED') {
        console.debug('[Dashboard] Network suspended, skipping this update.');
      } else {
        console.warn('[Dashboard] Fetch error:', e);
      }
      setError(null);
    } finally {
      setLoading(false);
      isFetching.current = false;
    }
  };

  const refreshAuthState = React.useCallback(() => {
    const hasToken = authService.isAuthenticated();
    setAuthed(hasToken);
    if (!hasToken) {
      setUsername('');
      return;
    }
    
    // If we have a token but no username, definitely fetch
    authService
      .getMe()
      .then((u) => {
        if (u.username) {
          setUsername(u.username);
        }
        setAuthed(true);
        fetchReadings();
        try {
          const raw = localStorage.getItem('hb_user_info');
          const info = raw ? JSON.parse(raw) : {};
          let changed = false;
          if (u.pet_type && info.petAnimal !== u.pet_type) {
            info.petAnimal = u.pet_type;
            changed = true;
          }
          // Also sync other profile info to localStorage
          if (u.age !== undefined) info.age = u.age;
          if (u.gender !== undefined) info.gender = u.gender;
          if (u.baseline_hr !== undefined) info.baselineHr = u.baseline_hr;
          
          if (changed || u.age !== undefined || u.gender !== undefined || u.baseline_hr !== undefined) {
            localStorage.setItem('hb_user_info', JSON.stringify(info));
            if (changed) window.dispatchEvent(new Event('calmipet-pet-changed'));
          }
        } catch (e) {
          console.warn('[Dashboard] Failed to sync pet info:', e);
        }
      })
      .catch((err: { response?: { status?: number } }) => {
        console.error('[Dashboard] refreshAuthState failed:', err);
        if (err.response?.status === 401 || err.response?.status === 404) {
          authService.logout();
          setAuthed(false);
        } else {
          setAuthed(true);
        }
        fetchReadings();
      });
  }, []);

  React.useEffect(() => {
    refreshAuthState();
    const onAuthChanged = () => refreshAuthState();
    window.addEventListener('calmipet-auth-changed', onAuthChanged);
    window.addEventListener('storage', onAuthChanged);
    return () => {
      window.removeEventListener('calmipet-auth-changed', onAuthChanged);
      window.removeEventListener('storage', onAuthChanged);
    };
  }, [refreshAuthState]);

  React.useEffect(() => {
    if (!authed) return;
    
    // If Bluetooth is connected, the BleDevicePanel will trigger fetchReadings()
    // via onReadingPosted whenever a new data point is saved. 
    // We only need a slow fallback poll for other background updates.
    const interval = bleConnected ? 30000 : 10000;
    
    const loop = setInterval(() => { fetchReadings(); }, interval);
    return () => clearInterval(loop);
  }, [authed, bleConnected]);

  const addTestReading = async () => {
    try {
      await readingService.createReading({
        heart_rate: Math.floor(Math.random() * 40) + 60,
        stress_level: Math.floor(Math.random() * 50) + 20,
      });
      fetchReadings();
    } catch (e) {
      setError('Failed to create reading');
    }
  };

  const last = readings[readings.length - 1];
  
  // Prefer live vitals from Bluetooth if connected
  const heartRate = bleConnected ? vitals.heartRate : (last?.heart_rate ?? null);
  const hrvMs = bleConnected ? vitals.hrv : (last?.hrv ?? null);
  const stressScore = bleConnected ? vitals.stressLevel : (last?.stress_level ?? null);
  const spo2Value = bleConnected ? vitals.spo2 : null;
  
  const heartRateInt = heartRate == null ? null : Math.round(heartRate);

  const stressLabel = (() => {
    const score = stressScore;
    if (score == null) return 'Unknown';
    if (score >= 65) return 'High';
    if (score >= 35) return 'Medium';
    return 'Low';
  })();
  
  const coherenceLabel = hrvMs == null ? 'Unknown' : hrvMs >= 60 ? 'High' : hrvMs >= 40 ? 'Medium' : 'Low';

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
    const avgStress = todayReadings.length
      ? todayReadings.reduce((s, r) => s + (r.stress_level || 0), 0) / todayReadings.length
      : null;
    if (avgStress == null) return 'Unknown';
    return avgStress >= 65 ? 'High' : avgStress >= 35 ? 'Medium' : 'Low';
  })();

  return (
    <div className="content" style={{ padding: 20 }}>
      {loading && (
        <p style={{ color: 'var(--text-secondary)', fontSize: 13, marginBottom: 12 }}>Loading readings…</p>
      )}
      {error && (
        <p style={{ color: '#ef4444', fontSize: 13, marginBottom: 12 }}>{error}</p>
      )}
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
        position: 'relative',
      }}>
        {bleConnected && (
          <div style={{
            position: 'absolute',
            top: 12,
            right: 12,
            background: 'var(--accent-primary)',
            color: 'white',
            fontSize: 10,
            fontWeight: 800,
            padding: '2px 8px',
            borderRadius: 8,
            textTransform: 'uppercase',
            letterSpacing: 0.5,
          }}>
            Live
          </div>
        )}
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 20 }}>
          <div style={{ flex: 1, borderRight: '1px solid var(--border-color)', paddingRight: 16 }}>
            <div style={{ color: 'var(--text-secondary)', fontSize: 13, marginBottom: 4 }}>Heart Rate</div>
            <div style={{ fontSize: 32, fontWeight: 800, color: 'var(--accent-primary)' }}>
              {heartRateInt == null ? '--' : `${heartRateInt}`}
              <span style={{ fontSize: 16, color: 'var(--text-secondary)', fontWeight: 600, marginLeft: 4 }}>BPM</span>
            </div>
          </div>
          <div style={{ flex: 1, borderRight: '1px solid var(--border-color)', paddingLeft: 16, paddingRight: 16 }}>
            <div style={{ color: 'var(--text-secondary)', fontSize: 13, marginBottom: 4 }}>SpO₂</div>
            <div style={{ fontSize: 32, fontWeight: 800, color: '#ef4444' }}>
              {spo2Value != null ? `${spo2Value}` : '--'}
              <span style={{ fontSize: 16, color: 'var(--text-secondary)', fontWeight: 600, marginLeft: 4 }}>%</span>
            </div>
          </div>
          <div style={{ flex: 1, paddingLeft: 16 }}>
            <div style={{ color: 'var(--text-secondary)', fontSize: 13, marginBottom: 4 }}>HRV</div>
            <div style={{ fontSize: 32, fontWeight: 800, color: 'var(--accent-secondary)' }}>
              {hrvMs != null ? `${Math.round(hrvMs)}` : '--'}
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

      <PetCard hrv={hrvMs} heartRate={heartRateInt} stressScore={stressScore} />

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
        <div style={{ fontSize: 16, fontWeight: 700, marginBottom: 12 }}>ESP32 Bluetooth</div>
        <BleDevicePanel
          enabled={authed}
          onConnectionChange={setBleConnected}
          onReadingPosted={fetchReadings}
        />
        <div style={{ fontSize: 16, fontWeight: 700, margin: '20px 0 12px' }}>Settings & Debug</div>
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