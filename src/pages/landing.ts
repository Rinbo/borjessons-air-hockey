/* ===================================================
   Landing Page
   =================================================== */

import { navigate } from '../router';
import playIcon from '../assets/svg/play.svg';
import shareIcon from '../assets/svg/share.svg';
import wifiIcon from '../assets/svg/wifi.svg';

export function mount(container: HTMLElement): void {
  container.innerHTML = `
    <div class="landing page-enter">
      <div class="landing__particles">
        <span></span><span></span><span></span>
        <span></span><span></span><span></span>
      </div>

      <div class="landing__header">
        <div class="landing__subtitle">borjessons</div>
        <h1 class="landing__title ripple">Air Hockey</h1>
      </div>

      <div class="landing__actions">
        <button class="btn btn-primary btn-lg" id="btn-join">
          <img src="${shareIcon}" alt="" />
          Join Games
        </button>
        <button class="btn btn-primary btn-lg" id="btn-create">
          <img src="${playIcon}" alt="" />
          Create Game
        </button>
        <button class="btn btn-outline btn-lg" id="btn-online">
          <img src="${wifiIcon}" alt="" />
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
