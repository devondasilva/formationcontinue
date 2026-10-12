import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "@/lib/auth";
import { createLog, getPlacementById } from "@/lib/network";
import { activeCoach, actorOf, bad, deny, isDate, notFound, num, str } from "@/lib/guard";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Ajout d'une séance au carnet d'alternance.
 * - Apprenant : déclare une séance (à valider par le tuteur).
 * - Tuteur / administration : saisie validée d'emblée.
 */
export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const s = await getServerSession();
  if (!s) return deny("Connexion requise.", 401);
  const p = getPlacementById(params.id);
  if (!p) return notFound("Alternance introuvable.");
  if (s.role === "learner" && p.learnerId !== s.id) return deny();
  if (s.role === "coach" && activeCoach(s)?.id !== p.tutorCoachId) return deny("Vous n'êtes pas le tuteur de cette alternance.");
  if (p.status === "interrompu") return bad("Cette alternance est interrompue.");

  const b = await req.json().catch(() => ({}));
  if (!isDate(b.date)) return bad("Date de la séance requise.");
  if (b.date > new Date().toISOString().slice(0, 10)) return bad("La séance ne peut pas être dans le futur.");
  const activity = str(b.activity, 500);
  if (!activity) return bad("Décrivez l'activité réalisée.");
  const hours = num(b.hours, 0, 12);
  if (hours < 0.5) return bad("Durée minimale : 0,5 h.");
  const log = createLog({ placementId: p.id, date: b.date, hours: Math.round(hours * 2) / 2, activity }, actorOf(s));
  return NextResponse.json({ log }, { status: 201 });
}
