/* ===================================================
   Shared Types
   =================================================== */

export enum GameState {
  PLAYER_1_DISCONNECT = 'PLAYER_1_DISCONNECT',
  PLAYER_2_DISCONNECT = 'PLAYER_2_DISCONNECT',
  LOBBY = 'LOBBY',
  FORBIDDEN = 'FORBIDDEN',
  GAME_RUNNING = 'GAME_RUNNING',
  SCORE_SCREEN = 'SCORE_SCREEN'
}

export type Agent = 'PLAYER_1' | 'PLAYER_2';

export interface Player {
  username: string;
  agency: Agent;
  ready: boolean;
  score: number;
  gamesWon: number;
}

export interface Message {
  username: string;
  message: string;
  datetime: Date;
}

export interface Game {
  gameId: string;
  username: string;
  joinable: boolean;
}
