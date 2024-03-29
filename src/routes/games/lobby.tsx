import React from 'react';
import IconButton from '../../components/buttons/icon-button';
import sendIcon from '../../assets/svg/send.svg';
import { Message, Player } from './game-container';
import { formatTime } from '../../utils/time-utils';
import { shortenAgency, trimName } from '../../utils/misc-utils';
import CircularMenuButton from '../../components/buttons/circular-menu-button';
import NameBanner from '../../components/game/name-banner';

type Props = {
  sendMessage: (message: string) => void;
  messages: Array<Message>;
  players: Array<Player>;
  toggleReady: () => void;
};

export default function Lobby({ sendMessage, messages, players, toggleReady }: Props) {
  const [message, setMessage] = React.useState<string>('');
  const [isReady, setIsReady] = React.useState<boolean>(false);

  function handleSendMessage() {
    sendMessage(message);
    setMessage('');
  }

  function onToggleReady() {
    toggleReady();
    setIsReady(prevState => !prevState);
  }

  return (
    <div className="h-full px-2 py-4 sm:container sm:mx-auto sm:max-w-3xl">
      <div className="flex h-full flex-col gap-2">
        <div className="py-4 text-center text-3xl">Lobby</div>
        <div className="flex justify-between">
          <div className="flex items-center gap-2">
            <button className={`btn ${isReady ? 'border border-primary bg-primary text-bg' : 'btn-primary-outlined'}`} onClick={onToggleReady}>
              Ready
            </button>
          </div>
          <div className="flex">
            <CircularMenuButton />
          </div>
        </div>
        <NameBanner players={players} />
        <div className="flex flex-1 flex-col-reverse overflow-y-scroll rounded-md border-2 border-primary border-opacity-50 bg-slate-100 p-2">
          {messages.map((line, index) => (
            <div className="flex gap-2" key={index}>
              <span>{formatTime(line.datetime)}</span>
              <span className="ml-1">{trimName(line.username)}:</span>
              <span className="ml-1">{line.message}</span>
            </div>
          ))}
        </div>
        <input
          placeholder="Write something..."
          className="rounded border-2 border-primary border-opacity-40 bg-slate-100 p-2"
          value={message}
          onChange={e => setMessage(e.target.value)}
          onKeyDown={e => (e.key === 'Enter' ? handleSendMessage() : null)}
        />
        <div className="flex justify-end">
          <IconButton text="" onClick={handleSendMessage} className="border border-primary" svgIcon={sendIcon} />
        </div>
      </div>
    </div>
  );
}
