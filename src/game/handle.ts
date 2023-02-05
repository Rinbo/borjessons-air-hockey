import Board, { GameObject, Position } from './board';

export default class Handle implements GameObject {
  private board;

  constructor(board: Board) {
    this.board = board;
  }

  public update(position: Position): void {}

  public draw() {}
}
