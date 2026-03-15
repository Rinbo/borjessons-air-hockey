/* ===================================================
   Landing Page
   =================================================== */

import { isAuthenticated, getUser, logout, onAuthChange } from '../auth/auth-service';
import { refreshTrialState, togglePurchase, resetGamesPlayed, clearTrialCache } from '../auth/trial-service';
import type { TrialState } from '../auth/trial-service';
import properties from '../config/properties';
import { navigate } from '../router';

let unsubscribe: (() => void) | null = null;

export function mount(container: HTMLElement): void {
  // Not logged in? Redirect to login
  if (!isAuthenticated()) {
    navigate('/login');
    return;
  }

  const user = getUser()!;
  const initial = user.displayName.charAt(0).toUpperCase();

  container.innerHTML = `
    <div class="landing page-enter">
      <div class="landing__bg"></div>

      <div class="landing__user-bar">
        <div class="landing__user-info">
          <div class="landing__user-avatar">${initial}</div>
          <span class="landing__user-name">${user.displayName}</span>
        </div>
        <button class="btn btn-sm btn-outline" id="btn-sign-out">Sign out</button>
      </div>

      <div class="landing__header">
        <div class="landing__subtitle">BORJESSONS</div>
        <h1 class="landing__title ripple">Air Hockey</h1>

        <div class="landing__rink" aria-hidden="true">
          <svg viewBox="0 0 100 60" width="80" height="48">
            <!-- Table outline -->
            <rect x="2" y="2" width="96" height="56" rx="6" ry="6"
                  fill="none" stroke="var(--border)" stroke-width="1.2"/>
            <!-- Center line -->
            <line x1="50" y1="2" x2="50" y2="58"
                  stroke="var(--border)" stroke-width="0.8"/>
            <!-- Center circle -->
            <circle cx="50" cy="30" r="10"
                    fill="none" stroke="var(--border)" stroke-width="0.8"/>
            <!-- Center dot -->
            <circle cx="50" cy="30" r="2" fill="var(--accent)" opacity="0.6"/>
            <!-- Goals -->
            <line x1="2" y1="20" x2="2" y2="40"
                  stroke="var(--accent)" stroke-width="2" opacity="0.4"/>
            <line x1="98" y1="20" x2="98" y2="40"
                  stroke="var(--accent)" stroke-width="2" opacity="0.4"/>
          </svg>
        </div>
      </div>

      <div class="landing__actions">
        <div class="trial-badge" id="trial-badge" style="display:none"></div>
        <button class="btn btn-primary btn-lg" id="btn-join">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
          Join Games
        </button>
        <button class="btn btn-primary btn-lg" id="btn-find-match">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/><line x1="12" y1="2" x2="12" y2="6"/><line x1="12" y1="18" x2="12" y2="22"/><line x1="2" y1="12" x2="6" y2="12"/><line x1="18" y1="12" x2="22" y2="12"/></svg>
          Find Match
        </button>
        <button class="btn btn-primary btn-lg" id="btn-create">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="16"/><line x1="8" y1="12" x2="16" y2="12"/></svg>
          Create Game
        </button>
        <button class="btn btn-outline btn-lg" id="btn-online">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="1"/><path d="M16.24 7.76a6 6 0 0 1 0 8.49m-8.48-.01a6 6 0 0 1 0-8.49m11.31-2.82a10 10 0 0 1 0 14.14m-14.14 0a10 10 0 0 1 0-14.14"/></svg>
          See who is online
        </button>
      </div>

      <div id="paywall-overlay" class="paywall-overlay" style="display:none">
        <div class="paywall-card">
          <h3>Trial expired</h3>
          <p>You've used all 3 free games.</p>
          <button class="btn btn-primary btn-lg" disabled>Unlock for 39 SEK</button>
          <p class="paywall-note">Payment integration coming soon</p>
        </div>
      </div>

      <div id="dev-panel" class="dev-panel" style="display:none">
        <div class="dev-panel__title">🔧 Dev Tools</div>
        <div class="dev-panel__buttons">
          <button class="btn btn-sm btn-outline" id="dev-toggle-purchase">Toggle purchase</button>
          <button class="btn btn-sm btn-outline" id="dev-reset-games">Reset games</button>
        </div>
        <div class="dev-panel__status" id="dev-status"></div>
      </div>
    </div>
  `;

  document.getElementById('btn-join')!.addEventListener('click', () => navigate('/games'));
  document.getElementById('btn-find-match')!.addEventListener('click', () => navigate('/games/find-match'));
  document.getElementById('btn-create')!.addEventListener('click', () => navigate('/games/new'));
  document.getElementById('btn-online')!.addEventListener('click', () => navigate('/games/online'));
  document.getElementById('btn-sign-out')!.addEventListener('click', () => {
    clearTrialCache();
    logout();
    navigate('/login');
  });

  // Load trial status and bind dev tools
  loadTrialState();

  // If auth state changes while on this page (e.g. token expired), redirect
  unsubscribe = onAuthChange(() => {
    if (!isAuthenticated()) {
      navigate('/login');
    }
  });
}

async function loadTrialState(): Promise<void> {
  const trial = await refreshTrialState();
  if (!trial) return;

  updateTrialUI(trial);

  const { devMode } = properties();
  if (devMode) {
    const devPanel = document.getElementById('dev-panel');
    if (devPanel) devPanel.style.display = '';

    document.getElementById('dev-toggle-purchase')?.addEventListener('click', async () => {
      const current = await refreshTrialState();
      if (!current) return;
      const ok = await togglePurchase(!current.purchased);
      if (ok) {
        const updated = await refreshTrialState();
        if (updated) updateTrialUI(updated);
      }
    });

    document.getElementById('dev-reset-games')?.addEventListener('click', async () => {
      const ok = await resetGamesPlayed();
      if (ok) {
        const updated = await refreshTrialState();
        if (updated) updateTrialUI(updated);
      }
    });

    updateDevStatus(trial);
  }
}

function updateTrialUI(trial: TrialState): void {
  const badge = document.getElementById('trial-badge');
  const overlay = document.getElementById('paywall-overlay');
  const joinBtn = document.getElementById('btn-join') as HTMLButtonElement | null;
  const findMatchBtn = document.getElementById('btn-find-match') as HTMLButtonElement | null;
  const createBtn = document.getElementById('btn-create') as HTMLButtonElement | null;

  if (trial.purchased) {
    // Paid user — hide everything
    if (badge) badge.style.display = 'none';
    if (overlay) overlay.style.display = 'none';
    if (joinBtn) joinBtn.disabled = false;
    if (findMatchBtn) findMatchBtn.disabled = false;
    if (createBtn) createBtn.disabled = false;
  } else if (trial.canPlay) {
    // Trial user — show remaining games badge
    const remaining = 3 - trial.gamesPlayed;
    if (badge) {
      badge.textContent = `${remaining} free game${remaining !== 1 ? 's' : ''} left`;
      badge.style.display = '';
    }
    if (overlay) overlay.style.display = 'none';
    if (joinBtn) joinBtn.disabled = false;
    if (findMatchBtn) findMatchBtn.disabled = false;
    if (createBtn) createBtn.disabled = false;
  } else {
    // Trial exhausted — show paywall
    if (badge) badge.style.display = 'none';
    if (overlay) overlay.style.display = '';
    if (joinBtn) joinBtn.disabled = true;
    if (findMatchBtn) findMatchBtn.disabled = true;
    if (createBtn) createBtn.disabled = true;
  }

  // Update dev status if visible
  updateDevStatus(trial);
}

function updateDevStatus(trial: TrialState): void {
  const devStatus = document.getElementById('dev-status');
  if (devStatus) {
    devStatus.textContent = `Games: ${trial.gamesPlayed}/3 | Purchased: ${trial.purchased}`;
  }
}

export function unmount(): void {
  if (unsubscribe) {
    unsubscribe();
    unsubscribe = null;
  }
}
