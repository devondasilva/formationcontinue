"use client";

import { useState } from "react";
import { AdminFormation, AdminSession } from "./types";
import { formatAmount } from "@/lib/currency";

const DISCIPLINE_OPTS = [
  { v: "beach-tennis", l: "Beach Tennis" }, { v: "padel", l: "Padel" },
  { v: "tennis", l: "Tennis" }, { v: "mini-tennis", l: "Mini-Tennis" },
];
const LEVEL_OPTS = [
  { v: "initiateur", l: "Initiateur" }, { v: "animateur", l: "Animateur" },
  { v: "entraineur", l: "Entraîneur" }, { v: "de", l: "Diplôme d'État" },
];
const FORMAT_OPTS = [
  { v: "presentiel", l: "Présentiel" }, { v: "distanciel", l: "Distanciel" }, { v: "hybride", l: "Hybride" },
];

const emptyForm = {
  title: "", discipline: "beach-tennis", level: "initiateur", format: "presentiel",
  description: "", durationHours: "", prerequisites: "", certification: "", syllabus: "", priceFCFA: "",
};

const emptySessionForm = { startDate: "", endDate: "", location: "", instructor: "", capacity: "" };

export default function FormationsTab({
  formations,
  sessions,
  onChanged,
}: {
  formations: AdminFormation[];
  sessions: AdminSession[];
  onChanged: () => void;
}) {
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [openId, setOpenId] = useState<string | null>(null);
  const [sessionForm, setSessionForm] = useState(emptySessionForm);
  const [sessionError, setSessionError] = useState<string | null>(null);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setCreating(true);
    try {
      const res = await fetch("/api/formations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          durationHours: Number(form.durationHours),
          priceFCFA: Number(form.priceFCFA),
          syllabus: form.syllabus.split(",").map((s) => s.trim()).filter(Boolean),
        }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error ?? "Une erreur est survenue."); return; }
      setForm(emptyForm);
      setShowForm(false);
      onChanged();
    } finally {
      setCreating(false);
    }
  }

  async function toggleActive(f: AdminFormation) {
    setBusyId(f.id);
    try {
      await fetch(`/api/formations/${f.id}`, {
        method: "PATCH", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ active: !f.active }),
      });
      onChanged();
    } finally { setBusyId(null); }
  }

  async function handleDelete(id: string) {
    setBusyId(id);
    try {
      await fetch(`/api/formations/${id}`, { method: "DELETE" });
      onChanged();
    } finally { setBusyId(null); }
  }

  async function handleCreateSession(formationId: string, e: React.FormEvent) {
    e.preventDefault();
    setSessionError(null);
    try {
      const res = await fetch(`/api/formations/${formationId}/sessions`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...sessionForm, capacity: Number(sessionForm.capacity) }),
      });
      const data = await res.json();
      if (!res.ok) { setSessionError(data.error ?? "Une erreur est survenue."); return; }
      setSessionForm(emptySessionForm);
      onChanged();
    } catch {
      setSessionError("Erreur réseau.");
    }
  }

  async function setSessionStatus(id: string, status: AdminSession["status"]) {
    setBusyId(id);
    try {
      await fetch(`/api/sessions/${id}`, {
        method: "PATCH", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      onChanged();
    } finally { setBusyId(null); }
  }

  async function handleDeleteSession(id: string) {
    setBusyId(id);
    try {
      await fetch(`/api/sessions/${id}`, { method: "DELETE" });
      onChanged();
    } finally { setBusyId(null); }
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-end">
        <button onClick={() => setShowForm((s) => !s)}
          className="text-xs font-bold uppercase tracking-widest px-4 py-2 rounded-full border border-ink/15 hover:border-orange hover:text-orange transition-colors">
          {showForm ? "Annuler" : "+ Nouvelle formation"}
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleCreate} className="rounded-card border border-ink/15 p-5 grid sm:grid-cols-2 gap-3">
          <input required placeholder="Titre" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })}
            className="rounded-card border border-ink/20 px-3 py-2 text-sm sm:col-span-2" />
          <select value={form.discipline} onChange={(e) => setForm({ ...form, discipline: e.target.value })}
            className="rounded-card border border-ink/20 px-3 py-2 text-sm bg-white">
            {DISCIPLINE_OPTS.map((o) => <option key={o.v} value={o.v}>{o.l}</option>)}
          </select>
          <select value={form.level} onChange={(e) => setForm({ ...form, level: e.target.value })}
            className="rounded-card border border-ink/20 px-3 py-2 text-sm bg-white">
            {LEVEL_OPTS.map((o) => <option key={o.v} value={o.v}>{o.l}</option>)}
          </select>
          <select value={form.format} onChange={(e) => setForm({ ...form, format: e.target.value })}
            className="rounded-card border border-ink/20 px-3 py-2 text-sm bg-white">
            {FORMAT_OPTS.map((o) => <option key={o.v} value={o.v}>{o.l}</option>)}
          </select>
          <input required type="number" placeholder="Durée (heures)" value={form.durationHours}
            onChange={(e) => setForm({ ...form, durationHours: e.target.value })}
            className="rounded-card border border-ink/20 px-3 py-2 text-sm" />
          <input required type="number" placeholder="Prix (FCFA)" value={form.priceFCFA}
            onChange={(e) => setForm({ ...form, priceFCFA: e.target.value })}
            className="rounded-card border border-ink/20 px-3 py-2 text-sm sm:col-span-2" />
          <input placeholder="Certification délivrée" value={form.certification}
            onChange={(e) => setForm({ ...form, certification: e.target.value })}
            className="rounded-card border border-ink/20 px-3 py-2 text-sm sm:col-span-2" />
          <textarea placeholder="Description" rows={2} value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
            className="rounded-card border border-ink/20 px-3 py-2 text-sm sm:col-span-2" />
          <input placeholder="Prérequis" value={form.prerequisites}
            onChange={(e) => setForm({ ...form, prerequisites: e.target.value })}
            className="rounded-card border border-ink/20 px-3 py-2 text-sm sm:col-span-2" />
          <input placeholder="Programme, séparé par des virgules" value={form.syllabus}
            onChange={(e) => setForm({ ...form, syllabus: e.target.value })}
            className="rounded-card border border-ink/20 px-3 py-2 text-sm sm:col-span-2" />
          {error && <p className="text-xs text-red-600 sm:col-span-2">{error}</p>}
          <button type="submit" disabled={creating}
            className="sm:col-span-2 rounded-card bg-orange text-ink font-bold py-2 text-sm hover:bg-ink hover:text-white transition-colors disabled:opacity-60">
            {creating ? "Création…" : "Créer la formation"}
          </button>
        </form>
      )}

      <div className="space-y-3">
        {formations.map((f) => {
          const fSessions = sessions.filter((s) => s.formationId === f.id);
          return (
            <div key={f.id} className="rounded-card border border-ink/15 overflow-hidden">
              <div className="flex flex-wrap items-center justify-between gap-3 p-4 bg-ink/[0.03]">
                <div>
                  <p className="font-semibold text-ink">
                    {f.title} {!f.active && <span className="text-xs text-red-500 font-normal">(masquée)</span>}
                  </p>
                  <p className="text-xs text-ink/50">
                    {f.discipline} · {f.level} · {f.durationHours}h · {formatAmount(f.priceFCFA, "FCFA")} · {fSessions.length} session(s)
                  </p>
                </div>
                <div className="flex gap-3">
                  <button onClick={() => setOpenId(openId === f.id ? null : f.id)} className="text-xs font-semibold text-ink/60 hover:underline">
                    {openId === f.id ? "Masquer" : "Gérer les sessions"}
                  </button>
                  <button disabled={busyId === f.id} onClick={() => toggleActive(f)} className="text-xs font-semibold text-ink/50 hover:underline disabled:opacity-50">
                    {f.active ? "Masquer" : "Publier"}
                  </button>
                  <button disabled={busyId === f.id} onClick={() => handleDelete(f.id)} className="text-xs font-semibold text-red-600 hover:underline disabled:opacity-50">
                    Supprimer
                  </button>
                </div>
              </div>

              {openId === f.id && (
                <div className="p-4 border-t border-ink/10 space-y-4">
                  <div className="space-y-2">
                    {fSessions.length === 0 && <p className="text-xs text-ink/50">Aucune session pour cette formation.</p>}
                    {fSessions.map((s) => (
                      <div key={s.id} className="flex flex-wrap items-center justify-between gap-2 text-sm rounded-card bg-white border border-ink/10 px-3 py-2">
                        <span>{s.startDate} → {s.endDate} · {s.location} · {s.enrolledCount}/{s.capacity} · <span className="text-ink/50">{s.status}</span></span>
                        <div className="flex gap-2">
                          {s.status !== "annulee" && (
                            <button disabled={busyId === s.id} onClick={() => setSessionStatus(s.id, "annulee")} className="text-xs font-semibold text-red-600 hover:underline disabled:opacity-50">Annuler</button>
                          )}
                          <button disabled={busyId === s.id} onClick={() => handleDeleteSession(s.id)} className="text-xs font-semibold text-ink/50 hover:underline disabled:opacity-50">Supprimer</button>
                        </div>
                      </div>
                    ))}
                  </div>

                  <form onSubmit={(e) => handleCreateSession(f.id, e)} className="grid sm:grid-cols-2 gap-2 border-t border-ink/10 pt-4">
                    <input required type="date" value={sessionForm.startDate} onChange={(e) => setSessionForm({ ...sessionForm, startDate: e.target.value })}
                      className="rounded-card border border-ink/20 px-3 py-2 text-sm" placeholder="Début" />
                    <input required type="date" value={sessionForm.endDate} onChange={(e) => setSessionForm({ ...sessionForm, endDate: e.target.value })}
                      className="rounded-card border border-ink/20 px-3 py-2 text-sm" placeholder="Fin" />
                    <input required placeholder="Lieu" value={sessionForm.location} onChange={(e) => setSessionForm({ ...sessionForm, location: e.target.value })}
                      className="rounded-card border border-ink/20 px-3 py-2 text-sm" />
                    <input placeholder="Formateur" value={sessionForm.instructor} onChange={(e) => setSessionForm({ ...sessionForm, instructor: e.target.value })}
                      className="rounded-card border border-ink/20 px-3 py-2 text-sm" />
                    <input required type="number" placeholder="Capacité" value={sessionForm.capacity} onChange={(e) => setSessionForm({ ...sessionForm, capacity: e.target.value })}
                      className="rounded-card border border-ink/20 px-3 py-2 text-sm sm:col-span-2" />
                    {sessionError && <p className="text-xs text-red-600 sm:col-span-2">{sessionError}</p>}
                    <button type="submit" className="sm:col-span-2 rounded-card bg-ink text-white font-bold py-2 text-sm hover:bg-ink transition-colors">
                      Ajouter cette session
                    </button>
                  </form>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
