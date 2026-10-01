import { NextRequest, NextResponse } from "next/server";
import { getFormationById, getReviewsByFormation, createReview, findOrCreateLearner } from "@/lib/db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  const reviews = getReviewsByFormation(params.id);
  return NextResponse.json({ reviews });
}

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const formation = getFormationById(params.id);
  if (!formation) {
    return NextResponse.json({ error: "Formation introuvable." }, { status: 404 });
  }
  const body = await req.json();
  const { name, email, phone, rating, comment } = body as {
    name: string; email: string; phone: string; rating: number; comment: string;
  };
  if (!name || !email || !phone || !rating) {
    return NextResponse.json({ error: "Nom, email, téléphone et note sont requis." }, { status: 400 });
  }
  const ratingNum = Math.round(Number(rating));
  if (ratingNum < 1 || ratingNum > 5) {
    return NextResponse.json({ error: "La note doit être comprise entre 1 et 5." }, { status: 400 });
  }
  const learner = findOrCreateLearner(name, email, phone);
  const review = createReview({
    formationId: formation.id,
    learnerId: learner.id,
    learnerName: learner.name,
    rating: ratingNum,
    comment: comment ?? "",
  });
  return NextResponse.json({ review });
}
