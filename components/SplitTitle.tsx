"use client";

import { motion } from "framer-motion";
import type { ElementType } from "react";

/**
 * Titre qui monte mot par mot depuis un masque (effet « rideau »).
 * `accent` est rendu en orange, à la suite du texte principal.
 */
export default function SplitTitle({
  text,
  accent,
  className = "",
  as: Tag = "h1",
  delay = 0,
  breakBeforeAccent = true,
}: {
  text: string;
  accent?: string;
  className?: string;
  as?: ElementType;
  delay?: number;
  breakBeforeAccent?: boolean;
}) {
  const words = [
    ...text.split(" ").filter(Boolean).map((w) => ({ w, accent: false })),
    ...(accent ?? "").split(" ").filter(Boolean).map((w) => ({ w, accent: true })),
  ];
  const main = words.filter((x) => !x.accent);
  const acc = words.filter((x) => x.accent);
  const word = (x: { w: string; accent: boolean }, i: number) => (
    <span key={i} aria-hidden>
      <span className="word-mask">
        <motion.span
          className={`inline-block ${x.accent ? "text-orange" : ""}`}
          initial={{ y: "110%", rotate: 4 }}
          animate={{ y: "0%", rotate: 0 }}
          transition={{ duration: 0.85, delay: delay + i * 0.07, ease: [0.22, 1, 0.36, 1] }}
        >
          {x.w}
        </motion.span>
      </span>{" "}
    </span>
  );
  return (
    <Tag className={className} aria-label={`${text} ${accent ?? ""}`.trim()}>
      {main.map((x, i) => word(x, i))}
      {acc.length > 0 &&
        (breakBeforeAccent ? (
          <span className="block">{acc.map((x, i) => word(x, main.length + i))}</span>
        ) : (
          acc.map((x, i) => word(x, main.length + i))
        ))}
    </Tag>
  );
}
