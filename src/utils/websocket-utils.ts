import Stomp from 'stompjs';

export function pingServer(username: string, stompClient: Stomp.Client) {
  stompClient.subscribe(`/topic/user/${username}/ping`, (message: Stomp.Message) => {
    console.log(message.body);
    console.info('received ping, sending pong ');
    stompClient.send('/app/users/pong', {}, username);
  });
}
