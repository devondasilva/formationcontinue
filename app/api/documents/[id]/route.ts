import { NextRequest, NextResponse } from "next/server";
import { deleteDocument, updateDocument } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";
import { DISCIPLINES } from "@/lib/labels";
import type { Discipline } from "@/lib/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** Renommer une fiche ou changer son module (admin). */
export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  if (!(await requireAdmin())) return NextResponse.json({ error: "Accès administrateur requis." }, { status: 401 });
  const body = (await req.json()) as { title?: string; discipline?: string | null };
  const patch: { title?: string; discipline?: Discipline } = {};
  if (typeof body.title === "string") {
    const t = body.title.trim().slice(0, 140);
    if (!t) return NextResponse.json({ error: "Le titre ne peut pas être vide." }, { status: 400 });
    patch.title = t;
  }
  if (body.discipline !== undefined) {
    patch.discipline = (DISCIPLINES as string[]).includes(body.discipline ?? "") ? (body.discipline as Discipline) : undefined;
  }
  const document = updateDocument(params.id, patch);
  if (!document) return NextResponse.json({ error: "Fiche introuvable." }, { status: 404 });
  return NextResponse.json({ document });
}

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  if (!(await requireAdmin())) return NextResponse.json({ error: "Accès administrateur requis." }, { status: 401 });
  if (!deleteDocument(params.id)) return NextResponse.json({ error: "Fiche introuvable." }, { status: 404 });
  return NextResponse.json({ ok: true });
}
