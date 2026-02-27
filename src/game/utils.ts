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

// ─── Shadow padding ────────────────────────────────────────────────────────
// Sprites are rendered larger than the game object to accommodate a drop shadow.
// This padding (as a fraction of the radius) is applied on all sides.
export const SHADOW_PAD = 0.35;
// Shadow offset as fraction of radius
const SHADOW_DX = 0.08;
const SHADOW_DY = 0.15;

// ─── Handle color palettes ─────────────────────────────────────────────────

interface HandlePalette {
  rimOuter: string;
  rimInner: string;
  bodyFrom: string;
  bodyMid: string;
  bodyTo: string;
  bodyEdge: string;
  highlightCenter: string;
}

const PLAYER_PALETTE: HandlePalette = {
  rimOuter: '#004D54',
  rimInner: '#007580',
  bodyFrom: '#26C6DA',
  bodyMid: '#00BCD4',
  bodyTo: '#0097A7',
  bodyEdge: '#00838F',
  highlightCenter: 'rgba(255, 255, 255, 0.85)',
};

const OPPONENT_PALETTE: HandlePalette = {
  rimOuter: '#4E2600',
  rimInner: '#8B4500',
  bodyFrom: '#FF9100',
  bodyMid: '#FF6D00',
  bodyTo: '#E65100',
  bodyEdge: '#BF360C',
  highlightCenter: 'rgba(255, 255, 255, 0.80)',
};

// ─── Handle sprite factory ─────────────────────────────────────────────────

function createHandleSprite(radius: number, palette: HandlePalette): HTMLCanvasElement {
  const pad = radius * SHADOW_PAD;
  const size = Math.ceil((radius + pad) * 2);
  const cx = size / 2;
  const cy = size / 2;

  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d')!;

  // 1 ─ Drop shadow
  ctx.beginPath();
  ctx.arc(cx + radius * SHADOW_DX, cy + radius * SHADOW_DY, radius * 1.02, 0, Math.PI * 2);
  ctx.fillStyle = 'rgba(0, 0, 0, 0.25)';
  ctx.filter = `blur(${Math.max(2, radius * 0.12)}px)`;
  ctx.fill();
  ctx.filter = 'none';

  // 2 ─ Outer rim (bevel)
  const rimWidth = radius * 0.16;
  ctx.beginPath();
  ctx.arc(cx, cy, radius, 0, Math.PI * 2);
  const rimGrad = ctx.createRadialGradient(cx, cy, radius - rimWidth, cx, cy, radius);
  rimGrad.addColorStop(0, palette.rimInner);
  rimGrad.addColorStop(0.5, palette.rimOuter);
  rimGrad.addColorStop(1, palette.rimOuter);
  ctx.fillStyle = rimGrad;
  ctx.fill();

  // Rim top highlight
  ctx.beginPath();
  ctx.arc(cx, cy, radius, Math.PI * 1.15, Math.PI * 1.85);
  ctx.arc(cx, cy, radius - rimWidth * 0.5, Math.PI * 1.85, Math.PI * 1.15, true);
  ctx.closePath();
  ctx.fillStyle = 'rgba(255, 255, 255, 0.12)';
  ctx.fill();

  // 3 ─ Body fill (main surface)
  const bodyRadius = radius - rimWidth;
  ctx.beginPath();
  ctx.arc(cx, cy, bodyRadius, 0, Math.PI * 2);
  const bodyGrad = ctx.createRadialGradient(
    cx - bodyRadius * 0.25,
    cy - bodyRadius * 0.3,
    bodyRadius * 0.1,
    cx,
    cy,
    bodyRadius
  );
  bodyGrad.addColorStop(0, palette.bodyFrom);
  bodyGrad.addColorStop(0.35, palette.bodyMid);
  bodyGrad.addColorStop(0.7, palette.bodyTo);
  bodyGrad.addColorStop(1, palette.bodyEdge);
  ctx.fillStyle = bodyGrad;
  ctx.fill();

  // 4 ─ Inner ring detail (subtle concentric groove)
  const grooveRadius = bodyRadius * 0.55;
  ctx.beginPath();
  ctx.arc(cx, cy, grooveRadius, 0, Math.PI * 2);
  ctx.strokeStyle = 'rgba(0, 0, 0, 0.12)';
  ctx.lineWidth = Math.max(1, radius * 0.03);
  ctx.stroke();

  // Inner groove highlight (just inside)
  ctx.beginPath();
  ctx.arc(cx, cy, grooveRadius - Math.max(1, radius * 0.03), 0, Math.PI * 2);
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.10)';
  ctx.lineWidth = Math.max(0.5, radius * 0.02);
  ctx.stroke();

  // 5 ─ Center circle (finger grip area)
  const centerRadius = bodyRadius * 0.22;
  ctx.beginPath();
  ctx.arc(cx, cy, centerRadius, 0, Math.PI * 2);
  const centerGrad = ctx.createRadialGradient(cx, cy, 0, cx, cy, centerRadius);
  centerGrad.addColorStop(0, palette.bodyMid);
  centerGrad.addColorStop(1, palette.bodyTo);
  ctx.fillStyle = centerGrad;
  ctx.fill();
  ctx.strokeStyle = 'rgba(0, 0, 0, 0.15)';
  ctx.lineWidth = Math.max(0.5, radius * 0.02);
  ctx.stroke();

  // 6 ─ Specular highlight (off-center ellipse)
  ctx.save();
  ctx.beginPath();
  ctx.arc(cx, cy, bodyRadius, 0, Math.PI * 2);
  ctx.clip();
  ctx.translate(cx - bodyRadius * 0.22, cy - bodyRadius * 0.35);
  ctx.scale(1, 0.55);
  ctx.beginPath();
  ctx.arc(0, 0, bodyRadius * 0.55, 0, Math.PI * 2);
  const hlGrad = ctx.createRadialGradient(0, 0, 0, 0, 0, bodyRadius * 0.55);
  hlGrad.addColorStop(0, palette.highlightCenter);
  hlGrad.addColorStop(0.4, 'rgba(255, 255, 255, 0.25)');
  hlGrad.addColorStop(1, 'rgba(255, 255, 255, 0)');
  ctx.fillStyle = hlGrad;
  ctx.fill();
  ctx.restore();

  return canvas;
}

export function createPlayerHandleSprite(radius: number): HTMLCanvasElement {
  return createHandleSprite(radius, PLAYER_PALETTE);
}

export function createOpponentHandleSprite(radius: number): HTMLCanvasElement {
  return createHandleSprite(radius, OPPONENT_PALETTE);
}

// ─── Puck sprite factory ───────────────────────────────────────────────────

export function createPuckSprite(radius: number): HTMLCanvasElement {
  const pad = radius * SHADOW_PAD;
  const size = Math.ceil((radius + pad) * 2);
  const cx = size / 2;
  const cy = size / 2;

  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d')!;

  // 1 ─ Drop shadow
  ctx.beginPath();
  ctx.arc(cx + radius * SHADOW_DX, cy + radius * SHADOW_DY, radius * 1.05, 0, Math.PI * 2);
  ctx.fillStyle = 'rgba(0, 0, 0, 0.30)';
  ctx.filter = `blur(${Math.max(2, radius * 0.14)}px)`;
  ctx.fill();
  ctx.filter = 'none';

  // 2 ─ Outer rim (bevel edge)
  ctx.beginPath();
  ctx.arc(cx, cy, radius, 0, Math.PI * 2);
  const rimGrad = ctx.createRadialGradient(cx, cy, radius * 0.82, cx, cy, radius);
  rimGrad.addColorStop(0, '#2a2a3a');
  rimGrad.addColorStop(0.4, '#1a1a28');
  rimGrad.addColorStop(1, '#0a0a12');
  ctx.fillStyle = rimGrad;
  ctx.fill();

  // 3 ─ Main surface (FLAT — uniform fill, not a sphere gradient)
  const innerRadius = radius * 0.85;
  ctx.beginPath();
  ctx.arc(cx, cy, innerRadius, 0, Math.PI * 2);
  // Centered gradient with very subtle falloff → reads as flat
  const surfGrad = ctx.createRadialGradient(cx, cy, 0, cx, cy, innerRadius);
  surfGrad.addColorStop(0, '#2e2e42');
  surfGrad.addColorStop(0.6, '#2a2a3c');
  surfGrad.addColorStop(1, '#222234');
  ctx.fillStyle = surfGrad;
  ctx.fill();

  // 4 ─ Concentric ring texture (stronger — the signature puck detail)
  const ringCount = 5;
  for (let i = 1; i <= ringCount; i++) {
    const frac = i / (ringCount + 1);
    ctx.beginPath();
    ctx.arc(cx, cy, innerRadius * frac, 0, Math.PI * 2);
    ctx.strokeStyle = `rgba(200, 200, 220, ${0.07 + (i % 2) * 0.04})`;
    ctx.lineWidth = Math.max(0.5, radius * 0.018);
    ctx.stroke();
  }

  // 5 ─ Edge highlight (rim light, upper-left — suggests disc edge catching light)
  ctx.beginPath();
  ctx.arc(cx, cy, radius, Math.PI * 0.85, Math.PI * 1.65);
  ctx.strokeStyle = 'rgba(180, 190, 220, 0.22)';
  ctx.lineWidth = Math.max(1, radius * 0.05);
  ctx.lineCap = 'round';
  ctx.stroke();

  // 6 ─ Flat surface sheen (wide horizontal band instead of round specular)
  //     This is what makes it look like a flat disc instead of a sphere.
  ctx.save();
  ctx.beginPath();
  ctx.arc(cx, cy, innerRadius, 0, Math.PI * 2);
  ctx.clip();
  // Wide, very flat ellipse across the upper portion
  const sheenY = cy - innerRadius * 0.15;
  const sheenGrad = ctx.createLinearGradient(cx, sheenY - innerRadius * 0.2, cx, sheenY + innerRadius * 0.25);
  sheenGrad.addColorStop(0, 'rgba(255, 255, 255, 0)');
  sheenGrad.addColorStop(0.35, 'rgba(255, 255, 255, 0.07)');
  sheenGrad.addColorStop(0.5, 'rgba(255, 255, 255, 0.10)');
  sheenGrad.addColorStop(0.65, 'rgba(255, 255, 255, 0.07)');
  sheenGrad.addColorStop(1, 'rgba(255, 255, 255, 0)');
  ctx.fillRect(cx - innerRadius, sheenY - innerRadius * 0.2, innerRadius * 2, innerRadius * 0.45);
  ctx.restore();

  return canvas;
}
