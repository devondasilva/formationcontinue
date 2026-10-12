import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "@/lib/auth";
import { deleteLog, getLogs, getPlacementById, reviewLog } from "@/lib/network";
import { activeCoach, actorOf, bad, deny, notFound, str } from "@/lib/guard";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** Validation / refus d'une séance par le tuteur ou l'administration. */
export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const s = await getServerSession();
  if (!s || s.role === "learner") return deny("Réservé au tuteur ou à l'administration.", 401);
  const log = getLogs().find((l) => l.id === params.id);
  if (!log) return notFound("Séance introuvable.");
  const p = getPlacementById(log.placementId);
  if (s.role === "coach" && activeCoach(s)?.id !== p?.tutorCoachId) return deny("Vous n'êtes pas le tuteur de cette alternance.");
  const b = await req.json().catch(() => ({}));
  if (b.status !== "valide" && b.status !== "refuse") return bad("Statut invalide.");
  return NextResponse.json({ log: reviewLog(params.id, b.status, actorOf(s), str(b.comment, 500)) });
}

/** Suppression : administration, ou l'auteur tant que la séance n'est pas validée. */
export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  const s = await getServerSession();
  if (!s) return deny("Connexion requise.", 401);
  const log = getLogs().find((l) => l.id === params.id);
  if (!log) return notFound("Séance introuvable.");
  const isAuthor = log.by.role === s.role && log.by.id === s.id;
  if (s.role !== "admin" && !(isAuthor && log.status !== "valide")) return deny("Séance déjà validée : seule l'administration peut la supprimer.");
  deleteLog(params.id);
  return NextResponse.json({ ok: true });
}
