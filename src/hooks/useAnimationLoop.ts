import { useRef, useEffect, useCallback, useState } from 'react';

export function useAnimationLoop(speed = 1) {
  const [playing, setPlaying] = useState(true);
  const [angle, setAngle] = useState(0);
  const frameRef = useRef<number>(0);
  const lastTimeRef = useRef<number>(0);
  const angleRef = useRef(0);

  const tick = useCallback((time: number) => {
    if (lastTimeRef.current === 0) lastTimeRef.current = time;
    const dt = time - lastTimeRef.current;
    lastTimeRef.current = time;
    // speed=1 → 60 RPM visual → 360°/sec
    angleRef.current = (angleRef.current + speed * dt * 0.36) % 720;
    setAngle(angleRef.current);
    frameRef.current = requestAnimationFrame(tick);
  }, [speed]);

  useEffect(() => {
    if (playing) {
      lastTimeRef.current = 0;
      frameRef.current = requestAnimationFrame(tick);
    }
    return () => {
      if (frameRef.current) cancelAnimationFrame(frameRef.current);
    };
  }, [playing, tick]);

  const toggle = useCallback(() => setPlaying(p => !p), []);
  const reset = useCallback(() => {
    angleRef.current = 0;
    setAngle(0);
  }, []);

  return { angle, playing, toggle, reset, setAngle };
}
