"use client";

import { useMemo } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  Wallet,
  Users,
  ClipboardCheck,
  Award,
  BookOpen,
  CalendarDays,
  CalendarPlus,
  Plus,
  Star,
  Coins,
  BellRing,
  TrendingUp,
  ArrowUpRight,
  MapPin,
  Inbox,
  BadgeCheck,
  type LucideIcon,
} from "lucide-react";
import { formatAmount } from "@/lib/currency";
import {
  LEVELS,
  LEVEL_SUB,
  ENROLLMENT_STATUS_LABEL,
  ENROLLMENT_STATUS_TONE,
  LEVEL_LABEL,
  dateParts,
  formatRange,
} from "@/lib/labels";
import Counter from "@/components/Counter";
import { Badge, Meter, Skeleton } from "@/components/ui/primitives";
import { SlideArrow } from "@/components/ui/ArrowButton";
import { LevelIcon } from "@/components/icons/DisciplineIcon";
import { useAdmin } from "./_lib/AdminContext";
import { Avatar, Panel } from "./_components/kit";

const EASE = [0.22, 1, 0.36, 1] as const;
const MONTHS = ["Janv", "Févr", "Mars", "Avr", "Mai", "Juin", "Juil", "Août", "Sept", "Oct", "Nov", "Déc"];

export default function AdminOverview() {
  const { stats, adminName } = useAdmin();
  const today = new Date().toISOString().slice(0, 10);

  const data = useMemo(() => {
    if (!stats) return null;
    const live = stats.enrollments.filter((e) => e.status !== "annulee");

    // Chiffre d'affaires des 6 derniers mois (date d'inscription).
    const now = new Date();
    const months = Array.from({ length: 6 }, (_, i) => {
      const d = new Date(now.getFullYear(), now.getMonth() - 5 + i, 1);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
      return { key, label: MONTHS[d.getMonth()], total: 0 };
    });
    for (const e of live) {
      const m = months.find((x) => e.createdAt.startsWith(x.key));
      if (m) m.total += e.amountFCFA;
    }

    const byDiscipline = LEVELS.map((d) => ({ d, n: live.filter((e) => e.level === d).length }));
    const upcoming = stats.sessions
      .filter((s) => s.endDate >= today && s.status !== "annulee")
      .sort((a, b) => (a.startDate > b.startDate ? 1 : -1))
      .slice(0, 4);
    const recent = [...stats.enrollments].sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1)).slice(0, 6);
    const toCertify = stats.enrollments.filter((e) => e.status === "confirmee" && e.sessionStartDate <= today).length;
    const avgRating = stats.reviews.length ? stats.reviews.reduce((s, r) => s + r.rating, 0) / stats.reviews.length : 0;
    return { months, byDiscipline, upcoming, recent, toCertify, avgRating };
  }, [stats, today]);

  if (!stats || !data) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-28" />
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-36" />
          ))}
        </div>
        <Skeleton className="h-80" />
      </div>
    );
  }

  const t = stats.totals;
  const maxMonth = Math.max(1, ...data.months.map((m) => m.total));
  const maxDisc = Math.max(1, ...data.byDiscipline.map((x) => x.n));
  const hour = new Date().getHours();
  const hello = hour < 18 ? "Bonjour" : "Bonsoir";

  const KPIS: { icon: LucideIcon; label: string; value: number; money?: boolean; href: string; tone: "orange" | "ink" }[] = [
    { icon: Wallet, label: "Chiffre d'affaires", value: t.totalRevenueFCFA, money: true, href: "/admin/inscriptions", tone: "orange" },
    { icon: Users, label: "Apprenants", value: t.learners, href: "/admin/apprenants", tone: "ink" },
    { icon: ClipboardCheck, label: "Inscriptions", value: t.enrollments, href: "/admin/inscriptions", tone: "ink" },
    { icon: Award, label: "Certificats délivrés", value: t.certificatesIssued, href: "/admin/certificats", tone: "ink" },
  ];

  const ACTIONS: { icon: LucideIcon; label: string; text: string; href: string }[] = [
    { icon: Plus, label: "Nouvelle formation", text: "Ajouter au catalogue", href: "/admin/formations?new=1" },
    { icon: CalendarPlus, label: "Programmer une session", text: "Dates, lieu, formateur", href: "/admin/sessions?new=1" },
    { icon: BadgeCheck, label: "Confirmer des paiements", text: `${t.pendingEnrollments} en attente`, href: "/admin/inscriptions?statut=en_attente" },
    { icon: Award, label: "Délivrer des certificats", text: `${data.toCertify} prêt${data.toCertify > 1 ? "s" : ""} à valider`, href: "/admin/certificats" },
  ];

  const MODULES: { icon: LucideIcon; label: string; count: string; href: string }[] = [
    { icon: BookOpen, label: "Formations", count: `${t.formations}`, href: "/admin/formations" },
    { icon: CalendarDays, label: "Sessions", count: `${t.sessions}`, href: "/admin/sessions" },
    { icon: ClipboardCheck, label: "Inscriptions", count: `${t.enrollments}`, href: "/admin/inscriptions" },
    { icon: Users, label: "Apprenants", count: `${t.learners}`, href: "/admin/apprenants" },
    { icon: Award, label: "Certificats", count: `${t.certificatesIssued}`, href: "/admin/certificats" },
    { icon: Star, label: "Avis", count: data.avgRating ? `${data.avgRating.toFixed(1)}★` : `${t.reviews}`, href: "/admin/avis" },
    { icon: Coins, label: "Taux de change", count: "€ $", href: "/admin/taux" },
  ];

  return (
    <div className="space-y-6">
      {/* ===== Bandeau d'accueil ===== */}
      <motion.section
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: EASE }}
        className="court-lines relative overflow-hidden rounded-card bg-ink p-6 text-white sm:p-8"
      >
        <div className="pointer-events-none absolute -right-24 -top-24 h-72 w-72 rounded-full bg-orange/30 blur-3xl" />
        <div className="relative flex flex-wrap items-end justify-between gap-6">
          <div>
            <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-orange">Back-office · Formation continue</p>
            <h1 className="h-display mt-3 text-5xl sm:text-6xl">
              {hello}
              {adminName ? (
                <>
                  , <span className="text-orange">{adminName.split(" ")[0]}.</span>
                </>
              ) : (
                "."
              )}
            </h1>
            <p className="mt-2 max-w-md text-sm text-white/60">Voici l&rsquo;activité de la plateforme. Chaque carte mène directement à l&rsquo;action.</p>
          </div>
          {t.pendingEnrollments > 0 && (
            <Link
              href="/admin/inscriptions?statut=en_attente"
              className="btn-motion group inline-flex items-center gap-3 rounded-full bg-orange py-2 pl-2 pr-5 text-sm font-semibold shadow-glow"
            >
              <span className="btn-fill bg-white/15" aria-hidden />
              <span className="inline-flex h-9 w-9 animate-pulseRing items-center justify-center rounded-full bg-white text-orange">
                <BellRing size={17} />
              </span>
              {t.pendingEnrollments} inscription{t.pendingEnrollments > 1 ? "s" : ""} à confirmer
              <SlideArrow />
            </Link>
          )}
        </div>
      </motion.section>

      {/* ===== KPI ===== */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {KPIS.map((k, i) => (
          <motion.div key={k.label} initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.08 + i * 0.07, duration: 0.5, ease: EASE }}>
            <Link
              href={k.href}
              className={`group relative flex h-full flex-col justify-between overflow-hidden rounded-card p-5 transition-all duration-500 hover:-translate-y-1 hover:shadow-lift ${
                k.tone === "orange" ? "bg-orange text-white" : "border border-line bg-white"
              }`}
            >
              <k.icon
                size={110}
                strokeWidth={1}
                className={`pointer-events-none absolute -bottom-5 -right-5 transition-transform duration-700 group-hover:-rotate-12 group-hover:scale-110 ${
                  k.tone === "orange" ? "text-white/15" : "text-ink/[0.04]"
                }`}
              />
              <div className="flex items-center justify-between">
                <span
                  className={`inline-flex h-11 w-11 items-center justify-center rounded-2xl transition-transform duration-500 group-hover:rotate-[-8deg] ${
                    k.tone === "orange" ? "bg-white text-orange" : "bg-orangeL text-orange"
                  }`}
                >
                  <k.icon size={21} />
                </span>
                <ArrowUpRight size={18} className="opacity-40 transition-all duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 group-hover:opacity-100" />
              </div>
              <div className="relative mt-6">
                <p className={`font-mono text-[11px] uppercase tracking-wider ${k.tone === "orange" ? "text-white/75" : "text-mutedfg"}`}>{k.label}</p>
                <p className="h-display mt-1 text-4xl">
                  <Counter value={k.value} />
                  {k.money && <span className="ml-1 font-mono text-sm not-italic opacity-70">FCFA</span>}
                </p>
              </div>
            </Link>
          </motion.div>
        ))}
      </div>

      {/* ===== Actions rapides ===== */}
      <section>
        <p className="mb-3 font-mono text-[11px] uppercase tracking-[0.18em] text-mutedfg">Actions rapides</p>
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {ACTIONS.map((a, i) => (
            <motion.div key={a.label} initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 + i * 0.06, ease: EASE }}>
              <Link
                href={a.href}
                className="group relative flex items-center gap-4 overflow-hidden rounded-2xl border border-line bg-white p-4 transition-colors duration-300 hover:border-ink"
              >
                <span className="absolute inset-0 origin-left scale-x-0 bg-ink transition-transform duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:scale-x-100" />
                <span className="relative inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-ink text-white transition-colors duration-300 group-hover:bg-orange">
                  <a.icon size={20} />
                </span>
                <span className="relative min-w-0 flex-1">
                  <span className="block truncate text-sm font-semibold transition-colors group-hover:text-white">{a.label}</span>
                  <span className="block truncate text-xs text-mutedfg transition-colors group-hover:text-white/60">{a.text}</span>
                </span>
                <span className="relative text-ink transition-colors group-hover:text-orange">
                  <SlideArrow />
                </span>
              </Link>
            </motion.div>
          ))}
        </div>
      </section>

      {/* ===== Graphiques ===== */}
      <div className="grid gap-4 xl:grid-cols-5">
        <Panel title="Chiffre d'affaires · 6 derniers mois" icon={TrendingUp} className="xl:col-span-3">
          <div className="mt-6 flex h-56 items-end gap-2 sm:gap-5">
            {data.months.map((m, i) => {
              const h = (m.total / maxMonth) * 100;
              const last = i === data.months.length - 1;
              return (
                <div key={m.key} className="group relative flex h-full min-w-0 flex-1 flex-col items-center justify-end gap-2">
                  <span className="pointer-events-none absolute -top-1 left-1/2 z-10 -translate-x-1/2 -translate-y-full whitespace-nowrap rounded-lg bg-ink px-2 py-1 font-mono text-[10px] text-white opacity-0 transition-all duration-300 group-hover:-translate-y-[120%] group-hover:opacity-100">
                    {m.total ? formatAmount(m.total, "FCFA") : "—"}
                  </span>
                  <div className="relative flex w-full flex-1 items-end overflow-hidden rounded-xl bg-muted/60">
                    <motion.div
                      initial={{ height: 0 }}
                      animate={{ height: `${Math.max(h, m.total ? 4 : 0)}%` }}
                      transition={{ delay: 0.3 + i * 0.08, duration: 0.9, ease: EASE }}
                      className={`w-full rounded-xl ${last ? "bg-orange" : "bg-ink group-hover:bg-orange"} transition-colors`}
                    />
                  </div>
                  <span className={`font-mono text-[11px] uppercase ${last ? "font-medium text-orange" : "text-mutedfg"}`}>{m.label}</span>
                </div>
              );
            })}
          </div>
        </Panel>

        <Panel title="Inscriptions par niveau" icon={BookOpen} className="xl:col-span-2">
          <ul className="space-y-4">
            {data.byDiscipline.map((x, i) => (
              <li key={x.d} className="flex items-center gap-3">
                <span className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-ink text-white">
                  <LevelIcon level={x.d} size={19} />
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex items-baseline justify-between gap-2">
                    <span className="truncate text-sm font-semibold">
                      {LEVEL_LABEL[x.d]} <span className="font-mono text-[10px] font-normal uppercase text-mutedfg">· {LEVEL_SUB[x.d]}</span>
                    </span>
                    <span className="font-mono text-xs text-mutedfg">{x.n}</span>
                  </div>
                  <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-muted">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${(x.n / maxDisc) * 100}%` }}
                      transition={{ delay: 0.4 + i * 0.1, duration: 0.9, ease: EASE }}
                      className="h-full rounded-full bg-orange"
                    />
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </Panel>
      </div>

      {/* ===== Sessions & inscriptions récentes ===== */}
      <div className="grid gap-4 xl:grid-cols-2">
        <Panel
          title="Prochaines sessions"
          icon={CalendarDays}
          action={
            <Link href="/admin/sessions" className="group inline-flex items-center gap-1.5 text-xs font-semibold text-orange">
              Tout voir <SlideArrow size={14} />
            </Link>
          }
        >
          {data.upcoming.length === 0 ? (
            <EmptyMini icon={CalendarDays} text="Aucune session à venir." href="/admin/sessions?new=1" cta="Programmer une session" />
          ) : (
            <ul className="divide-y divide-line">
              {data.upcoming.map((s) => {
                const d = dateParts(s.startDate);
                const f = stats.formations.find((x) => x.id === s.formationId);
                return (
                  <li key={s.id}>
                    <Link href={`/admin/sessions?formation=${s.formationId}`} className="group flex items-center gap-4 py-3">
                      <span className="flex h-14 w-14 shrink-0 flex-col items-center justify-center rounded-2xl bg-muted transition-colors duration-300 group-hover:bg-orange group-hover:text-white">
                        <span className="h-display text-2xl leading-none">{d.day}</span>
                        <span className="font-mono text-[9px] uppercase">{d.month}</span>
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="flex items-center gap-2 truncate text-sm font-semibold">
                          {f && <LevelIcon level={f.level} size={15} className="shrink-0 text-orange" />}
                          <span className="truncate">{s.formationTitle}</span>
                        </p>
                        <p className="mt-0.5 flex items-center gap-1 truncate text-xs text-mutedfg">
                          <MapPin size={11} /> {s.location}
                        </p>
                        <div className="mt-2 flex items-center gap-2">
                          <Meter value={s.enrolledCount} max={s.capacity} />
                          <span className="whitespace-nowrap font-mono text-[10px] text-mutedfg">
                            {s.enrolledCount}/{s.capacity}
                          </span>
                        </div>
                      </div>
                      <span className="arrow-chip h-9 w-9">
                        <ArrowUpRight size={15} className="rotate-45" />
                      </span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          )}
        </Panel>

        <Panel
          title="Dernières inscriptions"
          icon={ClipboardCheck}
          action={
            <Link href="/admin/inscriptions" className="group inline-flex items-center gap-1.5 text-xs font-semibold text-orange">
              Tout voir <SlideArrow size={14} />
            </Link>
          }
        >
          {data.recent.length === 0 ? (
            <EmptyMini icon={Inbox} text="Les inscriptions apparaîtront ici dès la première." href="/formations" cta="Voir le catalogue public" />
          ) : (
            <ul className="divide-y divide-line">
              {data.recent.map((e) => (
                <li key={e.id} className="flex items-center gap-3 py-3">
                  <Avatar name={e.learnerName} />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold">{e.learnerName}</p>
                    <p className="truncate text-xs text-mutedfg">
                      {e.formationTitle} · {LEVEL_LABEL[e.level]} · <span className="font-mono">{formatRange(e.sessionStartDate, e.sessionEndDate)}</span>
                    </p>
                  </div>
                  <Badge tone={ENROLLMENT_STATUS_TONE[e.status]}>{ENROLLMENT_STATUS_LABEL[e.status]}</Badge>
                </li>
              ))}
            </ul>
          )}
        </Panel>
      </div>

      {/* ===== Carte des modules ===== */}
      <section>
        <p className="mb-3 font-mono text-[11px] uppercase tracking-[0.18em] text-mutedfg">Tous les modules</p>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 xl:grid-cols-7">
          {MODULES.map((m, i) => (
            <motion.div key={m.label} initial={{ opacity: 0, scale: 0.94 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.45 + i * 0.04, ease: EASE }}>
              <Link href={m.href} className="group flex h-full flex-col items-start gap-4 rounded-2xl border border-line bg-white p-4 transition-all duration-300 hover:-translate-y-1 hover:border-orange hover:shadow-soft">
                <span className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-orangeL text-orange transition-all duration-500 group-hover:rotate-[-8deg] group-hover:bg-orange group-hover:text-white">
                  <m.icon size={22} />
                </span>
                <span className="w-full">
                  <span className="block text-sm font-semibold">{m.label}</span>
                  <span className="mt-0.5 flex items-center justify-between font-mono text-[11px] text-mutedfg">
                    {m.count}
                    <SlideArrow size={13} />
                  </span>
                </span>
              </Link>
            </motion.div>
          ))}
        </div>
      </section>
    </div>
  );
}

function EmptyMini({ icon: Icon, text, href, cta }: { icon: LucideIcon; text: string; href: string; cta: string }) {
  return (
    <div className="flex flex-col items-center rounded-2xl bg-muted/50 px-4 py-10 text-center">
      <span className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-white text-orange">
        <Icon size={22} />
      </span>
      <p className="mt-3 text-sm text-mutedfg">{text}</p>
      <Link href={href} className="group mt-3 inline-flex items-center gap-1.5 text-sm font-semibold text-orange">
        {cta} <SlideArrow size={14} />
      </Link>
    </div>
  );
}
