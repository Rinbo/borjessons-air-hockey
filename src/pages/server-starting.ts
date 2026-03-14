/* ===================================================
   Server Starting — Cold-start animation page
   Shows a delightful animation while a game server
   boots up, then redirects to the game lobby.
   =================================================== */

import { navigate } from '../router';
import { gatewayGet } from '../api/api';

interface ServerStatusResponse {
  ready: boolean;
  serverUrl: string;
}

let pollTimer: ReturnType<typeof setInterval> | null = null;
let dotTimer: ReturnType<typeof setInterval> | null = null;

export function mount(container: HTMLElement, params: Record<string, string>): void {
  const gameId = params.gameId || '';
  const serverUrl = params.serverUrl || '';

  container.innerHTML = `
    <div class="server-starting page-enter" id="server-starting">
      <div class="server-starting__content">
        <div class="server-starting__puck-container">
          <div class="server-starting__puck"></div>
          <div class="server-starting__glow"></div>
        </div>
        <h2 class="server-starting__title">Warming up a game server</h2>
        <p class="server-starting__subtitle" id="starting-subtitle">Just for you<span id="loading-dots">.</span></p>
        <div class="server-starting__progress">
          <div class="server-starting__progress-bar" id="progress-bar"></div>
        </div>
        <p class="server-starting__hint">This usually takes 3–5 seconds</p>
      </div>
    </div>
  `;

  // Animated dots
  let dotCount = 1;
  const dotsEl = document.getElementById('loading-dots');
  dotTimer = setInterval(() => {
    dotCount = (dotCount % 3) + 1;
    if (dotsEl) dotsEl.textContent = '.'.repeat(dotCount);
  }, 500);

  // Animate progress bar (visual only — not tied to actual progress)
  const progressBar = document.getElementById('progress-bar');
  let progress = 0;
  const progressTimer = setInterval(() => {
    progress = Math.min(progress + (100 - progress) * 0.05, 95);
    if (progressBar) progressBar.style.width = `${progress}%`;
  }, 100);

  // If we already have a server URL, go directly
  if (serverUrl) {
    sessionStorage.setItem('game_server_url', serverUrl);
    clearInterval(progressTimer);
    if (progressBar) progressBar.style.width = '100%';
    setTimeout(() => navigate(`/games/${gameId}`), 300);
    return;
  }

  // Poll for server readiness
  pollTimer = setInterval(async () => {
    try {
      const status = await gatewayGet<ServerStatusResponse>('/api/games/server-status');
      if (status.ready && status.serverUrl) {
        sessionStorage.setItem('game_server_url', status.serverUrl);
        clearInterval(pollTimer!);
        clearInterval(progressTimer);
        if (progressBar) progressBar.style.width = '100%';

        // Brief pause to show 100% then navigate
        setTimeout(() => navigate(`/games/${gameId}`), 400);
      }
    } catch {
      // Keep polling
    }
  }, 1000);
}

export function unmount(): void {
  if (pollTimer) {
    clearInterval(pollTimer);
    pollTimer = null;
  }
  if (dotTimer) {
    clearInterval(dotTimer);
    dotTimer = null;
  }
}
