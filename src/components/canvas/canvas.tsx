import React from 'react';

type Props = {};

const Canvas: React.FC<Props> = () => {
  const canvasRef = React.useRef<HTMLCanvasElement>(null);

  const [width, setWidth] = React.useState(400);
  const [height, setHeight] = React.useState(600);

  React.useEffect(() => {
    if (typeof ResizeObserver === 'undefined') return;

    const observer = new ResizeObserver(entries => {
      for (const entry of entries) {
        setWidth(entry.contentRect.width);
        setHeight(entry.contentRect.height);
      }
    });

    observer.observe(canvasRef.current as Element);

    return () => observer.disconnect();
  }, []);

  React.useEffect(() => {
    if (canvasRef.current) {
      const canvas = canvasRef.current;
      canvas.width = width;
      canvas.height = height;
    }
  }, [width, height]);

  return (
    <React.Fragment>
      <div style={{ width }} className="bg-slate-300 h-12"></div>
      <canvas className="border border-black" ref={canvasRef} />
    </React.Fragment>
  );
};

export default Canvas;
