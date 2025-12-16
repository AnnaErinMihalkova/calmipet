import React from 'react';
import { wellnessService } from '../services/api';
import './Login.css';

type Props = {
  open: boolean;
  onClose: () => void;
  onCompleted: () => void;
};

const BreathingCoach: React.FC<Props> = ({ open, onClose, onCompleted }) => {
  const [sessionId, setSessionId] = React.useState<number | null>(null);
  const [secondsLeft, setSecondsLeft] = React.useState<number>(60);
  const [running, setRunning] = React.useState<boolean>(false);

  React.useEffect(() => {
    if (!open) return;
    setSessionId(null);
    setSecondsLeft(60);
    setRunning(false);
  }, [open]);

  React.useEffect(() => {
    if (!running) return;
    const interval = setInterval(() => {
      setSecondsLeft((s) => s - 1);
    }, 1000);
    return () => clearInterval(interval);
  }, [running]);

  React.useEffect(() => {
    if (secondsLeft === 0 && running && sessionId) {
      wellnessService.completeBreathingSession(sessionId).then(() => {
        setRunning(false);
        onCompleted();
        onClose();
      }).catch(() => {
        setRunning(false);
        onClose();
      });
    }
  }, [secondsLeft, running, sessionId, onClose, onCompleted]);

  const start = async () => {
    const res = await wellnessService.createBreathingSession();
    setSessionId(res.id);
    setRunning(true);
  };

  if (!open) return null;

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 2000 }}>
      <div className="login-card" style={{ maxWidth: 480 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h2 style={{ marginTop: 0 }}>Calming Breath</h2>
          <div style={{ color: 'var(--text-secondary)' }}>{running ? 'Listening' : 'Idle'}</div>
        </div>

        <div style={{ display: 'grid', placeItems: 'center', margin: '16px 0 12px' }}>
          <div style={{
            width: 220,
            height: 220,
            borderRadius: '50%',
            background: 'radial-gradient(60% 60% at 50% 50%, rgba(124,58,237,0.25), transparent)',
            display: 'grid',
            placeItems: 'center',
            boxShadow: '0 0 40px rgba(124,58,237,0.3) inset'
          }}>
            <div style={{ width: 160, height: 160, borderRadius: '50%', background: 'var(--bg-tertiary)', border: '2px solid var(--border-color)', display: 'grid', placeItems: 'center' }}>
              <div style={{ fontSize: 36, fontWeight: 800 }}>{secondsLeft}s</div>
            </div>
          </div>
        </div>

        <div style={{ textAlign: 'center', marginBottom: 16, fontSize: 18, fontWeight: 700 }}>
          {running ? (secondsLeft % 8 < 4 ? 'Inhale…' : 'Exhale…') : 'Press Start'}
        </div>

        <div style={{ display: 'grid', gap: 8, marginBottom: 12 }}>
          <div style={{ color: 'var(--text-secondary)' }}>Calmness Level</div>
          <div style={{ height: 8, background: 'var(--border-color)', borderRadius: 4 }}>
            <div style={{ width: running ? `${Math.max(0, 100 - secondsLeft)}%` : '0%', height: 8, borderRadius: 4, background: 'linear-gradient(90deg, var(--accent-color), var(--accent-hover))' }} />
          </div>
          <div style={{ color: 'var(--accent-color)', fontSize: 12 }}>{running ? 'Rising' : 'Ready'}</div>
        </div>

        <div style={{ display: 'flex', gap: 12 }}>
          {!running && <button className="login-button" onClick={start}>Start</button>}
          {running && <button className="login-button" onClick={onClose}>End</button>}
          {!running && <button className="ghost-cta" onClick={onClose}>Cancel</button>}
        </div>
      </div>
    </div>
  );
};

export default BreathingCoach;