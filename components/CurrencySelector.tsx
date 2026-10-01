"use client";

import { motion } from "framer-motion";
import type { Currency } from "@/lib/types";

const OPTIONS: { value: Currency; label: string }[] = [
  { value: "FCFA", label: "FCFA" },
  { value: "EUR", label: "EUR €" },
  { value: "USD", label: "USD $" },
];

/** Sélecteur de devise en pastilles ; `id` rend l'animation unique par instance. */
export default function CurrencySelector({
  value,
  onChange,
  dark = false,
  id = "currency",
}: {
  value: Currency;
  onChange: (c: Currency) => void;
  dark?: boolean;
  id?: string;
}) {
  return (
    <div className={`inline-flex rounded-full p-1 font-mono text-[11px] uppercase ${dark ? "bg-white/10" : "bg-muted"}`} role="radiogroup" aria-label="Devise">
      {OPTIONS.map((o) => {
        const on = value === o.value;
        return (
          <button
            key={o.value}
            type="button"
            role="radio"
            aria-checked={on}
            onClick={() => onChange(o.value)}
            className={`relative rounded-full px-3 py-1.5 transition-colors ${on ? "text-white" : dark ? "text-white/60 hover:text-white" : "text-mutedfg hover:text-ink"}`}
          >
            {on && <motion.span layoutId={`cur-${id}`} className="absolute inset-0 rounded-full bg-orange" transition={{ type: "spring", stiffness: 450, damping: 34 }} />}
            <span className="relative">{o.label}</span>
          </button>
        );
      })}
    </div>
  );
}
