/** Formats de fiches techniques acceptés (extension → type MIME), partagés client / serveur. */
export const DOC_TYPES: Record<string, string> = {
  pdf: "application/pdf",
  doc: "application/msword",
  docx: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  xls: "application/vnd.ms-excel",
  xlsx: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  ppt: "application/vnd.ms-powerpoint",
  pptx: "application/vnd.openxmlformats-officedocument.presentationml.presentation",
  odt: "application/vnd.oasis.opendocument.text",
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  png: "image/png",
  webp: "image/webp",
};

export const DOC_ACCEPT = Object.keys(DOC_TYPES).map((e) => `.${e}`).join(",");
export const DOC_MAX_BYTES = 25 * 1024 * 1024; // 25 Mo

export function extOf(name: string): string {
  return (name.split(".").pop() ?? "").toLowerCase();
}

export type DocKind = "pdf" | "word" | "excel" | "slides" | "image" | "file";

export function docKind(name: string): DocKind {
  const e = extOf(name);
  if (e === "pdf") return "pdf";
  if (["doc", "docx", "odt"].includes(e)) return "word";
  if (["xls", "xlsx"].includes(e)) return "excel";
  if (["ppt", "pptx"].includes(e)) return "slides";
  if (["jpg", "jpeg", "png", "webp"].includes(e)) return "image";
  return "file";
}

export const DOC_KIND_LABEL: Record<DocKind, string> = {
  pdf: "PDF",
  word: "Word",
  excel: "Excel",
  slides: "PowerPoint",
  image: "Image",
  file: "Fichier",
};

/** 1 234 567 → « 1,2 Mo ». */
export function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} o`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} Ko`;
  return `${(bytes / (1024 * 1024)).toLocaleString("fr-FR", { maximumFractionDigits: 1 })} Mo`;
}

/** Titre lisible à partir d'un nom de fichier : « fiche_JES-1.pdf » → « Fiche JES 1 ». */
export function titleFromFile(name: string): string {
  const base = name.replace(/\.[^.]+$/, "").replace(/[_-]+/g, " ").replace(/\s+/g, " ").trim();
  return base ? base.charAt(0).toUpperCase() + base.slice(1) : "Fiche technique";
}
