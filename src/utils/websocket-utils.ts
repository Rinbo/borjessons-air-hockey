import { Client, IMessage } from '@stomp/stompjs';

export function pingListener(username: string, stompClient: Client) {
  stompClient.subscribe(`/topic/user/${username}/ping`, (_message: IMessage) => {
    stompClient.publish({ destination: '/app/users/heartbeat', body: username });
  });
}
