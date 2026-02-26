/* ===================================================
   Online Users Page
   =================================================== */

import { navigate } from '../router';
import { get } from '../api/api';
import { StompConnection } from '../stomp-connection';
import { pingListener } from '../utils/websocket-utils';
import { trimName } from '../utils/misc-utils';
import type { StompSubscription } from '@stomp/stompjs';

let stomp: StompConnection | null = null;
let subscription: StompSubscription | null = null;
let container: HTMLElement | null = null;

export async function mount(el: HTMLElement): Promise<void> {
  container = el;

  const savedUsername = localStorage.getItem('username');
  if (!savedUsername) {
    navigate('/choose-a-name');
    return;
  }

  el.innerHTML = `
    <div class="games-layout">
      <div class="top-banner" id="banner-home">
        <span class="top-banner__back">‹</span>
        <span class="top-banner__text">borjessons air hockey</span>
      </div>
      <div class="games-layout__content">
        <div class="online-users page-enter">
          <h2 class="online-users__title">Online Users</h2>
          <div class="online-users__grid" id="users-grid">
            <div class="status-screen"><span class="status-screen__text is-loading">Connecting...</span></div>
          </div>
        </div>
      </div>
    </div>
  `;

  document.getElementById('banner-home')!.addEventListener('click', () => navigate('/'));

  stomp = new StompConnection();

  try {
    await stomp.connect();
  } catch (_) {
    const grid = document.getElementById('users-grid');
    if (grid) grid.innerHTML = '<div class="status-screen"><span class="status-screen__text">Unable to connect :(</span></div>';
    return;
  }

  stomp.publish('/app/users/enter', savedUsername);
  pingListener(savedUsername, stomp);

  // Fetch initial users
  try {
    const users = await get<string[]>('/users');
    renderUsers(users);
  } catch (_) {
    renderUsers([]);
  }

  // Subscribe to live updates
  subscription = stomp.subscribe('/topic/users', (message) => {
    renderUsers(JSON.parse(message.body));
  });

  const beforeUnload = () => stomp?.publish('/app/users/exit', savedUsername);
  window.addEventListener('beforeunload', beforeUnload);
  (el as any).__beforeUnload = beforeUnload;
}

function renderUsers(names: string[]): void {
  const grid = document.getElementById('users-grid');
  if (!grid) return;

  if (names.length === 0) {
    grid.innerHTML = '<div class="empty-state"><p>No users online</p></div>';
    return;
  }

  grid.innerHTML = names.map(name => {
    const displayName = trimName(name);
    const initials = getInitials(displayName);
    const color = stringToColor(displayName);

    return `
      <div class="online-users__item">
        <div class="avatar" style="width:40px;height:40px;background-color:${color}">${initials}</div>
        <span class="online-users__item-name">${displayName}</span>
      </div>
    `;
  }).join('');
}

function getInitials(name: string): string {
  return name
    .split(' ')
    .map(part => part.charAt(0).toUpperCase())
    .join('')
    .substring(0, 2);
}

function stringToColor(str: string): string {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  // Use HSL for more pleasing muted colors (Nordic feel)
  const hue = Math.abs(hash) % 360;
  return `hsl(${hue}, 35%, 55%)`;
}

export function unmount(): void {
  if (subscription) {
    try { subscription.unsubscribe(); } catch (_) { /* */ }
    subscription = null;
  }

  if (container) {
    const beforeUnload = (container as any).__beforeUnload;
    if (beforeUnload) {
      stomp?.publish('/app/users/exit', localStorage.getItem('username') || '');
      window.removeEventListener('beforeunload', beforeUnload);
    }
  }

  if (stomp) {
    stomp.disconnect();
    stomp = null;
  }

  container = null;
}
