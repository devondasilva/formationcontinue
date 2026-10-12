import { NextResponse } from "next/server";
import {
  getLearners, getFormations, getSessions, getEnrollments, getReviews, getRates, getEnrolledCount,
  getDocuments,
} from "@/lib/db";
import { requireAdmin } from "@/lib/auth";
import {
  clubSummaries, getClubs, getCoaches, getEquipment, getInventories, getLogs, getMovements, getPhotos, getPlacements, placementHours,
} from "@/lib/network";

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

  // Réseau : clubs partenaires, coachs, matériel, inventaires, alternance.
  const equipment = getEquipment();
  const logs = getLogs();
  const placements = getPlacements().map((p) => ({ ...p, hours: placementHours(p.id, logs) }));
  const inventories = getInventories();
  const summaries = clubSummaries();
  const live = equipment.filter((e) => e.status !== "reforme");

  return NextResponse.json({
    network: {
      clubs: getClubs(),
      coaches: getCoaches(),
      equipment,
      movements: getMovements().slice(0, 400),
      inventories,
      photos: getPhotos(),
      placements,
      logs,
      summaries,
      totals: {
        clubs: summaries.length,
        coaches: getCoaches().length,
        items: live.length,
        units: live.reduce((n, e) => n + e.quantity, 0),
        valueFCFA: live.reduce((n, e) => n + e.quantity * (e.unitValueFCFA ?? 0), 0),
        toRepair: live.filter((e) => e.condition === "a_reparer" || e.status === "en_reparation").length,
        outOfService: live.filter((e) => e.condition === "hors_service" || e.status === "perdu").length,
        unassigned: live.filter((e) => !e.responsibleCoachId).length,
        inventoriesToReview: inventories.filter((i) => i.status === "soumis").length,
        clubsInventoryOverdue: summaries.filter((x) => x.inventoryOverdue).length,
        activePlacements: placements.filter((p) => p.status === "en_cours").length,
        logsToValidate: logs.filter((l) => l.status === "a_valider").length,
      },
    },
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
