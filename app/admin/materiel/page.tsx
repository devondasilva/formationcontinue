"use client";

import { Suspense, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import {
  Boxes,
  PackagePlus,
  Pencil,
  Trash2,
  Eye,
  ArrowLeftRight,
  ShieldAlert,
  XCircle,
  Wrench,
  Download,
  History,
  LayoutGrid,
  Building2,
  Coins,
  UserX,
  PackageX,
  X,
  MapPin,
  ClipboardList,
} from "lucide-react";
import type { EquipmentCategory, EquipmentItem } from "@/lib/types";
import {
  CATEGORY_LABEL,
  CONDITION_LABEL,
  EQUIPMENT_CATEGORIES,
  EQUIPMENT_STATUS_LABEL,
  ORIGIN_LABEL,
  formatDate,
  formatFCFA,
} from "@/lib/labels";
import ArrowButton from "@/components/ui/ArrowButton";
import { Badge, EmptyState, Field, Skeleton } from "@/components/ui/primitives";
import {
  EquipmentCard,
  EquipmentDetail,
  EquipmentFields,
  IncidentForm,
  MovementTimeline,
  emptyEquipment,
  equipmentPayload,
  equipmentToForm,
  type Api,
  type EquipmentFormValue,
} from "@/components/network/EquipmentUI";
import { useAdmin } from "../_lib/AdminContext";
import { AdminHeader, Avatar, ConfirmDialog, Drawer, FilterPills, IconAction, SearchBox } from "../_components/kit";

export default function Page() {
  return (
    <Suspense fallback={<Skeleton className="h-96" />}>
      <MaterielAdmin />
    </Suspense>
  );
}

type StateFilter = "actifs" | "reparer" | "hs" | "sans" | "reformes";
type View = "parc" | "historique";

function MaterielAdmin() {
  const { stats, mutate, refresh } = useAdmin();
  const params = useSearchParams();
  const [view, setView] = useState<View>("parc");
  const [club, setClub] = useState(params.get("club") ?? "");
  const [coach, setCoach] = useState(params.get("coach") ?? "");
  const [category, setCategory] = useState<EquipmentCategory | "">("");
  const [state, setState] = useState<StateFilter>((params.get("etat") as StateFilter) ?? "actifs");
  const [q, setQ] = useState("");

  const [editing, setEditing] = useState<EquipmentItem | "new" | null>(null);
  const [form, setForm] = useState<EquipmentFormValue>(emptyEquipment());
  const [note, setNote] = useState("");
  const [saving, setSaving] = useState(false);
  const [detailId, setDetailId] = useState<string | null>(null);
  const [transfer, setTransfer] = useState<EquipmentItem | null>(null);
  const [incident, setIncident] = useState<EquipmentItem | null>(null);
  const [reform, setReform] = useState<EquipmentItem | null>(null);
  const [toDelete, setToDelete] = useState<EquipmentItem | null>(null);

  const net = stats?.network;
  const api: Api = (url, init, msg) => mutate(url, init, msg);

  const filtered = useMemo(() => {
    if (!net) return [];
    const needle = q.trim().toLowerCase();
    return net.equipment
      .filter((e) => !club || e.clubId === club)
      .filter((e) => !coach || e.responsibleCoachId === coach)
      .filter((e) => !category || e.category === category)
      .filter((e) => {
        if (state === "reformes") return e.status === "reforme";
        if (e.status === "reforme") return false;
        if (state === "reparer") return e.condition === "a_reparer" || e.status === "en_reparation";
        if (state === "hs") return e.condition === "hors_service" || e.status === "perdu";
        if (state === "sans") return !e.responsibleCoachId;
        return true;
      })
      .filter((e) => !needle || `${e.name} ${e.code} ${e.brand ?? ""} ${e.serialNumber ?? ""} ${e.storageLocation ?? ""}`.toLowerCase().includes(needle))
      .sort((a, b) => a.category.localeCompare(b.category) || a.name.localeCompare(b.name));
  }, [net, club, coach, category, state, q]);

  if (!stats || !net) return <Skeleton className="h-96" />;

  const clubOf = (id: string) => net.clubs.find((c) => c.id === id);
  const coachOf = (id: string | null) => (id ? net.coaches.find((c) => c.id === id) ?? null : null);
  const photosOf = (id: string) => net.photos.filter((p) => p.itemId === id).sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1));
  const live = net.equipment.filter((e) => e.status !== "reforme");
  const scope = live.filter((e) => (!club || e.clubId === club) && (!coach || e.responsibleCoachId === coach));
  const kpis = {
    items: scope.length,
    units: scope.reduce((s, e) => s + e.quantity, 0),
    value: scope.reduce((s, e) => s + e.quantity * (e.unitValueFCFA ?? 0), 0),
    repair: scope.filter((e) => e.condition === "a_reparer" || e.status === "en_reparation").length,
    hs: scope.filter((e) => e.condition === "hors_service" || e.status === "perdu").length,
    unassigned: scope.filter((e) => !e.responsibleCoachId).length,
  };
  const detail = detailId ? net.equipment.find((e) => e.id === detailId) ?? null : null;

  // Regroupement par club : la vue « qui a quoi, où, sous la responsabilité de qui ».
  const groups = net.clubs
    .map((c) => ({ club: c, items: filtered.filter((e) => e.clubId === c.id) }))
    .filter((g) => g.items.length > 0);

  function openNew() {
    setForm(emptyEquipment(club, ""));
    setNote("");
    setEditing("new");
  }
  function openEdit(it: EquipmentItem) {
    setForm(equipmentToForm(it));
    setNote("");
    setEditing(it);
  }
  async function save() {
    const el = document.getElementById("equipment-form") as HTMLFormElement | null;
    if (el && !el.reportValidity()) return;
    setSaving(true);
    const body = { ...equipmentPayload(form, "admin"), note };
    const ok =
      editing === "new"
        ? await mutate("/api/equipment", { method: "POST", json: body }, "Matériel enregistré")
        : await mutate(`/api/equipment/${(editing as EquipmentItem).id}`, { method: "PATCH", json: body }, "Matériel mis à jour");
    setSaving(false);
    if (ok) setEditing(null);
  }

  function exportCsv() {
    const head = ["Code", "Club", "Ville", "Responsable", "Téléphone responsable", "Catégorie", "Désignation", "Quantité", "Unité", "État", "Statut", "Origine", "Valeur unitaire FCFA", "Valeur totale FCFA", "Stockage", "Acquis le", "Dernier inventaire", "Photos"];
    const rows = filtered.map((e) => {
      const c = clubOf(e.clubId);
      const r = coachOf(e.responsibleCoachId);
      return [
        e.code,
        c?.name ?? "",
        c?.city ?? "",
        r?.name ?? "Non attribué",
        r?.phone ?? "",
        CATEGORY_LABEL[e.category],
        e.name,
        e.quantity,
        e.unit,
        CONDITION_LABEL[e.condition],
        EQUIPMENT_STATUS_LABEL[e.status],
        ORIGIN_LABEL[e.origin],
        e.unitValueFCFA ?? "",
        e.unitValueFCFA ? e.unitValueFCFA * e.quantity : "",
        e.storageLocation ?? "",
        e.acquiredAt ?? "",
        e.lastInventoryAt ?? "",
        photosOf(e.id).length,
      ];
    });
    const csv = [head, ...rows].map((r) => r.map((v) => `"${String(v).replace(/"/g, '""')}"`).join(";")).join("\r\n");
    const url = URL.createObjectURL(new Blob(["﻿" + csv], { type: "text/csv;charset=utf-8" }));
    const a = document.createElement("a");
    a.href = url;
    a.download = `materiel-mades-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  const actions = (e: EquipmentItem) => (
    <>
      <IconAction icon={Eye} label="Fiche, photos et historique" onClick={() => setDetailId(e.id)} />
      <IconAction icon={Pencil} label="Modifier" onClick={() => openEdit(e)} />
      {e.status !== "reforme" && (
        <>
          <IconAction icon={ArrowLeftRight} label="Transférer / changer de responsable" tone="orange" onClick={() => setTransfer(e)} />
          <IconAction icon={ShieldAlert} label="Déclarer un incident" tone="danger" onClick={() => setIncident(e)} />
          {(e.condition === "a_reparer" || e.status === "en_reparation") && (
            <IconAction icon={Wrench} label="Remis en service (réparé)" tone="success" onClick={() => mutate(`/api/equipment/${e.id}`, { method: "PATCH", json: { status: "en_service", condition: "bon", note: "Réparation effectuée" } }, "Matériel remis en service")} />
          )}
        </>
      )}
      <span className="flex-1" />
      {e.status !== "reforme" ? <IconAction icon={XCircle} label="Réformer" tone="danger" onClick={() => setReform(e)} /> : <IconAction icon={Trash2} label="Supprimer définitivement" tone="danger" onClick={() => setToDelete(e)} />}
    </>
  );

  const filtersOn = club || coach || category || q;

  return (
    <div>
      <AdminHeader
        icon={Boxes}
        title="Matériel"
        subtitle="Tout le parc des clubs partenaires : quantités, état, responsable, preuves photo et traçabilité."
        actions={
          <>
            <ArrowButton variant="outline" icon={Download} onClick={exportCsv} disabled={filtered.length === 0}>
              Export CSV
            </ArrowButton>
            <ArrowButton icon={PackagePlus} onClick={openNew} disabled={net.clubs.length === 0}>
              Doter un club
            </ArrowButton>
          </>
        }
      />

      {/* Indicateurs */}
      <div className="mb-6 grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-6">
        <Kpi icon={Boxes} label="Articles" value={kpis.items} />
        <Kpi icon={LayoutGrid} label="Unités" value={kpis.units} />
        <Kpi icon={Coins} label="Valeur" value={kpis.value} money />
        <Kpi icon={Wrench} label="À réparer" value={kpis.repair} tone="orange" onClick={() => setState("reparer")} />
        <Kpi icon={PackageX} label="HS / perdus" value={kpis.hs} tone="danger" onClick={() => setState("hs")} />
        <Kpi icon={UserX} label="Sans responsable" value={kpis.unassigned} tone="danger" onClick={() => setState("sans")} />
      </div>

      <div className="mb-4 flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
        <FilterPills
          value={view}
          onChange={setView}
          options={[
            { id: "parc", label: "Parc par club", icon: Building2 },
            { id: "historique", label: "Journal des mouvements", icon: History, count: net.movements.length },
          ]}
        />
        {view === "parc" && (
          <FilterPills
            value={state}
            onChange={setState}
            options={[
              { id: "actifs", label: "En parc" },
              { id: "reparer", label: "À réparer", count: kpis.repair },
              { id: "hs", label: "HS / perdus", count: kpis.hs },
              { id: "sans", label: "Sans resp.", count: kpis.unassigned },
              { id: "reformes", label: "Réformés" },
            ]}
          />
        )}
      </div>

      <div className="mb-6 flex flex-col gap-2 md:flex-row md:flex-wrap md:items-center">
        <select className="field rounded-full py-2.5 md:w-56" value={club} onChange={(e) => (setClub(e.target.value), setCoach(""))} aria-label="Club">
          <option value="">Tous les clubs</option>
          {net.clubs.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
        <select className="field rounded-full py-2.5 md:w-56" value={coach} onChange={(e) => setCoach(e.target.value)} aria-label="Responsable">
          <option value="">Tous les responsables</option>
          {net.coaches
            .filter((c) => !club || c.clubId === club)
            .map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
        </select>
        <select className="field rounded-full py-2.5 md:w-56" value={category} onChange={(e) => setCategory(e.target.value as EquipmentCategory | "")} aria-label="Catégorie">
          <option value="">Toutes les catégories</option>
          {EQUIPMENT_CATEGORIES.map((c) => (
            <option key={c} value={c}>
              {CATEGORY_LABEL[c]}
            </option>
          ))}
        </select>
        <SearchBox value={q} onChange={setQ} placeholder="Désignation, code, n° série…" />
        {filtersOn && (
          <IconAction
            icon={X}
            label="Effacer les filtres"
            onClick={() => {
              setClub("");
              setCoach("");
              setCategory("");
              setQ("");
            }}
          />
        )}
      </div>

      {view === "historique" ? (
        <div className="card p-5 sm:p-6">
          <MovementTimeline
            movements={net.movements.filter((m) => (!club || m.clubId === club || m.toClubId === club) && (!q || m.itemName.toLowerCase().includes(q.toLowerCase())))}
            photos={net.photos}
            clubs={net.clubs}
            coaches={net.coaches}
          />
        </div>
      ) : net.clubs.length === 0 ? (
        <EmptyState icon={Building2} title="Aucun club partenaire" text="Ajoutez un club avant de lui attribuer du matériel." action={<ArrowButton href="/admin/clubs">Clubs partenaires</ArrowButton>} />
      ) : groups.length === 0 ? (
        <EmptyState
          icon={Boxes}
          title="Aucun matériel"
          text={net.equipment.length ? "Rien ne correspond à ces filtres." : "Enregistrez la première dotation de matériel d'un club."}
          action={
            !net.equipment.length && (
              <ArrowButton icon={PackagePlus} onClick={openNew}>
                Doter un club
              </ArrowButton>
            )
          }
        />
      ) : (
        <div className="space-y-10">
          {groups.map(({ club: c, items }) => {
            const s = net.summaries.find((x) => x.clubId === c.id);
            const managers = net.coaches.filter((x) => x.clubId === c.id && x.isEquipmentManager);
            const holders = Array.from(new Set(items.map((i) => i.responsibleCoachId))).map((id) => coachOf(id));
            return (
              <section key={c.id}>
                <div className="mb-4 flex flex-wrap items-end justify-between gap-3 border-b border-line pb-3">
                  <div className="flex items-center gap-3">
                    <span className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-ink text-white">
                      <Building2 size={22} />
                    </span>
                    <div>
                      <p className="h-display text-3xl leading-none">{c.name}</p>
                      <p className="mt-1 flex flex-wrap items-center gap-x-3 font-mono text-[11px] text-mutedfg">
                        <span>
                          <MapPin size={11} className="mr-0.5 inline" />
                          {c.city}
                        </span>
                        <span>
                          {items.length} article{items.length > 1 ? "s" : ""} · {items.reduce((t, e) => t + e.quantity, 0)} unités
                        </span>
                        {s && s.valueFCFA > 0 && <span>{formatFCFA(s.valueFCFA)}</span>}
                        <span className={s?.inventoryOverdue ? "text-danger" : ""}>
                          <ClipboardList size={11} className="mr-0.5 inline" />
                          {s?.lastInventoryDate ? `Inventaire ${formatDate(s.lastInventoryDate)}` : "Jamais inventorié"}
                        </span>
                      </p>
                    </div>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    {managers.length > 0 ? (
                      managers.map((m) => (
                        <span key={m.id} className="inline-flex items-center gap-2 rounded-full bg-orangeL py-1 pl-1 pr-3 text-xs font-semibold text-orangeD">
                          <Avatar name={m.name} size={24} /> {m.name} · resp. matériel
                        </span>
                      ))
                    ) : (
                      <Badge tone="danger">Pas de responsable matériel</Badge>
                    )}
                    <span className="flex -space-x-2" title={holders.map((h) => h?.name ?? "Non attribué").join(", ")}>
                      {holders.slice(0, 5).map((h, i) => (
                        <span key={h?.id ?? `none-${i}`} className="rounded-full ring-2 ring-bg">
                          <Avatar name={h?.name ?? "?"} size={26} />
                        </span>
                      ))}
                    </span>
                  </div>
                </div>
                <div className="grid gap-3 md:grid-cols-2 2xl:grid-cols-3">
                  <AnimatePresence initial={false}>
                    {items.map((e, i) => (
                      <EquipmentCard key={e.id} index={i} item={e} responsible={coachOf(e.responsibleCoachId)} photos={photosOf(e.id)} onOpen={() => setDetailId(e.id)} actions={actions(e)} />
                    ))}
                  </AnimatePresence>
                </div>
              </section>
            );
          })}
        </div>
      )}

      {/* Dotation / modification */}
      <Drawer
        open={editing !== null}
        onClose={() => setEditing(null)}
        title={editing === "new" ? "Dotation de matériel" : "Modifier le matériel"}
        icon={PackagePlus}
        footer={
          <div className="flex justify-end gap-2">
            <button onClick={() => setEditing(null)} className="rounded-full px-5 py-3 text-sm font-semibold text-mutedfg hover:text-ink">
              Annuler
            </button>
            <ArrowButton loading={saving} onClick={save}>
              {editing === "new" ? "Enregistrer la dotation" : "Enregistrer"}
            </ArrowButton>
          </div>
        }
      >
        <form id="equipment-form" onSubmit={(e) => e.preventDefault()} className="space-y-5">
          <EquipmentFields value={form} onChange={setForm} scope="admin" clubs={net.clubs} coaches={net.coaches} isNew={editing === "new"} />
          <Field label={editing === "new" ? "Note de dotation (journal)" : "Motif de la modification (journal)"}>
            <input className="field" value={note} onChange={(e) => setNote(e.target.value)} placeholder={editing === "new" ? "Ex. Convention 2026, lot n°3" : "Ex. Correction après contrôle"} />
          </Field>
          {editing === "new" && <p className="text-xs text-mutedfg">Après l&rsquo;enregistrement, ouvrez la fiche pour joindre les photos de réception (preuve de dotation).</p>}
        </form>
      </Drawer>

      {/* Fiche */}
      <Drawer open={!!detail} onClose={() => setDetailId(null)} title="Fiche matériel" icon={Boxes}>
        {detail && (
          <>
            <EquipmentDetail
              item={detail}
              club={clubOf(detail.clubId)}
              responsible={coachOf(detail.responsibleCoachId)}
              photos={photosOf(detail.id)}
              movements={net.movements.filter((m) => m.itemId === detail.id)}
              clubs={net.clubs}
              coaches={net.coaches}
              canPhoto
              onPhoto={() => refresh()}
              onDeletePhoto={(p) => mutate(`/api/photos/${p.id}`, { method: "DELETE" }, "Photo supprimée")}
            />
            <div className="mt-6 flex flex-wrap gap-2 border-t border-line pt-5">
              <ArrowButton size="sm" variant="dark" icon={Pencil} onClick={() => (openEdit(detail), setDetailId(null))}>
                Modifier
              </ArrowButton>
              {detail.status !== "reforme" && (
                <ArrowButton size="sm" variant="outline" icon={ArrowLeftRight} onClick={() => (setTransfer(detail), setDetailId(null))}>
                  Transférer
                </ArrowButton>
              )}
            </div>
          </>
        )}
      </Drawer>

      {/* Transfert / responsable */}
      <Drawer open={!!transfer} onClose={() => setTransfer(null)} title="Transfert" icon={ArrowLeftRight}>
        {transfer && <TransferForm item={transfer} api={api} onDone={() => setTransfer(null)} />}
      </Drawer>

      {/* Incident */}
      <Drawer open={!!incident} onClose={() => setIncident(null)} title="Incident" icon={ShieldAlert}>
        {incident && <IncidentForm item={incident} api={api} onDone={() => setIncident(null)} />}
      </Drawer>

      {/* Réforme */}
      <Drawer open={!!reform} onClose={() => setReform(null)} title="Réformer" icon={XCircle}>
        {reform && <ReformForm item={reform} api={api} onDone={() => setReform(null)} />}
      </Drawer>

      <ConfirmDialog
        open={!!toDelete}
        title="Supprimer définitivement ?"
        text="Le matériel disparaîtra du parc. Son historique reste consultable dans le journal des mouvements."
        onClose={() => setToDelete(null)}
        onConfirm={async () => {
          if (toDelete) await mutate(`/api/equipment/${toDelete.id}`, { method: "DELETE" }, "Matériel supprimé");
        }}
      />
    </div>
  );
}

function Kpi({ icon: Icon, label, value, tone, money, onClick }: { icon: typeof Boxes; label: string; value: number; tone?: "orange" | "danger"; money?: boolean; onClick?: () => void }) {
  const hot = tone && value > 0;
  const Tag = onClick ? "button" : "div";
  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
      <Tag
        onClick={onClick}
        className={`card flex w-full items-center gap-3 p-4 text-left transition-all ${onClick ? "hover:-translate-y-0.5 hover:shadow-lift" : ""} ${hot ? (tone === "danger" ? "border-danger/30" : "border-orange/30") : ""}`}
      >
        <span className={`inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${hot ? (tone === "danger" ? "bg-danger text-white" : "bg-orange text-white") : "bg-muted text-ink"}`}>
          <Icon size={18} />
        </span>
        <span className="min-w-0">
          <span className={`h-display block truncate leading-none ${money ? "text-2xl" : "text-3xl"}`}>{money ? compactFCFA(value) : value}</span>
          <span className="mt-1 block font-mono text-[10px] uppercase tracking-wider text-mutedfg">{label}</span>
        </span>
      </Tag>
    </motion.div>
  );
}

function TransferForm({ item, api, onDone }: { item: EquipmentItem; api: Api; onDone: () => void }) {
  const { stats } = useAdmin();
  const [clubId, setClubId] = useState(item.clubId);
  const [coachId, setCoachId] = useState(item.responsibleCoachId ?? "");
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);
  if (!stats) return null;
  const net = stats.network;
  const coaches = net.coaches.filter((c) => c.clubId === clubId && c.active);
  const changed = clubId !== item.clubId || coachId !== (item.responsibleCoachId ?? "");
  return (
    <div className="space-y-5">
      <p className="rounded-2xl bg-muted/70 p-3 text-sm">
        <strong>{item.name}</strong>
        <span className="block font-mono text-[11px] text-mutedfg">
          {item.code} · {item.quantity} {item.unit}
        </span>
      </p>
      <Field label="Club de destination">
        <select className="field" value={clubId} onChange={(e) => (setClubId(e.target.value), setCoachId(""))}>
          {net.clubs.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name} — {c.city}
              {c.id === item.clubId ? " (actuel)" : ""}
            </option>
          ))}
        </select>
      </Field>
      <Field label="Coach responsable">
        <select className="field" value={coachId} onChange={(e) => setCoachId(e.target.value)}>
          <option value="">Non attribué</option>
          {coaches.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
              {c.isEquipmentManager ? " (resp. matériel)" : ""}
            </option>
          ))}
        </select>
      </Field>
      <Field label="Motif (journal)">
        <input className="field" value={note} onChange={(e) => setNote(e.target.value)} placeholder="Ex. Besoin pour l'école de tennis de Parakou" />
      </Field>
      <ArrowButton
        full
        loading={busy}
        disabled={!changed}
        onClick={async () => {
          setBusy(true);
          const ok = await api(`/api/equipment/${item.id}`, { method: "PATCH", json: { clubId, responsibleCoachId: coachId || null, note } }, clubId !== item.clubId ? "Matériel transféré" : "Responsable mis à jour");
          setBusy(false);
          if (ok) onDone();
        }}
      >
        Valider
      </ArrowButton>
    </div>
  );
}

function ReformForm({ item, api, onDone }: { item: EquipmentItem; api: Api; onDone: () => void }) {
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);
  return (
    <div className="space-y-5">
      <p className="text-sm">
        <strong>{item.name}</strong> sera retiré du parc actif (il reste visible dans « Réformés » et dans l&rsquo;historique).
      </p>
      <Field label="Motif de la réforme">
        <textarea required rows={3} className="field" value={note} onChange={(e) => setNote(e.target.value)} placeholder="Usure irréparable, obsolète…" />
      </Field>
      <ArrowButton
        full
        variant="danger"
        loading={busy}
        disabled={!note.trim()}
        onClick={async () => {
          setBusy(true);
          const ok = await api(`/api/equipment/${item.id}`, { method: "PATCH", json: { status: "reforme", condition: "hors_service", note } }, "Matériel réformé");
          setBusy(false);
          if (ok) onDone();
        }}
      >
        Réformer
      </ArrowButton>
    </div>
  );
}

/** 4 122 000 → « 4,12 M FCFA » pour tenir dans une tuile. */
function compactFCFA(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toLocaleString("fr-FR", { maximumFractionDigits: 2 })} M FCFA`;
  if (n >= 10_000) return `${Math.round(n / 1000)} k FCFA`;
  return formatFCFA(n);
}
