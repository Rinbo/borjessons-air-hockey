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

  constructor(canvas: HTMLCanvasElement, size: Size, broadcastHandle: BroadcastHandle) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d') as CanvasRenderingContext2D;
    this.opponentHandle = new OpponentHandle(this);
    this.playerHandle = new PlayerHandle(this, broadcastHandle);
    this.puck = new Puck(this);
    this.size = size;
    this.regenerateSprites();
  }

  /**
   * Draws the board with interpolated positions between the two most recent server states.
   */
  public draw(): void {
    this.ctx.clearRect(0, 0, this.size.width, this.size.height);
    this.centerLine();
    this.goal(this.bottomGoal);
    this.goal(this.topGoal);

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

  private lerp(from: Position, to: Position, alpha: number): Position {
    return {
      x: from.x + (to.x - from.x) * alpha,
      y: from.y + (to.y - from.y) * alpha
    };
  }

  private centerLine() {
    this.ctx.lineWidth = 1;
    this.ctx.strokeStyle = 'rgb(0,0,0,0.5)';
    this.ctx.beginPath();
    this.ctx.moveTo(0, this.canvas.height / 2);
    this.ctx.lineTo(this.canvas.width, this.canvas.height / 2);
    this.ctx.stroke();
  }

  private goal(callback: (width: number, height: number, ctx: CanvasRenderingContext2D) => void): void {
    const { width, height } = this.size;
    this.ctx.lineWidth = 1;
    this.ctx.fillStyle = 'rgb(0,0,0,0.2)';
    this.ctx.beginPath();
    callback(width, height, this.ctx);
    this.ctx.stroke();
    this.ctx.fill();
    this.ctx.fillStyle = 'rgb(0,0,0,1)';
  }

  private topGoal(width: number, height: number, ctx: CanvasRenderingContext2D): void {
    ctx.moveTo(width / 2 - GOAL_WIDTH * width, 0);
    ctx.lineTo(width / 2 - GOAL_WIDTH * width + GOAL_ANGLE * width, GOAL_HEIGHT * height);
    ctx.lineTo(width / 2 + GOAL_WIDTH * width - GOAL_ANGLE * width, GOAL_HEIGHT * height);
    ctx.lineTo(width / 2 + GOAL_WIDTH * width, 0);
  }
  private bottomGoal(width: number, height: number, ctx: CanvasRenderingContext2D): void {
    ctx.moveTo(width / 2 - GOAL_WIDTH * width, height);
    ctx.lineTo(width / 2 - GOAL_WIDTH * width + GOAL_ANGLE * width, height - GOAL_HEIGHT * height);
    ctx.lineTo(width / 2 + GOAL_WIDTH * width - GOAL_ANGLE * width, height - GOAL_HEIGHT * height);
    ctx.lineTo(width / 2 + GOAL_WIDTH * width, height);
  }
}
