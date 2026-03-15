/* ===================================================
   Google Sign-In — SDK wrapper
   =================================================== */

import properties from '../config/properties';
import { loginWithGoogle } from './auth-service';
import { navigate, consumeReturnUrl } from '../router';

declare global {
  interface Window {
    google?: {
      accounts: {
        id: {
          initialize: (config: Record<string, unknown>) => void;
          renderButton: (el: HTMLElement, config: Record<string, unknown>) => void;
        };
      };
    };
  }
}

interface CredentialResponse {
  credential: string;
}

/**
 * Render the Google Sign-In button into a container element.
 * Requires the Google GSI script to be loaded in index.html.
 */
export function renderGoogleButton(container: HTMLElement): void {
  const { googleClientId } = properties();

  if (!googleClientId || googleClientId === 'YOUR_CLIENT_ID_HERE') {
    container.innerHTML = `
      <div class="auth-error">
        <p style="color: var(--danger); font-size: var(--text-sm);">
          Google Client ID not configured.<br/>
          Set <code>VITE_GOOGLE_CLIENT_ID</code> in <code>.env.development</code>
        </p>
      </div>
    `;
    return;
  }

  const waitForGoogle = (): void => {
    if (window.google?.accounts?.id) {
      initGoogle(container, googleClientId);
    } else {
      setTimeout(waitForGoogle, 100);
    }
  };
  waitForGoogle();
}

function initGoogle(container: HTMLElement, clientId: string): void {
  window.google!.accounts.id.initialize({
    client_id: clientId,
    callback: handleCredentialResponse
  });

  window.google!.accounts.id.renderButton(container, {
    theme: 'outline',
    size: 'large',
    width: 280,
    shape: 'pill',
    text: 'signin_with',
    logo_alignment: 'left'
  });
}

async function handleCredentialResponse(response: CredentialResponse): Promise<void> {
  try {
    await loginWithGoogle(response.credential);
    navigate(consumeReturnUrl());
  } catch (err) {
    console.error('Google sign-in failed:', err);
    const errorEl = document.getElementById('login-error');
    if (errorEl) {
      errorEl.textContent = 'Sign-in failed. Please try again.';
      errorEl.style.display = 'block';
    }
  }
}
