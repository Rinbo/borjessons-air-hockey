import Board, { BroadcastHandle, GameObject, Position } from './board';
import { HANDLE_RADIUS, PLAYER_HANDLE_START_POS } from './constants';

export default class PlayerHandle implements GameObject {
  private board: Board;
  private broadcastHandle: BroadcastHandle;
  private isDragging: boolean = false;
  private position: Position = PLAYER_HANDLE_START_POS;

  constructor(board: Board, broadcastHandle: BroadcastHandle) {
    this.board = board;
    this.broadcastHandle = broadcastHandle;
    this.draw();
    this.setEventListeners();
  }

  private setEventListeners(): void {
    const canvas = this.board.getCanvas();
    const { width, height } = this.board.getSize();

    canvas.addEventListener('touchstart', event => {
      event.preventDefault();
      const touch = event.targetTouches[0];
      if (this.isWithinBoundsOfHandle(touch.clientX, touch.clientY)) {
        this.isDragging = true;
      }
    });

    canvas.addEventListener('touchmove', event => {
      event.preventDefault();
      if (this.isDragging) {
        const touch = event.targetTouches[0];
        this.position = { x: touch.clientX / width, y: touch.clientY / height };
        this.broadcastHandle(this.position);
        this.drawHandle();
      }
    });

    canvas.addEventListener('touchend', event => {
      event.preventDefault();
      this.isDragging = false;
    });
  }

  public update(position: Position): void {
    this.position = position;
  }

  public draw() {
    this.drawHandle();
  }

  private isWithinBoundsOfHandle(x: number, y: number) {
    const { width, height } = this.board.getSize();
    return (x - this.position.x * width) ** 2 + (y - this.position.y * height) ** 2 <= HANDLE_RADIUS * width ** 2;
  }

  private drawHandle() {
    const ctx = this.board.getContext();
    const { width, height } = this.board.getCanvas();

    ctx.clearRect(0, 0, width, height);
    ctx.beginPath();
    ctx.arc(this.position.x, this.position.y, HANDLE_RADIUS * width, 0, 2 * Math.PI);
    ctx.fill();
  }
}
