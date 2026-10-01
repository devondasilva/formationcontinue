"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { MessageSquarePlus, Star, CheckCircle2 } from "lucide-react";
import type { Learner, Review } from "@/lib/types";
import { formatDate } from "@/lib/labels";
import ArrowButton from "@/components/ui/ArrowButton";
import { Field } from "@/components/ui/primitives";

export function Stars({ rating, size = 16, dark = false }: { rating: number; size?: number; dark?: boolean }) {
  return (
    <span className="inline-flex gap-0.5" aria-label={`${rating} sur 5`}>
      {[1, 2, 3, 4, 5].map((n) => (
        <Star key={n} size={size} className={n <= Math.round(rating) ? "fill-orange text-orange" : dark ? "fill-white/15 text-white/15" : "fill-muted text-muted"} />
      ))}
    </span>
  );
}

export default function ReviewsBlock({
  formationId,
  reviews,
  rating,
  onPosted,
}: {
  formationId: string;
  reviews: Review[];
  rating: { average: number; count: number };
  onPosted: () => void;
}) {
  const [open, setOpen] = useState(false);
  const [learner, setLearner] = useState<Learner | null>(null);
  const [score, setScore] = useState(5);
  const [hover, setHover] = useState(0);
  const [comment, setComment] = useState("");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [sending, setSending] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/learners/me")
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => d?.learner && setLearner(d.learner))
      .catch(() => null);
  }, []);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setSending(true);
    setError(null);
    try {
      const res = await fetch(`/api/formations/${formationId}/reviews`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: learner?.name ?? name,
          email: learner?.email ?? email,
          phone: learner?.phone ?? phone,
          rating: score,
          comment,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Une erreur est survenue.");
        return;
      }
      setDone(true);
      setOpen(false);
      setComment("");
      onPosted();
    } catch {
      setError("Impossible de contacter le serveur.");
    } finally {
      setSending(false);
    }
  }

  return (
    <section>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="tag-label">Avis</p>
          <h2 className="h-display mt-3 text-4xl">Ce qu&rsquo;en disent les coachs</h2>
        </div>
        {rating.count > 0 && (
          <div className="flex items-center gap-3">
            <span className="h-display text-5xl text-orange">{rating.average.toLocaleString("fr-FR")}</span>
            <div>
              <Stars rating={rating.average} />
              <p className="font-mono text-[11px] text-mutedfg">{rating.count} avis</p>
            </div>
          </div>
        )}
      </div>

      <div className="mt-6 space-y-3">
        {reviews.length === 0 && <p className="text-sm text-mutedfg">Pas encore d&rsquo;avis — soyez le premier à partager votre expérience.</p>}
        {reviews.map((r) => (
          <div key={r.id} className="card p-5">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <span className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-ink font-semibold text-white">
                  {r.learnerName.charAt(0).toUpperCase()}
                </span>
                <div>
                  <p className="text-sm font-semibold">{r.learnerName}</p>
                  <p className="font-mono text-[10px] text-mutedfg">{formatDate(r.createdAt)}</p>
                </div>
              </div>
              <Stars rating={r.rating} size={14} />
            </div>
            {r.comment && <p className="mt-3 text-sm leading-relaxed text-ink/80">{r.comment}</p>}
          </div>
        ))}
      </div>

      <div className="mt-5">
        {done && (
          <p className="mb-3 flex items-center gap-2 rounded-xl bg-success/10 px-4 py-3 text-sm text-success">
            <CheckCircle2 size={16} /> Merci, votre avis est publié.
          </p>
        )}
        {!open ? (
          <ArrowButton variant="outline" icon={MessageSquarePlus} onClick={() => setOpen(true)}>
            Donner mon avis
          </ArrowButton>
        ) : null}
        <AnimatePresence>
          {open && (
            <motion.form
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              onSubmit={submit}
              className="card overflow-hidden"
            >
              <div className="space-y-4 p-5">
                <div>
                  <span className="field-label">Votre note</span>
                  <div className="flex gap-1" onMouseLeave={() => setHover(0)}>
                    {[1, 2, 3, 4, 5].map((n) => (
                      <button
                        key={n}
                        type="button"
                        onMouseEnter={() => setHover(n)}
                        onClick={() => setScore(n)}
                        aria-label={`${n} étoile${n > 1 ? "s" : ""}`}
                        className="transition-transform hover:scale-125"
                      >
                        <Star size={28} className={n <= (hover || score) ? "fill-orange text-orange" : "fill-muted text-muted"} />
                      </button>
                    ))}
                  </div>
                </div>
                <Field label="Votre avis (facultatif)">
                  <textarea rows={3} className="field" value={comment} onChange={(e) => setComment(e.target.value)} placeholder="Ce que vous avez retenu, ce qui vous a aidé…" />
                </Field>
                {!learner && (
                  <div className="grid gap-3 sm:grid-cols-3">
                    <input required className="field" placeholder="Nom" value={name} onChange={(e) => setName(e.target.value)} />
                    <input required type="email" className="field" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} />
                    <input required className="field" placeholder="Téléphone" value={phone} onChange={(e) => setPhone(e.target.value)} />
                  </div>
                )}
                {error && <p className="text-sm text-danger">{error}</p>}
                <div className="flex items-center gap-3">
                  <ArrowButton type="submit" loading={sending} variant="dark">
                    Publier mon avis
                  </ArrowButton>
                  <button type="button" onClick={() => setOpen(false)} className="text-sm font-semibold text-mutedfg hover:text-ink">
                    Annuler
                  </button>
                </div>
              </div>
            </motion.form>
          )}
        </AnimatePresence>
      </div>
    </section>
  );
}
