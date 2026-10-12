"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Building2, CalendarRange, Clock, Mail, MapPin, NotebookPen, Phone, Target, UserCheck, CheckCircle2, AlertTriangle } from "lucide-react";
import type { AlternanceLog, Placement } from "@/lib/types";
import { PLACEMENT_RESULT_LABEL, PLACEMENT_RESULT_TONE, PLACEMENT_STATUS_LABEL, PLACEMENT_STATUS_TONE, formatRange } from "@/lib/labels";
import { Badge } from "@/components/ui/primitives";
import { LogForm, Logbook, type Api } from "./EquipmentUI";
import { HoursBar } from "./AlternanceUI";

export type LearnerPlacement = Placement & {
  club: { name: string; city: string; address: string } | null;
  tutor: { name: string; phone: string; email: string } | null;
  hours: { validated: number; pending: number };
  logs: AlternanceLog[];
};

/** Bloc « Mon alternance » de l'espace apprenant. */
export default function LearnerAlternance({ placements, reload }: { placements: LearnerPlacement[]; reload: () => Promise<void> }) {
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const api: Api = async (url, init, success) => {
    const res = await fetch(url, {
      method: init.method,
      headers: init.json !== undefined ? { "Content-Type": "application/json" } : undefined,
      body: init.json !== undefined ? JSON.stringify(init.json) : undefined,
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      setMsg({ ok: false, text: data.error ?? "Une erreur est survenue." });
      return false;
    }
    await reload();
    setMsg(success ? { ok: true, text: success } : null);
    setTimeout(() => setMsg(null), 3500);
    return true;
  };

  if (placements.length === 0) return null;
  const sorted = [...placements].sort((a, b) => (a.status === "en_cours" ? -1 : b.status === "en_cours" ? 1 : a.startDate < b.startDate ? 1 : -1));

  return (
    <section id="alternance" className="mt-12 scroll-mt-24">
      <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="tag-label">Alternance</p>
          <h2 className="h-display mt-2 text-4xl">Mon alternance en club</h2>
        </div>
        {msg && (
          <p className={`flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold ${msg.ok ? "bg-success/10 text-success" : "bg-danger/10 text-danger"}`}>
            {msg.ok ? <CheckCircle2 size={15} /> : <AlertTriangle size={15} />} {msg.text}
          </p>
        )}
      </div>
      <div className="space-y-4">
        {sorted.map((p, i) => (
          <motion.div key={p.id} initial={{ opacity: 0, y: 14 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.06 }} className="card overflow-hidden">
            <div className="grid lg:grid-cols-5">
              <div className="relative overflow-hidden bg-ink p-6 text-white lg:col-span-2">
                <span className="court-lines pointer-events-none absolute inset-0 opacity-30" />
                <div className="relative">
                  <div className="flex flex-wrap gap-1.5">
                    <Badge tone={PLACEMENT_STATUS_TONE[p.status]}>{PLACEMENT_STATUS_LABEL[p.status]}</Badge>
                    {p.evaluation && <Badge tone={PLACEMENT_RESULT_TONE[p.evaluation.result]}>{PLACEMENT_RESULT_LABEL[p.evaluation.result]}</Badge>}
                  </div>
                  <p className="h-display mt-4 text-4xl">{p.club?.name ?? "Club partenaire"}</p>
                  <div className="mt-3 space-y-1.5 text-sm text-white/75">
                    {p.club && (
                      <p className="flex items-center gap-2">
                        <MapPin size={14} className="text-orange" /> {[p.club.address, p.club.city].filter(Boolean).join(", ")}
                      </p>
                    )}
                    <p className="flex items-center gap-2">
                      <CalendarRange size={14} className="text-orange" /> {formatRange(p.startDate, p.endDate)}
                    </p>
                    {p.schedule && (
                      <p className="flex items-center gap-2">
                        <Clock size={14} className="text-orange" /> {p.schedule}
                      </p>
                    )}
                  </div>
                  <div className="mt-5 rounded-2xl bg-white/10 p-4">
                    <p className="flex items-center gap-2 font-mono text-[10px] uppercase tracking-wider text-white/50">
                      <UserCheck size={12} /> Mon tuteur
                    </p>
                    {p.tutor ? (
                      <>
                        <p className="mt-1 font-semibold">{p.tutor.name}</p>
                        <div className="mt-1 flex flex-wrap gap-x-4 gap-y-1 text-xs text-white/70">
                          {p.tutor.phone && (
                            <a href={`tel:${p.tutor.phone}`} className="inline-flex items-center gap-1 hover:text-orange">
                              <Phone size={12} /> {p.tutor.phone}
                            </a>
                          )}
                          {p.tutor.email && (
                            <a href={`mailto:${p.tutor.email}`} className="inline-flex items-center gap-1 hover:text-orange">
                              <Mail size={12} /> {p.tutor.email}
                            </a>
                          )}
                        </div>
                      </>
                    ) : (
                      <p className="mt-1 text-sm text-white/70">En cours de désignation par MADES.</p>
                    )}
                  </div>
                  <div className="mt-5">
                    <HoursBar dark validated={p.hours.validated} pending={p.hours.pending} planned={p.hoursPlanned} />
                  </div>
                </div>
              </div>
              <div className="space-y-5 p-6 lg:col-span-3">
                {p.objectives && (
                  <div className="rounded-2xl bg-muted/70 p-4">
                    <p className="mb-1 flex items-center gap-2 text-sm font-semibold">
                      <Target size={14} className="text-orange" /> Objectifs
                    </p>
                    <p className="whitespace-pre-line text-sm text-mutedfg">{p.objectives}</p>
                  </div>
                )}
                {p.evaluation?.comment && (
                  <div className="rounded-2xl border border-line p-4">
                    <p className="mb-1 text-sm font-semibold">Appréciation du tuteur</p>
                    <p className="text-sm text-mutedfg">« {p.evaluation.comment} »</p>
                  </div>
                )}
                <div>
                  <p className="mb-3 flex items-center gap-2 text-sm font-semibold">
                    <NotebookPen size={16} className="text-orange" /> Mon carnet de bord
                  </p>
                  <Logbook logs={p.logs} api={api} canDelete={(l) => l.by.role === "learner" && l.status !== "valide"} />
                </div>
                {p.status !== "interrompu" && p.status !== "planifie" && (
                  <details className="rounded-2xl border border-line p-4" open={p.logs.length === 0 && p.status === "en_cours"}>
                    <summary className="cursor-pointer text-sm font-semibold">
                      <Building2 size={14} className="mr-1.5 inline text-orange" />
                      Déclarer une séance
                    </summary>
                    <div className="mt-4">
                      <LogForm placementId={p.id} api={api} hint="Votre tuteur validera la séance pour qu'elle compte dans vos heures." />
                    </div>
                  </details>
                )}
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </section>
  );
}
