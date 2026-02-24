import { BroadcastState, Position } from './board';
import properties from '../config/properties';

/**
 * Raw WebSocket connection for the high-frequency game board-state channel.
 * Uses binary protocol for minimal overhead:
 *
 * Server → Client (40 bytes):
 *   [opponentX: Float64, opponentY: Float64, puckX: Float64, puckY: Float64, remainingSeconds: Float64]
 *
 * Client → Server (16 bytes):
 *   [handleX: Float64, handleY: Float64]
 */
export default class GameWebSocket {
  private ws: WebSocket | null = null;
  private onStateCallback: ((state: BroadcastState) => void) | null = null;

  public connect(gameId: string, agency: string): void {
    const { wsBaseUrl } = properties();
    // Derive the raw WS URL from the existing base URL
    // e.g., http://localhost:8080/ws → ws://localhost:8080/ws/game/{gameId}/{agency}
    const baseUrl = wsBaseUrl.replace(/^http/, 'ws').replace(/\/ws\/?$/, '');
    const url = `${baseUrl}/ws/game/${gameId}/${agency}`;

    this.ws = new WebSocket(url);
    this.ws.binaryType = 'arraybuffer';

    this.ws.onmessage = (event: MessageEvent) => {
      if (event.data instanceof ArrayBuffer && this.onStateCallback) {
        const view = new Float64Array(event.data);
        if (view.length >= 5) {
          const state: BroadcastState = {
            opponent: { x: view[0], y: view[1] },
            puck: { x: view[2], y: view[3] },
            remainingSeconds: view[4]
          };
          this.onStateCallback(state);
        }
      }
    };

    this.ws.onerror = (err) => {
      console.error('GameWebSocket error:', err);
    };
  }

  public disconnect(): void {
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
  }

  public onBoardState(callback: (state: BroadcastState) => void): void {
    this.onStateCallback = callback;
  }

  public sendHandlePosition(position: Position): void {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      const buffer = new ArrayBuffer(16);
      const view = new Float64Array(buffer);
      view[0] = position.x;
      view[1] = position.y;
      this.ws.send(buffer);
    }
  }
}
