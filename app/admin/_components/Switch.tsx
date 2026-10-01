"use client";

import { motion } from "framer-motion";

export default function Switch({ checked, onChange, label, disabled }: { checked: boolean; onChange: () => void; label: string; disabled?: boolean }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      title={label}
      disabled={disabled}
      onClick={onChange}
      className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full p-0.5 transition-colors duration-300 disabled:opacity-50 ${checked ? "bg-orange" : "bg-ink/15"}`}
    >
      <motion.span layout transition={{ type: "spring", stiffness: 600, damping: 34 }} className={`h-5 w-5 rounded-full bg-white shadow ${checked ? "ml-auto" : ""}`} />
    </button>
  );
}
