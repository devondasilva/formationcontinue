import { FileText, FileType2, FileSpreadsheet, Presentation, ImageIcon, File } from "lucide-react";
import { DOC_KIND_LABEL, docKind, type DocKind } from "@/lib/documents";

const ICON = { pdf: FileText, word: FileType2, excel: FileSpreadsheet, slides: Presentation, image: ImageIcon, file: File };
const TONE: Record<DocKind, string> = {
  pdf: "bg-orange text-white",
  word: "bg-ink text-white",
  excel: "bg-success text-white",
  slides: "bg-orangeD text-white",
  image: "bg-ink2 text-white",
  file: "bg-muted text-ink",
};

/** Pastille d'icône selon le type de fichier, avec l'extension en petit. */
export default function DocIcon({ name, size = "md" }: { name: string; size?: "sm" | "md" | "lg" }) {
  const kind = docKind(name);
  const Icon = ICON[kind];
  const box = { sm: "h-9 w-9 rounded-lg", md: "h-12 w-12 rounded-xl", lg: "h-14 w-14 rounded-2xl" }[size];
  const icon = { sm: 16, md: 21, lg: 24 }[size];
  return (
    <span className={`relative inline-flex shrink-0 items-center justify-center ${box} ${TONE[kind]}`} title={DOC_KIND_LABEL[kind]}>
      <Icon size={icon} strokeWidth={1.9} />
      <span className="absolute -bottom-1.5 -right-1.5 rounded-md bg-white px-1 font-mono text-[8px] font-medium uppercase leading-[14px] text-ink shadow-soft ring-1 ring-line">
        {(name.split(".").pop() ?? "").slice(0, 4)}
      </span>
    </span>
  );
}
