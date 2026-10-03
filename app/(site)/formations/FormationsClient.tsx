"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { LayoutGrid, Search, SearchX, X } from "lucide-react";
import type { Discipline, Formation, Level } from "@/lib/types";
import { DISCIPLINES, DISCIPLINE_LABEL, LEVELS, LEVEL_LABEL, LEVEL_SUB } from "@/lib/labels";
import PageHero from "@/components/PageHero";
import FormationCard from "@/components/FormationCard";
import { DisciplineIcon, LevelIcon } from "@/components/icons/DisciplineIcon";
import { EmptyState, Skeleton } from "@/components/ui/primitives";
import ArrowButton from "@/components/ui/ArrowButton";

export default function FormationsClient() {
  const params = useSearchParams();
  const router = useRouter();
  const [formations, setFormations] = useState<Formation[] | null>(null);
  const [level, setLevel] = useState<Level | "tout">(
    (LEVELS as string[]).includes(params.get("niveau") ?? "") ? (params.get("niveau") as Level) : "tout"
  );
  const [module, setModule] = useState<Discipline | "tout">(
    (DISCIPLINES as string[]).includes(params.get("module") ?? "") ? (params.get("module") as Discipline) : "tout"
  );
  const [q, setQ] = useState("");

  useEffect(() => {
    fetch("/api/formations")
      .then((r) => r.json())
      .then((d) => setFormations((d.formations ?? []).filter((f: Formation) => f.active)));
  }, []);

  // Garde les filtres dans l'URL (lien partageable, retour arrière).
  function sync(l: Level | "tout", m: Discipline | "tout") {
    const sp = new URLSearchParams();
    if (l !== "tout") sp.set("niveau", l);
    if (m !== "tout") sp.set("module", m);
    const qs = sp.toString();
    router.replace(qs ? `/formations?${qs}` : "/formations", { scroll: false });
  }
  const pickLevel = (l: Level | "tout") => {
    setLevel(l);
    sync(l, module);
  };
  const pickModule = (m: Discipline | "tout") => {
    setModule(m);
    sync(level, m);
  };
  const reset = () => {
    setLevel("tout");
    setModule("tout");
    setQ("");
    sync("tout", "tout");
  };

  const filtered = useMemo(() => {
    const term = q.trim().toLowerCase();
    return (formations ?? [])
      .filter((f) => level === "tout" || f.level === level)
      .filter((f) => module === "tout" || f.modules.some((m) => m.discipline === module))
      .filter((f) => {
        if (!term) return true;
        const hay = `${f.title} ${f.description} ${f.syllabus.join(" ")} ${f.modules
          .map((m) => `${DISCIPLINE_LABEL[m.discipline]} ${m.topics.join(" ")}`)
          .join(" ")}`;
        return hay.toLowerCase().includes(term);
      })
      .sort((a, b) => LEVELS.indexOf(a.level) - LEVELS.indexOf(b.level));
  }, [formations, level, module, q]);

  const hasFilter = level !== "tout" || module !== "tout" || q !== "";

  return (
    <div>
      <PageHero
        tag="Catalogue"
        title="Quatre niveaux,"
        accent="cinq modules."
        text="Choisissez votre niveau : chaque formation comprend les modules tennis, beach tennis, padel, mini-tennis et pickleball, et mène à un certificat MADES."
      />

      <div className="mx-auto max-w-content px-5 pb-24 sm:px-6">
        {/* Niveaux : grandes tuiles avec icône */}
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
          {(["tout", ...LEVELS] as const).map((l, i) => {
            const active = level === l;
            return (
              <button
                key={l}
                onClick={() => pickLevel(l)}
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
                  {l === "tout" ? <LayoutGrid size={20} /> : <LevelIcon level={l} size={20} />}
                </span>
                <span className="min-w-0">
                  <span className="block text-sm font-semibold leading-tight">{l === "tout" ? "Tous les niveaux" : LEVEL_LABEL[l]}</span>
                  <span className={`block font-mono text-[10px] uppercase tracking-wider ${active ? "text-white/55" : "text-mutedfg"}`}>
                    {l === "tout" ? "Parcours complet" : `Niveau ${i} · ${LEVEL_SUB[l]}`}
                  </span>
                </span>
              </button>
            );
          })}
        </div>

        {/* Modules + recherche */}
        <div className="mt-4 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex flex-wrap gap-2">
            {(["tout", ...DISCIPLINES] as const).map((m) => {
              const active = module === m;
              return (
                <button
                  key={m}
                  onClick={() => pickModule(m)}
                  aria-pressed={active}
                  className={`relative inline-flex items-center gap-1.5 rounded-full px-4 py-2 text-sm font-medium transition-colors ${
                    active ? "text-white" : "text-mutedfg hover:text-ink"
                  }`}
                >
                  {active && (
                    <motion.span layoutId="module-pill" className="absolute inset-0 rounded-full bg-orange" transition={{ type: "spring", stiffness: 450, damping: 34 }} />
                  )}
                  {!active && <span className="absolute inset-0 rounded-full border border-line" />}
                  {m !== "tout" && <DisciplineIcon discipline={m} size={15} className="relative" />}
                  <span className="relative">{m === "tout" ? "Tous les modules" : DISCIPLINE_LABEL[m]}</span>
                </button>
              );
            })}
          </div>
          <label className="relative block lg:w-80">
            <Search size={16} className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-mutedfg" />
            <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Rechercher un thème, un contenu…" className="field rounded-full pl-11" />
          </label>
        </div>

        <div className="mt-8 flex items-center justify-between border-b border-line pb-4">
          <p className="font-mono text-xs uppercase tracking-wider text-mutedfg">
            {formations ? `${filtered.length} niveau${filtered.length > 1 ? "x" : ""} de formation` : "Chargement…"}
          </p>
          {hasFilter && (
            <button onClick={reset} className="inline-flex items-center gap-1 text-xs font-semibold text-orange hover:underline">
              <X size={14} /> Réinitialiser
            </button>
          )}
        </div>

        <div className="mt-8 grid gap-5 md:grid-cols-2">
          {!formations && Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-96" />)}
          <AnimatePresence mode="popLayout">
            {filtered.map((f, i) => (
              <motion.div
                key={f.id}
                layout
                initial={{ opacity: 0, y: 24, scale: 0.97 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.45, delay: Math.min(i, 6) * 0.06, ease: [0.22, 1, 0.36, 1] }}
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
            text="Essayez un autre niveau ou un autre module."
            action={
              <ArrowButton variant="dark" onClick={reset}>
                Voir tout le catalogue
              </ArrowButton>
            }
          />
        )}
      </div>
    </div>
  );
}
