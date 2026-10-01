import { NextRequest, NextResponse } from "next/server";
import {
  createEnrollment, findOrCreateLearner, getEnrollments,
  getFormationById, getSessionById, getEnrolledCount, getRates, updateSession,
} from "@/lib/db";
import { requireAdmin, getServerSession } from "@/lib/auth";
import { toFCFA } from "@/lib/currency";
import { Currency, PaymentMethod } from "@/lib/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const admin = await requireAdmin();
  if (!admin) {
    return NextResponse.json({ error: "Accès administrateur requis." }, { status: 401 });
  }
  const enrollments = getEnrollments().sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1));
  return NextResponse.json({ enrollments });
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { name, email, phone, sessionId, currency, paymentMethod } = body as {
    name: string; email: string; phone: string; sessionId: string;
    currency: Currency; paymentMethod: PaymentMethod;
  };

  if (!name || !email || !phone || !sessionId || !currency) {
    return NextResponse.json({ error: "Tous les champs sont requis pour s'inscrire." }, { status: 400 });
  }

  const session = getSessionById(sessionId);
  if (!session || session.status === "annulee" || session.status === "terminee") {
    return NextResponse.json({ error: "Cette session n'est plus disponible." }, { status: 400 });
  }
  const formation = getFormationById(session.formationId);
  if (!formation || !formation.active) {
    return NextResponse.json({ error: "Formation introuvable ou inactive." }, { status: 400 });
  }

  const enrolledCount = getEnrolledCount(session.id);
  if (enrolledCount >= session.capacity) {
    return NextResponse.json({ error: "Cette session est complète." }, { status: 400 });
  }

  const rates = getRates();
  void toFCFA(0, currency, rates); // valide que la devise est gérée

  const learnerSession = await getServerSession();
  const learner =
    learnerSession?.role === "learner"
      ? { id: learnerSession.id, name: learnerSession.name }
      : findOrCreateLearner(name, email, phone);

  const enrollment = createEnrollment({
    learnerId: learner.id,
    learnerName: learner.name,
    sessionId: session.id,
    formationId: formation.id,
    formationTitle: formation.title,
    discipline: formation.discipline,
    level: formation.level,
    durationHours: formation.durationHours,
    sessionStartDate: session.startDate,
    sessionEndDate: session.endDate,
    amountFCFA: formation.priceFCFA,
    currency,
    paymentMethod: paymentMethod ?? "virement",
  });

  if (enrolledCount + 1 >= session.capacity) {
    updateSession(session.id, { status: "complete" });
  }

  return NextResponse.json({ enrollment, learner });
}
