/* ===================================================
   Trial Service — manage 3-game trial state
   =================================================== */

import properties from '../config/properties';
import { getToken } from '../auth/auth-service';

export interface TrialState {
  gamesPlayed: number;
  purchased: boolean;
  canPlay: boolean;
}

let cachedState: TrialState | null = null;

/**
 * Fetch trial status from the gateway.
 * Returns cached state if available — call `refreshTrialState()` to force refresh.
 */
export async function getTrialState(): Promise<TrialState | null> {
  if (cachedState) return cachedState;
  return refreshTrialState();
}

/**
 * Force-refresh trial status from the gateway.
 */
export async function refreshTrialState(): Promise<TrialState | null> {
  const token = getToken();
  if (!token) return null;

  try {
    const { gatewayUrl } = properties();
    const res = await fetch(`${gatewayUrl}/api/user/trial-status`, {
      headers: { Authorization: `Bearer ${token}` }
    });

    if (!res.ok) return null;

    cachedState = (await res.json()) as TrialState;
    return cachedState;
  } catch {
    return null;
  }
}

/**
 * Toggle purchased status (dev mode only).
 */
export async function togglePurchase(purchased: boolean): Promise<boolean> {
  const token = getToken();
  if (!token) return false;

  try {
    const { gatewayUrl } = properties();
    const method = purchased ? 'PUT' : 'DELETE';
    const res = await fetch(`${gatewayUrl}/api/user/purchase`, {
      method,
      headers: { Authorization: `Bearer ${token}` }
    });

    if (res.ok) {
      cachedState = null; // Invalidate cache
      return true;
    }
    return false;
  } catch {
    return false;
  }
}

/**
 * Reset games played counter (dev mode only).
 */
export async function resetGamesPlayed(): Promise<boolean> {
  const token = getToken();
  if (!token) return false;

  try {
    const { gatewayUrl } = properties();
    const res = await fetch(`${gatewayUrl}/api/user/games-played`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` }
    });

    if (res.ok) {
      cachedState = null; // Invalidate cache
      return true;
    }
    return false;
  } catch {
    return false;
  }
}

/**
 * Clear the cached trial state (e.g. on logout).
 */
export function clearTrialCache(): void {
  cachedState = null;
}
