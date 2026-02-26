/* ===================================================
   Games Layout — Auth Guard + STOMP Connection
   =================================================== */

import { navigate } from '../router';
import { StompConnection } from '../stomp-connection';
import { pingListener } from '../utils/websocket-utils';
import { setReturnPath, setMessage } from './choose-name';

let stomp: StompConnection | null = null;
let username: string = '';
let contentEl: HTMLElement | null = null;
let cleanupFn: (() => void) | null = null;
let childUnmount: (() => void) | null = null;

export function getStompConnection(): StompConnection {
  if (!stomp) throw new Error('STOMP not connected');
  return stomp;
}

export function getUsername(): string {
  return username;
}

export function getContentEl(): HTMLElement {
  if (!contentEl) throw new Error('Content element not available');
  return contentEl;
}

export function setChildUnmount(fn: (() => void) | null): void {
  childUnmount = fn;
}

export async function mount(container: HTMLElement, params: Record<string, string>): Promise<void> {
  const savedUsername = localStorage.getItem('username');

  if (!savedUsername) {
    const currentHash = window.location.hash.slice(1) || '/';
    setReturnPath(currentHash);
    setMessage('Choose a name to continue');
    navigate('/choose-a-name');
    return;
  }

  username = savedUsername;

  // Render layout
  container.innerHTML = `
    <div class="games-layout">
      <div class="top-banner" id="banner-home">
        <span class="top-banner__back">‹</span>
        <span class="top-banner__text">borjessons air hockey</span>
      </div>
      <div class="games-layout__content" id="games-content">
        <div class="status-screen">
          <span class="status-screen__text is-loading">Connecting...</span>
        </div>
      </div>
    </div>
  `;

  document.getElementById('banner-home')!.addEventListener('click', () => navigate('/'));
  contentEl = document.getElementById('games-content')!;

  // Connect STOMP
  stomp = new StompConnection();

  try {
    await stomp.connect();
  } catch (_) {
    if (contentEl) {
      contentEl.innerHTML = `
        <div class="status-screen">
          <span class="status-screen__text">Unable to connect :(</span>
        </div>
      `;
    }
    return;
  }

  // Publish user enter and set up heartbeat
  stomp.publish('/app/users/enter', savedUsername);
  pingListener(savedUsername, stomp);

  // Cleanup on page unload
  const beforeUnload = () => {
    stomp?.publish('/app/users/exit', savedUsername);
  };
  window.addEventListener('beforeunload', beforeUnload);

  cleanupFn = () => {
    beforeUnload();
    window.removeEventListener('beforeunload', beforeUnload);
  };

  // Now mount the child route
  // The child mounting is handled by individual route handlers that call getStompConnection()
  // We need to trigger the child mount based on the current hash
  mountChild(params);
}

function mountChild(_params: Record<string, string>): void {
  // Child routes are registered separately in the router.
  // The games-layout just provides the connection context.
  // The router will call the specific child page's mount().
}

export function unmount(): void {
  if (childUnmount) {
    childUnmount();
    childUnmount = null;
  }

  if (cleanupFn) {
    cleanupFn();
    cleanupFn = null;
  }

  if (stomp) {
    stomp.disconnect();
    stomp = null;
  }

  contentEl = null;
}
