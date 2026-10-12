"use client";

import { Suspense, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { Handshake, Plus, Pencil, Trash2, Eye, Building2, UserCheck, CalendarRange, Clock, NotebookPen, BadgeCheck, Target, X } from "lucide-react";
import type { PlacementStatus } from "@/lib/types";
import {
  LEVEL_SHORT,
  PLACEMENT_RESULT_LABEL,
  PLACEMENT_RESULT_TONE,
  PLACEMENT_STATUS_LABEL,
  PLACEMENT_STATUS_TONE,
  formatRange,
} from "@/lib/labels";
import ArrowButton from "@/components/ui/ArrowButton";
import { Badge, EmptyState, Field, Skeleton } from "@/components/ui/primitives";
import { LogForm, Logbook, type Api } from "@/components/network/EquipmentUI";
import { EvaluationForm, HoursBar } from "@/components/network/AlternanceUI";
import { useAdmin } from "../_lib/AdminContext";
import type { AdminPlacement } from "../_lib/types";
import { AdminHeader, Avatar, ConfirmDialog, Drawer, FilterPills, IconAction, SearchBox } from "../_components/kit";

export default function Page() {
  return (
    <Suspense fallback={<Skeleton className="h-96" />}>
      <AlternanceAdmin />
    </Suspense>
  );
}

const empty = {
  learnerId: "",
  enrollmentId: "",
  clubId: "",
  tutorCoachId: "",
  startDate: "",
  endDate: "",
  schedule: "",
  hoursPlanned: "60",
  objectives: "",
  status: "" as PlacementStatus | "",
};
type Filter = PlacementStatus | "a_valider" | "toutes";

function AlternanceAdmin() {
  const { stats, mutate } = useAdmin();
  const params = useSearchParams();
  const [filter, setFilter] = useState<Filter>("en_cours");
  const [club, setClub] = useState(params.get("club") ?? "");
  const [tutor, setTutor] = useState(params.get("tutor") ?? "");
  const [q, setQ] = useState("");
  const [editing, setEditing] = useState<AdminPlacement | "new" | null>(null);
  const [form, setForm] = useState(empty);
  const [saving, setSaving] = useState(false);
  const [detailId, setDetailId] = useState<string | null>(null);
  const [toDelete, setToDelete] = useState<AdminPlacement | null>(null);
  const api: Api = (url, init, msg) => mutate(url, init, msg);

  const net = stats?.network;
  const pendingOf = (id: string) => net?.logs.filter((l) => l.placementId === id && l.status === "a_valider").length ?? 0;
  const list = useMemo(() => {
    if (!net) return [];
    const needle = q.trim().toLowerCase();
    return net.placements
      .filter((p) => (filter === "toutes" ? true : filter === "a_valider" ? net.logs.some((l) => l.placementId === p.id && l.status === "a_valider") : p.status === filter))
      .filter((p) => !club || p.clubId === club)
      .filter((p) => !tutor || p.tutorCoachId === tutor)
      .filter((p) => !needle || `${p.learnerName} ${p.formationTitle ?? ""}`.toLowerCase().includes(needle))
      .sort((a, b) => (a.startDate < b.startDate ? 1 : -1));
  }, [net, filter, club, tutor, q]);

  if (!stats || !net) return <Skeleton className="h-96" />;

  const clubOf = (id: string) => net.clubs.find((c) => c.id === id);
  const coachOf = (id: string | null) => (id ? net.coaches.find((c) => c.id === id) : undefined);
  const count = (s: PlacementStatus) => net.placements.filter((p) => p.status === s).length;
  const detail = detailId ? net.placements.find((p) => p.id === detailId) ?? null : null;
  const learnerEnrollments = stats.enrollments.filter((e) => e.learnerId === form.learnerId && e.status !== "annulee");
  const tutors = net.coaches.filter((c) => c.clubId === form.clubId && c.active);

  function openEdit(p: AdminPlacement) {
    setForm({
      learnerId: p.learnerId,
      enrollmentId: p.enrollmentId ?? "",
      clubId: p.clubId,
      tutorCoachId: p.tutorCoachId ?? "",
      startDate: p.startDate,
      endDate: p.endDate,
      schedule: p.schedule,
      hoursPlanned: String(p.hoursPlanned),
      objectives: p.objectives ?? "",
      status: p.status,
    });
    setEditing(p);
  }

  async function save() {
    const el = document.getElementById("placement-form") as HTMLFormElement | null;
    if (el && !el.reportValidity()) return;
    setSaving(true);
    const body = { ...form, hoursPlanned: Number(form.hoursPlanned), tutorCoachId: form.tutorCoachId || null };
    let ok: boolean;
    if (editing === "new") {
      const { status: _s, ...create } = body;
      void _s;
      ok = await mutate("/api/placements", { method: "POST", json: create }, "Alternance créée");
    } else {
      const { learnerId: _l, enrollmentId: _e, status, ...upd } = body;
      void _l;
      void _e;
      const cur = editing as AdminPlacement;
      // On n'envoie le statut que s'il est forcé (interrompu / terminé) ou modifié.
      ok = await mutate(`/api/placements/${cur.id}`, { method: "PATCH", json: status && status !== cur.status ? { ...upd, status } : upd }, "Alternance mise à jour");
    }
    setSaving(false);
    if (ok) setEditing(null);
  }

  return (
    <div>
      <AdminHeader
        icon={Handshake}
        title="Alternance"
        subtitle="Périodes en club partenaire : tuteur, heures, carnet de bord et évaluation."
        actions={
          <ArrowButton
            icon={Plus}
            onClick={() => {
              setForm({ ...empty, clubId: club });
              setEditing("new");
            }}
            disabled={net.clubs.length === 0}
          >
            Placer un apprenant
          </ArrowButton>
        }
      />

      <div className="mb-5 flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
        <FilterPills
          value={filter}
          onChange={setFilter}
          options={[
            { id: "en_cours", label: "En cours", count: count("en_cours") },
            { id: "a_valider", label: "Séances à valider", count: net.totals.logsToValidate },
            { id: "planifie", label: "Planifiées", count: count("planifie") },
            { id: "termine", label: "Terminées", count: count("termine") },
            { id: "toutes", label: "Toutes", count: net.placements.length },
          ]}
        />
        <div className="flex flex-col gap-2 sm:flex-row">
          <select className="field rounded-full py-2.5 sm:w-52" value={club} onChange={(e) => (setClub(e.target.value), setTutor(""))} aria-label="Club">
            <option value="">Tous les clubs</option>
            {net.clubs.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
          <select className="field rounded-full py-2.5 sm:w-52" value={tutor} onChange={(e) => setTutor(e.target.value)} aria-label="Tuteur">
            <option value="">Tous les tuteurs</option>
            {net.coaches
              .filter((c) => c.isTutor && (!club || c.clubId === club))
              .map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
          </select>
          <SearchBox value={q} onChange={setQ} placeholder="Apprenant, formation…" />
          {(club || tutor) && <IconAction icon={X} label="Effacer les filtres" onClick={() => (setClub(""), setTutor(""))} />}
        </div>
      </div>

      {list.length === 0 ? (
        <EmptyState icon={Handshake} title="Aucune alternance" text={net.placements.length ? "Rien ne correspond à ces filtres." : "Placez un premier apprenant dans un club partenaire."} />
      ) : (
        <div className="grid gap-3 md:grid-cols-2 2xl:grid-cols-3">
          <AnimatePresence initial={false}>
            {list.map((p, i) => {
              const c = clubOf(p.clubId);
              const t = coachOf(p.tutorCoachId);
              const pending = pendingOf(p.id);
              return (
                <motion.div
                  key={p.id}
                  layout
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.96 }}
                  transition={{ delay: Math.min(i, 9) * 0.03 }}
                  className="group card flex flex-col p-5 transition-all hover:-translate-y-0.5 hover:shadow-lift"
                >
                  <button onClick={() => setDetailId(p.id)} className="flex items-start gap-3 text-left">
                    <Avatar name={p.learnerName} size={48} />
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-semibold">{p.learnerName}</p>
                      <p className="truncate text-xs text-mutedfg">
                        {p.level ? `${LEVEL_SHORT[p.level]} · ` : ""}
                        {p.formationTitle ?? "Hors inscription"}
                      </p>
                      <div className="mt-2 flex flex-wrap gap-1">
                        <Badge tone={PLACEMENT_STATUS_TONE[p.status]}>{PLACEMENT_STATUS_LABEL[p.status]}</Badge>
                        {p.evaluation && <Badge tone={PLACEMENT_RESULT_TONE[p.evaluation.result]}>{PLACEMENT_RESULT_LABEL[p.evaluation.result]}</Badge>}
                        {pending > 0 && <Badge tone="orange">{pending} séance{pending > 1 ? "s" : ""} à valider</Badge>}
                      </div>
                    </div>
                  </button>
                  <div className="mt-4 space-y-1 text-xs text-mutedfg">
                    <p className="flex items-center gap-1.5 truncate">
                      <Building2 size={12} /> {c?.name ?? "Club supprimé"} · {c?.city}
                    </p>
                    <p className={`flex items-center gap-1.5 truncate ${t ? "" : "text-danger"}`}>
                      <UserCheck size={12} /> {t ? `Tuteur : ${t.name}` : "Pas de tuteur désigné"}
                    </p>
                    <p className="flex items-center gap-1.5">
                      <CalendarRange size={12} /> {formatRange(p.startDate, p.endDate)}
                    </p>
                    {p.schedule && (
                      <p className="flex items-center gap-1.5 truncate">
                        <Clock size={12} /> {p.schedule}
                      </p>
                    )}
                  </div>
                  <div className="mt-4">
                    <HoursBar validated={p.hours.validated} pending={p.hours.pending} planned={p.hoursPlanned} />
                  </div>
                  <div className="mt-4 flex items-center gap-1.5 border-t border-line pt-4">
                    <IconAction icon={Eye} label="Carnet et évaluation" onClick={() => setDetailId(p.id)} />
                    <IconAction icon={Pencil} label="Modifier" onClick={() => openEdit(p)} />
                    <span className="flex-1" />
                    <IconAction icon={Trash2} label="Supprimer" tone="danger" onClick={() => setToDelete(p)} />
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
        title={editing === "new" ? "Nouvelle alternance" : "Modifier l'alternance"}
        icon={Handshake}
        footer={
          <div className="flex justify-end gap-2">
            <button onClick={() => setEditing(null)} className="rounded-full px-5 py-3 text-sm font-semibold text-mutedfg hover:text-ink">
              Annuler
            </button>
            <ArrowButton loading={saving} onClick={save}>
              {editing === "new" ? "Créer" : "Enregistrer"}
            </ArrowButton>
          </div>
        }
      >
        <form id="placement-form" className="space-y-5" onSubmit={(e) => e.preventDefault()}>
          <Field label="Apprenant">
            <select required disabled={editing !== "new"} className="field" value={form.learnerId} onChange={(e) => setForm({ ...form, learnerId: e.target.value, enrollmentId: "" })}>
              <option value="">Choisir un apprenant…</option>
              {[...stats.learners]
                .sort((a, b) => a.name.localeCompare(b.name))
                .map((l) => (
                  <option key={l.id} value={l.id}>
                    {l.name} — {l.email}
                  </option>
                ))}
            </select>
          </Field>
          {editing === "new" && (
            <Field label="Formation concernée" hint={form.learnerId && learnerEnrollments.length === 0 ? "Cet apprenant n'a pas d'inscription active." : undefined}>
              <select className="field" value={form.enrollmentId} onChange={(e) => setForm({ ...form, enrollmentId: e.target.value })} disabled={!form.learnerId}>
                <option value="">Aucune (hors inscription)</option>
                {learnerEnrollments.map((e) => (
                  <option key={e.id} value={e.id}>
                    {e.formationTitle} ({formatRange(e.sessionStartDate, e.sessionEndDate)})
                  </option>
                ))}
              </select>
            </Field>
          )}
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Club d'accueil">
              <select required className="field" value={form.clubId} onChange={(e) => setForm({ ...form, clubId: e.target.value, tutorCoachId: "" })}>
                <option value="">Choisir un club…</option>
                {net.clubs
                  .filter((c) => c.status !== "suspendu" || c.id === form.clubId)
                  .map((c) => {
                    const s = net.summaries.find((x) => x.clubId === c.id);
                    return (
                      <option key={c.id} value={c.id}>
                        {c.name} ({s?.activeAlternants ?? 0}/{c.alternanceCapacity})
                      </option>
                    );
                  })}
              </select>
            </Field>
            <Field label="Tuteur">
              <select className="field" value={form.tutorCoachId} onChange={(e) => setForm({ ...form, tutorCoachId: e.target.value })} disabled={!form.clubId}>
                <option value="">À désigner</option>
                {tutors.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                    {c.isTutor ? "" : " (non tuteur)"}
                  </option>
                ))}
              </select>
            </Field>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Début">
              <input required type="date" className="field" value={form.startDate} onChange={(e) => setForm({ ...form, startDate: e.target.value })} />
            </Field>
            <Field label="Fin">
              <input required type="date" min={form.startDate} className="field" value={form.endDate} onChange={(e) => setForm({ ...form, endDate: e.target.value })} />
            </Field>
          </div>
          <div className="grid gap-4 sm:grid-cols-3">
            <div className="sm:col-span-2">
              <Field label="Rythme">
                <input className="field" value={form.schedule} onChange={(e) => setForm({ ...form, schedule: e.target.value })} placeholder="Ex. Mercredi et samedi matin" />
              </Field>
            </div>
            <Field label="Heures prévues">
              <input required type="number" min={1} className="field" value={form.hoursPlanned} onChange={(e) => setForm({ ...form, hoursPlanned: e.target.value })} />
            </Field>
          </div>
          <Field label="Objectifs pédagogiques">
            <textarea rows={4} className="field" value={form.objectives} onChange={(e) => setForm({ ...form, objectives: e.target.value })} placeholder="Compétences à travailler pendant la période en club" />
          </Field>
          {editing !== "new" && (
            <Field label="Statut" hint="Calculé d'après les dates, sauf si vous l'interrompez ou la clôturez.">
              <select className="field" value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value as PlacementStatus })}>
                {(Object.keys(PLACEMENT_STATUS_LABEL) as PlacementStatus[]).map((s) => (
                  <option key={s} value={s}>
                    {PLACEMENT_STATUS_LABEL[s]}
                  </option>
                ))}
              </select>
            </Field>
          )}
        </form>
      </Drawer>

      {/* Détail : carnet + évaluation */}
      <Drawer open={!!detail} onClose={() => setDetailId(null)} title="Carnet d'alternance" icon={NotebookPen}>
        {detail && (
          <div className="space-y-6">
            <div className="relative overflow-hidden rounded-card bg-ink p-5 text-white">
              <span className="court-lines pointer-events-none absolute inset-0 opacity-30" />
              <div className="relative flex items-center gap-3">
                <Avatar name={detail.learnerName} size={44} />
                <div className="min-w-0">
                  <p className="truncate font-semibold">{detail.learnerName}</p>
                  <p className="truncate text-xs text-white/60">
                    {clubOf(detail.clubId)?.name} · tuteur {coachOf(detail.tutorCoachId)?.name ?? "à désigner"}
                  </p>
                </div>
              </div>
              <div className="relative mt-4">
                <HoursBar dark validated={detail.hours.validated} pending={detail.hours.pending} planned={detail.hoursPlanned} />
              </div>
            </div>
            {detail.objectives && (
              <div className="rounded-2xl border border-line bg-white p-4">
                <p className="mb-1 flex items-center gap-2 text-sm font-semibold">
                  <Target size={15} className="text-orange" /> Objectifs
                </p>
                <p className="whitespace-pre-line text-sm text-mutedfg">{detail.objectives}</p>
              </div>
            )}
            <section>
              <p className="mb-3 flex items-center gap-2 text-sm font-semibold">
                <NotebookPen size={16} className="text-orange" /> Séances
              </p>
              <Logbook logs={net.logs.filter((l) => l.placementId === detail.id)} api={api} canReview canDelete={() => true} />
            </section>
            <details className="rounded-2xl border border-line bg-white p-4">
              <summary className="cursor-pointer text-sm font-semibold">Ajouter une séance (validée d&rsquo;office)</summary>
              <div className="mt-4">
                <LogForm placementId={detail.id} api={api} />
              </div>
            </details>
            <section className="rounded-2xl border border-line bg-white p-4">
              <p className="mb-3 flex items-center gap-2 text-sm font-semibold">
                <BadgeCheck size={16} className="text-orange" /> Évaluation de fin d&rsquo;alternance
              </p>
              <EvaluationForm key={detail.id} placement={detail} api={api} />
            </section>
          </div>
        )}
      </Drawer>

      <ConfirmDialog
        open={!!toDelete}
        title="Supprimer l'alternance ?"
        text="Le carnet de séances associé sera supprimé aussi. Pour garder l'historique, passez-la plutôt en « Interrompue »."
        onClose={() => setToDelete(null)}
        onConfirm={async () => {
          if (toDelete) await mutate(`/api/placements/${toDelete.id}`, { method: "DELETE" }, "Alternance supprimée");
        }}
      />
    </div>
  );
}
