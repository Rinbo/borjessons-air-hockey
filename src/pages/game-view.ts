/* ===================================================
   Game View Sub-Page — Canvas + Score Banner
   =================================================== */

import Board, { BroadcastState } from '../game/board';
import GameWebSocket from '../game/game-websocket';
import { getAgencyExtention } from '../game/utils';
import { soundEngine, CollisionEvent } from '../game/sound-engine';
import { ASPECT_RATIO, MAX_WIDTH, GAME_DURATION } from '../game/constants';
import { navigate } from '../router';
import { trimName } from '../utils/misc-utils';
import type { Player } from '../types';

// Vertical chrome during gameplay: score-banner(28) + margin(4) + canvas border(4) = 36
const BANNER_HEIGHTS = 36;
const MARGIN = 10;

let board: Board | null = null;
let gameWs: GameWebSocket | null = null;
let rafId: number | null = null;
let resizeHandler: (() => void) | null = null;
let containerEl: HTMLElement | null = null;

function calculateCanvasSize(): { width: number; height: number } {
  const w = Math.min(window.innerWidth, MAX_WIDTH) - MARGIN;
  const h = w / ASPECT_RATIO;
  if (h + BANNER_HEIGHTS >= window.innerHeight) {
    const maxH = window.innerHeight - BANNER_HEIGHTS - MARGIN;
    return { width: maxH * ASPECT_RATIO, height: maxH };
  }
  return { width: w, height: h };
}

export function renderGameView(
  container: HTMLElement,
  gameId: string,
  players: Player[],
  username: string
): void {
  containerEl = container;

  // Hide top banner and go fullscreen to maximise game board area
  const topBanner = document.getElementById('banner-home');
  const layout = topBanner?.closest('.games-layout') as HTMLElement | null;
  if (topBanner) topBanner.style.display = 'none';
  if (layout) layout.classList.add('games-layout--fullscreen');

  const { width, height } = calculateCanvasSize();
  const dpr = window.devicePixelRatio || 1;

  container.innerHTML = `
    <div class="game-view page-enter">
      <div class="score-banner" id="score-banner" style="width:${width}px">
        ${renderScoreBanner(players, GAME_DURATION)}
      </div>
      <canvas class="game-canvas" id="game-board" width="${width * dpr}" height="${height * dpr}" style="width:${width}px;height:${height}px"></canvas>
    </div>
  `;

  // Wire up exit button
  document.getElementById('score-exit')?.addEventListener('click', () => navigate('/'));

  const canvas = document.getElementById('game-board') as HTMLCanvasElement;
  const agency = getAgencyExtention(players, username);

  // Create game WebSocket
  gameWs = new GameWebSocket();

  // Create board with DPR for Retina/HiDPI rendering
  board = new Board(canvas, { width, height }, (position) => {
    gameWs!.sendHandlePosition(position);
  }, dpr);

  // Attach event listeners (setSize calls setEventListeners internally)
  board.setSize({ width, height });

  // Track remaining seconds for the banner
  let lastRenderedSeconds = GAME_DURATION;

  // Receive board state
  gameWs.onBoardState((state: BroadcastState) => {
    board!.update(state);

    // Sound effects based on collision event
    soundEngine.playCollision(state.collisionEvent);

    // Haptic feedback on goal (Android only — Safari ignores vibrate)
    if ((state.collisionEvent & CollisionEvent.GOAL) && 'vibrate' in navigator) {
      navigator.vibrate([100, 50, 100]);
    }

    const seconds = Math.ceil(state.remainingSeconds);
    if (seconds !== lastRenderedSeconds) {
      lastRenderedSeconds = seconds;
      updateTimer(seconds);
    }
  });

  gameWs.connect(gameId, agency);

  // rAF render loop
  function render() {
    board!.draw();
    rafId = requestAnimationFrame(render);
  }
  rafId = requestAnimationFrame(render);

  // Handle window resize
  resizeHandler = () => {
    const newSize = calculateCanvasSize();
    canvas.width = newSize.width * dpr;
    canvas.height = newSize.height * dpr;
    canvas.style.width = newSize.width + 'px';
    canvas.style.height = newSize.height + 'px';
    board!.setSize(newSize);

    const banner = document.getElementById('score-banner');
    if (banner) banner.style.width = newSize.width + 'px';
  };
  window.addEventListener('resize', resizeHandler);
}

export function updateScoreBanner(players: Player[], remainingSeconds: number): void {
  const banner = document.getElementById('score-banner');
  if (!banner) return;

  // If remainingSeconds is -1, preserve existing timer value
  let seconds = remainingSeconds;
  if (seconds < 0) {
    const timerEl = document.getElementById('score-timer');
    seconds = timerEl ? parseInt(timerEl.textContent || '0', 10) : 0;
  }

  banner.innerHTML = renderScoreBanner(players, seconds);

  // Re-wire exit button after innerHTML re-render
  document.getElementById('score-exit')?.addEventListener('click', () => navigate('/'));
}

function updateTimer(seconds: number): void {
  const el = document.getElementById('score-timer');
  if (el) el.textContent = String(seconds);
}

function renderScoreBanner(players: Player[], remainingSeconds: number): string {
  const p1 = players[0];
  const p2 = players[1];

  const playerCell = (p: Player | undefined) => {
    if (!p) return '<div class="score-banner__player"></div>';
    return `
      <div class="score-banner__player">
        <span class="score-banner__player-name">${trimName(p.username)}</span>
        <span class="score-banner__player-score">${p.score}</span>
      </div>
    `;
  };

  return `
    <button class="score-banner__exit" id="score-exit" title="Leave game">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
    </button>
    ${playerCell(p1)}
    <span class="score-banner__timer" id="score-timer">${remainingSeconds}</span>
    ${playerCell(p2)}
  `;
}

export function destroyGameView(): void {
  if (rafId !== null) {
    cancelAnimationFrame(rafId);
    rafId = null;
  }

  if (gameWs) {
    gameWs.disconnect();
    gameWs = null;
  }

  if (board) {
    board.destroy();
    board = null;
  }

  if (resizeHandler) {
    window.removeEventListener('resize', resizeHandler);
    resizeHandler = null;
  }

  // Restore top banner and layout padding
  const topBanner = document.getElementById('banner-home');
  const layout = topBanner?.closest('.games-layout') as HTMLElement | null;
  if (topBanner) topBanner.style.display = '';
  if (layout) layout.classList.remove('games-layout--fullscreen');

  containerEl = null;
}
