import { useEffect, useRef, useState } from 'react';
import { Client } from '@stomp/stompjs';
import properties from '../config/properties';
import SockJS from 'sockjs-client/dist/sockjs';

export const useWebsocket = () => {
  const stompClient = useRef<Client | null>(null);
  const [isConnected, setIsConnected] = useState<boolean>(false);
  const [connectAttempt, setConnectAttempt] = useState<number>(0);
  const [isError, setIsError] = useState<boolean>(false);
  const { wsBaseUrl } = properties();

  useEffect(() => {
    stompClient.current = new Client({
      webSocketFactory: () => new SockJS(wsBaseUrl),
      reconnectDelay: 1000,
      heartbeatIncoming: 2000,
      heartbeatOutgoing: 2000,
      onConnect: () => handleConnectEvent(),
      onDisconnect: () => setIsConnected(false),
      onStompError: _frame => setIsError(true)
    });

    stompClient.current.activate();
  }, []);

  function handleConnectEvent() {
    setIsConnected(true);
    setConnectAttempt(prevState => prevState + 1);
  }

  return [{ connectAttempt, isConnected, isError }, stompClient];
};
