import { TransportChannel } from './transport-channel';
import { WebRTCChannel } from './webrtc-channel';
import { BroadcastState } from './board';

export type { TransportChannel };

/**
 * Creates a WebRTC DataChannel transport for game communication.
 *
 * WebRTC is the only supported transport — all modern browsers (Chrome,
 * Safari, Firefox, Edge) support it on both desktop and mobile.
 *
 * The onState callback is passed through to the channel so it is wired
 * before the connection opens — preventing early message loss.
 */
export async function createTransportChannel(
  gameId: string,
  agency: string,
  onState: (state: BroadcastState) => void
): Promise<TransportChannel> {
  const rtc = new WebRTCChannel();
  await rtc.connect(gameId, agency, onState);
  console.log('[Transport] ✅ Connected via WebRTC DataChannel');
  return rtc;
}

/**
 * Returns true if the current browser supports WebRTC DataChannels.
 */
export function isWebRTCSupported(): boolean {
  return 'RTCPeerConnection' in window;
}
