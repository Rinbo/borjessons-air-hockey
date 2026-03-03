/* ===================================================
   Login Page
   =================================================== */

import { isAuthenticated } from '../auth/auth-service';
import { renderGoogleButton } from '../auth/google-sign-in';
import { navigate } from '../router';

export function mount(container: HTMLElement): void {
  // Already logged in? Go home.
  if (isAuthenticated()) {
    navigate('/');
    return;
  }

  container.innerHTML = `
    <div class="login page-enter">
      <div class="login__bg"></div>

      <div class="login__header">
        <div class="login__subtitle">BORJESSONS</div>
        <h1 class="login__title">Air Hockey</h1>

        <div class="login__rink" aria-hidden="true">
          <svg viewBox="0 0 100 60" width="80" height="48">
            <rect x="2" y="2" width="96" height="56" rx="6" ry="6"
                  fill="none" stroke="var(--border)" stroke-width="1.2"/>
            <line x1="50" y1="2" x2="50" y2="58"
                  stroke="var(--border)" stroke-width="0.8"/>
            <circle cx="50" cy="30" r="10"
                    fill="none" stroke="var(--border)" stroke-width="0.8"/>
            <circle cx="50" cy="30" r="2" fill="var(--accent)" opacity="0.6"/>
            <line x1="2" y1="20" x2="2" y2="40"
                  stroke="var(--accent)" stroke-width="2" opacity="0.4"/>
            <line x1="98" y1="20" x2="98" y2="40"
                  stroke="var(--accent)" stroke-width="2" opacity="0.4"/>
          </svg>
        </div>
      </div>

      <div class="login__card">
        <h2 class="login__card-title">Sign in to play</h2>
        <p class="login__card-subtitle">Use your Google account to get started</p>

        <div class="login__divider">
          <span class="login__divider-line"></span>
        </div>

        <div id="google-btn-container" class="login__google-btn"></div>

        <p class="login__error" id="login-error" style="display: none;"></p>
      </div>

      <p class="login__footer">3 free games · No credit card needed</p>
    </div>
  `;

  const btnContainer = document.getElementById('google-btn-container');
  if (btnContainer) {
    renderGoogleButton(btnContainer);
  }
}

export function unmount(): void {
  // No cleanup needed
}
