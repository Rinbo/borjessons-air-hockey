import { Position, Radius } from './board';

/** Canvas */
export const ASPECT_RATIO = 0.625;
export const MAX_WIDTH = 500;

/** Postion and dimensions are percentages of total width and height of HTML Canvas */
export const PLAYER_HANDLE_START_POS: Position = { x: 0.5, y: 0.8 };
export const OPPONENT_HANDLE_START_POS: Position = { x: 0.5, y: 0.2 };
export const HANDLE_RADIUS: Radius = { x: 0.1, y: 0.1 * ASPECT_RATIO };
export const PUCK_RADIUS: Radius = { x: 0.08, y: 0.08 * ASPECT_RATIO };
export const UPDATE_RATE = 3;
export const GOAL_WIDTH = 0.15;
export const GOAL_HEIGHT = 0.015;
export const GOAL_ANGLE = 0.03;
