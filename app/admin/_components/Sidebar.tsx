"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { motion } from "framer-motion";
import {
  LayoutDashboard,
  BookOpen,
  CalendarDays,
  ClipboardCheck,
  Users,
  Award,
  Star,
  Coins,
  UserCog,
  ExternalLink,
  LogOut,
  ChevronsLeft,
  ChevronRight,
  Plus,
  type LucideIcon,
} from "lucide-react";
import { useAdmin } from "../_lib/AdminContext";
import { SlideArrow } from "@/components/ui/ArrowButton";

export interface NavItem {
  href: string;
  label: string;
  icon: LucideIcon;
  badge?: (s: NonNullable<ReturnType<typeof useAdmin>["stats"]>) => number;
}

export const NAV: { group: string; items: NavItem[] }[] = [
  { group: "Pilotage", items: [{ href: "/admin", label: "Vue d'ensemble", icon: LayoutDashboard }] },
  {
    group: "Catalogue",
    items: [
      { href: "/admin/formations", label: "Formations", icon: BookOpen },
      { href: "/admin/sessions", label: "Sessions", icon: CalendarDays },
    ],
  },
  {
    group: "Apprenants",
    items: [
      { href: "/admin/inscriptions", label: "Inscriptions", icon: ClipboardCheck, badge: (s) => s.totals.pendingEnrollments },
      { href: "/admin/apprenants", label: "Apprenants", icon: Users },
      { href: "/admin/certificats", label: "Certificats", icon: Award },
      { href: "/admin/avis", label: "Avis", icon: Star },
    ],
  },
  {
    group: "Réglages",
    items: [
      { href: "/admin/taux", label: "Taux de change", icon: Coins },
      { href: "/admin/compte", label: "Mon compte", icon: UserCog },
    ],
  },
];

export function isActive(pathname: string, href: string) {
  return href === "/admin" ? pathname === "/admin" : pathname.startsWith(href);
}

export default function Sidebar({
  collapsed,
  onToggle,
  onNavigate,
  onLogout,
  mobile = false,
}: {
  collapsed: boolean;
  onToggle?: () => void;
  onNavigate?: () => void;
  onLogout: () => void;
  mobile?: boolean;
}) {
  const pathname = usePathname();
  const { stats, adminName } = useAdmin();
  const mini = collapsed && !mobile;

  return (
    <div className="flex h-full flex-col bg-ink text-white">
      {/* Marque */}
      <div className={`flex h-20 items-center border-b border-white/10 ${mini ? "justify-center px-2" : "justify-between px-5"}`}>
        <Link href="/admin" className="flex items-center gap-3" onClick={onNavigate}>
          {mini ? (
            <span className="h-display inline-flex h-10 w-10 items-center justify-center rounded-xl bg-orange text-xl">M</span>
          ) : (
            <>
              <Image src="/logo-mades-white.png" alt="MADES" width={110} height={19} className="h-5 w-auto" />
              <span className="border-l border-white/15 pl-3 font-mono text-[9px] uppercase leading-tight tracking-[0.18em] text-white/50">
                Back
                <br />
                office
              </span>
            </>
          )}
        </Link>
        {!mobile && !mini && onToggle && (
          <button onClick={onToggle} className="rounded-lg p-1.5 text-white/40 transition-colors hover:bg-white/10 hover:text-white" aria-label="Réduire la barre latérale" title="Réduire">
            <ChevronsLeft size={18} />
          </button>
        )}
      </div>

      {/* Action principale toujours visible */}
      <div className={`px-3 pt-4 ${mini ? "flex justify-center" : ""}`}>
        <Link
          href="/admin/formations?new=1"
          onClick={onNavigate}
          title="Nouvelle formation"
          className={`btn-motion group flex items-center gap-2 rounded-xl bg-orange text-sm font-semibold text-white shadow-glow transition-transform active:scale-[0.97] ${
            mini ? "h-11 w-11 justify-center" : "px-3 py-2.5"
          }`}
        >
          <span className="btn-fill bg-white/20" aria-hidden />
          <span className="inline-flex h-7 w-7 items-center justify-center rounded-lg bg-white/20 transition-transform duration-500 group-hover:rotate-90">
            <Plus size={16} strokeWidth={2.5} />
          </span>
          {!mini && (
            <>
              <span className="flex-1">Nouvelle formation</span>
              <SlideArrow size={15} />
            </>
          )}
        </Link>
      </div>

      {/* Navigation verticale */}
      <nav className="flex-1 overflow-y-auto px-3 py-4 scrollbar-thin" aria-label="Back-office">
        {NAV.map((g) => (
          <div key={g.group} className="mb-3">
            {!mini && <p className="mb-2 px-3 font-mono text-[10px] uppercase tracking-[0.18em] text-white/35">{g.group}</p>}
            {mini && <div className="mx-auto mb-2 h-px w-6 bg-white/10" />}
            <ul className="space-y-1">
              {g.items.map((it) => {
                const active = isActive(pathname, it.href);
                const badge = stats && it.badge ? it.badge(stats) : 0;
                return (
                  <li key={it.href}>
                    <Link
                      href={it.href}
                      onClick={onNavigate}
                      title={mini ? it.label : undefined}
                      aria-current={active ? "page" : undefined}
                      className={`group relative flex items-center gap-3 rounded-xl py-2 text-sm font-medium transition-colors ${
                        mini ? "justify-center px-0" : "px-3"
                      } ${active ? "text-white" : "text-white/60 hover:bg-white/[0.06] hover:text-white"}`}
                    >
                      {active && (
                        <motion.span
                          layoutId={mobile ? "side-active-m" : "side-active"}
                          className="absolute inset-0 rounded-xl bg-orange shadow-glow"
                          transition={{ type: "spring", stiffness: 420, damping: 34 }}
                        />
                      )}
                      <span
                        className={`relative inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg transition-all duration-300 ${
                          active ? "bg-white/20" : "bg-white/[0.06] group-hover:scale-110 group-hover:bg-white/10"
                        }`}
                      >
                        <it.icon size={17} strokeWidth={2} />
                      </span>
                      {!mini && <span className="relative flex-1">{it.label}</span>}
                      {!mini && !active && badge === 0 && (
                        <ChevronRight size={15} className="relative -translate-x-2 opacity-0 transition-all duration-300 group-hover:translate-x-0 group-hover:opacity-60" />
                      )}
                      {badge > 0 && (
                        <span
                          className={`relative min-w-[1.25rem] rounded-full px-1.5 text-center font-mono text-[10px] leading-5 ${
                            active ? "bg-white text-orange" : "bg-orange text-white"
                          } ${mini ? "absolute -right-0.5 -top-0.5" : ""}`}
                        >
                          {badge}
                        </span>
                      )}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </nav>

      {/* Pied : profil + raccourcis */}
      <div className="border-t border-white/10 p-3">
        {!mini && adminName && (
          <div className="mb-2 flex items-center gap-3 rounded-xl bg-white/[0.05] p-2.5">
            <span className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-orange text-sm font-semibold">{adminName.charAt(0).toUpperCase()}</span>
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold">{adminName}</p>
              <p className="font-mono text-[10px] uppercase tracking-wider text-white/40">Administrateur</p>
            </div>
          </div>
        )}
        <div className={`flex ${mini ? "flex-col items-center" : ""} gap-1`}>
          <a
            href="/"
            target="_blank"
            className={`flex items-center gap-2 rounded-xl py-2 text-xs font-semibold text-white/60 transition-colors hover:bg-white/[0.06] hover:text-white ${mini ? "justify-center px-2" : "flex-1 px-3"}`}
            title="Voir le site"
          >
            <ExternalLink size={15} /> {!mini && "Voir le site"}
          </a>
          <button
            onClick={onLogout}
            className={`flex items-center gap-2 rounded-xl py-2 text-xs font-semibold text-white/60 transition-colors hover:bg-danger hover:text-white ${mini ? "justify-center px-2" : "px-3"}`}
            title="Déconnexion"
          >
            <LogOut size={15} /> {!mini && "Déconnexion"}
          </button>
        </div>
        {mini && onToggle && (
          <button onClick={onToggle} className="mx-auto mt-2 flex rounded-lg p-1.5 text-white/40 hover:bg-white/10 hover:text-white" aria-label="Déplier la barre latérale" title="Déplier">
            <ChevronsLeft size={18} className="rotate-180" />
          </button>
        )}
      </div>
    </div>
  );
}
