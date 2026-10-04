import Link from "next/link";
import type { Metadata } from "next";
import { MapPin, User, CalendarX2, ArrowRight } from "lucide-react";
import { getFormations, getSessions, getEnrolledCount } from "@/lib/db";
import { SESSION_STATUS_LABEL, SESSION_STATUS_TONE, dateParts, formatRange } from "@/lib/labels";
import PageHero from "@/components/PageHero";
import Reveal from "@/components/Reveal";
import { Badge, Meter } from "@/components/ui/primitives";
import { LevelIcon } from "@/components/icons/DisciplineIcon";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Calendrier des sessions" };

export default function SessionsPage() {
  const formations = getFormations();
  const sessions = getSessions()
    .filter((s) => s.status !== "annulee")
    .map((s) => ({ ...s, enrolledCount: getEnrolledCount(s.id), formation: formations.find((f) => f.id === s.formationId) }))
    .sort((a, b) => (a.startDate > b.startDate ? 1 : -1));

  // Regroupement par mois pour une lecture « agenda ».
  const groups = new Map<string, typeof sessions>();
  for (const s of sessions) {
    const { month, year } = dateParts(s.startDate);
    const key = `${month} ${year}`;
    groups.set(key, [...(groups.get(key) ?? []), s]);
  }

  return (
    <div>
      <PageHero tag="Calendrier" title="Sessions" accent="à venir." text="Toutes les sessions programmées, tous niveaux confondus. Cliquez pour vous inscrire." />

      <div className="mx-auto max-w-content px-5 pb-24 sm:px-6">
        {sessions.length === 0 && (
          <div className="card flex flex-col items-center px-6 py-14 text-center">
            <span className="mb-4 inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-orangeL text-orange">
              <CalendarX2 size={26} strokeWidth={1.8} />
            </span>
            <p className="h-display text-2xl">Aucune session</p>
            <p className="mt-2 max-w-sm text-sm text-mutedfg">De nouvelles dates arrivent bientôt.</p>
          </div>
        )}

        <div className="space-y-12">
          {Array.from(groups.entries()).map(([month, list]) => (
            <section key={month}>
              <Reveal>
                <h2 className="h-display flex items-center gap-4 text-3xl capitalize">
                  {month}
                  <span className="h-px flex-1 bg-line" />
                  <span className="font-mono text-xs font-normal normal-case not-italic text-mutedfg">
                    {list.length} session{list.length > 1 ? "s" : ""}
                  </span>
                </h2>
              </Reveal>
              <div className="mt-5 space-y-3">
                {list.map((s, i) => {
                  const d = dateParts(s.startDate);
                  const left = Math.max(0, s.capacity - s.enrolledCount);
                  return (
                    <Reveal key={s.id} delay={i * 60}>
                      <Link
                        href={`/formations/${s.formationId}`}
                        className="group grid grid-cols-[auto_1fr_auto] items-center gap-4 rounded-card border border-line bg-white p-4 transition-all duration-300 hover:-translate-y-0.5 hover:border-orange hover:shadow-lift sm:gap-6 sm:p-5"
                      >
                        <span className="flex h-16 w-16 flex-col items-center justify-center rounded-2xl bg-ink text-white transition-colors duration-300 group-hover:bg-orange sm:h-20 sm:w-20">
                          <span className="h-display text-3xl leading-none sm:text-4xl">{d.day}</span>
                          <span className="font-mono text-[10px] uppercase">{d.month}</span>
                        </span>
                        <div className="min-w-0">
                          <div className="flex flex-wrap items-center gap-2">
                            {s.formation && (
                              <span className="inline-flex h-7 w-7 items-center justify-center rounded-lg bg-orangeL text-orange">
                                <LevelIcon level={s.formation.level} size={16} />
                              </span>
                            )}
                            <p className="truncate font-semibold">{s.formationTitle}</p>
                            <Badge tone={SESSION_STATUS_TONE[s.status]}>{SESSION_STATUS_LABEL[s.status]}</Badge>
                          </div>
                          <div className="mt-1.5 flex flex-wrap gap-x-4 gap-y-1 text-xs text-mutedfg">
                            <span className="font-mono">{formatRange(s.startDate, s.endDate)}</span>
                            <span className="inline-flex items-center gap-1">
                              <MapPin size={12} /> {s.location}
                            </span>
                            {s.instructor && (
                              <span className="inline-flex items-center gap-1">
                                <User size={12} /> {s.instructor}
                              </span>
                            )}
                          </div>
                          <div className="mt-3 flex max-w-xs items-center gap-2">
                            <Meter value={s.enrolledCount} max={s.capacity} />
                            <span className="whitespace-nowrap font-mono text-[10px] text-mutedfg">
                              {left} / {s.capacity} places
                            </span>
                          </div>
                        </div>
                        <span className="arrow-chip">
                          <ArrowRight size={16} />
                        </span>
                      </Link>
                    </Reveal>
                  );
                })}
              </div>
            </section>
          ))}
        </div>
      </div>
    </div>
  );
}
