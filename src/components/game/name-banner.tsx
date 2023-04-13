import { Player } from '../../routes/games/game-container';
import { trimName } from '../../utils/misc-utils';

type Props = { players: Player[] };

export default function NameBanner({ players }: Props) {
  return (
    <div className="inline-flex w-full justify-between gap-2 rounded-md border border-primary bg-slate-300 px-2 py-1">
      {players.map(({ username, ready, agency, gamesWon }) => (
        <span key={agency} className={`overflow-hidden whitespace-nowrap text-xs ${ready && 'text-green-600'}`}>
          {trimName(username)} {gamesWon || 0}
        </span>
      ))}
    </div>
  );
}
