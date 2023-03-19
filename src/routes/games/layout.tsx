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

    client.connect({}, _frame => {
      console.info('Websocket connection established');
      setStompClient(client);
    });
  }, []);

  if (!stompClient)
    return (
      <div className="flex items-center justify-center">
        <div className="text-lg font-bold">Connecting...</div>
      </div>
    );

  if (!username) {
    return <Navigate to="/choose-a-name" state={{ from: location.pathname }} replace />;
  }

  return (
    <React.Fragment>
      <Banner />
      <Outlet context={{ username, stompClient }} />
    </React.Fragment>
  );
}
