/* ===================================================
   Generate Room — Redirect to a new game ID
   =================================================== */

import { navigate } from '../router';
import { generateUUID } from '../utils/misc-utils';

export function mount(_container: HTMLElement): void {
  const roomId = generateUUID();
  navigate(`/games/${roomId}`);
}

export function unmount(): void {
  // No cleanup needed
}
