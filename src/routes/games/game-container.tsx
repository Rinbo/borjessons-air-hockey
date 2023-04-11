import React from 'react';
import { useNavigate, useOutletContext, useParams } from 'react-router-dom';
import Lobby from './lobby';
import Game from './game';
import CenterWrapper from '../../components/misc/center-wrapper';
import { Client, IMessage } from '@stomp/stompjs';
import { pingListener } from '../../utils/websocket-utils';
import { trimName } from '../../utils/misc-utils';

enum GameState {
  PLAYER_1_DISCONNECT = 'PLAYER_1_DISCONNECT',
  PLAYER_2_DISCONNECT = 'PLAYER_2_DISCONNECT',
  LOBBY = 'LOBBY',
  FORBIDDEN = 'FORBIDDEN',
  GAME_RUNNING = 'GAME_RUNNING',
  SCORE_SCREEN = 'SCORE_SCREEN'
}

export type Agent = 'PLAYER_1' | 'PLAYER_2';
export type Message = { username: string; message: string; datetime: Date };
export type Player = { username: string; agency: Agent; ready: boolean; score: number };

export default function GameContainer() {
  const { id } = useParams<string>();
  const [gameState, setGameState] = React.useState<GameState>(GameState.LOBBY);
  const [messages, setMessages] = React.useState<Array<Message>>([]);
  const [players, setPlayers] = React.useState<Array<Player>>([]);
  const { username, stompClient, connectAttempt } = useOutletContext<{ username: string; stompClient: Client; connectAttempt: number }>();
  const navigate = useNavigate();

  React.useEffect(() => {
    stompClient.subscribe(`/topic/game/${id}/chat`, (message: IMessage) => {
      setMessages(prev => [{ ...JSON.parse(message.body), datetime: new Date() }, ...prev]);
    });

    stompClient.subscribe(`/topic/game/${id}/players`, (message: IMessage) => {
      setPlayers(JSON.parse(message.body) as Array<Player>);
    });

    stompClient.subscribe(`/topic/game/${id}/game-state`, (message: IMessage) => {
      setGameState(JSON.parse(message.body) as GameState);
    });

    stompClient.subscribe(`/topic/game/${username}/game-state`, (message: IMessage) => {
      setGameState(JSON.parse(message.body) as GameState);
    });

    stompClient.publish({ destination: `/app/game/${id}/connect`, body: createMessage('') });

    pingListener(username, stompClient);
  }, [connectAttempt]);

  React.useEffect(() => {
    const cleanup = () => stompClient && stompClient.publish({ destination: `/app/game/${id}/disconnect`, body: '' });
    window.addEventListener('beforeunload', cleanup);

    const cleanupOnUnmount = () => {
      cleanup();
      window.removeEventListener('beforeunload', cleanup);
    };

    return cleanupOnUnmount;
  }, []);

  const sendMessage = (message: string): void => {
    stompClient && stompClient.publish({ destination: `/app/game/${id}/chat`, body: createMessage(message) });
  };

  const toggleReady = (): void => {
    stompClient && stompClient.publish({ destination: `/app/game/${id}/toggle-ready`, body: '' });
  };

  function createMessage(message: string): string {
    return JSON.stringify({ username, message });
  }

  function renderCentralMessageAction(message: string, actionName: string, action: () => void) {
    return (
      <CenterWrapper>
        <div className="text-xl font-bold">{message}</div>
        <button className="btn btn-primary-outlined" onClick={action}>
          {actionName}
        </button>
      </CenterWrapper>
    );
  }

  function whoWon(): string {
    const player1 = players.find(player => player.agency === 'PLAYER_1');
    const player2 = players.find(player => player.agency === 'PLAYER_2');

    if (!player1 || !player2) {
      return 'Error: Players not found.';
    }

    if (player1.score === player2.score) {
      return 'Tie!';
    }

    const winner = player1.score > player2.score ? player1 : player2;
    return `${trimName(winner.username)} Won!`;
  }

  function getResult(): String {
    const arr = players.map(player => trimName(player.username) + ': ' + player.score);
    return arr.join(' | ');
  }

  const renderScoreScreen = (
    <CenterWrapper>
      <div className="text-xl font-bold">{whoWon()}</div>
      <div className="font-bold">Results:</div>
      <div>{getResult()}</div>
      <button className="btn btn-primary-outlined" onClick={() => setGameState(GameState.LOBBY)}>
        Back to lobby
      </button>
    </CenterWrapper>
  );

  switch (gameState) {
    case GameState.PLAYER_1_DISCONNECT:
      return renderCentralMessageAction('Game creator left', 'Exit', () => navigate('/'));
    case GameState.PLAYER_2_DISCONNECT:
      return renderCentralMessageAction('Your opponent left the game', 'Back to lobby', () => setGameState(GameState.LOBBY));
    case GameState.LOBBY:
      return <Lobby sendMessage={sendMessage} messages={messages} players={players} toggleReady={toggleReady} />;
    case GameState.FORBIDDEN:
      return renderCentralMessageAction('Game is in progress', 'Exit', () => navigate('/'));
    case GameState.GAME_RUNNING:
      return <Game players={players} stompClient={stompClient!} />;
    case GameState.SCORE_SCREEN:
      return renderScoreScreen;
    default:
      console.error('Unknow state: ' + gameState);
      return renderCentralMessageAction('Unknown error. Sorry :(', 'Exit', () => navigate('/'));
  }
}
