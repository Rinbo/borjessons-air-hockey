import React from 'react';
import ScoreBanner from '../../components/game/score-banner';
import Board, { BroadcastState } from '../../game/board';
import GameWebSocket from '../../game/game-websocket';
import { Client } from '@stomp/stompjs';
import { useWindowSize } from '../../hooks/useWindowSize';
import { Player } from './game-container';
import { useOutletContext, useParams } from 'react-router-dom';
import { getAgencyExtention } from '../../game/utils';
import { GAME_DURATION } from '../../game/constants';

type Position = { x: number; y: number };

type Props = { stompClient: Client; players: Player[] };

export default function Game({ stompClient, players }: Props) {
  const { id } = useParams<string>();
  const [width, height] = useWindowSize();
  const boardRef = React.useRef<Board>();
  const gameWsRef = React.useRef<GameWebSocket>();
  const rafRef = React.useRef<number>();
  const { username } = useOutletContext<{ username: string }>();
  const [remainingSeconds, setRemainingSeconds] = React.useState<number>(GAME_DURATION);
  const lastRenderedSeconds = React.useRef<number>(GAME_DURATION);

  React.useEffect(() => {
    const canvas = document.getElementById('game-board') as HTMLCanvasElement;
    const agency = getAgencyExtention(players, username);

    // Create the raw WebSocket for board-state
    const gameWs = new GameWebSocket();
    gameWsRef.current = gameWs;

    const board = new Board(canvas, { width, height }, (position: Position) =>
      gameWs.sendHandlePosition(position)
    );
    boardRef.current = board;

    // Receive board state via binary WebSocket
    gameWs.onBoardState((state: BroadcastState) => {
      board.update(state);

      // Only trigger React re-render when seconds actually change
      const seconds = Math.ceil(state.remainingSeconds);
      if (seconds !== lastRenderedSeconds.current) {
        lastRenderedSeconds.current = seconds;
        setRemainingSeconds(seconds);
      }
    });

    gameWs.connect(id!, agency);

    // requestAnimationFrame render loop — decoupled from WebSocket
    function render() {
      board.draw();
      rafRef.current = requestAnimationFrame(render);
    }
    rafRef.current = requestAnimationFrame(render);

    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      gameWs.disconnect();
      board.destroy();
    };
  }, []);

  React.useEffect(() => {
    boardRef.current?.setSize({ width, height });
  }, [width, height]);

  return (
    <div className="m-0 flex h-full flex-col items-center justify-center overflow-hidden pt-5">
      <ScoreBanner players={players} width={width} remainingSeconds={remainingSeconds} />
      <canvas className="rounded-xl border-2 border-slate-500 bg-white" id="game-board" width={width} height={height} />
    </div>
  );
}
