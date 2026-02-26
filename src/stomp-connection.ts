/* ===================================================
   STOMP Connection Manager
   =================================================== */

import { Client, IMessage, StompSubscription } from '@stomp/stompjs';
import SockJS from 'sockjs-client/dist/sockjs';
import properties from './config/properties';

export type MessageCallback = (message: IMessage) => void;

/**
 * Standalone STOMP connection wrapper.
 * Replaces the React useWebsocket hook.
 */
export class StompConnection {
  private client: Client | null = null;
  private subscriptions: StompSubscription[] = [];
  private _isConnected = false;
  private _connectAttempt = 0;
  private _isError = false;
  private connectCallbacks: Array<() => void> = [];
  private disconnectCallbacks: Array<() => void> = [];

  get isConnected(): boolean {
    return this._isConnected;
  }

  get connectAttempt(): number {
    return this._connectAttempt;
  }

  get isError(): boolean {
    return this._isError;
  }

  get stompClient(): Client | null {
    return this.client;
  }

  /**
   * Connect and return a promise that resolves when the connection is established.
   */
  connect(): Promise<void> {
    return new Promise((resolve, reject) => {
      const { wsBaseUrl } = properties();

      this.client = new Client({
        webSocketFactory: () => new SockJS(wsBaseUrl),
        reconnectDelay: 1000,
        heartbeatIncoming: 2000,
        heartbeatOutgoing: 2000,
        onConnect: () => {
          this._isConnected = true;
          this._connectAttempt++;
          this.connectCallbacks.forEach(cb => cb());
          resolve();
        },
        onDisconnect: () => {
          this._isConnected = false;
          this.disconnectCallbacks.forEach(cb => cb());
        },
        onStompError: _frame => {
          this._isError = true;
          reject(new Error('STOMP connection error'));
        }
      });

      this.client.activate();
    });
  }

  /**
   * Subscribe to a STOMP topic. Returns the subscription for cleanup.
   */
  subscribe(destination: string, callback: MessageCallback): StompSubscription {
    if (!this.client) throw new Error('Not connected');
    const sub = this.client.subscribe(destination, callback);
    this.subscriptions.push(sub);
    return sub;
  }

  /**
   * Publish a message to a STOMP destination.
   */
  publish(destination: string, body: string = ''): void {
    if (this.client && this._isConnected) {
      this.client.publish({ destination, body });
    }
  }

  /**
   * Register a callback for when connection is established.
   */
  onConnect(callback: () => void): void {
    this.connectCallbacks.push(callback);
  }

  /**
   * Unsubscribe all subscriptions and disconnect.
   */
  disconnect(): void {
    this.subscriptions.forEach(sub => {
      try { sub.unsubscribe(); } catch (_) { /* ignore */ }
    });
    this.subscriptions = [];

    if (this.client) {
      try { this.client.deactivate(); } catch (_) { /* ignore */ }
      this.client = null;
    }
    this._isConnected = false;
  }
}
