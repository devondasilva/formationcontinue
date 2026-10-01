import { NextRequest, NextResponse } from "next/server";
import { deleteAdmin } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "Accès administrateur requis." }, { status: 401 });
  if (admin.id === params.id) {
    return NextResponse.json({ error: "Vous ne pouvez pas supprimer votre propre compte." }, { status: 400 });
  }
  if (!deleteAdmin(params.id)) {
    return NextResponse.json({ error: "Compte introuvable ou dernier administrateur." }, { status: 400 });
  }
  return NextResponse.json({ ok: true });
}
