import { NextRequest, NextResponse } from "next/server";
import { requireCoach } from "@/lib/auth";
import { changeCoachPassword } from "@/lib/network";
import { bad, deny } from "@/lib/guard";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  const s = await requireCoach();
  if (!s) return deny("Connexion coach requise.", 401);
  const { current, next } = (await req.json().catch(() => ({}))) as { current?: string; next?: string };
  if (!current || !next) return bad("Mot de passe actuel et nouveau requis.");
  if (next.length < 8) return bad("Le nouveau mot de passe doit faire au moins 8 caractères.");
  const r = changeCoachPassword(s.id, current, next);
  if (r === "bad-current") return bad("Mot de passe actuel incorrect.");
  if (r === "not-found") return deny("Compte introuvable.", 404);
  return NextResponse.json({ ok: true });
}
