"use client";

import { useId } from "react";
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";

/** Pastille circulaire au texte tournant, flèche au centre (lien). */
export default function RotatingBadge({ href, text, light = false }: { href: string; text: string; light?: boolean }) {
  const id = `badge-${useId().replace(/:/g, "")}`;
  return (
    <Link
      href={href}
      className={`group relative inline-flex h-32 w-32 shrink-0 items-center justify-center rounded-full transition-transform duration-500 hover:scale-105 ${
        light ? "bg-white text-ink shadow-lift" : "bg-ink text-white ring-1 ring-white/15"
      }`}
      aria-label={text}
    >
      <svg viewBox="0 0 120 120" className="absolute inset-0 h-full w-full animate-spinSlow group-hover:[animation-duration:6s]" aria-hidden>
        <defs>
          <path id={id} d="M60,60 m-46,0 a46,46 0 1,1 92,0 a46,46 0 1,1 -92,0" />
        </defs>
        <text className={`${light ? "fill-ink" : "fill-white"} font-mono text-[10px] uppercase tracking-[0.3em]`}>
          <textPath href={`#${id}`}>{text}</textPath>
        </text>
      </svg>
      <span className="relative inline-flex h-12 w-12 items-center justify-center rounded-full bg-orange text-white transition-transform duration-500 group-hover:rotate-45">
        <ArrowUpRight size={22} />
      </span>
    </Link>
  );
}
