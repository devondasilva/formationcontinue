"use client";

import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import {
  ArrowLeftRight,
  Camera,
  CheckCircle2,
  ClipboardList,
  History,
  MapPin,
  Minus,
  PackageCheck,
  PackagePlus,
  Pencil,
  Plus,
  ShieldAlert,
  Trash2,
  UserCheck,
  Wrench,
  XCircle,
  type LucideIcon,
} from "lucide-react";
import type {
  EquipmentCategory,
  EquipmentCondition,
  EquipmentItem,
  EquipmentMovement,
  EquipmentOrigin,
  EquipmentPhoto,
  MovementType,
  PartnerClub,
  PublicCoach,
  AlternanceLog,
} from "@/lib/types";
import {
  CATEGORY_LABEL,
  CATEGORY_UNIT,
  CONDITION_LABEL,
  CONDITION_TONE,
  DISCIPLINES,
  DISCIPLINE_LABEL,
  EQUIPMENT_CATEGORIES,
  EQUIPMENT_CONDITIONS,
  EQUIPMENT_STATUS_LABEL,
  EQUIPMENT_STATUS_TONE,
  INVENTORY_MAX_AGE_DAYS,
  LOG_STATUS_LABEL,
  LOG_STATUS_TONE,
  MOVEMENT_LABEL,
  ORIGIN_LABEL,
  daysSince,
  formatDate,
  formatFCFA,
} from "@/lib/labels";
import { Badge, Field } from "@/components/ui/primitives";
import ArrowButton from "@/components/ui/ArrowButton";
import { EquipmentIcon } from "./EquipmentIcon";
import { PhotoCapture, PhotoStrip } from "./Photos";

/** Appel API + toast + rafraîchissement, fourni par l'espace (admin ou coach). */
export type Api = (url: string, init: { method: string; json?: unknown }, success?: string) => Promise<boolean>;

export const MOVEMENT_ICON: Record<MovementType, LucideIcon> = {
  dotation: PackagePlus,
  declaration: PackagePlus,
  modification: Pencil,
  transfert: ArrowLeftRight,
  responsable: UserCheck,
  inventaire: ClipboardList,
  etat: PackageCheck,
  incident: ShieldAlert,
  reparation: Wrench,
  reforme: XCircle,
  photo: Camera,
};

const fmtDateTime = (iso: string) => new Date(iso).toLocaleString("fr-FR", { dateStyle: "medium", timeStyle: "short" });

/* ------------------------------------------------------------------ */
/*  Carte matériel                                                     */
/* ------------------------------------------------------------------ */

export function EquipmentCard({
  item,
  club,
  responsible,
  photos,
  actions,
  index = 0,
  onOpen,
}: {
  item: EquipmentItem;
  club?: PartnerClub;
  responsible?: PublicCoach | null;
  photos: EquipmentPhoto[];
  actions?: React.ReactNode;
  index?: number;
  onOpen?: () => void;
}) {
  const age = daysSince(item.lastInventoryAt);
  const overdue = age === null || age > INVENTORY_MAX_AGE_DAYS;
  const cover = photos[0];
  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.96 }}
      transition={{ delay: Math.min(index, 10) * 0.025 }}
      className="group card flex min-w-0 flex-col overflow-hidden transition-all hover:-translate-y-0.5 hover:border-ink/25 hover:shadow-lift"
    >
      <button type="button" onClick={onOpen} className="flex items-start gap-4 p-5 text-left">
        <span className="relative inline-flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-ink text-white transition-colors group-hover:bg-orange">
          {cover ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={`/api/photos/${cover.id}`} alt="" className="h-full w-full object-cover" loading="lazy" />
          ) : (
            <EquipmentIcon category={item.category} size={26} />
          )}
          {photos.length > 0 && (
            <span className="absolute bottom-1 right-1 inline-flex items-center gap-0.5 rounded-full bg-ink/80 px-1.5 font-mono text-[9px] text-white">
              <Camera size={9} /> {photos.length}
            </span>
          )}
        </span>
        <div className="min-w-0 flex-1">
          <p className="font-mono text-[10px] uppercase tracking-wider text-mutedfg">{item.code}</p>
          <p className="truncate font-semibold leading-tight">{item.name}</p>
          <p className="mt-0.5 truncate text-xs text-mutedfg">
            {CATEGORY_LABEL[item.category]}
            {item.discipline ? ` · ${DISCIPLINE_LABEL[item.discipline]}` : ""}
          </p>
          <div className="mt-2 flex flex-wrap gap-1.5">
            <Badge tone={CONDITION_TONE[item.condition]}>{CONDITION_LABEL[item.condition]}</Badge>
            {item.status !== "en_service" && <Badge tone={EQUIPMENT_STATUS_TONE[item.status]}>{EQUIPMENT_STATUS_LABEL[item.status]}</Badge>}
          </div>
        </div>
        <div className="shrink-0 text-right">
          <p className="h-display text-4xl leading-none">{item.quantity}</p>
          <p className="font-mono text-[10px] uppercase text-mutedfg">{item.unit}</p>
        </div>
      </button>
      <div className="mx-5 grid grid-cols-2 gap-2 rounded-xl bg-muted/60 p-3 text-xs">
        <div className="min-w-0">
          <p className="font-mono text-[9px] uppercase tracking-wider text-mutedfg">Responsable</p>
          <p className={`truncate font-semibold ${responsible ? "" : "text-danger"}`}>{responsible ? responsible.name : "Non attribué"}</p>
        </div>
        <div className="min-w-0">
          <p className="font-mono text-[9px] uppercase tracking-wider text-mutedfg">{club ? "Club" : "Inventaire"}</p>
          <p className="truncate font-semibold">
            {club ? club.name : item.lastInventoryAt ? formatDate(item.lastInventoryAt) : "Jamais"}
          </p>
        </div>
        {club && (
          <div className="col-span-2 flex items-center justify-between gap-2 border-t border-line pt-2">
            <span className="truncate text-mutedfg">
              <MapPin size={11} className="mr-1 inline" />
              {item.storageLocation || "Emplacement non précisé"}
            </span>
            <span className={`shrink-0 font-mono ${overdue ? "text-danger" : "text-mutedfg"}`}>
              {item.lastInventoryAt ? `Inv. ${formatDate(item.lastInventoryAt)}` : "Jamais inventorié"}
            </span>
          </div>
        )}
      </div>
      {actions && <div className="mt-auto flex flex-wrap items-center gap-1.5 border-t border-line p-4 pt-4">{actions}</div>}
      {!actions && <div className="h-5" />}
    </motion.div>
  );
}

/* ------------------------------------------------------------------ */
/*  Formulaire matériel (dotation admin / déclaration coach)           */
/* ------------------------------------------------------------------ */

export interface EquipmentFormValue {
  clubId: string;
  responsibleCoachId: string;
  category: EquipmentCategory;
  name: string;
  discipline: string;
  brand: string;
  serialNumber: string;
  quantity: string;
  unit: string;
  condition: EquipmentCondition;
  origin: EquipmentOrigin;
  acquiredAt: string;
  unitValueFCFA: string;
  storageLocation: string;
  notes: string;
}

export function emptyEquipment(clubId = "", responsibleCoachId = "", origin: EquipmentOrigin = "dotation_mades"): EquipmentFormValue {
  return {
    clubId,
    responsibleCoachId,
    category: "raquettes",
    name: "",
    discipline: "",
    brand: "",
    serialNumber: "",
    quantity: "1",
    unit: CATEGORY_UNIT.raquettes,
    condition: "neuf",
    origin,
    acquiredAt: new Date().toISOString().slice(0, 10),
    unitValueFCFA: "",
    storageLocation: "",
    notes: "",
  };
}

export function equipmentToForm(it: EquipmentItem): EquipmentFormValue {
  return {
    clubId: it.clubId,
    responsibleCoachId: it.responsibleCoachId ?? "",
    category: it.category,
    name: it.name,
    discipline: it.discipline ?? "",
    brand: it.brand ?? "",
    serialNumber: it.serialNumber ?? "",
    quantity: String(it.quantity),
    unit: it.unit,
    condition: it.condition,
    origin: it.origin,
    acquiredAt: it.acquiredAt ?? "",
    unitValueFCFA: it.unitValueFCFA !== undefined ? String(it.unitValueFCFA) : "",
    storageLocation: it.storageLocation ?? "",
    notes: it.notes ?? "",
  };
}

/**
 * Champs du formulaire matériel.
 * - `scope="admin"` : tous les champs (club, responsable, valeur, origine…).
 * - `scope="coach-new"` : déclaration dans son club.
 * - `scope="coach-edit"` : état, emplacement, notes (+ responsable si responsable matériel).
 */
export function EquipmentFields({
  value,
  onChange,
  scope,
  clubs,
  coaches,
  isNew,
  canAssign = false,
}: {
  value: EquipmentFormValue;
  onChange: (v: EquipmentFormValue) => void;
  scope: "admin" | "coach-new" | "coach-edit";
  clubs: PartnerClub[];
  coaches: PublicCoach[];
  isNew: boolean;
  canAssign?: boolean;
}) {
  const set = <K extends keyof EquipmentFormValue>(k: K, v: EquipmentFormValue[K]) => onChange({ ...value, [k]: v });
  const clubCoaches = coaches.filter((c) => c.clubId === value.clubId && c.active);
  const full = scope !== "coach-edit";
  return (
    <div className="space-y-5">
      {scope === "admin" && (
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Club">
            <select required className="field" value={value.clubId} onChange={(e) => onChange({ ...value, clubId: e.target.value, responsibleCoachId: "" })}>
              <option value="">Choisir un club…</option>
              {clubs.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name} — {c.city}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Coach responsable" hint={value.clubId && clubCoaches.length === 0 ? "Aucun coach dans ce club : ajoutez-en un." : undefined}>
            <select className="field" value={value.responsibleCoachId} onChange={(e) => set("responsibleCoachId", e.target.value)} disabled={!value.clubId}>
              <option value="">Non attribué</option>
              {clubCoaches.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                  {c.isEquipmentManager ? " (resp. matériel)" : ""}
                </option>
              ))}
            </select>
          </Field>
        </div>
      )}
      {scope !== "admin" && canAssign && (
        <Field label="Coach responsable">
          <select className="field" value={value.responsibleCoachId} onChange={(e) => set("responsibleCoachId", e.target.value)}>
            {scope === "coach-edit" && <option value="">Non attribué</option>}
            {clubCoaches.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </Field>
      )}

      {full && (
        <>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Catégorie">
              <select
                className="field"
                value={value.category}
                onChange={(e) => {
                  const cat = e.target.value as EquipmentCategory;
                  onChange({ ...value, category: cat, unit: value.unit === CATEGORY_UNIT[value.category] ? CATEGORY_UNIT[cat] : value.unit });
                }}
              >
                {EQUIPMENT_CATEGORIES.map((c) => (
                  <option key={c} value={c}>
                    {CATEGORY_LABEL[c]}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Discipline">
              <select className="field" value={value.discipline} onChange={(e) => set("discipline", e.target.value)}>
                <option value="">Toutes / polyvalent</option>
                {DISCIPLINES.map((d) => (
                  <option key={d} value={d}>
                    {DISCIPLINE_LABEL[d]}
                  </option>
                ))}
              </select>
            </Field>
          </div>
          <Field label="Désignation">
            <input required className="field" value={value.name} onChange={(e) => set("name", e.target.value)} placeholder="Ex. Raquettes junior 23 pouces" />
          </Field>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
            <Field label="Quantité" hint={!isNew && scope === "admin" ? "Corriger ici = ajustement tracé." : undefined}>
              <input required type="number" min={isNew ? 1 : 0} className="field" value={value.quantity} onChange={(e) => set("quantity", e.target.value)} />
            </Field>
            <Field label="Unité">
              <input className="field" value={value.unit} onChange={(e) => set("unit", e.target.value)} />
            </Field>
            <Field label="Marque">
              <input className="field" value={value.brand} onChange={(e) => set("brand", e.target.value)} />
            </Field>
          </div>
        </>
      )}

      <Field label="État">
        <div className="flex flex-wrap gap-1.5">
          {EQUIPMENT_CONDITIONS.map((c) => (
            <button
              key={c}
              type="button"
              onClick={() => set("condition", c)}
              className={`rounded-full px-3 py-1.5 text-xs font-semibold ring-1 ring-inset transition-colors ${
                value.condition === c ? "bg-ink text-white ring-ink" : "bg-white text-mutedfg ring-line hover:text-ink"
              }`}
            >
              {CONDITION_LABEL[c]}
            </button>
          ))}
        </div>
      </Field>

      <Field label="Lieu de stockage">
        <input className="field" value={value.storageLocation} onChange={(e) => set("storageLocation", e.target.value)} placeholder="Ex. Local technique, armoire 2" />
      </Field>

      {scope === "admin" && (
        <div className="grid gap-4 sm:grid-cols-3">
          <Field label="Origine">
            <select className="field" value={value.origin} onChange={(e) => set("origin", e.target.value as EquipmentOrigin)}>
              {(Object.keys(ORIGIN_LABEL) as EquipmentOrigin[]).map((o) => (
                <option key={o} value={o}>
                  {ORIGIN_LABEL[o]}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Date d'acquisition">
            <input type="date" className="field" value={value.acquiredAt} onChange={(e) => set("acquiredAt", e.target.value)} />
          </Field>
          <Field label="Valeur unitaire (FCFA)">
            <input type="number" min={0} className="field" value={value.unitValueFCFA} onChange={(e) => set("unitValueFCFA", e.target.value)} />
          </Field>
        </div>
      )}
      {scope === "coach-new" && (
        <Field label="Origine">
          <select className="field" value={value.origin} onChange={(e) => set("origin", e.target.value as EquipmentOrigin)}>
            <option value="dotation_mades">Dotation MADES reçue</option>
            <option value="club">Matériel du club</option>
            <option value="don_partenaire">Don d&rsquo;un partenaire</option>
          </select>
        </Field>
      )}
      {full && (
        <Field label="N° de série / référence">
          <input className="field" value={value.serialNumber} onChange={(e) => set("serialNumber", e.target.value)} />
        </Field>
      )}
      <Field label="Notes">
        <textarea rows={3} className="field" value={value.notes} onChange={(e) => set("notes", e.target.value)} />
      </Field>
    </div>
  );
}

/** Corps JSON à envoyer selon le périmètre. */
export function equipmentPayload(v: EquipmentFormValue, scope: "admin" | "coach-new" | "coach-edit", canAssign = false) {
  if (scope === "coach-edit") {
    return {
      condition: v.condition,
      storageLocation: v.storageLocation,
      notes: v.notes,
      ...(canAssign ? { responsibleCoachId: v.responsibleCoachId || null } : {}),
    };
  }
  const base = {
    category: v.category,
    name: v.name,
    discipline: v.discipline || undefined,
    brand: v.brand,
    serialNumber: v.serialNumber,
    quantity: Number(v.quantity),
    unit: v.unit,
    condition: v.condition,
    origin: v.origin,
    storageLocation: v.storageLocation,
    notes: v.notes,
  };
  if (scope === "coach-new") return { ...base, responsibleCoachId: canAssign ? v.responsibleCoachId : undefined };
  return { ...base, clubId: v.clubId, responsibleCoachId: v.responsibleCoachId || null, acquiredAt: v.acquiredAt, unitValueFCFA: v.unitValueFCFA };
}

/* ------------------------------------------------------------------ */
/*  Incident (casse, perte, vol) avec photos                           */
/* ------------------------------------------------------------------ */

export function IncidentForm({ item, api, onDone }: { item: EquipmentItem; api: Api; onDone: () => void }) {
  const [kind, setKind] = useState<"casse" | "perte" | "vol">("casse");
  const [lostQty, setLostQty] = useState("1");
  const [condition, setCondition] = useState<EquipmentCondition>("a_reparer");
  const [note, setNote] = useState("");
  const [photos, setPhotos] = useState<EquipmentPhoto[]>([]);
  const [busy, setBusy] = useState(false);

  async function submit() {
    if (!note.trim()) return;
    setBusy(true);
    const ok = await api(
      `/api/equipment/${item.id}/incident`,
      { method: "POST", json: { kind, lostQty: Number(lostQty), condition: kind === "casse" ? condition : undefined, note, photoIds: photos.map((p) => p.id) } },
      "Incident enregistré"
    );
    setBusy(false);
    if (ok) onDone();
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-3 rounded-2xl bg-muted/70 p-3">
        <span className="inline-flex h-11 w-11 items-center justify-center rounded-xl bg-ink text-white">
          <EquipmentIcon category={item.category} size={20} />
        </span>
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold">{item.name}</p>
          <p className="font-mono text-[11px] text-mutedfg">
            {item.code} · {item.quantity} {item.unit}
          </p>
        </div>
      </div>
      <Field label="Type d'incident">
        <div className="grid grid-cols-3 gap-2">
          {(
            [
              { id: "casse", label: "Casse / dégât" },
              { id: "perte", label: "Perte" },
              { id: "vol", label: "Vol" },
            ] as const
          ).map((k) => (
            <button
              key={k.id}
              type="button"
              onClick={() => setKind(k.id)}
              className={`rounded-xl px-3 py-3 text-sm font-semibold ring-1 ring-inset transition-colors ${kind === k.id ? "bg-danger text-white ring-danger" : "bg-white ring-line hover:ring-ink"}`}
            >
              {k.label}
            </button>
          ))}
        </div>
      </Field>
      {kind === "casse" ? (
        <Field label="Nouvel état">
          <select className="field" value={condition} onChange={(e) => setCondition(e.target.value as EquipmentCondition)}>
            {EQUIPMENT_CONDITIONS.map((c) => (
              <option key={c} value={c}>
                {CONDITION_LABEL[c]}
              </option>
            ))}
          </select>
        </Field>
      ) : (
        <Field label={`Quantité manquante (sur ${item.quantity})`}>
          <input type="number" min={0} max={item.quantity} className="field" value={lostQty} onChange={(e) => setLostQty(e.target.value)} />
        </Field>
      )}
      <Field label="Que s'est-il passé ?">
        <textarea required rows={4} className="field" value={note} onChange={(e) => setNote(e.target.value)} placeholder="Date, circonstances, personnes présentes…" />
      </Field>
      <div>
        <span className="field-label">Photos de preuve</span>
        <div className="flex flex-wrap items-center gap-3">
          <PhotoCapture itemId={item.id} kind="incident" caption="Incident" label="Prendre une photo" onUploaded={(p) => setPhotos((x) => [...x, p])} />
          <PhotoStrip photos={photos} size={56} />
        </div>
      </div>
      <ArrowButton variant="danger" full loading={busy} onClick={submit} disabled={!note.trim()}>
        Déclarer l&rsquo;incident
      </ArrowButton>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Saisie d'inventaire                                                */
/* ------------------------------------------------------------------ */

interface Line {
  countedQty: string;
  condition: EquipmentCondition;
  note: string;
  photos: EquipmentPhoto[];
}

export function InventoryForm({
  items,
  clubId,
  api,
  onDone,
  coaches,
}: {
  items: EquipmentItem[];
  clubId: string;
  api: Api;
  onDone: () => void;
  coaches: PublicCoach[];
}) {
  const active = useMemo(() => items.filter((i) => i.status !== "reforme").sort((a, b) => a.category.localeCompare(b.category) || a.name.localeCompare(b.name)), [items]);
  const [lines, setLines] = useState<Record<string, Line>>(() =>
    Object.fromEntries(active.map((i) => [i.id, { countedQty: String(i.quantity), condition: i.condition, note: "", photos: [] }]))
  );
  const [comment, setComment] = useState("");
  const [busy, setBusy] = useState(false);

  const setLine = (id: string, patch: Partial<Line>) => setLines((l) => ({ ...l, [id]: { ...l[id], ...patch } }));
  const gaps = active.filter((i) => lines[i.id] && Number(lines[i.id].countedQty) !== i.quantity);
  const changed = active.filter((i) => lines[i.id] && lines[i.id].condition !== i.condition);

  async function submit() {
    setBusy(true);
    const ok = await api(
      "/api/inventories",
      {
        method: "POST",
        json: {
          clubId,
          comment,
          lines: active.map((i) => ({
            itemId: i.id,
            countedQty: Number(lines[i.id].countedQty),
            condition: lines[i.id].condition,
            note: lines[i.id].note,
            photoIds: lines[i.id].photos.map((p) => p.id),
          })),
        },
      },
      gaps.length ? "Inventaire envoyé pour validation" : "Inventaire enregistré"
    );
    setBusy(false);
    if (ok) onDone();
  }

  if (active.length === 0) return <p className="py-10 text-center text-sm text-mutedfg">Aucun matériel à inventorier.</p>;

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-3 gap-2 text-center">
        <Stat label="Articles" value={active.length} />
        <Stat label="Écarts" value={gaps.length} tone={gaps.length ? "danger" : "success"} />
        <Stat label="États modifiés" value={changed.length} tone={changed.length ? "orange" : undefined} />
      </div>
      <p className="text-xs text-mutedfg">Comptez physiquement chaque article. Un inventaire sans écart est validé automatiquement ; sinon l&rsquo;administration le vérifie.</p>
      <ul className="space-y-2">
        {active.map((i) => {
          const l = lines[i.id];
          const diff = Number(l.countedQty) - i.quantity;
          const resp = coaches.find((c) => c.id === i.responsibleCoachId);
          return (
            <li key={i.id} className={`rounded-2xl border bg-white p-3 transition-colors ${diff !== 0 ? "border-danger/40" : "border-line"}`}>
              <div className="flex items-center gap-3">
                <span className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-muted text-ink">
                  <EquipmentIcon category={i.category} size={18} />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold">{i.name}</p>
                  <p className="truncate font-mono text-[10px] text-mutedfg">
                    {i.code} · attendu {i.quantity} {i.unit}
                    {resp ? ` · ${resp.name}` : ""}
                  </p>
                </div>
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    aria-label="Moins"
                    onClick={() => setLine(i.id, { countedQty: String(Math.max(0, Number(l.countedQty) - 1)) })}
                    className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-line hover:border-ink"
                  >
                    <Minus size={14} />
                  </button>
                  <input
                    type="number"
                    min={0}
                    inputMode="numeric"
                    aria-label={`Quantité comptée — ${i.name}`}
                    className="h-8 w-14 rounded-lg border border-line bg-white text-center font-mono text-sm outline-none focus:border-orange"
                    value={l.countedQty}
                    onChange={(e) => setLine(i.id, { countedQty: e.target.value })}
                  />
                  <button
                    type="button"
                    aria-label="Plus"
                    onClick={() => setLine(i.id, { countedQty: String(Number(l.countedQty) + 1) })}
                    className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-line hover:border-ink"
                  >
                    <Plus size={14} />
                  </button>
                </div>
              </div>
              <div className="mt-3 flex flex-wrap items-center gap-2">
                <select
                  aria-label="État constaté"
                  className="h-9 rounded-full border border-line bg-white px-3 text-xs font-semibold outline-none focus:border-orange"
                  value={l.condition}
                  onChange={(e) => setLine(i.id, { condition: e.target.value as EquipmentCondition })}
                >
                  {EQUIPMENT_CONDITIONS.map((c) => (
                    <option key={c} value={c}>
                      {CONDITION_LABEL[c]}
                    </option>
                  ))}
                </select>
                {diff !== 0 && (
                  <span className={`rounded-full px-2 py-1 font-mono text-[11px] font-semibold ${diff < 0 ? "bg-danger/10 text-danger" : "bg-success/10 text-success"}`}>
                    {diff > 0 ? "+" : ""}
                    {diff}
                  </span>
                )}
                <span className="flex-1" />
                <PhotoCapture compact itemId={i.id} kind="inventaire" caption={`Inventaire — ${i.name}`} label="Photo" onUploaded={(p) => setLine(i.id, { photos: [...l.photos, p] })} />
              </div>
              {(diff !== 0 || l.condition !== i.condition) && (
                <input
                  className="field mt-2 py-2 text-sm"
                  placeholder="Explication de l'écart (obligatoire de fait pour l'administration)"
                  value={l.note}
                  onChange={(e) => setLine(i.id, { note: e.target.value })}
                />
              )}
              {l.photos.length > 0 && (
                <div className="mt-2">
                  <PhotoStrip photos={l.photos} size={44} />
                </div>
              )}
            </li>
          );
        })}
      </ul>
      <Field label="Commentaire général">
        <textarea rows={3} className="field" value={comment} onChange={(e) => setComment(e.target.value)} />
      </Field>
      <ArrowButton full loading={busy} onClick={submit} icon={ClipboardList}>
        {gaps.length ? `Envoyer l'inventaire (${gaps.length} écart${gaps.length > 1 ? "s" : ""})` : "Valider l'inventaire"}
      </ArrowButton>
    </div>
  );
}

function Stat({ label, value, tone }: { label: string; value: number; tone?: "danger" | "success" | "orange" }) {
  const c = tone === "danger" ? "text-danger" : tone === "success" ? "text-success" : tone === "orange" ? "text-orange" : "";
  return (
    <div className="rounded-2xl bg-muted/70 p-3">
      <p className={`h-display text-3xl leading-none ${c}`}>{value}</p>
      <p className="mt-1 font-mono text-[10px] uppercase tracking-wider text-mutedfg">{label}</p>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Journal des mouvements                                             */
/* ------------------------------------------------------------------ */

export function MovementTimeline({
  movements,
  photos,
  clubs,
  coaches,
  showItem = true,
  limit,
}: {
  movements: EquipmentMovement[];
  photos: EquipmentPhoto[];
  clubs: PartnerClub[];
  coaches: PublicCoach[];
  showItem?: boolean;
  limit?: number;
}) {
  const [n, setN] = useState(limit ?? 30);
  const sorted = [...movements].sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1));
  if (sorted.length === 0) return <p className="py-8 text-center text-sm text-mutedfg">Aucun mouvement enregistré.</p>;
  const clubName = (id?: string) => clubs.find((c) => c.id === id)?.name ?? "—";
  const coachName = (id?: string | null) => (id ? coaches.find((c) => c.id === id)?.name ?? "Coach supprimé" : "Non attribué");
  return (
    <div>
      <ol className="relative space-y-4 border-l border-line pl-6">
        {sorted.slice(0, n).map((m) => {
          const Icon = MOVEMENT_ICON[m.type];
          const ph = photos.filter((p) => m.photoIds?.includes(p.id));
          const danger = m.type === "incident" || m.type === "reforme";
          return (
            <li key={m.id} className="relative">
              <span
                className={`absolute -left-[37px] top-0 inline-flex h-7 w-7 items-center justify-center rounded-full ring-4 ring-bg ${
                  danger ? "bg-danger text-white" : m.type === "dotation" || m.type === "declaration" ? "bg-orange text-white" : "bg-ink text-white"
                }`}
              >
                <Icon size={13} />
              </span>
              <p className="text-sm font-semibold">
                {MOVEMENT_LABEL[m.type]}
                {showItem && <span className="font-normal text-mutedfg"> — {m.itemName}</span>}
              </p>
              <p className="font-mono text-[10px] text-mutedfg">
                {fmtDateTime(m.createdAt)} · {m.by.name} ({m.by.role === "admin" ? "admin" : "coach"})
              </p>
              <div className="mt-1 space-y-0.5 text-xs text-ink/80">
                {m.qtyBefore !== undefined && m.qtyAfter !== undefined && m.qtyBefore !== m.qtyAfter && (
                  <p>
                    Quantité : {m.qtyBefore} → <strong>{m.qtyAfter}</strong>
                  </p>
                )}
                {m.type !== "dotation" && m.type !== "declaration" && m.qtyAfter !== undefined && m.qtyBefore === undefined && <p>Quantité : {m.qtyAfter}</p>}
                {(m.type === "dotation" || m.type === "declaration") && m.qtyAfter !== undefined && <p>Quantité : {m.qtyAfter}</p>}
                {m.conditionBefore && m.conditionAfter && m.conditionBefore !== m.conditionAfter && (
                  <p>
                    État : {CONDITION_LABEL[m.conditionBefore]} → <strong>{CONDITION_LABEL[m.conditionAfter]}</strong>
                  </p>
                )}
                {m.toClubId && m.fromClubId !== m.toClubId && (
                  <p>
                    Club : {clubName(m.fromClubId)} → <strong>{clubName(m.toClubId)}</strong>
                  </p>
                )}
                {m.type === "responsable" && (
                  <p>
                    Responsable : {coachName(m.fromCoachId)} → <strong>{coachName(m.toCoachId)}</strong>
                  </p>
                )}
                {m.note && <p className="text-mutedfg">« {m.note} »</p>}
              </div>
              {ph.length > 0 && (
                <div className="mt-2">
                  <PhotoStrip photos={ph} size={44} />
                </div>
              )}
            </li>
          );
        })}
      </ol>
      {sorted.length > n && (
        <button onClick={() => setN((x) => x + 30)} className="mt-4 w-full rounded-full bg-muted py-2 text-xs font-semibold text-mutedfg hover:text-ink">
          Afficher plus ({sorted.length - n})
        </button>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Fiche matériel (détail + photos + historique)                      */
/* ------------------------------------------------------------------ */

export function EquipmentDetail({
  item,
  club,
  responsible,
  photos,
  movements,
  clubs,
  coaches,
  canPhoto,
  onPhoto,
  onDeletePhoto,
}: {
  item: EquipmentItem;
  club?: PartnerClub;
  responsible?: PublicCoach | null;
  photos: EquipmentPhoto[];
  movements: EquipmentMovement[];
  clubs: PartnerClub[];
  coaches: PublicCoach[];
  canPhoto: boolean;
  onPhoto: () => void;
  onDeletePhoto?: (p: EquipmentPhoto) => void;
}) {
  const rows: [string, string][] = [
    ["Code", item.code],
    ["Catégorie", CATEGORY_LABEL[item.category]],
    ["Discipline", item.discipline ? DISCIPLINE_LABEL[item.discipline] : "Polyvalent"],
    ["Quantité", `${item.quantity} ${item.unit}`],
    ["Club", club ? `${club.name} (${club.city})` : "—"],
    ["Responsable", responsible ? `${responsible.name} · ${responsible.phone}` : "Non attribué"],
    ["Origine", ORIGIN_LABEL[item.origin]],
    ["Acquisition", item.acquiredAt ? formatDate(item.acquiredAt) : "—"],
    ["Valeur", item.unitValueFCFA ? `${formatFCFA(item.unitValueFCFA)} × ${item.quantity} = ${formatFCFA(item.unitValueFCFA * item.quantity)}` : "—"],
    ["Stockage", item.storageLocation || "—"],
    ["Marque / réf.", [item.brand, item.serialNumber].filter(Boolean).join(" · ") || "—"],
    ["Dernier inventaire", item.lastInventoryAt ? formatDate(item.lastInventoryAt) : "Jamais"],
  ];
  return (
    <div className="space-y-6">
      <div className="flex items-start gap-4">
        <span className="inline-flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-orange text-white">
          <EquipmentIcon category={item.category} size={28} />
        </span>
        <div className="min-w-0">
          <p className="text-lg font-semibold leading-tight">{item.name}</p>
          <div className="mt-2 flex flex-wrap gap-1.5">
            <Badge tone={CONDITION_TONE[item.condition]}>{CONDITION_LABEL[item.condition]}</Badge>
            <Badge tone={EQUIPMENT_STATUS_TONE[item.status]}>{EQUIPMENT_STATUS_LABEL[item.status]}</Badge>
          </div>
        </div>
      </div>
      <dl className="grid grid-cols-1 gap-x-4 rounded-2xl border border-line bg-white sm:grid-cols-2">
        {rows.map(([k, v]) => (
          <div key={k} className="border-b border-line px-4 py-2.5 last:border-0 sm:[&:nth-last-child(2)]:border-0">
            <dt className="font-mono text-[10px] uppercase tracking-wider text-mutedfg">{k}</dt>
            <dd className="text-sm font-medium">{v}</dd>
          </div>
        ))}
      </dl>
      {item.notes && <p className="rounded-2xl bg-muted/70 p-4 text-sm">{item.notes}</p>}

      <section>
        <div className="mb-3 flex items-center justify-between gap-3">
          <p className="flex items-center gap-2 text-sm font-semibold">
            <Camera size={16} className="text-orange" /> Photos ({photos.length})
          </p>
          {canPhoto && <PhotoCapture compact itemId={item.id} kind="etat" caption={item.name} label="Ajouter" onUploaded={onPhoto} />}
        </div>
        {photos.length ? <PhotoStrip photos={photos} size={76} onDelete={onDeletePhoto} /> : <p className="text-xs text-mutedfg">Aucune photo. Prenez-en une comme preuve de l&rsquo;état du matériel.</p>}
      </section>

      <section>
        <p className="mb-3 flex items-center gap-2 text-sm font-semibold">
          <History size={16} className="text-orange" /> Historique
        </p>
        <MovementTimeline movements={movements} photos={photos} clubs={clubs} coaches={coaches} showItem={false} />
      </section>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Carnet d'alternance                                                */
/* ------------------------------------------------------------------ */

export function Logbook({
  logs,
  api,
  canReview,
  canDelete,
}: {
  logs: AlternanceLog[];
  api?: Api;
  canReview?: boolean;
  canDelete?: (l: AlternanceLog) => boolean;
}) {
  const sorted = [...logs].sort((a, b) => (a.date < b.date ? 1 : -1));
  if (sorted.length === 0) return <p className="py-6 text-center text-sm text-mutedfg">Aucune séance au carnet.</p>;
  return (
    <ul className="divide-y divide-line rounded-2xl border border-line bg-white">
      {sorted.map((l) => (
        <li key={l.id} className="flex flex-wrap items-start gap-3 p-3">
          <span className="flex h-12 w-12 shrink-0 flex-col items-center justify-center rounded-xl bg-muted">
            <span className="h-display text-xl leading-none">{l.hours}</span>
            <span className="font-mono text-[9px] uppercase text-mutedfg">heures</span>
          </span>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-medium">{l.activity}</p>
            <p className="font-mono text-[10px] text-mutedfg">
              {formatDate(l.date)} · saisi par {l.by.name}
            </p>
            {l.tutorComment && <p className="mt-1 text-xs text-mutedfg">Tuteur : « {l.tutorComment} »</p>}
          </div>
          <div className="flex items-center gap-1.5">
            <Badge tone={LOG_STATUS_TONE[l.status]}>{LOG_STATUS_LABEL[l.status]}</Badge>
            {api && canReview && l.status === "a_valider" && (
              <>
                <button
                  title="Valider"
                  aria-label="Valider la séance"
                  onClick={() => api(`/api/logs/${l.id}`, { method: "PATCH", json: { status: "valide" } }, "Séance validée")}
                  className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-line text-success hover:bg-success hover:text-white"
                >
                  <CheckCircle2 size={15} />
                </button>
                <button
                  title="Refuser"
                  aria-label="Refuser la séance"
                  onClick={() => {
                    const c = window.prompt("Motif du refus (facultatif)") ?? "";
                    api(`/api/logs/${l.id}`, { method: "PATCH", json: { status: "refuse", comment: c } }, "Séance refusée");
                  }}
                  className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-line text-danger hover:bg-danger hover:text-white"
                >
                  <XCircle size={15} />
                </button>
              </>
            )}
            {api && canDelete?.(l) && (
              <button
                title="Supprimer"
                aria-label="Supprimer la séance"
                onClick={() => api(`/api/logs/${l.id}`, { method: "DELETE" }, "Séance supprimée")}
                className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-line text-mutedfg hover:bg-danger hover:text-white"
              >
                <Trash2 size={14} />
              </button>
            )}
          </div>
        </li>
      ))}
    </ul>
  );
}

/** Formulaire d'ajout d'une séance au carnet. */
export function LogForm({ placementId, api, onDone, hint }: { placementId: string; api: Api; onDone?: () => void; hint?: string }) {
  const today = new Date().toISOString().slice(0, 10);
  const [date, setDate] = useState(today);
  const [hours, setHours] = useState("3");
  const [activity, setActivity] = useState("");
  const [busy, setBusy] = useState(false);
  return (
    <form
      className="space-y-3"
      onSubmit={async (e) => {
        e.preventDefault();
        setBusy(true);
        const ok = await api(`/api/placements/${placementId}/logs`, { method: "POST", json: { date, hours: Number(hours), activity } }, "Séance ajoutée au carnet");
        setBusy(false);
        if (ok) {
          setActivity("");
          onDone?.();
        }
      }}
    >
      <div className="grid grid-cols-2 gap-3">
        <Field label="Date">
          <input type="date" required max={today} className="field" value={date} onChange={(e) => setDate(e.target.value)} />
        </Field>
        <Field label="Durée (h)">
          <input type="number" required min={0.5} max={12} step={0.5} className="field" value={hours} onChange={(e) => setHours(e.target.value)} />
        </Field>
      </div>
      <Field label="Activité réalisée" hint={hint}>
        <textarea required rows={3} className="field" value={activity} onChange={(e) => setActivity(e.target.value)} placeholder="Ex. Animation séance mini-tennis 6-8 ans, 12 enfants" />
      </Field>
      <ArrowButton type="submit" size="sm" loading={busy}>
        Ajouter au carnet
      </ArrowButton>
    </form>
  );
}

