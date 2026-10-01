"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import { Check, Lock, Clock } from "lucide-react";
import type { Discipline, Formation, Level } from "@/lib/types";
import { DISCIPLINES, DISCIPLINE_LABEL, LEVELS, LEVEL_DESC, LEVEL_LABEL } from "@/lib/labels";
import PageHero from "@/components/PageHero";
import ArrowButton from "@/components/ui/ArrowButton";
import { DisciplineIcon, LevelIcon } from "@/components/icons/DisciplineIcon";

interface ProgressData {
  byDiscipline: Record<string, Level[]>;
  totalHours: number;
}

export default function ParcoursPage() {
  const [formations, setFormations] = useState<Formation[]>([]);
  const [progress, setProgress] = useState<ProgressData | null>(null);
  const [isLearner, setIsLearner] = useState(false);
  const [active, setActive] = useState<Discipline>("tennis");

  useEffect(() => {
    fetch("/api/formations").then((r) => r.json()).then((d) => setFormations(d.formations ?? []));
    fetch("/api/auth/me")
      .then((r) => r.json())
      .then((d) => {
        if (d.session?.role === "learner") {
          setIsLearner(true);
          fetch("/api/learners/me").then((r) => r.json()).then((d2) => setProgress(d2.progress));
        }
      });
  }, []);

  const formationFor = (d: Discipline, l: Level) => formations.find((f) => f.discipline === d && f.level === l && f.active);
  const done = (d: Discipline, l: Level) => progress?.byDiscipline[d]?.includes(l) ?? false;
  const doneCount = (d: Discipline) => LEVELS.filter((l) => done(d, l)).length;
  // Le prochain niveau à viser = premier niveau non validé.
  const nextIdx = LEVELS.findIndex((l) => !done(active, l));
  const pct = (doneCount(active) / LEVELS.length) * 100;

  return (
    <div>
      <PageHero
        tag="Parcours de certification"
        title="Quatre niveaux,"
        accent="une progression claire."
        text={
          isLearner
            ? "Vos niveaux validés s'allument en orange. Le prochain niveau à viser est mis en avant."
            : "Du premier encadrement au Diplôme d'État. Connectez-vous pour voir votre progression personnelle."
        }
      >
        {!isLearner && (
          <ArrowButton href="/login?next=/parcours" variant="dark">
            Voir ma progression
          </ArrowButton>
        )}
      </PageHero>

      <div className="mx-auto max-w-content px-5 pb-24 sm:px-6">
        {/* Onglets disciplines */}
        <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-thin" role="tablist">
          {DISCIPLINES.map((d) => {
            const on = active === d;
            return (
              <button
                key={d}
                role="tab"
                aria-selected={on}
                onClick={() => setActive(d)}
                className={`relative flex shrink-0 items-center gap-3 rounded-full py-2 pl-2 pr-5 text-sm font-semibold transition-colors ${
                  on ? "text-white" : "text-ink hover:bg-white"
                }`}
              >
                {on && <motion.span layoutId="parcours-tab" className="absolute inset-0 rounded-full bg-ink" transition={{ type: "spring", stiffness: 420, damping: 34 }} />}
                <span className={`relative inline-flex h-9 w-9 items-center justify-center rounded-full ${on ? "bg-orange" : "bg-muted"}`}>
                  <DisciplineIcon discipline={d} size={20} />
                </span>
                <span className="relative">{DISCIPLINE_LABEL[d]}</span>
                {isLearner && <span className="relative font-mono text-[11px] opacity-60">{doneCount(d)}/4</span>}
              </button>
            );
          })}
        </div>

        <AnimatePresence mode="wait">
          <motion.div
            key={active}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
            className="mt-8"
          >
            {/* Barre de progression globale */}
            <div className="relative mb-8 hidden md:block">
              <div className="mx-[12.5%] h-1 rounded-full bg-muted">
                <motion.div className="h-full rounded-full bg-orange" initial={{ width: 0 }} animate={{ width: `${pct}%` }} transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1] }} />
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-4">
              {LEVELS.map((l, i) => {
                const f = formationFor(active, l);
                const ok = done(active, l);
                const isNext = isLearner && i === nextIdx;
                return (
                  <motion.div
                    key={l}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.08, duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
                    className={`relative flex flex-col rounded-card border-2 p-6 transition-shadow ${
                      ok ? "border-orange bg-orange text-white" : isNext ? "border-ink bg-white shadow-lift" : "border-line bg-white"
                    }`}
                  >
                    {isNext && (
                      <span className="absolute -top-3 left-6 rounded-full bg-ink px-3 py-1 font-mono text-[10px] uppercase tracking-wider text-white">
                        Prochaine étape
                      </span>
                    )}
                    <div className="flex items-center justify-between">
                      <span className={`inline-flex h-12 w-12 items-center justify-center rounded-2xl ${ok ? "bg-white text-orange" : "bg-orangeL text-orange"}`}>
                        {ok ? <Check size={24} strokeWidth={3} /> : <LevelIcon level={l} size={22} />}
                      </span>
                      <span className={`h-display text-5xl ${ok ? "text-white/30" : "text-muted"}`}>0{i + 1}</span>
                    </div>
                    <p className="h-display mt-5 text-3xl">{LEVEL_LABEL[l]}</p>
                    <p className={`mt-1 text-sm leading-relaxed ${ok ? "text-white/80" : "text-mutedfg"}`}>{LEVEL_DESC[l]}</p>

                    <div className="mt-auto pt-6">
                      {ok ? (
                        <span className="inline-flex items-center gap-1.5 rounded-full bg-white/20 px-3 py-1.5 text-xs font-semibold">
                          <Check size={14} /> Validé
                        </span>
                      ) : f ? (
                        <Link href={`/formations/${f.id}`} className="group flex items-center justify-between gap-3 rounded-2xl bg-muted p-3 transition-colors hover:bg-ink hover:text-white">
                          <span>
                            <span className="block text-xs font-semibold">Voir la formation</span>
                            <span className="flex items-center gap-1 font-mono text-[10px] opacity-60">
                              <Clock size={11} /> {f.durationHours} h
                            </span>
                          </span>
                          <span className="arrow-chip h-8 w-8">
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14M12 5l7 7-7 7" /></svg>
                          </span>
                        </Link>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-mutedfg">
                          <Lock size={13} /> Bientôt disponible
                        </span>
                      )}
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}
