"use client";

import { useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { UploadCloud, Loader2, Trash2, Download, Eye, FolderOpen, AlertTriangle } from "lucide-react";
import type { Discipline, FormationDocument } from "@/lib/types";
import { DISCIPLINES, DISCIPLINE_LABEL } from "@/lib/labels";
import { DOC_ACCEPT, DOC_MAX_BYTES, docKind, extOf, DOC_TYPES, formatSize } from "@/lib/documents";
import DocIcon from "@/components/DocIcon";
import { DisciplineIcon } from "@/components/icons/DisciplineIcon";
import { useAdmin } from "../_lib/AdminContext";
import { ConfirmDialog, IconAction } from "./kit";

interface Pending {
  key: string;
  name: string;
  progress: number;
  error?: string;
}

/**
 * Gestion des fiches techniques d'une formation : dépôt multiple par glisser-déposer
 * (avec progression), renommage, rattachement à un module, aperçu et suppression.
 */
export default function DocumentsManager({ formationId, documents }: { formationId: string; documents: FormationDocument[] }) {
  const { mutate, refresh, notify } = useAdmin();
  const input = useRef<HTMLInputElement>(null);
  const [drag, setDrag] = useState(false);
  const [pending, setPending] = useState<Pending[]>([]);
  const [module, setModule] = useState<Discipline | "">("");
  const [toDelete, setToDelete] = useState<FormationDocument | null>(null);

  function uploadOne(file: File) {
    const key = `${file.name}-${Math.random()}`;
    const fail = (error: string) => setPending((p) => p.map((x) => (x.key === key ? { ...x, error } : x)));
    setPending((p) => [...p, { key, name: file.name, progress: 0 }]);
    if (!DOC_TYPES[extOf(file.name)]) return fail("Format non accepté");
    if (file.size > DOC_MAX_BYTES) return fail("Plus de 25 Mo");

    const fd = new FormData();
    fd.append("file", file);
    if (module) fd.append("discipline", module);
    const xhr = new XMLHttpRequest();
    xhr.open("POST", `/api/formations/${formationId}/documents`);
    xhr.upload.onprogress = (e) =>
      e.lengthComputable && setPending((p) => p.map((x) => (x.key === key ? { ...x, progress: Math.round((e.loaded / e.total) * 100) } : x)));
    xhr.onload = async () => {
      if (xhr.status >= 400) {
        let msg = "Échec de l'envoi";
        try {
          msg = JSON.parse(xhr.responseText).error ?? msg;
        } catch {}
        return fail(msg);
      }
      setPending((p) => p.filter((x) => x.key !== key));
      await refresh();
      notify(`« ${file.name} » ajouté`);
    };
    xhr.onerror = () => fail("Connexion interrompue");
    xhr.send(fd);
  }

  const handleFiles = (files: FileList | null) => files && Array.from(files).forEach(uploadOne);

  return (
    <div className="space-y-5">
      {/* Module par défaut pour les prochains dépôts */}
      <div>
        <span className="field-label">Rattacher les prochains fichiers à</span>
        <div className="flex flex-wrap gap-1.5">
          {(["", ...DISCIPLINES] as const).map((d) => {
            const on = module === d;
            return (
              <button
                key={d || "general"}
                type="button"
                onClick={() => setModule(d)}
                aria-pressed={on}
                className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-semibold transition-colors ${
                  on ? "border-ink bg-ink text-white" : "border-line bg-white text-mutedfg hover:border-ink/30 hover:text-ink"
                }`}
              >
                {d && <DisciplineIcon discipline={d} size={13} />}
                {d ? DISCIPLINE_LABEL[d] : "Tout le niveau"}
              </button>
            );
          })}
        </div>
      </div>

      {/* Zone de dépôt */}
      <button
        type="button"
        onClick={() => input.current?.click()}
        onDragOver={(e) => {
          e.preventDefault();
          setDrag(true);
        }}
        onDragLeave={() => setDrag(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDrag(false);
          handleFiles(e.dataTransfer.files);
        }}
        className={`group flex w-full flex-col items-center gap-2 rounded-2xl border-2 border-dashed px-6 py-8 text-center transition-all ${
          drag ? "scale-[1.01] border-orange bg-orangeL" : "border-ink/15 bg-white hover:border-orange"
        }`}
      >
        <span className={`inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-orange text-white transition-transform duration-300 ${drag ? "-translate-y-1 scale-110" : "group-hover:-translate-y-0.5"}`}>
          <UploadCloud size={22} />
        </span>
        <span className="text-sm font-semibold">{drag ? "Déposez pour envoyer" : "Ajouter des fiches techniques"}</span>
        <span className="text-xs text-mutedfg">Glisser-déposer ou cliquer · plusieurs fichiers possibles · PDF, Word, Excel, PowerPoint, images · 25 Mo max</span>
      </button>
      <input
        ref={input}
        type="file"
        multiple
        accept={DOC_ACCEPT}
        className="hidden"
        onChange={(e) => {
          handleFiles(e.target.files);
          e.target.value = "";
        }}
      />

      {/* Envois en cours */}
      <AnimatePresence initial={false}>
        {pending.map((p) => (
          <motion.div
            key={p.key}
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className={`relative overflow-hidden rounded-xl border px-3 py-2.5 text-xs ${p.error ? "border-danger/30 bg-danger/5" : "border-line bg-white"}`}
          >
            {!p.error && <span className="absolute inset-y-0 left-0 bg-orangeL transition-[width]" style={{ width: `${p.progress}%` }} />}
            <span className="relative flex items-center gap-2">
              {p.error ? <AlertTriangle size={14} className="text-danger" /> : <Loader2 size={14} className="animate-spin text-orange" />}
              <span className="min-w-0 flex-1 truncate font-semibold">{p.name}</span>
              {p.error ? (
                <>
                  <span className="text-danger">{p.error}</span>
                  <button type="button" onClick={() => setPending((x) => x.filter((y) => y.key !== p.key))} className="font-semibold text-mutedfg hover:text-ink">
                    OK
                  </button>
                </>
              ) : (
                <span className="font-mono text-mutedfg">{p.progress} %</span>
              )}
            </span>
          </motion.div>
        ))}
      </AnimatePresence>

      {/* Fiches déjà publiées */}
      <div>
        <p className="mb-2 font-mono text-[11px] uppercase tracking-[0.16em] text-mutedfg">
          {documents.length} fiche{documents.length > 1 ? "s" : ""} en ligne
        </p>
        {documents.length === 0 ? (
          <div className="flex flex-col items-center rounded-2xl bg-muted/50 px-4 py-8 text-center">
            <FolderOpen size={26} className="text-mutedfg" />
            <p className="mt-2 text-sm text-mutedfg">Aucune fiche pour l&rsquo;instant. Les fichiers ajoutés apparaissent aussitôt sur la page publique de la formation.</p>
          </div>
        ) : (
          <ul className="space-y-2">
            <AnimatePresence initial={false}>
              {documents.map((d) => (
                <motion.li
                  key={d.id}
                  layout
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, x: 30 }}
                  className="flex items-center gap-3 rounded-2xl border border-line bg-white p-3"
                >
                  <DocIcon name={d.fileName} size="sm" />
                  <div className="min-w-0 flex-1">
                    <input
                      defaultValue={d.title}
                      aria-label="Titre de la fiche"
                      className="w-full rounded-lg bg-transparent px-1.5 py-1 text-sm font-semibold outline-none transition-colors hover:bg-muted focus:bg-muted"
                      onBlur={(e) => {
                        const t = e.target.value.trim();
                        if (t && t !== d.title) mutate(`/api/documents/${d.id}`, { method: "PATCH", json: { title: t } }, "Titre mis à jour");
                        else e.target.value = d.title;
                      }}
                      onKeyDown={(e) => e.key === "Enter" && (e.target as HTMLInputElement).blur()}
                    />
                    <div className="mt-0.5 flex flex-wrap items-center gap-2 px-1.5 text-[11px] text-mutedfg">
                      <span className="font-mono uppercase">{docKind(d.fileName)}</span>
                      <span className="font-mono">{formatSize(d.size)}</span>
                      <select
                        value={d.discipline ?? ""}
                        onChange={(e) => mutate(`/api/documents/${d.id}`, { method: "PATCH", json: { discipline: e.target.value || null } }, "Module mis à jour")}
                        className="rounded-md bg-muted px-1.5 py-0.5 text-[11px] font-semibold text-ink outline-none"
                        aria-label="Module"
                      >
                        <option value="">Tout le niveau</option>
                        {DISCIPLINES.map((x) => (
                          <option key={x} value={x}>
                            {DISCIPLINE_LABEL[x]}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                  <div className="flex gap-1">
                    <IconAction icon={Eye} label="Aperçu" newTab href={`/api/documents/${d.id}/download?view=1`} />
                    <IconAction icon={Download} label="Télécharger" href={`/api/documents/${d.id}/download`} />
                    <IconAction
                      icon={Trash2}
                      label="Supprimer"
                      tone="danger"
                      onClick={() => setToDelete(d)}
                    />
                  </div>
                </motion.li>
              ))}
            </AnimatePresence>
          </ul>
        )}
      </div>

      <ConfirmDialog
        open={!!toDelete}
        title="Supprimer la fiche ?"
        text={`« ${toDelete?.title} » ne sera plus téléchargeable par les candidats. Le fichier est supprimé définitivement.`}
        onClose={() => setToDelete(null)}
        onConfirm={async () => {
          if (toDelete) await mutate(`/api/documents/${toDelete.id}`, { method: "DELETE" }, "Fiche supprimée");
        }}
      />
    </div>
  );
}
