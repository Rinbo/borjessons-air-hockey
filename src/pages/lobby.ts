/* ===================================================
   Lobby Sub-Page
   =================================================== */

import { trimName } from '../utils/misc-utils';
import { formatTime } from '../utils/time-utils';
import type { Message, Player } from '../types';
import sendIcon from '../assets/svg/send.svg';

// SVG icons as inline strings (replacing react-icons)
const SETTINGS_ICON = `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="3"/><path d="m19.4 15 1.3 2.2a1 1 0 0 1-.1 1.1l-1.6 1.6a1 1 0 0 1-1.1.1L15.7 18.7a7.7 7.7 0 0 1-1.7 1V22a1 1 0 0 1-1 1h-2a1 1 0 0 1-1-1v-2.3a7.7 7.7 0 0 1-1.7-1L6 19.9a1 1 0 0 1-1.1-.1l-1.6-1.6a1 1 0 0 1-.1-1.1L4.6 15a7.7 7.7 0 0 1-1-1.7H2a1 1 0 0 1-1-1v-2a1 1 0 0 1 1-1h2.3a7.7 7.7 0 0 1 1-1.7L3.1 6a1 1 0 0 1 .1-1.1l1.6-1.6a1 1 0 0 1 1.1-.1L8.3 5.3a7.7 7.7 0 0 1 1.7-1V2a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1v2.3a7.7 7.7 0 0 1 1.7 1L18 3.1a1 1 0 0 1 1.1.1l1.6 1.6a1 1 0 0 1 .1 1.1L19.4 9a7.7 7.7 0 0 1 1 1.7H22a1 1 0 0 1 1 1v2a1 1 0 0 1-1 1h-2.3a7.7 7.7 0 0 1-1 1.7Z"/></svg>`;
const EXIT_ICON = `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>`;
const CLIPBOARD_ICON = `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>`;

export interface LobbyCallbacks {
  sendMessage: (message: string) => void;
  toggleReady: () => void;
  onExit: () => void;
}

let isReady = false;
let fabExpanded = false;
let currentUsername = '';

export function renderLobby(
  container: HTMLElement,
  messages: Message[],
  players: Player[],
  callbacks: LobbyCallbacks,
  username?: string
): void {
  if (username) currentUsername = username;
  const html = `
    <div class="lobby page-enter">
      <h2 class="lobby__title">Lobby</h2>

      <div class="lobby__toolbar">
        <button class="btn ${isReady ? 'btn-primary' : 'btn-outline'}" id="btn-ready">
          ${isReady ? '✓ Ready' : 'Ready'}
        </button>
        <div class="fab-container" id="fab-container">
          <button class="fab" id="fab-btn" title="Settings">${SETTINGS_ICON}</button>
          <button class="fab-item" id="fab-copy" title="Copy link">${CLIPBOARD_ICON}</button>
          <button class="fab-item" id="fab-exit" title="Exit">${EXIT_ICON}</button>
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
          <img src="${sendIcon}" alt="Send" />
        </button>
      </div>
    </div>
  `;

  container.innerHTML = html;

  // Event listeners
  const chatInput = document.getElementById('chat-input') as HTMLInputElement;
  const btnSend = document.getElementById('btn-send')!;
  const btnReady = document.getElementById('btn-ready')!;
  const fabBtn = document.getElementById('fab-btn')!;
  const fabCopy = document.getElementById('fab-copy')!;
  const fabExit = document.getElementById('fab-exit')!;

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
    isReady = !isReady;
    btnReady.className = `btn ${isReady ? 'btn-primary' : 'btn-outline'}`;
    btnReady.textContent = isReady ? '✓ Ready' : 'Ready';
  });

  fabBtn.addEventListener('click', () => {
    fabExpanded = !fabExpanded;
    fabBtn.classList.toggle('is-spinning');
    setTimeout(() => fabBtn.classList.remove('is-spinning'), 500);
    fabCopy.classList.toggle('is-visible', fabExpanded);
    fabExit.classList.toggle('is-visible', fabExpanded);
  });

  fabCopy.addEventListener('click', () => {
    navigator.clipboard.writeText(window.location.href);
    showToast('URL copied');
  });

  fabExit.addEventListener('click', () => callbacks.onExit());

  // Close fab on outside click
  document.addEventListener('click', (e) => {
    const fabContainer = document.getElementById('fab-container');
    if (fabExpanded && fabContainer && !fabContainer.contains(e.target as Node)) {
      fabExpanded = false;
      fabCopy.classList.remove('is-visible');
      fabExit.classList.remove('is-visible');
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

// Muted Nordic palette — earthy, soft tones that pair with the off-white/teal theme
const CHAT_PALETTE = ['#8a6542', '#5b7a8a', '#8b6f7d', '#6b8f71'];
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
  isReady = false;
  fabExpanded = false;
  currentUsername = '';
  colorMap.clear();
}
