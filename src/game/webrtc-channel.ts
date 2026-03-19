import { BroadcastState, Position } from './board';
import { TransportChannel } from './transport-channel';
import properties from '../config/properties';
import { getToken } from '../auth/auth-service';

/**
 * WebRTC DataChannel-backed {@link TransportChannel} using unreliable,
 * unordered SCTP over DTLS/UDP for low-latency game communication.
 *
 * Connects to the Go sidecar via HTTP signaling (SDP offer/answer),
 * then uses the DataChannel for binary game data — same protocol as
 * the previous WebTransport and WebSocket paths.
 *
 * On connect, sends a registration message so the sidecar + Java
 * server know which game/player this session belongs to:
 *   [0x01][gameId UTF-8][0x00][agency: 0x01=P1, 0x02=P2]
 *
 * After registration, uses the same binary protocol:
 *   Server → Client: 48 bytes (6 × Float64 LE)
 *   Client → Server: 16 bytes (2 × Float64 LE)
 */
export class WebRTCChannel implements TransportChannel {
  private pc: RTCPeerConnection | null = null;
  private dc: RTCDataChannel | null = null;

  async connect(gameId: string, agency: string, onState: (state: BroadcastState) => void): Promise<void> {
    const { rtcSignalUrl } = properties() as any;
    if (!rtcSignalUrl) {
      throw new Error('VITE_RTC_SIGNAL_URL not configured');
    }

    // Create PeerConnection — no ICE servers needed since the
    // sidecar has a public IP (or runs on localhost in dev).
    this.pc = new RTCPeerConnection();

    // Diagnostic logging for ICE and connection state
    this.pc.oniceconnectionstatechange = () => {
      console.log('[WebRTC] ICE connection state:', this.pc?.iceConnectionState);
    };
    this.pc.onconnectionstatechange = () => {
      console.log('[WebRTC] Connection state:', this.pc?.connectionState);
    };
    this.pc.onicecandidateerror = (e: any) => {
      console.warn('[WebRTC] ICE candidate error:', e.errorCode, e.errorText, e.url);
    };
    this.pc.onicecandidate = (e) => {
      if (e.candidate) {
        console.log('[WebRTC] Local ICE candidate:', e.candidate.candidate);
      } else {
        console.log('[WebRTC] ICE gathering complete (null candidate)');
      }
    };

    // Create unreliable, unordered DataChannel (UDP-like semantics)
    this.dc = this.pc.createDataChannel('game', {
      ordered: false,
      maxRetransmits: 0,
    });
    this.dc.binaryType = 'arraybuffer';

    // Set up message handler for board state updates.
    // The callback is wired NOW (before the channel opens) so that
    // no early messages are lost to a null-callback race.
    this.dc.onmessage = (event: MessageEvent) => {
      if (event.data instanceof ArrayBuffer && event.data.byteLength >= 48) {
        const view = new DataView(event.data);
        onState({
          opponent: { x: view.getFloat64(0, true), y: view.getFloat64(8, true) },
          puck: { x: view.getFloat64(16, true), y: view.getFloat64(24, true) },
          remainingSeconds: view.getFloat64(32, true),
          collisionEvent: view.getFloat64(40, true),
        });
      }
    };

    // Create SDP offer
    const offer = await this.pc.createOffer();
    await this.pc.setLocalDescription(offer);

    // Wait for ICE gathering to complete (bundles candidates into SDP)
    await this.waitForICEGathering();

    console.log('[WebRTC] Sending SDP offer to', rtcSignalUrl);
    console.log('[WebRTC] Local SDP (first 200 chars):', this.pc.localDescription!.sdp.substring(0, 200));

    // Exchange SDP with the sidecar via HTTP (with JWT auth)
    const token = getToken();
    if (!token) {
      throw new Error('No auth token available — cannot authenticate WebRTC signaling');
    }

    const response = await fetch(rtcSignalUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ sdp: this.pc.localDescription!.sdp, token }),
    });

    if (response.status === 401) {
      throw new Error('WebRTC signaling authentication failed — token may be expired');
    }
    if (!response.ok) {
      throw new Error(`WebRTC signaling failed: ${response.status} ${response.statusText}`);
    }

    const { sdp: answerSDP } = await response.json();
    console.log('[WebRTC] Got SDP answer (first 200 chars):', answerSDP.substring(0, 200));

    // Set the server's answer as remote description
    await this.pc.setRemoteDescription({ type: 'answer', sdp: answerSDP });
    console.log('[WebRTC] Remote description set, waiting for DataChannel open...');

    // Wait for the DataChannel to open
    await this.waitForDataChannelOpen();

    console.log('[WebRTC] DataChannel open — sending registration');

    // Send registration multiple times — the sidecar→Java path uses UDP,
    // which is unreliable. A single lost registration packet causes ALL
    // board state to be silently misdirected. Repeating is harmless
    // (Java server just overwrites the same session mapping).
    this.sendRegistration(gameId, agency);
    setTimeout(() => this.sendRegistration(gameId, agency), 50);
    setTimeout(() => this.sendRegistration(gameId, agency), 150);
  }

  disconnect(): void {
    if (this.dc) {
      this.dc.close();
      this.dc = null;
    }
    if (this.pc) {
      this.pc.close();
      this.pc = null;
    }
  }



  sendHandlePosition(position: Position): void {
    if (!this.dc || this.dc.readyState !== 'open') return;

    const buf = new ArrayBuffer(16);
    const view = new Float64Array(buf);
    view[0] = position.x;
    view[1] = position.y;
    this.dc.send(buf);
  }

  // ── Helpers ─────────────────────────────────────────────────────

  private waitForICEGathering(): Promise<void> {
    return new Promise((resolve) => {
      if (this.pc!.iceGatheringState === 'complete') {
        resolve();
        return;
      }

      this.pc!.onicegatheringstatechange = () => {
        if (this.pc!.iceGatheringState === 'complete') {
          resolve();
        }
      };
    });
  }

  private waitForDataChannelOpen(): Promise<void> {
    return new Promise((resolve, reject) => {
      if (this.dc!.readyState === 'open') {
        resolve();
        return;
      }

      const timeout = setTimeout(() => {
        reject(new Error('DataChannel open timeout (5s)'));
      }, 5000);

      this.dc!.onopen = () => {
        clearTimeout(timeout);
        resolve();
      };

      this.dc!.onerror = (err) => {
        clearTimeout(timeout);
        reject(new Error(`DataChannel error: ${err}`));
      };
    });
  }

  private sendRegistration(gameId: string, agency: string): void {
    const agencyByte = agency === 'player-1' ? 0x01 : 0x02;
    const gameIdBytes = new TextEncoder().encode(gameId);

    // Format: [0x01][gameId UTF-8][0x00][agency byte]
    const packet = new Uint8Array(1 + gameIdBytes.length + 1 + 1);
    packet[0] = 0x01; // register flag
    packet.set(gameIdBytes, 1);
    packet[1 + gameIdBytes.length] = 0x00; // separator
    packet[1 + gameIdBytes.length + 1] = agencyByte;

    this.dc!.send(packet);
  }
}
