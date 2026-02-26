import type { StompConnection } from '../stomp-connection';

export function pingListener(username: string, stomp: StompConnection) {
  stomp.subscribe(`/topic/user/${username}/ping`, (_message) => {
    stomp.publish('/app/users/heartbeat', username);
  });
}
