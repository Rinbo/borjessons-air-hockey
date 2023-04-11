import React from 'react';
import { Outlet, Navigate, useLocation } from 'react-router-dom';
import Banner from '../../components/misc/banner';
import { Client } from '@stomp/stompjs';
import { get } from '../../api/api';
import { useWebsocket } from '../../hooks/useWebsocket';

type ConnectionDetails = { connectAttempt: number; isConnected: boolean; isError: boolean };

export default function GamesLayout() {
  const savedUsername = localStorage.getItem('username');
  const [username, setUsername] = React.useState<undefined | string>();
  const location = useLocation();
  const [{ connectAttempt, isConnected, isError }, stompClient] = useWebsocket() as [ConnectionDetails, React.MutableRefObject<Client | null>];

  React.useEffect(() => {
    savedUsername && get<string>(`/users/${savedUsername}/validate`).then(data => setUsername(data));
  }, []);

  React.useEffect(() => {
    isConnected && username && stompClient.current!.publish({ destination: '/app/users/enter', body: username });
  }, [isConnected, username]);

  React.useEffect(() => {
    const cleanup = () => username && stompClient.current?.publish({ destination: '/app/users/exit', body: username });
    window.addEventListener('beforeunload', cleanup);

    const cleanupOnUnmount = () => {
      cleanup();
      window.removeEventListener('beforeunload', cleanup);
    };

    return cleanupOnUnmount;
  }, [username]);

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
