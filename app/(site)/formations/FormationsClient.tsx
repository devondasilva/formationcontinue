"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { LayoutGrid, Search, SearchX, X } from "lucide-react";
import type { Discipline, Formation, Level } from "@/lib/types";
import { DISCIPLINES, DISCIPLINE_LABEL, LEVELS, LEVEL_LABEL } from "@/lib/labels";
import PageHero from "@/components/PageHero";
import FormationCard from "@/components/FormationCard";
import { DisciplineIcon, LevelIcon } from "@/components/icons/DisciplineIcon";
import { EmptyState, Skeleton } from "@/components/ui/primitives";
import ArrowButton from "@/components/ui/ArrowButton";

export default function FormationsClient() {
  const params = useSearchParams();
  const router = useRouter();
  const [formations, setFormations] = useState<Formation[] | null>(null);
  const [discipline, setDiscipline] = useState<Discipline | "tout">(
    (DISCIPLINES as string[]).includes(params.get("discipline") ?? "") ? (params.get("discipline") as Discipline) : "tout"
  );
  const [level, setLevel] = useState<Level | "tout">("tout");
  const [q, setQ] = useState("");

  useEffect(() => {
    fetch("/api/formations")
      .then((r) => r.json())
      .then((d) => setFormations((d.formations ?? []).filter((f: Formation) => f.active)));
  }, []);

  // Garde le filtre discipline dans l'URL (lien partageable, retour arrière).
  function pickDiscipline(d: Discipline | "tout") {
    setDiscipline(d);
    router.replace(d === "tout" ? "/formations" : `/formations?discipline=${d}`, { scroll: false });
  }

  const filtered = useMemo(() => {
    const term = q.trim().toLowerCase();
    return (formations ?? [])
      .filter((f) => discipline === "tout" || f.discipline === discipline)
      .filter((f) => level === "tout" || f.level === level)
      .filter((f) => !term || `${f.title} ${f.description} ${f.syllabus.join(" ")}`.toLowerCase().includes(term))
      .sort((a, b) => LEVELS.indexOf(a.level) - LEVELS.indexOf(b.level));
  }, [formations, discipline, level, q]);

  const hasFilter = discipline !== "tout" || level !== "tout" || q !== "";

  return (
    <div>
      <PageHero
        tag="Catalogue"
        title="Nos"
        accent="formations."
        text="Choisissez votre discipline, puis votre niveau. Chaque formation mène à un certificat MADES."
      />

      <div className="mx-auto max-w-content px-5 pb-24 sm:px-6">
        {/* Disciplines : grandes tuiles avec icône */}
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
          {(["tout", ...DISCIPLINES] as const).map((d) => {
            const active = discipline === d;
            return (
              <button
                key={d}
                onClick={() => pickDiscipline(d)}
                aria-pressed={active}
                className={`group relative flex items-center gap-3 overflow-hidden rounded-2xl border p-3 text-left transition-all duration-300 ${
                  active ? "border-ink bg-ink text-white shadow-lift" : "border-line bg-white hover:-translate-y-0.5 hover:border-ink/30"
                }`}
              >
                <span
                  className={`inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-xl transition-colors ${
                    active ? "bg-orange text-white" : "bg-muted text-ink group-hover:bg-orangeL group-hover:text-orange"
                  }`}
                >
                  {d === "tout" ? <LayoutGrid size={20} /> : <DisciplineIcon discipline={d} size={24} />}
                </span>
                <span className="text-sm font-semibold leading-tight">{d === "tout" ? "Toutes" : DISCIPLINE_LABEL[d]}</span>
              </button>
            );
          })}
        </div>

        {/* Niveaux + recherche */}
        <div className="mt-4 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex flex-wrap gap-2">
            {(["tout", ...LEVELS] as const).map((l) => {
              const active = level === l;
              return (
                <button
                  key={l}
                  onClick={() => setLevel(l)}
                  aria-pressed={active}
                  className={`relative inline-flex items-center gap-1.5 rounded-full px-4 py-2 text-sm font-medium transition-colors ${
                    active ? "text-white" : "text-mutedfg hover:text-ink"
                  }`}
                >
                  {active && (
                    <motion.span layoutId="level-pill" className="absolute inset-0 rounded-full bg-orange" transition={{ type: "spring", stiffness: 450, damping: 34 }} />
                  )}
                  {!active && <span className="absolute inset-0 rounded-full border border-line" />}
                  {l !== "tout" && <LevelIcon level={l} size={14} className="relative" />}
                  <span className="relative">{l === "tout" ? "Tous niveaux" : LEVEL_LABEL[l]}</span>
                </button>
              );
            })}
          </div>
          <label className="relative block lg:w-80">
            <Search size={16} className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-mutedfg" />
            <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Rechercher un thème, un module…" className="field rounded-full pl-11" />
          </label>
        </div>

        <div className="mt-8 flex items-center justify-between border-b border-line pb-4">
          <p className="font-mono text-xs uppercase tracking-wider text-mutedfg">
            {formations ? `${filtered.length} formation${filtered.length > 1 ? "s" : ""}` : "Chargement…"}
          </p>
          {hasFilter && (
            <button
              onClick={() => {
                pickDiscipline("tout");
                setLevel("tout");
                setQ("");
              }}
              className="inline-flex items-center gap-1 text-xs font-semibold text-orange hover:underline"
            >
              <X size={14} /> Réinitialiser
            </button>
          )}
        </div>

        <div className="mt-8 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
          {!formations &&
            Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-80" />)}
          <AnimatePresence mode="popLayout">
            {filtered.map((f, i) => (
              <motion.div
                key={f.id}
                layout
                initial={{ opacity: 0, y: 24, scale: 0.97 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.45, delay: Math.min(i, 6) * 0.04, ease: [0.22, 1, 0.36, 1] }}
              >
                <FormationCard f={f} />
              </motion.div>
            ))}
          </AnimatePresence>
        </div>

        {formations && filtered.length === 0 && (
          <EmptyState
            icon={SearchX}
            title="Aucune formation trouvée"
            text="Essayez une autre discipline ou un autre niveau."
            action={
              <ArrowButton
                variant="dark"
                onClick={() => {
                  pickDiscipline("tout");
                  setLevel("tout");
                  setQ("");
                }}
              >
                Voir tout le catalogue
              </ArrowButton>
            }
          />
        )}
      </div>
    </div>
  );
}
