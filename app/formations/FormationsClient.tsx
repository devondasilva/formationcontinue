"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Discipline, Formation, Level } from "@/lib/types";
import { formatAmount } from "@/lib/currency";

const DISCIPLINE_LABEL: Record<Discipline, string> = {
  "beach-tennis": "Beach Tennis",
  padel: "Padel",
  tennis: "Tennis",
  "mini-tennis": "Mini-Tennis",
};
const LEVEL_LABEL: Record<Level, string> = {
  initiateur: "Initiateur",
  animateur: "Animateur",
  entraineur: "Entraîneur",
  de: "Diplôme d'État",
};
const LEVEL_ORDER: Level[] = ["initiateur", "animateur", "entraineur", "de"];

export default function FormationsClient() {
  const params = useSearchParams();
  const [formations, setFormations] = useState<Formation[]>([]);
  const [discipline, setDiscipline] = useState<Discipline | "tout">(
    (params.get("discipline") as Discipline) || "tout"
  );
  const [level, setLevel] = useState<Level | "tout">("tout");

  useEffect(() => {
    fetch("/api/formations").then((r) => r.json()).then((d) =>
      setFormations((d.formations ?? []).filter((f: Formation) => f.active))
    );
  }, []);

  const filtered = useMemo(() => {
    return formations
      .filter((f) => discipline === "tout" || f.discipline === discipline)
      .filter((f) => level === "tout" || f.level === level)
      .sort((a, b) => LEVEL_ORDER.indexOf(a.level) - LEVEL_ORDER.indexOf(b.level));
  }, [formations, discipline, level]);

  return (
    <div className="max-w-content mx-auto px-6 py-16">
      <div className="max-w-xl">
        <p className="tag-label mb-3">Catalogue</p>
        <h1 className="font-display text-4xl font-bold text-ink">Nos formations</h1>
        <p className="mt-3 text-ink/70">
          Filtrez par discipline ou par niveau pour trouver la formation qui
          correspond à votre étape du parcours MADES.
        </p>
      </div>

      <div className="mt-8 flex flex-wrap gap-2">
        {(["tout", "beach-tennis", "padel", "tennis", "mini-tennis"] as const).map((d) => (
          <button
            key={d}
            onClick={() => setDiscipline(d)}
            className={`text-xs font-bold uppercase tracking-widest px-4 py-2 rounded-full border transition-colors ${
              discipline === d ? "bg-ink text-white border-ink" : "border-ink/15 text-ink/60 hover:border-ink/40"
            }`}
          >
            {d === "tout" ? "Toutes disciplines" : DISCIPLINE_LABEL[d]}
          </button>
        ))}
      </div>
      <div className="mt-3 flex flex-wrap gap-2">
        {(["tout", "initiateur", "animateur", "entraineur", "de"] as const).map((l) => (
          <button
            key={l}
            onClick={() => setLevel(l)}
            className={`text-xs font-bold uppercase tracking-widest px-4 py-2 rounded-full border transition-colors ${
              level === l ? "bg-ink text-white border-ink" : "border-ink/15 text-ink/60 hover:border-ink/40"
            }`}
          >
            {l === "tout" ? "Tous niveaux" : LEVEL_LABEL[l]}
          </button>
        ))}
      </div>

      <div className="mt-10 grid md:grid-cols-2 gap-6">
        {filtered.map((f) => (
          <Link
            key={f.id}
            href={`/formations/${f.id}`}
            className="block rounded-card border border-ink/15 p-6 hover:border-orange transition-colors bg-white"
          >
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold uppercase tracking-widest text-ink/60">{DISCIPLINE_LABEL[f.discipline]}</span>
              <span className="text-ink/20">·</span>
              <span className="text-xs font-bold uppercase tracking-widest text-orange">{LEVEL_LABEL[f.level]}</span>
            </div>
            <h2 className="font-display text-xl font-bold text-ink mt-2">{f.title}</h2>
            <p className="mt-2 text-sm text-ink/60 line-clamp-2">{f.description}</p>
            <div className="mt-4 flex items-center justify-between text-sm">
              <span className="text-ink/50">{f.durationHours}h · {f.format}</span>
              <span className="font-display font-bold text-ink">{formatAmount(f.priceFCFA, "FCFA")}</span>
            </div>
          </Link>
        ))}
        {filtered.length === 0 && (
          <p className="text-sm text-ink/50">Aucune formation ne correspond à ces filtres pour le moment.</p>
        )}
      </div>
    </div>
  );
}
