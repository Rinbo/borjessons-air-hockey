import { Player } from '../../routes/games/game-container';

type Props = { players: Player[]; width: number; remainingSeconds: number };

export default function ScoreBanner({ players, width, remainingSeconds }: Props) {
  const renderPlayers = players.map((player, index) => {
    return (
      <div key={index} className="flex flex-col items-center px-2 text-xs">
        <div>{player.username}</div>
        <div>{player.score}</div>
      </div>
    );
  });

  return (
    <div style={{ width }} className="border-rounded mb-1 flex h-12 items-center justify-between rounded-md border-2 border-slate-500 bg-slate-300">
      <div className="absolute left-1/2">{remainingSeconds}</div>
      {renderPlayers}
    </div>
  );
}
