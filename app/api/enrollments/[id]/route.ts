import { NextRequest, NextResponse } from "next/server";
import { updateEnrollmentStatus, getEnrollmentById, getSessionById, getEnrolledCount, updateSession } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";
import { EnrollmentStatus } from "@/lib/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const VALID: EnrollmentStatus[] = ["en_attente", "confirmee", "terminee", "annulee"];

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const admin = await requireAdmin();
  if (!admin) {
    return NextResponse.json({ error: "Accès administrateur requis." }, { status: 401 });
  }
  const { status } = (await req.json()) as { status: EnrollmentStatus };
  if (!VALID.includes(status)) {
    return NextResponse.json({ error: "Statut invalide." }, { status: 400 });
  }

  const before = getEnrollmentById(params.id);
  const enrollment = updateEnrollmentStatus(params.id, status);
  if (!enrollment) {
    return NextResponse.json({ error: "Inscription introuvable." }, { status: 404 });
  }

  // Si on annule une inscription sur une session devenue complète, on la rouvre.
  if (status === "annulee" && before && before.status !== "annulee") {
    const session = getSessionById(before.sessionId);
    if (session && session.status === "complete" && getEnrolledCount(session.id) < session.capacity) {
      updateSession(session.id, { status: "ouverte" });
    }
  }

  return NextResponse.json({ enrollment });
}
