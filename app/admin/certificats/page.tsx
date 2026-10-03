"use client";

import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import { Award, Download, BadgeCheck, Hourglass, Inbox } from "lucide-react";
import { LEVEL_LABEL, formatRange } from "@/lib/labels";
import { LevelIcon } from "@/components/icons/DisciplineIcon";
import ArrowButton from "@/components/ui/ArrowButton";
import { EmptyState, Skeleton } from "@/components/ui/primitives";
import { useAdmin } from "../_lib/AdminContext";
import { AdminHeader, Avatar, FilterPills, IconAction, SearchBox } from "../_components/kit";

type Tab = "a-delivrer" | "delivres";

export default function CertificatesAdmin() {
  const { stats, mutate } = useAdmin();
  const [tab, setTab] = useState<Tab>("a-delivrer");
  const [q, setQ] = useState("");
  const today = new Date().toISOString().slice(0, 10);

  const { toIssue, issued } = useMemo(() => {
    if (!stats) return { toIssue: [], issued: [] };
    const term = q.trim().toLowerCase();
    const match = (s: string) => !term || s.toLowerCase().includes(term);
    return {
      // Paiement confirmé et session commencée : prêt à valider.
      toIssue: stats.enrollments.filter((e) => e.status === "confirmee" && e.sessionStartDate <= today && match(`${e.learnerName} ${e.formationTitle}`)),
      issued: stats.enrollments.filter((e) => e.certificateIssued && match(`${e.learnerName} ${e.formationTitle}`)),
    };
  }, [stats, q, today]);

  if (!stats) return <Skeleton className="h-96" />;
  const list = tab === "a-delivrer" ? toIssue : issued;

  return (
    <div>
      <AdminHeader icon={Award} title="Certificats" subtitle="Validez les formations suivies et téléchargez les certificats PDF." />
      <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <FilterPills
          value={tab}
          onChange={setTab}
          options={[
            { id: "a-delivrer", label: "À délivrer", icon: Hourglass, count: toIssue.length },
            { id: "delivres", label: "Délivrés", icon: BadgeCheck, count: issued.length },
          ]}
        />
        <SearchBox value={q} onChange={setQ} placeholder="Apprenant ou formation…" />
      </div>

      {list.length === 0 ? (
        <EmptyState
          icon={Inbox}
          title={tab === "a-delivrer" ? "Rien à délivrer" : "Aucun certificat"}
          text={tab === "a-delivrer" ? "Les inscriptions confirmées dont la session a commencé apparaîtront ici." : "Les certificats délivrés apparaîtront ici."}
        />
      ) : (
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {list.map((e, i) => (
            <motion.div
              key={e.id}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: Math.min(i, 9) * 0.04 }}
              className="group relative overflow-hidden rounded-card border border-line bg-white p-5 transition-all hover:-translate-y-0.5 hover:shadow-lift"
            >
              {/* Liseré « diplôme » */}
              <span className="absolute inset-y-0 left-0 w-1.5 bg-orange" />
              <Award size={120} strokeWidth={1} className="absolute -right-6 -top-6 text-ink/[0.04] transition-transform duration-700 group-hover:rotate-12" />
              <div className="relative flex items-center gap-3">
                <Avatar name={e.learnerName} size={40} />
                <div className="min-w-0">
                  <p className="truncate font-semibold">{e.learnerName}</p>
                  <p className="font-mono text-[10px] text-mutedfg">{formatRange(e.sessionStartDate, e.sessionEndDate)}</p>
                </div>
              </div>
              <div className="relative mt-4 flex items-center gap-2 rounded-xl bg-muted/60 p-3">
                <LevelIcon level={e.level} size={20} className="text-orange" />
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium">{e.formationTitle}</p>
                  <p className="flex items-center gap-1 text-[11px] text-mutedfg">
                    <LevelIcon level={e.level} size={11} /> {LEVEL_LABEL[e.level]} · {e.durationHours} h
                  </p>
                </div>
              </div>
              <div className="relative mt-4 flex justify-end gap-2">
                {tab === "a-delivrer" ? (
                  <ArrowButton size="sm" icon={Award} onClick={() => mutate(`/api/enrollments/${e.id}`, { method: "PATCH", json: { status: "terminee" } }, `Certificat délivré à ${e.learnerName}`)}>
                    Valider et délivrer
                  </ArrowButton>
                ) : (
                  <IconAction icon={Download} label="Télécharger le PDF" tone="orange" href={`/api/enrollments/${e.id}/certificate`} />
                )}
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
