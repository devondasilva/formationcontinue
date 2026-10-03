"use client";

import { Suspense, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import {
  ClipboardCheck,
  Check,
  Award,
  Ban,
  RotateCcw,
  Download,
  FileSpreadsheet,
  UserPlus,
  Inbox,
  X,
  Smartphone,
  CreditCard,
  Landmark,
} from "lucide-react";
import type { Currency, EnrollmentStatus, PaymentMethod } from "@/lib/types";
import { ENROLLMENT_STATUS_LABEL, ENROLLMENT_STATUS_TONE, PAYMENT_LABEL, formatRange } from "@/lib/labels";
import { formatAmount } from "@/lib/currency";
import { LevelIcon } from "@/components/icons/DisciplineIcon";
import ArrowButton from "@/components/ui/ArrowButton";
import CurrencySelector from "@/components/CurrencySelector";
import { Badge, EmptyState, Field, Skeleton } from "@/components/ui/primitives";
import { useAdmin } from "../_lib/AdminContext";
import type { AdminEnrollment } from "../_lib/types";
import { AdminHeader, Avatar, Drawer, FilterPills, IconAction, SearchBox } from "../_components/kit";

export default function Page() {
  return (
    <Suspense fallback={<Skeleton className="h-96" />}>
      <EnrollmentsAdmin />
    </Suspense>
  );
}

type Filter = EnrollmentStatus | "toutes";
const PAY_ICON = { mtn_momo: Smartphone, moov_money: Smartphone, carte_bancaire: CreditCard, virement: Landmark };

function csvEscape(v: string | number) {
  const s = String(v);
  return /[";\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

function EnrollmentsAdmin() {
  const { stats, mutate, refresh, notify } = useAdmin();
  const params = useSearchParams();
  const initial = params.get("statut") as Filter | null;
  const [filter, setFilter] = useState<Filter>(initial ?? "toutes");
  const [sessionFilter, setSessionFilter] = useState(params.get("session") ?? "");
  const [q, setQ] = useState("");
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [adding, setAdding] = useState(false);
  const [busy, setBusy] = useState(false);
  const [form, setForm] = useState({ sessionId: "", name: "", email: "", phone: "", paymentMethod: "mtn_momo" as PaymentMethod, currency: "FCFA" as Currency });

  const list = useMemo(() => {
    if (!stats) return [];
    const term = q.trim().toLowerCase();
    return [...stats.enrollments]
      .filter((e) => filter === "toutes" || e.status === filter)
      .filter((e) => !sessionFilter || e.sessionId === sessionFilter)
      .filter((e) => !term || `${e.learnerName} ${e.formationTitle}`.toLowerCase().includes(term))
      .sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1));
  }, [stats, filter, sessionFilter, q]);

  if (!stats) return <Skeleton className="h-96" />;

  const count = (s: EnrollmentStatus) => stats.enrollments.filter((e) => e.status === s).length;
  const setStatus = (e: AdminEnrollment, status: EnrollmentStatus, msg: string) => mutate(`/api/enrollments/${e.id}`, { method: "PATCH", json: { status } }, msg);
  const allChecked = list.length > 0 && list.every((e) => selected.has(e.id));
  const selectedPending = list.filter((e) => selected.has(e.id) && e.status === "en_attente");
  const sessionLabel = sessionFilter ? stats.sessions.find((s) => s.id === sessionFilter) : null;

  async function bulkConfirm() {
    setBusy(true);
    for (const e of selectedPending) {
      await fetch(`/api/enrollments/${e.id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ status: "confirmee" }) });
    }
    await refresh();
    notify(`${selectedPending.length} paiement(s) confirmé(s)`);
    setSelected(new Set());
    setBusy(false);
  }

  function exportCsv() {
    const rows = [
      ["Apprenant", "Email", "Téléphone", "Formation", "Début", "Fin", "Montant FCFA", "Devise", "Paiement", "Statut", "Certificat"],
      ...list.map((e) => {
        const l = stats!.learners.find((x) => x.id === e.learnerId);
        return [e.learnerName, l?.email ?? "", l?.phone ?? "", e.formationTitle, e.sessionStartDate, e.sessionEndDate, e.amountFCFA, e.currency, PAYMENT_LABEL[e.paymentMethod], ENROLLMENT_STATUS_LABEL[e.status], e.certificateIssued ? "Oui" : "Non"];
      }),
    ];
    const csv = "﻿" + rows.map((r) => r.map(csvEscape).join(";")).join("\n");
    const url = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8" }));
    const a = Object.assign(document.createElement("a"), { href: url, download: `inscriptions-mades-${new Date().toISOString().slice(0, 10)}.csv` });
    a.click();
    URL.revokeObjectURL(url);
  }

  async function addEnrollment() {
    const el = document.getElementById("enroll-form") as HTMLFormElement | null;
    if (el && !el.reportValidity()) return;
    setBusy(true);
    const ok = await mutate("/api/enrollments", { method: "POST", json: form }, "Inscription ajoutée");
    setBusy(false);
    if (ok) {
      setAdding(false);
      setForm({ ...form, sessionId: "", name: "", email: "", phone: "" });
    }
  }

  const openSessions = stats.sessions.filter((s) => s.status === "ouverte");

  return (
    <div>
      <AdminHeader
        icon={ClipboardCheck}
        title="Inscriptions"
        subtitle="Confirmez les paiements, validez les formations, délivrez les certificats."
        actions={
          <>
            <ArrowButton variant="outline" size="sm" icon={FileSpreadsheet} arrow={false} onClick={exportCsv}>
              Exporter CSV
            </ArrowButton>
            <ArrowButton size="sm" icon={UserPlus} onClick={() => setAdding(true)}>
              Inscrire un apprenant
            </ArrowButton>
          </>
        }
      />

      <div className="mb-5 flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
        <div className="overflow-x-auto">
          <FilterPills
            value={filter}
            onChange={(v) => {
              setFilter(v);
              setSelected(new Set());
            }}
            options={[
              { id: "toutes", label: "Toutes", count: stats.enrollments.length },
              { id: "en_attente", label: "En attente", count: count("en_attente") },
              { id: "confirmee", label: "Confirmées", count: count("confirmee") },
              { id: "terminee", label: "Terminées", count: count("terminee") },
              { id: "annulee", label: "Annulées", count: count("annulee") },
            ]}
          />
        </div>
        <SearchBox value={q} onChange={setQ} placeholder="Apprenant ou formation…" />
      </div>

      {sessionLabel && (
        <p className="mb-4 inline-flex items-center gap-2 rounded-full bg-orangeL px-3 py-1.5 text-xs font-semibold text-orangeD">
          Session : {sessionLabel.formationTitle} · {formatRange(sessionLabel.startDate, sessionLabel.endDate)}
          <button onClick={() => setSessionFilter("")} aria-label="Retirer le filtre session">
            <X size={14} />
          </button>
        </p>
      )}

      {/* Barre d'action groupée */}
      {selected.size > 0 && (
        <div className="sticky top-20 z-20 mb-4 flex flex-wrap items-center justify-between gap-3 rounded-2xl bg-ink px-4 py-3 text-white shadow-lift">
          <p className="text-sm font-semibold">{selected.size} sélectionnée(s)</p>
          <div className="flex items-center gap-2">
            <ArrowButton size="sm" icon={Check} arrow={false} disabled={selectedPending.length === 0} loading={busy} onClick={bulkConfirm}>
              {`Confirmer ${selectedPending.length} paiement(s)`}
            </ArrowButton>
            <button onClick={() => setSelected(new Set())} className="rounded-full p-2 text-white/60 hover:bg-white/10 hover:text-white" aria-label="Vider la sélection">
              <X size={16} />
            </button>
          </div>
        </div>
      )}

      {list.length === 0 ? (
        <EmptyState icon={Inbox} title="Aucune inscription" text="Rien à afficher pour ces filtres." />
      ) : (
        <div className="card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[860px] text-sm">
              <thead>
                <tr className="border-b border-line bg-muted/50 text-left font-mono text-[10px] uppercase tracking-wider text-mutedfg">
                  <th className="w-10 px-4 py-3">
                    <input
                      type="checkbox"
                      className="h-4 w-4 accent-orange"
                      checked={allChecked}
                      onChange={() => setSelected(allChecked ? new Set() : new Set(list.map((e) => e.id)))}
                      aria-label="Tout sélectionner"
                    />
                  </th>
                  <th className="px-2 py-3">Apprenant</th>
                  <th className="px-4 py-3">Formation</th>
                  <th className="px-4 py-3">Paiement</th>
                  <th className="px-4 py-3 text-right">Montant</th>
                  <th className="px-4 py-3">Statut</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {list.map((e) => {
                  const PayIcon = PAY_ICON[e.paymentMethod];
                  const checked = selected.has(e.id);
                  return (
                    <tr key={e.id} className={`transition-colors hover:bg-orangeL/40 ${checked ? "bg-orangeL/60" : ""}`}>
                      <td className="px-4 py-3">
                        <input
                          type="checkbox"
                          className="h-4 w-4 accent-orange"
                          checked={checked}
                          onChange={() => {
                            const n = new Set(selected);
                            if (checked) n.delete(e.id);
                            else n.add(e.id);
                            setSelected(n);
                          }}
                          aria-label={`Sélectionner ${e.learnerName}`}
                        />
                      </td>
                      <td className="px-2 py-3">
                        <div className="flex items-center gap-3">
                          <Avatar name={e.learnerName} size={32} />
                          <span className="font-semibold">{e.learnerName}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <LevelIcon level={e.level} size={16} className="shrink-0 text-orange" />
                          <div>
                            <p className="font-medium">{e.formationTitle}</p>
                            <p className="font-mono text-[10px] text-mutedfg">{formatRange(e.sessionStartDate, e.sessionEndDate)}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span className="inline-flex items-center gap-1.5 text-xs text-mutedfg">
                          <PayIcon size={14} /> {PAYMENT_LABEL[e.paymentMethod]}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right font-mono text-xs">{formatAmount(e.amountFCFA, "FCFA")}</td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1.5">
                          <Badge tone={ENROLLMENT_STATUS_TONE[e.status]}>{ENROLLMENT_STATUS_LABEL[e.status]}</Badge>
                          {e.certificateIssued && <Award size={15} className="text-orange" aria-label="Certificat délivré" />}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex justify-end gap-1.5">
                          {e.status === "en_attente" && <IconAction icon={Check} label="Confirmer le paiement" tone="success" onClick={() => setStatus(e, "confirmee", "Paiement confirmé")} />}
                          {e.status === "confirmee" && <IconAction icon={Award} label="Valider la formation et délivrer le certificat" tone="orange" onClick={() => setStatus(e, "terminee", "Certificat délivré")} />}
                          {e.certificateIssued && <IconAction icon={Download} label="Télécharger le certificat" href={`/api/enrollments/${e.id}/certificate`} />}
                          {e.status === "annulee" ? (
                            <IconAction icon={RotateCcw} label="Rétablir (en attente)" onClick={() => setStatus(e, "en_attente", "Inscription rétablie")} />
                          ) : (
                            e.status !== "terminee" && <IconAction icon={Ban} label="Annuler l'inscription" tone="danger" onClick={() => setStatus(e, "annulee", "Inscription annulée")} />
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Inscription manuelle (paiement sur place, inscription téléphonique…) */}
      <Drawer
        open={adding}
        onClose={() => setAdding(false)}
        title="Inscrire un apprenant"
        icon={UserPlus}
        footer={
          <div className="flex justify-end gap-2">
            <button onClick={() => setAdding(false)} className="rounded-full px-5 py-3 text-sm font-semibold text-mutedfg hover:text-ink">
              Annuler
            </button>
            <ArrowButton loading={busy} onClick={addEnrollment}>
              Inscrire
            </ArrowButton>
          </div>
        }
      >
        <form id="enroll-form" className="space-y-5" onSubmit={(e) => e.preventDefault()}>
          <Field label="Session (ouverte)">
            <select required className="field" value={form.sessionId} onChange={(e) => setForm({ ...form, sessionId: e.target.value })}>
              <option value="">Choisir une session…</option>
              {openSessions.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.formationTitle} — {formatRange(s.startDate, s.endDate)} ({s.capacity - s.enrolledCount} places)
                </option>
              ))}
            </select>
          </Field>
          <Field label="Apprenant existant ou nouveau" hint="Choisissez un apprenant pour pré-remplir, ou saisissez de nouvelles coordonnées.">
            <select
              className="field"
              value=""
              onChange={(e) => {
                const l = stats.learners.find((x) => x.id === e.target.value);
                if (l) setForm({ ...form, name: l.name, email: l.email, phone: l.phone });
              }}
            >
              <option value="">— Pré-remplir depuis la liste —</option>
              {stats.learners.map((l) => (
                <option key={l.id} value={l.id}>
                  {l.name} · {l.email}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Nom complet">
            <input required className="field" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          </Field>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Email">
              <input required type="email" className="field" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
            </Field>
            <Field label="Téléphone">
              <input required className="field" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
            </Field>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Paiement">
              <select className="field" value={form.paymentMethod} onChange={(e) => setForm({ ...form, paymentMethod: e.target.value as PaymentMethod })}>
                {(Object.keys(PAYMENT_LABEL) as PaymentMethod[]).map((m) => (
                  <option key={m} value={m}>
                    {PAYMENT_LABEL[m]}
                  </option>
                ))}
              </select>
            </Field>
            <div>
              <span className="field-label">Devise</span>
              <CurrencySelector value={form.currency} onChange={(c) => setForm({ ...form, currency: c })} id="admin-enroll" />
            </div>
          </div>
        </form>
      </Drawer>
    </div>
  );
}
