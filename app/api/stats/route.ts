import { NextResponse } from "next/server";
import {
  getLearners, getFormations, getSessions, getEnrollments, getReviews, getRates, getEnrolledCount,
  getDocuments,
} from "@/lib/db";
import { requireAdmin } from "@/lib/auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const admin = await requireAdmin();
  if (!admin) {
    return NextResponse.json({ error: "Accès administrateur requis." }, { status: 401 });
  }

  const learners = getLearners();
  const formations = getFormations();
  const sessions = getSessions().map((s) => ({ ...s, enrolledCount: getEnrolledCount(s.id) }));
  const enrollments = getEnrollments();
  const reviews = getReviews();
  const rates = getRates();
  const documents = getDocuments();

  const totalRevenueFCFA = enrollments
    .filter((e) => e.status !== "annulee")
    .reduce((s, e) => s + e.amountFCFA, 0);
  const certificatesIssued = enrollments.filter((e) => e.certificateIssued).length;

  return NextResponse.json({
    totals: {
      learners: learners.length,
      formations: formations.length,
      sessions: sessions.length,
      enrollments: enrollments.length,
      pendingEnrollments: enrollments.filter((e) => e.status === "en_attente").length,
      totalRevenueFCFA,
      certificatesIssued,
      reviews: reviews.length,
    },
    learners,
    documents,
    formations,
    sessions,
    enrollments,
    reviews,
    rates,
  });
}
