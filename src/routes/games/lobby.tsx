import React from 'react';
import { useOutletContext, useParams } from 'react-router-dom';
import IconButton from '../../components/buttons/icon-button';
import shareIcon from '../../assets/svg/share.svg';
import sendIcon from '../../assets/svg/send.svg';
import SockJS from 'sockjs-client/dist/sockjs';
import Stomp from 'stompjs';

type Message = { username: string; message: string; datetime: string };
type OutletContext = { name: string };

export default function Lobby() {
  const { id } = useParams<string>();
  const { name } = useOutletContext<OutletContext>();
  const [stompClient, setStompClient] = React.useState<Stomp.Client | null>();
  const [messages, setMessages] = React.useState<Array<Message>>([]);
  const [message, setMessage] = React.useState<string>('');

  React.useEffect(() => {
    const socket = new SockJS('http://localhost:8080/ws');
    const stomp = Stomp.over(socket);

    stomp.connect({}, frame => {
      console.log('Connecting', frame);
      setStompClient(stomp);
      stomp.subscribe('/topic/public', (message: Stomp.Message) => {
        setMessages(prev => [...prev, JSON.parse(message.body) as Message]);
      });
    });

    return () => stomp.disconnect(() => console.log('disconnecting...'));
  }, []);

  const sendMessage = () => {
    stompClient && stompClient.send('/app/send-message', {}, JSON.stringify({ username: name, message: message, datetime: new Date() }));
    setMessage('');
  };

  return (
    <div className="sm:container sm:max-w-3xl h-screen sm:mx-auto px-2 py-4">
      <div className="flex flex-col gap-2 h-full">
        <div className="text-center text-3xl py-4">Lobby</div>
        <div className="flex justify-between">
          <div className="flex items-center gap-2">
            <button className="btn btn-primary-outlined">Ready</button>
            <div className="inline-flex flex-col gap-2">
              <span className="text-xs whitespace-nowrap overflow-hidden">P1: {name}</span>
              <span className="text-xs whitespace-nowrap overflow-hidden">P2:</span>
            </div>
          </div>
          <div className="flex gap-2">
            <IconButton text="" onClick={() => console.log('share')} className="border border-primary" svgIcon={shareIcon} />
            <button className="btn btn-orange-outlined w-20">Exit</button>
          </div>
        </div>
        <div className="flex-1 flex flex-col justify-end bg-slate-100 p-2 border-2 border-primary border-opacity-50 rounded-md ">
          {messages.map((line, index) => (
            <div className="flex gap-2" key={index}>
              <span>{new Date(Number.parseInt(line.datetime) * 1000).toLocaleTimeString()}</span>
              <span className="ml-1">{line.username}:</span>
              <span className="ml-1">{line.message}</span>
            </div>
          ))}
        </div>
        <input
          placeholder="Write something..."
          className="p-2 bg-slate-100 border-2 border-primary border-opacity-40 rounded"
          value={message}
          onChange={e => setMessage(e.target.value)}
          onKeyDown={e => (e.key === 'Enter' ? sendMessage() : null)}
        />
        <div className="flex justify-end">
          <IconButton text="" onClick={sendMessage} className="border border-primary" svgIcon={sendIcon} />
        </div>
      </div>
    </div>
  );
}
