import React from 'react';
import { useOutletContext } from 'react-router-dom';
import { get } from '../../api/api';
import OnlineUsersList, { User } from '../../components/users/online-users-list';
import Stomp from 'stompjs';

const ONLINE_USERS = ['Robin', 'Albin', 'Sixten', 'Maria'];

export function OnlineUsers() {
  const [users, setUsers] = React.useState<User[]>();
  const { stompClient } = useOutletContext<{ stompClient: Stomp.Client }>();

  React.useEffect(() => {
    get<string[]>('/users').then(data => setUsers(createUsers(data)));

    stompClient.subscribe(`/topic/users`, (message: Stomp.Message) => {
      setUsers(createUsers(JSON.parse(message.body)));
    });
  }, []);

  function createUsers(names: string[]) {
    return names.map(name => {
      return { name };
    });
  }

  if (!users) return <div className="text-2xl">Loading...</div>;
  return <OnlineUsersList users={users} />;
}
