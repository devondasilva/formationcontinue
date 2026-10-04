"use client";

import { useEffect, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, motion } from "framer-motion";
import { X, Search, AlertTriangle, type LucideIcon } from "lucide-react";
import ArrowButton from "@/components/ui/ArrowButton";

/** En-tête de page du back-office : icône, titre, sous-titre, actions. */
export function AdminHeader({
  icon: Icon,
  title,
  subtitle,
  actions,
}: {
  icon: LucideIcon;
  title: string;
  subtitle?: string;
  actions?: ReactNode;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
      className="mb-8 flex flex-wrap items-end justify-between gap-4"
    >
      <div className="flex items-center gap-4">
        <span className="inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-orange text-white shadow-glow">
          <Icon size={26} strokeWidth={1.9} />
        </span>
        <div>
          <h1 className="h-display text-4xl md:text-5xl">{title}</h1>
          {subtitle && <p className="mt-1 text-sm text-mutedfg">{subtitle}</p>}
        </div>
      </div>
      {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
    </motion.div>
  );
}

/** Panneau latéral pour créer / modifier un objet sans quitter la liste. */
export function Drawer({
  open,
  onClose,
  title,
  icon: Icon,
  children,
  footer,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  icon?: LucideIcon;
  children: ReactNode;
  footer?: ReactNode;
}) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [open, onClose]);

  if (!mounted) return null;
  return createPortal(
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-[70]" role="dialog" aria-modal="true" aria-label={title}>
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-ink/50 backdrop-blur-sm" onClick={onClose} />
          <motion.aside
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", stiffness: 320, damping: 36 }}
            className="absolute bottom-0 right-0 top-0 flex w-full max-w-xl flex-col bg-bg shadow-2xl"
          >
            <div className="flex items-center justify-between gap-4 border-b border-line bg-white px-6 py-5">
              <div className="flex items-center gap-3">
                {Icon && (
                  <span className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-orangeL text-orange">
                    <Icon size={20} />
                  </span>
                )}
                <p className="h-display text-3xl">{title}</p>
              </div>
              <button onClick={onClose} className="inline-flex h-10 w-10 items-center justify-center rounded-full transition-colors hover:bg-muted" aria-label="Fermer">
                <X size={20} />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto px-6 py-6">{children}</div>
            {footer && <div className="border-t border-line bg-white px-6 py-4">{footer}</div>}
          </motion.aside>
        </div>
      )}
    </AnimatePresence>,
    document.body
  );
}

/** Confirmation explicite pour les actions destructrices. */
export function ConfirmDialog({
  open,
  title,
  text,
  confirmLabel = "Supprimer",
  onConfirm,
  onClose,
}: {
  open: boolean;
  title: string;
  text: string;
  confirmLabel?: string;
  onConfirm: () => Promise<unknown> | void;
  onClose: () => void;
}) {
  const [busy, setBusy] = useState(false);
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  if (!mounted) return null;
  return createPortal(
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-[75] flex items-center justify-center p-5" role="alertdialog" aria-modal="true">
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-ink/50 backdrop-blur-sm" onClick={onClose} />
          <motion.div
            initial={{ opacity: 0, scale: 0.92, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ type: "spring", stiffness: 380, damping: 30 }}
            className="relative w-full max-w-md rounded-card bg-white p-7 shadow-2xl"
          >
            <span className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-danger/10 text-danger">
              <AlertTriangle size={24} />
            </span>
            <p className="h-display mt-4 text-3xl">{title}</p>
            <p className="mt-2 text-sm text-mutedfg">{text}</p>
            <div className="mt-6 flex justify-end gap-2">
              <button onClick={onClose} className="rounded-full px-5 py-3 text-sm font-semibold text-mutedfg hover:text-ink">
                Annuler
              </button>
              <ArrowButton
                variant="danger"
                loading={busy}
                onClick={async () => {
                  setBusy(true);
                  await onConfirm();
                  setBusy(false);
                  onClose();
                }}
              >
                {confirmLabel}
              </ArrowButton>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>,
    document.body
  );
}

export function SearchBox({ value, onChange, placeholder = "Rechercher…" }: { value: string; onChange: (v: string) => void; placeholder?: string }) {
  return (
    <label className="relative block w-full sm:w-72">
      <Search size={16} className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-mutedfg" />
      <input value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} className="field rounded-full py-2.5 pl-11" />
    </label>
  );
}

/** Filtres en pastilles avec compteur. */
export function FilterPills<T extends string>({
  options,
  value,
  onChange,
}: {
  options: { id: T; label: string; count?: number; icon?: LucideIcon }[];
  value: T;
  onChange: (v: T) => void;
}) {
  return (
    <div className="flex flex-wrap gap-1.5 rounded-full bg-muted p-1">
      {options.map((o) => {
        const on = o.id === value;
        return (
          <button
            key={o.id}
            onClick={() => onChange(o.id)}
            aria-pressed={on}
            className={`relative inline-flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-xs font-semibold transition-colors ${on ? "text-white" : "text-mutedfg hover:text-ink"}`}
          >
            {on && <motion.span layoutId={`fp-${options.map((x) => x.id).join("")}`} className="absolute inset-0 rounded-full bg-ink" transition={{ type: "spring", stiffness: 450, damping: 34 }} />}
            {o.icon && <o.icon size={13} className="relative" />}
            <span className="relative">{o.label}</span>
            {o.count !== undefined && (
              <span className={`relative rounded-full px-1.5 font-mono text-[10px] ${on ? "bg-orange text-white" : "bg-white text-mutedfg"}`}>{o.count}</span>
            )}
          </button>
        );
      })}
    </div>
  );
}

/** Bouton d'action compact à icône (avec infobulle native). */
export function IconAction({
  icon: Icon,
  label,
  onClick,
  tone = "default",
  disabled,
  href,
  newTab = false,
}: {
  icon: LucideIcon;
  label: string;
  onClick?: () => void;
  tone?: "default" | "danger" | "success" | "orange";
  disabled?: boolean;
  href?: string;
  newTab?: boolean;
}) {
  const tones = {
    default: "text-mutedfg hover:bg-ink hover:text-white",
    danger: "text-mutedfg hover:bg-danger hover:text-white",
    success: "text-success hover:bg-success hover:text-white",
    orange: "text-orange hover:bg-orange hover:text-white",
  };
  const cls = `inline-flex h-9 w-9 items-center justify-center rounded-xl border border-line bg-white transition-all duration-200 hover:-translate-y-0.5 hover:border-transparent disabled:pointer-events-none disabled:opacity-40 ${tones[tone]}`;
  if (href)
    return (
      <a href={href} className={cls} title={label} aria-label={label} {...(newTab ? { target: "_blank", rel: "noopener noreferrer" } : {})}>
        <Icon size={16} />
      </a>
    );
  return (
    <button type="button" onClick={onClick} disabled={disabled} className={cls} title={label} aria-label={label}>
      <Icon size={16} />
    </button>
  );
}

export function Panel({ title, icon: Icon, action, children, className = "" }: { title?: string; icon?: LucideIcon; action?: ReactNode; children: ReactNode; className?: string }) {
  return (
    <section className={`card min-w-0 p-5 sm:p-6 ${className}`}>
      {title && (
        <div className="mb-4 flex items-center justify-between gap-3">
          <p className="flex items-center gap-2 text-sm font-semibold">
            {Icon && <Icon size={17} className="text-orange" />} {title}
          </p>
          {action}
        </div>
      )}
      {children}
    </section>
  );
}

export function Avatar({ name, size = 36 }: { name: string; size?: number }) {
  const initials = name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase())
    .join("");
  return (
    <span className="inline-flex shrink-0 items-center justify-center rounded-full bg-ink font-semibold text-white" style={{ width: size, height: size, fontSize: size * 0.36 }}>
      {initials || "?"}
    </span>
  );
}
