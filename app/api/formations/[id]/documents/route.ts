import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import { createDocument, getDocumentsByFormation, getFormationById, DOCS_DIR } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";
import { DISCIPLINES } from "@/lib/labels";
import { DOC_MAX_BYTES, DOC_TYPES, extOf, titleFromFile } from "@/lib/documents";
import type { Discipline } from "@/lib/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** Liste publique des fiches techniques d'une formation. */
export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  if (!getFormationById(params.id)) return NextResponse.json({ error: "Formation introuvable." }, { status: 404 });
  return NextResponse.json({ documents: getDocumentsByFormation(params.id) });
}

/** Téléversement (admin) d'une fiche technique : champs `file`, `title` (facultatif), `discipline` (facultatif). */
export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  if (!(await requireAdmin())) return NextResponse.json({ error: "Accès administrateur requis." }, { status: 401 });
  if (!getFormationById(params.id)) return NextResponse.json({ error: "Formation introuvable." }, { status: 404 });

  const form = await req.formData();
  const file = form.get("file");
  if (!(file instanceof File)) return NextResponse.json({ error: "Aucun fichier reçu." }, { status: 400 });
  const ext = extOf(file.name);
  if (!DOC_TYPES[ext]) {
    return NextResponse.json({ error: "Format accepté : PDF, Word, Excel, PowerPoint, JPG, PNG, WebP." }, { status: 400 });
  }
  if (file.size > DOC_MAX_BYTES) return NextResponse.json({ error: "Fichier trop lourd (25 Mo maximum)." }, { status: 400 });

  const title = String(form.get("title") ?? "").trim().slice(0, 140) || titleFromFile(file.name);
  const d = String(form.get("discipline") ?? "");
  const discipline = (DISCIPLINES as string[]).includes(d) ? (d as Discipline) : undefined;

  fs.mkdirSync(DOCS_DIR, { recursive: true });
  const fileName = `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
  fs.writeFileSync(path.join(DOCS_DIR, fileName), Buffer.from(await file.arrayBuffer()));

  const document = createDocument({
    formationId: params.id,
    title,
    ...(discipline ? { discipline } : {}),
    fileName,
    originalName: file.name.slice(0, 200),
    mimeType: DOC_TYPES[ext],
    size: file.size,
  });
  return NextResponse.json({ document });
}
