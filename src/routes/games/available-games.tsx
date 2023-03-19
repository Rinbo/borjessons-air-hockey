import React from 'react';
import { useNavigate } from 'react-router-dom';

type Row = { id: string; username: string; joinable: boolean };

const DUMMY_DATA = [
  { id: '12', username: 'Albin', joinable: true },
  { id: '34', username: 'Sixten', joinable: false },
  { id: '56', username: 'Robin', joinable: true },
  { id: '78', username: 'Maria', joinable: false },
  { id: '10', username: 'Rolf', joinable: true }
] as Array<Row>;

export default function AvailableGames() {
  const navigate = useNavigate();
  const [games, setGames] = React.useState<Array<Row>>(DUMMY_DATA);

  function renderAvailableGames() {
    return games
      .filter(game => game.joinable)
      .map(row => {
        return (
          <div
            key={row.id}
            className="flex items-center justify-between rounded-md border-black bg-slate-300 px-3 py-2 duration-300 hover:scale-105 hover:transform hover:border hover:bg-teal-100"
          >
            <span className="font-bold">{`${row.username}'s game`}</span>
            <button
              className="btn border border-primary bg-teal-200 text-primary hover:bg-teal-300 hover:text-white"
              onClick={() => navigate('/games/' + row.id)}
            >
              Join
            </button>
          </div>
        );
      });
  }

  const renderNoGamesAvailable = () => {
    if (games.length !== 0) return null;
    return (
      <div className="flex flex-col justify-center gap-2">
        <div className="text-center">No games available</div>
        <button className="btn btn-primary-outlined">Create One</button>
      </div>
    );
  };

  function renderFullGames() {
    return games
      .filter(game => !game.joinable)
      .map(row => {
        return (
          <div key={row.id} className="flex items-center justify-between rounded-md border-black bg-slate-300 px-3 py-2">
            <span className="font-bold">{`${row.username}'s game`}</span>
            <button className="btn cursor-not-allowed border border-primary bg-red-300">In progress</button>
          </div>
        );
      });
  }

  return (
    <div className="min-h-screen px-2 py-4 sm:container sm:mx-auto sm:max-w-3xl">
      <div className="flex h-full flex-col gap-1">
        <div className="pb-4 pt-12 text-center text-3xl">Available Games</div>
        <div className="flex flex-col gap-2 rounded-lg border border-primary p-3">
          {renderNoGamesAvailable()}
          {renderAvailableGames()}
          {renderFullGames()}
        </div>
      </div>
    </div>
  );
}
