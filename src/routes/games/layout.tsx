import React from 'react';
import { Outlet, Navigate, useLocation } from 'react-router-dom';
import Banner from '../../components/misc/banner';
import SockJS from 'sockjs-client/dist/sockjs';
import Stomp from 'stompjs';
import properties from '../../config/properties';
import { get } from '../../api/api';

export default function GamesLayout() {
  const { wsBaseUrl } = properties();
  const savedUsername = localStorage.getItem('username');
  const [stompClient, setStompClient] = React.useState<Stomp.Client | null>();
  const [username, setUsername] = React.useState<string>();
  const location = useLocation();

  React.useEffect(() => {
    const socket = new SockJS(wsBaseUrl);
    const client = Stomp.over(socket);
    client.connect({}, _frame => setStompClient(client));
  }, []);

  React.useEffect(() => {
    const cleanup = () => stompClient && username && stompClient.send('/app/users/exit', {}, username);
    const handleWindowFocus = () => attemptReconnect();

    const cleanupOnUnmount = () => {
      cleanup();
      window.removeEventListener('beforeunload', cleanup);
      window.removeEventListener('online', handleWindowFocus);
    };

    window.addEventListener('beforeunload', cleanup);
    window.addEventListener('online', handleWindowFocus);

    savedUsername &&
      get<string>(`/users/${savedUsername}/validate`).then(data => {
        console.info(data, 'Received validated username');
        setUsername(data);
        stompClient && stompClient.send('/app/users/enter', {}, data);
      });

    return cleanupOnUnmount;
  }, [stompClient]);

  function attemptReconnect() {
    console.info('checking to see if we should reconnect');
    if (stompClient && !stompClient.connected) {
      console.info('attempting to connect to websocket');
      stompClient.connect({}, _frame => console.info('reconnected'));
    }
  }

  const renderConnecting = (
    <div className="flex h-screen items-center justify-center">
      <div className="text-lg font-bold">Connecting...</div>
    </div>
  );

  if (!stompClient) return renderConnecting;
  if (!savedUsername) return <Navigate to="/choose-a-name" state={{ from: location.pathname }} replace />;
  if (!username) return renderConnecting;

  return (
    <React.Fragment>
      <Banner />
      <Outlet context={{ username: username, stompClient }} />
    </React.Fragment>
  );
}
