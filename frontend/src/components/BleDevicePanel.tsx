import React, { useEffect, useState } from 'react';
import {
  connectBle,
  disconnectBle,
  isBleSupported,
  isConnected,
  onPosted,
  onReading,
  onStatus,
  BleReading,
} from '../services/ble-device';
import { useVitals } from '../contexts/VitalsContext';

type Props = {
  enabled?: boolean;
  onBleConnected?: (connected: boolean) => void;
  /** @deprecated use onBleConnected */
  onConnectionChange?: (connected: boolean) => void;
  onReadingPosted?: () => void;
  onLiveReading?: (reading: BleReading) => void;
};

const BleDevicePanel: React.FC<Props> = ({
  enabled = true,
  onBleConnected,
  onConnectionChange,
  onReadingPosted,
  onLiveReading,
}) => {
  const [connected, setConnected] = useState(false);
  const [bpm, setBpm] = useState<number | null>(null);
  const [spo2, setSpo2] = useState<number | null>(null);
  const [hrv, setHrv] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const { setVitals } = useVitals();
  const [busy, setBusy] = useState(false);

  const supported = isBleSupported();

  const notifyConnection = (conn: boolean) => {
    onBleConnected?.(conn);
    onConnectionChange?.(conn);
  };

  useEffect(() => {
    onStatus((conn) => {
      setConnected(conn);
      notifyConnection(conn);
      if (!conn) {
        setBpm(null);
        setSpo2(null);
        setHrv(null);
      }
    });

    onReading((r: BleReading) => {
      if (r.heart_rate > 0) setBpm(r.heart_rate);
      if (r.spo2 > 0) setSpo2(Math.round(r.spo2));
      if (r.hrv > 0) setHrv(r.hrv);
      
      // Update global vitals
      setVitals({
        heartRate: r.heart_rate > 0 ? r.heart_rate : undefined,
        hrv: r.hrv > 0 ? r.hrv : undefined,
        spo2: r.spo2 > 0 ? Math.round(r.spo2) : undefined,
        stressLevel: r.stress_level,
      });

      onLiveReading?.(r);
    });

    onPosted(() => {
      onReadingPosted?.();
    });

    return () => {
      if (isConnected()) {
        disconnectBle();
      }
    };
  }, []);

  async function handleConnect() {
    if (!enabled) return;
    setError(null);
    setBusy(true);
    try {
      await connectBle();
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : 'Connection failed';
      setError(message);
      notifyConnection(false);
    } finally {
      setBusy(false);
    }
  }

  async function handleDisconnect() {
    setBusy(true);
    try {
      await disconnectBle();
    } finally {
      setBusy(false);
    }
  }

  if (!enabled) {
    return (
      <p style={{ color: 'var(--text-secondary)', fontSize: 13, margin: 0 }}>
        Log in to connect your ESP32 bracelet.
      </p>
    );
  }

  if (!supported) {
    return (
      <div>
        <p style={{ color: '#f59e0b', fontSize: 13, marginBottom: 8 }}>
          Web Bluetooth needs Chrome or Edge (desktop or Android). iOS Safari is not supported.
        </p>
      </div>
    );
  }

  const btnStyle: React.CSSProperties = {
    padding: '12px 16px',
    borderRadius: 12,
    fontSize: 14,
    fontWeight: 700,
    border: 'none',
    cursor: busy ? 'wait' : 'pointer',
    width: '100%',
  };

  return (
    <div>
      {connected ? (
        <>
          <div
            style={{
              display: 'flex',
              flexWrap: 'wrap',
              gap: 12,
              marginBottom: 12,
              fontSize: 14,
              fontWeight: 600,
            }}
          >
            <span>❤️ {bpm != null ? `${bpm} bpm` : '---'}</span>
            <span>🩸 SpO₂: {spo2 != null ? `${spo2}%` : '---'}</span>
            <span>📈 HRV: {hrv != null ? `${hrv} ms` : '---'}</span>
          </div>
          <button
            type="button"
            onClick={handleDisconnect}
            disabled={busy}
            style={{
              ...btnStyle,
              background: 'var(--bg-tertiary)',
              color: 'var(--text-primary)',
              border: '1px solid var(--border-color)',
            }}
          >
            {busy ? 'Disconnecting…' : 'Disconnect'}
          </button>
        </>
      ) : (
        <>
          <button
            type="button"
            onClick={handleConnect}
            disabled={busy}
            style={{
              ...btnStyle,
              background: 'var(--accent-primary)',
              color: '#fff',
              boxShadow: '0 4px 12px rgba(99, 102, 241, 0.3)',
            }}
          >
            {busy ? 'Connecting…' : 'Connect ESP32'}
          </button>
          {error && (
            <p style={{ color: '#ef4444', fontSize: 13, marginTop: 8 }}>{error}</p>
          )}
        </>
      )}
    </div>
  );
};

export default BleDevicePanel;
