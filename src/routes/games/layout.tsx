import React from 'react';
import { Outlet, Navigate, useLocation } from 'react-router-dom';
import Banner from '../../components/misc/banner';
import { Client } from '@stomp/stompjs';
import { get } from '../../api/api';
import { useWebsocket } from '../../hooks/useWebsocket';

type ConnectionDetails = { connectAttempt: number; isConnected: boolean; isError: boolean };

export default function GamesLayout() {
  const savedUsername = localStorage.getItem('username');
  const [username, setUsername] = React.useState<string>();
  const location = useLocation();
  const [{ connectAttempt, isConnected, isError }, stompClient] = useWebsocket() as [ConnectionDetails, React.MutableRefObject<Client | null>];

  React.useEffect(() => {
    const cleanup = () => username && stompClient.current?.publish({ destination: '/app/users/exit', body: username });

    const cleanupOnUnmount = () => {
      cleanup();
      window.removeEventListener('beforeunload', cleanup);
    };

    window.addEventListener('beforeunload', cleanup);

    savedUsername &&
      get<string>(`/users/${savedUsername}/validate`).then(data => {
        console.info(data, 'Received validated username');
        setUsername(data);
        isConnected && stompClient.current!.publish({ destination: '/app/users/enter', body: data });
      });

    return cleanupOnUnmount;
  }, [isConnected]);

  const renderConnecting = (
    <div className="flex h-screen items-center justify-center">
      <div className="text-lg font-bold">Connecting websocket...</div>
    </div>
  );

  const renderActivating = (
    <div className="flex h-screen items-center justify-center">
      <div className="text-lg font-bold">Activating websocket...</div>
    </div>
  );

  const renderError = (
    <div className="flex h-screen items-center justify-center">
      <div className="text-lg font-bold">Unable to connect :(</div>
    </div>
  );

  if (isError) renderError;
  if (!savedUsername) return <Navigate to="/choose-a-name" state={{ from: location.pathname }} replace />;
  if (!stompClient.current) return renderActivating;
  if (!isConnected) return renderConnecting;
  if (!username) return renderConnecting;

  return (
    <React.Fragment>
      <Banner />
      <Outlet context={{ username, stompClient: stompClient.current, connectAttempt }} />
    </React.Fragment>
  );
}
