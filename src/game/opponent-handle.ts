import Board, { GameObject, Position } from './board';
import { HANDLE_RADIUS, OPPONENT_HANDLE_START_POS } from './constants';

export default class OpponentHandle implements GameObject {
  private board;
  private position: Position;
  private sprite: HTMLCanvasElement | null = null;

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

  public updateSprite(sprite: HTMLCanvasElement): void {
    this.sprite = sprite;
  }

  private drawHandle() {
    const ctx = this.board.getContext();
    const { width, height } = this.board.getCanvas();
    const px = this.position.x * width;
    const py = this.position.y * height;
    const r = HANDLE_RADIUS.x * width;

    if (this.sprite) {
      ctx.drawImage(this.sprite, px - r, py - r);
    } else {
      // Fallback before sprite is generated
      ctx.beginPath();
      ctx.arc(px, py, r, 0, 2 * Math.PI);
      ctx.fillStyle = '#303030';
      ctx.fill();
    }
  }
}
