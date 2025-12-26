/**
 * Bracelet Simulator Module
 * Simulates a wearable bracelet generating heart rate (HR) and optional HRV data
 */

import { readingService, CreateExternalReading } from './api';
import { authService } from './auth';

export interface BraceletReading {
  hr: number; // Heart rate in BPM
  hrv?: number; // Heart rate variability (optional)
  ts: string; // ISO timestamp
}

/**
 * Logs a bracelet reading to the console with timestamp and values
 * @param reading - The reading to log
 */
function logReading(reading: BraceletReading): void {
  const logMessage = `[Bracelet Reading] Timestamp: ${reading.ts}, HR: ${reading.hr} BPM${reading.hrv !== undefined ? `, HRV: ${reading.hrv}` : ''}`;
  console.log(logMessage);
}

/**
 * Generates a single reading with heart rate and optional HRV data
 * @param shouldLog - Whether to log the reading (default: true)
 * @returns A reading object with HR (60-100 BPM), optional HRV (20-100), and timestamp
 */
export function generateReading(shouldLog: boolean = true): BraceletReading {
  const hr = Math.floor(60 + Math.random() * 40); // 60–100 BPM
  const hrv = Math.floor(20 + Math.random() * 80); // 20-100 (optional)

  const reading: BraceletReading = {
    hr,
    hrv,
    ts: new Date().toISOString(),
  };

  // Log all generated readings
  if (shouldLog) {
    logReading(reading);
  }

  return reading;
}

/**
 * Callback type for reading generation
 */
export type ReadingCallback = (reading: BraceletReading) => void;

/**
 * Bracelet Simulator class that generates readings at regular intervals
 */
export class BraceletSimulator {
  private intervalId: NodeJS.Timeout | null = null;
  private intervalSeconds: number;
  private callback: ReadingCallback | null = null;
  private includeHRV: boolean;

  /**
   * Creates a new BraceletSimulator instance
   * @param intervalSeconds - Interval in seconds between readings (default: 5)
   * @param includeHRV - Whether to include HRV data (default: true)
   */
  constructor(intervalSeconds: number = 5, includeHRV: boolean = true) {
    this.intervalSeconds = intervalSeconds;
    this.includeHRV = includeHRV;
  }

  /**
   * Starts generating readings at the specified interval
   * @param callback - Function to call with each generated reading
   */
  start(callback: ReadingCallback): void {
    if (this.intervalId !== null) {
      console.warn('BraceletSimulator is already running');
      return;
    }

    this.callback = callback;

    // Generate initial reading immediately
    const reading = this.generateReading();
    callback(reading);

    // Then generate readings at intervals
    this.intervalId = setInterval(() => {
      const reading = this.generateReading();
      if (this.callback) {
        this.callback(reading);
      }
    }, this.intervalSeconds * 1000);
  }

  /**
   * Stops generating readings
   */
  stop(): void {
    if (this.intervalId !== null) {
      clearInterval(this.intervalId);
      this.intervalId = null;
      this.callback = null;
    }
  }

  /**
   * Checks if the simulator is currently running
   */
  isRunning(): boolean {
    return this.intervalId !== null;
  }

  /**
   * Updates the interval between readings
   * @param intervalSeconds - New interval in seconds
   */
  setInterval(intervalSeconds: number): void {
    this.intervalSeconds = intervalSeconds;
    // Restart if currently running
    if (this.isRunning() && this.callback) {
      this.stop();
      this.start(this.callback);
    }
  }

  /**
   * Generates a reading (internal method)
   */
  private generateReading(): BraceletReading {
    // Generate without logging first, then log the final reading after modifications
    const reading = generateReading(false);
    if (!this.includeHRV) {
      delete reading.hrv;
    }
    // Log the final reading that will be used
    logReading(reading);
    return reading;
  }
}

/**
 * Convenience function to create and start a simulator
 * @param intervalSeconds - Interval in seconds between readings
 * @param callback - Function to call with each generated reading
 * @param includeHRV - Whether to include HRV data
 * @returns The simulator instance
 */
export function createSimulator(
  intervalSeconds: number,
  callback: ReadingCallback,
  includeHRV: boolean = true
): BraceletSimulator {
  const simulator = new BraceletSimulator(intervalSeconds, includeHRV);
  simulator.start(callback);
  return simulator;
}

/**
 * Starts an interval-based loop that generates readings every N seconds
 * and automatically sends them to the backend API
 * @param intervalSeconds - Interval in seconds between readings (default: 5)
 * @param includeHRV - Whether to include HRV data (default: true)
 * @param onSuccess - Optional callback called when a reading is successfully sent
 * @param onError - Optional callback called when sending a reading fails
 * @returns The interval ID that can be used to stop the loop
 */
let cachedUserId: string | null = null;
function getUserIdSync(): string | null {
  try {
    const raw = localStorage.getItem('hb_user');
    if (!raw) return null;
    const u = JSON.parse(raw);
    if (u?.username) return String(u.username);
    if (u?.id) return String(u.id);
    return null;
  } catch {
    return null;
  }
}

export function startAutoSendLoop(
  intervalSeconds: number = 5,
  includeHRV: boolean = true,
  onSuccess?: (reading: BraceletReading) => void,
  onError?: (error: Error, reading: BraceletReading) => void
): NodeJS.Timeout {
  // Generate and send initial reading immediately
  const sendReading = async () => {
    // Generate without logging first, then log the final reading after modifications
    const reading = generateReading(false);
    
    // Remove HRV if not included
    if (!includeHRV) {
      delete reading.hrv;
    }
    
    // Log the final reading that will be sent
    logReading(reading);
    
    try {
      if (!cachedUserId) {
        cachedUserId = getUserIdSync();
      }
      if (!cachedUserId) {
        const u = await authService.me().catch(() => null);
        if (u && (u as any).username) {
          cachedUserId = String((u as any).username);
          try { localStorage.setItem('hb_user', JSON.stringify(u)); } catch {}
        }
      }
      if (!cachedUserId) throw new Error('Missing userId');
      const apiReading: CreateExternalReading = {
        userId: cachedUserId,
        hr: reading.hr,
        hrv: reading.hrv,
        timestamp: reading.ts,
      };
      await readingService.createReadingExternal(apiReading);
      console.log(`[Backend] Successfully sent reading to API (HR: ${reading.hr} BPM${reading.hrv !== undefined ? `, HRV: ${reading.hrv}` : ''})`);
      
      if (onSuccess) {
        onSuccess(reading);
      }
    } catch (error) {
      console.error(`[Backend] Failed to send reading (HR: ${reading.hr} BPM${reading.hrv !== undefined ? `, HRV: ${reading.hrv}` : ''}):`, error);
      
      if (onError) {
        onError(error instanceof Error ? error : new Error(String(error)), reading);
      }
    }
  };
  
  // Send initial reading
  sendReading();
  
  // Then send at intervals
  return setInterval(sendReading, intervalSeconds * 1000);
}

