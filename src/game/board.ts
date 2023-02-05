import Handle from './handle';
import PlayerHandle from './PlayerHandle';

type Size = { width: number; height: number };

export type BroadcastState = { opponent: Position; puck: Position };
export type Position = { x: number; y: number };

export interface GameObject {
  update: (position: Position) => void;
  draw: () => void;
}

export type UpdateHandle = (destination: string, headers?: {}, body?: string) => any;

export default class Board {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private opponentHandle: Handle;
  private playerHandle: PlayerHandle;
  private size: Size;

  constructor(canvas: HTMLCanvasElement, size: Size, updateHandle: UpdateHandle) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d') as CanvasRenderingContext2D;
    this.opponentHandle = new Handle(this);
    this.playerHandle = new PlayerHandle(this);
    this.size = size;
  }

  public draw(): void {
    this.ctx.clearRect(0, 0, this.size.width, this.size.height);
    [this.playerHandle, this.opponentHandle].map(e => e.draw());
  }

  public getCanvas(): HTMLCanvasElement {
    return this.canvas;
  }

  public update(broadcastState: BroadcastState): void {
    this.opponentHandle.update(broadcastState.opponent);
  }

  public setSize(size: Size): void {
    this.size = size;
    this.ctx.restore();
  }

  public getSize(): Size {
    return this.size;
  }
}
