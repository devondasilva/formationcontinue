"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  Award,
  Clock,
  GraduationCap,
  CalendarPlus,
  Download,
  MapPin,
  LogOut,
  Check,
  BookOpen,
  Sparkles,
  ArrowRight,
  Route,
  CalendarDays,
} from "lucide-react";
import type { Enrollment, Formation, Learner, Level } from "@/lib/types";
import {
  ENROLLMENT_STATUS_LABEL,
  ENROLLMENT_STATUS_TONE,
  LEVELS,
  LEVEL_LABEL,
  LEVEL_SUB,
  formatRange,
} from "@/lib/labels";
import Counter from "@/components/Counter";
import ArrowButton, { SlideArrow } from "@/components/ui/ArrowButton";
import { Badge, EmptyState, Skeleton } from "@/components/ui/primitives";
import { LevelIcon } from "@/components/icons/DisciplineIcon";
import ModuleIcons from "@/components/ModuleIcons";

interface Progress {
  levels: Level[];
  totalHours: number;
  completedCount: number;
}

const SHORTCUTS = [
  { icon: BookOpen, label: "Trouver une formation", href: "/formations" },
  { icon: Route, label: "Mon parcours", href: "/parcours" },
  { icon: CalendarDays, label: "Calendrier des sessions", href: "/sessions" },
  { icon: Award, label: "Mes certificats", href: "#inscriptions" },
];

const TRACK = ["Inscription", "Paiement confirmé", "Certificat"] as const;
function trackIndex(e: Enrollment) {
  if (e.status === "terminee") return 3;
  if (e.status === "confirmee") return 2;
  return 1;
}

export default function DashboardPage() {
  const [learner, setLearner] = useState<Learner | null>(null);
  const [enrollments, setEnrollments] = useState<Enrollment[]>([]);
  const [progress, setProgress] = useState<Progress | null>(null);
  const [formations, setFormations] = useState<Formation[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/learners/me")
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        if (!d) return;
        setLearner(d.learner);
        setEnrollments(d.enrollments ?? []);
        setProgress(d.progress ?? null);
      })
      .finally(() => setLoading(false));
    fetch("/api/formations").then((r) => r.json()).then((d) => setFormations((d.formations ?? []).filter((f: Formation) => f.active)));
  }, []);

  const today = new Date().toISOString().slice(0, 10);
  const upcoming = useMemo(
    () =>
      enrollments
        .filter((e) => e.status !== "annulee" && e.status !== "terminee" && e.sessionEndDate >= today)
        .sort((a, b) => (a.sessionStartDate > b.sessionStartDate ? 1 : -1))[0],
    [enrollments, today]
  );

  // Suggestion : le premier niveau non validé auquel l'apprenant n'est pas déjà inscrit.
  const suggestion = useMemo(() => {
    const enrolledIds = new Set(enrollments.filter((e) => e.status !== "annulee").map((e) => e.formationId));
    const done = progress?.levels ?? [];
    const nextLv = LEVELS.find((l) => !done.includes(l));
    return formations.find((f) => f.level === nextLv && !enrolledIds.has(f.id)) ?? null;
  }, [formations, progress, enrollments]);

  async function handleLogout() {
    await fetch("/api/auth/logout", { method: "POST" });
    window.location.href = "/";
  }

  if (loading)
    return (
      <div className="mx-auto max-w-content space-y-4 px-5 py-16 sm:px-6">
        <Skeleton className="h-40" />
        <div className="grid gap-4 sm:grid-cols-3">
          <Skeleton className="h-28" />
          <Skeleton className="h-28" />
          <Skeleton className="h-28" />
        </div>
      </div>
    );
  if (!learner)
    return (
      <div className="mx-auto max-w-content px-5 py-20 sm:px-6">
        <EmptyState icon={GraduationCap} title="Session expirée" text="Reconnectez-vous pour accéder à votre espace." action={<ArrowButton href="/login?next=/dashboard">Me reconnecter</ArrowButton>} />
      </div>
    );

  const certs = enrollments.filter((e) => e.certificateIssued).length;
  const kpis = [
    { icon: GraduationCap, label: "Niveaux validés", value: progress?.completedCount ?? 0, suffix: "" },
    { icon: Clock, label: "Heures de formation", value: progress?.totalHours ?? 0, suffix: " h" },
    { icon: Award, label: "Certificats obtenus", value: certs, suffix: "" },
  ];

  return (
    <div className="mx-auto max-w-content px-5 pb-24 pt-10 sm:px-6">
      {/* Bonjour */}
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="tag-label">Mon espace</p>
          <h1 className="h-display mt-3 text-[clamp(2.8rem,7vw,5rem)]">
            Bonjour, <span className="text-orange">{learner.name.split(" ")[0]}.</span>
          </h1>
        </div>
        <button onClick={handleLogout} className="inline-flex items-center gap-2 rounded-full border border-line px-4 py-2 text-sm font-semibold text-mutedfg transition-colors hover:border-danger hover:text-danger">
          <LogOut size={15} /> Déconnexion
        </button>
      </div>

      {/* Raccourcis : tout ce qu'un coach fait, en un clic */}
      <div className="mt-8 grid grid-cols-2 gap-3 lg:grid-cols-4">
        {SHORTCUTS.map((sc, i) => (
          <motion.div key={sc.label} initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 + i * 0.06, ease: [0.22, 1, 0.36, 1] }}>
            <Link
              href={sc.href}
              className="group relative flex h-full items-center gap-3 overflow-hidden rounded-2xl border border-line bg-white p-3.5 transition-colors duration-300 hover:border-orange sm:p-4"
            >
              <span className="absolute inset-0 origin-bottom scale-y-0 bg-orange transition-transform duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:scale-y-100" />
              <span className="relative inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-orangeL text-orange transition-colors duration-300 group-hover:bg-white">
                <sc.icon size={20} />
              </span>
              <span className="relative min-w-0 flex-1 text-sm font-semibold leading-tight transition-colors group-hover:text-white">{sc.label}</span>
              <span className="relative hidden text-ink transition-colors group-hover:text-white sm:inline-flex">
                <SlideArrow />
              </span>
            </Link>
          </motion.div>
        ))}
      </div>

      {/* Prochaine étape */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }} className="mt-8 grid gap-4 lg:grid-cols-5">
        <div className="relative overflow-hidden rounded-card bg-ink p-7 text-white lg:col-span-3">
          <div className="pointer-events-none absolute -right-20 -top-20 h-64 w-64 rounded-full bg-orange/25 blur-3xl" />
          <p className="relative font-mono text-[11px] uppercase tracking-[0.16em] text-orange">Prochaine session</p>
          {upcoming ? (
            <div className="relative">
              <p className="h-display mt-3 text-4xl">{upcoming.formationTitle}</p>
              <p className="mt-2 font-mono text-sm text-white/70">{formatRange(upcoming.sessionStartDate, upcoming.sessionEndDate)}</p>
              <div className="mt-6 flex flex-wrap gap-3">
                <ArrowButton href={`/api/enrollments/${upcoming.id}/calendar`} external icon={CalendarPlus} arrow={false}>
                  Ajouter à mon agenda
                </ArrowButton>
                <ArrowButton href={`/formations/${upcoming.formationId}`} variant="ghost">
                  Voir la formation
                </ArrowButton>
              </div>
            </div>
          ) : (
            <div className="relative">
              <p className="h-display mt-3 text-4xl">Aucune session prévue</p>
              <p className="mt-2 text-sm text-white/60">Choisissez votre prochaine formation pour continuer à progresser.</p>
              <div className="mt-6">
                <ArrowButton href="/formations">Choisir une formation</ArrowButton>
              </div>
            </div>
          )}
        </div>

        {suggestion && (
          <Link href={`/formations/${suggestion.id}`} className="group relative overflow-hidden rounded-card bg-orange p-7 text-white transition-transform duration-500 hover:-translate-y-1 lg:col-span-2">
            <LevelIcon level={suggestion.level} size={170} className="absolute -bottom-8 -right-8 opacity-20 transition-transform duration-700 group-hover:-rotate-12" />
            <p className="relative inline-flex items-center gap-1.5 font-mono text-[11px] uppercase tracking-[0.16em] text-white/80">
              <Sparkles size={13} /> Recommandé pour vous
            </p>
            <p className="h-display relative mt-3 text-4xl">{suggestion.title}</p>
            <p className="relative mt-1 text-sm text-white/80">Niveau {LEVELS.indexOf(suggestion.level) + 1} · {LEVEL_SUB[suggestion.level]}</p>
            <div className="relative mt-4">
              <ModuleIcons modules={suggestion.modules.map((m) => m.discipline)} size="sm" tone="glass" />
            </div>
            <span className="relative mt-6 inline-flex h-11 w-11 items-center justify-center rounded-full bg-white text-orange transition-transform duration-500 group-hover:-rotate-45">
              <ArrowRight size={18} />
            </span>
          </Link>
        )}
      </motion.div>

      {/* KPI */}
      <div className="mt-4 grid gap-4 sm:grid-cols-3">
        {kpis.map((k, i) => (
          <motion.div key={k.label} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 + i * 0.08 }} className="card flex items-center gap-4 p-5">
            <span className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-orangeL text-orange">
              <k.icon size={22} />
            </span>
            <div>
              <p className="h-display text-4xl">
                <Counter value={k.value} suffix={k.suffix} />
              </p>
              <p className="text-xs text-mutedfg">{k.label}</p>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Progression par niveau */}
      <section className="mt-12">
        <div className="flex items-end justify-between gap-4">
          <h2 className="h-display text-3xl">Ma progression</h2>
          <Link href="/parcours" className="group inline-flex items-center gap-1.5 text-sm font-semibold hover:text-orange">
            Parcours complet <ArrowRight size={15} className="transition-transform group-hover:translate-x-1" />
          </Link>
        </div>
        <ol className="relative mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {LEVELS.map((l, i) => {
            const ok = progress?.levels.includes(l) ?? false;
            const next = !ok && LEVELS.findIndex((x) => !(progress?.levels ?? []).includes(x)) === i;
            return (
              <motion.li
                key={l}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.25 + i * 0.08 }}
                className={`relative rounded-card border-2 p-4 ${ok ? "border-orange bg-orange text-white" : next ? "border-ink bg-white" : "border-line bg-white"}`}
              >
                {next && (
                  <span className="absolute -top-2.5 left-4 rounded-full bg-ink px-2.5 py-0.5 font-mono text-[9px] uppercase tracking-wider text-white">Prochaine étape</span>
                )}
                <div className="flex items-center gap-3">
                  <span className={`inline-flex h-10 w-10 items-center justify-center rounded-xl ${ok ? "bg-white text-orange" : next ? "bg-orange text-white" : "bg-muted text-mutedfg"}`}>
                    {ok ? <Check size={20} strokeWidth={3} /> : <LevelIcon level={l} size={19} />}
                  </span>
                  <div className="min-w-0">
                    <p className="text-sm font-semibold leading-tight">{LEVEL_LABEL[l]}</p>
                    <p className={`font-mono text-[10px] uppercase ${ok ? "text-white/75" : "text-mutedfg"}`}>{ok ? "Validé" : `Niveau ${i + 1}`}</p>
                  </div>
                </div>
              </motion.li>
            );
          })}
        </ol>
      </section>

      {/* Inscriptions */}
      <section id="inscriptions" className="mt-12 scroll-mt-24">
        <h2 className="h-display text-3xl">Mes inscriptions</h2>
        {enrollments.length === 0 ? (
          <div className="mt-4">
            <EmptyState icon={BookOpen} title="Pas encore d'inscription" text="Votre première formation vous attend." action={<ArrowButton href="/formations">Découvrir les formations</ArrowButton>} />
          </div>
        ) : (
          <div className="mt-4 space-y-3">
            {enrollments.map((e, i) => {
              const t = trackIndex(e);
              const cancelled = e.status === "annulee";
              return (
                <motion.div key={e.id} initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }} className={`card p-5 ${cancelled ? "opacity-60" : ""}`}>
                  <div className="flex flex-wrap items-start justify-between gap-4">
                    <div className="flex items-start gap-4">
                      <span className="inline-flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-ink text-white">
                        <LevelIcon level={e.level} size={22} />
                      </span>
                      <div>
                        <p className="font-semibold">{e.formationTitle}</p>
                        <p className="mt-0.5 flex flex-wrap items-center gap-x-3 text-xs text-mutedfg">
                          <span>{LEVEL_LABEL[e.level]}</span>
                          <span className="font-mono">{formatRange(e.sessionStartDate, e.sessionEndDate)}</span>
                          <span className="inline-flex items-center gap-1">
                            <Clock size={11} /> {e.durationHours} h
                          </span>
                        </p>
                      </div>
                    </div>
                    <Badge tone={ENROLLMENT_STATUS_TONE[e.status]}>{ENROLLMENT_STATUS_LABEL[e.status]}</Badge>
                  </div>

                  {!cancelled && (
                    <ol className="mt-5 grid grid-cols-3 gap-2">
                      {TRACK.map((label, idx) => {
                        const ok = idx < t;
                        return (
                          <li key={label}>
                            <div className="h-1 rounded-full bg-muted">
                              <div className={`h-full rounded-full transition-all duration-700 ${ok ? "w-full bg-orange" : "w-0"}`} />
                            </div>
                            <p className={`mt-1.5 flex items-center gap-1 text-[11px] font-semibold ${ok ? "text-ink" : "text-mutedfg"}`}>
                              {ok && <Check size={12} className="text-orange" />} {label}
                            </p>
                          </li>
                        );
                      })}
                    </ol>
                  )}

                  {!cancelled && (
                    <div className="mt-5 flex flex-wrap gap-2">
                      <a href={`/api/enrollments/${e.id}/calendar`} className="inline-flex items-center gap-1.5 rounded-full border border-line px-3.5 py-2 text-xs font-semibold transition-colors hover:border-ink">
                        <CalendarPlus size={14} /> Agenda (.ics)
                      </a>
                      {e.certificateIssued && (
                        <a href={`/api/enrollments/${e.id}/certificate`} className="inline-flex items-center gap-1.5 rounded-full bg-orange px-3.5 py-2 text-xs font-semibold text-white shadow-glow transition-transform hover:-translate-y-0.5">
                          <Download size={14} /> Mon certificat (PDF)
                        </a>
                      )}
                      <Link href={`/formations/${e.formationId}`} className="inline-flex items-center gap-1.5 rounded-full px-3.5 py-2 text-xs font-semibold text-mutedfg hover:text-ink">
                        <MapPin size={14} /> Détails
                      </Link>
                    </div>
                  )}
                </motion.div>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}
