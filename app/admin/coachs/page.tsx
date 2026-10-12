"use client";

import { Suspense, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { Contact, Plus, Pencil, Trash2, KeyRound, Phone, Mail, Building2, Boxes, Handshake, Copy, Check, ShieldCheck, Clock } from "lucide-react";
import type { PublicCoach } from "@/lib/types";
import ArrowButton from "@/components/ui/ArrowButton";
import { Badge, EmptyState, Field, Skeleton } from "@/components/ui/primitives";
import { useAdmin } from "../_lib/AdminContext";
import { AdminHeader, Avatar, ConfirmDialog, Drawer, FilterPills, IconAction, SearchBox } from "../_components/kit";
import Switch from "../_components/Switch";

export default function Page() {
  return (
    <Suspense fallback={<Skeleton className="h-96" />}>
      <CoachsAdmin />
    </Suspense>
  );
}

const empty = { name: "", email: "", phone: "", clubId: "", isTutor: true, isEquipmentManager: false };
type Role = "tous" | "materiel" | "tuteur" | "inactifs";

function CoachsAdmin() {
  const { stats, mutate, refresh, notify } = useAdmin();
  const params = useSearchParams();
  const [club, setClub] = useState(params.get("club") ?? "");
  const [role, setRole] = useState<Role>("tous");
  const [q, setQ] = useState("");
  const [editing, setEditing] = useState<PublicCoach | "new" | null>(null);
  const [form, setForm] = useState(empty);
  const [saving, setSaving] = useState(false);
  const [toDelete, setToDelete] = useState<PublicCoach | null>(null);
  const [toReset, setToReset] = useState<PublicCoach | null>(null);
  const [secret, setSecret] = useState<{ name: string; email: string; password: string } | null>(null);

  const net = stats?.network;
  const list = useMemo(() => {
    if (!net) return [];
    const needle = q.trim().toLowerCase();
    return net.coaches
      .filter((c) => !club || c.clubId === club)
      .filter((c) => (role === "materiel" ? c.isEquipmentManager : role === "tuteur" ? c.isTutor : role === "inactifs" ? !c.active : true))
      .filter((c) => !needle || `${c.name} ${c.email} ${c.phone}`.toLowerCase().includes(needle))
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [net, club, role, q]);

  if (!stats || !net) return <Skeleton className="h-96" />;

  const clubOf = (id: string) => net.clubs.find((c) => c.id === id);

  async function save() {
    const el = document.getElementById("coach-form") as HTMLFormElement | null;
    if (el && !el.reportValidity()) return;
    setSaving(true);
    if (editing === "new") {
      const res = await fetch("/api/coaches", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) });
      const data = await res.json().catch(() => ({}));
      setSaving(false);
      if (!res.ok) return notify(data.error ?? "Création impossible.", "error");
      await refresh();
      setEditing(null);
      setSecret({ name: data.coach.name, email: data.coach.email, password: data.tempPassword });
      return;
    }
    const ok = await mutate(`/api/coaches/${(editing as PublicCoach).id}`, { method: "PATCH", json: form }, "Coach mis à jour");
    setSaving(false);
    if (ok) setEditing(null);
  }

  async function resetPassword(c: PublicCoach) {
    const res = await fetch(`/api/coaches/${c.id}/reset-password`, { method: "POST" });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) return notify(data.error ?? "Réinitialisation impossible.", "error");
    await refresh();
    setSecret({ name: c.name, email: c.email, password: data.tempPassword });
  }

  return (
    <div>
      <AdminHeader
        icon={Contact}
        title="Coachs"
        subtitle="Les coachs des clubs partenaires : responsables du matériel et tuteurs des alternants."
        actions={
          <ArrowButton
            icon={Plus}
            onClick={() => {
              setForm({ ...empty, clubId: club });
              setEditing("new");
            }}
            disabled={net.clubs.length === 0}
          >
            Ajouter un coach
          </ArrowButton>
        }
      />

      <div className="mb-5 flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
        <FilterPills
          value={role}
          onChange={setRole}
          options={[
            { id: "tous", label: "Tous", count: net.coaches.length },
            { id: "materiel", label: "Resp. matériel", count: net.coaches.filter((c) => c.isEquipmentManager).length },
            { id: "tuteur", label: "Tuteurs", count: net.coaches.filter((c) => c.isTutor).length },
            { id: "inactifs", label: "Inactifs", count: net.coaches.filter((c) => !c.active).length },
          ]}
        />
        <div className="flex flex-col gap-2 sm:flex-row">
          <select className="field rounded-full py-2.5 sm:w-60" value={club} onChange={(e) => setClub(e.target.value)} aria-label="Filtrer par club">
            <option value="">Tous les clubs</option>
            {net.clubs.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
          <SearchBox value={q} onChange={setQ} placeholder="Nom, email, téléphone…" />
        </div>
      </div>

      {net.clubs.length === 0 ? (
        <EmptyState icon={Building2} title="Ajoutez d'abord un club" text="Chaque coach est rattaché à un club partenaire." action={<ArrowButton href="/admin/clubs">Clubs partenaires</ArrowButton>} />
      ) : list.length === 0 ? (
        <EmptyState icon={Contact} title="Aucun coach" text="Rien ne correspond à ces filtres." />
      ) : (
        <div className="grid gap-3 md:grid-cols-2 2xl:grid-cols-3">
          <AnimatePresence initial={false}>
            {list.map((c, i) => {
              const items = net.equipment.filter((e) => e.responsibleCoachId === c.id && e.status !== "reforme");
              const tutored = net.placements.filter((p) => p.tutorCoachId === c.id && p.status === "en_cours").length;
              const cl = clubOf(c.clubId);
              return (
                <motion.div
                  key={c.id}
                  layout
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.96 }}
                  transition={{ delay: Math.min(i, 9) * 0.03 }}
                  className={`card flex flex-col p-5 transition-all hover:-translate-y-0.5 hover:shadow-lift ${c.active ? "" : "opacity-60"}`}
                >
                  <div className="flex items-start gap-3">
                    <Avatar name={c.name} size={48} />
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-semibold">{c.name}</p>
                      <p className="flex items-center gap-1 truncate text-xs text-mutedfg">
                        <Building2 size={12} /> {cl?.name ?? "Club supprimé"}
                      </p>
                      <div className="mt-2 flex flex-wrap gap-1">
                        {c.isEquipmentManager && <Badge tone="orange">Resp. matériel</Badge>}
                        {c.isTutor && <Badge tone="ink">Tuteur</Badge>}
                        {c.mustChangePassword && <Badge tone="muted">1re connexion</Badge>}
                      </div>
                    </div>
                    <Switch checked={c.active} label={c.active ? "Désactiver le compte" : "Activer le compte"} onChange={() => mutate(`/api/coaches/${c.id}`, { method: "PATCH", json: { active: !c.active } }, c.active ? "Compte désactivé" : "Compte activé")} />
                  </div>
                  <div className="mt-4 space-y-1 text-xs text-mutedfg">
                    <a href={`mailto:${c.email}`} className="flex items-center gap-1.5 truncate hover:text-orange">
                      <Mail size={12} /> {c.email}
                    </a>
                    {c.phone && (
                      <a href={`tel:${c.phone}`} className="flex items-center gap-1.5 hover:text-orange">
                        <Phone size={12} /> {c.phone}
                      </a>
                    )}
                    <p className="flex items-center gap-1.5">
                      <Clock size={12} /> {c.lastLoginAt ? `Dernière connexion ${new Date(c.lastLoginAt).toLocaleDateString("fr-FR")}` : "Jamais connecté"}
                    </p>
                  </div>
                  <div className="mt-4 grid grid-cols-2 gap-2">
                    <a href={`/admin/materiel?coach=${c.id}`} className="rounded-xl bg-muted/70 p-3 transition-colors hover:bg-muted">
                      <p className="h-display text-2xl leading-none">{items.length}</p>
                      <p className="mt-1 flex items-center gap-1 font-mono text-[9px] uppercase tracking-wider text-mutedfg">
                        <Boxes size={10} /> Articles en charge
                      </p>
                    </a>
                    <a href={`/admin/alternance?tutor=${c.id}`} className="rounded-xl bg-muted/70 p-3 transition-colors hover:bg-muted">
                      <p className="h-display text-2xl leading-none">{tutored}</p>
                      <p className="mt-1 flex items-center gap-1 font-mono text-[9px] uppercase tracking-wider text-mutedfg">
                        <Handshake size={10} /> Alternants suivis
                      </p>
                    </a>
                  </div>
                  <div className="mt-4 flex items-center gap-1.5 border-t border-line pt-4">
                    <IconAction
                      icon={Pencil}
                      label="Modifier"
                      onClick={() => {
                        setForm({ name: c.name, email: c.email, phone: c.phone, clubId: c.clubId, isTutor: c.isTutor, isEquipmentManager: c.isEquipmentManager });
                        setEditing(c);
                      }}
                    />
                    <IconAction icon={KeyRound} label="Nouveau mot de passe provisoire" tone="orange" onClick={() => setToReset(c)} />
                    <span className="flex-1" />
                    <IconAction icon={Trash2} label="Supprimer" tone="danger" onClick={() => setToDelete(c)} />
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
        title={editing === "new" ? "Nouveau coach" : "Modifier le coach"}
        icon={Contact}
        footer={
          <div className="flex justify-end gap-2">
            <button onClick={() => setEditing(null)} className="rounded-full px-5 py-3 text-sm font-semibold text-mutedfg hover:text-ink">
              Annuler
            </button>
            <ArrowButton loading={saving} onClick={save}>
              {editing === "new" ? "Créer le compte" : "Enregistrer"}
            </ArrowButton>
          </div>
        }
      >
        <form id="coach-form" className="space-y-5" onSubmit={(e) => e.preventDefault()}>
          <Field label="Nom complet">
            <input required className="field" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          </Field>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Email (identifiant de connexion)">
              <input required type="email" className="field" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
            </Field>
            <Field label="Téléphone">
              <input type="tel" className="field" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
            </Field>
          </div>
          <Field label="Club" hint={editing !== "new" ? "Changer de club libère le matériel dont il était responsable dans l'ancien club." : undefined}>
            <select required className="field" value={form.clubId} onChange={(e) => setForm({ ...form, clubId: e.target.value })}>
              <option value="">Choisir un club…</option>
              {net.clubs.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name} — {c.city}
                </option>
              ))}
            </select>
          </Field>
          <div className="space-y-3 rounded-2xl border border-line bg-white p-4">
            <label className="flex items-start justify-between gap-4">
              <span>
                <span className="block text-sm font-semibold">Responsable matériel du club</span>
                <span className="block text-xs text-mutedfg">Gère tout le parc du club : inventaires complets, réattribution entre coachs.</span>
              </span>
              <Switch checked={form.isEquipmentManager} label="Responsable matériel" onChange={() => setForm({ ...form, isEquipmentManager: !form.isEquipmentManager })} />
            </label>
            <label className="flex items-start justify-between gap-4 border-t border-line pt-3">
              <span>
                <span className="block text-sm font-semibold">Tuteur d&rsquo;alternance</span>
                <span className="block text-xs text-mutedfg">Encadre des apprenants, valide leurs séances et les évalue.</span>
              </span>
              <Switch checked={form.isTutor} label="Tuteur" onChange={() => setForm({ ...form, isTutor: !form.isTutor })} />
            </label>
          </div>
          {editing === "new" && (
            <p className="flex items-start gap-2 rounded-xl bg-orangeL p-3 text-xs text-orangeD">
              <ShieldCheck size={15} className="mt-0.5 shrink-0" /> Un mot de passe provisoire sera généré et affiché une seule fois. Le coach devra le changer à sa première connexion.
            </p>
          )}
        </form>
      </Drawer>

      <SecretDialog secret={secret} onClose={() => setSecret(null)} />

      <ConfirmDialog
        open={!!toReset}
        title="Réinitialiser le mot de passe ?"
        text="L'ancien mot de passe cessera de fonctionner. Un nouveau mot de passe provisoire sera affiché."
        confirmLabel="Réinitialiser"
        onClose={() => setToReset(null)}
        onConfirm={async () => {
          if (toReset) await resetPassword(toReset);
        }}
      />
      <ConfirmDialog
        open={!!toDelete}
        title="Supprimer ce coach ?"
        text="Son matériel et ses alternants passeront « non attribués » : pensez à les réaffecter. Préférez la désactivation pour garder l'historique."
        onClose={() => setToDelete(null)}
        onConfirm={async () => {
          if (toDelete) await mutate(`/api/coaches/${toDelete.id}`, { method: "DELETE" }, "Coach supprimé");
        }}
      />
    </div>
  );
}

function SecretDialog({ secret, onClose }: { secret: { name: string; email: string; password: string } | null; onClose: () => void }) {
  const [copied, setCopied] = useState(false);
  const text = secret
    ? `Bonjour ${secret.name},\nVotre espace coach MADES Formation Continue :\n${typeof window !== "undefined" ? window.location.origin : ""}/login\nIdentifiant : ${secret.email}\nMot de passe provisoire : ${secret.password}\n(à changer à la première connexion)`
    : "";
  return (
    <Drawer open={!!secret} onClose={onClose} title="Accès du coach" icon={KeyRound}>
      {secret && (
        <div className="space-y-5">
          <p className="text-sm">
            Transmettez ces identifiants à <strong>{secret.name}</strong>. Le mot de passe ne sera <strong>plus jamais affiché</strong>.
          </p>
          <div className="relative overflow-hidden rounded-card bg-ink p-6 text-white">
            <span className="court-lines pointer-events-none absolute inset-0 opacity-30" />
            <p className="relative font-mono text-[10px] uppercase tracking-[0.16em] text-white/50">Identifiant</p>
            <p className="relative mt-1 break-all font-semibold">{secret.email}</p>
            <p className="relative mt-4 font-mono text-[10px] uppercase tracking-[0.16em] text-white/50">Mot de passe provisoire</p>
            <p className="h-display relative mt-1 select-all text-4xl tracking-wider text-orange">{secret.password}</p>
          </div>
          <ArrowButton
            full
            variant="dark"
            icon={copied ? Check : Copy}
            onClick={async () => {
              await navigator.clipboard?.writeText(text);
              setCopied(true);
              setTimeout(() => setCopied(false), 2000);
            }}
          >
            {copied ? "Copié" : "Copier le message d'accès"}
          </ArrowButton>
          <pre className="whitespace-pre-wrap rounded-2xl border border-line bg-white p-4 font-mono text-xs text-mutedfg">{text}</pre>
        </div>
      )}
    </Drawer>
  );
}
