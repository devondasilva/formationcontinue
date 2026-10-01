"use client";

import { useState } from "react";
import { AdminReview } from "./types";

export default function ReviewsTab({ reviews, onChanged }: { reviews: AdminReview[]; onChanged: () => void }) {
  const [busyId, setBusyId] = useState<string | null>(null);

  async function handleDelete(id: string) {
    setBusyId(id);
    try {
      await fetch(`/api/reviews/${id}`, { method: "DELETE" });
      onChanged();
    } finally { setBusyId(null); }
  }

  if (reviews.length === 0) return <p className="text-sm text-ink/60">Aucun avis pour le moment.</p>;

  return (
    <div className="space-y-3">
      {reviews.map((r) => (
        <div key={r.id} className="rounded-card border border-ink/15 p-4 flex items-start justify-between gap-3">
          <div>
            <p className="font-semibold text-ink text-sm">{r.learnerName} — {"★".repeat(r.rating)}</p>
            {r.comment && <p className="text-sm text-ink/60 mt-1">{r.comment}</p>}
          </div>
          <button disabled={busyId === r.id} onClick={() => handleDelete(r.id)} className="text-xs font-semibold text-red-600 hover:underline disabled:opacity-50 shrink-0">
            Retirer
          </button>
        </div>
      ))}
    </div>
  );
}
