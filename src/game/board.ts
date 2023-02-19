import { OPPONENT_HANDLE_START_POS, PLAYER_HANDLE_START_POS } from './constants';
import OpponentHandle from './opponent-handle';
import PlayerHandle from './player-handle';
import Puck from './puck';

type Size = { width: number; height: number };

export type BroadcastState = { opponent: Position; puck: Position };
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

  constructor(canvas: HTMLCanvasElement, size: Size, broadcastHandle: BroadcastHandle) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d') as CanvasRenderingContext2D;
    this.opponentHandle = new OpponentHandle(this);
    this.playerHandle = new PlayerHandle(this, broadcastHandle);
    this.puck = new Puck(this);
    this.size = size;
  }

  public draw(): void {
    this.ctx.clearRect(0, 0, this.size.width, this.size.height);
    this.centerLine();
    [this.playerHandle, this.opponentHandle, this.puck].map(e => e.draw());
  }

  public getCanvas(): HTMLCanvasElement {
    return this.canvas;
  }

  public getContext(): CanvasRenderingContext2D {
    return this.ctx;
  }

  public update(broadcastState: BroadcastState): void {
    this.opponentHandle.update(broadcastState.opponent);
    this.puck.update(broadcastState.puck);
  }

  public setSize(size: Size): void {
    this.size = size;
    this.playerHandle.update(PLAYER_HANDLE_START_POS);
    this.opponentHandle.update(OPPONENT_HANDLE_START_POS);
    this.playerHandle.setEventListeners();
    this.draw();
    this.ctx.restore();
  }

  public getSize(): Size {
    return this.size;
  }

  private centerLine() {
    this.ctx.lineWidth = 1;
    this.ctx.strokeStyle = 'rgb(0,0,0,0.5)';
    this.ctx.beginPath();
    this.ctx.moveTo(0, this.canvas.height / 2);
    this.ctx.lineTo(this.canvas.width, this.canvas.height / 2);
    this.ctx.stroke();
  }
}
