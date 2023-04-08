import Stomp from 'stompjs';

export function pingListener(username: string, stompClient: Stomp.Client) {
  stompClient.subscribe(`/topic/user/${username}/ping`, (message: Stomp.Message) => {
    stompClient.send('/app/users/heartbeat', {}, username);
  });
}
