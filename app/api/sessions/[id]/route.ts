import { NextRequest, NextResponse } from "next/server";
import { updateSession, deleteSession } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const admin = await requireAdmin();
  if (!admin) {
    return NextResponse.json({ error: "Accès administrateur requis." }, { status: 401 });
  }
  const patch = await req.json();
  const session = updateSession(params.id, patch);
  if (!session) {
    return NextResponse.json({ error: "Session introuvable." }, { status: 404 });
  }
  return NextResponse.json({ session });
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  const admin = await requireAdmin();
  if (!admin) {
    return NextResponse.json({ error: "Accès administrateur requis." }, { status: 401 });
  }
  const ok = deleteSession(params.id);
  if (!ok) {
    return NextResponse.json({ error: "Session introuvable." }, { status: 404 });
  }
  return NextResponse.json({ ok: true });
}
