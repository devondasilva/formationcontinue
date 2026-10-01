"use client";

import { useEffect, useRef, useState } from "react";

/** Compte de 0 à `value` dès que le nombre devient visible. */
export default function Counter({
  value,
  suffix = "",
  duration = 1300,
  grouped = true,
}: {
  value: number;
  suffix?: string;
  duration?: number;
  /** Séparateur de milliers (désactiver pour une année, ex. 2011). */
  grouped?: boolean;
}) {
  const [display, setDisplay] = useState(0);
  const ref = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    let raf = 0;
    const obs = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) return;
        obs.disconnect();
        const start = performance.now();
        const tick = (now: number) => {
          const p = Math.min(1, (now - start) / duration);
          setDisplay(Math.round((1 - Math.pow(1 - p, 4)) * value));
          if (p < 1) raf = requestAnimationFrame(tick);
        };
        raf = requestAnimationFrame(tick);
      },
      { threshold: 0.4 }
    );
    obs.observe(el);
    return () => {
      obs.disconnect();
      cancelAnimationFrame(raf);
    };
  }, [value, duration]);

  return (
    <span ref={ref} className="tabular-nums">
      {grouped ? display.toLocaleString("fr-FR") : display}
      {suffix}
    </span>
  );
}
