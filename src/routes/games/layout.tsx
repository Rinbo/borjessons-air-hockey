import React from 'react';
import { Outlet, Navigate } from 'react-router-dom';
import Banner from '../../components/misc/banner';
import SockJS from 'sockjs-client/dist/sockjs';
import Stomp from 'stompjs';
import properties from '../../config/properties';

export default function GamesLayout() {
  const { wsBaseUrl } = properties();
  const savedUsername = localStorage.getItem('username');
  const [stompClient, setStompClient] = React.useState<Stomp.Client | null>();
  const [username, setUsername] = React.useState();

  React.useEffect(() => {
    const socket = new SockJS(wsBaseUrl);
    const client = Stomp.over(socket);
    client.connect({}, _frame => setStompClient(client));
  }, []);

  // TODO rename username from localStorage to savedUsername. If it is not set then forward to set-name component
  // If it is set (meaning we were redirected back here) then first validate, enter via websocket and then set state username which also cannot be null
  React.useEffect(() => {
    stompClient && savedUsername && stompClient.send('/app/enter', {}, savedUsername);
    return () => stompClient && savedUsername && stompClient.send('/app/exit', {}, savedUsername);
  }, [savedUsername]);

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
