import { useLayoutEffect, useState } from 'react';

const ASPECT_RATIO = 1.6;
const MAX_WIDTH = 500;
const BANNER_HEIGHTS = 68; // {@link Banner} {@link ScoreBanner}
const MARGIN = 10;

/**
 * Calculates the width and height of the HTML Canvas.
 * It ensures that the width will never be greater than MAX_WIDTH.
 * If there is still not enough vertical space to fit the canvas in the view port, then instead use
 * window.innerHeight to set the height
 */
export function useWindowSize() {
  const [size, setSize] = useState([0, 0]);

  useLayoutEffect(() => {
    function updateSize() {
      const width = Math.min(window.innerWidth, MAX_WIDTH);
      const height = width * ASPECT_RATIO;
      if (height + 48 + 20 >= window.innerHeight) {
        const maxHeight = window.innerHeight - 48 - 20 - MARGIN;
        setSize([maxHeight / ASPECT_RATIO, maxHeight]);
      } else {
        setSize([width, height]);
      }
    }
    window.addEventListener('resize', updateSize);
    updateSize();
    return () => window.removeEventListener('resize', updateSize);
  }, []);

  return size;
}
