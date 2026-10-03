import Link from "next/link";
import Image from "next/image";
import { ArrowUpRight } from "lucide-react";
import { DISCIPLINES, DISCIPLINE_LABEL } from "@/lib/labels";
import { DisciplineIcon } from "./icons/DisciplineIcon";
import Marquee from "./Marquee";
import RotatingBadge from "./RotatingBadge";
import ArrowButton from "./ui/ArrowButton";

const COLS = [
  {
    title: "Se former",
    links: [
      { label: "Catalogue des formations", href: "/formations" },
      { label: "Parcours de certification", href: "/parcours" },
      { label: "Calendrier des sessions", href: "/sessions" },
    ],
  },
  {
    title: "Mon compte",
    links: [
      { label: "Se connecter", href: "/login" },
      { label: "Mon espace apprenant", href: "/dashboard" },
      { label: "Back-office", href: "/login?next=/admin" },
    ],
  },
];

export default function Footer() {
  return (
    <footer className="relative overflow-hidden bg-ink text-white">
      {/* Bandeau défilant */}
      <div className="border-b border-white/10 py-6">
        <Marquee items={["Former", "Certifier", "Transmettre", "Progresser"]} className="h-display text-6xl text-white/90 md:text-8xl" outlineEvery />
      </div>

      <div className="court-lines relative">
        <div className="pointer-events-none absolute -left-40 top-10 h-96 w-96 rounded-full bg-orange/20 blur-3xl" />
        <div className="relative mx-auto grid max-w-content gap-12 px-5 py-16 sm:px-6 lg:grid-cols-12">
          <div className="lg:col-span-6">
            <p className="tag-label">Prêt à progresser ?</p>
            <p className="h-display mt-4 text-5xl md:text-7xl">
              Formons l&rsquo;avenir
              <br />
              <span className="text-orange">du sport africain.</span>
            </p>
            <div className="mt-8 flex flex-wrap items-center gap-6">
              <ArrowButton href="/formations" size="lg">
                Trouver ma formation
              </ArrowButton>
              <RotatingBadge href="/parcours" text="Parcours · Certification · MADES · " />
            </div>
          </div>

          <div className="grid gap-10 sm:grid-cols-3 lg:col-span-6">
            {COLS.map((c) => (
              <div key={c.title}>
                <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-white/40">{c.title}</p>
                <ul className="mt-4 space-y-3">
                  {c.links.map((l) => (
                    <li key={l.href}>
                      <Link href={l.href} className="group inline-flex items-center gap-1.5 text-sm text-white/75 transition-colors hover:text-white">
                        <span className="link-underline">{l.label}</span>
                        <ArrowUpRight size={14} className="-translate-x-1 opacity-0 transition-all duration-300 group-hover:translate-x-0 group-hover:opacity-100" />
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
            <div>
              <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-white/40">Modules</p>
              <ul className="mt-4 space-y-3">
                {DISCIPLINES.map((d) => (
                  <li key={d}>
                    <Link href={`/formations?module=${d}`} className="group inline-flex items-center gap-2 text-sm text-white/75 transition-colors hover:text-white">
                      <span className="inline-flex h-7 w-7 items-center justify-center rounded-lg bg-white/[0.07] transition-colors group-hover:bg-orange">
                        <DisciplineIcon discipline={d} size={15} />
                      </span>
                      <span className="link-underline">{DISCIPLINE_LABEL[d]}</span>
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>

        <div className="relative mx-auto max-w-content px-5 sm:px-6">
          <div className="flex flex-col gap-6 border-t border-white/10 py-8 md:flex-row md:items-center md:justify-between">
            <Link href="/" className="flex items-center gap-3">
              <Image src="/logo-mades-white.png" alt="MADES" width={110} height={19} className="h-5 w-auto" />
              <span className="border-l border-white/15 pl-3 font-mono text-[9px] uppercase leading-tight tracking-[0.18em] text-white/50">
                Formation
                <br />
                continue
              </span>
            </Link>
            <p className="max-w-xl text-[12px] leading-relaxed text-white/45">
              <strong className="text-white/70">Formation Continue</strong> est une branche d&rsquo;activité du Mouvement Africain de Développement de
              l&rsquo;Emploi et du Sport (MADES). Site institutionnel :{" "}
              <a href="https://www.mades.world" target="_blank" rel="noopener noreferrer" className="font-semibold text-orange hover:underline">
                mades.world ↗
              </a>
            </p>
          </div>
          <p className="border-t border-white/10 py-6 text-center font-mono text-[10px] uppercase tracking-[0.25em] text-white/30">
            © {new Date().getFullYear()} MADES — JES 1 · JES 2 · Entraîneur · Diplôme d&rsquo;État
          </p>
        </div>
      </div>
    </footer>
  );
}
