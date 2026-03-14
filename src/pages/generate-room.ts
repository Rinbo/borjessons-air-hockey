/* ===================================================
   Generate Room — Calls the gateway to create a game,
   then navigates to the cold-start screen or directly
   to the game lobby depending on server availability.
   =================================================== */

import { navigate } from '../router';
import { gatewayPost } from '../api/api';

interface CreateGameResponse {
  gameId: string;
  serverUrl: string;
  serverReady: boolean;
}

export function mount(_container: HTMLElement): void {
  createGame();
}

async function createGame(): Promise<void> {
  try {
    const result = await gatewayPost<CreateGameResponse>('/api/games/create');

    if (result.serverReady && result.serverUrl) {
      // Server is ready — store URL and go to game directly
      sessionStorage.setItem('game_server_url', result.serverUrl);
      navigate(`/games/${result.gameId}`);
    } else {
      // Server needs to warm up — show cold-start animation
      navigate(`/games/starting/${result.gameId}`);
    }
  } catch (error) {
    console.error('Failed to create game:', error);
    navigate('/error');
  }
}

export function unmount(): void {
  // No cleanup needed
}
