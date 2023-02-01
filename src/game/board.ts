type Size = { width: number; height: number };

const S_LEN = 30;

export default class Board {
  private size: Size;
  private ctx: CanvasRenderingContext2D;

  constructor(size: Size, ctx: CanvasRenderingContext2D) {
    this.size = size;
    this.ctx = ctx;
  }

  public draw() {
    this.ctx.clearRect(0, 0, this.size.width, this.size.height);
    this.ctx.fillRect(S_LEN, S_LEN, S_LEN, S_LEN);
  }

  public render() {}

  public setSize(size: Size): void {
    this.size = size;
    this.ctx.restore();
  }
}
