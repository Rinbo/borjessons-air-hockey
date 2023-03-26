import React from 'react';

interface Props {
  name: string;
  size?: number;
  className?: string;
}

const stringToColor = (str: string) => {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  let color = '#';
  for (let i = 0; i < 3; i++) {
    const value = (hash >> (i * 8)) & 0xff;
    color += ('00' + value.toString(16)).substr(-2);
  }
  return color;
};

const getInitials = (name: string) => {
  return name
    .split(' ')
    .map(part => part.charAt(0).toUpperCase())
    .join('')
    .substr(0, 2);
};

const InitialsAvatar: React.FC<Props> = ({ name, size = 40, className }) => {
  const initials = getInitials(name);
  const backgroundColor = stringToColor(name);

  return (
    <div
      className={`flex items-center justify-center rounded-full text-sm font-semibold text-white ${className}`}
      style={{
        width: size,
        height: size,
        backgroundColor: backgroundColor
      }}
    >
      {initials}
    </div>
  );
};

export default InitialsAvatar;
