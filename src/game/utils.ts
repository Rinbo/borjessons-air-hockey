import { Player } from '../routes/games/game-container';

export function getAgencyExtention(players: Player[], username: string): string {
  const player = players.find(player => player.username === username);

  switch (player?.agency) {
    case 'PLAYER_1':
      return '/player-1';
    case 'PLAYER_2':
      return '/player-2';
    default:
      console.error('illegal state, could not find player', players);
      throw new Error();
  }
}
