import { NextRequest, NextResponse } from "next/server";
import { getFormations, createFormation } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";
import { Discipline, Format, Level } from "@/lib/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const formations = getFormations();
  return NextResponse.json({ formations });
}

export async function POST(req: NextRequest) {
  const admin = await requireAdmin();
  if (!admin) {
    return NextResponse.json({ error: "Accès administrateur requis." }, { status: 401 });
  }
  const body = await req.json();
  const {
    title, discipline, level, format, description, durationHours,
    prerequisites, certification, syllabus, priceFCFA,
  } = body as {
    title: string; discipline: Discipline; level: Level; format: Format;
    description: string; durationHours: number; prerequisites: string;
    certification: string; syllabus: string[]; priceFCFA: number;
  };

  if (!title || !discipline || !level || !format || !durationHours || !priceFCFA) {
    return NextResponse.json({ error: "Titre, discipline, niveau, format, durée et prix sont requis." }, { status: 400 });
  }

  const formation = createFormation({
    title, discipline, level, format,
    description: description ?? "",
    durationHours,
    prerequisites: prerequisites ?? "",
    certification: certification ?? "",
    syllabus: syllabus ?? [],
    priceFCFA,
    active: true,
  });
  return NextResponse.json({ formation });
}
