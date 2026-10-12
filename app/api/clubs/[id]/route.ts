import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { deleteClub, updateClub } from "@/lib/network";
import { bad, deny, notFound, parseClub } from "@/lib/guard";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  if (!(await requireAdmin())) return deny("Accès administrateur requis.", 401);
  const body = await req.json().catch(() => ({}));
  const data = parseClub(body);
  // Patch partiel : ne garde que les champs envoyés.
  const patch = Object.fromEntries(Object.entries(data).filter(([k]) => k in body));
  if ("name" in patch && !patch.name) return bad("Le nom du club est requis.");
  const club = updateClub(params.id, patch);
  return club ? NextResponse.json({ club }) : notFound("Club introuvable.");
}

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  if (!(await requireAdmin())) return deny("Accès administrateur requis.", 401);
  const r = deleteClub(params.id);
  if (r === "not-found") return notFound("Club introuvable.");
  if (r === "in-use") return bad("Ce club a encore du matériel, des coachs ou des alternances. Transférez-les ou passez le club en « Suspendu ».");
  return NextResponse.json({ ok: true });
}
