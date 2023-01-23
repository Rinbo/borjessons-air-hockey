import React from 'react';
import { Navigate, useOutletContext, useParams } from 'react-router-dom';
import Lobby from './lobby';
import SockJS from 'sockjs-client/dist/sockjs';
import Stomp from 'stompjs';

enum GameState {
  LOBBY = 'LOBBY',
  GAME_START = 'GAME_START',
  GAME_RUNNING = 'GAME_RUNNING',
  CREATOR_LEFT = 'CREATOR_DISCONNECT'
}

type Agent = 'PLAYER_1' | 'PLAYER_2';

export type Message = { username: string; message: string; datetime: string };
export type Player = { username: string; agency: Agent; ready: boolean };

/**
 * Need some kind of state machine for transitions between states.
 */
export default function GameContainer() {
  const { id } = useParams<string>();
  const [gameState, setGameState] = React.useState<GameState>(GameState.LOBBY);
  const [messages, setMessages] = React.useState<Array<Message>>([]);
  const [players, setPlayers] = React.useState<Array<Player>>([]);
  const [stompClient, setStompClient] = React.useState<Stomp.Client | null>();
  const { username } = useOutletContext<{ username: string }>();

  React.useEffect(() => {
    const socket = new SockJS('http://localhost:8080/ws');
    const client = Stomp.over(socket);

    client.connect({}, frame => {
      console.log('Connecting', frame);
      setStompClient(client);

      client.send(`/app/game/${id}/connect`, {}, createMessage(''));

      client.subscribe(`/topic/game/${id}/chat`, (message: Stomp.Message) => {
        setMessages(prev => [JSON.parse(message.body) as Message, ...prev]);
      });

      client.subscribe(`/topic/game/${id}/players`, (message: Stomp.Message) => {
        console.log(message.body, 'PLAYER EVENT');

        setPlayers(JSON.parse(message.body) as Array<Player>);
      });

      client.subscribe(`/topic/game/${id}/notification`, (message: Stomp.Message) => {
        console.log(message.body, 'NOTIFY EVENT');

        setGameState(JSON.parse(message.body) as GameState);
      });
    });

    return () => {
      client.send(`/app/game/${id}/disconnect`, {}, createMessage(''));
      client.disconnect(() => console.log('disconnecting...'));
    };
  }, []);

  const sendMessage = (message: string): void => {
    stompClient && stompClient.send(`/app/game/${id}/chat`, {}, createMessage(message));
  };

  const toggleReady = (): void => {
    stompClient && stompClient.send(`/app/game/${id}/toggle-ready`, {}, '');
  };

  function createMessage(message: string) {
    return JSON.stringify({ username, message, datetime: new Date() });
  }

  switch (gameState) {
    case GameState.CREATOR_LEFT:
      console.log('CREATOR LEFT'); // Make modal

      return <Navigate to="/" />;
    case GameState.LOBBY:
      return <Lobby sendMessage={sendMessage} messages={messages} players={players} toggleReady={toggleReady} />;
    case GameState.GAME_START:
      return <div className="text-2xl text-center pt-2">1, 2, 3 - BOOM</div>;
    case GameState.GAME_RUNNING:
      return <div className="text-2xl text-center pt-2">GAME RUNNING</div>;
    default:
      console.error('Unknow state: ' + gameState);
      return <div className="text-2xl text-center pt-2">How did you end up here?</div>;
  }
}
