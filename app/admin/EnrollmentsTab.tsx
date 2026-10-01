"use client";

import { useState } from "react";
import { AdminEnrollment } from "./types";
import { formatAmount } from "@/lib/currency";

const STATUS_LABEL: Record<AdminEnrollment["status"], string> = {
  en_attente: "En attente", confirmee: "Confirmée", terminee: "Terminée", annulee: "Annulée",
};
const STATUS_COLOR: Record<AdminEnrollment["status"], string> = {
  en_attente: "bg-orange/15 text-ink", confirmee: "bg-ink/5 text-ink/60",
  terminee: "bg-emerald-50 text-emerald-600", annulee: "bg-red-50 text-red-500",
};

export default function EnrollmentsTab({ enrollments, onChanged }: { enrollments: AdminEnrollment[]; onChanged: () => void }) {
  const [busyId, setBusyId] = useState<string | null>(null);

  async function setStatus(id: string, status: AdminEnrollment["status"]) {
    setBusyId(id);
    try {
      await fetch(`/api/enrollments/${id}`, {
        method: "PATCH", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      onChanged();
    } finally { setBusyId(null); }
  }

  if (enrollments.length === 0) return <p className="text-sm text-ink/60">Aucune inscription pour le moment.</p>;

  return (
    <div className="rounded-card border border-ink/15 overflow-hidden">
      <table className="w-full text-sm">
        <thead className="bg-ink text-white text-left">
          <tr>
            <th className="px-4 py-3 font-semibold">Apprenant</th>
            <th className="px-4 py-3 font-semibold">Formation</th>
            <th className="px-4 py-3 font-semibold">Session</th>
            <th className="px-4 py-3 font-semibold text-right">Montant</th>
            <th className="px-4 py-3 font-semibold">Statut</th>
            <th className="px-4 py-3 font-semibold">Actions</th>
          </tr>
        </thead>
        <tbody>
          {enrollments.map((e, i) => (
            <tr key={e.id} className={i % 2 === 0 ? "bg-ink/[0.02]" : "bg-white"}>
              <td className="px-4 py-3">{e.learnerName}</td>
              <td className="px-4 py-3">{e.formationTitle}</td>
              <td className="px-4 py-3 text-xs text-ink/50">{e.sessionStartDate} → {e.sessionEndDate}</td>
              <td className="px-4 py-3 text-right font-semibold">{formatAmount(e.amountFCFA, "FCFA")}</td>
              <td className="px-4 py-3">
                <span className={`text-xs font-semibold px-2 py-1 rounded-full ${STATUS_COLOR[e.status]}`}>
                  {STATUS_LABEL[e.status]}
                </span>
                {e.certificateIssued && <span className="ml-2 text-[10px] text-orange font-bold">🏅</span>}
              </td>
              <td className="px-4 py-3">
                <div className="flex flex-wrap gap-2">
                  {e.status === "en_attente" && (
                    <button disabled={busyId === e.id} onClick={() => setStatus(e.id, "confirmee")} className="text-xs font-semibold text-ink/60 hover:underline disabled:opacity-50">Confirmer paiement</button>
                  )}
                  {e.status === "confirmee" && (
                    <button disabled={busyId === e.id} onClick={() => setStatus(e.id, "terminee")} className="text-xs font-semibold text-emerald-600 hover:underline disabled:opacity-50">Marquer terminée + certificat</button>
                  )}
                  {e.status !== "annulee" && (
                    <button disabled={busyId === e.id} onClick={() => setStatus(e.id, "annulee")} className="text-xs font-semibold text-red-600 hover:underline disabled:opacity-50">Annuler</button>
                  )}
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
