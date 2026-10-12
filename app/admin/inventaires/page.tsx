"use client";

import { Suspense, useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ClipboardList, ClipboardCheck, Eye, CheckCircle2, RotateCcw, Building2, AlertTriangle, Camera, ScanLine } from "lucide-react";
import type { Inventory, InventoryStatus } from "@/lib/types";
import { CONDITION_LABEL, INVENTORY_MAX_AGE_DAYS, INVENTORY_STATUS_LABEL, INVENTORY_STATUS_TONE, daysSince, formatDate, dateParts } from "@/lib/labels";
import ArrowButton from "@/components/ui/ArrowButton";
import { Badge, EmptyState, Field, Skeleton } from "@/components/ui/primitives";
import { InventoryForm, type Api } from "@/components/network/EquipmentUI";
import { PhotoStrip } from "@/components/network/Photos";
import { useAdmin } from "../_lib/AdminContext";
import { AdminHeader, Drawer, FilterPills, IconAction, Panel } from "../_components/kit";

export default function Page() {
  return (
    <Suspense fallback={<Skeleton className="h-96" />}>
      <InventairesAdmin />
    </Suspense>
  );
}

type Filter = InventoryStatus | "tous";

function InventairesAdmin() {
  const { stats, mutate } = useAdmin();
  const [filter, setFilter] = useState<Filter>("soumis");
  const [club, setClub] = useState("");
  const [detail, setDetail] = useState<Inventory | null>(null);
  const [running, setRunning] = useState<string | null>(null);
  const [pickClub, setPickClub] = useState(false);
  const api: Api = (url, init, msg) => mutate(url, init, msg);

  const net = stats?.network;
  const list = useMemo(() => {
    if (!net) return [];
    return [...net.inventories]
      .filter((i) => filter === "tous" || i.status === filter)
      .filter((i) => !club || i.clubId === club)
      .sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1));
  }, [net, filter, club]);

  if (!stats || !net) return <Skeleton className="h-96" />;
  const clubOf = (id: string) => net.clubs.find((c) => c.id === id);
  const count = (s: InventoryStatus) => net.inventories.filter((i) => i.status === s).length;
  const overdue = net.summaries.filter((s) => s.inventoryOverdue);
  const current = detail ? net.inventories.find((i) => i.id === detail.id) ?? detail : null;

  return (
    <div>
      <AdminHeader
        icon={ClipboardList}
        title="Inventaires"
        subtitle={`Comptages réalisés par les coachs. Un inventaire sans écart est validé d'office ; un club doit être inventorié au moins tous les ${INVENTORY_MAX_AGE_DAYS} jours.`}
        actions={
          <ArrowButton icon={ScanLine} onClick={() => setPickClub(true)} disabled={net.clubs.length === 0}>
            Réaliser un inventaire
          </ArrowButton>
        }
      />

      {overdue.length > 0 && (
        <Panel title={`Inventaires en retard (${overdue.length})`} icon={AlertTriangle} className="mb-6 border-danger/30">
          <div className="flex flex-wrap gap-2">
            {overdue.map((s) => {
              const c = clubOf(s.clubId);
              const age = daysSince(s.lastInventoryDate);
              return (
                <button key={s.clubId} onClick={() => setRunning(s.clubId)} className="group inline-flex items-center gap-2 rounded-full border border-line bg-white py-1.5 pl-1.5 pr-4 text-xs font-semibold transition-colors hover:border-danger">
                  <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-danger/10 text-danger transition-colors group-hover:bg-danger group-hover:text-white">
                    <Building2 size={13} />
                  </span>
                  {c?.name}
                  <span className="font-mono font-normal text-mutedfg">{age === null ? "jamais" : `${age} j`}</span>
                </button>
              );
            })}
          </div>
        </Panel>
      )}

      <div className="mb-5 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <FilterPills
          value={filter}
          onChange={setFilter}
          options={[
            { id: "soumis", label: "À valider", count: count("soumis") },
            { id: "a_revoir", label: "À revoir", count: count("a_revoir") },
            { id: "valide", label: "Validés", count: count("valide") },
            { id: "tous", label: "Tous", count: net.inventories.length },
          ]}
        />
        <select className="field rounded-full py-2.5 sm:w-64" value={club} onChange={(e) => setClub(e.target.value)} aria-label="Club">
          <option value="">Tous les clubs</option>
          {net.clubs.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
      </div>

      {list.length === 0 ? (
        <EmptyState icon={ClipboardCheck} title={filter === "soumis" ? "Rien à valider" : "Aucun inventaire"} text={filter === "soumis" ? "Tous les inventaires reçus sont traités." : "Aucun inventaire pour ces filtres."} />
      ) : (
        <div className="grid gap-3 md:grid-cols-2 2xl:grid-cols-3">
          <AnimatePresence initial={false}>
            {list.map((inv, i) => {
              const d = dateParts(inv.date);
              const photos = inv.lines.reduce((n, l) => n + (l.photoIds?.length ?? 0), 0);
              const units = inv.lines.reduce((n, l) => n + l.countedQty, 0);
              return (
                <motion.div
                  key={inv.id}
                  layout
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.96 }}
                  transition={{ delay: Math.min(i, 9) * 0.03 }}
                  className="group card flex flex-col p-5 transition-all hover:-translate-y-0.5 hover:shadow-lift"
                >
                  <button onClick={() => setDetail(inv)} className="flex items-start gap-4 text-left">
                    <span className="flex h-16 w-16 shrink-0 flex-col items-center justify-center rounded-2xl bg-ink text-white transition-colors group-hover:bg-orange">
                      <span className="h-display text-3xl leading-none">{d.day}</span>
                      <span className="font-mono text-[10px] uppercase">
                        {d.month} {d.year.slice(2)}
                      </span>
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-semibold">{clubOf(inv.clubId)?.name ?? "Club supprimé"}</p>
                      <p className="truncate text-xs text-mutedfg">par {inv.by.name}</p>
                      <div className="mt-2">
                        <Badge tone={INVENTORY_STATUS_TONE[inv.status]}>{INVENTORY_STATUS_LABEL[inv.status]}</Badge>
                      </div>
                    </div>
                  </button>
                  <div className="mt-4 grid grid-cols-3 gap-2 text-center">
                    <Cell value={inv.lines.length} label="Articles" />
                    <Cell value={inv.discrepancies} label="Écarts" danger={inv.discrepancies > 0} />
                    <Cell value={units} label="Unités" />
                  </div>
                  {inv.comment && <p className="mt-3 line-clamp-2 text-xs text-mutedfg">« {inv.comment} »</p>}
                  <div className="mt-4 flex items-center gap-1.5 border-t border-line pt-4">
                    <IconAction icon={Eye} label="Détail" onClick={() => setDetail(inv)} />
                    {photos > 0 && (
                      <span className="inline-flex items-center gap-1 font-mono text-[11px] text-mutedfg">
                        <Camera size={12} /> {photos}
                      </span>
                    )}
                    <span className="flex-1" />
                    {inv.status !== "valide" && <IconAction icon={CheckCircle2} label="Valider" tone="success" onClick={() => mutate(`/api/inventories/${inv.id}`, { method: "PATCH", json: { status: "valide" } }, "Inventaire validé")} />}
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      )}

      <Drawer open={!!current} onClose={() => setDetail(null)} title="Inventaire" icon={ClipboardList}>
        {current && <InventoryDetail inv={current} onClose={() => setDetail(null)} />}
      </Drawer>

      <Drawer open={pickClub} onClose={() => setPickClub(false)} title="Quel club ?" icon={Building2}>
        <ul className="space-y-2">
          {net.clubs.map((c) => {
            const s = net.summaries.find((x) => x.clubId === c.id);
            return (
              <li key={c.id}>
                <button
                  disabled={!s?.items}
                  onClick={() => (setPickClub(false), setRunning(c.id))}
                  className="flex w-full items-center gap-3 rounded-2xl border border-line bg-white p-4 text-left transition-colors hover:border-ink disabled:opacity-50"
                >
                  <Building2 size={18} className="text-orange" />
                  <span className="flex-1">
                    <span className="block text-sm font-semibold">{c.name}</span>
                    <span className="block font-mono text-[11px] text-mutedfg">
                      {s?.items ?? 0} articles · {s?.lastInventoryDate ? `dernier ${formatDate(s.lastInventoryDate)}` : "jamais inventorié"}
                    </span>
                  </span>
                  {s?.inventoryOverdue && <Badge tone="danger">En retard</Badge>}
                </button>
              </li>
            );
          })}
        </ul>
      </Drawer>

      <Drawer open={!!running} onClose={() => setRunning(null)} title={running ? `Inventaire — ${clubOf(running)?.name ?? ""}` : "Inventaire"} icon={ScanLine}>
        {running && (
          <InventoryForm
            key={running}
            clubId={running}
            items={net.equipment.filter((e) => e.clubId === running)}
            coaches={net.coaches}
            api={api}
            onDone={() => setRunning(null)}
          />
        )}
      </Drawer>
    </div>
  );
}

function Cell({ value, label, danger }: { value: number; label: string; danger?: boolean }) {
  return (
    <div className="rounded-xl bg-muted/70 p-2">
      <p className={`h-display text-2xl leading-none ${danger ? "text-danger" : ""}`}>{value}</p>
      <p className="mt-1 font-mono text-[9px] uppercase tracking-wider text-mutedfg">{label}</p>
    </div>
  );
}

function InventoryDetail({ inv, onClose }: { inv: Inventory; onClose: () => void }) {
  const { stats, mutate } = useAdmin();
  const [comment, setComment] = useState(inv.reviewComment ?? "");
  const [busy, setBusy] = useState<"valide" | "a_revoir" | null>(null);
  if (!stats) return null;
  const net = stats.network;
  const club = net.clubs.find((c) => c.id === inv.clubId);
  const photos = (ids?: string[]) => net.photos.filter((p) => ids?.includes(p.id));
  const lines = [...inv.lines].sort((a, b) => Math.abs(b.countedQty - b.expectedQty) - Math.abs(a.countedQty - a.expectedQty));

  async function review(status: "valide" | "a_revoir") {
    setBusy(status);
    const ok = await mutate(`/api/inventories/${inv.id}`, { method: "PATCH", json: { status, comment } }, status === "valide" ? "Inventaire validé" : "Inventaire renvoyé au coach");
    setBusy(null);
    if (ok) onClose();
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <p className="font-semibold">{club?.name}</p>
          <p className="font-mono text-xs text-mutedfg">
            {formatDate(inv.date)} · {inv.by.name} ({inv.by.role === "admin" ? "administration" : "coach"})
          </p>
        </div>
        <Badge tone={INVENTORY_STATUS_TONE[inv.status]}>{INVENTORY_STATUS_LABEL[inv.status]}</Badge>
      </div>
      {inv.comment && <p className="rounded-2xl bg-muted/70 p-4 text-sm">« {inv.comment} »</p>}

      <div className="overflow-hidden rounded-2xl border border-line bg-white">
        <table className="w-full text-sm">
          <thead className="bg-muted/60 text-left font-mono text-[10px] uppercase tracking-wider text-mutedfg">
            <tr>
              <th className="px-3 py-2">Article</th>
              <th className="px-2 py-2 text-right">Attendu</th>
              <th className="px-2 py-2 text-right">Compté</th>
              <th className="px-3 py-2 text-right">Écart</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-line">
            {lines.map((l) => {
              const diff = l.countedQty - l.expectedQty;
              const ph = photos(l.photoIds);
              return (
                <tr key={l.itemId} className={diff !== 0 ? "bg-danger/[0.04]" : ""}>
                  <td className="px-3 py-2.5 align-top">
                    <p className="font-medium">{l.name}</p>
                    <p className="font-mono text-[10px] text-mutedfg">{l.code}</p>
                    {l.condition !== l.conditionBefore && (
                      <p className="mt-0.5 text-[11px] text-orangeD">
                        {CONDITION_LABEL[l.conditionBefore]} → {CONDITION_LABEL[l.condition]}
                      </p>
                    )}
                    {l.note && <p className="mt-0.5 text-[11px] text-mutedfg">« {l.note} »</p>}
                    {ph.length > 0 && (
                      <div className="mt-1.5">
                        <PhotoStrip photos={ph} size={40} />
                      </div>
                    )}
                  </td>
                  <td className="px-2 py-2.5 text-right align-top font-mono">{l.expectedQty}</td>
                  <td className="px-2 py-2.5 text-right align-top font-mono font-semibold">{l.countedQty}</td>
                  <td className={`px-3 py-2.5 text-right align-top font-mono font-semibold ${diff < 0 ? "text-danger" : diff > 0 ? "text-success" : "text-mutedfg"}`}>
                    {diff > 0 ? "+" : ""}
                    {diff}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <p className="text-xs text-mutedfg">Les quantités comptées ont déjà été reportées sur le parc. « À revoir » demande au coach de recompter.</p>

      {inv.reviewedBy && (
        <p className="text-xs text-mutedfg">
          Revu par {inv.reviewedBy.name} le {inv.reviewedAt ? new Date(inv.reviewedAt).toLocaleDateString("fr-FR") : ""}
          {inv.reviewComment ? ` — « ${inv.reviewComment} »` : ""}
        </p>
      )}

      <Field label="Commentaire de l'administration">
        <textarea rows={3} className="field" value={comment} onChange={(e) => setComment(e.target.value)} />
      </Field>
      <div className="flex flex-wrap gap-2">
        <ArrowButton icon={CheckCircle2} loading={busy === "valide"} onClick={() => review("valide")}>
          Valider
        </ArrowButton>
        <ArrowButton icon={RotateCcw} variant="danger" loading={busy === "a_revoir"} onClick={() => review("a_revoir")}>
          À revoir
        </ArrowButton>
      </div>
    </div>
  );
}
