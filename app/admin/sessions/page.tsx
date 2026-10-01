"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import {
  CalendarDays,
  Plus,
  Pencil,
  Trash2,
  Users,
  MapPin,
  User,
  Ban,
  RotateCcw,
  Flag,
  CalendarX2,
  X,
} from "lucide-react";
import type { SessionStatus } from "@/lib/types";
import {
  ENROLLMENT_STATUS_LABEL,
  ENROLLMENT_STATUS_TONE,
  SESSION_STATUS_LABEL,
  SESSION_STATUS_TONE,
  dateParts,
  formatRange,
} from "@/lib/labels";
import { DisciplineIcon } from "@/components/icons/DisciplineIcon";
import ArrowButton from "@/components/ui/ArrowButton";
import { Badge, EmptyState, Field, Meter, Skeleton } from "@/components/ui/primitives";
import { useAdmin } from "../_lib/AdminContext";
import type { AdminSession } from "../_lib/types";
import { AdminHeader, Avatar, ConfirmDialog, Drawer, FilterPills, IconAction } from "../_components/kit";

export default function Page() {
  return (
    <Suspense fallback={<Skeleton className="h-96" />}>
      <SessionsAdmin />
    </Suspense>
  );
}

const empty = { formationId: "", startDate: "", endDate: "", location: "", instructor: "", capacity: "12" };
type StatusFilter = "a-venir" | "passees" | "annulees" | "toutes";

function SessionsAdmin() {
  const { stats, mutate } = useAdmin();
  const params = useSearchParams();
  const router = useRouter();
  const [status, setStatus] = useState<StatusFilter>("a-venir");
  const [formationFilter, setFormationFilter] = useState<string>(params.get("formation") ?? "");
  const [editing, setEditing] = useState<AdminSession | "new" | null>(null);
  const [form, setForm] = useState(empty);
  const [saving, setSaving] = useState(false);
  const [roster, setRoster] = useState<AdminSession | null>(null);
  const [toDelete, setToDelete] = useState<AdminSession | null>(null);

  useEffect(() => {
    if (params.get("new") === "1") {
      setForm({ ...empty, formationId: params.get("formation") ?? "" });
      setEditing("new");
      router.replace(params.get("formation") ? `/admin/sessions?formation=${params.get("formation")}` : "/admin/sessions");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params]);

  const today = new Date().toISOString().slice(0, 10);
  const list = useMemo(() => {
    if (!stats) return [];
    return stats.sessions
      .filter((s) => !formationFilter || s.formationId === formationFilter)
      .filter((s) => {
        if (status === "toutes") return true;
        if (status === "annulees") return s.status === "annulee";
        if (status === "passees") return s.status !== "annulee" && (s.endDate < today || s.status === "terminee");
        return s.status !== "annulee" && s.status !== "terminee" && s.endDate >= today;
      })
      .sort((a, b) => (status === "passees" ? (a.startDate < b.startDate ? 1 : -1) : a.startDate > b.startDate ? 1 : -1));
  }, [stats, status, formationFilter, today]);

  if (!stats) return <Skeleton className="h-96" />;

  const formationOf = (id: string) => stats.formations.find((f) => f.id === id);
  const counts = {
    "a-venir": stats.sessions.filter((s) => s.status !== "annulee" && s.status !== "terminee" && s.endDate >= today).length,
    passees: stats.sessions.filter((s) => s.status !== "annulee" && (s.endDate < today || s.status === "terminee")).length,
    annulees: stats.sessions.filter((s) => s.status === "annulee").length,
    toutes: stats.sessions.length,
  };

  function openEdit(s: AdminSession) {
    setForm({ formationId: s.formationId, startDate: s.startDate, endDate: s.endDate, location: s.location, instructor: s.instructor, capacity: String(s.capacity) });
    setEditing(s);
  }

  async function save() {
    const el = document.getElementById("session-form") as HTMLFormElement | null;
    if (el && !el.reportValidity()) return;
    setSaving(true);
    const body = { startDate: form.startDate, endDate: form.endDate, location: form.location, instructor: form.instructor, capacity: Number(form.capacity) };
    const ok =
      editing === "new"
        ? await mutate(`/api/formations/${form.formationId}/sessions`, { method: "POST", json: body }, "Session programmée")
        : await mutate(`/api/sessions/${(editing as AdminSession).id}`, { method: "PATCH", json: body }, "Session mise à jour");
    setSaving(false);
    if (ok) setEditing(null);
  }

  const setSessionStatus = (s: AdminSession, st: SessionStatus, msg: string) => mutate(`/api/sessions/${s.id}`, { method: "PATCH", json: { status: st } }, msg);
  const selectedFormation = formationOf(form.formationId);
  const rosterEnrollments = roster ? stats.enrollments.filter((e) => e.sessionId === roster.id) : [];

  return (
    <div>
      <AdminHeader
        icon={CalendarDays}
        title="Sessions"
        subtitle="Programmez les dates, suivez le remplissage et la liste des inscrits."
        actions={
          <ArrowButton
            icon={Plus}
            onClick={() => {
              setForm({ ...empty, formationId: formationFilter });
              setEditing("new");
            }}
          >
            Programmer une session
          </ArrowButton>
        }
      />

      <div className="mb-5 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <FilterPills
          value={status}
          onChange={setStatus}
          options={[
            { id: "a-venir", label: "À venir", count: counts["a-venir"] },
            { id: "passees", label: "Passées", count: counts.passees },
            { id: "annulees", label: "Annulées", count: counts.annulees },
            { id: "toutes", label: "Toutes", count: counts.toutes },
          ]}
        />
        <div className="flex items-center gap-2">
          <select className="field w-full rounded-full py-2.5 sm:w-72" value={formationFilter} onChange={(e) => setFormationFilter(e.target.value)} aria-label="Filtrer par formation">
            <option value="">Toutes les formations</option>
            {stats.formations.map((f) => (
              <option key={f.id} value={f.id}>
                {f.title}
              </option>
            ))}
          </select>
          {formationFilter && <IconAction icon={X} label="Retirer le filtre" onClick={() => setFormationFilter("")} />}
        </div>
      </div>

      {list.length === 0 ? (
        <EmptyState icon={CalendarX2} title="Aucune session" text="Rien à afficher pour ces filtres." />
      ) : (
        <div className="grid gap-3 md:grid-cols-2 2xl:grid-cols-3">
          <AnimatePresence initial={false}>
            {list.map((s, i) => {
              const f = formationOf(s.formationId);
              const d = dateParts(s.startDate);
              return (
                <motion.div
                  key={s.id}
                  layout
                  initial={{ opacity: 0, scale: 0.97 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ delay: Math.min(i, 9) * 0.03 }}
                  className="group card flex flex-col p-5 transition-all hover:-translate-y-0.5 hover:border-ink/25 hover:shadow-lift"
                >
                  <div className="flex items-start gap-4">
                    <span className="flex h-16 w-16 shrink-0 flex-col items-center justify-center rounded-2xl bg-ink text-white transition-colors group-hover:bg-orange">
                      <span className="h-display text-3xl leading-none">{d.day}</span>
                      <span className="font-mono text-[10px] uppercase">
                        {d.month} {d.year.slice(2)}
                      </span>
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5">
                        {f && <DisciplineIcon discipline={f.discipline} size={15} className="shrink-0 text-orange" />}
                        <p className="truncate text-sm font-semibold">{s.formationTitle}</p>
                      </div>
                      <p className="mt-0.5 font-mono text-[11px] text-mutedfg">{formatRange(s.startDate, s.endDate)}</p>
                      <div className="mt-2">
                        <Badge tone={SESSION_STATUS_TONE[s.status]}>{SESSION_STATUS_LABEL[s.status]}</Badge>
                      </div>
                    </div>
                  </div>
                  <div className="mt-4 space-y-1 text-xs text-mutedfg">
                    <p className="flex items-center gap-1.5 truncate">
                      <MapPin size={13} /> {s.location}
                    </p>
                    {s.instructor && (
                      <p className="flex items-center gap-1.5">
                        <User size={13} /> {s.instructor}
                      </p>
                    )}
                  </div>
                  <button onClick={() => setRoster(s)} className="mt-4 flex items-center gap-3 rounded-xl bg-muted/60 p-3 text-left transition-colors hover:bg-muted">
                    <Users size={16} className="text-orange" />
                    <div className="flex-1">
                      <Meter value={s.enrolledCount} max={s.capacity} />
                    </div>
                    <span className="font-mono text-xs font-medium">
                      {s.enrolledCount}/{s.capacity}
                    </span>
                  </button>
                  <div className="mt-4 flex flex-wrap items-center gap-1.5 border-t border-line pt-4">
                    <IconAction icon={Users} label="Liste des inscrits" onClick={() => setRoster(s)} />
                    <IconAction icon={Pencil} label="Modifier" onClick={() => openEdit(s)} />
                    {s.status !== "terminee" && s.status !== "annulee" && (
                      <IconAction icon={Flag} label="Marquer terminée" tone="success" onClick={() => setSessionStatus(s, "terminee", "Session terminée")} />
                    )}
                    {s.status === "annulee" || s.status === "terminee" || s.status === "complete" ? (
                      <IconAction icon={RotateCcw} label="Rouvrir les inscriptions" tone="orange" onClick={() => setSessionStatus(s, "ouverte", "Session rouverte")} />
                    ) : null}
                    {s.status !== "annulee" && <IconAction icon={Ban} label="Annuler la session" tone="danger" onClick={() => setSessionStatus(s, "annulee", "Session annulée")} />}
                    <span className="flex-1" />
                    <IconAction icon={Trash2} label="Supprimer" tone="danger" onClick={() => setToDelete(s)} />
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
        title={editing === "new" ? "Nouvelle session" : "Modifier la session"}
        icon={CalendarDays}
        footer={
          <div className="flex justify-end gap-2">
            <button onClick={() => setEditing(null)} className="rounded-full px-5 py-3 text-sm font-semibold text-mutedfg hover:text-ink">
              Annuler
            </button>
            <ArrowButton loading={saving} onClick={save}>
              {editing === "new" ? "Programmer" : "Enregistrer"}
            </ArrowButton>
          </div>
        }
      >
        <form id="session-form" className="space-y-5" onSubmit={(e) => e.preventDefault()}>
          <Field label="Formation">
            <div className="flex items-center gap-3">
              <span className="inline-flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-ink text-white">
                {selectedFormation ? <DisciplineIcon discipline={selectedFormation.discipline} size={24} /> : <CalendarDays size={20} />}
              </span>
              <select required disabled={editing !== "new"} className="field" value={form.formationId} onChange={(e) => setForm({ ...form, formationId: e.target.value })}>
                <option value="">Choisir une formation…</option>
                {stats.formations.map((f) => (
                  <option key={f.id} value={f.id}>
                    {f.title}
                  </option>
                ))}
              </select>
            </div>
          </Field>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Début">
              <input required type="date" className="field" value={form.startDate} onChange={(e) => setForm({ ...form, startDate: e.target.value, endDate: form.endDate || e.target.value })} />
            </Field>
            <Field label="Fin">
              <input required type="date" min={form.startDate} className="field" value={form.endDate} onChange={(e) => setForm({ ...form, endDate: e.target.value })} />
            </Field>
          </div>
          <Field label="Lieu">
            <input required className="field" value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} placeholder="Ville, site" />
          </Field>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Formateur">
              <input className="field" value={form.instructor} onChange={(e) => setForm({ ...form, instructor: e.target.value })} />
            </Field>
            <Field label="Capacité (places)">
              <input required type="number" min={1} className="field" value={form.capacity} onChange={(e) => setForm({ ...form, capacity: e.target.value })} />
            </Field>
          </div>
        </form>
      </Drawer>

      {/* Liste des inscrits */}
      <Drawer open={!!roster} onClose={() => setRoster(null)} title="Inscrits" icon={Users}>
        {roster && (
          <div>
            <p className="font-semibold">{roster.formationTitle}</p>
            <p className="font-mono text-xs text-mutedfg">
              {formatRange(roster.startDate, roster.endDate)} · {roster.location}
            </p>
            <div className="mt-4 flex items-center gap-3">
              <Meter value={roster.enrolledCount} max={roster.capacity} />
              <span className="font-mono text-xs">
                {roster.enrolledCount}/{roster.capacity}
              </span>
            </div>
            {rosterEnrollments.length === 0 ? (
              <p className="mt-8 text-center text-sm text-mutedfg">Personne n&rsquo;est encore inscrit.</p>
            ) : (
              <ul className="mt-6 divide-y divide-line rounded-2xl border border-line bg-white">
                {rosterEnrollments.map((e) => {
                  const l = stats.learners.find((x) => x.id === e.learnerId);
                  return (
                    <li key={e.id} className="flex items-center gap-3 p-3">
                      <Avatar name={e.learnerName} />
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-semibold">{e.learnerName}</p>
                        <p className="truncate text-xs text-mutedfg">{l ? `${l.email} · ${l.phone}` : ""}</p>
                      </div>
                      <Badge tone={ENROLLMENT_STATUS_TONE[e.status]}>{ENROLLMENT_STATUS_LABEL[e.status]}</Badge>
                    </li>
                  );
                })}
              </ul>
            )}
            <div className="mt-6">
              <ArrowButton href={`/admin/inscriptions?session=${roster.id}`} variant="dark" size="sm">
                Gérer ces inscriptions
              </ArrowButton>
            </div>
          </div>
        )}
      </Drawer>

      <ConfirmDialog
        open={!!toDelete}
        title="Supprimer la session ?"
        text="La session sera supprimée définitivement. Si des apprenants sont inscrits, annulez-la plutôt."
        onClose={() => setToDelete(null)}
        onConfirm={async () => {
          if (toDelete) await mutate(`/api/sessions/${toDelete.id}`, { method: "DELETE" }, "Session supprimée");
        }}
      />
    </div>
  );
}
