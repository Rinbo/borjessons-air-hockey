/* ===================================================
   Dev Gate — simple password overlay for dev builds.
   Not a security mechanism — just keeps casual visitors
   out during development. Remove before public launch.
   =================================================== */

// SHA-256 hash of the dev password (currently: "airhockey2026")
const PASSWORD_HASH = '39273985e4ffa85add8f498111eb974e381dc5d541085702e97dfe8972ad4f68';
const STORAGE_KEY = 'dev_gate_passed';

async function sha256(message: string): Promise<string> {
  const data = new TextEncoder().encode(message);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

function createGateOverlay(): HTMLDivElement {
  const overlay = document.createElement('div');
  overlay.id = 'dev-gate';
  overlay.innerHTML = `
    <div style="
      position: fixed; inset: 0; z-index: 99999;
      background: #0a0a0a;
      display: flex; align-items: center; justify-content: center;
      font-family: 'DM Sans', system-ui, sans-serif;
    ">
      <div style="
        background: #1a1a1a; border: 1px solid #333; border-radius: 12px;
        padding: 2.5rem; max-width: 360px; width: 90%; text-align: center;
      ">
        <div style="font-size: 2rem; margin-bottom: 0.5rem;">🏒</div>
        <h2 style="color: #f5f2ed; margin: 0 0 0.5rem; font-size: 1.1rem;">
          Development Build
        </h2>
        <p style="color: #888; font-size: 0.85rem; margin: 0 0 1.5rem;">
          This site is under active development.
        </p>
        <input
          id="dev-gate-input"
          type="password"
          placeholder="Enter dev password"
          autocomplete="off"
          style="
            width: 100%; box-sizing: border-box;
            padding: 0.75rem 1rem; border-radius: 8px;
            border: 1px solid #444; background: #0a0a0a; color: #f5f2ed;
            font-size: 1rem; outline: none; margin-bottom: 0.75rem;
          "
        />
        <button
          id="dev-gate-btn"
          style="
            width: 100%; padding: 0.75rem; border-radius: 8px;
            border: none; background: #e85d2c; color: white;
            font-size: 1rem; font-weight: 600; cursor: pointer;
          "
        >
          Enter
        </button>
        <p id="dev-gate-error" style="
          color: #ff4444; font-size: 0.8rem; margin: 0.75rem 0 0; display: none;
        ">
          Incorrect password
        </p>
      </div>
    </div>
  `;
  return overlay;
}

export function isDevGatePassed(): boolean {
  return sessionStorage.getItem(STORAGE_KEY) === 'true';
}

export function showDevGate(): Promise<void> {
  return new Promise((resolve) => {
    if (isDevGatePassed()) {
      resolve();
      return;
    }

    const overlay = createGateOverlay();
    document.body.appendChild(overlay);

    const input = document.getElementById('dev-gate-input') as HTMLInputElement;
    const btn = document.getElementById('dev-gate-btn') as HTMLButtonElement;
    const error = document.getElementById('dev-gate-error') as HTMLParagraphElement;

    async function tryPassword() {
      const hash = await sha256(input.value);
      if (hash === PASSWORD_HASH) {
        sessionStorage.setItem(STORAGE_KEY, 'true');
        overlay.remove();
        resolve();
      } else {
        error.style.display = 'block';
        input.value = '';
        input.focus();
      }
    }

    btn.addEventListener('click', tryPassword);
    input.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') tryPassword();
      error.style.display = 'none';
    });

    input.focus();
  });
}
