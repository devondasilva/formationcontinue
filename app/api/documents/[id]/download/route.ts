import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import { getDocumentById, DOCS_DIR } from "@/lib/db";
import { extOf } from "@/lib/documents";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** Téléchargement public d'une fiche technique, sous un nom de fichier lisible. */
export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const doc = getDocumentById(params.id);
  const file = doc ? path.join(DOCS_DIR, path.basename(doc.fileName)) : "";
  if (!doc || !fs.existsSync(file)) return NextResponse.json({ error: "Fiche introuvable." }, { status: 404 });

  const ext = extOf(doc.fileName);
  const safe = `${doc.title.replace(/[\\/:*?"<>|]+/g, "-").slice(0, 100)}.${ext}`;
  const ascii = safe.normalize("NFD").replace(/[^\x20-\x7e]/g, "").replace(/"/g, "") || `fiche.${ext}`;
  // ?view=1 ouvre le document dans le navigateur (aperçu PDF / image) au lieu de le télécharger.
  const inline = req.nextUrl.searchParams.get("view") === "1";
  return new NextResponse(new Uint8Array(fs.readFileSync(file)), {
    headers: {
      "Content-Type": doc.mimeType,
      "Content-Length": String(fs.statSync(file).size),
      "Content-Disposition": `${inline ? "inline" : "attachment"}; filename="${ascii}"; filename*=UTF-8''${encodeURIComponent(safe)}`,
      "Cache-Control": "private, max-age=0, must-revalidate",
    },
  });
}
