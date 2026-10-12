import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { deleteCoach, getClubById, updateCoach } from "@/lib/network";
import { bad, deny, notFound, str } from "@/lib/guard";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  if (!(await requireAdmin())) return deny("Accès administrateur requis.", 401);
  const b = await req.json().catch(() => ({}));
  const patch: Record<string, unknown> = {};
  for (const k of ["name", "email", "phone", "clubId"] as const) if (k in b) patch[k] = str(b[k], 120);
  for (const k of ["isTutor", "isEquipmentManager", "active"] as const) if (k in b) patch[k] = Boolean(b[k]);
  if ("clubId" in patch && !getClubById(patch.clubId as string)) return bad("Club inconnu.");
  if ("email" in patch && !/^\S+@\S+\.\S+$/.test(patch.email as string)) return bad("Email invalide.");
  const r = updateCoach(params.id, patch);
  if (r === "email-taken") return bad("Un coach utilise déjà cet email.");
  return r ? NextResponse.json({ coach: r }) : notFound("Coach introuvable.");
}

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  if (!(await requireAdmin())) return deny("Accès administrateur requis.", 401);
  return deleteCoach(params.id) ? NextResponse.json({ ok: true }) : notFound("Coach introuvable.");
}
