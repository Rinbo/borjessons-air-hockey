import { useState, useEffect, useRef } from 'react';
import { FiSettings } from 'react-icons/fi';
import { BiExit } from 'react-icons/bi';
import CopyUrlButton from './copy-link-button';
import { useNavigate } from 'react-router-dom';

const CircularMenuButton = () => {
  const [isExpanded, setIsExpanded] = useState<boolean>(false);
  const [spin, setSpin] = useState<boolean>(false);
  const componentRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  function toggleExpansion() {
    triggerSpin();
    setIsExpanded(!isExpanded);
  }

  const handleClickOutside = (event: MouseEvent | TouchEvent) => {
    const target = event.target;
    if (target instanceof Node && componentRef.current && !componentRef.current.contains(target)) {
      setIsExpanded(prevState => {
        if (prevState) triggerSpin();
        return false;
      });
    }
  };

  function triggerSpin() {
    setSpin(true);
    setTimeout(() => setSpin(false), 500);
  }

  useEffect(() => {
    window.addEventListener('click', handleClickOutside);
    window.addEventListener('touchstart', handleClickOutside);
    return () => {
      window.removeEventListener('click', handleClickOutside);
      window.removeEventListener('touchstart', handleClickOutside);
    };
  }, []);

  return (
    <div className="relative" ref={componentRef}>
      <button
        className={`${
          spin && 'animate-spin'
        } relative z-10 flex h-12 w-12 items-center justify-center rounded-full border-2 border-primary bg-primary text-bg hover:bg-slate-600`}
        onClick={toggleExpansion}
        title="Settings"
      >
        <FiSettings size={24} />
      </button>

      <CopyUrlButton
        classes={`${
          isExpanded && 'posSeven'
        } buttonAnimated absolute left-0 bottom-0 z-0 flex h-12 w-12 scale-50 items-center justify-center rounded-full border border-primary bg-slate-100 text-primary opacity-0 shadow-md hover:bg-teal-200`}
        title="Clipboard"
      ></CopyUrlButton>
      <button
        className={`${
          isExpanded && 'posEight'
        } buttonAnimated absolute left-0 bottom-0 z-0 flex h-12 w-12 scale-50 items-center justify-center rounded-full border border-primary bg-slate-100 text-primary opacity-0 shadow-md hover:bg-teal-200`}
        title="Exit"
        onClick={() => navigate('/')}
      >
        <BiExit size={24} />
      </button>
    </div>
  );
};

export default CircularMenuButton;
