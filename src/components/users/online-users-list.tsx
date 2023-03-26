import React from 'react';
import InitialsAvatar from './initials-avatar';

export interface User {
  name: string;
}

interface Props {
  users: User[];
}

const OnlineUsersList: React.FC<Props> = ({ users }) => {
  return (
    <div className="mx-auto w-full max-w-screen-lg px-4 py-6">
      <h2 className="mb-4 pt-4 pb-2 text-center text-2xl font-semibold">Online Users</h2>
      <ul className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
        {users.map((user, index) => (
          <li key={index} className="flex items-center space-x-3">
            <InitialsAvatar name={user.name} size={48} />
            <span className="font-medium">{user.name}</span>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default OnlineUsersList;
