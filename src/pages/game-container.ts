/* ===================================================
   Game Container — State Machine + STOMP Subscriptions
   =================================================== */

import { navigate } from '../router';
import { StompConnection } from '../stomp-connection';
import { pingListener } from '../utils/websocket-utils';
import { trimName } from '../utils/misc-utils';
import { GameState } from '../types';
import type { Player, Message } from '../types';
import { renderLobby, updateChat, updatePlayers, resetState as resetLobbyState } from './lobby';
import { renderGameView, updateScoreBanner, destroyGameView } from './game-view';
import type { StompSubscription } from '@stomp/stompjs';

let stomp: StompConnection | null = null;
let subscriptions: StompSubscription[] = [];
let gameState: GameState = GameState.LOBBY;
let messages: Message[] = [];
let players: Player[] = [];
let username = '';
let gameId = '';
let containerEl: HTMLElement | null = null;
let contentEl: HTMLElement | null = null;

export async function mount(container: HTMLElement, params: Record<string, string>): Promise<void> {
  containerEl = container;
  gameId = params.id;

  // Auth guard
  const savedUsername = localStorage.getItem('username');
  if (!savedUsername) {
    navigate('/choose-a-name');
    return;
  }
  username = savedUsername;

  // Reset state
  gameState = GameState.LOBBY;
  messages = [];
  players = [];
  resetLobbyState();

  container.innerHTML = `
    <div class="games-layout">
      <div class="top-banner" id="banner-home">
        <span class="top-banner__back">‹</span>
        <span class="top-banner__text">borjessons air hockey</span>
      </div>
      <div class="games-layout__content" id="game-content">
        <div class="status-screen">
          <span class="status-screen__text is-loading">Connecting...</span>
        </div>
      </div>
    </div>
  `;

  document.getElementById('banner-home')!.addEventListener('click', () => navigate('/'));
  contentEl = document.getElementById('game-content')!;

  // Connect STOMP
  stomp = new StompConnection();

  try {
    await stomp.connect();
  } catch (_) {
    if (contentEl) {
      contentEl.innerHTML = '<div class="status-screen"><span class="status-screen__text">Unable to connect :(</span></div>';
    }
    return;
  }

  // Publish user enter and heartbeat
  stomp.publish('/app/users/enter', savedUsername);
  pingListener(savedUsername, stomp);

  // Subscribe to game topics
  subscriptions.push(
    stomp.subscribe(`/topic/game/${gameId}/chat`, (msg) => {
      messages = [{ ...JSON.parse(msg.body), datetime: new Date() }, ...messages];
      if (gameState === GameState.LOBBY) updateChat(messages);
    }),

    stomp.subscribe(`/topic/game/${gameId}/players`, (msg) => {
      players = JSON.parse(msg.body) as Player[];
      if (gameState === GameState.LOBBY) updatePlayers(players);
      if (gameState === GameState.GAME_RUNNING) updateScoreBanner(players, -1);
    }),

    stomp.subscribe(`/topic/game/${gameId}/game-state`, (msg) => {
      const newState = JSON.parse(msg.body) as GameState;
      transitionState(newState);
    }),

    stomp.subscribe(`/topic/game/${username}/game-state`, (msg) => {
      const newState = JSON.parse(msg.body) as GameState;
      transitionState(newState);
    })
  );

  // Connect to game
  stomp.publish(`/app/game/${gameId}/connect`, JSON.stringify({ username, message: '' }));

  // Cleanup on page unload
  const beforeUnload = () => {
    stomp?.publish(`/app/game/${gameId}/disconnect`, '');
  };
  window.addEventListener('beforeunload', beforeUnload);
  (container as any).__beforeUnload = beforeUnload;

  // Initial render
  renderCurrentState();
}

function transitionState(newState: GameState): void {
  if (newState === gameState) return;

  // Clean up game view if leaving GAME_RUNNING
  if (gameState === GameState.GAME_RUNNING) {
    destroyGameView();
  }

  // Reset lobby UI state when entering LOBBY from any state
  if (newState === GameState.LOBBY) {
    resetLobbyState();
  }

  gameState = newState;
  renderCurrentState();
}

function renderCurrentState(): void {
  if (!contentEl) return;

  switch (gameState) {
    case GameState.LOBBY:
      renderLobby(contentEl, messages, players, {
        sendMessage: (msg) => {
          stomp?.publish(`/app/game/${gameId}/chat`, JSON.stringify({ username, message: msg }));
        },
        toggleReady: () => {
          stomp?.publish(`/app/game/${gameId}/toggle-ready`, '');
        },
        addAi: () => {
          stomp?.publish(`/app/game/${gameId}/add-ai`, '');
        },
        onExit: () => navigate('/')
      }, username);
      break;

    case GameState.GAME_RUNNING:
      renderGameView(contentEl, gameId, players, username);
      break;

    case GameState.SCORE_SCREEN:
      renderScoreScreen();
      break;

    case GameState.PLAYER_1_DISCONNECT:
      renderMessage('Game creator left', 'Exit', () => navigate('/'));
      break;

    case GameState.PLAYER_2_DISCONNECT:
      renderMessage('Your opponent left the game', 'Back to lobby', () => transitionState(GameState.LOBBY));
      break;

    case GameState.FORBIDDEN:
      renderMessage('Game is in progress', 'Exit', () => navigate('/'));
      break;

    default:
      renderMessage('Unknown error. Sorry :(', 'Exit', () => navigate('/'));
  }
}

function renderScoreScreen(): void {
  if (!contentEl) return;

  const winner = getWinner();
  const result = players.map(p => `${trimName(p.username)}: ${p.score}`).join(' | ');

  contentEl.innerHTML = `
    <div class="center-layout page-enter">
      <div class="center-card">
        <h2>${winner}</h2>
        <div style="font-weight: var(--weight-semibold)">Results:</div>
        <div>${result}</div>
        <button class="btn btn-outline" id="btn-back-lobby">Back to lobby</button>
      </div>
    </div>
  `;

  document.getElementById('btn-back-lobby')!.addEventListener('click', () => {
    resetLobbyState();
    transitionState(GameState.LOBBY);
  });
}

function renderMessage(message: string, actionName: string, action: () => void): void {
  if (!contentEl) return;

  contentEl.innerHTML = `
    <div class="center-layout page-enter">
      <div class="center-card">
        <h2>${message}</h2>
        <button class="btn btn-outline" id="btn-action">${actionName}</button>
      </div>
    </div>
  `;

  document.getElementById('btn-action')!.addEventListener('click', action);
}

function getWinner(): string {
  const p1 = players.find(p => p.agency === 'PLAYER_1');
  const p2 = players.find(p => p.agency === 'PLAYER_2');
  if (!p1 || !p2) return 'Error: Players not found.';
  if (p1.score === p2.score) return 'Tie!';
  const winner = p1.score > p2.score ? p1 : p2;
  return `${trimName(winner.username)} Won!`;
}

export function unmount(): void {
  // Clean up game view if active
  if (gameState === GameState.GAME_RUNNING) {
    destroyGameView();
  }

  // Unsubscribe
  subscriptions.forEach(sub => {
    try { sub.unsubscribe(); } catch (_) { /* */ }
  });
  subscriptions = [];

  // Disconnect game
  if (containerEl) {
    const beforeUnload = (containerEl as any).__beforeUnload;
    if (beforeUnload) {
      stomp?.publish(`/app/game/${gameId}/disconnect`, '');
      window.removeEventListener('beforeunload', beforeUnload);
    }
  }

  // Disconnect STOMP
  if (stomp) {
    stomp.publish('/app/users/exit', username);
    stomp.disconnect();
    stomp = null;
  }

  containerEl = null;
  contentEl = null;
}
