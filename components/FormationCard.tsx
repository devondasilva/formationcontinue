import Link from "next/link";
import { Clock, MapPin, ArrowRight } from "lucide-react";
import type { Formation } from "@/lib/types";
import { DISCIPLINE_LABEL, FORMAT_LABEL, LEVEL_LABEL, LEVELS } from "@/lib/labels";
import { formatAmount } from "@/lib/currency";
import { DisciplineIcon, LevelIcon } from "./icons/DisciplineIcon";

/** Carte de formation du catalogue : icône de discipline, niveau en jauge, prix et flèche. */
export default function FormationCard({ f }: { f: Formation }) {
  const step = LEVELS.indexOf(f.level) + 1;
  return (
    <Link
      href={`/formations/${f.id}`}
      className="group relative flex h-full flex-col overflow-hidden rounded-card border border-line bg-white p-6 transition-all duration-500 hover:-translate-y-1.5 hover:border-orange hover:shadow-lift"
    >
      {/* Disque orange qui grandit depuis le coin au survol */}
      <span className="pointer-events-none absolute -right-16 -top-16 h-40 w-40 rounded-full bg-orange/0 transition-all duration-700 ease-out group-hover:scale-[1.6] group-hover:bg-orangeL" />

      <div className="relative flex items-start justify-between gap-4">
        <span className="inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-ink text-white transition-all duration-500 group-hover:rotate-[-8deg] group-hover:bg-orange">
          <DisciplineIcon discipline={f.discipline} size={28} />
        </span>
        <div className="text-right">
          <p className="font-mono text-[11px] uppercase tracking-[0.14em] text-mutedfg">{DISCIPLINE_LABEL[f.discipline]}</p>
          <p className="mt-1 inline-flex items-center gap-1.5 text-xs font-semibold text-orange">
            <LevelIcon level={f.level} size={14} /> {LEVEL_LABEL[f.level]}
          </p>
        </div>
      </div>

      <h3 className="h-display relative mt-6 text-[1.9rem] text-ink">{f.title}</h3>
      <p className="relative mt-2 line-clamp-2 text-sm leading-relaxed text-mutedfg">{f.description}</p>

      {/* Jauge de niveau 1→4 */}
      <div className="relative mt-5 flex items-center gap-1.5" aria-label={`Niveau ${step} sur 4`}>
        {LEVELS.map((l, i) => (
          <span key={l} className={`h-1.5 flex-1 rounded-full ${i < step ? "bg-orange" : "bg-muted"}`} />
        ))}
        <span className="ml-2 font-mono text-[11px] text-mutedfg">{step}/4</span>
      </div>

      <div className="relative mt-auto flex items-end justify-between gap-3 pt-6">
        <div className="space-y-1 text-xs text-mutedfg">
          <p className="inline-flex items-center gap-1.5">
            <Clock size={13} /> {f.durationHours} h
          </p>
          <p className="flex items-center gap-1.5">
            <MapPin size={13} /> {FORMAT_LABEL[f.format]}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <p className="font-mono text-sm font-medium text-ink">{formatAmount(f.priceFCFA, "FCFA")}</p>
          <span className="arrow-chip">
            <ArrowRight size={16} />
          </span>
        </div>
      </div>
    </Link>
  );
}
