import React from 'react';
import ScoreBanner from '../../components/game/score-banner';
import Board, { BroadcastState } from '../../game/board';
import Stomp from 'stompjs';
import { useWindowSize } from '../../hooks/useWindowSize';
import { Player } from './game-container';
import { useOutletContext, useParams } from 'react-router-dom';
import { getAgencyExtention } from '../../game/utils';
import { GAME_DURATION } from '../../game/constants';

const FPS = 60;
type Speed = { x: number; y: number };
type Position = Speed;

type Props = { stompClient: Stomp.Client; players: Player[] };

/**
 * Need handler for sending player handle position on handle move. Need reportStartPosition to be reported on first draw.
 * Board needs a callback from game-container to do this update. Frontend needs a transformer to convert handle position to percentage
 * based on its individual width and height. IS IT POSSIBLE TO TRIGGER DRAW, AND MOVE without animation frame? Require server to do the
 * redrawing? It will update puck state 60 times per second. Mouse or touch coordinates will then be rendered as a result of the
 * server tick? This will be harder to program for sure, but probably be more performant. And a lot of fun I think :)
 * Let's get to it! Begin by making the server interfaces, and ticker.
 */
export default function Game({ stompClient, players }: Props) {
  const { id } = useParams<string>();
  const [width, height] = useWindowSize();
  const boardRef = React.useRef<Board>();
  const { username } = useOutletContext<{ username: string }>();
  const [remainingSeconds, setRemainingSeconds] = React.useState<number>(GAME_DURATION);

  React.useEffect(() => {
    const canvas = document.getElementById('game-board') as HTMLCanvasElement;
    const board = new Board(canvas, { width, height }, (position: Position) => stompClient.send(`/app/game/${id}/update-handle`, {}, JSON.stringify(position)));
    boardRef.current = board;

    stompClient.subscribe(`/topic/game/${id}/board-state/${getAgencyExtention(players, username)}`, (message: Stomp.Message) => {
      const state = JSON.parse(message.body) as BroadcastState;
      setRemainingSeconds(state.remainingSeconds);
      board.update(state);
      board.draw();
    });
  }, []);

  React.useEffect(() => {
    boardRef.current?.setSize({ width, height });
  }, [width, height]);

  return (
    <div className="m-0 flex h-screen flex-col items-center justify-center overflow-hidden pt-5">
      <ScoreBanner players={players} width={width} remainingSeconds={remainingSeconds} />
      <canvas className="rounded-xl border-2 border-slate-500 bg-white bg-opacity-20 backdrop-blur-lg" id="game-board" width={width} height={height} />
    </div>
  );
}
