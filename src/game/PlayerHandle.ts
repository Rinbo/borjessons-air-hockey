import Board, { GameObject, Position } from './board';

export default class PlayerHandle implements GameObject {
  private board;

  constructor(board: Board) {
    this.board = board;
  }

  public update(position: Position): void {}

  public draw() {}
}
