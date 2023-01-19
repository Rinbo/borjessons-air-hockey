import React from 'react';
import { useOutletContext, useParams } from 'react-router-dom';
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
  const { username } = useOutletContext<{ username: string }>();

  React.useEffect(() => {
    const socket = new SockJS('http://localhost:8080/ws');
    const client = Stomp.over(socket);

    client.connect({}, frame => {
      console.log('Connecting', frame);
      setStompClient(client);

      client.send(`/app/lobby/${id}/connect`, {}, JSON.stringify({ username, message: '', datetime: new Date() }));

      client.subscribe(`/topic/lobby-${id}`, (message: Stomp.Message) => {
        setMessages(prev => [...prev, JSON.parse(message.body) as Message]);
      });
    });

    return () => client.disconnect(() => console.log('disconnecting...'));
  }, []);

  const sendMessage = (message: string): void => {
    stompClient && stompClient.send(`/app/lobby/${id}`, {}, JSON.stringify({ username, message, datetime: new Date() }));
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
