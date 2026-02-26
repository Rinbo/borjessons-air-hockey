/* ===================================================
   Choose a Name Page
   =================================================== */

import { navigate } from '../router';
import { generateUUID } from '../utils/misc-utils';

let returnPath = '/';
let messageText = 'Choose a name';

export function setReturnPath(path: string): void {
  returnPath = path;
}

export function setMessage(msg: string): void {
  messageText = msg;
}

export function mount(container: HTMLElement): void {
  container.innerHTML = `
    <div class="choose-name page-enter">
      <div class="top-banner" id="banner-home">
        <span class="top-banner__back">‹</span>
        <span class="top-banner__text">borjessons air hockey</span>
      </div>

      <div class="choose-name__card">
        <h2 class="choose-name__title">${messageText}</h2>
        <form class="choose-name__form" id="name-form">
          <input
            type="text"
            class="input"
            id="name-input"
            placeholder="Name"
            autocomplete="off"
            maxlength="12"
          />
          <span class="error-text" id="name-error"></span>
          <button type="submit" class="btn btn-primary">Save</button>
        </form>
      </div>
    </div>
  `;

  const form = document.getElementById('name-form') as HTMLFormElement;
  const input = document.getElementById('name-input') as HTMLInputElement;
  const errorEl = document.getElementById('name-error')!;

  document.getElementById('banner-home')!.addEventListener('click', () => navigate('/'));

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const name = input.value.trim();

    // Validation
    if (name.length < 2) {
      errorEl.textContent = 'Too short. Min 2 characters';
      input.classList.add('input-error');
      return;
    }
    if (name.length > 12) {
      errorEl.textContent = 'Too long. Max 12 characters';
      input.classList.add('input-error');
      return;
    }
    if (!/^[A-Za-z0-9]+$/.test(name)) {
      errorEl.textContent = 'Only alphanumeric characters allowed';
      input.classList.add('input-error');
      return;
    }

    // Valid
    localStorage.setItem('username', name + '$' + generateUUID());
    navigate(returnPath);
    returnPath = '/';
    messageText = 'Choose a name';
  });

  input.addEventListener('input', () => {
    errorEl.textContent = '';
    input.classList.remove('input-error');
  });
}

export function unmount(): void {
  // No cleanup needed
}
