import React, { RefObject } from 'react';

const ASPECT_RATIO = 1.6;
const MAX_WIDTH = 500;
const X_PADDING = 10;

type Props = { canvasRef: RefObject<HTMLCanvasElement> };

const Canvas: React.FC<Props> = ({ canvasRef }) => {
  const [width, setWidth] = React.useState<number>(0);
  const [height, setHeight] = React.useState<number>(0);

  React.useEffect(() => {
    if (typeof ResizeObserver === 'undefined') return;

    const observer = new ResizeObserver(_ => {
      const windowWidth = window.innerWidth;
      const actualWidth = Math.min(windowWidth, MAX_WIDTH) - X_PADDING;

      setWidth(actualWidth);
      setHeight(actualWidth * ASPECT_RATIO);
    });

    observer.observe(canvasRef.current as Element);

    return () => observer.disconnect();
  }, []);

  console.log(width, 'ACTUAL WIDTH');

  React.useEffect(() => {
    if (canvasRef.current) {
      const canvas = canvasRef.current;
      canvas.width = width;
      canvas.height = height;
    }
  }, [width, height]);

  return (
    <React.Fragment>
      <div style={{ width }} className="h-12 bg-slate-300"></div>
      <canvas className="border border-black" ref={canvasRef} />
    </React.Fragment>
  );
};

export default Canvas;
