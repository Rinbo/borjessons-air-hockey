import { GOAL_ANGLE, GOAL_HEIGHT, GOAL_WIDTH, HANDLE_RADIUS, OPPONENT_HANDLE_START_POS, PLAYER_HANDLE_START_POS, PUCK_RADIUS } from './constants';
import OpponentHandle from './opponent-handle';
import PlayerHandle from './player-handle';
import Puck from './puck';
import { createPlayerHandleSprite, createOpponentHandleSprite, createPuckSprite } from './utils';

type Size = { width: number; height: number };

export type BroadcastState = { opponent: Position; puck: Position; remainingSeconds: number };
export type Position = { x: number; y: number };
export type Radius = Position;

export interface GameObject {
  update: (position: Position) => void;
  draw: () => void;
}

export type BroadcastHandle = (position: Position) => any;

export default class Board {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private opponentHandle: OpponentHandle;
  private playerHandle: PlayerHandle;
  private puck: Puck;
  private size: Size = { width: 350, height: 560 };

  // Interpolation state
  private prevState: BroadcastState | null = null;
  private currState: BroadcastState | null = null;
  private lastUpdateTime: number = 0;
  private serverTickMs: number = 20; // 50 FPS server tick = 20ms

  // Cached background
  private bgCanvas: HTMLCanvasElement | null = null;

  constructor(canvas: HTMLCanvasElement, size: Size, broadcastHandle: BroadcastHandle) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d') as CanvasRenderingContext2D;
    this.opponentHandle = new OpponentHandle(this);
    this.playerHandle = new PlayerHandle(this, broadcastHandle);
    this.puck = new Puck(this);
    this.size = size;
    this.regenerateSprites();
    this.regenerateBackground();
  }

  /**
   * Draws the board with interpolated positions between the two most recent server states.
   */
  public draw(): void {
    const { width, height } = this.size;

    // Draw cached background
    if (this.bgCanvas) {
      this.ctx.drawImage(this.bgCanvas, 0, 0);
    } else {
      this.ctx.clearRect(0, 0, width, height);
    }

    // Apply interpolation before drawing
    if (this.prevState && this.currState) {
      const elapsed = performance.now() - this.lastUpdateTime;
      const alpha = Math.min(elapsed / this.serverTickMs, 1);

      this.opponentHandle.update(this.lerp(this.prevState.opponent, this.currState.opponent, alpha));
      this.puck.update(this.lerp(this.prevState.puck, this.currState.puck, alpha));
    }

    this.playerHandle.draw();
    this.opponentHandle.draw();
    this.puck.draw();
  }

  public getCanvas(): HTMLCanvasElement {
    return this.canvas;
  }

  public getContext(): CanvasRenderingContext2D {
    return this.ctx;
  }

  /**
   * Called when a new server state arrives. Shifts current → previous for interpolation.
   */
  public update(broadcastState: BroadcastState): void {
    this.prevState = this.currState;
    this.currState = broadcastState;
    this.lastUpdateTime = performance.now();

    // If no previous state yet, snap directly
    if (!this.prevState) {
      this.opponentHandle.update(broadcastState.opponent);
      this.puck.update(broadcastState.puck);
    }
  }

  public setSize(size: Size): void {
    if (size.width <= 0 || size.height <= 0) return;
    this.size = size;
    this.playerHandle.update(PLAYER_HANDLE_START_POS);
    this.opponentHandle.update(OPPONENT_HANDLE_START_POS);
    this.playerHandle.setEventListeners();
    this.regenerateSprites();
    this.regenerateBackground();
    this.draw();
    this.ctx.restore();
  }

  public getSize(): Size {
    return this.size;
  }

  public getPlayerHandle(): PlayerHandle {
    return this.playerHandle;
  }

  public destroy(): void {
    this.playerHandle.destroy();
  }

  /**
   * Regenerates sprite canvases for handles and puck based on current board size.
   */
  private regenerateSprites(): void {
    const handleRadius = HANDLE_RADIUS.x * this.size.width;
    const puckRadius = PUCK_RADIUS.x * this.size.width;

    this.playerHandle.updateSprite(createPlayerHandleSprite(handleRadius));
    this.opponentHandle.updateSprite(createOpponentHandleSprite(handleRadius));
    this.puck.updateSprite(createPuckSprite(puckRadius));
  }

  /**
   * Pre-renders the static board background (ice surface, markings, goals)
   * onto an offscreen canvas for fast per-frame blitting.
   */
  private regenerateBackground(): void {
    const { width, height } = this.size;
    if (width <= 0 || height <= 0) return;

    const bg = document.createElement('canvas');
    bg.width = width;
    bg.height = height;
    const ctx = bg.getContext('2d')!;

    // ─── 1. Ice surface ─────────────────────────────────────────────────
    const iceGradient = ctx.createLinearGradient(0, 0, 0, height);
    iceGradient.addColorStop(0, '#e4ecf4');
    iceGradient.addColorStop(0.25, '#edf2f8');
    iceGradient.addColorStop(0.5, '#f2f6fb');
    iceGradient.addColorStop(0.75, '#edf2f8');
    iceGradient.addColorStop(1, '#e4ecf4');
    ctx.fillStyle = iceGradient;
    ctx.fillRect(0, 0, width, height);

    // Subtle cross-hatch ice scratches
    ctx.save();
    ctx.globalAlpha = 0.04;
    ctx.strokeStyle = '#b8c4d0';
    ctx.lineWidth = 0.5;
    const scratchCount = Math.floor(width * height / 600);
    for (let i = 0; i < scratchCount; i++) {
      const sx = Math.random() * width;
      const sy = Math.random() * height;
      const angle = Math.random() * Math.PI;
      const len = Math.random() * 15 + 5;
      ctx.beginPath();
      ctx.moveTo(sx, sy);
      ctx.lineTo(sx + Math.cos(angle) * len, sy + Math.sin(angle) * len);
      ctx.stroke();
    }
    ctx.restore();

    // ─── 2. Goal creases (semi-circles around goals) ────────────────────
    const creaseRadius = width * 0.18;

    // Top crease
    ctx.save();
    ctx.beginPath();
    ctx.arc(width / 2, 0, creaseRadius, 0, Math.PI);
    ctx.fillStyle = 'rgba(200, 60, 60, 0.06)';
    ctx.fill();
    ctx.strokeStyle = 'rgba(180, 50, 50, 0.18)';
    ctx.lineWidth = 1.5;
    ctx.stroke();
    ctx.restore();

    // Bottom crease
    ctx.save();
    ctx.beginPath();
    ctx.arc(width / 2, height, creaseRadius, Math.PI, Math.PI * 2);
    ctx.fillStyle = 'rgba(200, 60, 60, 0.06)';
    ctx.fill();
    ctx.strokeStyle = 'rgba(180, 50, 50, 0.18)';
    ctx.lineWidth = 1.5;
    ctx.stroke();
    ctx.restore();

    // ─── 3. Center line ─────────────────────────────────────────────────
    ctx.save();
    ctx.setLineDash([10, 6]);
    ctx.strokeStyle = 'rgba(180, 50, 50, 0.30)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(4, height / 2);
    ctx.lineTo(width - 4, height / 2);
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.restore();

    // ─── 4. Center circle + dot ─────────────────────────────────────────
    const centerCircleRadius = Math.min(width, height) * 0.13;

    ctx.strokeStyle = 'rgba(40, 80, 160, 0.22)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(width / 2, height / 2, centerCircleRadius, 0, 2 * Math.PI);
    ctx.stroke();

    // Center dot
    ctx.fillStyle = 'rgba(40, 80, 160, 0.30)';
    ctx.beginPath();
    ctx.arc(width / 2, height / 2, Math.max(3, width * 0.008), 0, 2 * Math.PI);
    ctx.fill();

    // ─── 5. Goals ───────────────────────────────────────────────────────
    this.drawGoal(ctx, width, height, 'top');
    this.drawGoal(ctx, width, height, 'bottom');

    // ─── 6. Subtle edge vignette ────────────────────────────────────────
    ctx.save();
    const vigGrad = ctx.createRadialGradient(
      width / 2, height / 2, Math.min(width, height) * 0.35,
      width / 2, height / 2, Math.max(width, height) * 0.7
    );
    vigGrad.addColorStop(0, 'rgba(0, 0, 0, 0)');
    vigGrad.addColorStop(1, 'rgba(0, 0, 0, 0.06)');
    ctx.fillStyle = vigGrad;
    ctx.fillRect(0, 0, width, height);
    ctx.restore();

    this.bgCanvas = bg;
  }

  private drawGoal(ctx: CanvasRenderingContext2D, width: number, height: number, position: 'top' | 'bottom'): void {
    const gw = GOAL_WIDTH * width;
    const gh = GOAL_HEIGHT * height;
    const ga = GOAL_ANGLE * width;
    const cx = width / 2;

    ctx.save();

    const isTop = position === 'top';
    const baseY = isTop ? 0 : height;
    const depthY = isTop ? gh : height - gh;
    const sign = isTop ? 1 : -1;

    // Goal shadow (depth)
    ctx.fillStyle = 'rgba(0, 0, 0, 0.12)';
    ctx.beginPath();
    ctx.moveTo(cx - gw - 2, baseY);
    ctx.lineTo(cx - gw + ga - 2, depthY + sign * 4);
    ctx.lineTo(cx + gw - ga + 2, depthY + sign * 4);
    ctx.lineTo(cx + gw + 2, baseY);
    ctx.fill();

    // Goal interior (dark net area)
    const netGrad = isTop
      ? ctx.createLinearGradient(0, baseY, 0, depthY)
      : ctx.createLinearGradient(0, baseY, 0, depthY);
    netGrad.addColorStop(0, 'rgba(30, 30, 40, 0.35)');
    netGrad.addColorStop(1, 'rgba(30, 30, 40, 0.10)');
    ctx.fillStyle = netGrad;
    ctx.beginPath();
    ctx.moveTo(cx - gw, baseY);
    ctx.lineTo(cx - gw + ga, depthY);
    ctx.lineTo(cx + gw - ga, depthY);
    ctx.lineTo(cx + gw, baseY);
    ctx.fill();

    // Net pattern (horizontal lines)
    ctx.save();
    ctx.beginPath();
    ctx.moveTo(cx - gw, baseY);
    ctx.lineTo(cx - gw + ga, depthY);
    ctx.lineTo(cx + gw - ga, depthY);
    ctx.lineTo(cx + gw, baseY);
    ctx.clip();

    const netLines = 4;
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.12)';
    ctx.lineWidth = 0.5;
    for (let i = 1; i <= netLines; i++) {
      const frac = i / (netLines + 1);
      const ly = isTop ? baseY + (depthY - baseY) * frac : baseY + (depthY - baseY) * frac;
      ctx.beginPath();
      ctx.moveTo(cx - gw + ga * frac, ly);
      ctx.lineTo(cx + gw - ga * frac, ly);
      ctx.stroke();
    }

    // Net pattern (vertical lines)
    const vertLines = 6;
    for (let i = 1; i <= vertLines; i++) {
      const frac = i / (vertLines + 1);
      const lx = (cx - gw + ga) + ((cx + gw - ga) - (cx - gw + ga)) * frac;
      ctx.beginPath();
      ctx.moveTo(cx - gw + (cx + gw - (cx - gw)) * frac, baseY);
      ctx.lineTo(lx, depthY);
      ctx.stroke();
    }
    ctx.restore();

    // Goal frame line
    ctx.strokeStyle = 'rgba(140, 40, 40, 0.45)';
    ctx.lineWidth = 2;
    ctx.lineJoin = 'round';
    ctx.beginPath();
    ctx.moveTo(cx - gw, baseY);
    ctx.lineTo(cx - gw + ga, depthY);
    ctx.lineTo(cx + gw - ga, depthY);
    ctx.lineTo(cx + gw, baseY);
    ctx.stroke();

    // Frame highlight
    ctx.strokeStyle = 'rgba(255, 100, 100, 0.15)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(cx - gw + 1, baseY);
    ctx.lineTo(cx - gw + ga + 1, depthY + sign * 1);
    ctx.lineTo(cx + gw - ga - 1, depthY + sign * 1);
    ctx.lineTo(cx + gw - 1, baseY);
    ctx.stroke();

    ctx.restore();
  }

  private roundedRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number): void {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.lineTo(x + w - r, y);
    ctx.arcTo(x + w, y, x + w, y + r, r);
    ctx.lineTo(x + w, y + h - r);
    ctx.arcTo(x + w, y + h, x + w - r, y + h, r);
    ctx.lineTo(x + r, y + h);
    ctx.arcTo(x, y + h, x, y + h - r, r);
    ctx.lineTo(x, y + r);
    ctx.arcTo(x, y, x + r, y, r);
    ctx.closePath();
  }

  private lerp(from: Position, to: Position, alpha: number): Position {
    return {
      x: from.x + (to.x - from.x) * alpha,
      y: from.y + (to.y - from.y) * alpha
    };
  }
}
