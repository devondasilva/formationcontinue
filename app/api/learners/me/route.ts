import { NextResponse } from "next/server";
import { requireLearner } from "@/lib/auth";
import { getLearnerById, getEnrollmentsByLearner, getLearnerProgress, getRates } from "@/lib/db";

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
  return NextResponse.json({ learner, enrollments, progress, rates });
}
