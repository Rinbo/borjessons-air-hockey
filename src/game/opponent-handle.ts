import Board, { GameObject, Position } from './board';
import { HANDLE_RADIUS, OPPONENT_HANDLE_START_POS } from './constants';

export default class OpponentHandle implements GameObject {
  private board;
  private position: Position;

  constructor(board: Board) {
    this.board = board;
    this.position = OPPONENT_HANDLE_START_POS;
    this.draw();
  }

  public update(position: Position): void {
    this.position = position;
  }

  public draw() {
    this.drawHandle();
  }

  private drawHandle() {
    const ctx = this.board.getContext();
    const { width, height } = this.board.getCanvas();

    ctx.beginPath();
    ctx.arc(this.position.x * width, this.position.y * height, HANDLE_RADIUS * width, 0, 2 * Math.PI);
    ctx.fill();
  }
}
