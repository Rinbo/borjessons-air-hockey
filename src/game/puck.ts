import Board, { GameObject, Position } from './board';
import { PUCK_RADIUS } from './constants';
import { createPuckGradient } from './utils';

export default class Puck implements GameObject {
  private position: Position;
  private board: Board;

  constructor(board: Board) {
    this.board = board;
    this.position = { x: 0.5, y: 0.4 };
    this.draw();
  }

  public update(position: Position): void {
    this.position = position;
  }

  public draw(): void {
    this.drawPuck();
  }

  private drawPuck() {
    const ctx = this.board.getContext();
    const { width, height } = this.board.getCanvas();

    ctx.beginPath();
    ctx.arc(this.position.x * width, this.position.y * height, PUCK_RADIUS.x * width, 0, 2 * Math.PI);
    ctx.fillStyle = createPuckGradient(ctx, this.position.x * width, this.position.y * height, PUCK_RADIUS.x * width);
    ctx.fill();
  }
}
