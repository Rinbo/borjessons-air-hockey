import Board, { BroadcastHandle, GameObject, Position } from './board';
import { HANDLE_RADIUS, PLAYER_HANDLE_START_POS } from './constants';

type TouchClick = Event & TouchEvent;

export default class PlayerHandle implements GameObject {
  private board: Board;
  private broadcastHandle: BroadcastHandle;
  private isDragging: boolean;
  private position: Position;

  constructor(board: Board, broadcastHandle: BroadcastHandle) {
    this.board = board;
    this.broadcastHandle = broadcastHandle;
    this.isDragging = false;
    this.position = PLAYER_HANDLE_START_POS;
    this.draw();
    this.setEventListeners();
  }

  private setEventListeners(): void {
    const canvas = this.board.getCanvas();
    const { width, height } = this.board.getSize();

    canvas.addEventListener('touchstart', event => this.onStart(event, canvas));

    canvas.addEventListener('touchmove', event => {
      event.preventDefault();
      const { left, top } = canvas.getBoundingClientRect();

      if (this.isDragging) {
        const touch = event.targetTouches[0];

        this.position = { x: (touch.clientX - left) / width, y: (touch.clientY - top) / height };
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

  private onStart(event: TouchClick, canvas: HTMLCanvasElement) {
    event.preventDefault();
    const { left, top } = canvas.getBoundingClientRect();

    const touch = event?.targetTouches[0] || event;
    console.log(this.position);
    console.log(touch.clientX - left, touch.clientY - top);

    if (this.isWithinBoundsOfHandle(touch.clientX - left, touch.clientY - top)) {
      this.isDragging = true;
    }
  }

  private isWithinBoundsOfHandle(x: number, y: number) {
    const { width, height } = this.board.getSize();
    return (x - this.position.x * width) ** 2 + (y - this.position.y * height) ** 2 <= HANDLE_RADIUS * width ** 2;
  }

  private drawHandle() {
    const ctx = this.board.getContext();
    const { width, height } = this.board.getCanvas();

    //ctx.clearRect(0, 0, width, height);
    ctx.beginPath();
    ctx.arc(this.position.x * width, this.position.y * height, HANDLE_RADIUS * width, 0, 2 * Math.PI);
    ctx.fill();
  }
}
