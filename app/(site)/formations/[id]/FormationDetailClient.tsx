"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft, Clock, MonitorSmartphone, Award, ListChecks, Info, SearchX } from "lucide-react";
import type { Formation, Review, TrainingSession } from "@/lib/types";
import { DISCIPLINE_LABEL, FORMAT_LABEL, LEVELS, LEVEL_LABEL } from "@/lib/labels";
import { formatAmount } from "@/lib/currency";
import Reveal from "@/components/Reveal";
import ArrowButton from "@/components/ui/ArrowButton";
import { EmptyState, Skeleton } from "@/components/ui/primitives";
import { DisciplineIcon, LevelIcon, moduleIcon } from "@/components/icons/DisciplineIcon";
import EnrollPanel from "./EnrollPanel";
import ReviewsBlock, { Stars } from "./ReviewsBlock";

type SessionRow = TrainingSession & { enrolledCount: number };

export default function FormationDetailClient({ id }: { id: string }) {
  const [formation, setFormation] = useState<Formation | null>(null);
  const [sessions, setSessions] = useState<SessionRow[]>([]);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [rating, setRating] = useState({ average: 0, count: 0 });
  const [notFound, setNotFound] = useState(false);

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
    <div className="pb-28 lg:pb-0">
      {/* ---------- En-tête sombre ---------- */}
      <section className="relative overflow-hidden bg-ink text-white">
        <DisciplineIcon
          discipline={formation.discipline}
          size={420}
          strokeWidth={0.6}
          className="pointer-events-none absolute -right-20 -top-10 text-white/[0.05]"
        />
        <div className="pointer-events-none absolute -left-40 bottom-0 h-80 w-80 rounded-full bg-orange/20 blur-3xl" />
        <div className="relative mx-auto max-w-content px-5 pb-14 pt-8 sm:px-6">
          <Link href="/formations" className="group inline-flex items-center gap-2 text-sm text-white/60 transition-colors hover:text-white">
            <ArrowLeft size={16} className="transition-transform group-hover:-translate-x-1" /> Toutes les formations
          </Link>

          <Reveal>
            <div className="mt-8 flex flex-wrap items-center gap-3">
              <span className="inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-orange">
                <DisciplineIcon discipline={formation.discipline} size={30} />
              </span>
              <div>
                <p className="font-mono text-[11px] uppercase tracking-[0.16em] text-white/50">{DISCIPLINE_LABEL[formation.discipline]}</p>
                <p className="inline-flex items-center gap-1.5 text-sm font-semibold text-orange">
                  <LevelIcon level={formation.level} size={15} /> Niveau {step} · {LEVEL_LABEL[formation.level]}
                </p>
              </div>
            </div>
          </Reveal>
          <Reveal delay={80}>
            <h1 className="h-display mt-6 max-w-3xl text-[clamp(2.8rem,7vw,5.5rem)]">{formation.title}</h1>
          </Reveal>
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
        <div className="space-y-14 lg:col-span-7">
          <Reveal>
            <p className="text-lg leading-relaxed text-ink/80">{formation.description}</p>
          </Reveal>

          {formation.syllabus.length > 0 && (
            <section>
              <Reveal>
                <p className="tag-label">Programme</p>
                <h2 className="h-display mt-3 flex items-center gap-3 text-4xl">
                  <ListChecks className="text-orange" size={32} /> {formation.syllabus.length} modules
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
                        <div>
                          <p className="font-mono text-[10px] text-mutedfg">Module {String(i + 1).padStart(2, "0")}</p>
                          <p className="text-sm font-semibold leading-snug">{s}</p>
                        </div>
                      </div>
                    </Reveal>
                  );
                })}
              </div>
            </section>
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

        <aside className="lg:col-span-5">
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
