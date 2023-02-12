import React from 'react';
import ScoreBanner from '../../components/game/score-banner';
import Board from '../../game/board';
import { useWindowSize } from '../../hooks/useWindowSize';
import { Player } from './game-container';

const PLAYERS: Player[] = [
  { username: 'Robin', agency: 'PLAYER_1', ready: true },
  { username: 'Lars', agency: 'PLAYER_2', ready: true }
];

const FPS = 60;
type Speed = { x: number; y: number };
type Position = Speed;

export default function TestGame() {
  const [width, height] = useWindowSize();
  const boardRef = React.useRef<Board>();
  const lastFrame = React.useRef<number>(performance.now());

  React.useEffect(() => {
    const canvas = document.getElementById('game-board') as HTMLCanvasElement;
    const board = new Board(canvas, { width, height }, (position: Position) => dummyStomp(position));
    boardRef.current = board;

    const frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, []);

  function dummyStomp(position: Position) {}

  React.useEffect(() => {
    boardRef.current?.setSize({ width, height });
  }, [width, height]);

  function tick(currentTime: number) {
    const elapsedTime = currentTime - lastFrame.current;
    if (elapsedTime > 1000 / FPS) {
      boardRef.current?.draw();
      lastFrame.current = currentTime;
    }
    requestAnimationFrame(tick);
  }

  return (
    <div className="m-0 flex h-screen flex-col items-center justify-center overflow-hidden pt-5">
      <ScoreBanner players={PLAYERS} width={width} />
      <canvas className="rounded-xl border-2 border-slate-500 bg-white bg-opacity-20 backdrop-blur-lg" id="game-board" width={width} height={height} />
    </div>
  );
}
