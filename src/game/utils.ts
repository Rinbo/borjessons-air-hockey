import { Player } from '../routes/games/game-container';

export function getAgencyExtention(players: Player[], username: string): string {
  const player = players.find(player => player.username === username);

  switch (player?.agency) {
    case 'PLAYER_1':
      return 'player-1';
    case 'PLAYER_2':
      return 'player-2';
    default:
      console.error('illegal state, could not find player', players);
      throw new Error();
  }
}

export function createHandleGradient(ctx: CanvasRenderingContext2D, x: number, y: number, radius: number) {
  const gradient = ctx.createRadialGradient(x, y, radius * 0.4, x, y, radius);
  gradient.addColorStop(0.0, '#575757');
  gradient.addColorStop(0.7, '#303030');
  gradient.addColorStop(0.9, '#7e7e7e');
  gradient.addColorStop(1.0, '#1c1c1c');
  return gradient;
}
