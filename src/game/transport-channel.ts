import { BroadcastState, Position } from './board';

/**
 * Channel for high-frequency game board-state communication.
 * Currently backed by WebRTC DataChannel (unreliable, unordered SCTP
 * over DTLS/UDP) for low-latency, UDP-like semantics.
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
