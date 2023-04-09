import React from 'react';
import ScoreBanner from '../../components/game/score-banner';
import Board, { BroadcastState } from '../../game/board';
import { Client, IMessage } from '@stomp/stompjs';
import { useWindowSize } from '../../hooks/useWindowSize';
import { Player } from './game-container';
import { useOutletContext, useParams } from 'react-router-dom';
import { getAgencyExtention } from '../../game/utils';
import { GAME_DURATION } from '../../game/constants';

const FPS = 60;
type Speed = { x: number; y: number };
type Position = Speed;

type Props = { stompClient: Client; players: Player[] };

export default function Game({ stompClient, players }: Props) {
  const { id } = useParams<string>();
  const [width, height] = useWindowSize();
  const boardRef = React.useRef<Board>();
  const { username } = useOutletContext<{ username: string }>();
  const [remainingSeconds, setRemainingSeconds] = React.useState<number>(GAME_DURATION);

  React.useEffect(() => {
    const canvas = document.getElementById('game-board') as HTMLCanvasElement;
    const board = new Board(canvas, { width, height }, (position: Position) =>
      stompClient.publish({ destination: `/app/game/${id}/update-handle`, body: JSON.stringify(position) })
    );

    boardRef.current = board;

    stompClient.subscribe(`/topic/game/${id}/board-state/${getAgencyExtention(players, username)}`, (message: IMessage) => {
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
    <div className="m-0 flex h-full flex-col items-center justify-center overflow-hidden pt-5">
      <ScoreBanner players={players} width={width} remainingSeconds={remainingSeconds} />
      <canvas className="rounded-xl border-2 border-slate-500 bg-white bg-opacity-20 backdrop-blur-lg" id="game-board" width={width} height={height} />
    </div>
  );
}
