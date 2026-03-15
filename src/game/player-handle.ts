import Board, { BroadcastHandle, GameObject, Position } from './board';
import { HANDLE_RADIUS, PLAYER_HANDLE_START_POS, TOUCH_OFFSET_Y } from './constants';
import { SHADOW_PAD } from './utils';

const BROADCAST_INTERVAL_MS = 16; // ~60Hz, aligned with server tick rate

export default class PlayerHandle implements GameObject {
  private board: Board;
  private broadcastHandle: BroadcastHandle;
  private isDragging: boolean;
  private position: Position;
  private lastBroadcastTime: number;
  private sprite: HTMLCanvasElement | null = null;
  private abortController: AbortController;
  private isTouch: boolean = false;

  // Cached canvas rect — set once on pointerdown, reused for all pointermove events
  private cachedRect: DOMRect | null = null;

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

    canvas.addEventListener('pointerdown', event => this.onPointerDown(event), { signal });
    canvas.addEventListener('pointermove', event => this.onPointerMove(event), { signal });
    canvas.addEventListener('pointerup', event => this.onPointerUp(event), { signal });
    canvas.addEventListener('pointercancel', event => this.onPointerUp(event), { signal });
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

  private onPointerDown(event: PointerEvent): void {
    // Cache the bounding rect once per drag to avoid layout thrashing on every move
    this.cachedRect = this.board.getCanvas().getBoundingClientRect();
    const { x, y } = this.getCanvasOffset(event);

    // Expand hit-target for coarse pointers (touch) so fat fingers don't miss
    this.isTouch = event.pointerType === 'touch';
    const hitScale = this.isTouch ? 1.8 : 1.0;
    if (this.isWithinBoundsOfHandle(x, y, hitScale)) {
      this.isDragging = true;
      event.preventDefault();
      // Capture the pointer so events keep firing even if the finger leaves the canvas
      this.board.getCanvas().setPointerCapture(event.pointerId);
    }
  }

  private onPointerMove(event: PointerEvent): void {
    if (!this.isDragging) return;
    event.preventDefault();

    // Process coalesced events for full touch-sensor resolution (~120-240 Hz)
    // instead of the default display-rate (~60 Hz) pointermove delivery.
    const events = event.getCoalescedEvents?.() ?? [event];
    for (const e of events) {
      this.position = this.normalizePosition(this.getCanvasOffset(e));
    }

    this.broadcastPosition();
  }

  private onPointerUp(event: PointerEvent): void {
    if (this.isDragging) {
      this.isDragging = false;
      this.board.getCanvas().releasePointerCapture(event.pointerId);
      this.cachedRect = null;
    }
  }

  private broadcastPosition(): void {
    const now = performance.now();
    if (now - this.lastBroadcastTime >= BROADCAST_INTERVAL_MS) {
      this.broadcastHandle(this.position);
      this.lastBroadcastTime = now;
    }
  }

  private isWithinBoundsOfHandle(x: number, y: number, hitScale: number = 1.0): boolean {
    const { width, height } = this.board.getSize();
    return Math.sqrt((x - this.position.x * width) ** 2 + (y - this.position.y * height) ** 2) <= HANDLE_RADIUS.x * width * hitScale;
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

  private getCanvasOffset(event: PointerEvent): Position {
    const rect = this.cachedRect ?? this.board.getCanvas().getBoundingClientRect();
    return { x: event.clientX - rect.left, y: event.clientY - rect.top };
  }

  /**
   * Translates absolute canvas coordinates to a ratio of canvas width and height, and makes sure
   * the handle stays within the bounds of the board
   */
  private normalizePosition(postion: Position): Position {
    const { width, height } = this.board.getSize();

    const xRel = Math.max(HANDLE_RADIUS.x, postion.x / width);
    let yRel = Math.max(0.5 + HANDLE_RADIUS.y, postion.y / height);

    // On touch, shift the handle above the finger so it's visible under the thumb
    if (this.isTouch) {
      yRel = Math.max(0.5 + HANDLE_RADIUS.y, yRel - TOUCH_OFFSET_Y);
    }

    return { x: Math.min(1 - HANDLE_RADIUS.x, xRel), y: Math.min(1 - HANDLE_RADIUS.y, yRel) };
  }
}
