import { NextResponse } from "next/server";
import { requireLearner } from "@/lib/auth";
import { getLearnerById, getEnrollmentsByLearner, getLearnerProgress, getRates } from "@/lib/db";
import { getClubById, getCoachById, getLogs, getPlacements, placementHours } from "@/lib/network";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const session = await requireLearner();
  if (!session) {
    return NextResponse.json({ error: "Connexion apprenant requise." }, { status: 401 });
  }
  const learner = getLearnerById(session.id);
  if (!learner) {
    return NextResponse.json({ error: "Apprenant introuvable." }, { status: 404 });
  }
  const enrollments = getEnrollmentsByLearner(learner.id);
  const progress = getLearnerProgress(learner.id);
  const rates = getRates();
  // Alternance : club d'accueil, tuteur (contact) et carnet de séances.
  const logs = getLogs();
  const placements = getPlacements()
    .filter((p) => p.learnerId === learner.id)
    .map((p) => {
      const club = getClubById(p.clubId);
      const tutor = p.tutorCoachId ? getCoachById(p.tutorCoachId) : undefined;
      return {
        ...p,
        club: club ? { name: club.name, city: club.city, address: club.address } : null,
        tutor: tutor ? { name: tutor.name, phone: tutor.phone, email: tutor.email } : null,
        hours: placementHours(p.id, logs),
        logs: logs.filter((l) => l.placementId === p.id),
      };
    });
  return NextResponse.json({ learner, enrollments, progress, rates, placements });
}
