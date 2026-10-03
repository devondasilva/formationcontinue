import { NextRequest, NextResponse } from "next/server";
import { getFormations, createFormation } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";
import { Format, FormationModule, Level } from "@/lib/types";
import { DISCIPLINES, LEVELS } from "@/lib/labels";

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
    title, level, format, description, durationHours,
    prerequisites, certification, syllabus, priceFCFA, modules, partners,
  } = body as {
    title: string; level: Level; format: Format;
    description: string; durationHours: number; prerequisites: string;
    certification: string; syllabus: string[]; priceFCFA: number;
    modules: FormationModule[]; partners?: string;
  };

  if (!title || !LEVELS.includes(level) || !format || !durationHours || !priceFCFA) {
    return NextResponse.json({ error: "Titre, niveau, format, durée et prix sont requis." }, { status: 400 });
  }
  const cleanModules = (modules ?? []).filter((m) => DISCIPLINES.includes(m.discipline));

  const formation = createFormation({
    title, level, format,
    modules: cleanModules,
    partners: partners?.trim() || undefined,
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
