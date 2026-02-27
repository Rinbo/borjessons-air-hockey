import Board, { BroadcastHandle, GameObject, Position } from './board';
import { HANDLE_RADIUS, PLAYER_HANDLE_START_POS } from './constants';
import { SHADOW_PAD } from './utils';

type ClientEvent = MouseEvent | Touch;

const BROADCAST_INTERVAL_MS = 20; // ~50Hz, aligned with server tick rate

export default class PlayerHandle implements GameObject {
  private board: Board;
  private broadcastHandle: BroadcastHandle;
  private isDragging: boolean;
  private position: Position;
  private lastBroadcastTime: number;
  private sprite: HTMLCanvasElement | null = null;
  private abortController: AbortController;

  constructor(board: Board, broadcastHandle: BroadcastHandle) {
    this.board = board;
    this.broadcastHandle = broadcastHandle;
    this.isDragging = false;
    this.position = PLAYER_HANDLE_START_POS;
    this.lastBroadcastTime = 0;
    this.abortController = new AbortController();
    this.draw();
  }

  public setEventListeners(): void {
    // Abort previous listeners to prevent accumulation on resize
    this.abortController.abort();
    this.abortController = new AbortController();
    const signal = this.abortController.signal;
    const canvas = this.board.getCanvas();

    canvas.addEventListener('touchstart', event => this.onTouchStart(event), { passive: false, signal });
    canvas.addEventListener('mousedown', event => this.onStart(event), { signal });
    canvas.addEventListener('touchmove', event => this.onTouchMove(event), { passive: false, signal });
    canvas.addEventListener('mousemove', event => this.onMove(event), { signal });
    canvas.addEventListener('touchend', () => (this.isDragging = false), { signal });
    canvas.addEventListener('mouseup', () => (this.isDragging = false), { signal });
  }

  public update(position: Position): void {
    this.position = position;
  }

  public draw(): void {
    this.drawHandle();
  }

  public updateSprite(sprite: HTMLCanvasElement): void {
    this.sprite = sprite;
  }

  public destroy(): void {
    this.abortController.abort();
  }

  private onTouchStart(event: TouchEvent): void {
    event.preventDefault();
    this.onStart(event.targetTouches[0]);
  }

  private onStart(event: ClientEvent): void {
    const { x, y } = this.getCanvasOffset(event);

    if (this.isWithinBoundsOfHandle(x, y)) {
      this.isDragging = true;
    }
  }

  private onTouchMove(event: TouchEvent): void {
    event.preventDefault();
    this.onMove(event.targetTouches[0]);
  }

  private onMove(event: ClientEvent): void {
    if (this.isDragging) {
      this.position = this.normalizePosition(this.getCanvasOffset(event));
      // No drawHandle() here — the rAF loop handles drawing
      this.broadcastPosition();
    }
  }

  private broadcastPosition(): void {
    const now = performance.now();
    if (now - this.lastBroadcastTime >= BROADCAST_INTERVAL_MS) {
      this.broadcastHandle(this.position);
      this.lastBroadcastTime = now;
    }
  }

  private isWithinBoundsOfHandle(x: number, y: number): boolean {
    const { width, height } = this.board.getSize();
    return Math.sqrt((x - this.position.x * width) ** 2 + (y - this.position.y * height) ** 2) <= HANDLE_RADIUS.x * width;
  }

  private drawHandle(): void {
    const ctx = this.board.getContext();
    const { width, height } = this.board.getCanvas();
    const px = this.position.x * width;
    const py = this.position.y * height;
    const r = HANDLE_RADIUS.x * width;
    const offset = r * (1 + SHADOW_PAD);

    if (this.sprite) {
      ctx.drawImage(this.sprite, px - offset, py - offset);
    } else {
      // Fallback: direct draw (used before first sprite is generated)
      ctx.beginPath();
      ctx.arc(px, py, r, 0, 2 * Math.PI);
      ctx.fillStyle = '#303030';
      ctx.fill();
    }
  }

  private getCanvasOffset(event: ClientEvent): Position {
    const { left, top } = this.board.getCanvas().getBoundingClientRect();

    return { x: event.clientX - left, y: event.clientY - top };
  }

  /**
   * Translates absolute canvas coordinates to a ratio of canvas width and height, and makes sure
   * the handle stays within the bounds of the board
   */
  private normalizePosition(postion: Position): Position {
    const { width, height } = this.board.getSize();

    const xRel = Math.max(HANDLE_RADIUS.x, postion.x / width);
    const yRel = Math.max(0.5 + HANDLE_RADIUS.y, postion.y / height);

    return { x: Math.min(1 - HANDLE_RADIUS.x, xRel), y: Math.min(1 - HANDLE_RADIUS.y, yRel) };
  }
}
