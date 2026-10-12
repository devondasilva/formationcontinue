"use client";

import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import { Building2, MapPin, Handshake, Boxes, UserCheck, NotebookPen } from "lucide-react";
import type { ClubStatus, Discipline } from "@/lib/types";
import { DISCIPLINE_LABEL } from "@/lib/labels";
import { DisciplineIcon } from "@/components/icons/DisciplineIcon";
import { EmptyState } from "@/components/ui/primitives";

interface PublicClub {
  id: string;
  name: string;
  city: string;
  address: string;
  contactName: string;
  disciplines: Discipline[];
  status: ClubStatus;
  capacity: number;
  active: number;
}

const EASE = [0.22, 1, 0.36, 1] as const;

const STEPS = [
  { icon: Handshake, title: "Placement en club", text: "MADES affecte chaque apprenant à un club partenaire, avec des dates, un rythme et des objectifs." },
  { icon: UserCheck, title: "Un coach tuteur", text: "Un coach du club encadre l'apprenant sur le terrain et l'évalue en fin de période." },
  { icon: NotebookPen, title: "Carnet de bord", text: "Chaque séance est déclarée puis validée par le tuteur : les heures comptent dans le parcours." },
  { icon: Boxes, title: "Matériel suivi", text: "Le matériel confié aux clubs est inventorié par les coachs, photos à l'appui." },
];

export default function ClubsGrid({ clubs }: { clubs: PublicClub[] }) {
  const cities = useMemo(() => Array.from(new Set(clubs.map((c) => c.city))).sort(), [clubs]);
  const [city, setCity] = useState("");
  const list = clubs.filter((c) => !city || c.city === city);

  return (
    <div className="mx-auto max-w-content px-5 pb-24 sm:px-6">
      {/* Comment ça marche */}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {STEPS.map((s, i) => (
          <motion.div
            key={s.title}
            initial={{ opacity: 0, y: 18 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: i * 0.08, ease: EASE }}
            className="group card p-5 transition-all hover:-translate-y-1 hover:shadow-lift"
          >
            <span className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-orangeL text-orange transition-all duration-500 group-hover:rotate-[-8deg] group-hover:bg-orange group-hover:text-white">
              <s.icon size={22} />
            </span>
            <p className="mt-4 font-mono text-[10px] uppercase tracking-[0.16em] text-mutedfg">Étape {i + 1}</p>
            <p className="mt-1 font-semibold">{s.title}</p>
            <p className="mt-1 text-sm text-mutedfg">{s.text}</p>
          </motion.div>
        ))}
      </div>

      <div className="mt-16 flex flex-wrap items-end justify-between gap-4">
        <h2 className="h-display text-5xl">
          {clubs.length} club{clubs.length > 1 ? "s" : ""} <span className="text-orange">dans le réseau</span>
        </h2>
        {cities.length > 1 && (
          <div className="flex flex-wrap gap-1.5 rounded-full bg-muted p-1">
            {["", ...cities].map((c) => (
              <button
                key={c || "all"}
                onClick={() => setCity(c)}
                className={`rounded-full px-3.5 py-1.5 text-xs font-semibold transition-colors ${city === c ? "bg-ink text-white" : "text-mutedfg hover:text-ink"}`}
              >
                {c || "Toutes les villes"}
              </button>
            ))}
          </div>
        )}
      </div>

      {list.length === 0 ? (
        <div className="mt-8">
          <EmptyState icon={Building2} title="Bientôt" text="Les premiers clubs partenaires seront annoncés prochainement." />
        </div>
      ) : (
        <div className="mt-8 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {list.map((c, i) => (
            <motion.article
              key={c.id}
              layout
              initial={{ opacity: 0, y: 18 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: Math.min(i, 8) * 0.06, ease: EASE }}
              className="group relative overflow-hidden rounded-card bg-ink p-6 text-white transition-transform duration-500 hover:-translate-y-1"
            >
              <span className="court-lines pointer-events-none absolute inset-0 opacity-30 transition-opacity duration-500 group-hover:opacity-60" />
              <span className="pointer-events-none absolute -right-16 -top-16 h-48 w-48 rounded-full bg-orange/0 blur-3xl transition-colors duration-700 group-hover:bg-orange/40" />
              <div className="relative">
                <p className="flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-[0.16em] text-orange">
                  <MapPin size={12} /> {c.city}
                </p>
                <h3 className="h-display mt-2 text-4xl">{c.name}</h3>
                {c.address && <p className="mt-1 text-sm text-white/60">{c.address}</p>}
                <div className="mt-5 flex flex-wrap gap-1.5">
                  {c.disciplines.map((d) => (
                    <span key={d} className="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-3 py-1.5 text-xs font-semibold">
                      <DisciplineIcon discipline={d} size={14} /> {DISCIPLINE_LABEL[d]}
                    </span>
                  ))}
                </div>
                <div className="mt-6 flex items-center justify-between border-t border-white/10 pt-4 text-sm">
                  <span className="text-white/60">Accueil en alternance</span>
                  <span className="font-mono">
                    {c.status === "en_convention" ? "Convention en cours" : `${Math.max(0, c.capacity - c.active)} place${c.capacity - c.active > 1 ? "s" : ""} libre${c.capacity - c.active > 1 ? "s" : ""}`}
                  </span>
                </div>
              </div>
            </motion.article>
          ))}
        </div>
      )}
    </div>
  );
}
