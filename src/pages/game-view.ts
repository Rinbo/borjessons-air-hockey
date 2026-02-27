/* ===================================================
   Game View Sub-Page — Canvas + Score Banner
   =================================================== */

import Board, { BroadcastState } from '../game/board';
import GameWebSocket from '../game/game-websocket';
import { getAgencyExtention } from '../game/utils';
import { ASPECT_RATIO, MAX_WIDTH, GAME_DURATION } from '../game/constants';
import { trimName } from '../utils/misc-utils';
import type { Player } from '../types';

// Total vertical chrome: top-banner(36) + game-view padding(4) + score-banner(48) + margin(8) + canvas border(4) = 100
const BANNER_HEIGHTS = 100;
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
  const { width, height } = calculateCanvasSize();

  container.innerHTML = `
    <div class="game-view page-enter">
      <div class="score-banner" id="score-banner" style="width:${width}px">
        ${renderScoreBanner(players, GAME_DURATION)}
      </div>
      <canvas class="game-canvas" id="game-board" width="${width}" height="${height}"></canvas>
    </div>
  `;

  const canvas = document.getElementById('game-board') as HTMLCanvasElement;
  const agency = getAgencyExtention(players, username);

  // Create game WebSocket
  gameWs = new GameWebSocket();

  // Create board
  board = new Board(canvas, { width, height }, (position) => {
    gameWs!.sendHandlePosition(position);
  });

  // Attach event listeners (setSize calls setEventListeners internally)
  board.setSize({ width, height });

  // Track remaining seconds for the banner
  let lastRenderedSeconds = GAME_DURATION;

  // Receive board state
  gameWs.onBoardState((state: BroadcastState) => {
    board!.update(state);

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
    canvas.width = newSize.width;
    canvas.height = newSize.height;
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
}

function updateTimer(seconds: number): void {
  const el = document.getElementById('score-timer');
  if (el) el.textContent = String(seconds);
}

function renderScoreBanner(players: Player[], remainingSeconds: number): string {
  const playerHtml = players.map(p => `
    <div class="score-banner__player">
      <span class="score-banner__player-name">${trimName(p.username)}</span>
      <span class="score-banner__player-score">${p.score}</span>
    </div>
  `).join('');

  return `
    ${playerHtml}
    <span class="score-banner__timer" id="score-timer">${remainingSeconds}</span>
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

  containerEl = null;
}
