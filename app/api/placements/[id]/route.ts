import { NextRequest, NextResponse } from "next/server";
import { requireAdmin, requireStaff } from "@/lib/auth";
import { deletePlacement, getClubById, getCoachById, getPlacementById, updatePlacement } from "@/lib/network";
import type { Placement, PlacementResult } from "@/lib/types";
import { activeCoach, actorOf, bad, deny, isDate, notFound, num, str } from "@/lib/guard";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const RESULTS: PlacementResult[] = ["acquis", "en_cours_acquisition", "non_acquis"];

/**
 * Administration : tous les champs (club, tuteur, dates, statut…).
 * Tuteur : uniquement l'évaluation de fin d'alternance.
 */
export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const s = await requireStaff();
  if (!s) return deny("Connexion requise.", 401);
  const p = getPlacementById(params.id);
  if (!p) return notFound("Alternance introuvable.");
  const b = await req.json().catch(() => ({}));
  const patch: Partial<Placement> = {};

  if (b.evaluation) {
    const result = RESULTS.includes(b.evaluation.result) ? (b.evaluation.result as PlacementResult) : null;
    if (!result) return bad("Choisissez un résultat d'évaluation.");
    patch.evaluation = { result, comment: str(b.evaluation.comment, 1500), by: actorOf(s), at: new Date().toISOString() };
  }

  if (s.role === "coach") {
    const coach = activeCoach(s);
    if (!coach || p.tutorCoachId !== coach.id) return deny("Vous n'êtes pas le tuteur de cette alternance.");
    if (!patch.evaluation) return bad("Rien à enregistrer.");
    return NextResponse.json({ placement: updatePlacement(params.id, { evaluation: patch.evaluation }) });
  }

  const clubId = "clubId" in b ? str(b.clubId, 80) : p.clubId;
  if (!getClubById(clubId)) return bad("Club inconnu.");
  if ("clubId" in b) patch.clubId = clubId;
  if ("tutorCoachId" in b) {
    const t = b.tutorCoachId ? getCoachById(String(b.tutorCoachId)) : null;
    if (b.tutorCoachId && (!t || t.clubId !== clubId)) return bad("Le tuteur doit être un coach du club.");
    patch.tutorCoachId = t ? t.id : null;
  }
  if ("startDate" in b && isDate(b.startDate)) patch.startDate = b.startDate;
  if ("endDate" in b && isDate(b.endDate)) patch.endDate = b.endDate;
  if ((patch.endDate ?? p.endDate) < (patch.startDate ?? p.startDate)) return bad("La fin doit suivre le début.");
  if ("schedule" in b) patch.schedule = str(b.schedule, 160);
  if ("hoursPlanned" in b) patch.hoursPlanned = Math.round(num(b.hoursPlanned, 0, 2000));
  if ("objectives" in b) patch.objectives = str(b.objectives, 1500) || undefined;
  if ("status" in b && ["planifie", "en_cours", "termine", "interrompu"].includes(b.status)) patch.status = b.status;
  return NextResponse.json({ placement: updatePlacement(params.id, patch) });
}

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  if (!(await requireAdmin())) return deny("Accès administrateur requis.", 401);
  return deletePlacement(params.id) ? NextResponse.json({ ok: true }) : notFound("Alternance introuvable.");
}
