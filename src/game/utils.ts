import type { Player } from '../types';

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
  const gradient = ctx.createRadialGradient(x, y, radius * 0.2, x, y, radius);
  gradient.addColorStop(0.0, '#8a8a8a');
  gradient.addColorStop(0.4, '#606060');
  gradient.addColorStop(0.7, '#404040');
  gradient.addColorStop(0.85, '#888');
  gradient.addColorStop(0.95, '#555');
  gradient.addColorStop(1.0, '#222');
  return gradient;
}

export function createPuckGradient(ctx: CanvasRenderingContext2D, x: number, y: number, radius: number) {
  const gradient = ctx.createRadialGradient(x, y, radius * 0.3, x, y, radius);
  gradient.addColorStop(0.0, '#2a2a3a');
  gradient.addColorStop(0.6, '#1a1a2a');
  gradient.addColorStop(0.85, '#111118');
  gradient.addColorStop(1.0, '#0a0a10');
  return gradient;
}

/**
 * Pre-renders a gradient circle onto an offscreen canvas and returns it.
 * Can be drawn via ctx.drawImage() for much faster per-frame rendering.
 */
export function createSpriteCanvas(
  radius: number,
  gradientFactory: (ctx: CanvasRenderingContext2D, x: number, y: number, r: number) => CanvasGradient
): HTMLCanvasElement {
  const size = Math.ceil(radius * 2);
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d')!;

  ctx.beginPath();
  ctx.arc(radius, radius, radius, 0, 2 * Math.PI);
  ctx.fillStyle = gradientFactory(ctx, radius, radius, radius);
  ctx.fill();

  return canvas;
}
