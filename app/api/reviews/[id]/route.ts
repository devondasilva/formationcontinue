import { NextRequest, NextResponse } from "next/server";
import { deleteReview } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function DELETE(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  const admin = await requireAdmin();
  if (!admin) {
    return NextResponse.json({ error: "Accès administrateur requis." }, { status: 401 });
  }
  const ok = deleteReview(params.id);
  if (!ok) {
    return NextResponse.json({ error: "Avis introuvable." }, { status: 404 });
  }
  return NextResponse.json({ ok: true });
}
