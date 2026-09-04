"use client";

import { useEffect, useRef, useState } from "react";

interface CountUpProps {
  value: number;
  /** ms */
  duration?: number;
  format: (value: number) => string;
  className?: string;
}

const easeOut = (t: number) => 1 - (1 - t) ** 3;

/** Animated number that eases from its previous value to the new one. */
export function CountUp({ value, duration = 750, format, className }: CountUpProps) {
  const [display, setDisplay] = useState(value);
  const fromRef = useRef(value);
  const frameRef = useRef<number | null>(null);

  useEffect(() => {
    const from = fromRef.current;
    const delta = value - from;
    if (Math.abs(delta) < 1e-9) {
      setDisplay(value);
      return;
    }

    const start = performance.now();
    const tick = (now: number) => {
      const progress = Math.min((now - start) / duration, 1);
      setDisplay(from + delta * easeOut(progress));
      if (progress < 1) {
        frameRef.current = requestAnimationFrame(tick);
      } else {
        fromRef.current = value;
      }
    };

    frameRef.current = requestAnimationFrame(tick);
    return () => {
      if (frameRef.current) cancelAnimationFrame(frameRef.current);
      fromRef.current = value;
    };
  }, [value, duration]);

  return <span className={className}>{format(display)}</span>;
}
