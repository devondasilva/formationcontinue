"use client";

import { motion } from "framer-motion";
import { Download, Eye } from "lucide-react";
import type { FormationDocument } from "@/lib/types";
import { DISCIPLINE_LABEL } from "@/lib/labels";
import { DOC_KIND_LABEL, docKind, formatSize } from "@/lib/documents";
import DocIcon from "./DocIcon";
import { DisciplineIcon } from "./icons/DisciplineIcon";

/** Fiches techniques téléchargeables d'une formation (page publique). */
export default function DocumentList({ documents }: { documents: FormationDocument[] }) {
  return (
    <ul className="grid gap-3">
      {documents.map((d, i) => {
        const kind = docKind(d.fileName);
        const previewable = kind === "pdf" || kind === "image";
        return (
          <motion.li
            key={d.id}
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-40px" }}
            transition={{ delay: Math.min(i, 6) * 0.06, duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
            className="group relative flex items-center gap-4 overflow-hidden rounded-2xl border border-line bg-white p-4 transition-all duration-300 hover:-translate-y-0.5 hover:border-orange hover:shadow-lift"
          >
            <a href={`/api/documents/${d.id}/download`} className="absolute inset-0" aria-label={`Télécharger ${d.title}`} />
            <span className="transition-transform duration-500 group-hover:-rotate-6">
              <DocIcon name={d.fileName} />
            </span>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold" title={d.title}>
                {d.title}
              </p>
              <p className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-[11px] text-mutedfg">
                <span className="font-mono">
                  {DOC_KIND_LABEL[kind]} · {formatSize(d.size)}
                </span>
                {d.discipline && (
                  <span className="inline-flex items-center gap-1 rounded-full bg-orangeL px-2 py-0.5 font-semibold text-orangeD">
                    <DisciplineIcon discipline={d.discipline} size={11} /> {DISCIPLINE_LABEL[d.discipline]}
                  </span>
                )}
              </p>
            </div>
            {previewable && (
              <a
                href={`/api/documents/${d.id}/download?view=1`}
                target="_blank"
                rel="noopener noreferrer"
                className="relative z-10 hidden h-10 w-10 items-center justify-center rounded-full border border-line text-mutedfg transition-colors hover:border-ink hover:text-ink sm:inline-flex"
                aria-label={`Aperçu de ${d.title}`}
                title="Aperçu"
              >
                <Eye size={16} />
              </a>
            )}
            <span className="relative inline-flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-full bg-ink text-white transition-colors duration-300 group-hover:bg-orange">
              <Download size={16} className="transition-transform duration-500 group-hover:translate-y-8" />
              <Download size={16} className="absolute -translate-y-8 transition-transform duration-500 group-hover:translate-y-0" />
            </span>
          </motion.li>
        );
      })}
    </ul>
  );
}
