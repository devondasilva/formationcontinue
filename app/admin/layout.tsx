"use client";

import { useEffect, useState, type ReactNode } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { Menu, X, Lock, ChevronRight } from "lucide-react";
import { AdminProvider, useAdmin } from "./_lib/AdminContext";
import Sidebar, { NAV, isActive } from "./_components/Sidebar";
import ArrowButton from "@/components/ui/ArrowButton";

export default function AdminLayout({ children }: { children: ReactNode }) {
  return (
    <AdminProvider>
      <Shell>{children}</Shell>
    </AdminProvider>
  );
}

function Shell({ children }: { children: ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const { unauthorized } = useAdmin();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  // Mémorise l'état replié de la barre latérale (confort, non critique).
  useEffect(() => {
    try {
      setCollapsed(localStorage.getItem("mfc-sidebar") === "1");
    } catch {}
  }, []);
  function toggle() {
    setCollapsed((c) => {
      try {
        localStorage.setItem("mfc-sidebar", c ? "0" : "1");
      } catch {}
      return !c;
    });
  }
  useEffect(() => setMobileOpen(false), [pathname]);

  async function logout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
    router.refresh();
  }

  const current = NAV.flatMap((g) => g.items).find((i) => isActive(pathname, i.href));

  if (unauthorized) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-bg p-6">
        <div className="card max-w-sm p-8 text-center">
          <span className="mx-auto inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-orangeL text-orange">
            <Lock size={26} />
          </span>
          <p className="h-display mt-4 text-3xl">Session expirée</p>
          <p className="mt-2 text-sm text-mutedfg">Reconnectez-vous pour continuer.</p>
          <div className="mt-6">
            <ArrowButton href="/login?next=/admin">Me reconnecter</ArrowButton>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-bg">
      {/* Barre latérale fixe (desktop) */}
      <motion.aside
        initial={false}
        animate={{ width: collapsed ? 84 : 268 }}
        transition={{ type: "spring", stiffness: 300, damping: 34 }}
        className="fixed inset-y-0 left-0 z-40 hidden overflow-hidden lg:block"
      >
        <Sidebar collapsed={collapsed} onToggle={toggle} onLogout={logout} />
      </motion.aside>

      {/* Tiroir (mobile / tablette) */}
      <AnimatePresence>
        {mobileOpen && (
          <div className="fixed inset-0 z-50 lg:hidden">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-ink/60 backdrop-blur-sm" onClick={() => setMobileOpen(false)} />
            <motion.aside
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{ type: "spring", stiffness: 320, damping: 34 }}
              className="absolute inset-y-0 left-0 w-[280px]"
            >
              <Sidebar collapsed={false} mobile onNavigate={() => setMobileOpen(false)} onLogout={logout} />
              <button
                onClick={() => setMobileOpen(false)}
                className="absolute -right-12 top-4 inline-flex h-10 w-10 items-center justify-center rounded-full bg-white text-ink"
                aria-label="Fermer le menu"
              >
                <X size={18} />
              </button>
            </motion.aside>
          </div>
        )}
      </AnimatePresence>

      {/* Contenu */}
      <div className={`transition-[padding] duration-300 ${collapsed ? "lg:pl-[84px]" : "lg:pl-[268px]"}`}>
        <header className="sticky top-0 z-30 flex h-16 items-center justify-between gap-4 border-b border-line bg-bg/85 px-5 backdrop-blur-xl sm:px-8">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setMobileOpen(true)}
              className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-ink text-white lg:hidden"
              aria-label="Ouvrir le menu"
            >
              <Menu size={18} />
            </button>
            <nav className="flex items-center gap-1.5 text-sm text-mutedfg" aria-label="Fil d'Ariane">
              <Link href="/admin" className="hover:text-ink">
                Back-office
              </Link>
              {current && current.href !== "/admin" && (
                <>
                  <ChevronRight size={14} />
                  <span className="font-semibold text-ink">{current.label}</span>
                </>
              )}
            </nav>
          </div>
          <p suppressHydrationWarning className="hidden font-mono text-[11px] uppercase tracking-wider text-mutedfg sm:block">
            {new Date().toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long" })}
          </p>
        </header>

          <motion.main
            key={pathname}
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
            className="mx-auto max-w-[88rem] overflow-x-clip px-4 py-6 sm:px-8 sm:py-8"
          >
            {children}
          </motion.main>
      </div>
    </div>
  );
}
