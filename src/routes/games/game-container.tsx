import React from 'react';
import { useParams } from 'react-router-dom';
import Lobby from './lobby';
import SockJS from 'sockjs-client/dist/sockjs';
import Stomp from 'stompjs';

enum GameState {
  LOBBY = 'LOBBY',
  GAME_START = 'GAME_START',
  GAME_RUNNING = 'GAME_RUNNING'
}

export type Message = { username: string; message: string; datetime: string };

/**
 * Need some kind of state machine for transitions between states.
 */
export default function GameContainer() {
  const { id } = useParams<string>();
  const [gameState, setGameState] = React.useState<GameState>(GameState.LOBBY);
  const [messages, setMessages] = React.useState<Array<Message>>([]);
  const [stompClient, setStompClient] = React.useState<Stomp.Client | null>();

  React.useEffect(() => {
    const socket = new SockJS('http://localhost:8080/ws');
    const client = Stomp.over(socket);

    client.connect({}, frame => {
      console.log('Connecting', frame);
      setStompClient(client);

      client.subscribe('/topic/public', (message: Stomp.Message) => {
        setMessages(prev => [...prev, JSON.parse(message.body) as Message]);
      });
      client.subscribe('/topic/topic2', message => {
        console.log('topic2:', message);
      });
    });

    return () => client.disconnect(() => console.log('disconnecting...'));
  }, []);

  const sendMessage = (message: string): void => {
    stompClient && stompClient.send('/app/send-message', {}, JSON.stringify({ username: name, message: message, datetime: new Date() }));
  };

  switch (gameState) {
    case GameState.LOBBY:
      return <Lobby sendMessage={sendMessage} messages={messages} />;
    case GameState.GAME_START:
      return <div className="text-2xl text-center pt-2">1, 2, 3 - BOOM</div>;
    case GameState.GAME_RUNNING:
      return <div className="text-2xl text-center pt-2">GAME RUNNING</div>;
    default:
      console.error('Unknow state: ' + gameState);
      return <div className="text-2xl text-center pt-2">How did you end up here?</div>;
  }
}
