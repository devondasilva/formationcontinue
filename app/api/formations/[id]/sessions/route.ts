import { NextRequest, NextResponse } from "next/server";
import { createSession, getFormationById } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const admin = await requireAdmin();
  if (!admin) {
    return NextResponse.json({ error: "Accès administrateur requis." }, { status: 401 });
  }
  const formation = getFormationById(params.id);
  if (!formation) {
    return NextResponse.json({ error: "Formation introuvable." }, { status: 404 });
  }
  const body = await req.json();
  const { startDate, endDate, location, instructor, capacity } = body as {
    startDate: string; endDate: string; location: string; instructor: string; capacity: number;
  };
  if (!startDate || !endDate || !location || !capacity) {
    return NextResponse.json({ error: "Dates, lieu et capacité sont requis." }, { status: 400 });
  }
  const session = createSession({
    formationId: formation.id,
    formationTitle: formation.title,
    startDate, endDate, location,
    instructor: instructor ?? "",
    capacity,
    status: "ouverte",
  });
  return NextResponse.json({ session });
}
