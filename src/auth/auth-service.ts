/* ===================================================
   Auth Service — JWT & session management
   =================================================== */

import properties from '../config/properties';

export interface AuthUser {
  id: string;
  email: string;
  displayName: string;
  purchased: boolean;
  gamesPlayed: number;
}

let accessToken: string | null = null;
let currentUser: AuthUser | null = null;
let listeners: Array<() => void> = [];

function notify(): void {
  listeners.forEach((fn) => fn());
}

export function onAuthChange(fn: () => void): () => void {
  listeners.push(fn);
  return () => {
    listeners = listeners.filter((l) => l !== fn);
  };
}

export function isAuthenticated(): boolean {
  return accessToken !== null && currentUser !== null;
}

export function getToken(): string | null {
  return accessToken;
}

export function getUser(): AuthUser | null {
  return currentUser;
}

/**
 * Login with a Google ID token.
 * Sends it to the gateway's POST /auth/google endpoint.
 */
export async function loginWithGoogle(idToken: string): Promise<void> {
  const { gatewayUrl } = properties();
  const res = await fetch(`${gatewayUrl}/auth/google`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify({ idToken })
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: 'Login failed' }));
    throw new Error(err.error || `HTTP ${res.status}`);
  }

  const data = await res.json();
  accessToken = data.token;
  currentUser = data.user;
  notify();
}

/**
 * Attempt to silently refresh the session using the httpOnly refresh cookie.
 * Returns true if refreshed successfully, false otherwise.
 */
export async function tryRefresh(): Promise<boolean> {
  try {
    const { gatewayUrl } = properties();
    const res = await fetch(`${gatewayUrl}/auth/refresh`, {
      method: 'POST',
      credentials: 'include'
    });

    if (!res.ok) return false;

    const data = await res.json();
    accessToken = data.token;
    currentUser = data.user;
    notify();
    return true;
  } catch {
    return false;
  }
}

/**
 * Get the game server username: firstName$gatewayUserId.
 * The game server uses '$' as separator — getTrimmed() returns the first part for display.
 */
export function getGameUsername(): string | null {
  if (!currentUser) return null;
  const firstName = currentUser.displayName.split(' ')[0];
  return `${firstName}$${currentUser.id}`;
}

/**
 * Clear the current session and revoke the refresh token.
 */
export async function logout(): Promise<void> {
  try {
    const { gatewayUrl } = properties();
    await fetch(`${gatewayUrl}/auth/logout`, {
      method: 'POST',
      credentials: 'include'
    });
  } catch {
    // Best-effort — still clear local state
  }

  accessToken = null;
  currentUser = null;
  notify();
}
