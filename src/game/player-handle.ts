import Board, { BroadcastHandle, GameObject, Position } from './board';
import { HANDLE_RADIUS, PLAYER_HANDLE_START_POS } from './constants';

type ClientPos = MouseEvent | Touch;

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

    canvas.addEventListener('touchstart', event => this.onStart(event.targetTouches[0], canvas));
    canvas.addEventListener('mousedown', event => this.onStart(event, canvas));
    canvas.addEventListener('touchmove', event => this.onMove(event.targetTouches[0], canvas));
    canvas.addEventListener('mousemove', event => this.onMove(event, canvas));
    canvas.addEventListener('touchend', this.onEnd);
    canvas.addEventListener('mouseup', this.onEnd);
  }

  public update(position: Position): void {
    this.position = position;
  }

  public draw() {
    this.drawHandle();
  }

  private onStart(event: ClientPos, canvas: HTMLCanvasElement) {
    const { left, top } = canvas.getBoundingClientRect();

    if (this.isWithinBoundsOfHandle(event.clientX - left, event.clientY - top)) {
      console.log('ON START', event);
      this.isDragging = true;
    }
  }

  private onMove(event: ClientPos, canvas: HTMLCanvasElement) {
    const { left, top } = canvas.getBoundingClientRect();
    const { width, height } = this.board.getSize();

    if (this.isDragging) {
      console.log('IS MOVING', this.isDragging);

      this.position = { x: (event.clientX - left) / width, y: (event.clientY - top) / height };
      this.broadcastHandle(this.position);
      this.drawHandle();
    }
  }

  private onEnd(event: Event) {
    console.log('ON END', event);

    this.isDragging = false;
    console.log('NOW WE SHOULD HAVE SET IT', this.isDragging);
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
