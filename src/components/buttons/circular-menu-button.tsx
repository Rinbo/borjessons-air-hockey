import { useState } from 'react';
import { FiSettings, FiClipboard, FiX } from 'react-icons/fi';

const CircularMenuButton = () => {
  const [isExpanded, setIsExpanded] = useState(false);

  const toggleExpansion = () => {
    setIsExpanded(!isExpanded);
  };

  return (
    <div className="relative">
      <button className="flex h-12 w-12 items-center justify-center rounded-full bg-gray-800 text-white" onClick={toggleExpansion} title="Settings">
        <FiSettings size={24} />
      </button>

      <button
        className={`${
          isExpanded && 'animate-eight-expand'
        } absolute left-0 bottom-0 hidden h-12 w-12 items-center justify-center rounded-full bg-gray-800 text-white`}
        title="Clipboard"
      >
        <FiClipboard size={24} />
      </button>
      <button
        className={`${
          isExpanded && 'animate-seven-expand'
        } absolute left-0 bottom-0 hidden h-12 w-12 items-center justify-center rounded-full bg-gray-800 text-white`}
        title="Exit"
      >
        <FiX size={24} />
      </button>
    </div>
  );
};

export default CircularMenuButton;
