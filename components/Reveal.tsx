"use client";

import { useEffect, useRef, useState, type PropsWithChildren } from "react";

type From = "up" | "down" | "left" | "right" | "scale" | "fade";

const HIDDEN: Record<From, string> = {
  up: "opacity-0 translate-y-8",
  down: "opacity-0 -translate-y-8",
  left: "opacity-0 -translate-x-10",
  right: "opacity-0 translate-x-10",
  scale: "opacity-0 scale-[0.92]",
  fade: "opacity-0",
};

/**
 * Apparition au défilement (fondu + déplacement). Une seule fois par élément.
 * `prefers-reduced-motion` est géré globalement dans globals.css.
 */
export default function Reveal({
  children,
  delay = 0,
  className = "",
  from = "up",
}: PropsWithChildren<{ delay?: number; className?: string; from?: From }>) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([entry]) => {
        // Visible, ou déjà dépassé (défilement très rapide) : on affiche.
        if (entry.isIntersecting || entry.boundingClientRect.top < 0) {
          setVisible(true);
          obs.disconnect();
        }
      },
      { threshold: 0.12, rootMargin: "0px 0px -40px 0px" }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  return (
    <div
      ref={ref}
      className={`transition-all duration-[900ms] ease-[cubic-bezier(0.22,1,0.36,1)] ${
        visible ? "translate-x-0 translate-y-0 scale-100 opacity-100" : HIDDEN[from]
      } ${className}`}
      style={{ transitionDelay: `${delay}ms` }}
    >
      {children}
    </div>
  );
}
