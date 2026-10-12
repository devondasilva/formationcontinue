import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { reviewInventory } from "@/lib/network";
import { actorOf, bad, deny, notFound, str } from "@/lib/guard";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** Validation (ou demande de reprise) d'un inventaire par l'administration. */
export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const s = await requireAdmin();
  if (!s) return deny("Accès administrateur requis.", 401);
  const b = await req.json().catch(() => ({}));
  if (b.status !== "valide" && b.status !== "a_revoir") return bad("Statut invalide.");
  const inv = reviewInventory(params.id, b.status, actorOf(s), str(b.comment, 1000));
  return inv ? NextResponse.json({ inventory: inv }) : notFound("Inventaire introuvable.");
}
