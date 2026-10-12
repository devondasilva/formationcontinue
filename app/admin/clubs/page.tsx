"use client";

import { Suspense, useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  Building2,
  Plus,
  Pencil,
  Trash2,
  MapPin,
  Phone,
  Mail,
  Users,
  Boxes,
  Handshake,
  Wrench,
  ClipboardList,
  Eye,
  CalendarRange,
  AlertTriangle,
  UserX,
} from "lucide-react";
import type { ClubStatus, Discipline, PartnerClub } from "@/lib/types";
import {
  CATEGORY_LABEL,
  CLUB_STATUS_LABEL,
  CLUB_STATUS_TONE,
  DISCIPLINES,
  DISCIPLINE_LABEL,
  PLACEMENT_STATUS_LABEL,
  PLACEMENT_STATUS_TONE,
  formatDate,
  formatFCFA,
  formatRange,
} from "@/lib/labels";
import { DisciplineIcon } from "@/components/icons/DisciplineIcon";
import ArrowButton from "@/components/ui/ArrowButton";
import { Badge, EmptyState, Field, Meter, Skeleton } from "@/components/ui/primitives";
import { EquipmentIcon } from "@/components/network/EquipmentIcon";
import { useAdmin } from "../_lib/AdminContext";
import { AdminHeader, Avatar, ConfirmDialog, Drawer, FilterPills, IconAction, SearchBox } from "../_components/kit";

export default function Page() {
  return (
    <Suspense fallback={<Skeleton className="h-96" />}>
      <ClubsAdmin />
    </Suspense>
  );
}

const empty = {
  name: "",
  city: "",
  address: "",
  phone: "",
  email: "",
  contactName: "",
  disciplines: [] as Discipline[],
  alternanceCapacity: "4",
  status: "en_convention" as ClubStatus,
  conventionStart: "",
  conventionEnd: "",
  notes: "",
};
type Filter = ClubStatus | "tous";

function ClubsAdmin() {
  const { stats, mutate } = useAdmin();
  const [filter, setFilter] = useState<Filter>("tous");
  const [q, setQ] = useState("");
  const [editing, setEditing] = useState<PartnerClub | "new" | null>(null);
  const [form, setForm] = useState(empty);
  const [saving, setSaving] = useState(false);
  const [detail, setDetail] = useState<PartnerClub | null>(null);
  const [toDelete, setToDelete] = useState<PartnerClub | null>(null);

  const net = stats?.network;
  const list = useMemo(() => {
    if (!net) return [];
    const needle = q.trim().toLowerCase();
    return net.clubs
      .filter((c) => filter === "tous" || c.status === filter)
      .filter((c) => !needle || `${c.name} ${c.city} ${c.contactName}`.toLowerCase().includes(needle))
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [net, filter, q]);

  if (!stats || !net) return <Skeleton className="h-96" />;

  const summary = (id: string) => net.summaries.find((s) => s.clubId === id);
  const count = (s: ClubStatus) => net.clubs.filter((c) => c.status === s).length;

  function openEdit(c: PartnerClub) {
    setForm({
      name: c.name,
      city: c.city,
      address: c.address,
      phone: c.phone,
      email: c.email,
      contactName: c.contactName,
      disciplines: c.disciplines,
      alternanceCapacity: String(c.alternanceCapacity),
      status: c.status,
      conventionStart: c.conventionStart ?? "",
      conventionEnd: c.conventionEnd ?? "",
      notes: c.notes ?? "",
    });
    setEditing(c);
  }

  async function save() {
    const el = document.getElementById("club-form") as HTMLFormElement | null;
    if (el && !el.reportValidity()) return;
    setSaving(true);
    const body = { ...form, alternanceCapacity: Number(form.alternanceCapacity) };
    const ok =
      editing === "new"
        ? await mutate("/api/clubs", { method: "POST", json: body }, "Club partenaire ajouté")
        : await mutate(`/api/clubs/${(editing as PartnerClub).id}`, { method: "PATCH", json: body }, "Club mis à jour");
    setSaving(false);
    if (ok) setEditing(null);
  }

  const toggleDiscipline = (d: Discipline) =>
    setForm((f) => ({ ...f, disciplines: f.disciplines.includes(d) ? f.disciplines.filter((x) => x !== d) : [...f.disciplines, d] }));

  return (
    <div>
      <AdminHeader
        icon={Building2}
        title="Clubs partenaires"
        subtitle="Les structures qui accueillent les apprenants en alternance et reçoivent du matériel."
        actions={
          <ArrowButton
            icon={Plus}
            onClick={() => {
              setForm(empty);
              setEditing("new");
            }}
          >
            Ajouter un club
          </ArrowButton>
        }
      />

      <div className="mb-5 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <FilterPills
          value={filter}
          onChange={setFilter}
          options={[
            { id: "tous", label: "Tous", count: net.clubs.length },
            { id: "actif", label: "Actifs", count: count("actif") },
            { id: "en_convention", label: "En convention", count: count("en_convention") },
            { id: "suspendu", label: "Suspendus", count: count("suspendu") },
          ]}
        />
        <SearchBox value={q} onChange={setQ} placeholder="Club, ville, contact…" />
      </div>

      {list.length === 0 ? (
        <EmptyState
          icon={Building2}
          title={net.clubs.length ? "Aucun club" : "Aucun club partenaire"}
          text={net.clubs.length ? "Rien ne correspond à ces filtres." : "Ajoutez vos premiers clubs d'accueil pour l'alternance et la dotation de matériel."}
          action={
            !net.clubs.length && (
              <ArrowButton icon={Plus} onClick={() => setEditing("new")}>
                Ajouter un club
              </ArrowButton>
            )
          }
        />
      ) : (
        <div className="grid gap-4 md:grid-cols-2 2xl:grid-cols-3">
          <AnimatePresence initial={false}>
            {list.map((c, i) => {
              const s = summary(c.id);
              return (
                <motion.div
                  key={c.id}
                  layout
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.96 }}
                  transition={{ delay: Math.min(i, 9) * 0.03 }}
                  className="group card flex flex-col overflow-hidden transition-all hover:-translate-y-0.5 hover:border-ink/25 hover:shadow-lift"
                >
                  <button onClick={() => setDetail(c)} className="relative overflow-hidden bg-ink p-5 text-left text-white">
                    <span className="court-lines pointer-events-none absolute inset-0 opacity-30" />
                    <div className="relative flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-white/50">
                          <MapPin size={11} className="mr-1 inline" />
                          {c.city}
                        </p>
                        <p className="h-display mt-1 truncate text-3xl">{c.name}</p>
                      </div>
                      <Badge tone={CLUB_STATUS_TONE[c.status]}>{CLUB_STATUS_LABEL[c.status]}</Badge>
                    </div>
                    <div className="relative mt-3 flex gap-1.5">
                      {c.disciplines.map((d) => (
                        <span key={d} title={DISCIPLINE_LABEL[d]} className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-white/10 transition-colors group-hover:bg-orange">
                          <DisciplineIcon discipline={d} size={16} />
                        </span>
                      ))}
                    </div>
                  </button>
                  <div className="grid grid-cols-3 divide-x divide-line border-b border-line text-center">
                    <Mini icon={Users} label="Coachs" value={s?.coaches ?? 0} />
                    <Mini icon={Boxes} label="Articles" value={s?.items ?? 0} sub={s ? `${s.units} unités` : undefined} />
                    <Mini icon={Handshake} label="Alternants" value={s?.activeAlternants ?? 0} sub={`/ ${c.alternanceCapacity} places`} />
                  </div>
                  <div className="space-y-2 p-5 text-xs">
                    {s && s.valueFCFA > 0 && <p className="font-mono text-mutedfg">Valeur du parc : {formatFCFA(s.valueFCFA)}</p>}
                    <div className="flex flex-wrap gap-1.5">
                      {s && s.toRepair > 0 && (
                        <Badge tone="danger">
                          <Wrench size={11} /> {s.toRepair} à réparer
                        </Badge>
                      )}
                      {s && s.unassigned > 0 && (
                        <Badge tone="orange">
                          <UserX size={11} /> {s.unassigned} sans responsable
                        </Badge>
                      )}
                      {s?.inventoryOverdue && (
                        <Badge tone="danger">
                          <ClipboardList size={11} /> Inventaire en retard
                        </Badge>
                      )}
                      {s && s.lastInventoryDate && !s.inventoryOverdue && <Badge tone="success">Inventaire du {formatDate(s.lastInventoryDate)}</Badge>}
                    </div>
                    <p className="flex items-center gap-1.5 text-mutedfg">
                      <Users size={12} /> {c.contactName || "Contact non renseigné"} {c.phone && `· ${c.phone}`}
                    </p>
                  </div>
                  <div className="mt-auto flex items-center gap-1.5 border-t border-line p-4">
                    <IconAction icon={Eye} label="Fiche du club" onClick={() => setDetail(c)} />
                    <IconAction icon={Pencil} label="Modifier" onClick={() => openEdit(c)} />
                    <IconAction icon={Boxes} label="Voir le matériel" href={`/admin/materiel?club=${c.id}`} />
                    <span className="flex-1" />
                    <IconAction icon={Trash2} label="Supprimer" tone="danger" onClick={() => setToDelete(c)} />
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      )}

      {/* Création / modification */}
      <Drawer
        open={editing !== null}
        onClose={() => setEditing(null)}
        title={editing === "new" ? "Nouveau club" : "Modifier le club"}
        icon={Building2}
        footer={
          <div className="flex justify-end gap-2">
            <button onClick={() => setEditing(null)} className="rounded-full px-5 py-3 text-sm font-semibold text-mutedfg hover:text-ink">
              Annuler
            </button>
            <ArrowButton loading={saving} onClick={save}>
              {editing === "new" ? "Ajouter" : "Enregistrer"}
            </ArrowButton>
          </div>
        }
      >
        <form id="club-form" className="space-y-5" onSubmit={(e) => e.preventDefault()}>
          <Field label="Nom du club">
            <input required className="field" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          </Field>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Ville">
              <input required className="field" value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} />
            </Field>
            <Field label="Statut du partenariat">
              <select className="field" value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value as ClubStatus })}>
                {(Object.keys(CLUB_STATUS_LABEL) as ClubStatus[]).map((s) => (
                  <option key={s} value={s}>
                    {CLUB_STATUS_LABEL[s]}
                  </option>
                ))}
              </select>
            </Field>
          </div>
          <Field label="Adresse">
            <input className="field" value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} />
          </Field>
          <div className="grid gap-4 sm:grid-cols-3">
            <Field label="Responsable du club">
              <input className="field" value={form.contactName} onChange={(e) => setForm({ ...form, contactName: e.target.value })} />
            </Field>
            <Field label="Téléphone">
              <input type="tel" className="field" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
            </Field>
            <Field label="Email">
              <input type="email" className="field" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
            </Field>
          </div>
          <Field label="Disciplines pratiquées">
            <div className="flex flex-wrap gap-2">
              {DISCIPLINES.map((d) => {
                const on = form.disciplines.includes(d);
                return (
                  <button
                    key={d}
                    type="button"
                    onClick={() => toggleDiscipline(d)}
                    aria-pressed={on}
                    className={`inline-flex items-center gap-2 rounded-full px-3 py-2 text-xs font-semibold ring-1 ring-inset transition-colors ${on ? "bg-ink text-white ring-ink" : "bg-white text-mutedfg ring-line hover:text-ink"}`}
                  >
                    <DisciplineIcon discipline={d} size={14} /> {DISCIPLINE_LABEL[d]}
                  </button>
                );
              })}
            </div>
          </Field>
          <div className="grid gap-4 sm:grid-cols-3">
            <Field label="Places d'alternance">
              <input type="number" min={0} className="field" value={form.alternanceCapacity} onChange={(e) => setForm({ ...form, alternanceCapacity: e.target.value })} />
            </Field>
            <Field label="Début convention">
              <input type="date" className="field" value={form.conventionStart} onChange={(e) => setForm({ ...form, conventionStart: e.target.value })} />
            </Field>
            <Field label="Fin convention">
              <input type="date" min={form.conventionStart} className="field" value={form.conventionEnd} onChange={(e) => setForm({ ...form, conventionEnd: e.target.value })} />
            </Field>
          </div>
          <Field label="Notes internes" hint="Non visibles sur le site public.">
            <textarea rows={3} className="field" value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
          </Field>
        </form>
      </Drawer>

      {/* Fiche club */}
      <Drawer open={!!detail} onClose={() => setDetail(null)} title={detail?.name ?? "Club"} icon={Building2}>
        {detail && <ClubDetail club={detail} onEdit={() => (openEdit(detail), setDetail(null))} />}
      </Drawer>

      <ConfirmDialog
        open={!!toDelete}
        title="Supprimer le club ?"
        text="Impossible si des coachs, du matériel ou des alternances y sont rattachés : passez-le plutôt en « Suspendu »."
        onClose={() => setToDelete(null)}
        onConfirm={async () => {
          if (toDelete) await mutate(`/api/clubs/${toDelete.id}`, { method: "DELETE" }, "Club supprimé");
        }}
      />
    </div>
  );
}

function Mini({ icon: Icon, label, value, sub }: { icon: typeof Users; label: string; value: number; sub?: string }) {
  return (
    <div className="px-2 py-3">
      <p className="h-display text-3xl leading-none">{value}</p>
      <p className="mt-1 flex items-center justify-center gap-1 font-mono text-[9px] uppercase tracking-wider text-mutedfg">
        <Icon size={10} /> {label}
      </p>
      {sub && <p className="font-mono text-[9px] text-mutedfg/80">{sub}</p>}
    </div>
  );
}

function ClubDetail({ club, onEdit }: { club: PartnerClub; onEdit: () => void }) {
  const { stats } = useAdmin();
  if (!stats) return null;
  const net = stats.network;
  const coaches = net.coaches.filter((c) => c.clubId === club.id);
  const items = net.equipment.filter((e) => e.clubId === club.id && e.status !== "reforme");
  const placements = net.placements.filter((p) => p.clubId === club.id);
  const s = net.summaries.find((x) => x.clubId === club.id);
  const byCat = Object.entries(
    items.reduce<Record<string, number>>((acc, e) => ((acc[e.category] = (acc[e.category] ?? 0) + e.quantity), acc), {})
  ).sort((a, b) => b[1] - a[1]);
  const active = placements.filter((p) => p.status === "en_cours").length;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center gap-2">
        <Badge tone={CLUB_STATUS_TONE[club.status]}>{CLUB_STATUS_LABEL[club.status]}</Badge>
        {club.conventionStart && (
          <Badge tone="muted">
            <CalendarRange size={11} /> Convention {club.conventionEnd ? formatRange(club.conventionStart, club.conventionEnd) : `depuis le ${formatDate(club.conventionStart)}`}
          </Badge>
        )}
      </div>
      <div className="space-y-1.5 rounded-2xl border border-line bg-white p-4 text-sm">
        <p className="flex items-center gap-2">
          <MapPin size={14} className="text-orange" /> {club.address ? `${club.address}, ` : ""}
          {club.city}
        </p>
        {club.contactName && (
          <p className="flex items-center gap-2">
            <Users size={14} className="text-orange" /> {club.contactName}
          </p>
        )}
        {club.phone && (
          <a href={`tel:${club.phone}`} className="flex items-center gap-2 hover:text-orange">
            <Phone size={14} className="text-orange" /> {club.phone}
          </a>
        )}
        {club.email && (
          <a href={`mailto:${club.email}`} className="flex items-center gap-2 hover:text-orange">
            <Mail size={14} className="text-orange" /> {club.email}
          </a>
        )}
      </div>

      <section>
        <p className="mb-2 flex items-center gap-2 text-sm font-semibold">
          <Handshake size={16} className="text-orange" /> Alternance — {active}/{club.alternanceCapacity} places occupées
        </p>
        <Meter value={active} max={Math.max(1, club.alternanceCapacity)} />
        {placements.length > 0 && (
          <ul className="mt-3 divide-y divide-line rounded-2xl border border-line bg-white">
            {placements.map((p) => (
              <li key={p.id} className="flex items-center gap-3 p-3">
                <Avatar name={p.learnerName} size={32} />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold">{p.learnerName}</p>
                  <p className="font-mono text-[10px] text-mutedfg">
                    {formatRange(p.startDate, p.endDate)} · {p.hours.validated}/{p.hoursPlanned} h
                  </p>
                </div>
                <Badge tone={PLACEMENT_STATUS_TONE[p.status]}>{PLACEMENT_STATUS_LABEL[p.status]}</Badge>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section>
        <p className="mb-2 flex items-center gap-2 text-sm font-semibold">
          <Users size={16} className="text-orange" /> Coachs ({coaches.length})
        </p>
        {coaches.length === 0 ? (
          <p className="text-xs text-mutedfg">Aucun coach rattaché.</p>
        ) : (
          <ul className="divide-y divide-line rounded-2xl border border-line bg-white">
            {coaches.map((c) => {
              const n = items.filter((e) => e.responsibleCoachId === c.id).length;
              return (
                <li key={c.id} className="flex items-center gap-3 p-3">
                  <Avatar name={c.name} size={32} />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold">{c.name}</p>
                    <p className="truncate text-xs text-mutedfg">
                      {c.phone} · {n} article{n > 1 ? "s" : ""} en charge
                    </p>
                  </div>
                  <div className="flex flex-wrap justify-end gap-1">
                    {c.isEquipmentManager && <Badge tone="orange">Resp. matériel</Badge>}
                    {c.isTutor && <Badge tone="ink">Tuteur</Badge>}
                    {!c.active && <Badge tone="muted">Inactif</Badge>}
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </section>

      <section>
        <p className="mb-2 flex items-center gap-2 text-sm font-semibold">
          <Boxes size={16} className="text-orange" /> Matériel ({items.length} articles · {s?.units ?? 0} unités)
        </p>
        {s && s.valueFCFA > 0 && <p className="mb-2 font-mono text-xs text-mutedfg">Valeur estimée : {formatFCFA(s.valueFCFA)}</p>}
        {byCat.length === 0 ? (
          <p className="text-xs text-mutedfg">Aucun matériel.</p>
        ) : (
          <div className="grid grid-cols-2 gap-2">
            {byCat.map(([cat, qty]) => (
              <div key={cat} className="flex items-center gap-2 rounded-xl bg-muted/70 p-2.5">
                <EquipmentIcon category={cat as keyof typeof CATEGORY_LABEL} size={16} className="text-orange" />
                <span className="min-w-0 flex-1 truncate text-xs">{CATEGORY_LABEL[cat as keyof typeof CATEGORY_LABEL]}</span>
                <span className="font-mono text-xs font-semibold">{qty}</span>
              </div>
            ))}
          </div>
        )}
        {s?.inventoryOverdue && (
          <p className="mt-3 flex items-center gap-2 rounded-xl bg-danger/10 p-3 text-xs text-danger">
            <AlertTriangle size={14} /> Inventaire en retard : demandez au responsable matériel d&rsquo;en réaliser un.
          </p>
        )}
      </section>

      {club.notes && <p className="rounded-2xl bg-orangeL p-4 text-sm text-orangeD">{club.notes}</p>}

      <div className="flex flex-wrap gap-2">
        <ArrowButton size="sm" variant="dark" href={`/admin/materiel?club=${club.id}`}>
          Gérer le matériel
        </ArrowButton>
        <ArrowButton size="sm" variant="outline" onClick={onEdit}>
          Modifier
        </ArrowButton>
      </div>
    </div>
  );
}
