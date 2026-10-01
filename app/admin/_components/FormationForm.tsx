"use client";

import { useState } from "react";
import { Plus, Trash2, GripVertical } from "lucide-react";
import type { Discipline, Format, Level } from "@/lib/types";
import { DISCIPLINES, DISCIPLINE_LABEL, FORMATS, FORMAT_LABEL, LEVELS, LEVEL_LABEL } from "@/lib/labels";
import { DisciplineIcon, LevelIcon, moduleIcon } from "@/components/icons/DisciplineIcon";
import { Field } from "@/components/ui/primitives";
import type { AdminFormation } from "../_lib/types";

export interface FormationDraft {
  title: string;
  discipline: Discipline;
  level: Level;
  format: Format;
  description: string;
  durationHours: string;
  prerequisites: string;
  certification: string;
  syllabus: string[];
  priceFCFA: string;
}

export const emptyDraft: FormationDraft = {
  title: "",
  discipline: "tennis",
  level: "initiateur",
  format: "presentiel",
  description: "",
  durationHours: "",
  prerequisites: "",
  certification: "",
  syllabus: [""],
  priceFCFA: "",
};

export function draftFrom(f: AdminFormation): FormationDraft {
  return {
    title: f.title,
    discipline: f.discipline,
    level: f.level,
    format: f.format,
    description: f.description,
    durationHours: String(f.durationHours),
    prerequisites: f.prerequisites,
    certification: f.certification,
    syllabus: f.syllabus.length ? [...f.syllabus] : [""],
    priceFCFA: String(f.priceFCFA),
  };
}

export function draftToPayload(d: FormationDraft) {
  return {
    ...d,
    durationHours: Number(d.durationHours),
    priceFCFA: Number(d.priceFCFA),
    syllabus: d.syllabus.map((s) => s.trim()).filter(Boolean),
    certification: d.certification || `Certificat ${LEVEL_LABEL[d.level]} ${DISCIPLINE_LABEL[d.discipline]} MADES`,
  };
}

/** Formulaire de formation : choix visuels (icônes) pour discipline/niveau/format, éditeur de modules. */
export default function FormationForm({ draft, onChange, id }: { draft: FormationDraft; onChange: (d: FormationDraft) => void; id: string }) {
  const set = <K extends keyof FormationDraft>(k: K, v: FormationDraft[K]) => onChange({ ...draft, [k]: v });
  const [dragIdx, setDragIdx] = useState<number | null>(null);

  function moveModule(from: number, to: number) {
    if (from === to) return;
    const s = [...draft.syllabus];
    const [m] = s.splice(from, 1);
    s.splice(to, 0, m);
    set("syllabus", s);
  }

  return (
    <form id={id} className="space-y-6" onSubmit={(e) => e.preventDefault()}>
      <Field label="Titre">
        <input required className="field" value={draft.title} onChange={(e) => set("title", e.target.value)} placeholder="Ex. Animateur Padel" />
      </Field>

      <div>
        <span className="field-label">Discipline</span>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
          {DISCIPLINES.map((d) => {
            const on = draft.discipline === d;
            return (
              <button
                type="button"
                key={d}
                onClick={() => set("discipline", d)}
                aria-pressed={on}
                className={`flex flex-col items-center gap-2 rounded-2xl border-2 p-3 text-xs font-semibold transition-all ${on ? "border-orange bg-orangeL text-ink" : "border-line bg-white text-mutedfg hover:border-ink/30"}`}
              >
                <span className={`inline-flex h-10 w-10 items-center justify-center rounded-xl ${on ? "bg-orange text-white" : "bg-muted text-ink"}`}>
                  <DisciplineIcon discipline={d} size={22} />
                </span>
                {DISCIPLINE_LABEL[d]}
              </button>
            );
          })}
        </div>
      </div>

      <div>
        <span className="field-label">Niveau</span>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
          {LEVELS.map((l, i) => {
            const on = draft.level === l;
            return (
              <button
                type="button"
                key={l}
                onClick={() => set("level", l)}
                aria-pressed={on}
                className={`flex items-center gap-2 rounded-xl border-2 px-3 py-2.5 text-xs font-semibold transition-all ${on ? "border-ink bg-ink text-white" : "border-line bg-white text-mutedfg hover:border-ink/30"}`}
              >
                <LevelIcon level={l} size={15} className={on ? "text-orange" : ""} />
                <span className="font-mono">{i + 1}.</span> {LEVEL_LABEL[l]}
              </button>
            );
          })}
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <Field label="Format">
          <select className="field" value={draft.format} onChange={(e) => set("format", e.target.value as Format)}>
            {FORMATS.map((f) => (
              <option key={f} value={f}>
                {FORMAT_LABEL[f]}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Durée (heures)">
          <input required type="number" min={1} className="field" value={draft.durationHours} onChange={(e) => set("durationHours", e.target.value)} />
        </Field>
        <Field label="Prix (FCFA)">
          <input required type="number" min={0} step={500} className="field" value={draft.priceFCFA} onChange={(e) => set("priceFCFA", e.target.value)} />
        </Field>
      </div>

      <Field label="Description">
        <textarea rows={3} className="field" value={draft.description} onChange={(e) => set("description", e.target.value)} />
      </Field>
      <Field label="Prérequis">
        <input className="field" value={draft.prerequisites} onChange={(e) => set("prerequisites", e.target.value)} />
      </Field>
      <Field label="Certification délivrée" hint="Laissez vide pour un intitulé généré automatiquement.">
        <input
          className="field"
          value={draft.certification}
          onChange={(e) => set("certification", e.target.value)}
          placeholder={`Certificat ${LEVEL_LABEL[draft.level]} ${DISCIPLINE_LABEL[draft.discipline]} MADES`}
        />
      </Field>

      {/* Modules du programme, avec aperçu de l'icône attribuée */}
      <div>
        <span className="field-label">Modules du programme</span>
        <ul className="space-y-2">
          {draft.syllabus.map((m, i) => {
            const Icon = moduleIcon(m);
            return (
              <li
                key={i}
                draggable
                onDragStart={() => setDragIdx(i)}
                onDragOver={(e) => e.preventDefault()}
                onDrop={() => {
                  if (dragIdx !== null) moveModule(dragIdx, i);
                  setDragIdx(null);
                }}
                className={`flex items-center gap-2 rounded-2xl border bg-white p-1.5 pr-2 transition-all ${dragIdx === i ? "border-orange opacity-60" : "border-line"}`}
              >
                <span className="cursor-grab px-1 text-mutedfg" title="Glisser pour réordonner">
                  <GripVertical size={16} />
                </span>
                <span className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-orangeL text-orange" title="Icône attribuée automatiquement">
                  <Icon size={17} />
                </span>
                <input
                  className="min-w-0 flex-1 bg-transparent px-1 py-2 text-sm outline-none"
                  value={m}
                  placeholder={`Module ${i + 1}`}
                  onChange={(e) => {
                    const s = [...draft.syllabus];
                    s[i] = e.target.value;
                    set("syllabus", s);
                  }}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      const s = [...draft.syllabus];
                      s.splice(i + 1, 0, "");
                      set("syllabus", s);
                    }
                  }}
                />
                <button
                  type="button"
                  onClick={() => set("syllabus", draft.syllabus.length > 1 ? draft.syllabus.filter((_, j) => j !== i) : [""])}
                  className="rounded-lg p-2 text-mutedfg transition-colors hover:bg-danger/10 hover:text-danger"
                  aria-label="Retirer le module"
                >
                  <Trash2 size={15} />
                </button>
              </li>
            );
          })}
        </ul>
        <button
          type="button"
          onClick={() => set("syllabus", [...draft.syllabus, ""])}
          className="mt-2 inline-flex items-center gap-1.5 rounded-full border border-dashed border-ink/25 px-4 py-2 text-xs font-semibold text-mutedfg transition-colors hover:border-orange hover:text-orange"
        >
          <Plus size={14} /> Ajouter un module
        </button>
        <p className="mt-2 text-xs text-mutedfg">Astuce : Entrée ajoute un module, glisser-déposer pour réordonner. L&rsquo;icône s&rsquo;adapte au thème.</p>
      </div>
    </form>
  );
}
