import React, { useState } from 'react';
import { HiOutlineClipboardCopy } from 'react-icons/hi';

const CopyUrlButton: React.FC = () => {
  const [showMessage, setShowMessage] = useState(false);

  const handleClick = () => {
    navigator.clipboard.writeText(window.location.href);
    setShowMessage(true);
    setTimeout(() => {
      setShowMessage(false);
    }, 3000);
  };
  return (
    <div className="relative inline-block">
      <button onClick={handleClick} className="btn btn-primary-outlined">
        <HiOutlineClipboardCopy className="inline-flex h-6 w-6 items-center justify-center" />
      </button>
      {showMessage && <div className="animate-grow-shrink absolute right-full ml-2 w-28 rounded-md bg-teal-200 px-3 py-2 text-primary">URL copied</div>}
    </div>
  );
};

export default CopyUrlButton;
