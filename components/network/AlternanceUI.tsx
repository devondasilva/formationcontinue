"use client";

import { useState } from "react";
import { BadgeCheck } from "lucide-react";
import type { Placement, PlacementResult } from "@/lib/types";
import { PLACEMENT_RESULT_LABEL, PLACEMENT_RESULT_TONE } from "@/lib/labels";
import { Badge, Field } from "@/components/ui/primitives";
import ArrowButton from "@/components/ui/ArrowButton";
import type { Api } from "./EquipmentUI";

/** Barre d'heures : validées (pleine), en attente (hachurée), objectif. */
export function HoursBar({ validated, pending, planned, dark = false }: { validated: number; pending: number; planned: number; dark?: boolean }) {
  const max = Math.max(planned, validated + pending, 1);
  const v = Math.min(100, (validated / max) * 100);
  const p = Math.min(100 - v, (pending / max) * 100);
  return (
    <div>
      <div className={`flex h-2 w-full overflow-hidden rounded-full ${dark ? "bg-white/15" : "bg-muted"}`} role="meter" aria-valuenow={validated} aria-valuemax={planned}>
        <div className="h-full bg-orange transition-[width] duration-700" style={{ width: `${v}%` }} />
        <div
          className="h-full transition-[width] duration-700"
          style={{ width: `${p}%`, backgroundImage: "repeating-linear-gradient(45deg, rgba(232,93,4,.55) 0 4px, rgba(232,93,4,.2) 4px 8px)" }}
        />
      </div>
      <p className={`mt-1.5 flex justify-between font-mono text-[10px] ${dark ? "text-white/60" : "text-mutedfg"}`}>
        <span>
          <strong className={dark ? "text-white" : "text-ink"}>{validated} h</strong> validées{pending > 0 ? ` · ${pending} h en attente` : ""}
        </span>
        <span>objectif {planned} h</span>
      </p>
    </div>
  );
}

/** Évaluation de fin d'alternance (tuteur ou administration). */
export function EvaluationForm({ placement, api, onDone }: { placement: Placement; api: Api; onDone?: () => void }) {
  const [result, setResult] = useState<PlacementResult>(placement.evaluation?.result ?? "acquis");
  const [comment, setComment] = useState(placement.evaluation?.comment ?? "");
  const [busy, setBusy] = useState(false);
  return (
    <div className="space-y-4">
      {placement.evaluation && (
        <p className="flex flex-wrap items-center gap-2 text-xs text-mutedfg">
          <Badge tone={PLACEMENT_RESULT_TONE[placement.evaluation.result]}>{PLACEMENT_RESULT_LABEL[placement.evaluation.result]}</Badge>
          par {placement.evaluation.by.name} le {new Date(placement.evaluation.at).toLocaleDateString("fr-FR")}
        </p>
      )}
      <Field label="Résultat">
        <div className="grid gap-2 sm:grid-cols-3">
          {(Object.keys(PLACEMENT_RESULT_LABEL) as PlacementResult[]).map((r) => (
            <button
              key={r}
              type="button"
              onClick={() => setResult(r)}
              className={`rounded-xl px-3 py-3 text-xs font-semibold ring-1 ring-inset transition-colors ${result === r ? "bg-ink text-white ring-ink" : "bg-white ring-line hover:ring-ink"}`}
            >
              {PLACEMENT_RESULT_LABEL[r]}
            </button>
          ))}
        </div>
      </Field>
      <Field label="Appréciation du tuteur">
        <textarea rows={4} className="field" value={comment} onChange={(e) => setComment(e.target.value)} placeholder="Points forts, axes de progrès, posture professionnelle…" />
      </Field>
      <ArrowButton
        size="sm"
        icon={BadgeCheck}
        loading={busy}
        onClick={async () => {
          setBusy(true);
          const ok = await api(`/api/placements/${placement.id}`, { method: "PATCH", json: { evaluation: { result, comment } } }, "Évaluation enregistrée");
          setBusy(false);
          if (ok) onDone?.();
        }}
      >
        {placement.evaluation ? "Mettre à jour l'évaluation" : "Enregistrer l'évaluation"}
      </ArrowButton>
    </div>
  );
}
