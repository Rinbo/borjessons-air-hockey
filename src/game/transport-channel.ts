import { BroadcastState, Position } from './board';

/**
 * Transport-agnostic channel for the high-frequency game board-state
 * communication. Implementations include WebSocket (fallback) and
 * WebRTC DataChannel (primary, UDP-like semantics).
 */
export interface TransportChannel {
  /**
   * Connect to the game server for the given game and player.
   * The onState callback is wired **before** the connection opens
   * so that no early messages are lost.
   */
  connect(gameId: string, agency: string, onState: (state: BroadcastState) => void): Promise<void>;

  /** Disconnect and release resources. */
  disconnect(): void;

  /** Send the player's handle position to the server. */
  sendHandlePosition(position: Position): void;
}
