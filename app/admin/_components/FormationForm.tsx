"use client";

import { useState } from "react";
import { Plus, Trash2, GripVertical, Check, Handshake, Clock } from "lucide-react";
import type { Discipline, Format, FormationModule, Level } from "@/lib/types";
import { DISCIPLINES, DISCIPLINE_LABEL, FORMATS, FORMAT_LABEL, LEVELS, LEVEL_LABEL, LEVEL_SUB } from "@/lib/labels";
import { DisciplineIcon, LevelIcon, moduleIcon } from "@/components/icons/DisciplineIcon";
import { Field } from "@/components/ui/primitives";
import type { AdminFormation } from "../_lib/types";

interface ModuleDraft {
  on: boolean;
  hours: string;
  topics: string;
}

export interface FormationDraft {
  title: string;
  level: Level;
  format: Format;
  description: string;
  durationHours: string;
  prerequisites: string;
  certification: string;
  partners: string;
  modules: Record<Discipline, ModuleDraft>;
  syllabus: string[];
  priceFCFA: string;
}

const allModules = (on: boolean): Record<Discipline, ModuleDraft> =>
  Object.fromEntries(DISCIPLINES.map((d) => [d, { on, hours: "", topics: "" }])) as Record<Discipline, ModuleDraft>;

export const emptyDraft: FormationDraft = {
  title: "",
  level: "jes1",
  format: "presentiel",
  description: "",
  durationHours: "",
  prerequisites: "",
  certification: "",
  partners: "",
  modules: allModules(true),
  syllabus: [""],
  priceFCFA: "",
};

export function draftFrom(f: AdminFormation): FormationDraft {
  const modules = allModules(false);
  for (const m of f.modules) modules[m.discipline] = { on: true, hours: m.hours ? String(m.hours) : "", topics: m.topics.join("\n") };
  return {
    title: f.title,
    level: f.level,
    format: f.format,
    description: f.description,
    durationHours: String(f.durationHours),
    prerequisites: f.prerequisites,
    certification: f.certification,
    partners: f.partners ?? "",
    modules,
    syllabus: f.syllabus.length ? [...f.syllabus] : [""],
    priceFCFA: String(f.priceFCFA),
  };
}

export function draftToPayload(d: FormationDraft) {
  const modules: FormationModule[] = DISCIPLINES.filter((x) => d.modules[x].on).map((x) => ({
    discipline: x,
    hours: Number(d.modules[x].hours) || 0,
    topics: d.modules[x].topics.split("\n").map((t) => t.trim()).filter(Boolean),
  }));
  return {
    title: d.title,
    level: d.level,
    format: d.format,
    description: d.description,
    prerequisites: d.prerequisites,
    durationHours: Number(d.durationHours),
    priceFCFA: Number(d.priceFCFA),
    modules,
    partners: d.partners.trim(),
    syllabus: d.syllabus.map((s) => s.trim()).filter(Boolean),
    certification: d.certification || `Certificat ${LEVEL_LABEL[d.level]} — MADES`,
  };
}

/** Formulaire d'un niveau de formation : niveau, modules sportifs (icônes), tronc commun, partenariat. */
export default function FormationForm({ draft, onChange, id }: { draft: FormationDraft; onChange: (d: FormationDraft) => void; id: string }) {
  const set = <K extends keyof FormationDraft>(k: K, v: FormationDraft[K]) => onChange({ ...draft, [k]: v });
  const [dragIdx, setDragIdx] = useState<number | null>(null);
  const moduleHours = DISCIPLINES.reduce((t, d) => t + (draft.modules[d].on ? Number(draft.modules[d].hours) || 0 : 0), 0);

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
        <input required className="field" value={draft.title} onChange={(e) => set("title", e.target.value)} placeholder="Ex. JES Niveau 1" />
      </Field>

      <div>
        <span className="field-label">Niveau</span>
        <div className="grid grid-cols-2 gap-2">
          {LEVELS.map((l, i) => {
            const on = draft.level === l;
            return (
              <button
                type="button"
                key={l}
                onClick={() => onChange({ ...draft, level: l, title: draft.title || LEVEL_LABEL[l] })}
                aria-pressed={on}
                className={`flex items-center gap-3 rounded-2xl border-2 p-3 text-left transition-all ${on ? "border-ink bg-ink text-white" : "border-line bg-white text-ink hover:border-ink/30"}`}
              >
                <span className={`inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${on ? "bg-orange text-white" : "bg-muted"}`}>
                  <LevelIcon level={l} size={19} />
                </span>
                <span className="min-w-0">
                  <span className="block text-sm font-semibold leading-tight">
                    <span className="font-mono text-xs opacity-60">{i + 1}.</span> {LEVEL_LABEL[l]}
                  </span>
                  <span className={`block font-mono text-[10px] uppercase tracking-wider ${on ? "text-white/60" : "text-mutedfg"}`}>{LEVEL_SUB[l]}</span>
                </span>
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
          placeholder={`Certificat ${LEVEL_LABEL[draft.level]} — MADES`}
        />
      </Field>
      <Field
        label="Mention de partenariat"
        hint={draft.level === "de" ? "Affichée sur la fiche du Diplôme d'État et sur le certificat." : "Facultatif — utile surtout pour le Diplôme d'État."}
      >
        <span className="relative block">
          <Handshake size={16} className="pointer-events-none absolute left-4 top-3.5 text-orange" />
          <textarea
            rows={2}
            className="field pl-11"
            value={draft.partners}
            onChange={(e) => set("partners", e.target.value)}
            placeholder="Ex. Formation délivrée en partenariat avec …"
          />
        </span>
      </Field>

      {/* Modules sportifs du niveau */}
      <div>
        <div className="mb-1.5 flex items-baseline justify-between gap-3">
          <span className="field-label mb-0">Modules sportifs</span>
          {moduleHours > 0 && (
            <button
              type="button"
              onClick={() => set("durationHours", String(moduleHours))}
              className="inline-flex items-center gap-1 text-[11px] font-semibold text-orange hover:underline"
              title="Reporter la somme dans la durée totale"
            >
              <Clock size={12} /> Total modules : {moduleHours} h — utiliser
            </button>
          )}
        </div>
        <ul className="space-y-2">
          {DISCIPLINES.map((d) => {
            const m = draft.modules[d];
            const setM = (patch: Partial<ModuleDraft>) => set("modules", { ...draft.modules, [d]: { ...m, ...patch } });
            return (
              <li key={d} className={`overflow-hidden rounded-2xl border-2 transition-colors ${m.on ? "border-orange/60 bg-white" : "border-line bg-muted/40"}`}>
                <div className="flex items-center gap-3 p-2.5">
                  <button
                    type="button"
                    onClick={() => setM({ on: !m.on })}
                    aria-pressed={m.on}
                    className="flex flex-1 items-center gap-3 text-left"
                  >
                    <span className={`inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl transition-colors ${m.on ? "bg-orange text-white" : "bg-white text-mutedfg"}`}>
                      <DisciplineIcon discipline={d} size={21} />
                    </span>
                    <span className={`text-sm font-semibold ${m.on ? "" : "text-mutedfg"}`}>{DISCIPLINE_LABEL[d]}</span>
                    <span className={`ml-auto inline-flex h-6 w-6 items-center justify-center rounded-full border-2 ${m.on ? "border-orange bg-orange text-white" : "border-line bg-white"}`}>
                      {m.on && <Check size={13} strokeWidth={3} />}
                    </span>
                  </button>
                  {m.on && (
                    <label className="flex items-center gap-1.5">
                      <input
                        type="number"
                        min={0}
                        className="field w-20 px-3 py-2 text-right"
                        value={m.hours}
                        onChange={(e) => setM({ hours: e.target.value })}
                        aria-label={`Heures — ${DISCIPLINE_LABEL[d]}`}
                        placeholder="0"
                      />
                      <span className="text-xs text-mutedfg">h</span>
                    </label>
                  )}
                </div>
                {m.on && (
                  <div className="border-t border-line px-3 pb-3 pt-2">
                    <textarea
                      rows={3}
                      className="field text-xs"
                      value={m.topics}
                      onChange={(e) => setM({ topics: e.target.value })}
                      placeholder={"Contenus du module, un par ligne\nEx. Règles, terrain et matériel"}
                      aria-label={`Contenus — ${DISCIPLINE_LABEL[d]}`}
                    />
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      </div>

      {/* Modules du programme, avec aperçu de l'icône attribuée */}
      <div>
        <span className="field-label">Tronc commun (contenus transversaux)</span>
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
                  placeholder={`Contenu ${i + 1}`}
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
                  aria-label="Retirer ce contenu"
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
          <Plus size={14} /> Ajouter un contenu
        </button>
        <p className="mt-2 text-xs text-mutedfg">Astuce : Entrée ajoute une ligne, glisser-déposer pour réordonner. L&rsquo;icône s&rsquo;adapte au thème.</p>
      </div>
    </form>
  );
}
