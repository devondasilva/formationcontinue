"use client";

import Link from "next/link";
import { ArrowRight, Loader2, type LucideIcon } from "lucide-react";
import type { ComponentPropsWithoutRef, MouseEvent, ReactNode } from "react";

/**
 * Bouton signature MADES : pilule, remplissage circulaire qui part du
 * curseur, roulement vertical des lettres et flèche qui « traverse ».
 * Rendu en <Link> si `href` est fourni, sinon en <button>.
 */

type Variant = "primary" | "dark" | "outline" | "light" | "ghost" | "danger";
type Size = "sm" | "md" | "lg";

const VARIANTS: Record<Variant, { base: string; fill: string }> = {
  primary: { base: "bg-orange text-white shadow-glow", fill: "bg-ink" },
  dark: { base: "bg-ink text-white", fill: "bg-orange" },
  outline: { base: "border border-ink/15 text-ink bg-transparent hover:text-white hover:border-orange", fill: "bg-orange" },
  light: { base: "bg-white text-ink", fill: "bg-ink" },
  ghost: { base: "border border-white/25 text-white hover:border-white", fill: "bg-white/15" },
  danger: { base: "border border-danger/30 text-danger bg-white hover:text-white hover:border-danger", fill: "bg-danger" },
};

const SIZES: Record<Size, string> = {
  sm: "px-4 py-2 text-xs gap-1.5",
  md: "px-6 py-3.5 text-sm gap-2",
  lg: "px-7 py-4 text-[15px] gap-2.5",
};

interface CommonProps {
  children: string;
  variant?: Variant;
  size?: Size;
  arrow?: boolean;
  icon?: LucideIcon;
  loading?: boolean;
  full?: boolean;
  className?: string;
}

type LinkProps = CommonProps & { href: string; external?: boolean };
type ButtonProps = CommonProps &
  Omit<ComponentPropsWithoutRef<"button">, "children" | "className"> & { href?: undefined };

export function RollText({ text }: { text: string }) {
  const chars = Array.from(text);
  const line = (hidden: boolean) => (
    <span className={`roll-line${hidden ? " roll-line--next" : ""}`}>
      {chars.map((c, i) => (
        <span key={i} className="roll-char" style={{ ["--i" as string]: i }}>
          {c}
        </span>
      ))}
    </span>
  );
  return (
    <span className="roll" aria-hidden>
      {line(false)}
      {line(true)}
    </span>
  );
}

export function SlideArrow({ size = 16 }: { size?: number }) {
  return (
    <span className="btn-arrow" style={{ width: size, height: size }} aria-hidden>
      <ArrowRight size={size} strokeWidth={2.2} />
      <ArrowRight size={size} strokeWidth={2.2} />
    </span>
  );
}

/** Positionne le cercle de remplissage au point d'entrée du curseur. */
function placeFill(e: MouseEvent<HTMLElement>) {
  const el = e.currentTarget;
  const fill = el.querySelector<HTMLElement>(".btn-fill");
  if (!fill) return;
  const r = el.getBoundingClientRect();
  const d = Math.hypot(r.width, r.height) * 2.2;
  fill.style.left = `${e.clientX - r.left}px`;
  fill.style.top = `${e.clientY - r.top}px`;
  fill.style.width = fill.style.height = `${d}px`;
}

export default function ArrowButton(props: LinkProps | ButtonProps) {
  const {
    children,
    variant = "primary",
    size = "md",
    arrow = true,
    icon: Icon,
    loading = false,
    full = false,
    className = "",
  } = props;
  const v = VARIANTS[variant];
  const cls = `btn-motion inline-flex items-center justify-center rounded-full font-semibold
    transition-[transform,color,border-color] duration-300 active:scale-[0.97]
    disabled:opacity-50 disabled:pointer-events-none ${v.base} ${SIZES[size]} ${full ? "w-full" : ""} ${className}`;

  const inner: ReactNode = (
    <>
      <span className={`btn-fill ${v.fill}`} aria-hidden />
      {loading ? (
        <Loader2 size={16} className="animate-spin" />
      ) : (
        Icon && <Icon size={size === "sm" ? 14 : 16} strokeWidth={2.2} />
      )}
      <RollText text={children} />
      {arrow && !loading && <SlideArrow size={size === "sm" ? 14 : 16} />}
    </>
  );

  if ("href" in props && props.href) {
    const { href, external } = props;
    if (external) {
      return (
        <a href={href} target="_blank" rel="noopener noreferrer" className={cls} onMouseEnter={placeFill} aria-label={children}>
          {inner}
        </a>
      );
    }
    return (
      <Link href={href} className={cls} onMouseEnter={placeFill} aria-label={children}>
        {inner}
      </Link>
    );
  }

  const {
    children: _c, variant: _v, size: _s, arrow: _a, icon: _i, loading: _l, full: _f, className: _cn, href: _h,
    ...rest
  } = props as ButtonProps;
  return (
    <button aria-label={children} {...rest} disabled={rest.disabled || loading} className={cls} onMouseEnter={placeFill}>
      {inner}
    </button>
  );
}
