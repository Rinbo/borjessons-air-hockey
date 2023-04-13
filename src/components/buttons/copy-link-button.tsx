import React, { useState } from 'react';
import { HiOutlineClipboardCopy } from 'react-icons/hi';
import { FiClipboard } from 'react-icons/fi';

const CopyUrlButton = ({ classes, title }: { classes: string; title: string }) => {
  const [showMessage, setShowMessage] = useState(false);

  const handleClick = () => {
    navigator.clipboard.writeText(window.location.href);
    setShowMessage(true);
    setTimeout(() => setShowMessage(false), 3000);
  };
  return (
    <>
      <button onClick={handleClick} className={classes} title={title}>
        <FiClipboard size={24} className="inline-flex h-6 w-6 items-center justify-center" />
      </button>
      {showMessage && <div className="animate-grow-shrink absolute right-24 ml-2 w-28 rounded-md bg-teal-200 px-3 py-2 text-primary">URL copied</div>}
    </>
  );
};

export default CopyUrlButton;
