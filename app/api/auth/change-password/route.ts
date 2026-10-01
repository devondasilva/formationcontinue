import { NextRequest, NextResponse } from "next/server";
import { changeAdminPassword } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "Accès administrateur requis." }, { status: 401 });
  const { current, next } = (await req.json()) as { current?: string; next?: string };
  if (!current || !next) return NextResponse.json({ error: "Mot de passe actuel et nouveau requis." }, { status: 400 });
  if (next.length < 8) return NextResponse.json({ error: "Le nouveau mot de passe doit contenir au moins 8 caractères." }, { status: 400 });
  const result = changeAdminPassword(admin.id, current, next);
  if (result === "bad-current") return NextResponse.json({ error: "Mot de passe actuel incorrect." }, { status: 400 });
  if (result === "not-found") return NextResponse.json({ error: "Compte introuvable." }, { status: 404 });
  return NextResponse.json({ ok: true });
}
