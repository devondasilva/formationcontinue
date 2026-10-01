"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { GraduationCap, ShieldCheck, Eye, EyeOff, Award, Clock, CalendarCheck } from "lucide-react";
import ArrowButton from "@/components/ui/ArrowButton";
import { Field } from "@/components/ui/primitives";
import Marquee from "@/components/Marquee";
import { DisciplineIcon } from "@/components/icons/DisciplineIcon";
import { DISCIPLINES, DISCIPLINE_LABEL } from "@/lib/labels";

type Mode = "learner" | "admin";

const PERKS = [
  { icon: CalendarCheck, text: "Vos inscriptions et sessions à venir" },
  { icon: Clock, text: "Vos heures de formation continue" },
  { icon: Award, text: "Vos certificats PDF à télécharger" },
];

export default function LoginClient() {
  const router = useRouter();
  const params = useSearchParams();
  const next = params.get("next");

  const [mode, setMode] = useState<Mode>(next?.startsWith("/admin") ? "admin" : "learner");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [show, setShow] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function post(url: string, body: object, dest: string) {
    setError(null);
    setLoading(true);
    try {
      const res = await fetch(url, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Une erreur est survenue.");
        return;
      }
      router.push(dest);
      router.refresh();
    } catch {
      setError("Impossible de contacter le serveur. Réessayez.");
    } finally {
      setLoading(false);
    }
  }

  const safeNext = next && next.startsWith("/") && !next.startsWith("//") ? next : null;

  return (
    <div className="mx-auto grid min-h-[calc(100vh-6.5rem)] max-w-content gap-0 px-0 lg:grid-cols-2 lg:px-6 lg:py-10">
      {/* Panneau visuel */}
      <div className="relative hidden overflow-hidden rounded-card bg-orange p-10 text-white lg:flex lg:flex-col lg:justify-between">
        <span className="court-lines pointer-events-none absolute inset-0 opacity-60" />
        <Marquee items={["Former", "Certifier", "Progresser"]} outline className="h-display pointer-events-none absolute inset-x-0 bottom-[42%] text-[8rem] text-white/50" />
        <div className="relative">
          <p className="font-mono text-xs uppercase tracking-[0.16em] text-white/70">Espace MADES</p>
          <h1 className="h-display mt-4 text-7xl">
            Votre parcours,
            <br />
            en un coup d&rsquo;œil.
          </h1>
          <div className="mt-8 flex gap-2">
            {DISCIPLINES.map((d, i) => (
              <motion.span
                key={d}
                initial={{ opacity: 0, y: 16, rotate: -10 }}
                animate={{ opacity: 1, y: 0, rotate: 0 }}
                transition={{ delay: 0.15 + i * 0.08, type: "spring", stiffness: 260, damping: 18 }}
                className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-white/15 backdrop-blur animate-floaty"
                style={{ animationDelay: `${i * 0.4}s` }}
                title={DISCIPLINE_LABEL[d]}
              >
                <DisciplineIcon discipline={d} size={24} />
              </motion.span>
            ))}
          </div>
        </div>
        <ul className="relative space-y-3">
          {PERKS.map((p, i) => (
            <motion.li
              key={p.text}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 + i * 0.1 }}
              className="flex items-center gap-3 rounded-2xl bg-white/15 p-3 backdrop-blur"
            >
              <span className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-white text-orange">
                <p.icon size={20} />
              </span>
              <span className="text-sm font-semibold">{p.text}</span>
            </motion.li>
          ))}
        </ul>
      </div>

      {/* Formulaire */}
      <div className="flex items-center justify-center px-5 py-12 sm:px-10">
        <div className="w-full max-w-md">
          <p className="tag-label">Connexion</p>
          <h2 className="h-display mt-3 text-5xl">Accéder à mon espace</h2>

          <div className="relative mt-8 grid grid-cols-2 rounded-full bg-muted p-1" role="tablist">
            {(
              [
                { id: "learner", label: "Apprenant", icon: GraduationCap },
                { id: "admin", label: "Administration", icon: ShieldCheck },
              ] as const
            ).map((t) => (
              <button
                key={t.id}
                role="tab"
                aria-selected={mode === t.id}
                onClick={() => {
                  setMode(t.id);
                  setError(null);
                }}
                className={`relative flex items-center justify-center gap-2 rounded-full py-3 text-sm font-semibold transition-colors ${
                  mode === t.id ? "text-white" : "text-mutedfg hover:text-ink"
                }`}
              >
                {mode === t.id && <motion.span layoutId="login-tab" className="absolute inset-0 rounded-full bg-ink" transition={{ type: "spring", stiffness: 450, damping: 34 }} />}
                <t.icon size={16} className="relative" />
                <span className="relative">{t.label}</span>
              </button>
            ))}
          </div>

          <AnimatePresence mode="wait">
            {mode === "learner" ? (
              <motion.form
                key="learner"
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.25 }}
                onSubmit={(e) => {
                  e.preventDefault();
                  post("/api/auth/learner-login", { name, email, phone }, safeNext && !safeNext.startsWith("/admin") ? safeNext : "/dashboard");
                }}
                className="mt-8 space-y-4"
              >
                <p className="text-sm text-mutedfg">Pas de mot de passe : première connexion = espace créé automatiquement.</p>
                <Field label="Nom complet">
                  <input required autoComplete="name" className="field" value={name} onChange={(e) => setName(e.target.value)} />
                </Field>
                <Field label="Email">
                  <input required type="email" autoComplete="email" className="field" value={email} onChange={(e) => setEmail(e.target.value)} />
                </Field>
                <Field label="Téléphone">
                  <input required type="tel" autoComplete="tel" className="field" value={phone} onChange={(e) => setPhone(e.target.value)} />
                </Field>
                {error && <p className="rounded-xl bg-danger/10 px-4 py-3 text-sm text-danger">{error}</p>}
                <ArrowButton type="submit" full size="lg" loading={loading}>
                  Accéder à mon espace
                </ArrowButton>
              </motion.form>
            ) : (
              <motion.form
                key="admin"
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.25 }}
                onSubmit={(e) => {
                  e.preventDefault();
                  post("/api/auth/admin-login", { username, password }, safeNext?.startsWith("/admin") ? safeNext : "/admin");
                }}
                className="mt-8 space-y-4"
              >
                <p className="text-sm text-mutedfg">Accès réservé à l&rsquo;équipe pédagogique MADES.</p>
                <Field label="Identifiant">
                  <input required autoComplete="username" className="field" value={username} onChange={(e) => setUsername(e.target.value)} />
                </Field>
                <Field label="Mot de passe">
                  <span className="relative block">
                    <input
                      required
                      type={show ? "text" : "password"}
                      autoComplete="current-password"
                      className="field pr-12"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                    />
                    <button
                      type="button"
                      onClick={() => setShow((s) => !s)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 rounded-lg p-1.5 text-mutedfg hover:text-ink"
                      aria-label={show ? "Masquer le mot de passe" : "Afficher le mot de passe"}
                    >
                      {show ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </span>
                </Field>
                {error && <p className="rounded-xl bg-danger/10 px-4 py-3 text-sm text-danger">{error}</p>}
                <ArrowButton type="submit" full size="lg" variant="dark" loading={loading}>
                  Se connecter
                </ArrowButton>
              </motion.form>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
