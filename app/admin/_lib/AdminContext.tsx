"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { CheckCircle2, AlertTriangle } from "lucide-react";
import type { Stats } from "./types";

type ToastKind = "success" | "error";
interface Toast {
  id: number;
  kind: ToastKind;
  text: string;
}

interface AdminCtx {
  stats: Stats | null;
  adminName: string | null;
  unauthorized: boolean;
  refresh: () => Promise<void>;
  notify: (text: string, kind?: ToastKind) => void;
  /** Appel API + rafraîchissement + toast, en une ligne dans les pages. */
  mutate: (url: string, init: RequestInit & { json?: unknown }, success?: string) => Promise<boolean>;
}

const Ctx = createContext<AdminCtx | null>(null);

export function useAdmin() {
  const c = useContext(Ctx);
  if (!c) throw new Error("useAdmin doit être utilisé sous <AdminProvider>");
  return c;
}

export function AdminProvider({ children }: { children: ReactNode }) {
  const [stats, setStats] = useState<Stats | null>(null);
  const [adminName, setAdminName] = useState<string | null>(null);
  const [unauthorized, setUnauthorized] = useState(false);
  const [toasts, setToasts] = useState<Toast[]>([]);
  const seq = useRef(0);

  const refresh = useCallback(async () => {
    const r = await fetch("/api/stats", { cache: "no-store" });
    if (r.status === 401) {
      setUnauthorized(true);
      return;
    }
    setStats(await r.json());
  }, []);

  useEffect(() => {
    fetch("/api/auth/me")
      .then((r) => r.json())
      .then((d) => d.session?.role === "admin" && setAdminName(d.session.name));
    refresh();
  }, [refresh]);

  const notify = useCallback((text: string, kind: ToastKind = "success") => {
    const id = ++seq.current;
    setToasts((t) => [...t, { id, kind, text }]);
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 3600);
  }, []);

  const mutate = useCallback<AdminCtx["mutate"]>(
    async (url, init, success) => {
      const { json, ...rest } = init;
      try {
        const res = await fetch(url, {
          ...rest,
          headers: json !== undefined ? { "Content-Type": "application/json" } : rest.headers,
          body: json !== undefined ? JSON.stringify(json) : rest.body,
        });
        const data = await res.json().catch(() => ({}));
        if (!res.ok) {
          notify(data.error ?? "Une erreur est survenue.", "error");
          return false;
        }
        await refresh();
        if (success) notify(success);
        return true;
      } catch {
        notify("Impossible de contacter le serveur.", "error");
        return false;
      }
    },
    [notify, refresh]
  );

  const value = useMemo(() => ({ stats, adminName, unauthorized, refresh, notify, mutate }), [stats, adminName, unauthorized, refresh, notify, mutate]);

  return (
    <Ctx.Provider value={value}>
      {children}
      <div className="pointer-events-none fixed bottom-5 right-5 z-[80] flex flex-col items-end gap-2" aria-live="polite">
        <AnimatePresence>
          {toasts.map((t) => (
            <motion.div
              key={t.id}
              layout
              initial={{ opacity: 0, y: 20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, x: 40 }}
              className={`pointer-events-auto flex items-center gap-2.5 rounded-2xl px-4 py-3 text-sm font-semibold shadow-lift ${
                t.kind === "success" ? "bg-ink text-white" : "bg-danger text-white"
              }`}
            >
              {t.kind === "success" ? <CheckCircle2 size={18} className="text-orange" /> : <AlertTriangle size={18} />}
              {t.text}
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </Ctx.Provider>
  );
}
