import { readingService } from './api'; 
import { authService } from './auth'; 
 
let simulatorInterval: ReturnType<typeof setInterval> | null = null; 
 
// --------------------------------------------------------------------------- 
// Cache is cleared on logout via clearCachedUser() (#26) 
// --------------------------------------------------------------------------- 
let cachedUserId: string | null = null; 
 
export function clearCachedUser(): void { 
  cachedUserId = null; 
} 
 
async function resolveUserId(): Promise<string | null> { 
  // Re-read from the auth service on every call so a stale cache 
  // cannot survive a logout (#26) 
  if (!cachedUserId) { 
    try { 
      const me = await authService.getMe(); 
      cachedUserId = me?.id?.toString() ?? null; 
    } catch { 
      cachedUserId = null; 
    } 
  } 
  return cachedUserId; 
} 
 
function generateReading() { 
  return { 
    heart_rate: 60 + Math.random() * 40, 
    hrv: 20 + Math.random() * 60, 
    stress_level: Math.random() * 80, 
  }; 
} 
 
export async function startSimulator(intervalMs = 5000): Promise<void> { 
  if (simulatorInterval !== null) return; // already running 
 
  simulatorInterval = setInterval(async () => { 
    const userId = await resolveUserId(); 
    if (!userId) { 
      stopSimulator(); // stop if user logged out (#26) 
      return; 
    } 
    try { 
      await readingService.createReading(generateReading()); 
    } catch (err) { 
      console.warn('[bracelet-simulator] Failed to post reading:', err); 
    } 
  }, intervalMs); 
} 
 
export function stopSimulator(): void { 
  if (simulatorInterval !== null) { 
    clearInterval(simulatorInterval); 
    simulatorInterval = null; 
  } 
  clearCachedUser(); // always clear on stop (#26) 
}