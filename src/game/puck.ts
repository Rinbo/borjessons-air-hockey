import Board, { GameObject, Position } from './board';
import { PUCK_RADIUS } from './constants';
import { SHADOW_PAD } from './utils';

export default class Puck implements GameObject {
  private position: Position;
  private board: Board;
  private sprite: HTMLCanvasElement | null = null;

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

  public updateSprite(sprite: HTMLCanvasElement): void {
    this.sprite = sprite;
  }

  private drawPuck() {
    const ctx = this.board.getContext();
    const { width, height } = this.board.getCanvas();
    const px = this.position.x * width;
    const py = this.position.y * height;
    const r = PUCK_RADIUS.x * width;
    const offset = r * (1 + SHADOW_PAD);

    if (this.sprite) {
      ctx.drawImage(this.sprite, px - offset, py - offset);
    } else {
      // Fallback before sprite is generated
      ctx.beginPath();
      ctx.arc(px, py, r, 0, 2 * Math.PI);
      ctx.fillStyle = '#333344';
      ctx.fill();
    }
  }
}
