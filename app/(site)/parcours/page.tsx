"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { Check, Lock, Clock, Handshake } from "lucide-react";
import type { Formation, Level } from "@/lib/types";
import { DISCIPLINES, DISCIPLINE_LABEL, LEVELS, LEVEL_DESC, LEVEL_LABEL, LEVEL_SUB } from "@/lib/labels";
import PageHero from "@/components/PageHero";
import ArrowButton, { SlideArrow } from "@/components/ui/ArrowButton";
import ModuleIcons from "@/components/ModuleIcons";
import { DisciplineIcon, LevelIcon } from "@/components/icons/DisciplineIcon";

interface ProgressData {
  levels: Level[];
  totalHours: number;
}

const EASE = [0.22, 1, 0.36, 1] as const;

export default function ParcoursPage() {
  const [formations, setFormations] = useState<Formation[]>([]);
  const [progress, setProgress] = useState<ProgressData | null>(null);
  const [isLearner, setIsLearner] = useState(false);

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

  const formationFor = (l: Level) => formations.find((f) => f.level === l && f.active);
  const done = (l: Level) => progress?.levels.includes(l) ?? false;
  const nextIdx = LEVELS.findIndex((l) => !done(l));
  const pct = (LEVELS.filter(done).length / LEVELS.length) * 100;

  return (
    <div>
      <PageHero
        tag="Parcours de certification"
        title="Quatre niveaux,"
        accent="une progression claire."
        text={
          isLearner
            ? "Vos niveaux validés s'allument en orange. Le prochain niveau à viser est mis en avant."
            : "Du JES Niveau 1 au Diplôme d'État. À chaque niveau, les cinq modules sportifs. Connectez-vous pour voir votre progression."
        }
      >
        {!isLearner && (
          <ArrowButton href="/login?next=/parcours" variant="dark">
            Voir ma progression
          </ArrowButton>
        )}
      </PageHero>

      <div className="mx-auto max-w-content px-5 pb-24 sm:px-6">
        {/* Les 5 modules communs à tous les niveaux */}
        <div className="flex flex-wrap items-center gap-3 rounded-card border border-line bg-white p-4">
          <p className="mr-2 font-mono text-[11px] uppercase tracking-[0.16em] text-mutedfg">Modules à chaque niveau</p>
          {DISCIPLINES.map((d, i) => (
            <motion.span
              key={d}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 + i * 0.06, ease: EASE }}
              className="inline-flex items-center gap-2 rounded-full bg-muted py-1 pl-1 pr-3 text-xs font-semibold"
            >
              <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-ink text-white">
                <DisciplineIcon discipline={d} size={15} />
              </span>
              {DISCIPLINE_LABEL[d]}
            </motion.span>
          ))}
        </div>

        {/* Barre de progression globale */}
        <div className="relative mt-10 hidden md:block">
          <div className="mx-[12.5%] h-1 rounded-full bg-muted">
            <motion.div className="h-full rounded-full bg-orange" initial={{ width: 0 }} animate={{ width: `${pct}%` }} transition={{ duration: 0.9, ease: EASE }} />
          </div>
        </div>

        <ol className="mt-8 grid gap-4 md:grid-cols-4">
          {LEVELS.map((l, i) => {
            const f = formationFor(l);
            const ok = done(l);
            const isNext = isLearner && i === nextIdx;
            return (
              <motion.li
                key={l}
                initial={{ opacity: 0, y: 24 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 + i * 0.1, duration: 0.5, ease: EASE }}
                className={`relative flex flex-col rounded-card border-2 p-6 ${
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
                <p className={`font-mono text-[10px] uppercase tracking-wider ${ok ? "text-white/70" : "text-orange"}`}>{LEVEL_SUB[l]}</p>
                <p className={`mt-3 text-sm leading-relaxed ${ok ? "text-white/80" : "text-mutedfg"}`}>{LEVEL_DESC[l]}</p>

                {f && f.modules.length > 0 && (
                  <div className="mt-4">
                    <ModuleIcons modules={f.modules.map((m) => m.discipline)} size="sm" tone={ok ? "glass" : "light"} />
                  </div>
                )}
                {f?.partners && (
                  <p className={`mt-3 inline-flex items-center gap-1.5 text-xs font-semibold ${ok ? "text-white" : "text-orangeD"}`}>
                    <Handshake size={14} /> Avec nos partenaires
                  </p>
                )}

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
                        <SlideArrow size={14} />
                      </span>
                    </Link>
                  ) : (
                    <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-mutedfg">
                      <Lock size={13} /> Bientôt disponible
                    </span>
                  )}
                </div>
              </motion.li>
            );
          })}
        </ol>
      </div>
    </div>
  );
}
