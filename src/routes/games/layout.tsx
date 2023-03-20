import React from 'react';
import { Outlet, Navigate } from 'react-router-dom';
import Banner from '../../components/misc/banner';
import SockJS from 'sockjs-client/dist/sockjs';
import Stomp from 'stompjs';

export default function GamesLayout() {
  const username = localStorage.getItem('username');
  const [stompClient, setStompClient] = React.useState<Stomp.Client | null>();

  React.useEffect(() => {
    const socket = new SockJS('http://localhost:8080/ws');
    const client = Stomp.over(socket);
    client.connect({}, _frame => setStompClient(client));
  }, []);

  // TODO rename username from localStorage to savedUsername. If it is not set then forward to set-name component
  // If it is set (meaning we were redirected back here) then first validate, enter via websocket and then set state username which also cannot be null
  React.useEffect(() => {
    stompClient && username && stompClient.send('/app/enter', {}, username);
    return () => stompClient && username && stompClient.send('/app/exit', {}, username);
  }, [username]);

  const renderConnecting = (
    <div className="flex items-center justify-center">
      <div className="text-lg font-bold">Connecting...</div>
    </div>
  );

  if (!stompClient) return renderConnecting;
  if (!username) return <Navigate to="/choose-a-name" state={{ from: location.pathname }} replace />;

  return (
    <React.Fragment>
      <Banner />
      <Outlet context={{ username, stompClient }} />
    </React.Fragment>
  );
}
