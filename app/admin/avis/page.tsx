"use client";

import { useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Star, Trash2, MessageSquareOff } from "lucide-react";
import { formatDate } from "@/lib/labels";
import { LevelIcon } from "@/components/icons/DisciplineIcon";
import { EmptyState, Skeleton } from "@/components/ui/primitives";
import { useAdmin } from "../_lib/AdminContext";
import type { AdminReview } from "../_lib/types";
import { AdminHeader, Avatar, ConfirmDialog, FilterPills, IconAction } from "../_components/kit";

type F = "tous" | "5" | "4" | "3" | "bas";

export default function ReviewsAdmin() {
  const { stats, mutate } = useAdmin();
  const [f, setF] = useState<F>("tous");
  const [toDelete, setToDelete] = useState<AdminReview | null>(null);

  const list = useMemo(() => {
    if (!stats) return [];
    return [...stats.reviews]
      .filter((r) => f === "tous" || (f === "bas" ? r.rating <= 2 : r.rating === Number(f)))
      .sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1));
  }, [stats, f]);

  if (!stats) return <Skeleton className="h-96" />;
  const avg = stats.reviews.length ? stats.reviews.reduce((s, r) => s + r.rating, 0) / stats.reviews.length : 0;
  const dist = [5, 4, 3, 2, 1].map((n) => ({ n, c: stats.reviews.filter((r) => r.rating === n).length }));
  const maxC = Math.max(1, ...dist.map((d) => d.c));

  return (
    <div>
      <AdminHeader icon={Star} title="Avis" subtitle="Modérez les retours publiés sur les fiches formation." />

      <div className="mb-6 grid gap-4 md:grid-cols-3">
        <div className="card flex items-center gap-5 p-6">
          <p className="h-display text-6xl text-orange">{avg ? avg.toFixed(1) : "—"}</p>
          <div>
            <div className="flex gap-0.5">
              {[1, 2, 3, 4, 5].map((n) => (
                <Star key={n} size={16} className={n <= Math.round(avg) ? "fill-orange text-orange" : "fill-muted text-muted"} />
              ))}
            </div>
            <p className="mt-1 text-xs text-mutedfg">{stats.reviews.length} avis au total</p>
          </div>
        </div>
        <div className="card p-6 md:col-span-2">
          <ul className="space-y-1.5">
            {dist.map((d, i) => (
              <li key={d.n} className="flex items-center gap-3 text-xs" title={`${d.c} avis à ${d.n} étoile(s)`}>
                <span className="w-8 font-mono">{d.n} ★</span>
                <div className="h-2 flex-1 overflow-hidden rounded-full bg-muted">
                  <motion.div className="h-full rounded-full bg-orange" initial={{ width: 0 }} animate={{ width: `${(d.c / maxC) * 100}%` }} transition={{ delay: i * 0.06, duration: 0.8 }} />
                </div>
                <span className="w-6 text-right font-mono text-mutedfg">{d.c}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      <div className="mb-5">
        <FilterPills
          value={f}
          onChange={setF}
          options={[
            { id: "tous", label: "Tous", count: stats.reviews.length },
            { id: "5", label: "5 ★", count: dist[0].c },
            { id: "4", label: "4 ★", count: dist[1].c },
            { id: "3", label: "3 ★", count: dist[2].c },
            { id: "bas", label: "1–2 ★", count: dist[3].c + dist[4].c },
          ]}
        />
      </div>

      {list.length === 0 ? (
        <EmptyState icon={MessageSquareOff} title="Aucun avis" text="Les avis laissés par les apprenants apparaîtront ici." />
      ) : (
        <div className="grid gap-3 lg:grid-cols-2">
          <AnimatePresence initial={false}>
            {list.map((r) => {
              const fm = stats.formations.find((x) => x.id === r.formationId);
              return (
                <motion.div key={r.id} layout initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, x: -30 }} className="card p-5">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <Avatar name={r.learnerName} />
                      <div>
                        <p className="text-sm font-semibold">{r.learnerName}</p>
                        <p className="font-mono text-[10px] text-mutedfg">{formatDate(r.createdAt)}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="flex gap-0.5">
                        {[1, 2, 3, 4, 5].map((n) => (
                          <Star key={n} size={14} className={n <= r.rating ? "fill-orange text-orange" : "fill-muted text-muted"} />
                        ))}
                      </span>
                      <IconAction icon={Trash2} label="Retirer l'avis" tone="danger" onClick={() => setToDelete(r)} />
                    </div>
                  </div>
                  {r.comment && <p className="mt-3 text-sm leading-relaxed text-ink/80">{r.comment}</p>}
                  {fm && (
                    <p className="mt-3 inline-flex items-center gap-1.5 rounded-full bg-muted px-2.5 py-1 text-[11px] font-semibold text-mutedfg">
                      <LevelIcon level={fm.level} size={12} /> {fm.title}
                    </p>
                  )}
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      )}

      <ConfirmDialog
        open={!!toDelete}
        title="Retirer cet avis ?"
        text="L'avis ne sera plus visible sur la fiche formation."
        confirmLabel="Retirer"
        onClose={() => setToDelete(null)}
        onConfirm={async () => {
          if (toDelete) await mutate(`/api/reviews/${toDelete.id}`, { method: "DELETE" }, "Avis retiré");
        }}
      />
    </div>
  );
}
