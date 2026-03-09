import { Position } from './board';
import { PUCK_RADIUS, GOAL_WIDTH } from './constants';

/**
 * Physics constants — must match the server (GameConstants.java).
 */
const FRICTION_DAMPING = 0.997;
const FRAME_RATE = 50;
const FRAME_DURATION_S = 1 / FRAME_RATE;
const WALL_RESTITUTION = 0.85;

/** Correction halflife in ms — correction error halves every this many ms. */
const CORRECTION_HALFLIFE_MS = 30;

/** Below this threshold, corrections snap to zero to avoid sub-pixel wobble. */
const SNAP_THRESHOLD = 0.002;

/**
 * Client-side puck prediction engine.
 *
 * Between server updates the puck follows deterministic physics (linear motion + friction + wall bounces),
 * so we can predict its position accurately. When a server update arrives we smoothly correct any drift.
 * On collision events (handle hit, goal) we snap immediately to the server state since those events
 * are impossible to predict without knowing the opponent's exact handle position.
 */
export default class PuckPredictor {
  // Latest server-authoritative state
  private serverX = 0.5;
  private serverY = 0.5;
  private speedX = 0;
  private speedY = 0;
  private lastServerTime = 0;

  // Current predicted (rendered) position — smoothly converges to truth
  private predictedX = 0.5;
  private predictedY = 0.5;

  // Correction offset (difference between prediction and server at moment of update)
  private correctionX = 0;
  private correctionY = 0;

  /**
   * Returns true if the position is the server's OFF_BOARD_POSITION (-1,-1)
   * or its mirrored equivalent (2,2). These are used during goal resets.
   */
  private static isOffBoard(x: number, y: number): boolean {
    return x < -0.5 || x > 1.5 || y < -0.5 || y > 1.5;
  }

  /**
   * Called when a new server state arrives.
   * @param snap If true, jump immediately to the server position (used on collision events).
   */
  public onServerUpdate(pos: Position, speedX: number, speedY: number, snap: boolean): void {
    // Always snap when puck goes off-board OR returns from off-board
    const wasOffBoard = PuckPredictor.isOffBoard(this.serverX, this.serverY);
    const isOffBoard = PuckPredictor.isOffBoard(pos.x, pos.y);

    this.serverX = pos.x;
    this.serverY = pos.y;
    this.speedX = speedX;
    this.speedY = speedY;
    this.lastServerTime = performance.now();

    if (snap || isOffBoard || wasOffBoard) {
      // Hard snap: collision, off-board, or returning from off-board
      this.predictedX = pos.x;
      this.predictedY = pos.y;
      this.correctionX = 0;
      this.correctionY = 0;
    } else {
      // Record the error between our current prediction and the new server truth
      this.correctionX = this.predictedX - pos.x;
      this.correctionY = this.predictedY - pos.y;
    }
  }

  /**
   * Returns the predicted puck position for the current render frame.
   */
  public predict(now: number): Position {
    // If puck is off-board (goal reset), return server position directly — no physics
    if (PuckPredictor.isOffBoard(this.serverX, this.serverY)) {
      this.predictedX = this.serverX;
      this.predictedY = this.serverY;
      return { x: this.serverX, y: this.serverY };
    }

    const dtMs = now - this.lastServerTime;
    // Convert to server ticks (each tick = 20ms)
    const ticks = dtMs / (FRAME_DURATION_S * 1000);

    // Simulate forward from server state
    let x = this.serverX;
    let y = this.serverY;
    let vx = this.speedX;
    let vy = this.speedY;

    const steps = Math.min(Math.floor(ticks), 10); // Cap to avoid runaway on long gaps
    for (let i = 0; i < steps; i++) {
      x += vx;
      y += vy;
      vx *= FRICTION_DAMPING;
      vy *= FRICTION_DAMPING;

      // Wall bounces (excluding goal zones)
      const result = this.bounceWalls(x, y, vx, vy);
      x = result.x;
      y = result.y;
      vx = result.vx;
      vy = result.vy;
    }

    // Fractional tick interpolation
    const frac = ticks - steps;
    x += vx * frac;
    y += vy * frac;

    // Time-based correction decay (consistent across all frame rates)
    // CORRECTION_HALFLIFE_MS = 30 means correction halves every 30ms
    const decayFactor = Math.pow(0.5, dtMs / CORRECTION_HALFLIFE_MS);
    this.correctionX *= decayFactor;
    this.correctionY *= decayFactor;

    // Snap tiny corrections to zero — avoids sub-pixel wobble
    if (Math.abs(this.correctionX) < SNAP_THRESHOLD) this.correctionX = 0;
    if (Math.abs(this.correctionY) < SNAP_THRESHOLD) this.correctionY = 0;

    this.predictedX = x + this.correctionX;
    this.predictedY = y + this.correctionY;

    return { x: this.predictedX, y: this.predictedY };
  }

  /**
   * Simple wall-bounce logic matching the server's collision detection (excluding handle-puck
   * and goal events which are handled by server snapshots).
   */
  private bounceWalls(x: number, y: number, vx: number, vy: number) {
    const pr = PUCK_RADIUS.x;
    const gw = GOAL_WIDTH;
    const inGoalZone = x >= 0.5 - gw && x <= 0.5 + gw;

    // Left wall
    if (x - pr <= 0) {
      x = pr;
      vx = Math.abs(vx) * WALL_RESTITUTION;
    }
    // Right wall
    if (x + pr >= 1) {
      x = 1 - pr;
      vx = -Math.abs(vx) * WALL_RESTITUTION;
    }
    // Top wall (skip if in goal zone — goal handled by server)
    if (y - pr <= 0 && !inGoalZone) {
      y = pr;
      vy = Math.abs(vy) * WALL_RESTITUTION;
    }
    // Bottom wall (skip if in goal zone)
    if (y + pr >= 1 && !inGoalZone) {
      y = 1 - pr;
      vy = -Math.abs(vy) * WALL_RESTITUTION;
    }

    return { x, y, vx, vy };
  }
}
