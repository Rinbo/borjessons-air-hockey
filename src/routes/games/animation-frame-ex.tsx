import React, { useState, useEffect, useRef } from 'react';

const Example: React.FC = () => {
  const [time, setTime] = useState(0);
  const requestRef = useRef<number>(0);

  useEffect(() => {
    let elapsed = 0;
    let startTime = performance.now();
    let lastTime = startTime;

    function tick(currentTime: number) {
      requestRef.current = requestAnimationFrame(tick);
      elapsed += currentTime - lastTime;
      lastTime = currentTime;

      while (elapsed >= 1000) {
        setTime(t => t + 1);
        elapsed -= 1000;
      }
    }

    requestRef.current = requestAnimationFrame(tick);

    return () => cancelAnimationFrame(requestRef.current);
  }, []);

  return (
    <div>
      <p>Time: {time}</p>
    </div>
  );
};

export default Example;
