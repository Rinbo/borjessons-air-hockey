import React from 'react';
import { Message, Player } from '../routes/games/game-container';

export default function useCountdown(players: Array<Player>, setMessages: React.Dispatch<React.SetStateAction<Message[]>>): boolean {
  const [count, setCount] = React.useState<number>(3);

  // return value is immediatly set to false again after count is reset (after returning true)
  // move this to backend instead?
  React.useEffect(() => {
    const interval = setInterval(() => {
      if (players.length === 2 && players.every(player => player.ready)) {
        setCount(prevState => prevState - 1);
        setMessages(prevState => [{ username: 'Game Bot', message: 'Game starts in ' + count, datetime: JSON.stringify(new Date()) }, ...prevState]);
      } else if (players.length === 2 && count < 3) {
        setMessages(prevState => [{ username: 'Game Bot', message: 'Coundown cancelled', datetime: JSON.stringify(new Date()) }, ...prevState]);
        setCount(3);
      } else {
        setCount(3);
      }
    }, 1000);

    return () => {
      clearInterval(interval);
    };
  }, [players]);

  console.log('COUNTDOWN RE-RENDERING', count);

  if (count === 0) {
    setCount(3);
    console.log('AM I HERE?', count);

    return true;
  }

  return false;
}
