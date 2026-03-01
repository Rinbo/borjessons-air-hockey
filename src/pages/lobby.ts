/* ===================================================
   Lobby Sub-Page
   =================================================== */

import { trimName } from '../utils/misc-utils';
import { formatTime } from '../utils/time-utils';
import type { Message, Player } from '../types';

// Inline SVG icons
const SEND_ICON = `<svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"/></svg>`;
const COPY_ICON = `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>`;
const EXIT_ICON = `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>`;
const ROBOT_ICON = `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="11" width="18" height="10" rx="2"/><circle cx="12" cy="5" r="2"/><path d="M12 7v4"/><line x1="8" y1="16" x2="8" y2="16"/><line x1="16" y1="16" x2="16" y2="16"/></svg>`;

export interface LobbyCallbacks {
  sendMessage: (message: string) => void;
  toggleReady: () => void;
  addAi: () => void;
  onExit: () => void;
}

let menuOpen = false;
let currentUsername = '';

export function renderLobby(
  container: HTMLElement,
  messages: Message[],
  players: Player[],
  callbacks: LobbyCallbacks,
  username?: string
): void {
  if (username) currentUsername = username;
  const isReady = isCurrentPlayerReady(players);
  const html = `
    <div class="lobby page-enter">
      <h2 class="lobby__title">Lobby</h2>

      <div class="lobby__toolbar">
        <button class="btn ${isReady ? 'btn-primary' : 'btn-outline'}" id="btn-ready">
          ${isReady ? '✓ Ready' : 'Ready'}
        </button>
        <div class="lobby__toolbar-right">
          ${players.length < 2 ? `<button class="btn btn-outline btn-sm" id="btn-add-ai">${ROBOT_ICON} Play vs AI</button>` : ''}
          <div class="action-menu" id="action-menu">
            <button class="action-menu__trigger" id="menu-trigger" title="More actions">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><circle cx="12" cy="5" r="2"/><circle cx="12" cy="12" r="2"/><circle cx="12" cy="19" r="2"/></svg>
            </button>
            <div class="action-menu__dropdown" id="menu-dropdown">
              <button class="action-menu__item" id="menu-copy">${COPY_ICON} Copy link</button>
              <button class="action-menu__item action-menu__item--danger" id="menu-exit">${EXIT_ICON} Leave game</button>
            </div>
          </div>
        </div>
      </div>

      <div class="lobby__players" id="player-banner">
        ${renderPlayerBanner(players)}
      </div>

      <div class="lobby__chat" id="chat-messages">
        ${renderMessages(messages)}
      </div>

      <div class="lobby__input-row">
        <input class="input" id="chat-input" placeholder="Write something..." autocomplete="off" />
        <button class="btn btn-primary btn-icon" id="btn-send" title="Send">
          ${SEND_ICON}
        </button>
      </div>
    </div>
  `;

  container.innerHTML = html;

  // Event listeners
  const chatInput = document.getElementById('chat-input') as HTMLInputElement;
  const btnSend = document.getElementById('btn-send')!;
  const btnReady = document.getElementById('btn-ready')!;
  const menuTrigger = document.getElementById('menu-trigger')!;
  const menuDropdown = document.getElementById('menu-dropdown')!;
  const menuCopy = document.getElementById('menu-copy')!;
  const menuExit = document.getElementById('menu-exit')!;

  const handleSend = () => {
    const msg = chatInput.value.trim();
    if (msg) {
      callbacks.sendMessage(msg);
      chatInput.value = '';
    }
  };

  btnSend.addEventListener('click', handleSend);
  chatInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') handleSend();
  });

  btnReady.addEventListener('click', () => {
    callbacks.toggleReady();
  });

  menuTrigger.addEventListener('click', (e) => {
    e.stopPropagation();
    menuOpen = !menuOpen;
    menuDropdown.classList.toggle('is-open', menuOpen);
  });

  menuCopy.addEventListener('click', () => {
    navigator.clipboard.writeText(window.location.href);
    showToast('URL copied');
    menuOpen = false;
    menuDropdown.classList.remove('is-open');
  });

  menuExit.addEventListener('click', () => {
    menuOpen = false;
    callbacks.onExit();
  });

  const btnAddAi = document.getElementById('btn-add-ai');
  if (btnAddAi) {
    btnAddAi.addEventListener('click', () => callbacks.addAi());
  }

  // Close menu on outside click
  document.addEventListener('click', (e) => {
    const actionMenu = document.getElementById('action-menu');
    if (menuOpen && actionMenu && !actionMenu.contains(e.target as Node)) {
      menuOpen = false;
      menuDropdown.classList.remove('is-open');
    }
  });
}

export function updateChat(messages: Message[]): void {
  const chatEl = document.getElementById('chat-messages');
  if (chatEl) chatEl.innerHTML = renderMessages(messages);
}

export function updatePlayers(players: Player[]): void {
  const bannerEl = document.getElementById('player-banner');
  if (bannerEl) bannerEl.innerHTML = renderPlayerBanner(players);

  // Sync the ready button with server state
  const btnReady = document.getElementById('btn-ready');
  if (btnReady) {
    const isReady = isCurrentPlayerReady(players);
    btnReady.className = `btn ${isReady ? 'btn-primary' : 'btn-outline'}`;
    btnReady.textContent = isReady ? '✓ Ready' : 'Ready';
  }
}

function renderMessages(messages: Message[]): string {
  return messages.map(m => {
    const isMe = m.username === currentUsername;
    const color = isMe ? 'var(--accent)' : usernameToColor(m.username);
    return `
      <div class="chat-message">
        <span class="chat-message__time">${formatTime(m.datetime)}</span>
        <span class="chat-message__user" style="color:${color}">${trimName(m.username)}:</span>
        <span class="chat-message__text">${escapeHtml(m.message)}</span>
      </div>
    `;
  }).join('');
}

function renderPlayerBanner(players: Player[]): string {
  return players.map(p => `
    <span class="lobby__player-name ${p.ready ? 'is-ready' : ''}">
      ${trimName(p.username)} ${p.gamesWon || 0}
    </span>
  `).join('');
}

function escapeHtml(text: string): string {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

// Warm earthy palette for light backgrounds
const CHAT_PALETTE = ['#c4873b', '#5b8a6d', '#8b6b8a', '#5a7f96'];
const colorMap = new Map<string, string>();

function usernameToColor(name: string): string {
  if (colorMap.has(name)) return colorMap.get(name)!;
  const color = CHAT_PALETTE[colorMap.size % CHAT_PALETTE.length];
  colorMap.set(name, color);
  return color;
}

function showToast(message: string): void {
  const existing = document.querySelector('.toast');
  if (existing) existing.remove();

  const toast = document.createElement('div');
  toast.className = 'toast';
  toast.textContent = message;
  document.body.appendChild(toast);
  setTimeout(() => toast.remove(), 3000);
}

export function resetState(): void {
  menuOpen = false;
  currentUsername = '';
  colorMap.clear();
}

function isCurrentPlayerReady(players: Player[]): boolean {
  if (!currentUsername) return false;
  const me = players.find(p => p.username === currentUsername);
  return me?.ready ?? false;
}
