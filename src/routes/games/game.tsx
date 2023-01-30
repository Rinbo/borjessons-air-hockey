import React from 'react';
import Canvas from '../../components/canvas/canvas';

export default function Game() {
  const boardRef = React.useRef<HTMLDivElement>(null);

  return (
    <div ref={boardRef} className="pt-5 h-screen flex flex-col items-center justify-center border-red-600">
      <Canvas />
    </div>
  );
}
