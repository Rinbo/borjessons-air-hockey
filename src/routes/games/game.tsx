import React from 'react';
import ScoreBanner from '../../components/game/score-banner';
import useInterval from '../../hooks/useInterval';
import { useWindowSize } from '../../hooks/useWindowSize';
import { Player } from './game-container';

const S_LEN = 30;

const PLAYERS: Player[] = [
  { username: 'Robin', agency: 'PLAYER_1', ready: true },
  { username: 'Lars', agency: 'PLAYER_2', ready: true }
];

const FPS = 60;
type Speed = { x: number; y: number };
type Position = Speed;

export default function Game() {
  const [width, height] = useWindowSize();
  const [context, setContext] = React.useState<CanvasRenderingContext2D>();
  const [cooldown, setCooldown] = React.useState<number>(0);
  const [position, setPosition] = React.useState<Position>({ x: 30, y: 30 });
  const [speed, setSpeed] = React.useState<Speed>({ x: 5, y: 5 });

  useInterval(gameLoop, 1000 / FPS);

  React.useEffect(() => {
    const canvas = document.getElementById('game-board') as HTMLCanvasElement;
    const ctx = canvas.getContext('2d') as CanvasRenderingContext2D;
    setContext(ctx);
  }, []);

  function gameLoop() {
    context?.clearRect(0, 0, width, height);
    context?.fillRect(position.x, position.y, 30, 30);
    checkCollision();
    setPosition(updatePos);
    setCooldown(prev => Math.max(0, prev - 1));
  }

  function checkCollision(): void {
    const { x: xPos, y: yPos } = position;

    if ((xPos + S_LEN >= width || xPos <= 0) && cooldown === 0) setSpeed(reverseXSpeed);
    if ((yPos + S_LEN >= height || yPos <= 0) && cooldown === 0) setSpeed(reverseYSpeed);
  }

  function reverseXSpeed({ x, y }: Speed): Speed {
    setCooldown(10);
    return { x: x * -1, y };
  }

  function reverseYSpeed({ x, y }: Speed): Speed {
    setCooldown(10);
    return { x, y: y * -1 };
  }

  function updatePos({ x, y }: Position): Position {
    return { x: x + speed.x, y: y + speed.y };
  }

  return (
    <div className="m-0 flex h-screen flex-col items-center justify-center border-red-600 pt-5">
      <ScoreBanner players={PLAYERS} width={width} />
      <canvas style={{ border: '1px solid grey', borderRadius: 10 }} id="game-board" width={width} height={height} />
    </div>
  );
}
