"use client";

import { useEffect, useState } from "react";
import { Coins, Euro, DollarSign, ArrowLeftRight } from "lucide-react";
import { formatAmount } from "@/lib/currency";
import { formatDate } from "@/lib/labels";
import ArrowButton from "@/components/ui/ArrowButton";
import { Field, Skeleton } from "@/components/ui/primitives";
import { useAdmin } from "../_lib/AdminContext";
import { AdminHeader, Panel } from "../_components/kit";

export default function RatesAdmin() {
  const { stats, mutate } = useAdmin();
  const [eur, setEur] = useState("");
  const [usd, setUsd] = useState("");
  const [saving, setSaving] = useState(false);
  const [sample, setSample] = useState("75000");

  useEffect(() => {
    if (stats) {
      setEur(String(stats.rates.fcfaPerUnit.EUR));
      setUsd(String(stats.rates.fcfaPerUnit.USD));
    }
  }, [stats]);

  if (!stats) return <Skeleton className="h-96" />;
  const amount = Number(sample) || 0;

  return (
    <div>
      <AdminHeader icon={Coins} title="Taux de change" subtitle={`Devise de référence : FCFA · mis à jour le ${formatDate(stats.rates.updatedAt)}`} />
      <div className="grid gap-4 lg:grid-cols-2">
        <Panel title="Taux appliqués aux inscriptions" icon={Coins}>
          <form
            className="space-y-5"
            onSubmit={async (e) => {
              e.preventDefault();
              setSaving(true);
              await mutate("/api/rates", { method: "PATCH", json: { EUR: Number(eur), USD: Number(usd) } }, "Taux mis à jour");
              setSaving(false);
            }}
          >
            {[
              { icon: Euro, label: "1 EUR = ? FCFA", v: eur, set: setEur },
              { icon: DollarSign, label: "1 USD = ? FCFA", v: usd, set: setUsd },
            ].map((r) => (
              <Field key={r.label} label={r.label}>
                <span className="relative block">
                  <r.icon size={16} className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-orange" />
                  <input required type="number" step="0.01" min="0.01" className="field pl-11 font-mono" value={r.v} onChange={(e) => r.set(e.target.value)} />
                </span>
              </Field>
            ))}
            <ArrowButton type="submit" loading={saving}>
              Enregistrer les taux
            </ArrowButton>
          </form>
        </Panel>

        <Panel title="Simulateur" icon={ArrowLeftRight}>
          <Field label="Montant en FCFA">
            <input type="number" className="field font-mono" value={sample} onChange={(e) => setSample(e.target.value)} />
          </Field>
          <div className="mt-5 grid grid-cols-2 gap-3">
            <div className="rounded-2xl bg-ink p-5 text-white">
              <p className="font-mono text-[10px] uppercase text-white/50">En euros</p>
              <p className="h-display mt-1 text-3xl">{Number(eur) > 0 ? formatAmount(amount / Number(eur), "EUR") : "—"}</p>
            </div>
            <div className="rounded-2xl bg-orange p-5 text-white">
              <p className="font-mono text-[10px] uppercase text-white/70">En dollars</p>
              <p className="h-display mt-1 text-3xl">{Number(usd) > 0 ? formatAmount(amount / Number(usd), "USD") : "—"}</p>
            </div>
          </div>
          <p className="mt-4 text-xs text-mutedfg">Les prix restent saisis en FCFA ; ces taux servent à l&rsquo;affichage et aux paiements en devise.</p>
        </Panel>
      </div>
    </div>
  );
}
