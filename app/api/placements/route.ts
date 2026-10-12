import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { getEnrollmentById, getLearnerById } from "@/lib/db";
import { createPlacement, getClubById, getCoachById } from "@/lib/network";
import { bad, deny, isDate, num, str } from "@/lib/guard";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** Création d'une période d'alternance (administration). */
export async function POST(req: NextRequest) {
  if (!(await requireAdmin())) return deny("Accès administrateur requis.", 401);
  const b = await req.json().catch(() => ({}));
  const learner = getLearnerById(str(b.learnerId, 80));
  if (!learner) return bad("Choisissez un apprenant.");
  const club = getClubById(str(b.clubId, 80));
  if (!club) return bad("Choisissez un club partenaire.");
  const tutorId = str(b.tutorCoachId, 80) || null;
  if (tutorId) {
    const t = getCoachById(tutorId);
    if (!t || t.clubId !== club.id) return bad("Le tuteur doit être un coach de ce club.");
  }
  if (!isDate(b.startDate) || !isDate(b.endDate) || b.endDate < b.startDate) return bad("Dates de début et de fin invalides.");
  const enrollment = b.enrollmentId ? getEnrollmentById(String(b.enrollmentId)) : undefined;
  if (enrollment && enrollment.learnerId !== learner.id) return bad("Cette inscription n'appartient pas à l'apprenant.");

  const placement = createPlacement({
    learnerId: learner.id,
    learnerName: learner.name,
    enrollmentId: enrollment?.id,
    formationId: enrollment?.formationId,
    formationTitle: enrollment?.formationTitle,
    level: enrollment?.level,
    clubId: club.id,
    tutorCoachId: tutorId,
    startDate: b.startDate,
    endDate: b.endDate,
    schedule: str(b.schedule, 160),
    hoursPlanned: Math.round(num(b.hoursPlanned, 0, 2000)),
    objectives: str(b.objectives, 1500) || undefined,
  });
  return NextResponse.json({ placement }, { status: 201 });
}
