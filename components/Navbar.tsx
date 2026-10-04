"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { AnimatePresence, motion, useScroll, useSpring } from "framer-motion";
import { BookOpen, Route, CalendarDays, LogOut, ArrowUpRight, LayoutDashboard, UserRound } from "lucide-react";
import ArrowButton from "./ui/ArrowButton";

const LINKS = [
  { href: "/formations", label: "Formations", icon: BookOpen },
  { href: "/parcours", label: "Parcours", icon: Route },
  { href: "/sessions", label: "Calendrier", icon: CalendarDays },
];

interface Session {
  role: "admin" | "learner";
  id: string;
  name: string;
}

export default function Navbar() {
  const pathname = usePathname();
  const [session, setSession] = useState<Session | null>(null);
  const [loaded, setLoaded] = useState(false);
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [hidden, setHidden] = useState(false);
  const [hover, setHover] = useState<string | null>(null);

  const { scrollYProgress } = useScroll();
  const progress = useSpring(scrollYProgress, { stiffness: 140, damping: 30, mass: 0.3 });

  useEffect(() => {
    fetch("/api/auth/me")
      .then((r) => r.json())
      .then((d) => setSession(d.session))
      .catch(() => {})
      .finally(() => setLoaded(true));
  }, [pathname]);

  // Barre compacte après défilement ; se cache en descendant, réapparaît en remontant.
  useEffect(() => {
    let last = window.scrollY;
    const onScroll = () => {
      const y = window.scrollY;
      setScrolled(y > 24);
      setHidden(y > 320 && y > last + 4);
      if (y < last - 4) setHidden(false);
      last = y;
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => setOpen(false), [pathname]);
  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  async function logout() {
    await fetch("/api/auth/logout", { method: "POST" });
    setSession(null);
    window.location.href = "/";
  }

  const accountHref = session?.role === "admin" ? "/admin" : session?.role === "learner" ? "/dashboard" : "/login";
  const accountLabel = session?.role === "admin" ? "Back-office" : session?.role === "learner" ? "Mon espace" : "Se connecter";
  const isActive = (href: string) => pathname === href || pathname.startsWith(`${href}/`);

  return (
    <>
      <header
        className={`fixed inset-x-0 top-0 z-50 transition-transform duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] ${
          hidden && !open ? "-translate-y-full" : "translate-y-0"
        }`}
      >
        <div
          className={`transition-all duration-500 ${
            open
              ? "border-b border-white/10 bg-ink"
              : scrolled
                ? "border-b border-line bg-bg/85 backdrop-blur-xl"
                : "border-b border-transparent bg-transparent"
          }`}
        >
          <div className={`mx-auto flex max-w-content items-center justify-between px-5 transition-[height] duration-500 sm:px-6 ${scrolled ? "h-16" : "h-20"}`}>
            <Link href="/" className="group flex items-center gap-3" aria-label="Accueil MADES Formation Continue">
              <Image
                src={open ? "/logo-mades-white.png" : "/logo-mades.png"}
                alt="MADES"
                width={132}
                height={23}
                priority
                className="h-6 w-auto transition-transform duration-500 group-hover:scale-[1.03]"
              />
              <span className="hidden border-l border-line pl-3 font-mono text-[9.5px] uppercase leading-[1.25] tracking-[0.18em] text-mutedfg sm:block">
                Formation
                <br />
                continue
              </span>
            </Link>

            {/* Liens desktop : pastille qui suit le survol */}
            <nav className="hidden items-center lg:flex" onMouseLeave={() => setHover(null)} aria-label="Navigation principale">
              {LINKS.map((l) => {
                const active = isActive(l.href);
                return (
                  <Link
                    key={l.href}
                    href={l.href}
                    onMouseEnter={() => setHover(l.href)}
                    aria-current={active ? "page" : undefined}
                    className={`relative rounded-xl px-4 py-2 text-sm font-medium transition-colors ${active ? "text-ink" : "text-mutedfg hover:text-ink"}`}
                  >
                    {hover === l.href && (
                      <motion.span layoutId="nav-hover" className="absolute inset-0 rounded-xl bg-ink/[0.06]" transition={{ type: "spring", stiffness: 420, damping: 34 }} />
                    )}
                    <span className="relative">{l.label}</span>
                    {active && <motion.span layoutId="nav-dot" className="absolute -bottom-0.5 left-1/2 h-1 w-1 -translate-x-1/2 rounded-full bg-orange" />}
                  </Link>
                );
              })}
            </nav>

            <div className="flex items-center gap-2">
              {loaded && session && (
                <button
                  onClick={logout}
                  className="hidden h-10 w-10 items-center justify-center rounded-full border border-line text-mutedfg transition-colors hover:border-danger hover:text-danger lg:inline-flex"
                  aria-label="Déconnexion"
                  title="Déconnexion"
                >
                  <LogOut size={16} />
                </button>
              )}
              <div className="hidden lg:block">
                <ArrowButton href={accountHref} size="sm" icon={session ? (session.role === "admin" ? LayoutDashboard : UserRound) : undefined}>
                  {loaded ? accountLabel : "Se connecter"}
                </ArrowButton>
              </div>

              {/* Bouton menu (mobile) : deux traits qui se croisent */}
              <button
                onClick={() => setOpen((o) => !o)}
                className="relative inline-flex h-11 w-11 items-center justify-center rounded-full border border-line bg-white lg:hidden"
                aria-label={open ? "Fermer le menu" : "Ouvrir le menu"}
                aria-expanded={open}
              >
                <span className={`absolute h-0.5 w-5 rounded bg-ink transition-transform duration-300 ${open ? "rotate-45" : "-translate-y-1"}`} />
                <span className={`absolute h-0.5 w-5 rounded bg-ink transition-transform duration-300 ${open ? "-rotate-45" : "translate-y-1"}`} />
              </button>
            </div>
          </div>
        </div>
        <motion.div style={{ scaleX: progress }} className="h-0.5 origin-left bg-orange" aria-hidden />
      </header>
      {/* Réserve la hauteur de la barre fixe */}
      <div className="h-20" aria-hidden />

      {/* Menu plein écran (mobile) */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ clipPath: "circle(0% at calc(100% - 42px) 40px)" }}
            animate={{ clipPath: "circle(150% at calc(100% - 42px) 40px)" }}
            exit={{ clipPath: "circle(0% at calc(100% - 42px) 40px)" }}
            transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
            className="court-lines fixed inset-0 z-40 flex flex-col bg-ink px-6 pb-10 pt-28 text-white lg:hidden"
          >
            <nav className="flex flex-col" aria-label="Menu mobile">
              {[{ href: "/", label: "Accueil", icon: ArrowUpRight }, ...LINKS].map((l, i) => (
                <motion.div key={l.href} initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 + i * 0.06, ease: [0.22, 1, 0.36, 1] }}>
                  <Link href={l.href} className="group flex items-center justify-between border-b border-white/10 py-3">
                    <span className="flex items-center gap-4">
                      <span className="font-mono text-xs text-orange">0{i + 1}</span>
                      <span className={`h-display text-4xl ${isActive(l.href) && l.href !== "/" ? "text-orange" : ""}`}>{l.label}</span>
                    </span>
                    <span className="inline-flex h-11 w-11 items-center justify-center rounded-full bg-white/10 transition-all duration-300 group-hover:-rotate-45 group-hover:bg-orange">
                      <ArrowUpRight size={20} className="rotate-45" />
                    </span>
                  </Link>
                </motion.div>
              ))}
            </nav>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.45 }} className="mt-auto space-y-3">
              <ArrowButton href={accountHref} full size="lg">
                {accountLabel}
              </ArrowButton>
              {session && (
                <button onClick={logout} className="flex w-full items-center justify-center gap-2 py-3 text-sm font-semibold text-white/60">
                  <LogOut size={16} /> Déconnexion
                </button>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
