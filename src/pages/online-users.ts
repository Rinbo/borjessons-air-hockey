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
        <span class="top-banner__back"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="15 18 9 12 15 6"/></svg></span>
        <span class="top-banner__text">borjessons air hockey</span>
      </div>
      <div class="games-layout__content">
        <div class="online-users page-enter">
          <div class="online-users__header">
            <h2 class="online-users__title">Online Players</h2>
            <p class="online-users__count" id="users-count"></p>
          </div>
          <div class="online-users__list" id="users-list">
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
    const list = document.getElementById('users-list');
    if (list) list.innerHTML = '<div class="status-screen"><span class="status-screen__text">Unable to connect :(</span></div>';
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
  const list = document.getElementById('users-list');
  const count = document.getElementById('users-count');
  if (!list) return;

  if (count) {
    count.textContent = names.length === 1 ? '1 player online' : `${names.length} players online`;
  }

  if (names.length === 0) {
    list.innerHTML = `
      <div class="empty-state">
        <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="var(--text-muted)" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="1"/><path d="M16.24 7.76a6 6 0 0 1 0 8.49m-8.48-.01a6 6 0 0 1 0-8.49m11.31-2.82a10 10 0 0 1 0 14.14m-14.14 0a10 10 0 0 1 0-14.14"/></svg>
        <p>No one else is online right now</p>
        <button class="btn btn-outline" id="btn-create-from-users">Create a game</button>
      </div>
    `;
    document.getElementById('btn-create-from-users')?.addEventListener('click', () => navigate('/games/new'));
    return;
  }

  list.innerHTML = names.map((name, i) => {
    const displayName = trimName(name);
    const initials = getInitials(displayName);
    const color = stringToColor(displayName);

    return `
      <div class="online-users__item" style="animation-delay: ${i * 50}ms">
        <div class="online-users__status"></div>
        <div class="online-users__avatar" style="background-color:${color}">${initials}</div>
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
  const hue = Math.abs(hash) % 360;
  return `hsl(${hue}, 35%, 52%)`;
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
