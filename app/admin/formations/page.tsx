"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { BookOpen, Plus, Pencil, Copy, Trash2, CalendarPlus, LayoutGrid, Clock, Star, Eye, SearchX, Handshake, FileText } from "lucide-react";
import type { Level } from "@/lib/types";
import { FORMAT_LABEL, LEVELS, LEVEL_LABEL, LEVEL_SHORT } from "@/lib/labels";
import { formatAmount } from "@/lib/currency";
import { LEVEL_ICON, LevelIcon } from "@/components/icons/DisciplineIcon";
import ModuleIcons from "@/components/ModuleIcons";
import ArrowButton from "@/components/ui/ArrowButton";
import { EmptyState, Skeleton } from "@/components/ui/primitives";
import { useAdmin } from "../_lib/AdminContext";
import type { AdminFormation } from "../_lib/types";
import { AdminHeader, ConfirmDialog, Drawer, FilterPills, IconAction, SearchBox } from "../_components/kit";
import Switch from "../_components/Switch";
import DocumentsManager from "../_components/DocumentsManager";
import FormationForm, { draftFrom, draftToPayload, emptyDraft, type FormationDraft } from "../_components/FormationForm";

export default function Page() {
  return (
    <Suspense fallback={<Skeleton className="h-96" />}>
      <FormationsAdmin />
    </Suspense>
  );
}

function FormationsAdmin() {
  const { stats, mutate } = useAdmin();
  const params = useSearchParams();
  const router = useRouter();
  const [filter, setFilter] = useState<Level | "tout">("tout");
  const [q, setQ] = useState("");
  const [editing, setEditing] = useState<AdminFormation | "new" | null>(null);
  const [draft, setDraft] = useState<FormationDraft>(emptyDraft);
  const [saving, setSaving] = useState(false);
  const [toDelete, setToDelete] = useState<AdminFormation | null>(null);
  const [docsFor, setDocsFor] = useState<AdminFormation | null>(null);

  useEffect(() => {
    if (params.get("new") === "1") {
      openNew();
      router.replace("/admin/formations");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params]);

  function openNew(base?: AdminFormation) {
    setDraft(base ? { ...draftFrom(base), title: `${base.title} (copie)` } : emptyDraft);
    setEditing("new");
  }
  function openEdit(f: AdminFormation) {
    setDraft(draftFrom(f));
    setEditing(f);
  }

  async function save() {
    const form = document.getElementById("formation-form") as HTMLFormElement | null;
    if (form && !form.reportValidity()) return;
    setSaving(true);
    const payload = draftToPayload(draft);
    const ok =
      editing === "new"
        ? await mutate("/api/formations", { method: "POST", json: payload }, "Formation créée")
        : await mutate(`/api/formations/${(editing as AdminFormation).id}`, { method: "PATCH", json: payload }, "Formation mise à jour");
    setSaving(false);
    if (ok) setEditing(null);
  }

  const list = useMemo(() => {
    if (!stats) return [];
    const term = q.trim().toLowerCase();
    return stats.formations
      .filter((f) => filter === "tout" || f.level === filter)
      .filter((f) => !term || f.title.toLowerCase().includes(term))
      .sort((a, b) => LEVELS.indexOf(a.level) - LEVELS.indexOf(b.level));
  }, [stats, filter, q]);

  if (!stats) return <Skeleton className="h-96" />;

  const sessionsOf = (id: string) => stats.sessions.filter((s) => s.formationId === id);
  const docsOf = (id: string) => (stats.documents ?? []).filter((d) => d.formationId === id).length;
  const ratingOf = (id: string) => {
    const r = stats.reviews.filter((x) => x.formationId === id);
    return r.length ? r.reduce((s, x) => s + x.rating, 0) / r.length : 0;
  };

  return (
    <div>
      <AdminHeader
        icon={BookOpen}
        title="Formations"
        subtitle={`${stats.formations.length} niveaux de formation · ${stats.formations.filter((f) => f.active).length} publiés · 5 modules par niveau`}
        actions={
          <ArrowButton icon={Plus} onClick={() => openNew()}>
            Nouvelle formation
          </ArrowButton>
        }
      />

      <div className="mb-5 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="overflow-x-auto">
          <FilterPills
            value={filter}
            onChange={setFilter}
            options={[
              { id: "tout", label: "Toutes", icon: LayoutGrid, count: stats.formations.length },
              ...LEVELS.map((l) => ({ id: l, label: LEVEL_SHORT[l], icon: LEVEL_ICON[l], count: stats.formations.filter((f) => f.level === l).length })),
            ]}
          />
        </div>
        <SearchBox value={q} onChange={setQ} placeholder="Rechercher une formation…" />
      </div>

      {list.length === 0 ? (
        <EmptyState icon={SearchX} title="Aucune formation" text="Aucun résultat pour ces filtres." />
      ) : (
        <div className="grid gap-3">
          <AnimatePresence initial={false}>
            {list.map((f, i) => {
              const ses = sessionsOf(f.id);
              const rating = ratingOf(f.id);
              const step = LEVELS.indexOf(f.level) + 1;
              return (
                <motion.div
                  key={f.id}
                  layout
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, x: -30 }}
                  transition={{ delay: Math.min(i, 8) * 0.03 }}
                  className={`group card flex flex-wrap items-center gap-4 p-4 transition-all hover:border-ink/25 hover:shadow-lift sm:flex-nowrap ${!f.active ? "bg-muted/40" : ""}`}
                >
                  <span className={`inline-flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl transition-all duration-300 group-hover:rotate-[-6deg] ${f.active ? "bg-ink text-white group-hover:bg-orange" : "bg-muted text-mutedfg"}`}>
                    <LevelIcon level={f.level} size={26} />
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="truncate font-semibold">{f.title}</p>
                      {!f.active && <span className="rounded-full bg-ink/10 px-2 py-0.5 text-[10px] font-semibold uppercase text-mutedfg">Masquée</span>}
                    </div>
                    <div className="mt-1 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-mutedfg">
                      <span className="inline-flex items-center gap-1 font-semibold text-orange">
                        <LevelIcon level={f.level} size={13} /> {step}. {LEVEL_LABEL[f.level]}
                      </span>
                      <span>{FORMAT_LABEL[f.format]}</span>
                      <span className="inline-flex items-center gap-1">
                        <Clock size={12} /> {f.durationHours} h
                      </span>
                      <span className="inline-flex items-center gap-1">
                        <Star size={12} /> {rating ? rating.toFixed(1) : "—"}
                      </span>
                      {f.partners && (
                        <span className="inline-flex items-center gap-1 text-orangeD">
                          <Handshake size={12} /> Partenaires
                        </span>
                      )}
                    </div>
                    <div className="mt-2">
                      <ModuleIcons modules={f.modules.map((m) => m.discipline)} size="sm" />
                    </div>
                  </div>
                  <Link href={`/admin/sessions?formation=${f.id}`} className="hidden rounded-xl bg-muted px-3 py-2 text-center transition-colors hover:bg-ink hover:text-white md:block">
                    <p className="h-display text-xl leading-none">{ses.length}</p>
                    <p className="font-mono text-[9px] uppercase">sessions</p>
                  </Link>
                  <p className="w-28 text-right font-mono text-sm">{formatAmount(f.priceFCFA, "FCFA")}</p>
                  <div className="flex items-center gap-1.5">
                    <Switch
                      checked={f.active}
                      label={f.active ? "Publiée — cliquer pour masquer" : "Masquée — cliquer pour publier"}
                      onChange={() => mutate(`/api/formations/${f.id}`, { method: "PATCH", json: { active: !f.active } }, f.active ? "Formation masquée" : "Formation publiée")}
                    />
                    <span className="mx-1 h-6 w-px bg-line" />
                    <IconAction icon={Pencil} label="Modifier" onClick={() => openEdit(f)} />
                    <IconAction icon={CalendarPlus} label="Programmer une session" tone="orange" onClick={() => router.push(`/admin/sessions?new=1&formation=${f.id}`)} />
                    <span className="relative">
                      <IconAction icon={FileText} label="Fiches techniques" tone="orange" onClick={() => setDocsFor(f)} />
                      {docsOf(f.id) > 0 && (
                        <span className="pointer-events-none absolute -right-1.5 -top-1.5 min-w-[1.1rem] rounded-full bg-ink px-1 text-center font-mono text-[9px] leading-[1.1rem] text-white">
                          {docsOf(f.id)}
                        </span>
                      )}
                    </span>
                    <IconAction icon={Copy} label="Dupliquer" onClick={() => openNew(f)} />
                    <IconAction icon={Eye} label="Voir sur le site" href={`/formations/${f.id}`} />
                    <IconAction icon={Trash2} label="Supprimer" tone="danger" onClick={() => setToDelete(f)} />
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      )}

      <Drawer
        open={editing !== null}
        onClose={() => setEditing(null)}
        title={editing === "new" ? "Nouvelle formation" : "Modifier la formation"}
        icon={editing === "new" ? Plus : Pencil}
        footer={
          <div className="flex items-center justify-end gap-2">
            <button onClick={() => setEditing(null)} className="rounded-full px-5 py-3 text-sm font-semibold text-mutedfg hover:text-ink">
              Annuler
            </button>
            <ArrowButton loading={saving} onClick={save}>
              {editing === "new" ? "Créer la formation" : "Enregistrer"}
            </ArrowButton>
          </div>
        }
      >
        <FormationForm id="formation-form" draft={draft} onChange={setDraft} />
      </Drawer>

      <Drawer
        open={docsFor !== null}
        onClose={() => setDocsFor(null)}
        title="Fiches techniques"
        icon={FileText}
      >
        {docsFor && (
          <>
            <p className="-mt-1 mb-5 text-sm text-mutedfg">
              <span className="font-semibold text-ink">{docsFor.title}</span> — documents téléchargeables par les candidats sur la page de la formation.
            </p>
            <DocumentsManager formationId={docsFor.id} documents={(stats.documents ?? []).filter((d) => d.formationId === docsFor.id)} />
          </>
        )}
      </Drawer>

      <ConfirmDialog
        open={!!toDelete}
        title="Supprimer la formation ?"
        text={`« ${toDelete?.title} », ses sessions sans inscrit et ses fiches techniques seront supprimées définitivement. Pour la retirer temporairement du catalogue, utilisez plutôt l'interrupteur « publiée ».`}
        onClose={() => setToDelete(null)}
        onConfirm={async () => { if (toDelete) await mutate(`/api/formations/${toDelete.id}`, { method: "DELETE" }, "Formation supprimée"); }}
      />
    </div>
  );
}
