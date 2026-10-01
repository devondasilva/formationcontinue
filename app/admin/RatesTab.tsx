"use client";

import { useState } from "react";
import { AdminRates } from "./types";

export default function RatesTab({ rates, onChanged }: { rates: AdminRates; onChanged: () => void }) {
  const [eur, setEur] = useState(String(rates.fcfaPerUnit.EUR));
  const [usd, setUsd] = useState(String(rates.fcfaPerUnit.USD));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSaving(true);
    setSaved(false);
    try {
      const res = await fetch("/api/rates", {
        method: "PATCH", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ EUR: Number(eur), USD: Number(usd) }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error ?? "Une erreur est survenue."); return; }
      setSaved(true);
      onChanged();
    } finally { setSaving(false); }
  }

  return (
    <div className="max-w-md">
      <p className="text-sm text-ink/60 mb-6">
        Le FCFA est la devise de référence. Renseignez combien de FCFA valent
        1 EUR et 1 USD pour les inscriptions réglées dans ces devises.
      </p>
      <form onSubmit={handleSave} className="space-y-4">
        <div>
          <label className="block text-xs font-bold uppercase tracking-widest text-ink/40 mb-1">1 EUR = ? FCFA</label>
          <input required type="number" step="0.01" value={eur} onChange={(e) => setEur(e.target.value)}
            className="w-full rounded-card border border-ink/20 px-3 py-2.5" />
        </div>
        <div>
          <label className="block text-xs font-bold uppercase tracking-widest text-ink/40 mb-1">1 USD = ? FCFA</label>
          <input required type="number" step="0.01" value={usd} onChange={(e) => setUsd(e.target.value)}
            className="w-full rounded-card border border-ink/20 px-3 py-2.5" />
        </div>
        {error && <p className="text-sm text-red-600">{error}</p>}
        {saved && <p className="text-sm text-emerald-600">Taux mis à jour.</p>}
        <button type="submit" disabled={saving}
          className="rounded-card bg-ink text-white font-bold uppercase tracking-widest px-6 py-3 text-sm hover:bg-orange hover:text-ink transition-colors disabled:opacity-60">
          {saving ? "Enregistrement…" : "Mettre à jour les taux"}
        </button>
      </form>
    </div>
  );
}
