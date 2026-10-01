"use client";

import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import { Users, Mail, Phone, MessageCircle, Clock, Award, ClipboardCheck, UserX, FileSpreadsheet } from "lucide-react";
import { DISCIPLINES, DISCIPLINE_LABEL, ENROLLMENT_STATUS_LABEL, ENROLLMENT_STATUS_TONE, LEVELS, formatDate, formatRange } from "@/lib/labels";
import { DisciplineIcon } from "@/components/icons/DisciplineIcon";
import ArrowButton from "@/components/ui/ArrowButton";
import { Badge, EmptyState, Skeleton } from "@/components/ui/primitives";
import { useAdmin } from "../_lib/AdminContext";
import type { AdminLearner } from "../_lib/types";
import { AdminHeader, Avatar, Drawer, SearchBox } from "../_components/kit";

export default function LearnersAdmin() {
  const { stats } = useAdmin();
  const [q, setQ] = useState("");
  const [open, setOpen] = useState<AdminLearner | null>(null);

  const rows = useMemo(() => {
    if (!stats) return [];
    const term = q.trim().toLowerCase();
    return stats.learners
      .filter((l) => !term || `${l.name} ${l.email} ${l.phone}`.toLowerCase().includes(term))
      .map((l) => {
        const en = stats.enrollments.filter((e) => e.learnerId === l.id);
        const done = en.filter((e) => e.status === "terminee");
        return { l, en, hours: done.reduce((s, e) => s + e.durationHours, 0), certs: en.filter((e) => e.certificateIssued).length };
      })
      .sort((a, b) => (a.l.createdAt < b.l.createdAt ? 1 : -1));
  }, [stats, q]);

  if (!stats) return <Skeleton className="h-96" />;

  function exportCsv() {
    const lines = [["Nom", "Email", "Téléphone", "Inscrit le", "Inscriptions", "Heures validées", "Certificats"], ...rows.map((r) => [r.l.name, r.l.email, r.l.phone, r.l.createdAt.slice(0, 10), r.en.length, r.hours, r.certs])];
    const csv = "﻿" + lines.map((r) => r.map((v) => `"${String(v).replace(/"/g, '""')}"`).join(";")).join("\n");
    const url = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8" }));
    Object.assign(document.createElement("a"), { href: url, download: "apprenants-mades.csv" }).click();
    URL.revokeObjectURL(url);
  }

  const detail = open ? rows.find((r) => r.l.id === open.id) : null;

  return (
    <div>
      <AdminHeader
        icon={Users}
        title="Apprenants"
        subtitle={`${stats.learners.length} coachs inscrits sur la plateforme`}
        actions={
          <ArrowButton variant="outline" size="sm" icon={FileSpreadsheet} arrow={false} onClick={exportCsv}>
            Exporter CSV
          </ArrowButton>
        }
      />
      <div className="mb-5 flex justify-end">
        <SearchBox value={q} onChange={setQ} placeholder="Nom, email, téléphone…" />
      </div>

      {rows.length === 0 ? (
        <EmptyState icon={UserX} title="Aucun apprenant" text={q ? "Aucun résultat pour cette recherche." : "Les apprenants apparaissent ici dès leur première connexion ou inscription."} />
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {rows.map(({ l, en, hours, certs }, i) => (
            <motion.button
              key={l.id}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: Math.min(i, 9) * 0.03 }}
              onClick={() => setOpen(l)}
              className="group card flex flex-col p-5 text-left transition-all hover:-translate-y-0.5 hover:border-orange hover:shadow-lift"
            >
              <div className="flex items-center gap-3">
                <Avatar name={l.name} size={44} />
                <div className="min-w-0 flex-1">
                  <p className="truncate font-semibold">{l.name}</p>
                  <p className="truncate text-xs text-mutedfg">{l.email}</p>
                </div>
              </div>
              <div className="mt-4 grid grid-cols-3 gap-2 text-center">
                {[
                  { icon: ClipboardCheck, v: en.length, l: "inscr." },
                  { icon: Clock, v: `${hours}h`, l: "validées" },
                  { icon: Award, v: certs, l: "certif." },
                ].map((k) => (
                  <div key={k.l} className="rounded-xl bg-muted/60 py-2 transition-colors group-hover:bg-orangeL">
                    <p className="h-display text-xl">{k.v}</p>
                    <p className="inline-flex items-center gap-1 font-mono text-[9px] uppercase text-mutedfg">
                      <k.icon size={10} /> {k.l}
                    </p>
                  </div>
                ))}
              </div>
              <p className="mt-3 font-mono text-[10px] text-mutedfg">Depuis le {formatDate(l.createdAt)}</p>
            </motion.button>
          ))}
        </div>
      )}

      <Drawer open={!!detail} onClose={() => setOpen(null)} title="Fiche apprenant" icon={Users}>
        {detail && (
          <div className="space-y-6">
            <div className="flex items-center gap-4">
              <Avatar name={detail.l.name} size={60} />
              <div>
                <p className="h-display text-3xl">{detail.l.name}</p>
                <p className="font-mono text-xs text-mutedfg">Inscrit le {formatDate(detail.l.createdAt)}</p>
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              <a href={`mailto:${detail.l.email}`} className="inline-flex items-center gap-2 rounded-full border border-line bg-white px-4 py-2 text-xs font-semibold transition-colors hover:border-ink">
                <Mail size={14} /> {detail.l.email}
              </a>
              <a href={`tel:${detail.l.phone}`} className="inline-flex items-center gap-2 rounded-full border border-line bg-white px-4 py-2 text-xs font-semibold transition-colors hover:border-ink">
                <Phone size={14} /> {detail.l.phone}
              </a>
              <a
                href={`https://wa.me/${detail.l.phone.replace(/[^\d]/g, "")}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 rounded-full bg-success px-4 py-2 text-xs font-semibold text-white transition-transform hover:-translate-y-0.5"
              >
                <MessageCircle size={14} /> WhatsApp
              </a>
            </div>

            <div>
              <p className="field-label">Progression</p>
              <div className="grid grid-cols-2 gap-2">
                {DISCIPLINES.map((d) => {
                  const n = new Set(detail.en.filter((e) => e.discipline === d && e.status === "terminee").map((e) => e.level)).size;
                  return (
                    <div key={d} className="rounded-xl border border-line bg-white p-3">
                      <p className="flex items-center gap-2 text-xs font-semibold">
                        <DisciplineIcon discipline={d} size={15} className="text-orange" /> {DISCIPLINE_LABEL[d]}
                      </p>
                      <div className="mt-2 flex gap-1">
                        {LEVELS.map((l, i) => (
                          <span key={l} className={`h-1.5 flex-1 rounded-full ${i < n ? "bg-orange" : "bg-muted"}`} />
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div>
              <p className="field-label">Inscriptions ({detail.en.length})</p>
              {detail.en.length === 0 ? (
                <p className="text-sm text-mutedfg">Aucune inscription.</p>
              ) : (
                <ul className="space-y-2">
                  {detail.en.map((e) => (
                    <li key={e.id} className="flex items-center gap-3 rounded-xl border border-line bg-white p-3">
                      <span className="inline-flex h-9 w-9 items-center justify-center rounded-lg bg-ink text-white">
                        <DisciplineIcon discipline={e.discipline} size={18} />
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-semibold">{e.formationTitle}</p>
                        <p className="font-mono text-[10px] text-mutedfg">{formatRange(e.sessionStartDate, e.sessionEndDate)}</p>
                      </div>
                      <Badge tone={ENROLLMENT_STATUS_TONE[e.status]}>{ENROLLMENT_STATUS_LABEL[e.status]}</Badge>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        )}
      </Drawer>
    </div>
  );
}
