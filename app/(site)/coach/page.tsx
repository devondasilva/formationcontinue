"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  Boxes,
  ClipboardList,
  History,
  Handshake,
  UserCog,
  LogOut,
  PackagePlus,
  Pencil,
  ShieldAlert,
  Eye,
  ScanLine,
  Building2,
  MapPin,
  Phone,
  Mail,
  KeyRound,
  CheckCircle2,
  AlertTriangle,
  Wrench,
  NotebookPen,
  BadgeCheck,
  Target,
  CalendarRange,
  Clock,
  Camera,
  Lock,
} from "lucide-react";
import type {
  AlternanceLog,
  EquipmentItem,
  EquipmentMovement,
  EquipmentPhoto,
  Inventory,
  PartnerClub,
  Placement,
  PublicCoach,
} from "@/lib/types";
import {
  INVENTORY_MAX_AGE_DAYS,
  INVENTORY_STATUS_LABEL,
  INVENTORY_STATUS_TONE,
  PLACEMENT_STATUS_LABEL,
  PLACEMENT_STATUS_TONE,
  daysSince,
  formatDate,
  formatRange,
} from "@/lib/labels";
import ArrowButton from "@/components/ui/ArrowButton";
import { Badge, EmptyState, Field, Skeleton } from "@/components/ui/primitives";
import {
  EquipmentCard,
  EquipmentDetail,
  EquipmentFields,
  IncidentForm,
  InventoryForm,
  LogForm,
  Logbook,
  MovementTimeline,
  emptyEquipment,
  equipmentPayload,
  equipmentToForm,
  type Api,
  type EquipmentFormValue,
} from "@/components/network/EquipmentUI";
import { EvaluationForm, HoursBar } from "@/components/network/AlternanceUI";
import { PhotoCapture } from "@/components/network/Photos";
import { Avatar, Drawer, FilterPills } from "@/app/admin/_components/kit";

type CoachPlacement = Placement & { hours: { validated: number; pending: number }; learner: { name: string; email: string; phone: string } | null };
interface Me {
  coach: PublicCoach;
  club: PartnerClub | null;
  colleagues: PublicCoach[];
  items: EquipmentItem[];
  movements: EquipmentMovement[];
  inventories: Inventory[];
  photos: EquipmentPhoto[];
  placements: CoachPlacement[];
  logs: AlternanceLog[];
}
type Tab = "materiel" | "inventaire" | "historique" | "alternants" | "compte";
interface Toast {
  id: number;
  ok: boolean;
  text: string;
}

export default function CoachPage() {
  const [me, setMe] = useState<Me | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [tab, setTab] = useState<Tab>("materiel");
  const [toasts, setToasts] = useState<Toast[]>([]);
  const seq = useRef(0);

  const load = useCallback(async () => {
    const r = await fetch("/api/coach/me", { cache: "no-store" });
    const d = await r.json().catch(() => ({}));
    if (!r.ok) return setError(d.error ?? "Session expirée.");
    setMe(d);
  }, []);
  useEffect(() => {
    load();
  }, [load]);

  const notify = useCallback((text: string, ok = true) => {
    const id = ++seq.current;
    setToasts((t) => [...t, { id, ok, text }]);
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 3600);
  }, []);

  const api: Api = useCallback(
    async (url, init, success) => {
      try {
        const res = await fetch(url, {
          method: init.method,
          headers: init.json !== undefined ? { "Content-Type": "application/json" } : undefined,
          body: init.json !== undefined ? JSON.stringify(init.json) : undefined,
        });
        const data = await res.json().catch(() => ({}));
        if (!res.ok) {
          notify(data.error ?? "Une erreur est survenue.", false);
          return false;
        }
        await load();
        if (success) notify(success);
        return true;
      } catch {
        notify("Impossible de contacter le serveur.", false);
        return false;
      }
    },
    [load, notify]
  );

  async function logout() {
    await fetch("/api/auth/logout", { method: "POST" });
    window.location.href = "/";
  }

  if (error)
    return (
      <div className="mx-auto max-w-content px-5 py-20 sm:px-6">
        <EmptyState icon={Lock} title="Accès impossible" text={error} action={<ArrowButton href="/login?next=/coach">Me reconnecter</ArrowButton>} />
      </div>
    );
  if (!me)
    return (
      <div className="mx-auto max-w-content space-y-4 px-5 py-16 sm:px-6">
        <Skeleton className="h-48" />
        <div className="grid gap-4 sm:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-24" />
          ))}
        </div>
        <Skeleton className="h-80" />
      </div>
    );

  const { coach, club } = me;
  const mine = me.items.filter((i) => i.responsibleCoachId === coach.id && i.status !== "reforme");
  const manageable = me.items.filter((i) => i.status !== "reforme" && (coach.isEquipmentManager || i.responsibleCoachId === coach.id));
  const lastInv = [...me.inventories].sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1))[0];
  const invAge = daysSince(lastInv?.date);
  const pendingLogs = me.logs.filter((l) => l.status === "a_valider").length;
  const activePl = me.placements.filter((p) => p.status === "en_cours").length;
  const toRepair = manageable.filter((i) => i.condition === "a_reparer" || i.status === "en_reparation").length;
  const showAlternants = coach.isTutor || me.placements.length > 0;

  const kpis = [
    { icon: Boxes, label: "Articles en charge", value: String(coach.isEquipmentManager ? manageable.length : mine.length), sub: `${(coach.isEquipmentManager ? manageable : mine).reduce((s, e) => s + e.quantity, 0)} unités` },
    { icon: Wrench, label: "À réparer", value: String(toRepair), hot: toRepair > 0 },
    { icon: ClipboardList, label: "Dernier inventaire", value: lastInv ? `${invAge} j` : "—", sub: lastInv ? formatDate(lastInv.date) : "jamais", hot: invAge === null ? manageable.length > 0 : invAge > INVENTORY_MAX_AGE_DAYS },
    { icon: Handshake, label: "Alternants suivis", value: String(activePl), sub: pendingLogs ? `${pendingLogs} séance${pendingLogs > 1 ? "s" : ""} à valider` : undefined, hot: pendingLogs > 0 },
  ];

  const tabs: { id: Tab; label: string; icon: typeof Boxes; count?: number }[] = [
    { id: "materiel", label: "Matériel", icon: Boxes, count: manageable.length },
    { id: "inventaire", label: "Inventaire", icon: ClipboardList },
    { id: "historique", label: "Historique", icon: History },
    ...(showAlternants ? [{ id: "alternants" as Tab, label: "Alternants", icon: Handshake, count: pendingLogs || undefined }] : []),
    { id: "compte", label: "Mon compte", icon: UserCog },
  ];

  return (
    <div className="mx-auto max-w-content px-5 pb-24 pt-10 sm:px-6">
      {/* En-tête */}
      <motion.section initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="court-lines relative overflow-hidden rounded-card bg-ink p-6 text-white sm:p-8">
        <div className="pointer-events-none absolute -right-24 -top-24 h-72 w-72 rounded-full bg-orange/30 blur-3xl" />
        <div className="relative flex flex-wrap items-end justify-between gap-6">
          <div className="min-w-0">
            <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-orange">Espace coach · Club partenaire MADES</p>
            <h1 className="h-display mt-3 text-[clamp(2.6rem,7vw,4.5rem)]">
              Bonjour, <span className="text-orange">{coach.name.split(" ")[0]}.</span>
            </h1>
            <p className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-white/70">
              <span className="inline-flex items-center gap-1.5">
                <Building2 size={14} /> {club?.name ?? "Club"}
              </span>
              {club?.city && (
                <span className="inline-flex items-center gap-1.5">
                  <MapPin size={14} /> {club.city}
                </span>
              )}
            </p>
            <div className="mt-3 flex flex-wrap gap-1.5">
              {coach.isEquipmentManager && <span className="rounded-full bg-orange px-3 py-1 text-[11px] font-semibold">Responsable matériel du club</span>}
              {coach.isTutor && <span className="rounded-full bg-white/15 px-3 py-1 text-[11px] font-semibold">Tuteur d&rsquo;alternance</span>}
            </div>
          </div>
          <button onClick={logout} className="inline-flex items-center gap-2 rounded-full border border-white/20 px-4 py-2 text-sm font-semibold text-white/80 transition-colors hover:border-danger hover:bg-danger hover:text-white">
            <LogOut size={15} /> Déconnexion
          </button>
        </div>
      </motion.section>

      {coach.mustChangePassword ? (
        <div className="mx-auto mt-8 max-w-lg">
          <div className="card p-6 sm:p-8">
            <span className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-orange text-white">
              <KeyRound size={22} />
            </span>
            <p className="h-display mt-4 text-3xl">Choisissez votre mot de passe</p>
            <p className="mt-1 text-sm text-mutedfg">Première connexion : remplacez le mot de passe provisoire transmis par MADES.</p>
            <div className="mt-6">
              <PasswordForm api={api} provisional />
            </div>
          </div>
        </div>
      ) : (
        <>
          {/* Indicateurs */}
          <div className="mt-6 grid grid-cols-2 gap-3 lg:grid-cols-4">
            {kpis.map((k, i) => (
              <motion.div key={k.label} initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.06 * i }} className={`card p-4 ${k.hot ? "border-orange/40" : ""}`}>
                <div className="flex items-center justify-between">
                  <span className={`inline-flex h-10 w-10 items-center justify-center rounded-xl ${k.hot ? "bg-orange text-white" : "bg-orangeL text-orange"}`}>
                    <k.icon size={18} />
                  </span>
                </div>
                <p className="h-display mt-3 text-4xl leading-none">{k.value}</p>
                <p className="mt-1 font-mono text-[10px] uppercase tracking-wider text-mutedfg">{k.label}</p>
                {k.sub && <p className="text-[11px] text-mutedfg">{k.sub}</p>}
              </motion.div>
            ))}
          </div>

          {/* Onglets */}
          <div className="sticky top-[4.5rem] z-20 -mx-5 mt-8 overflow-x-auto bg-bg/90 px-5 py-2 backdrop-blur scrollbar-thin sm:mx-0 sm:px-0">
            <FilterPills value={tab} onChange={setTab} options={tabs} />
          </div>

          <div className="mt-6">
            {tab === "materiel" && <MaterielTab me={me} api={api} reload={load} />}
            {tab === "inventaire" && <InventaireTab me={me} api={api} manageable={manageable} />}
            {tab === "historique" && (
              <div className="card p-5 sm:p-6">
                <MovementTimeline movements={me.movements} photos={me.photos} clubs={club ? [club] : []} coaches={me.colleagues} />
              </div>
            )}
            {tab === "alternants" && <AlternantsTab me={me} api={api} />}
            {tab === "compte" && <CompteTab me={me} api={api} />}
          </div>
        </>
      )}

      {/* Toasts */}
      <div className="pointer-events-none fixed bottom-5 left-1/2 z-[95] flex -translate-x-1/2 flex-col items-center gap-2">
        <AnimatePresence>
          {toasts.map((t) => (
            <motion.div
              key={t.id}
              initial={{ opacity: 0, y: 16, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 8 }}
              className={`flex items-center gap-2 rounded-full px-5 py-3 text-sm font-semibold text-white shadow-lift ${t.ok ? "bg-ink" : "bg-danger"}`}
            >
              {t.ok ? <CheckCircle2 size={16} className="text-orange" /> : <AlertTriangle size={16} />} {t.text}
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */

function MaterielTab({ me, api, reload }: { me: Me; api: Api; reload: () => Promise<void> }) {
  const { coach } = me;
  const [scope, setScope] = useState<"mine" | "club">(coach.isEquipmentManager ? "club" : "mine");
  const [editing, setEditing] = useState<EquipmentItem | "new" | null>(null);
  const [form, setForm] = useState<EquipmentFormValue>(emptyEquipment(coach.clubId, coach.id, "dotation_mades"));
  const [saving, setSaving] = useState(false);
  const [detailId, setDetailId] = useState<string | null>(null);
  const [incident, setIncident] = useState<EquipmentItem | null>(null);

  const can = (i: EquipmentItem) => coach.isEquipmentManager || i.responsibleCoachId === coach.id;
  const live = me.items.filter((i) => i.status !== "reforme");
  const list = useMemo(
    () => (scope === "mine" ? live.filter((i) => i.responsibleCoachId === coach.id) : live).sort((a, b) => a.category.localeCompare(b.category) || a.name.localeCompare(b.name)),
    [scope, live, coach.id]
  );
  const photosOf = (id: string) => me.photos.filter((p) => p.itemId === id).sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1));
  const colleague = (id: string | null) => (id ? me.colleagues.find((c) => c.id === id) ?? null : null);
  const detail = detailId ? me.items.find((i) => i.id === detailId) ?? null : null;
  const isNew = editing === "new";
  const scopeKey = isNew ? "coach-new" : "coach-edit";

  async function save() {
    const el = document.getElementById("coach-eq-form") as HTMLFormElement | null;
    if (el && !el.reportValidity()) return;
    setSaving(true);
    const body = equipmentPayload(form, scopeKey, coach.isEquipmentManager);
    const ok = isNew ? await api("/api/equipment", { method: "POST", json: body }, "Matériel déclaré") : await api(`/api/equipment/${(editing as EquipmentItem).id}`, { method: "PATCH", json: body }, "Matériel mis à jour");
    setSaving(false);
    if (ok) setEditing(null);
  }

  return (
    <div>
      <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <FilterPills
          value={scope}
          onChange={setScope}
          options={[
            { id: "mine", label: "Sous ma responsabilité", count: live.filter((i) => i.responsibleCoachId === coach.id).length },
            { id: "club", label: "Tout le club", count: live.length },
          ]}
        />
        <ArrowButton
          icon={PackagePlus}
          onClick={() => {
            setForm(emptyEquipment(coach.clubId, coach.id, "dotation_mades"));
            setEditing("new");
          }}
        >
          Déclarer du matériel
        </ArrowButton>
      </div>

      {list.length === 0 ? (
        <EmptyState
          icon={Boxes}
          title="Aucun matériel"
          text={scope === "mine" ? "Aucun matériel n'est enregistré à votre nom. Déclarez celui dont vous avez la charge." : "Le club n'a pas encore de matériel enregistré."}
        />
      ) : (
        <div className="grid gap-3 md:grid-cols-2">
          <AnimatePresence initial={false}>
            {list.map((e, i) => (
              <EquipmentCard
                key={e.id}
                index={i}
                item={e}
                responsible={colleague(e.responsibleCoachId)}
                photos={photosOf(e.id)}
                onOpen={() => setDetailId(e.id)}
                actions={
                  can(e) ? (
                    <>
                      <button onClick={() => setDetailId(e.id)} className="inline-flex h-9 items-center gap-1.5 rounded-full border border-line px-3 text-xs font-semibold hover:border-ink">
                        <Eye size={14} /> Fiche
                      </button>
                      <button
                        onClick={() => {
                          setForm(equipmentToForm(e));
                          setEditing(e);
                        }}
                        className="inline-flex h-9 items-center gap-1.5 rounded-full border border-line px-3 text-xs font-semibold hover:border-ink"
                      >
                        <Pencil size={14} /> État
                      </button>
                      <PhotoCapture compact itemId={e.id} kind="etat" caption={e.name} label="Photo" onUploaded={() => (reload(), undefined)} />
                      <span className="flex-1" />
                      <button onClick={() => setIncident(e)} title="Signaler casse, perte ou vol" className="inline-flex h-9 items-center gap-1.5 rounded-full px-3 text-xs font-semibold text-danger hover:bg-danger hover:text-white">
                        <ShieldAlert size={14} /> Incident
                      </button>
                    </>
                  ) : (
                    <span className="flex items-center gap-1.5 text-xs text-mutedfg">
                      <Lock size={12} /> Géré par {colleague(e.responsibleCoachId)?.name ?? "personne"} — lecture seule
                    </span>
                  )
                }
              />
            ))}
          </AnimatePresence>
        </div>
      )}

      <Drawer
        open={editing !== null}
        onClose={() => setEditing(null)}
        title={isNew ? "Déclarer du matériel" : "Mettre à jour"}
        icon={isNew ? PackagePlus : Pencil}
        footer={
          <div className="flex justify-end gap-2">
            <button onClick={() => setEditing(null)} className="rounded-full px-5 py-3 text-sm font-semibold text-mutedfg hover:text-ink">
              Annuler
            </button>
            <ArrowButton loading={saving} onClick={save}>
              Enregistrer
            </ArrowButton>
          </div>
        }
      >
        <form id="coach-eq-form" onSubmit={(e) => e.preventDefault()}>
          {!isNew && editing && (
            <p className="mb-5 rounded-2xl bg-muted/70 p-3 text-sm">
              <strong>{editing.name}</strong>
              <span className="block font-mono text-[11px] text-mutedfg">
                {editing.code} · {editing.quantity} {editing.unit} — la quantité se corrige par inventaire ou incident.
              </span>
            </p>
          )}
          <EquipmentFields value={form} onChange={setForm} scope={scopeKey} clubs={me.club ? [me.club] : []} coaches={me.colleagues} isNew={isNew} canAssign={coach.isEquipmentManager} />
          {isNew && <p className="mt-4 text-xs text-mutedfg">Après l&rsquo;enregistrement, ouvrez la fiche pour ajouter des photos de preuve.</p>}
        </form>
      </Drawer>

      <Drawer open={!!detail} onClose={() => setDetailId(null)} title="Fiche matériel" icon={Boxes}>
        {detail && (
          <EquipmentDetail
            item={detail}
            club={me.club ?? undefined}
            responsible={colleague(detail.responsibleCoachId)}
            photos={photosOf(detail.id)}
            movements={me.movements.filter((m) => m.itemId === detail.id)}
            clubs={me.club ? [me.club] : []}
            coaches={me.colleagues}
            canPhoto={can(detail)}
            onPhoto={() => reload()}
            onDeletePhoto={(p) => api(`/api/photos/${p.id}`, { method: "DELETE" }, "Photo supprimée")}
          />
        )}
      </Drawer>

      <Drawer open={!!incident} onClose={() => setIncident(null)} title="Signaler un incident" icon={ShieldAlert}>
        {incident && <IncidentForm item={incident} api={api} onDone={() => setIncident(null)} />}
      </Drawer>
    </div>
  );
}

function InventaireTab({ me, api, manageable }: { me: Me; api: Api; manageable: EquipmentItem[] }) {
  const [running, setRunning] = useState(false);
  const list = [...me.inventories].sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1));
  const toRedo = list.find((i) => i.status === "a_revoir");
  return (
    <div className="space-y-5">
      <div className="relative overflow-hidden rounded-card bg-orange p-6 text-white sm:p-8">
        <span className="court-lines pointer-events-none absolute inset-0 opacity-40" />
        <div className="relative flex flex-wrap items-center justify-between gap-4">
          <div className="max-w-lg">
            <p className="h-display text-3xl sm:text-4xl">Faire l&rsquo;inventaire</p>
            <p className="mt-1 text-sm text-white/85">
              Comptez {me.coach.isEquipmentManager ? "tout le matériel du club" : "le matériel dont vous êtes responsable"} ({manageable.length} article{manageable.length > 1 ? "s" : ""}), notez l&rsquo;état et prenez des photos en cas d&rsquo;écart. À faire au moins tous les {INVENTORY_MAX_AGE_DAYS} jours.
            </p>
          </div>
          <ArrowButton variant="light" icon={ScanLine} onClick={() => setRunning(true)} disabled={manageable.length === 0}>
            Commencer
          </ArrowButton>
        </div>
      </div>

      {toRedo && (
        <div className="flex items-start gap-3 rounded-2xl border border-danger/30 bg-danger/5 p-4 text-sm">
          <AlertTriangle size={18} className="mt-0.5 shrink-0 text-danger" />
          <div>
            <p className="font-semibold text-danger">L&rsquo;administration demande de revoir l&rsquo;inventaire du {formatDate(toRedo.date)}</p>
            {toRedo.reviewComment && <p className="mt-0.5 text-mutedfg">« {toRedo.reviewComment} »</p>}
          </div>
        </div>
      )}

      {list.length === 0 ? (
        <EmptyState icon={ClipboardList} title="Aucun inventaire" text="Le premier inventaire du club apparaîtra ici." />
      ) : (
        <ul className="divide-y divide-line rounded-card border border-line bg-white">
          {list.map((inv) => (
            <li key={inv.id} className="flex flex-wrap items-center gap-3 p-4">
              <span className="inline-flex h-11 w-11 items-center justify-center rounded-xl bg-muted">
                <ClipboardList size={18} className="text-orange" />
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold">Inventaire du {formatDate(inv.date)}</p>
                <p className="font-mono text-[11px] text-mutedfg">
                  {inv.by.name} · {inv.lines.length} articles · {inv.discrepancies} écart{inv.discrepancies > 1 ? "s" : ""}
                  {inv.lines.some((l) => l.photoIds?.length) && (
                    <>
                      {" · "}
                      <Camera size={10} className="inline" /> {inv.lines.reduce((n, l) => n + (l.photoIds?.length ?? 0), 0)}
                    </>
                  )}
                </p>
              </div>
              <Badge tone={INVENTORY_STATUS_TONE[inv.status]}>{INVENTORY_STATUS_LABEL[inv.status]}</Badge>
            </li>
          ))}
        </ul>
      )}

      <Drawer open={running} onClose={() => setRunning(false)} title="Inventaire" icon={ScanLine}>
        {running && <InventoryForm clubId={me.coach.clubId} items={manageable} coaches={me.colleagues} api={api} onDone={() => setRunning(false)} />}
      </Drawer>
    </div>
  );
}

function AlternantsTab({ me, api }: { me: Me; api: Api }) {
  const [open, setOpen] = useState<string | null>(me.placements.find((p) => p.status === "en_cours")?.id ?? null);
  const list = [...me.placements].sort((a, b) => (a.status === "en_cours" ? -1 : b.status === "en_cours" ? 1 : a.startDate < b.startDate ? 1 : -1));
  if (list.length === 0) return <EmptyState icon={Handshake} title="Aucun alternant" text="L'administration MADES vous attribuera des apprenants en alternance dans votre club." />;
  return (
    <div className="space-y-4">
      {list.map((p) => {
        const logs = me.logs.filter((l) => l.placementId === p.id);
        const pending = logs.filter((l) => l.status === "a_valider").length;
        const mineTutor = p.tutorCoachId === me.coach.id;
        const expanded = open === p.id;
        return (
          <motion.div layout key={p.id} className="card overflow-hidden">
            <button onClick={() => setOpen(expanded ? null : p.id)} className="flex w-full flex-wrap items-center gap-4 p-5 text-left">
              <Avatar name={p.learnerName} size={48} />
              <div className="min-w-0 flex-1">
                <p className="font-semibold">{p.learnerName}</p>
                <p className="truncate text-xs text-mutedfg">{p.formationTitle ?? "Alternance"}</p>
                <div className="mt-2 flex flex-wrap gap-1.5">
                  <Badge tone={PLACEMENT_STATUS_TONE[p.status]}>{PLACEMENT_STATUS_LABEL[p.status]}</Badge>
                  {pending > 0 && <Badge tone="orange">{pending} à valider</Badge>}
                  {!mineTutor && <Badge tone="muted">Sans tuteur — contactez MADES</Badge>}
                </div>
              </div>
              <div className="w-full sm:w-64">
                <HoursBar validated={p.hours.validated} pending={p.hours.pending} planned={p.hoursPlanned} />
              </div>
            </button>
            <AnimatePresence initial={false}>
              {expanded && (
                <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
                  <div className="grid gap-6 border-t border-line p-5 lg:grid-cols-5">
                    <div className="space-y-4 lg:col-span-2">
                      <div className="space-y-1.5 text-sm">
                        <p className="flex items-center gap-2">
                          <CalendarRange size={14} className="text-orange" /> {formatRange(p.startDate, p.endDate)}
                        </p>
                        {p.schedule && (
                          <p className="flex items-center gap-2">
                            <Clock size={14} className="text-orange" /> {p.schedule}
                          </p>
                        )}
                        {p.learner?.phone && (
                          <a href={`tel:${p.learner.phone}`} className="flex items-center gap-2 hover:text-orange">
                            <Phone size={14} className="text-orange" /> {p.learner.phone}
                          </a>
                        )}
                        {p.learner?.email && (
                          <a href={`mailto:${p.learner.email}`} className="flex items-center gap-2 break-all hover:text-orange">
                            <Mail size={14} className="text-orange" /> {p.learner.email}
                          </a>
                        )}
                      </div>
                      {p.objectives && (
                        <div className="rounded-2xl bg-muted/70 p-4">
                          <p className="mb-1 flex items-center gap-2 text-sm font-semibold">
                            <Target size={14} className="text-orange" /> Objectifs
                          </p>
                          <p className="whitespace-pre-line text-sm text-mutedfg">{p.objectives}</p>
                        </div>
                      )}
                      {mineTutor && p.status !== "interrompu" && (
                        <details className="rounded-2xl border border-line p-4">
                          <summary className="cursor-pointer text-sm font-semibold">Ajouter une séance</summary>
                          <div className="mt-4">
                            <LogForm placementId={p.id} api={api} />
                          </div>
                        </details>
                      )}
                    </div>
                    <div className="space-y-5 lg:col-span-3">
                      <section>
                        <p className="mb-3 flex items-center gap-2 text-sm font-semibold">
                          <NotebookPen size={16} className="text-orange" /> Carnet de bord
                        </p>
                        <Logbook logs={logs} api={api} canReview={mineTutor} canDelete={(l) => l.by.role === "coach" && l.by.id === me.coach.id && l.status !== "valide"} />
                      </section>
                      {mineTutor && (
                        <section className="rounded-2xl border border-line p-4">
                          <p className="mb-3 flex items-center gap-2 text-sm font-semibold">
                            <BadgeCheck size={16} className="text-orange" /> Évaluation de fin d&rsquo;alternance
                          </p>
                          <EvaluationForm placement={p} api={api} />
                        </section>
                      )}
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        );
      })}
    </div>
  );
}

function CompteTab({ me, api }: { me: Me; api: Api }) {
  const { coach, club, colleagues } = me;
  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <div className="card p-6">
        <p className="mb-4 flex items-center gap-2 text-sm font-semibold">
          <UserCog size={16} className="text-orange" /> Mon profil
        </p>
        <div className="flex items-center gap-4">
          <Avatar name={coach.name} size={56} />
          <div className="min-w-0">
            <p className="font-semibold">{coach.name}</p>
            <p className="truncate text-sm text-mutedfg">{coach.email}</p>
            <p className="text-sm text-mutedfg">{coach.phone}</p>
          </div>
        </div>
        <p className="mt-4 text-xs text-mutedfg">Pour modifier ces informations, contactez l&rsquo;équipe MADES.</p>
        {club && (
          <div className="mt-6 border-t border-line pt-5">
            <p className="mb-2 flex items-center gap-2 text-sm font-semibold">
              <Building2 size={16} className="text-orange" /> {club.name}
            </p>
            <p className="text-sm text-mutedfg">{[club.address, club.city].filter(Boolean).join(", ")}</p>
            <ul className="mt-4 space-y-2">
              {colleagues
                .filter((c) => c.id !== coach.id && c.active)
                .map((c) => (
                  <li key={c.id} className="flex items-center gap-3 text-sm">
                    <Avatar name={c.name} size={28} />
                    <span className="flex-1 truncate">{c.name}</span>
                    {c.isEquipmentManager && <Badge tone="orange">Resp. matériel</Badge>}
                  </li>
                ))}
            </ul>
          </div>
        )}
      </div>
      <div className="card p-6">
        <p className="mb-4 flex items-center gap-2 text-sm font-semibold">
          <KeyRound size={16} className="text-orange" /> Changer de mot de passe
        </p>
        <PasswordForm api={api} />
      </div>
    </div>
  );
}

function PasswordForm({ api, provisional = false }: { api: Api; provisional?: boolean }) {
  const [current, setCurrent] = useState("");
  const [next, setNext] = useState("");
  const [confirm, setConfirm] = useState("");
  const [busy, setBusy] = useState(false);
  const mismatch = confirm.length > 0 && next !== confirm;
  return (
    <form
      className="space-y-4"
      onSubmit={async (e) => {
        e.preventDefault();
        if (next !== confirm) return;
        setBusy(true);
        const ok = await api("/api/coach/password", { method: "POST", json: { current, next } }, "Mot de passe mis à jour");
        setBusy(false);
        if (ok) {
          setCurrent("");
          setNext("");
          setConfirm("");
        }
      }}
    >
      <Field label={provisional ? "Mot de passe provisoire" : "Mot de passe actuel"}>
        <input required type="password" autoComplete="current-password" className="field" value={current} onChange={(e) => setCurrent(e.target.value)} />
      </Field>
      <Field label="Nouveau mot de passe" hint="8 caractères minimum.">
        <input required minLength={8} type="password" autoComplete="new-password" className="field" value={next} onChange={(e) => setNext(e.target.value)} />
      </Field>
      <Field label="Confirmation">
        <input required type="password" autoComplete="new-password" className={`field ${mismatch ? "border-danger" : ""}`} value={confirm} onChange={(e) => setConfirm(e.target.value)} />
      </Field>
      {mismatch && <p className="text-xs text-danger">Les deux mots de passe ne correspondent pas.</p>}
      <ArrowButton type="submit" full loading={busy} disabled={mismatch}>
        Enregistrer
      </ArrowButton>
    </form>
  );
}
