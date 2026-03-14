/* ===================================================
   Presence Service — REST-based heartbeat to gateway
   =================================================== */

import properties from '../config/properties';
import { getToken } from '../auth/auth-service';

let heartbeatInterval: ReturnType<typeof setInterval> | null = null;
let currentDisplayName: string | null = null;
let beforeUnloadHandler: (() => void) | null = null;

/**
 * Start sending presence heartbeats to the gateway.
 * Call once when the user enters a presence-aware page.
 */
export function startPresence(displayName: string): void {
  if (currentDisplayName === displayName && heartbeatInterval) return;

  stopPresence();
  currentDisplayName = displayName;

  // Immediate heartbeat (enter)
  sendHeartbeat();

  // Heartbeat every 10s (TTL on server is 30s)
  heartbeatInterval = setInterval(sendHeartbeat, 10_000);

  // Leave on page unload
  beforeUnloadHandler = () => sendLeaveBeacon();
  window.addEventListener('beforeunload', beforeUnloadHandler);
}

/**
 * Stop heartbeating and notify the gateway that we've left.
 */
export function stopPresence(): void {
  if (heartbeatInterval) {
    clearInterval(heartbeatInterval);
    heartbeatInterval = null;
  }

  if (beforeUnloadHandler) {
    window.removeEventListener('beforeunload', beforeUnloadHandler);
    beforeUnloadHandler = null;
  }

  if (currentDisplayName) {
    sendLeave(currentDisplayName);
    currentDisplayName = null;
  }
}

/**
 * Fetch list of online users from the gateway.
 */
export async function getOnlineUsers(): Promise<string[]> {
  try {
    const { gatewayUrl } = properties();
    const token = getToken();
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      Accept: 'application/json'
    };
    if (token) headers['Authorization'] = `Bearer ${token}`;

    const res = await fetch(`${gatewayUrl}/api/presence/online`, {
      method: 'GET',
      headers,
      credentials: 'include'
    });
    if (!res.ok) return [];
    const data = await res.json();
    return data.users ?? [];
  } catch {
    return [];
  }
}

function sendHeartbeat(): void {
  if (!currentDisplayName) return;
  const { gatewayUrl } = properties();
  const token = getToken();
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (token) headers['Authorization'] = `Bearer ${token}`;

  fetch(`${gatewayUrl}/api/presence/heartbeat`, {
    method: 'POST',
    headers,
    body: JSON.stringify({ displayName: currentDisplayName }),
    credentials: 'include'
  }).catch(() => { /* heartbeat is best-effort */ });
}

function sendLeave(displayName: string): void {
  const { gatewayUrl } = properties();
  const token = getToken();
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (token) headers['Authorization'] = `Bearer ${token}`;

  fetch(`${gatewayUrl}/api/presence/leave`, {
    method: 'DELETE',
    headers,
    body: JSON.stringify({ displayName }),
    credentials: 'include'
  }).catch(() => { /* swallow */ });
}

/**
 * Use fetch with keepalive for the unload case — normal fetch may be cancelled.
 */
function sendLeaveBeacon(): void {
  if (!currentDisplayName) return;
  try {
    const { gatewayUrl } = properties();
    const token = getToken();
    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    if (token) headers['Authorization'] = `Bearer ${token}`;

    fetch(`${gatewayUrl}/api/presence/leave`, {
      method: 'DELETE',
      headers,
      body: JSON.stringify({ displayName: currentDisplayName }),
      keepalive: true,
      credentials: 'include'
    }).catch(() => { /* swallow */ });
  } catch {
    /* swallow */
  }
}
