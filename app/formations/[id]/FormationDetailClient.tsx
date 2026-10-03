"use client";

import { useCallback, useEffect, useState } from "react";
import { Currency, Formation, PaymentMethod, Review, TrainingSession } from "@/lib/types";
import { formatAmount } from "@/lib/currency";
import { DISCIPLINE_LABEL, FORMAT_LABEL, LEVEL_LABEL } from "@/lib/labels";
import CurrencySelector from "@/components/CurrencySelector";

const PAYMENT_LABELS: Record<PaymentMethod, string> = {
  mtn_momo: "MTN Mobile Money", moov_money: "Moov Money", carte_bancaire: "Carte bancaire", virement: "Virement bancaire",
};

function Stars({ rating }: { rating: number }) {
  const full = Math.round(rating);
  return (
    <span className="text-orange" aria-hidden>
      {"★".repeat(full)}<span className="text-ink/20">{"★".repeat(5 - full)}</span>
    </span>
  );
}

export default function FormationDetailClient({ id }: { id: string }) {
  const [formation, setFormation] = useState<Formation | null>(null);
  const [sessions, setSessions] = useState<(TrainingSession & { enrolledCount: number })[]>([]);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [rating, setRating] = useState({ average: 0, count: 0 });
  const [notFound, setNotFound] = useState(false);

  const [selectedSessionId, setSelectedSessionId] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [currency, setCurrency] = useState<Currency>("FCFA");
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("mtn_momo");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const [reviewRating, setReviewRating] = useState(5);
  const [reviewComment, setReviewComment] = useState("");
  const [reviewName, setReviewName] = useState("");
  const [reviewEmail, setReviewEmail] = useState("");
  const [reviewPhone, setReviewPhone] = useState("");
  const [reviewDone, setReviewDone] = useState(false);
  const [reviewError, setReviewError] = useState<string | null>(null);

  const load = useCallback(() => {
    fetch(`/api/formations/${id}`).then(async (r) => {
      if (!r.ok) { setNotFound(true); return; }
      const d = await r.json();
      setFormation(d.formation);
      setSessions(d.sessions);
      setReviews(d.reviews);
      setRating(d.rating);
    });
  }, [id]);

  useEffect(() => { load(); }, [load]);

  async function handleEnroll(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedSessionId) return;
    setError(null);
    setLoading(true);
    try {
      const res = await fetch("/api/enrollments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, phone, sessionId: selectedSessionId, currency, paymentMethod }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error ?? "Une erreur est survenue."); return; }
      setSuccess(`Merci ${data.learner.name} ! Votre inscription est enregistrée, en attente de confirmation de paiement. Retrouvez-la depuis votre espace apprenant.`);
      setSelectedSessionId(null);
      load();
    } catch {
      setError("Impossible de contacter le serveur. Réessayez.");
    } finally {
      setLoading(false);
    }
  }

  async function handleReview(e: React.FormEvent) {
    e.preventDefault();
    setReviewError(null);
    try {
      const res = await fetch(`/api/formations/${id}/reviews`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: reviewName, email: reviewEmail, phone: reviewPhone, rating: reviewRating, comment: reviewComment }),
      });
      const data = await res.json();
      if (!res.ok) { setReviewError(data.error ?? "Une erreur est survenue."); return; }
      setReviewDone(true);
      setReviewComment("");
      load();
    } catch {
      setReviewError("Impossible de contacter le serveur. Réessayez.");
    }
  }

  if (notFound) {
    return <div className="max-w-content mx-auto px-6 py-16">Formation introuvable.</div>;
  }
  if (!formation) {
    return <div className="max-w-content mx-auto px-6 py-16">Chargement…</div>;
  }

  return (
    <div className="max-w-content mx-auto px-6 py-16">
      <div className="grid md:grid-cols-12 gap-12">
        <div className="md:col-span-7">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold uppercase tracking-widest text-ink/60">
              {formation.modules.map((m) => DISCIPLINE_LABEL[m.discipline]).join(" · ") || "Aucun module"}
            </span>
            <span className="text-ink/20">·</span>
            <span className="text-xs font-bold uppercase tracking-widest text-orange">{LEVEL_LABEL[formation.level]}</span>
          </div>
          <h1 className="font-display text-4xl font-bold text-ink mt-2">{formation.title}</h1>
          <div className="mt-2 flex items-center gap-2">
            <Stars rating={rating.average} />
            <span className="text-sm text-ink/50">
              {rating.count > 0 ? `${rating.average}/5 · ${rating.count} avis` : "Pas encore d'avis"}
            </span>
          </div>
          <p className="mt-6 text-ink/70 leading-relaxed">{formation.description}</p>

          <div className="mt-6 grid grid-cols-2 gap-4 max-w-md">
            <InfoBox label="Durée" value={`${formation.durationHours} heures`} />
            <InfoBox label="Format" value={FORMAT_LABEL[formation.format]} />
            <InfoBox label="Tarif" value={formatAmount(formation.priceFCFA, "FCFA")} />
            <InfoBox label="Certification" value={formation.certification} />
          </div>

          {formation.prerequisites && (
            <div className="mt-6">
              <p className="text-xs font-bold uppercase tracking-widest text-ink/50 mb-1">Prérequis</p>
              <p className="text-sm text-ink/70">{formation.prerequisites}</p>
            </div>
          )}

          {formation.syllabus.length > 0 && (
            <div className="mt-6">
              <p className="text-xs font-bold uppercase tracking-widest text-ink/50 mb-2">Programme</p>
              <ul className="space-y-1.5">
                {formation.syllabus.map((s, i) => (
                  <li key={i} className="text-sm text-ink/70 flex gap-2">
                    <span className="text-orange">•</span> {s}
                  </li>
                ))}
              </ul>
            </div>
          )}

          <div className="mt-10">
            <p className="text-xs font-bold uppercase tracking-widest text-ink/50 mb-3">Sessions programmées</p>
            <div className="space-y-3">
              {sessions.length === 0 && <p className="text-sm text-ink/50">Aucune session programmée pour le moment.</p>}
              {sessions.map((s) => {
                const full = s.enrolledCount >= s.capacity || s.status !== "ouverte";
                return (
                  <div key={s.id} className="rounded-card border border-ink/15 p-4 flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <p className="font-semibold text-ink text-sm">{s.startDate} → {s.endDate}</p>
                      <p className="text-xs text-ink/50">{s.location} · {s.instructor} · {s.enrolledCount}/{s.capacity} inscrits</p>
                    </div>
                    <button
                      disabled={full}
                      onClick={() => { setSelectedSessionId(s.id); setSuccess(null); setError(null); }}
                      className="text-xs font-bold uppercase tracking-widest px-4 py-2 rounded-card bg-ink text-white hover:bg-orange hover:text-ink transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                    >
                      {full ? "Complet" : "S'inscrire"}
                    </button>
                  </div>
                );
              })}
            </div>
          </div>

          {success && (
            <div className="mt-6 rounded-card bg-ink/5 border border-ink/10 px-5 py-4">
              <p className="text-sm text-ink">{success}</p>
            </div>
          )}

          {selectedSessionId && (
            <form onSubmit={handleEnroll} className="mt-6 rounded-card border border-ink/15 p-6 space-y-4 bg-white">
              <h3 className="font-display text-lg font-bold text-ink">Finaliser mon inscription</h3>
              <div className="grid sm:grid-cols-2 gap-3">
                <input required placeholder="Nom complet" value={name} onChange={(e) => setName(e.target.value)}
                  className="rounded-card border border-ink/20 px-3 py-2.5 text-sm" />
                <input required type="email" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)}
                  className="rounded-card border border-ink/20 px-3 py-2.5 text-sm" />
              </div>
              <input required placeholder="Téléphone" value={phone} onChange={(e) => setPhone(e.target.value)}
                className="w-full rounded-card border border-ink/20 px-3 py-2.5 text-sm" />
              <div>
                <p className="text-xs font-bold uppercase tracking-widest text-ink/50 mb-2">Devise</p>
                <CurrencySelector value={currency} onChange={setCurrency} />
              </div>
              <div>
                <p className="text-xs font-bold uppercase tracking-widest text-ink/50 mb-2">Paiement</p>
                <div className="grid grid-cols-2 gap-2">
                  {(Object.keys(PAYMENT_LABELS) as PaymentMethod[]).map((m) => (
                    <button type="button" key={m} onClick={() => setPaymentMethod(m)}
                      className={`text-xs font-semibold py-2.5 rounded-card border transition-colors ${
                        paymentMethod === m ? "border-orange bg-orange/10 text-ink" : "border-ink/15 text-ink/60"
                      }`}>
                      {PAYMENT_LABELS[m]}
                    </button>
                  ))}
                </div>
              </div>
              {error && <p className="text-sm text-red-600 bg-red-50 rounded-card px-4 py-3">{error}</p>}
              <div className="flex gap-3">
                <button type="submit" disabled={loading}
                  className="flex-1 py-3 bg-ink text-white font-bold uppercase tracking-widest text-xs rounded-card hover:bg-orange hover:text-ink transition-colors disabled:opacity-60">
                  {loading ? "Envoi…" : `Confirmer — ${formatAmount(formation.priceFCFA, "FCFA")}`}
                </button>
                <button type="button" onClick={() => setSelectedSessionId(null)}
                  className="px-5 rounded-card border border-ink/15 text-sm font-semibold text-ink/60">
                  Annuler
                </button>
              </div>
            </form>
          )}
        </div>

        <div className="md:col-span-5">
          <h2 className="font-display text-xl font-bold text-ink mb-4">Avis des apprenants</h2>
          <div className="space-y-4 mb-8 max-h-[22rem] overflow-y-auto pr-1">
            {reviews.length === 0 ? (
              <p className="text-sm text-ink/60">Aucun avis pour le moment.</p>
            ) : (
              reviews.map((r) => (
                <div key={r.id} className="rounded-card border border-ink/10 p-4">
                  <div className="flex items-center justify-between">
                    <p className="font-semibold text-ink text-sm">{r.learnerName}</p>
                    <Stars rating={r.rating} />
                  </div>
                  {r.comment && <p className="mt-2 text-sm text-ink/70">{r.comment}</p>}
                </div>
              ))
            )}
          </div>

          <div className="rounded-card border border-ink/15 p-5">
            <h3 className="font-display text-lg font-bold text-ink mb-3">Laisser un avis</h3>
            {reviewDone ? (
              <p className="text-sm text-ink/60 bg-ink/5 rounded-card px-4 py-3">Merci pour votre avis !</p>
            ) : (
              <form onSubmit={handleReview} className="space-y-3">
                <div>
                  <p className="text-sm font-semibold text-ink mb-1">Votre note</p>
                  <div className="flex gap-1">
                    {[1, 2, 3, 4, 5].map((n) => (
                      <button key={n} type="button" onClick={() => setReviewRating(n)}
                        className={`text-2xl leading-none ${n <= reviewRating ? "text-orange" : "text-ink/20"}`}>★</button>
                    ))}
                  </div>
                </div>
                <textarea placeholder="Votre avis (optionnel)" rows={3} value={reviewComment} onChange={(e) => setReviewComment(e.target.value)}
                  className="w-full rounded-card border border-ink/20 px-3 py-2 text-sm" />
                <div className="grid sm:grid-cols-2 gap-2">
                  <input required placeholder="Nom" value={reviewName} onChange={(e) => setReviewName(e.target.value)}
                    className="rounded-card border border-ink/20 px-3 py-2 text-sm" />
                  <input required placeholder="Téléphone" value={reviewPhone} onChange={(e) => setReviewPhone(e.target.value)}
                    className="rounded-card border border-ink/20 px-3 py-2 text-sm" />
                </div>
                <input required type="email" placeholder="Email" value={reviewEmail} onChange={(e) => setReviewEmail(e.target.value)}
                  className="w-full rounded-card border border-ink/20 px-3 py-2 text-sm" />
                {reviewError && <p className="text-xs text-red-600">{reviewError}</p>}
                <button type="submit" className="rounded-card bg-ink text-white font-semibold px-5 py-2.5 text-sm hover:bg-orange hover:text-ink transition-colors">
                  Publier mon avis
                </button>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function InfoBox({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-card bg-ink/5 p-4">
      <p className="text-xs text-ink/50">{label}</p>
      <p className="font-display font-bold text-ink">{value}</p>
    </div>
  );
}
