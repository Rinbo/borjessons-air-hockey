import React from 'react';
import ScoreBanner from '../../components/game/score-banner';
import Board from '../../game/board';
import useInterval from '../../hooks/useInterval';
import { useWindowSize } from '../../hooks/useWindowSize';
import { Player } from './game-container';

const PLAYERS: Player[] = [
  { username: 'Robin', agency: 'PLAYER_1', ready: true },
  { username: 'Lars', agency: 'PLAYER_2', ready: true }
];

const FPS = 60;
type Speed = { x: number; y: number };
type Position = Speed;

export default function Game() {
  const [width, height] = useWindowSize();
  const board = React.useRef<Board>();
  const lastFrame = React.useRef<number>(performance.now());

  React.useEffect(() => {
    const canvas = document.getElementById('game-board') as HTMLCanvasElement;
    const ctx = canvas.getContext('2d') as CanvasRenderingContext2D;
    board.current = new Board({ width, height }, ctx);

    const frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, []);

  React.useEffect(() => {
    board.current?.setSize({ width, height });
  }, [width, height]);

  function tick(currentTime: number) {
    const elapsedTime = currentTime - lastFrame.current;
    if (elapsedTime > 1000 / FPS) {
      board.current?.draw();
      lastFrame.current = currentTime;
    }
    requestAnimationFrame(tick);
  }

  return (
    <div className="m-0 flex h-screen flex-col items-center justify-center border-red-600 pt-5">
      <ScoreBanner players={PLAYERS} width={width} />
      <canvas style={{ border: '1px solid grey', borderRadius: 10 }} id="game-board" width={width} height={height} />
    </div>
  );
}
