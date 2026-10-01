import { NextRequest, NextResponse } from "next/server";
import {
  getFormationById, updateFormation, deleteFormation,
  getSessionsByFormation, getEnrolledCount, getReviewsByFormation, getFormationRating,
} from "@/lib/db";
import { requireAdmin } from "@/lib/auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  const formation = getFormationById(params.id);
  if (!formation) {
    return NextResponse.json({ error: "Formation introuvable." }, { status: 404 });
  }
  const sessions = getSessionsByFormation(formation.id).map((s) => ({
    ...s,
    enrolledCount: getEnrolledCount(s.id),
  }));
  const reviews = getReviewsByFormation(formation.id);
  const rating = getFormationRating(formation.id);
  return NextResponse.json({ formation, sessions, reviews, rating });
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const admin = await requireAdmin();
  if (!admin) {
    return NextResponse.json({ error: "Accès administrateur requis." }, { status: 401 });
  }
  const patch = await req.json();
  const formation = updateFormation(params.id, patch);
  if (!formation) {
    return NextResponse.json({ error: "Formation introuvable." }, { status: 404 });
  }
  return NextResponse.json({ formation });
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  const admin = await requireAdmin();
  if (!admin) {
    return NextResponse.json({ error: "Accès administrateur requis." }, { status: 401 });
  }
  const ok = deleteFormation(params.id);
  if (!ok) {
    return NextResponse.json({ error: "Formation introuvable." }, { status: 404 });
  }
  return NextResponse.json({ ok: true });
}
