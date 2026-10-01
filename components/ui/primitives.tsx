"use client";

import Link from "next/link";
import { type LucideIcon } from "lucide-react";
import type { ReactNode } from "react";
import type { Tone } from "@/lib/labels";
import { SlideArrow } from "./ArrowButton";

const TONES: Record<Tone, string> = {
  orange: "bg-orangeL text-orangeD ring-orange/20",
  ink: "bg-ink/[0.06] text-ink ring-ink/10",
  success: "bg-success/10 text-success ring-success/20",
  danger: "bg-danger/10 text-danger ring-danger/20",
  muted: "bg-muted text-mutedfg ring-ink/5",
};

export function Badge({ tone = "muted", children, dot = true }: { tone?: Tone; children: ReactNode; dot?: boolean }) {
  return (
    <span className={`inline-flex items-center gap-1.5 whitespace-nowrap rounded-full px-2.5 py-1 text-[11px] font-semibold ring-1 ring-inset ${TONES[tone]}`}>
      {dot && <span className="h-1.5 w-1.5 rounded-full bg-current" />}
      {children}
    </span>
  );
}

/** Pastille d'icône carrée arrondie, utilisée sur les cartes et la navigation. */
export function IconTile({
  icon: Icon,
  tone = "ink",
  size = "md",
  children,
}: {
  icon?: LucideIcon;
  tone?: "ink" | "orange" | "light" | "white";
  size?: "sm" | "md" | "lg";
  children?: ReactNode;
}) {
  const tones = {
    ink: "bg-ink text-white",
    orange: "bg-orange text-white",
    light: "bg-orangeL text-orange",
    white: "bg-white text-ink border border-line",
  };
  const sizes = { sm: "h-9 w-9 rounded-xl", md: "h-12 w-12 rounded-2xl", lg: "h-16 w-16 rounded-[1.25rem]" };
  const iconSize = { sm: 16, md: 22, lg: 28 }[size];
  return (
    <span className={`inline-flex shrink-0 items-center justify-center ${tones[tone]} ${sizes[size]}`}>
      {Icon ? <Icon size={iconSize} strokeWidth={1.9} /> : children}
    </span>
  );
}

/** Lien texte avec flèche glissante. */
export function ArrowLink({ href, children, light = false }: { href: string; children: ReactNode; light?: boolean }) {
  return (
    <Link
      href={href}
      className={`group inline-flex items-center gap-2 text-sm font-semibold transition-colors ${
        light ? "text-white hover:text-orange" : "text-ink hover:text-orange"
      }`}
    >
      <span className="border-b border-current pb-0.5">{children}</span>
      <SlideArrow />
    </Link>
  );
}

export function EmptyState({
  icon: Icon,
  title,
  text,
  action,
}: {
  icon: LucideIcon;
  title: string;
  text?: string;
  action?: ReactNode;
}) {
  return (
    <div className="card flex flex-col items-center px-6 py-14 text-center">
      <span className="mb-4 inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-orangeL text-orange">
        <Icon size={26} strokeWidth={1.8} />
      </span>
      <p className="h-display text-2xl">{title}</p>
      {text && <p className="mt-2 max-w-sm text-sm text-mutedfg">{text}</p>}
      {action && <div className="mt-6">{action}</div>}
    </div>
  );
}

export function Skeleton({ className = "" }: { className?: string }) {
  return (
    <div className={`relative overflow-hidden rounded-card bg-muted ${className}`}>
      <div className="absolute inset-0 -translate-x-full animate-shimmer bg-gradient-to-r from-transparent via-white/60 to-transparent" />
    </div>
  );
}

/** Barre de remplissage (places, progression). */
export function Meter({ value, max, tone = "orange" }: { value: number; max: number; tone?: "orange" | "ink" }) {
  const pct = max > 0 ? Math.min(100, Math.round((value / max) * 100)) : 0;
  return (
    <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted" role="meter" aria-valuenow={value} aria-valuemax={max}>
      <div
        className={`h-full rounded-full transition-[width] duration-700 ease-out ${tone === "orange" ? "bg-orange" : "bg-ink"}`}
        style={{ width: `${pct}%` }}
      />
    </div>
  );
}

export function Field({ label, children, hint }: { label: string; children: ReactNode; hint?: string }) {
  return (
    <label className="block">
      <span className="field-label">{label}</span>
      {children}
      {hint && <span className="mt-1 block text-xs text-mutedfg">{hint}</span>}
    </label>
  );
}
