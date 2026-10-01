"use client";

import { useCallback, useEffect, useState } from "react";
import { UserCog, KeyRound, ShieldCheck, UserPlus, Trash2, Eye, EyeOff } from "lucide-react";
import { formatDate } from "@/lib/labels";
import ArrowButton from "@/components/ui/ArrowButton";
import { Field } from "@/components/ui/primitives";
import { useAdmin } from "../_lib/AdminContext";
import { AdminHeader, Avatar, ConfirmDialog, IconAction, Panel } from "../_components/kit";

interface PublicAdmin {
  id: string;
  username: string;
  name: string;
  createdAt: string;
}

function PasswordField({ label, value, onChange, autoComplete }: { label: string; value: string; onChange: (v: string) => void; autoComplete: string }) {
  const [show, setShow] = useState(false);
  return (
    <Field label={label}>
      <span className="relative block">
        <input required type={show ? "text" : "password"} autoComplete={autoComplete} className="field pr-12" value={value} onChange={(e) => onChange(e.target.value)} />
        <button type="button" onClick={() => setShow((s) => !s)} className="absolute right-3 top-1/2 -translate-y-1/2 p-1.5 text-mutedfg hover:text-ink" aria-label={show ? "Masquer" : "Afficher"}>
          {show ? <EyeOff size={17} /> : <Eye size={17} />}
        </button>
      </span>
    </Field>
  );
}

export default function AccountAdmin() {
  const { adminName, notify, mutate } = useAdmin();
  const [admins, setAdmins] = useState<PublicAdmin[]>([]);
  const [me, setMe] = useState<string | null>(null);
  const [cur, setCur] = useState("");
  const [next, setNext] = useState("");
  const [confirm, setConfirm] = useState("");
  const [savingPwd, setSavingPwd] = useState(false);
  const [nu, setNu] = useState({ username: "", name: "", password: "" });
  const [creating, setCreating] = useState(false);
  const [toDelete, setToDelete] = useState<PublicAdmin | null>(null);

  const load = useCallback(() => {
    fetch("/api/admins")
      .then((r) => r.json())
      .then((d) => {
        setAdmins(d.admins ?? []);
        setMe(d.me ?? null);
      });
  }, []);
  useEffect(load, [load]);

  async function changePwd(e: React.FormEvent) {
    e.preventDefault();
    if (next !== confirm) {
      notify("Les deux nouveaux mots de passe ne correspondent pas.", "error");
      return;
    }
    setSavingPwd(true);
    const ok = await mutate("/api/auth/change-password", { method: "POST", json: { current: cur, next } }, "Mot de passe modifié");
    setSavingPwd(false);
    if (ok) {
      setCur("");
      setNext("");
      setConfirm("");
    }
  }

  async function createAdmin(e: React.FormEvent) {
    e.preventDefault();
    setCreating(true);
    const ok = await mutate("/api/admins", { method: "POST", json: nu }, "Administrateur ajouté");
    setCreating(false);
    if (ok) {
      setNu({ username: "", name: "", password: "" });
      load();
    }
  }

  const strength = Math.min(4, [next.length >= 8, /[A-Z]/.test(next), /\d/.test(next), /[^A-Za-z0-9]/.test(next)].filter(Boolean).length);

  return (
    <div>
      <AdminHeader icon={UserCog} title="Mon compte" subtitle={adminName ? `Connecté en tant que ${adminName}` : undefined} />

      <div className="grid gap-4 xl:grid-cols-2">
        <Panel title="Changer mon mot de passe" icon={KeyRound}>
          <form onSubmit={changePwd} className="space-y-4">
            <PasswordField label="Mot de passe actuel" value={cur} onChange={setCur} autoComplete="current-password" />
            <PasswordField label="Nouveau mot de passe" value={next} onChange={setNext} autoComplete="new-password" />
            {next && (
              <div className="flex items-center gap-2">
                {[0, 1, 2, 3].map((i) => (
                  <span key={i} className={`h-1.5 flex-1 rounded-full transition-colors ${i < strength ? (strength >= 3 ? "bg-success" : "bg-orange") : "bg-muted"}`} />
                ))}
                <span className="font-mono text-[10px] text-mutedfg">{["Faible", "Faible", "Moyen", "Bon", "Fort"][strength]}</span>
              </div>
            )}
            <PasswordField label="Confirmer le nouveau mot de passe" value={confirm} onChange={setConfirm} autoComplete="new-password" />
            <ArrowButton type="submit" loading={savingPwd} variant="dark">
              Mettre à jour
            </ArrowButton>
          </form>
        </Panel>

        <Panel title="Équipe d'administration" icon={ShieldCheck}>
          <ul className="divide-y divide-line">
            {admins.map((a) => (
              <li key={a.id} className="flex items-center gap-3 py-3">
                <Avatar name={a.name} />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold">
                    {a.name} {a.id === me && <span className="ml-1 rounded-full bg-orangeL px-2 py-0.5 text-[10px] text-orangeD">vous</span>}
                  </p>
                  <p className="font-mono text-[10px] text-mutedfg">
                    @{a.username} · depuis le {formatDate(a.createdAt)}
                  </p>
                </div>
                {a.id !== me && admins.length > 1 && <IconAction icon={Trash2} label="Retirer l'accès" tone="danger" onClick={() => setToDelete(a)} />}
              </li>
            ))}
          </ul>

          <form onSubmit={createAdmin} className="mt-5 space-y-3 rounded-2xl bg-muted/60 p-4">
            <p className="flex items-center gap-2 text-sm font-semibold">
              <UserPlus size={16} className="text-orange" /> Ajouter un administrateur
            </p>
            <div className="grid gap-3 sm:grid-cols-2">
              <input required className="field" placeholder="Identifiant" value={nu.username} onChange={(e) => setNu({ ...nu, username: e.target.value })} />
              <input className="field" placeholder="Nom affiché" value={nu.name} onChange={(e) => setNu({ ...nu, name: e.target.value })} />
            </div>
            <input required type="password" minLength={8} autoComplete="new-password" className="field" placeholder="Mot de passe (8 caractères min.)" value={nu.password} onChange={(e) => setNu({ ...nu, password: e.target.value })} />
            <ArrowButton type="submit" size="sm" loading={creating}>
              Créer l&apos;accès
            </ArrowButton>
          </form>
        </Panel>
      </div>

      <ConfirmDialog
        open={!!toDelete}
        title="Retirer cet accès ?"
        text={`${toDelete?.name} ne pourra plus se connecter au back-office.`}
        confirmLabel="Retirer"
        onClose={() => setToDelete(null)}
        onConfirm={async () => {
          if (toDelete && (await mutate(`/api/admins/${toDelete.id}`, { method: "DELETE" }, "Accès retiré"))) load();
        }}
      />
    </div>
  );
}
