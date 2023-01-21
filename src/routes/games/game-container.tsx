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

type Agent = 'PLAYER_1' | 'PLAYER_2';

export type Message = { username: string; message: string; datetime: string };
export type Player = { username: string; agent: Agent };

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

      client.send(`/app/lobby/${id}/connect`, {}, JSON.stringify({ username, message: '', datetime: new Date() }));

      client.subscribe(`/topic/lobby/${id}/chat`, (message: Stomp.Message) => {
        setMessages(prev => [JSON.parse(message.body) as Message, ...prev]);
      });

      client.subscribe(`/topic/lobby/${id}/players`, (message: Stomp.Message) => {
        console.log(message.body, 'BODY');

        setPlayers(JSON.parse(message.body) as Array<Player>);
      });
    });

    return () => client.disconnect(() => console.log('disconnecting...'));
  }, []);

  console.log(players, 'PLAYERS');

  const sendMessage = (message: string): void => {
    stompClient && stompClient.send(`/app/lobby/${id}/chat`, {}, JSON.stringify({ username, message, datetime: new Date() }));
  };

  switch (gameState) {
    case GameState.LOBBY:
      return <Lobby sendMessage={sendMessage} messages={messages} players={players} />;
    case GameState.GAME_START:
      return <div className="text-2xl text-center pt-2">1, 2, 3 - BOOM</div>;
    case GameState.GAME_RUNNING:
      return <div className="text-2xl text-center pt-2">GAME RUNNING</div>;
    default:
      console.error('Unknow state: ' + gameState);
      return <div className="text-2xl text-center pt-2">How did you end up here?</div>;
  }
}
