/* ===================================================
   Landing Page
   =================================================== */

import { navigate } from '../router';

export function mount(container: HTMLElement): void {
  container.innerHTML = `
    <div class="landing page-enter">
      <div class="landing__bg"></div>

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
        <button class="btn btn-primary btn-lg" id="btn-join">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
          Join Games
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

      <button class="landing__clear" id="btn-clear">Clear localStorage</button>
    </div>
  `;

  document.getElementById('btn-join')!.addEventListener('click', () => navigate('/games'));
  document.getElementById('btn-create')!.addEventListener('click', () => navigate('/games/new'));
  document.getElementById('btn-online')!.addEventListener('click', () => navigate('/games/online'));
  document.getElementById('btn-clear')!.addEventListener('click', () => localStorage.removeItem('username'));
}

export function unmount(): void {
  // No cleanup needed
}
