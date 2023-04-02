import Board, { BroadcastHandle, GameObject, Position } from './board';
import { UPDATE_RATE, HANDLE_RADIUS, PLAYER_HANDLE_START_POS } from './constants';
import { createHandleGradient } from './utils';

type ClientEvent = MouseEvent | Touch;

export default class PlayerHandle implements GameObject {
  private board: Board;
  private broadcastHandle: BroadcastHandle;
  private isDragging: boolean;
  private position: Position;
  private tick: number;

  constructor(board: Board, broadcastHandle: BroadcastHandle) {
    this.board = board;
    this.broadcastHandle = broadcastHandle;
    this.isDragging = false;
    this.position = PLAYER_HANDLE_START_POS;
    this.tick = UPDATE_RATE;
    this.draw();
  }

  public setEventListeners(): void {
    const canvas = this.board.getCanvas();

    canvas.addEventListener('touchstart', event => this.onStart(event.targetTouches[0]), { passive: false });
    canvas.addEventListener('mousedown', event => this.onStart(event));
    canvas.addEventListener('touchmove', event => this.onMove(event.targetTouches[0]), { passive: false });
    canvas.addEventListener('mousemove', event => this.onMove(event));
    canvas.addEventListener('touchend', () => (this.isDragging = false));
    canvas.addEventListener('mouseup', () => (this.isDragging = false));
  }

  public update(position: Position): void {
    this.position = position;
  }

  public draw() {
    this.drawHandle();
  }

  private onStart(event: ClientEvent) {
    const { x, y } = this.getCanvasOffset(event);

    if (this.isWithinBoundsOfHandle(x, y)) {
      this.isDragging = true;
    }
  }

  private onMove(event: ClientEvent) {
    if (this.isDragging) {
      this.position = this.normalizePosition(this.getCanvasOffset(event));
      this.drawHandle();
      this.broadcastPosition();
    }
  }

  private broadcastPosition() {
    if (this.tick === UPDATE_RATE) {
      this.broadcastHandle(this.position);
      this.tick = 0;
      return;
    }
    this.tick++;
  }

  private isWithinBoundsOfHandle(x: number, y: number) {
    const { width, height } = this.board.getSize();
    return Math.sqrt((x - this.position.x * width) ** 2 + (y - this.position.y * height) ** 2) <= HANDLE_RADIUS.x * width;
  }

  private drawHandle() {
    const ctx = this.board.getContext();
    const { width, height } = this.board.getCanvas();

    ctx.beginPath();
    ctx.arc(this.position.x * width, this.position.y * height, HANDLE_RADIUS.x * width, 0, 2 * Math.PI);
    ctx.fillStyle = createHandleGradient(ctx, this.position.x * width, this.position.y * height, HANDLE_RADIUS.x * width);
    ctx.fill();
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
