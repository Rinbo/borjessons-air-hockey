import { useLayoutEffect, useState } from 'react';

const ASPECT_RATIO = 1.6;
const MAX_WIDTH = 500;
const X_PADDING = 10;

export function useWindowSize() {
  const [size, setSize] = useState([0, 0]);

  useLayoutEffect(() => {
    function updateSize() {
      const width = Math.min(window.innerWidth, MAX_WIDTH) - X_PADDING;
      setSize([width, width * ASPECT_RATIO]);
    }
    window.addEventListener('resize', updateSize);
    updateSize();
    return () => window.removeEventListener('resize', updateSize);
  }, []);

  return size;
}
