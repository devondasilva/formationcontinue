import Link from "next/link";
import { Search, CalendarCheck, Award, ArrowRight, ArrowUpRight, Quote } from "lucide-react";
import { getFormations, getSessions } from "@/lib/db";
import { DISCIPLINES, DISCIPLINE_DESC, DISCIPLINE_LABEL, LEVELS, LEVEL_DESC, LEVEL_LABEL, LEVEL_SUB } from "@/lib/labels";
import ModuleIcons from "@/components/ModuleIcons";
import Reveal from "@/components/Reveal";
import SplitTitle from "@/components/SplitTitle";
import Counter from "@/components/Counter";
import Marquee from "@/components/Marquee";
import RotatingBadge from "@/components/RotatingBadge";
import ArrowButton from "@/components/ui/ArrowButton";
import FormationCard from "@/components/FormationCard";
import { DisciplineIcon, LevelIcon, LEVEL_ICON } from "@/components/icons/DisciplineIcon";

export const dynamic = "force-dynamic";

const STEPS = [
  { icon: Search, title: "Choisissez", text: "Choisissez votre niveau, de JES 1 au Diplôme d'État : les 5 modules sportifs sont inclus." },
  { icon: CalendarCheck, title: "Inscrivez-vous", text: "Sélectionnez une session, renseignez vos coordonnées, payez par Mobile Money, carte ou virement." },
  { icon: Award, title: "Certifiez-vous", text: "Niveau validé = certificat PDF téléchargeable et heures créditées dans votre espace." },
];

const TESTIMONIALS = [
  { quote: "Un cadre clair pour progresser, niveau après niveau, jusqu'au Diplôme d'État.", who: "Éducateur certifié", role: "JES Niveau 2 · Cotonou" },
  { quote: "Cinq sports de raquette dans une seule formation : je peux encadrer tous les publics de mon club.", who: "Entraîneur certifié", role: "Entraîneur · Abidjan" },
  { quote: "Le certificat délivré a changé la façon dont les clubs me recrutent.", who: "Éducatrice certifiée", role: "JES Niveau 1 · Lomé" },
];

export default function HomePage() {
  const formations = getFormations().filter((f) => f.active);
  const openSessions = getSessions().filter((s) => s.status === "ouverte").length;
  const featured = [...formations].sort((a, b) => LEVELS.indexOf(a.level) - LEVELS.indexOf(b.level));
  const formationOf = (l: string) => formations.find((f) => f.level === l);

  return (
    <div className="overflow-x-clip">
      {/* ================= HERO ================= */}
      <section className="relative">
        <div className="grain pointer-events-none absolute inset-0" />
        <div className="relative mx-auto grid max-w-content gap-12 px-5 pb-16 pt-6 sm:px-6 md:pt-10 lg:grid-cols-12 lg:gap-10">
          <div className="lg:col-span-6 lg:pt-8">
            <Reveal from="left">
              <p className="tag-label">MADES · Formation continue &amp; apprentissage</p>
            </Reveal>
            <SplitTitle
              text="Apprendre le métier,"
              accent="le faire grandir."
              className="h-display mt-5 text-[clamp(3.2rem,7.2vw,6rem)] text-ink"
              delay={0.1}
            />
            <Reveal delay={350}>
              <p className="mt-6 max-w-md text-[17px] leading-relaxed text-mutedfg">
                Un parcours complet d&rsquo;apprentissage et de formation continue pour les éducateurs et entraîneurs de
                sports de raquette : tennis, beach tennis, padel, mini-tennis et pickleball.
              </p>
            </Reveal>
            <Reveal delay={450}>
              <div className="mt-8 flex flex-wrap gap-3">
                <ArrowButton href="/formations" size="lg">
                  Trouver ma formation
                </ArrowButton>
                <ArrowButton href="/parcours" variant="outline" size="lg">
                  Voir le parcours
                </ArrowButton>
              </div>
            </Reveal>

            <Reveal delay={550}>
              <dl className="mt-12 grid max-w-lg grid-cols-3 gap-6 border-t border-line pt-6">
                {[
                  { v: 4, l: "Niveaux de certification", plus: false },
                  { v: 5, l: "Modules par niveau", plus: false },
                  { v: openSessions, l: "Sessions ouvertes", plus: false },
                ].map((s) => (
                  <div key={s.l} className="flex flex-col-reverse">
                    <dt className="mt-1 font-mono text-[11px] leading-snug text-mutedfg">{s.l}</dt>
                    <dd className="h-display text-5xl text-ink">
                      <Counter value={s.v} />
                      {s.plus && <span className="text-orange">+</span>}
                    </dd>
                  </div>
                ))}
              </dl>
            </Reveal>
          </div>

          {/* Tuiles des 4 niveaux, coupées en biais comme sur mades-site */}
          <div className="relative lg:col-span-6">
            <div className="grid grid-cols-2 gap-2.5">
              {LEVELS.map((d, i) => {
                const left = i % 2 === 0;
                // Damier : blanc / orange en alternance.
                const orange = i === 1 || i === 2;
                const BigIcon = LEVEL_ICON[d];
                const f = formationOf(d);
                return (
                  <Reveal key={d} delay={250 + i * 120} from={left ? "left" : "right"}>
                    <Link
                      href={f ? `/formations/${f.id}` : `/formations?niveau=${d}`}
                      className={`group relative flex min-h-[210px] flex-col justify-end overflow-hidden p-5 sm:min-h-[270px] sm:p-6 ${
                        left ? "slant-r" : "slant-l"
                      } ${orange ? "bg-orange text-white" : "bg-white text-ink"}`}
                    >
                      <span className={`${orange ? "court-lines" : "court-lines-dark"} absolute inset-0 transition-transform duration-[1.2s] ease-out group-hover:scale-110`} />
                      <BigIcon
                        size={200}
                        strokeWidth={0.9}
                        className={`pointer-events-none absolute -right-8 -top-6 transition-all duration-700 ease-out group-hover:-rotate-12 group-hover:scale-110 ${
                          orange ? "text-white/25 group-hover:text-white/40" : "text-ink/[0.07] group-hover:text-orange/30"
                        }`}
                      />
                      <span
                        className={`absolute top-5 inline-flex h-10 w-10 items-center justify-center rounded-full opacity-0 transition-all duration-500 group-hover:rotate-45 group-hover:opacity-100 ${
                          orange ? "bg-white text-orange" : "bg-orange text-white"
                        } ${left ? "right-9" : "right-5"}`}
                      >
                        <ArrowUpRight size={18} />
                      </span>
                      <span className={`relative block ${left ? "" : "pl-3"}`}>
                        <span className={`flex items-center gap-2 font-mono text-[11px] tracking-[0.16em] ${orange ? "text-white/85" : "text-orange"}`}>
                          0{i + 1}
                          <span
                            className={`inline-flex h-7 w-7 items-center justify-center rounded-lg animate-floaty ${orange ? "bg-white/20 text-white" : "bg-orange text-white"}`}
                            style={{ animationDelay: `${i * 0.5}s` }}
                          >
                            <LevelIcon level={d} size={15} />
                          </span>
                        </span>
                        <span className="h-display mt-2 block text-[2rem] transition-transform duration-500 group-hover:translate-x-1 sm:text-[2.6rem]">{LEVEL_LABEL[d]}</span>
                        <span className={`h-display mt-0.5 block text-base ${orange ? "text-white/80" : "text-mutedfg"}`}>{LEVEL_SUB[d]}</span>
                      </span>
                    </Link>
                  </Reveal>
                );
              })}
            </div>
            <div className="absolute -bottom-10 left-1/2 hidden -translate-x-1/2 sm:block">
              <RotatingBadge href="/formations" text="Formation · Certification · MADES · " light />
            </div>
          </div>
        </div>
      </section>

      {/* ================= BANDEAU NIVEAUX ================= */}
      <section className="relative z-10 mt-6 -rotate-[1.5deg] bg-orange py-5 text-white shadow-glow">
        <Marquee items={DISCIPLINES.map((d) => DISCIPLINE_LABEL[d])} outlineEvery className="h-display text-5xl md:text-7xl" />
      </section>

      {/* ================= EN 3 ÉTAPES ================= */}
      <section className="mx-auto max-w-content px-5 py-24 sm:px-6">
        <Reveal>
          <p className="tag-label">Simple comme 1, 2, 3</p>
          <h2 className="h-display mt-4 max-w-2xl text-5xl md:text-6xl">
            Votre certification <span className="text-orange">en trois étapes.</span>
          </h2>
        </Reveal>
        <div className="relative mt-14 grid gap-5 md:grid-cols-3">
          <div className="absolute left-0 right-0 top-10 hidden h-px border-t-2 border-dashed border-line md:block" />
          {STEPS.map((s, i) => (
            <Reveal key={s.title} delay={i * 140}>
              <div className="group relative h-full rounded-card border border-line bg-white p-7 transition-all duration-500 hover:-translate-y-1 hover:border-orange hover:shadow-lift">
                <div className="flex items-center justify-between">
                  <span className="inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-orangeL text-orange transition-all duration-500 group-hover:bg-orange group-hover:text-white">
                    <s.icon size={28} strokeWidth={1.8} />
                  </span>
                  <span className="h-display text-6xl text-muted transition-colors group-hover:text-orange/20">0{i + 1}</span>
                </div>
                <p className="h-display mt-6 text-3xl">{s.title}</p>
                <p className="mt-2 text-sm leading-relaxed text-mutedfg">{s.text}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </section>

      {/* ================= DISCIPLINES ================= */}
      <section className="bg-white py-24">
        <div className="mx-auto max-w-content px-5 sm:px-6">
          <div className="flex flex-wrap items-end justify-between gap-6">
            <Reveal>
              <p className="tag-label">Les modules</p>
              <h2 className="h-display mt-4 max-w-2xl text-5xl md:text-6xl">
                Cinq sports de raquette, <span className="text-orange">à chaque niveau.</span>
              </h2>
            </Reveal>
            <Reveal delay={120}>
              <ArrowButton href="/formations" variant="outline">
                Toutes les formations
              </ArrowButton>
            </Reveal>
          </div>

          <div className="mt-12 divide-y divide-line border-y border-line">
            {DISCIPLINES.map((d, i) => (
              <Reveal key={d} delay={i * 80}>
                <Link
                  href={`/formations?module=${d}`}
                  className="group relative grid grid-cols-[auto_1fr_auto] items-center gap-5 overflow-hidden py-7 md:grid-cols-[4rem_auto_1fr_auto] md:gap-8"
                >
                  <span className="absolute inset-0 origin-bottom scale-y-0 bg-orange transition-transform duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:scale-y-100" />
                  <span className="relative hidden font-mono text-sm text-mutedfg transition-colors group-hover:text-white/70 md:block">0{i + 1}</span>
                  <span className="relative inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-ink text-white transition-all duration-500 group-hover:rotate-[-8deg] group-hover:bg-white group-hover:text-orange md:h-20 md:w-20">
                    <DisciplineIcon discipline={d} size={36} />
                  </span>
                  <div className="relative md:grid md:grid-cols-[minmax(0,16rem)_1fr] md:items-center md:gap-8">
                    <p className="h-display text-4xl transition-colors group-hover:text-white md:text-5xl">{DISCIPLINE_LABEL[d]}</p>
                    <p className="mt-1 hidden text-sm leading-relaxed text-mutedfg transition-colors group-hover:text-white/85 sm:block">
                      {DISCIPLINE_DESC[d]}
                    </p>
                  </div>
                  <span className="arrow-chip relative group-hover:!border-white group-hover:!bg-white group-hover:!text-orange">
                    <ArrowRight size={18} />
                  </span>
                </Link>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ================= PARCOURS ================= */}
      <section className="relative overflow-hidden bg-ink py-24 text-white">
        <div className="pointer-events-none absolute -right-40 -top-40 h-[30rem] w-[30rem] rounded-full bg-orange/20 blur-3xl" />
        <div className="relative mx-auto max-w-content px-5 sm:px-6">
          <Reveal>
            <p className="tag-label">Le parcours</p>
            <h2 className="h-display mt-4 max-w-2xl text-5xl md:text-6xl">
              Du JES Niveau 1 <span className="text-orange">au Diplôme d&rsquo;État.</span>
            </h2>
          </Reveal>

          <div className="relative mt-14 grid gap-4 md:grid-cols-4">
            <div className="absolute left-[12.5%] right-[12.5%] top-[2.25rem] hidden h-0.5 bg-gradient-to-r from-orange/30 via-orange to-orange md:block" />
            {LEVELS.map((l, i) => (
              <Reveal key={l} delay={i * 130}>
                <div
                  className={`group relative h-full rounded-card p-6 transition-all duration-500 hover:-translate-y-1.5 hover:shadow-glow ${
                    i % 2 === 0 ? "bg-white text-ink" : "bg-orange text-white"
                  }`}
                >
                  <span
                    className={`relative z-10 mx-auto flex h-[4.5rem] w-[4.5rem] items-center justify-center rounded-full border-4 border-ink transition-transform duration-500 group-hover:scale-110 md:mx-0 ${
                      i % 2 === 0 ? "bg-orange text-white" : "bg-white text-orange"
                    }`}
                  >
                    <LevelIcon level={l} size={28} />
                  </span>
                  <p className={`mt-5 font-mono text-xs ${i % 2 === 0 ? "text-orange" : "text-white/80"}`}>Niveau {i + 1}</p>
                  <p className="h-display mt-1 text-3xl">{LEVEL_LABEL[l]}</p>
                  <p className={`font-mono text-[10px] uppercase tracking-wider ${i % 2 === 0 ? "text-mutedfg" : "text-white/70"}`}>{LEVEL_SUB[l]}</p>
                  <p className={`mt-3 text-sm leading-relaxed ${i % 2 === 0 ? "text-mutedfg" : "text-white/85"}`}>{LEVEL_DESC[l]}</p>
                  <div className="mt-5">
                    <ModuleIcons modules={DISCIPLINES} size="sm" tone={i % 2 === 0 ? "dark" : "glass"} />
                  </div>
                </div>
              </Reveal>
            ))}
          </div>
          <Reveal delay={500}>
            <div className="mt-12">
              <ArrowButton href="/parcours">Suivre ma progression</ArrowButton>
            </div>
          </Reveal>
        </div>
      </section>

      {/* ================= À LA UNE ================= */}
      {featured.length > 0 && (
        <section className="mx-auto max-w-content px-5 py-24 sm:px-6">
          <Reveal>
            <p className="tag-label">S&rsquo;inscrire</p>
            <h2 className="h-display mt-4 text-5xl md:text-6xl">Choisissez votre niveau</h2>
          </Reveal>
          <div className="mt-12 grid gap-5 md:grid-cols-2">
            {featured.map((f, i) => (
              <Reveal key={f.id} delay={i * 120}>
                <FormationCard f={f} />
              </Reveal>
            ))}
          </div>
        </section>
      )}

      {/* ================= TÉMOIGNAGES ================= */}
      <section className="bg-sand py-24">
        <div className="mx-auto max-w-content px-5 sm:px-6">
          <Reveal>
            <p className="tag-label">Témoignages</p>
            <h2 className="h-display mt-4 max-w-xl text-5xl md:text-6xl">Champions que nous avons formés</h2>
          </Reveal>
          <div className="mt-12 grid gap-5 md:grid-cols-3">
            {TESTIMONIALS.map((t, i) => (
              <Reveal key={t.who} delay={i * 120}>
                <figure className="group relative h-full rounded-card bg-white p-7 transition-all duration-500 hover:-translate-y-1 hover:shadow-lift">
                  <Quote size={30} className="text-orange transition-transform duration-500 group-hover:-rotate-12" />
                  <blockquote className="h-display mt-4 text-[1.65rem] leading-[1.05] text-ink">&ldquo;{t.quote}&rdquo;</blockquote>
                  <figcaption className="mt-6 border-t border-line pt-4">
                    <p className="text-sm font-semibold">{t.who}</p>
                    <p className="font-mono text-[11px] uppercase tracking-wider text-mutedfg">{t.role}</p>
                  </figcaption>
                </figure>
              </Reveal>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
