"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowLeft, Clock, MonitorSmartphone, Award, ListChecks, Info, SearchX, Handshake, Check, Layers } from "lucide-react";
import type { Discipline, Formation, Review, TrainingSession } from "@/lib/types";
import { DISCIPLINE_DESC, DISCIPLINE_LABEL, FORMAT_LABEL, LEVELS, LEVEL_LABEL, LEVEL_SUB } from "@/lib/labels";
import { formatAmount } from "@/lib/currency";
import Reveal from "@/components/Reveal";
import ArrowButton from "@/components/ui/ArrowButton";
import { EmptyState, Skeleton } from "@/components/ui/primitives";
import { DisciplineIcon, LevelIcon, moduleIcon } from "@/components/icons/DisciplineIcon";
import ModuleIcons from "@/components/ModuleIcons";
import EnrollPanel from "./EnrollPanel";
import ReviewsBlock, { Stars } from "./ReviewsBlock";

type SessionRow = TrainingSession & { enrolledCount: number };

export default function FormationDetailClient({ id }: { id: string }) {
  const [formation, setFormation] = useState<Formation | null>(null);
  const [sessions, setSessions] = useState<SessionRow[]>([]);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [rating, setRating] = useState({ average: 0, count: 0 });
  const [notFound, setNotFound] = useState(false);
  const [tab, setTab] = useState<Discipline | null>(null);

  const load = useCallback(() => {
    fetch(`/api/formations/${id}`).then(async (r) => {
      if (!r.ok) {
        setNotFound(true);
        return;
      }
      const d = await r.json();
      setFormation(d.formation);
      setSessions(d.sessions);
      setReviews(d.reviews);
      setRating(d.rating);
    });
  }, [id]);

  useEffect(() => {
    load();
  }, [load]);

  if (notFound) {
    return (
      <div className="mx-auto max-w-content px-5 py-20 sm:px-6">
        <EmptyState
          icon={SearchX}
          title="Formation introuvable"
          text="Elle a peut-être été retirée du catalogue."
          action={<ArrowButton href="/formations">Retour au catalogue</ArrowButton>}
        />
      </div>
    );
  }

  if (!formation) {
    return (
      <div className="mx-auto grid max-w-content gap-6 px-5 py-16 sm:px-6 lg:grid-cols-12">
        <Skeleton className="h-72 lg:col-span-7" />
        <Skeleton className="h-96 lg:col-span-5" />
      </div>
    );
  }

  const step = LEVELS.indexOf(formation.level) + 1;
  const facts = [
    { icon: Clock, label: "Durée", value: `${formation.durationHours} heures` },
    { icon: MonitorSmartphone, label: "Format", value: FORMAT_LABEL[formation.format] },
    { icon: Award, label: "Certification", value: formation.certification || "Certificat MADES" },
  ];

  return (
    <div className="overflow-x-clip pb-28 lg:pb-0">
      {/* ---------- En-tête sombre ---------- */}
      <section className="relative overflow-hidden bg-ink text-white">
        <span className="court-lines pointer-events-none absolute inset-0" />
        <span className="h-display pointer-events-none absolute -right-6 -top-10 text-[22rem] leading-none text-white/[0.04]">0{step}</span>
        <div className="pointer-events-none absolute -left-40 bottom-0 h-80 w-80 rounded-full bg-orange/20 blur-3xl" />
        <div className="relative mx-auto max-w-content px-5 pb-14 pt-8 sm:px-6">
          <Link href="/formations" className="group inline-flex items-center gap-2 text-sm text-white/60 transition-colors hover:text-white">
            <ArrowLeft size={16} className="transition-transform group-hover:-translate-x-1" /> Tous les niveaux
          </Link>

          <Reveal>
            <div className="mt-8 flex flex-wrap items-center gap-3">
              <span className="inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-orange">
                <LevelIcon level={formation.level} size={28} />
              </span>
              <div>
                <p className="font-mono text-[11px] uppercase tracking-[0.16em] text-white/50">Niveau {step} sur 4</p>
                <p className="text-sm font-semibold text-orange">{LEVEL_SUB[formation.level]}</p>
              </div>
            </div>
          </Reveal>
          <Reveal delay={80}>
            <h1 className="h-display mt-6 max-w-3xl text-[clamp(2.8rem,7vw,5.5rem)]">{formation.title}</h1>
          </Reveal>
          {formation.modules.length > 0 && (
            <Reveal delay={120}>
              <div className="mt-5">
                <ModuleIcons modules={formation.modules.map((m) => m.discipline)} tone="glass" labels />
              </div>
            </Reveal>
          )}
          <Reveal delay={140}>
            <div className="mt-4 flex items-center gap-3 text-sm text-white/60">
              <Stars rating={rating.average} dark />
              {rating.count > 0 ? `${rating.average.toLocaleString("fr-FR")}/5 · ${rating.count} avis` : "Nouvelle formation"}
            </div>
          </Reveal>
          <Reveal delay={200}>
            <div className="mt-8 grid max-w-3xl gap-3 sm:grid-cols-3">
              {facts.map((f) => (
                <div key={f.label} className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/[0.04] p-4">
                  <f.icon size={20} className="shrink-0 text-orange" />
                  <div className="min-w-0">
                    <p className="font-mono text-[10px] uppercase tracking-wider text-white/45">{f.label}</p>
                    <p className="truncate text-sm font-semibold" title={f.value}>
                      {f.value}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </Reveal>
        </div>
      </section>

      {/* ---------- Corps ---------- */}
      <div className="mx-auto grid max-w-content gap-12 px-5 py-14 sm:px-6 lg:grid-cols-12">
        <div className="min-w-0 space-y-14 lg:col-span-7">
          <Reveal>
            <p className="text-lg leading-relaxed text-ink/80">{formation.description}</p>
          </Reveal>

          {/* Position du niveau dans le parcours */}
          <Reveal>
            <ol className="grid grid-cols-4 gap-1.5" aria-label="Parcours MADES">
              {LEVELS.map((l, i) => {
                const here = l === formation.level;
                const past = i < step - 1;
                return (
                  <li key={l} className={`rounded-xl p-2.5 text-center transition-colors ${here ? "bg-ink text-white" : past ? "bg-orangeL text-orangeD" : "bg-white text-mutedfg ring-1 ring-inset ring-line"}`}>
                    <LevelIcon level={l} size={16} className={`mx-auto ${here ? "text-orange" : ""}`} />
                    <p className="mt-1 text-[11px] font-semibold leading-tight">{LEVEL_LABEL[l]}</p>
                  </li>
                );
              })}
            </ol>
          </Reveal>

          {formation.modules.length > 0 && (
            <section>
              <Reveal>
                <p className="tag-label">Modules sportifs</p>
                <h2 className="h-display mt-3 flex items-center gap-3 text-4xl">
                  <Layers className="text-orange" size={30} /> {formation.modules.length} modules inclus
                </h2>
                <p className="mt-2 text-sm text-mutedfg">Une seule inscription donne accès à tous les modules du niveau. Touchez un module pour voir son contenu.</p>
              </Reveal>
              <Reveal delay={80}>
                <div className="mt-6 flex gap-2 overflow-x-auto pb-1 no-scrollbar" role="tablist">
                  {formation.modules.map((m) => {
                    const on = (tab ?? formation.modules[0].discipline) === m.discipline;
                    return (
                      <button
                        key={m.discipline}
                        role="tab"
                        aria-selected={on}
                        onClick={() => setTab(m.discipline)}
                        className={`relative flex shrink-0 items-center gap-2 rounded-full py-1.5 pl-1.5 pr-4 text-sm font-semibold transition-colors ${on ? "text-white" : "text-ink hover:bg-white"}`}
                      >
                        {on && <motion.span layoutId="module-tab" className="absolute inset-0 rounded-full bg-ink" transition={{ type: "spring", stiffness: 420, damping: 34 }} />}
                        <span className={`relative inline-flex h-8 w-8 items-center justify-center rounded-full ${on ? "bg-orange" : "bg-muted"}`}>
                          <DisciplineIcon discipline={m.discipline} size={17} />
                        </span>
                        <span className="relative">{DISCIPLINE_LABEL[m.discipline]}</span>
                      </button>
                    );
                  })}
                </div>
              </Reveal>
              <AnimatePresence mode="wait">
                {formation.modules
                  .filter((m) => m.discipline === (tab ?? formation.modules[0].discipline))
                  .map((m) => (
                    <motion.div
                      key={m.discipline}
                      initial={{ opacity: 0, y: 14 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -8 }}
                      transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
                      className="relative mt-4 overflow-hidden rounded-card border border-line bg-white p-6"
                    >
                      <DisciplineIcon discipline={m.discipline} size={200} strokeWidth={0.8} className="pointer-events-none absolute -bottom-10 -right-8 text-orange/10" />
                      <div className="relative flex flex-wrap items-center justify-between gap-3">
                        <p className="h-display text-3xl">{DISCIPLINE_LABEL[m.discipline]}</p>
                        {m.hours > 0 && (
                          <span className="inline-flex items-center gap-1.5 rounded-full bg-orangeL px-3 py-1 font-mono text-xs text-orangeD">
                            <Clock size={13} /> {m.hours} h
                          </span>
                        )}
                      </div>
                      <p className="relative mt-1 text-sm text-mutedfg">{DISCIPLINE_DESC[m.discipline]}</p>
                      {m.topics.length > 0 && (
                        <ul className="relative mt-5 space-y-2.5">
                          {m.topics.map((t, i) => (
                            <motion.li
                              key={t}
                              initial={{ opacity: 0, x: -10 }}
                              animate={{ opacity: 1, x: 0 }}
                              transition={{ delay: 0.08 + i * 0.06 }}
                              className="flex items-start gap-3 text-sm"
                            >
                              <span className="mt-0.5 inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-orange text-white">
                                <Check size={12} strokeWidth={3} />
                              </span>
                              {t}
                            </motion.li>
                          ))}
                        </ul>
                      )}
                    </motion.div>
                  ))}
              </AnimatePresence>
            </section>
          )}

          {formation.syllabus.length > 0 && (
            <section>
              <Reveal>
                <p className="tag-label">Tronc commun</p>
                <h2 className="h-display mt-3 flex items-center gap-3 text-4xl">
                  <ListChecks className="text-orange" size={30} /> Pour tous les modules
                </h2>
              </Reveal>
              <div className="mt-6 grid gap-3 sm:grid-cols-2">
                {formation.syllabus.map((s, i) => {
                  const Icon = moduleIcon(s);
                  return (
                    <Reveal key={i} delay={i * 70}>
                      <div className="group flex h-full items-start gap-4 rounded-2xl border border-line bg-white p-4 transition-all duration-300 hover:-translate-y-0.5 hover:border-orange hover:shadow-lift">
                        <span className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-orangeL text-orange transition-all duration-300 group-hover:rotate-[-8deg] group-hover:bg-orange group-hover:text-white">
                          <Icon size={20} />
                        </span>
                        <p className="self-center text-sm font-semibold leading-snug">{s}</p>
                      </div>
                    </Reveal>
                  );
                })}
              </div>
            </section>
          )}

          {formation.partners && (
            <Reveal>
              <div className="relative overflow-hidden rounded-card bg-orange p-6 text-white">
                <Handshake size={140} strokeWidth={1} className="pointer-events-none absolute -bottom-6 -right-4 text-white/15" />
                <p className="font-mono text-[11px] uppercase tracking-[0.16em] text-white/75">Partenariat</p>
                <p className="h-display mt-2 text-3xl">Avec nos partenaires</p>
                <p className="relative mt-2 max-w-md text-sm text-white/90">{formation.partners}</p>
              </div>
            </Reveal>
          )}

          {formation.prerequisites && (
            <Reveal>
              <div className="flex gap-4 rounded-2xl border-l-4 border-orange bg-white p-5">
                <Info size={20} className="mt-0.5 shrink-0 text-orange" />
                <div>
                  <p className="text-sm font-semibold">Prérequis</p>
                  <p className="mt-1 text-sm text-mutedfg">{formation.prerequisites}</p>
                </div>
              </div>
            </Reveal>
          )}

          <ReviewsBlock formationId={formation.id} reviews={reviews} rating={rating} onPosted={load} />
        </div>

        <aside className="min-w-0 lg:col-span-5">
          <div className="lg:sticky lg:top-32">
            <EnrollPanel formation={formation} sessions={sessions} onEnrolled={load} />
          </div>
        </aside>
      </div>

      {/* Barre d'action mobile */}
      <div className="fixed inset-x-0 bottom-0 z-30 border-t border-line bg-white/95 px-5 py-3 backdrop-blur lg:hidden">
        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="font-mono text-[10px] uppercase text-mutedfg">À partir de</p>
            <p className="h-display text-2xl">{formatAmount(formation.priceFCFA, "FCFA")}</p>
          </div>
          <ArrowButton
            onClick={() => document.getElementById("inscription")?.scrollIntoView({ behavior: "smooth", block: "start" })}
          >
            S&apos;inscrire
          </ArrowButton>
        </div>
      </div>
    </div>
  );
}
