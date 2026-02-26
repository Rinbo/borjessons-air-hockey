/* ===================================================
   Error Page
   =================================================== */

import { navigate } from '../router';

export function mount(container: HTMLElement): void {
  container.innerHTML = `
    <div class="error-page page-enter">
      <h1>Oops!</h1>
      <p>Sorry, an unexpected error has occurred.</p>
      <button class="btn btn-outline" id="btn-home">Go Home</button>
    </div>
  `;

  document.getElementById('btn-home')!.addEventListener('click', () => navigate('/'));
}

export function unmount(): void {
  // No cleanup needed
}
