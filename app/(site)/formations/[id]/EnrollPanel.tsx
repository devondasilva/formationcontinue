"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import {
  Check,
  CalendarX2,
  MapPin,
  User,
  Smartphone,
  CreditCard,
  Landmark,
  ChevronLeft,
  PartyPopper,
  CalendarPlus,
  type LucideIcon,
} from "lucide-react";
import type { Currency, ExchangeRates, Formation, Learner, PaymentMethod, TrainingSession } from "@/lib/types";
import { PAYMENT_LABEL, dateParts, formatRange } from "@/lib/labels";
import { formatAmount, fromFCFA } from "@/lib/currency";
import CurrencySelector from "@/components/CurrencySelector";
import ArrowButton from "@/components/ui/ArrowButton";
import { Field, Meter } from "@/components/ui/primitives";

type SessionRow = TrainingSession & { enrolledCount: number };

const PAYMENT_ICON: Record<PaymentMethod, LucideIcon> = {
  mtn_momo: Smartphone,
  moov_money: Smartphone,
  carte_bancaire: CreditCard,
  virement: Landmark,
};

const STEPS = ["Session", "Coordonnées", "Paiement"];

/**
 * Inscription en 3 étapes courtes. Si l'apprenant est déjà connecté,
 * l'étape « Coordonnées » est sautée : deux clics suffisent.
 */
export default function EnrollPanel({
  formation,
  sessions,
  onEnrolled,
}: {
  formation: Formation;
  sessions: SessionRow[];
  onEnrolled: () => void;
}) {
  const [step, setStep] = useState(0);
  const [dir, setDir] = useState(1);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [learner, setLearner] = useState<Learner | null>(null);
  const [rates, setRates] = useState<ExchangeRates | null>(null);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [currency, setCurrency] = useState<Currency>("FCFA");
  const [payment, setPayment] = useState<PaymentMethod>("mtn_momo");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState<{ id: string; name: string } | null>(null);

  useEffect(() => {
    fetch("/api/learners/me")
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => d?.learner && setLearner(d.learner))
      .catch(() => null);
    fetch("/api/rates")
      .then((r) => r.json())
      .then((d) => setRates(d.rates))
      .catch(() => null);
  }, []);

  const bookable = useMemo(
    () => sessions.filter((s) => s.status !== "annulee" && s.status !== "terminee"),
    [sessions]
  );
  const selected = sessions.find((s) => s.id === sessionId) ?? null;
  const price =
    currency === "FCFA" || !rates
      ? formatAmount(formation.priceFCFA, "FCFA")
      : formatAmount(fromFCFA(formation.priceFCFA, currency, rates), currency);

  function go(to: number) {
    setDir(to > step ? 1 : -1);
    setError(null);
    setStep(to);
  }

  function next() {
    if (step === 0) go(learner ? 2 : 1);
    else go(step + 1);
  }
  function back() {
    go(step === 2 && learner ? 0 : step - 1);
  }

  async function submit() {
    if (!sessionId) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/enrollments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: learner?.name ?? name,
          email: learner?.email ?? email,
          phone: learner?.phone ?? phone,
          sessionId,
          currency,
          paymentMethod: payment,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Une erreur est survenue.");
        return;
      }
      setDone({ id: data.enrollment.id, name: data.learner.name });
      onEnrolled();
    } catch {
      setError("Impossible de contacter le serveur. Réessayez.");
    } finally {
      setLoading(false);
    }
  }

  // ---------- Confirmation ----------
  if (done) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.96 }}
        animate={{ opacity: 1, scale: 1 }}
        className="card overflow-hidden"
      >
        <div className="relative bg-orange px-6 py-10 text-center text-white">
          <motion.span
            initial={{ scale: 0, rotate: -90 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ type: "spring", stiffness: 260, damping: 16, delay: 0.1 }}
            className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-white text-orange"
          >
            <Check size={40} strokeWidth={3} />
          </motion.span>
          <p className="h-display mt-5 text-4xl">C&rsquo;est noté, {done.name.split(" ")[0]}&nbsp;!</p>
          <p className="mt-2 text-sm text-white/85">Inscription enregistrée, en attente de confirmation du paiement.</p>
        </div>
        <div className="space-y-3 p-6">
          <ArrowButton href="/dashboard" full variant="dark">
            Suivre mon inscription
          </ArrowButton>
          <a
            href={`/api/enrollments/${done.id}/calendar`}
            className="flex w-full items-center justify-center gap-2 rounded-full border border-line py-3 text-sm font-semibold transition-colors hover:border-ink"
          >
            <CalendarPlus size={16} /> Ajouter à mon agenda
          </a>
          <p className="flex items-center justify-center gap-1.5 pt-1 text-xs text-mutedfg">
            <PartyPopper size={14} className="text-orange" /> Vous recevrez votre certificat à l&rsquo;issue de la formation.
          </p>
        </div>
      </motion.div>
    );
  }

  return (
    <div className="card overflow-hidden" id="inscription">
      {/* En-tête prix + étapes */}
      <div className="bg-ink px-6 pb-5 pt-6 text-white">
        <div className="flex items-end justify-between gap-3">
          <div>
            <p className="font-mono text-[11px] uppercase tracking-[0.16em] text-white/50">Tarif</p>
            <p className="h-display mt-1 text-4xl">{price}</p>
          </div>
          <CurrencySelector value={currency} onChange={setCurrency} dark id="enroll" />
        </div>
        <ol className="mt-6 grid grid-cols-3 gap-2">
          {STEPS.map((label, i) => {
            const skipped = i === 1 && !!learner;
            const state = i < step ? "done" : i === step ? "current" : "todo";
            return (
              <li key={label} className={skipped ? "opacity-40" : ""}>
                <div className="h-1 overflow-hidden rounded-full bg-white/15">
                  <motion.div
                    className="h-full bg-orange"
                    initial={false}
                    animate={{ width: state === "todo" ? "0%" : "100%" }}
                    transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
                  />
                </div>
                <p className={`mt-2 flex items-center gap-1 text-[11px] font-semibold ${state === "todo" ? "text-white/40" : "text-white"}`}>
                  {state === "done" && <Check size={12} className="text-orange" />}
                  {i + 1}. {label}
                </p>
              </li>
            );
          })}
        </ol>
      </div>

      <div className="relative overflow-hidden p-6">
        <AnimatePresence mode="wait" custom={dir} initial={false}>
          <motion.div
            key={step}
            custom={dir}
            initial={{ opacity: 0, x: 40 * dir }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -40 * dir }}
            transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
          >
            {/* ---- Étape 1 : session ---- */}
            {step === 0 && (
              <div>
                <p className="text-sm font-semibold">Choisissez votre session</p>
                {bookable.length === 0 ? (
                  <div className="mt-4 flex flex-col items-center rounded-2xl bg-muted px-4 py-8 text-center">
                    <CalendarX2 size={28} className="text-mutedfg" />
                    <p className="mt-3 text-sm text-mutedfg">Aucune session programmée pour le moment.</p>
                    <Link href="/sessions" className="mt-2 text-sm font-semibold text-orange hover:underline">
                      Voir le calendrier
                    </Link>
                  </div>
                ) : (
                  <div className="mt-4 space-y-2.5" role="radiogroup" aria-label="Sessions">
                    {bookable.map((s) => {
                      const full = s.enrolledCount >= s.capacity || s.status !== "ouverte";
                      const left = Math.max(0, s.capacity - s.enrolledCount);
                      const active = sessionId === s.id;
                      const d = dateParts(s.startDate);
                      return (
                        <button
                          key={s.id}
                          type="button"
                          role="radio"
                          aria-checked={active}
                          disabled={full}
                          onClick={() => setSessionId(s.id)}
                          className={`group flex w-full items-center gap-4 rounded-2xl border-2 p-3 text-left transition-all duration-200 disabled:cursor-not-allowed disabled:opacity-50 ${
                            active ? "border-orange bg-orangeL" : "border-line hover:border-ink/30"
                          }`}
                        >
                          <span
                            className={`flex h-14 w-14 shrink-0 flex-col items-center justify-center rounded-xl transition-colors ${
                              active ? "bg-orange text-white" : "bg-ink text-white"
                            }`}
                          >
                            <span className="h-display text-2xl leading-none">{d.day}</span>
                            <span className="font-mono text-[10px] uppercase">{d.month}</span>
                          </span>
                          <span className="min-w-0 flex-1">
                            <span className="block text-sm font-semibold">{formatRange(s.startDate, s.endDate)}</span>
                            <span className="mt-0.5 flex items-center gap-1 truncate text-xs text-mutedfg">
                              <MapPin size={12} className="shrink-0" /> {s.location}
                            </span>
                            <span className="mt-2 flex items-center gap-2">
                              <Meter value={s.enrolledCount} max={s.capacity} />
                              <span className="whitespace-nowrap font-mono text-[10px] text-mutedfg">
                                {full ? "Complet" : `${left} place${left > 1 ? "s" : ""}`}
                              </span>
                            </span>
                          </span>
                          <span
                            className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full border-2 transition-colors ${
                              active ? "border-orange bg-orange text-white" : "border-line"
                            }`}
                          >
                            {active && <Check size={14} strokeWidth={3} />}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                )}
                {learner && (
                  <p className="mt-4 flex items-center gap-2 rounded-xl bg-muted px-3 py-2 text-xs text-mutedfg">
                    <User size={14} /> Connecté en tant que <strong className="text-ink">{learner.name}</strong>
                  </p>
                )}
                <div className="mt-6">
                  <ArrowButton full disabled={!sessionId} onClick={next}>
                    Continuer
                  </ArrowButton>
                </div>
              </div>
            )}

            {/* ---- Étape 2 : coordonnées ---- */}
            {step === 1 && (
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  next();
                }}
                className="space-y-4"
              >
                <p className="text-sm font-semibold">Vos coordonnées</p>
                <Field label="Nom complet">
                  <input required autoComplete="name" className="field" value={name} onChange={(e) => setName(e.target.value)} placeholder="Ex. Aïcha Dossou" />
                </Field>
                <Field label="Email">
                  <input required type="email" autoComplete="email" className="field" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="vous@exemple.com" />
                </Field>
                <Field label="Téléphone" hint="Pour vous joindre au sujet de la session.">
                  <input required type="tel" autoComplete="tel" className="field" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+229 …" />
                </Field>
                <p className="text-xs text-mutedfg">
                  Votre espace apprenant est créé automatiquement avec ces informations.{" "}
                  <Link href={`/login?next=/formations/${formation.id}`} className="font-semibold text-orange hover:underline">
                    Déjà inscrit ? Connectez-vous
                  </Link>
                </p>
                <div className="flex gap-2 pt-2">
                  <BackBtn onClick={back} />
                  <ArrowButton type="submit" full>
                    Continuer
                  </ArrowButton>
                </div>
              </form>
            )}

            {/* ---- Étape 3 : paiement ---- */}
            {step === 2 && (
              <div className="space-y-5">
                <div>
                  <p className="text-sm font-semibold">Mode de paiement</p>
                  <div className="mt-3 grid grid-cols-2 gap-2" role="radiogroup" aria-label="Mode de paiement">
                    {(Object.keys(PAYMENT_LABEL) as PaymentMethod[]).map((m) => {
                      const Icon = PAYMENT_ICON[m];
                      const active = payment === m;
                      return (
                        <button
                          key={m}
                          type="button"
                          role="radio"
                          aria-checked={active}
                          onClick={() => setPayment(m)}
                          className={`flex flex-col items-start gap-2 rounded-2xl border-2 p-3 text-left transition-all ${
                            active ? "border-orange bg-orangeL" : "border-line hover:border-ink/30"
                          }`}
                        >
                          <span className={`inline-flex h-9 w-9 items-center justify-center rounded-xl ${active ? "bg-orange text-white" : "bg-muted text-ink"}`}>
                            <Icon size={18} />
                          </span>
                          <span className="text-xs font-semibold leading-tight">{PAYMENT_LABEL[m]}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Récapitulatif */}
                <dl className="space-y-2 rounded-2xl bg-muted p-4 text-sm">
                  <Row label="Formation" value={formation.title} />
                  {selected && <Row label="Session" value={formatRange(selected.startDate, selected.endDate)} />}
                  <Row label="Apprenant" value={learner?.name ?? name} />
                  <div className="flex items-center justify-between border-t border-ink/10 pt-2">
                    <dt className="font-semibold">Total</dt>
                    <dd className="h-display text-2xl text-orange">{price}</dd>
                  </div>
                </dl>

                {error && <p className="rounded-xl bg-danger/10 px-4 py-3 text-sm text-danger">{error}</p>}

                <div className="flex gap-2">
                  <BackBtn onClick={back} />
                  <ArrowButton full loading={loading} onClick={submit}>
                    Confirmer mon inscription
                  </ArrowButton>
                </div>
                <p className="text-center text-[11px] text-mutedfg">Le paiement est confirmé par l&rsquo;équipe MADES après réception.</p>
              </div>
            )}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-start justify-between gap-4">
      <dt className="text-mutedfg">{label}</dt>
      <dd className="text-right font-medium">{value}</dd>
    </div>
  );
}

function BackBtn({ onClick }: { onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label="Étape précédente"
      className="inline-flex h-[3.1rem] w-[3.1rem] shrink-0 items-center justify-center rounded-full border border-line transition-colors hover:border-ink"
    >
      <ChevronLeft size={18} />
    </button>
  );
}
