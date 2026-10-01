"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

type Mode = "learner" | "admin";

export default function LoginClient() {
  const router = useRouter();
  const params = useSearchParams();
  const next = params.get("next");

  const [mode, setMode] = useState<Mode>(next === "/admin" ? "admin" : "learner");

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleLearnerSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await fetch("/api/auth/learner-login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, phone }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error ?? "Une erreur est survenue."); return; }
      router.push(next && next !== "/admin" ? next : "/dashboard");
      router.refresh();
    } catch {
      setError("Impossible de contacter le serveur. Réessayez.");
    } finally {
      setLoading(false);
    }
  }

  async function handleAdminSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await fetch("/api/auth/admin-login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error ?? "Une erreur est survenue."); return; }
      router.push("/admin");
      router.refresh();
    } catch {
      setError("Impossible de contacter le serveur. Réessayez.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="max-w-content mx-auto px-6 py-16">
      <div className="max-w-md mx-auto">
        <p className="tag-label mb-3">Connexion</p>
        <h1 className="font-display text-4xl font-bold text-ink">Accéder à votre espace</h1>

        <div className="mt-8 grid grid-cols-2 rounded-card border border-ink/15 overflow-hidden text-sm font-bold uppercase tracking-widest">
          <button type="button" onClick={() => setMode("learner")}
            className={`py-3 transition-colors ${mode === "learner" ? "bg-ink text-white" : "bg-white text-ink/50 hover:text-ink"}`}>
            Apprenant
          </button>
          <button type="button" onClick={() => setMode("admin")}
            className={`py-3 transition-colors ${mode === "admin" ? "bg-ink text-white" : "bg-white text-ink/50 hover:text-ink"}`}>
            Administration
          </button>
        </div>

        {mode === "learner" ? (
          <form onSubmit={handleLearnerSubmit} className="mt-8 space-y-4">
            <p className="text-sm text-ink/60">
              Entrez vos coordonnées. Si c&rsquo;est votre première connexion,
              votre espace apprenant est créé automatiquement.
            </p>
            <input required placeholder="Nom complet" value={name} onChange={(e) => setName(e.target.value)}
              className="w-full rounded-card border border-ink/20 px-4 py-3" />
            <input required type="email" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-card border border-ink/20 px-4 py-3" />
            <input required placeholder="Téléphone" value={phone} onChange={(e) => setPhone(e.target.value)}
              className="w-full rounded-card border border-ink/20 px-4 py-3" />
            {error && <p className="text-sm text-red-600 bg-red-50 rounded-card px-4 py-3">{error}</p>}
            <button type="submit" disabled={loading}
              className="w-full rounded-card bg-orange text-ink font-bold uppercase tracking-widest py-3.5 hover:bg-ink hover:text-white transition-colors disabled:opacity-60">
              {loading ? "Connexion…" : "Accéder à mon espace"}
            </button>
          </form>
        ) : (
          <form onSubmit={handleAdminSubmit} className="mt-8 space-y-4">
            <p className="text-sm text-ink/60">Accès réservé à l&rsquo;équipe pédagogique MADES.</p>
            <input required placeholder="Identifiant" value={username} onChange={(e) => setUsername(e.target.value)}
              className="w-full rounded-card border border-ink/20 px-4 py-3" />
            <input required type="password" placeholder="Mot de passe" value={password} onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded-card border border-ink/20 px-4 py-3" />
            {error && <p className="text-sm text-red-600 bg-red-50 rounded-card px-4 py-3">{error}</p>}
            <button type="submit" disabled={loading}
              className="w-full rounded-card bg-ink text-white font-bold uppercase tracking-widest py-3.5 hover:bg-orange hover:text-ink transition-colors disabled:opacity-60">
              {loading ? "Connexion…" : "Se connecter"}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
