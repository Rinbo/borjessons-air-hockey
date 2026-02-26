import { GOAL_ANGLE, GOAL_HEIGHT, GOAL_WIDTH, HANDLE_RADIUS, OPPONENT_HANDLE_START_POS, PLAYER_HANDLE_START_POS, PUCK_RADIUS } from './constants';
import OpponentHandle from './opponent-handle';
import PlayerHandle from './player-handle';
import Puck from './puck';
import { createHandleGradient, createPuckGradient, createSpriteCanvas } from './utils';

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

    const handleSprite = createSpriteCanvas(handleRadius, createHandleGradient);
    const puckSprite = createSpriteCanvas(puckRadius, createPuckGradient);

    this.playerHandle.updateSprite(handleSprite);
    this.opponentHandle.updateSprite(handleSprite);
    this.puck.updateSprite(puckSprite);
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

    // --- Ice surface gradient ---
    const iceGradient = ctx.createLinearGradient(0, 0, 0, height);
    iceGradient.addColorStop(0, '#e8f0f8');
    iceGradient.addColorStop(0.3, '#f0f5fa');
    iceGradient.addColorStop(0.5, '#f4f8fc');
    iceGradient.addColorStop(0.7, '#f0f5fa');
    iceGradient.addColorStop(1, '#e8f0f8');
    ctx.fillStyle = iceGradient;
    ctx.fillRect(0, 0, width, height);

    // --- Subtle ice texture (faint noise) ---
    ctx.globalAlpha = 0.03;
    for (let i = 0; i < 800; i++) {
      const x = Math.random() * width;
      const y = Math.random() * height;
      const s = Math.random() * 2 + 0.5;
      ctx.fillStyle = Math.random() > 0.5 ? '#fff' : '#ccd';
      ctx.fillRect(x, y, s, s);
    }
    ctx.globalAlpha = 1;

    // --- Board border / rink walls ---
    const wallWidth = 3;
    const cornerRadius = 16;
    ctx.strokeStyle = '#b0b8c0';
    ctx.lineWidth = wallWidth;
    this.roundedRect(ctx, wallWidth / 2, wallWidth / 2, width - wallWidth, height - wallWidth, cornerRadius);
    ctx.stroke();

    // Inner border highlight
    ctx.strokeStyle = 'rgba(255,255,255,0.6)';
    ctx.lineWidth = 1;
    this.roundedRect(ctx, wallWidth + 1, wallWidth + 1, width - 2 * wallWidth - 2, height - 2 * wallWidth - 2, cornerRadius - 2);
    ctx.stroke();

    // --- Center line ---
    ctx.setLineDash([8, 6]);
    ctx.strokeStyle = 'rgba(180, 60, 60, 0.35)';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(wallWidth + 4, height / 2);
    ctx.lineTo(width - wallWidth - 4, height / 2);
    ctx.stroke();
    ctx.setLineDash([]);

    // --- Center circle ---
    const centerCircleRadius = Math.min(width, height) * 0.12;
    ctx.strokeStyle = 'rgba(50, 100, 180, 0.25)';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.arc(width / 2, height / 2, centerCircleRadius, 0, 2 * Math.PI);
    ctx.stroke();

    // Center dot
    ctx.fillStyle = 'rgba(50, 100, 180, 0.3)';
    ctx.beginPath();
    ctx.arc(width / 2, height / 2, 3, 0, 2 * Math.PI);
    ctx.fill();

    // --- Goals ---
    this.drawGoal(ctx, width, height, 'top');
    this.drawGoal(ctx, width, height, 'bottom');

    this.bgCanvas = bg;
  }

  private drawGoal(ctx: CanvasRenderingContext2D, width: number, height: number, position: 'top' | 'bottom'): void {
    const gw = GOAL_WIDTH * width;
    const gh = GOAL_HEIGHT * height;
    const ga = GOAL_ANGLE * width;
    const cx = width / 2;

    ctx.save();

    if (position === 'top') {
      // Goal shadow
      ctx.fillStyle = 'rgba(0, 0, 0, 0.08)';
      ctx.beginPath();
      ctx.moveTo(cx - gw - 2, 0);
      ctx.lineTo(cx - gw + ga - 2, gh + 4);
      ctx.lineTo(cx + gw - ga + 2, gh + 4);
      ctx.lineTo(cx + gw + 2, 0);
      ctx.fill();

      // Goal fill
      const goalGradient = ctx.createLinearGradient(0, 0, 0, gh);
      goalGradient.addColorStop(0, 'rgba(200, 60, 60, 0.15)');
      goalGradient.addColorStop(1, 'rgba(200, 60, 60, 0.05)');
      ctx.fillStyle = goalGradient;
      ctx.beginPath();
      ctx.moveTo(cx - gw, 0);
      ctx.lineTo(cx - gw + ga, gh);
      ctx.lineTo(cx + gw - ga, gh);
      ctx.lineTo(cx + gw, 0);
      ctx.fill();

      // Goal line
      ctx.strokeStyle = 'rgba(180, 50, 50, 0.4)';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(cx - gw, 0);
      ctx.lineTo(cx - gw + ga, gh);
      ctx.lineTo(cx + gw - ga, gh);
      ctx.lineTo(cx + gw, 0);
      ctx.stroke();
    } else {
      // Goal shadow
      ctx.fillStyle = 'rgba(0, 0, 0, 0.08)';
      ctx.beginPath();
      ctx.moveTo(cx - gw - 2, height);
      ctx.lineTo(cx - gw + ga - 2, height - gh - 4);
      ctx.lineTo(cx + gw - ga + 2, height - gh - 4);
      ctx.lineTo(cx + gw + 2, height);
      ctx.fill();

      // Goal fill
      const goalGradient = ctx.createLinearGradient(0, height, 0, height - gh);
      goalGradient.addColorStop(0, 'rgba(200, 60, 60, 0.15)');
      goalGradient.addColorStop(1, 'rgba(200, 60, 60, 0.05)');
      ctx.fillStyle = goalGradient;
      ctx.beginPath();
      ctx.moveTo(cx - gw, height);
      ctx.lineTo(cx - gw + ga, height - gh);
      ctx.lineTo(cx + gw - ga, height - gh);
      ctx.lineTo(cx + gw, height);
      ctx.fill();

      // Goal line
      ctx.strokeStyle = 'rgba(180, 50, 50, 0.4)';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(cx - gw, height);
      ctx.lineTo(cx - gw + ga, height - gh);
      ctx.lineTo(cx + gw - ga, height - gh);
      ctx.lineTo(cx + gw, height);
      ctx.stroke();
    }

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
