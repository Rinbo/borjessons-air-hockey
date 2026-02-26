/* ===================================================
   Available Games Page
   =================================================== */

import { navigate } from '../router';
import { get } from '../api/api';
import { StompConnection } from '../stomp-connection';
import { pingListener } from '../utils/websocket-utils';
import { trimName } from '../utils/misc-utils';
import type { Game } from '../types';
import type { StompSubscription } from '@stomp/stompjs';

let stomp: StompConnection | null = null;
let subscription: StompSubscription | null = null;
let container: HTMLElement | null = null;

export async function mount(el: HTMLElement): Promise<void> {
  container = el;

  // Auth guard
  const savedUsername = localStorage.getItem('username');
  if (!savedUsername) {
    navigate('/choose-a-name');
    return;
  }

  // Connect STOMP
  stomp = new StompConnection();

  el.innerHTML = `
    <div class="games-layout">
      <div class="top-banner" id="banner-home">
        <span class="top-banner__back">‹</span>
        <span class="top-banner__text">borjessons air hockey</span>
      </div>
      <div class="games-layout__content">
        <div class="available-games page-enter">
          <h2 class="available-games__title">Available Games</h2>
          <div class="available-games__list" id="games-list">
            <div class="status-screen"><span class="status-screen__text is-loading">Connecting...</span></div>
          </div>
        </div>
      </div>
    </div>
  `;

  document.getElementById('banner-home')!.addEventListener('click', () => navigate('/'));

  try {
    await stomp.connect();
  } catch (_) {
    const list = document.getElementById('games-list');
    if (list) list.innerHTML = '<div class="status-screen"><span class="status-screen__text">Unable to connect :(</span></div>';
    return;
  }

  // Publish user enter and heartbeat
  stomp.publish('/app/users/enter', savedUsername);
  pingListener(savedUsername, stomp);

  // Fetch initial games
  try {
    const games = await get<Game[]>('/games');
    renderGames(games);
  } catch (_) {
    renderGames([]);
  }

  // Subscribe to live updates
  subscription = stomp.subscribe('/topic/games', (message) => {
    const games: Game[] = JSON.parse(message.body);
    renderGames(games);
  });

  // Cleanup on unload
  const beforeUnload = () => stomp?.publish('/app/users/exit', savedUsername);
  window.addEventListener('beforeunload', beforeUnload);
  (el as any).__beforeUnload = beforeUnload;
}

function renderGames(games: Game[]): void {
  const list = document.getElementById('games-list');
  if (!list) return;

  if (games.length === 0) {
    list.innerHTML = `
      <div class="empty-state">
        <p>No games available</p>
        <button class="btn btn-outline" id="btn-create-game">Create One</button>
      </div>
    `;
    document.getElementById('btn-create-game')?.addEventListener('click', () => navigate('/games/new'));
    return;
  }

  const joinable = games.filter(g => g.joinable);
  const full = games.filter(g => !g.joinable);

  let html = '';

  for (const game of joinable) {
    html += `
      <div class="game-row" data-id="${game.gameId}">
        <span class="game-row__name">${trimName(game.username)}'s game</span>
        <button class="btn btn-primary btn-join-game" data-id="${game.gameId}">Join</button>
      </div>
    `;
  }

  for (const game of full) {
    html += `
      <div class="game-row">
        <span class="game-row__name">${trimName(game.username)}'s game</span>
        <span class="badge badge-danger">In progress</span>
      </div>
    `;
  }

  list.innerHTML = html;

  // Attach join handlers
  list.querySelectorAll('.btn-join-game').forEach(btn => {
    btn.addEventListener('click', () => {
      const id = (btn as HTMLElement).dataset.id;
      navigate(`/games/${id}`);
    });
  });
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
