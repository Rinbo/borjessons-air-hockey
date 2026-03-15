/* ===================================================
   Find Match — Matchmaking queue page
   Three states: Searching → Match Found → Timeout
   =================================================== */

import { navigate } from '../router';
import { gatewayPost, gatewayGet, gatewayDelete } from '../api/api';
import { getUser, isAuthenticated, getGameUsername } from '../auth/auth-service';

interface MatchStatusResponse {
  matched: boolean;
  gameId?: string;
  serverUrl?: string;
}

interface CreateGameResponse {
  gameId: string;
  serverUrl: string;
  serverReady: boolean;
}

type MatchState = 'searching' | 'found' | 'timeout';

const POLL_INTERVAL_MS = 2000;
const TIMEOUT_MS = 15_000;

let pollTimer: ReturnType<typeof setInterval> | null = null;
let timeoutTimer: ReturnType<typeof setTimeout> | null = null;
let elapsedTimer: ReturnType<typeof setInterval> | null = null;
let state: MatchState = 'searching';
let startTime = 0;
let joined = false;

export async function mount(container: HTMLElement): Promise<void> {
  if (!isAuthenticated()) {
    navigate('/login');
    return;
  }

  const displayName = getGameUsername() || getUser()?.displayName || '';
  if (!displayName) {
    navigate('/login');
    return;
  }

  state = 'searching';
  startTime = Date.now();
  joined = false;

  renderSearching(container);

  // Join the matchmaking queue
  try {
    await gatewayPost('/api/matchmaking/join', { displayName });
    joined = true;
  } catch (err) {
    console.error('Failed to join matchmaking queue:', err);
    navigate('/error');
    return;
  }

  // Start polling for match status
  pollTimer = setInterval(async () => {
    if (state !== 'searching') return;

    try {
      const status = await gatewayGet<MatchStatusResponse>('/api/matchmaking/status');
      if (status.matched && status.gameId && status.serverUrl) {
        transitionToFound(container, status.gameId, status.serverUrl);
      }
    } catch {
      // Keep polling
    }
  }, POLL_INTERVAL_MS);

  // Start timeout timer
  timeoutTimer = setTimeout(() => {
    if (state === 'searching') {
      transitionToTimeout(container, displayName);
    }
  }, TIMEOUT_MS);

  // Elapsed time counter
  elapsedTimer = setInterval(() => {
    const el = document.getElementById('find-match-elapsed');
    if (el) {
      const seconds = Math.floor((Date.now() - startTime) / 1000);
      el.textContent = `${seconds}s`;
    }
  }, 1000);
}

function renderSearching(container: HTMLElement): void {
  container.innerHTML = `
    <div class="find-match find-match--searching page-enter">
      <div class="find-match__bg"></div>
      <div class="find-match__content">
        <div class="find-match__puck-container">
          <div class="find-match__radar-ring"></div>
          <div class="find-match__radar-ring find-match__radar-ring--delayed"></div>
          <div class="find-match__puck"></div>
        </div>
        <h2 class="find-match__title">Looking for an opponent</h2>
        <p class="find-match__subtitle">
          Searching <span id="find-match-elapsed" class="find-match__timer">0s</span>
        </p>
        <button class="btn btn-outline" id="btn-cancel-match">Cancel</button>
      </div>
    </div>
  `;

  document.getElementById('btn-cancel-match')!.addEventListener('click', () => {
    leaveAndNavigate('/');
  });
}

function transitionToFound(container: HTMLElement, gameId: string, serverUrl: string): void {
  state = 'found';
  clearTimers();

  container.innerHTML = `
    <div class="find-match find-match--found page-enter">
      <div class="find-match__bg"></div>
      <div class="find-match__content">
        <div class="find-match__check">
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="var(--success)" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
            <path d="M20 6L9 17l-5-5"/>
          </svg>
        </div>
        <h2 class="find-match__title">Match found!</h2>
        <p class="find-match__subtitle">Connecting to game...</p>
      </div>
    </div>
  `;

  // Store serverUrl and navigate to game
  sessionStorage.setItem('game_server_url', serverUrl);
  setTimeout(() => navigate(`/games/${gameId}`), 800);
}

function transitionToTimeout(container: HTMLElement, displayName: string): void {
  state = 'timeout';
  clearTimers();

  container.innerHTML = `
    <div class="find-match find-match--timeout page-enter">
      <div class="find-match__bg"></div>
      <div class="find-match__content">
        <h2 class="find-match__title">No opponents found</h2>
        <p class="find-match__subtitle">Don't worry — you can play against the AI instead.</p>
        <div class="find-match__timeout-actions">
          <button class="btn btn-primary btn-lg" id="btn-play-ai">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="11" width="18" height="10" rx="2"/><circle cx="12" cy="5" r="2"/><path d="M12 7v4"/><line x1="8" y1="16" x2="8" y2="16"/><line x1="16" y1="16" x2="16" y2="16"/></svg>
            Play vs AI
          </button>
          <button class="btn btn-outline" id="btn-keep-waiting">Keep Waiting</button>
          <button class="btn btn-link" id="btn-cancel-timeout">Cancel</button>
        </div>
      </div>
    </div>
  `;

  document.getElementById('btn-play-ai')!.addEventListener('click', async () => {
    try {
      await leaveQueue();
      const result = await gatewayPost<CreateGameResponse>('/api/games/create');
      if (result.serverReady && result.serverUrl) {
        sessionStorage.setItem('game_server_url', result.serverUrl);
        // Navigate with a flag so game-container auto-adds AI
        sessionStorage.setItem('auto_add_ai', 'true');
        navigate(`/games/${result.gameId}`);
      } else {
        navigate(`/games/starting/${result.gameId}`);
      }
    } catch (err) {
      console.error('Failed to create AI game:', err);
      navigate('/error');
    }
  });

  document.getElementById('btn-keep-waiting')!.addEventListener('click', async () => {
    // Re-enter the queue and restart the UI
    state = 'searching';
    startTime = Date.now();

    try {
      await gatewayPost('/api/matchmaking/join', { displayName });
    } catch {
      // Already in queue, continue
    }

    renderSearching(container);

    // Restart polling and timeout
    pollTimer = setInterval(async () => {
      if (state !== 'searching') return;
      try {
        const status = await gatewayGet<MatchStatusResponse>('/api/matchmaking/status');
        if (status.matched && status.gameId && status.serverUrl) {
          transitionToFound(container, status.gameId, status.serverUrl);
        }
      } catch { /* keep polling */ }
    }, POLL_INTERVAL_MS);

    timeoutTimer = setTimeout(() => {
      if (state === 'searching') {
        transitionToTimeout(container, displayName);
      }
    }, TIMEOUT_MS);

    elapsedTimer = setInterval(() => {
      const el = document.getElementById('find-match-elapsed');
      if (el) {
        const seconds = Math.floor((Date.now() - startTime) / 1000);
        el.textContent = `${seconds}s`;
      }
    }, 1000);
  });

  document.getElementById('btn-cancel-timeout')!.addEventListener('click', () => {
    leaveAndNavigate('/');
  });
}

// ── Helpers ──────────────────────────────────

function clearTimers(): void {
  if (pollTimer) { clearInterval(pollTimer); pollTimer = null; }
  if (timeoutTimer) { clearTimeout(timeoutTimer); timeoutTimer = null; }
  if (elapsedTimer) { clearInterval(elapsedTimer); elapsedTimer = null; }
}

async function leaveQueue(): Promise<void> {
  if (!joined) return;
  try {
    await gatewayDelete('/api/matchmaking/leave');
  } catch {
    // Best-effort cleanup
  }
  joined = false;
}

function leaveAndNavigate(path: string): void {
  clearTimers();
  leaveQueue();
  navigate(path);
}

export function unmount(): void {
  clearTimers();
  leaveQueue();
  state = 'searching';
}
