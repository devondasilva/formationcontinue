import { NextResponse } from "next/server";
import { requireCoach } from "@/lib/auth";
import {
  getClubById, getCoaches, getEquipment, getMovements, getInventories, getPhotos, getPlacements, getLogs, placementHours,
} from "@/lib/network";
import { activeCoach, deny } from "@/lib/guard";
import { getLearnerById } from "@/lib/db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** Tout ce dont l'espace coach a besoin, limité à son club et à ses alternants. */
export async function GET() {
  const s = await requireCoach();
  if (!s) return deny("Connexion coach requise.", 401);
  const coach = activeCoach(s);
  if (!coach) return deny("Compte coach désactivé ou supprimé.", 403);
  const club = getClubById(coach.clubId) ?? null;
  const items = getEquipment().filter((e) => e.clubId === coach.clubId);
  const itemIds = new Set(items.map((i) => i.id));
  const placements = getPlacements()
    .filter((p) => p.tutorCoachId === coach.id || (p.clubId === coach.clubId && coach.isTutor && !p.tutorCoachId))
    .map((p) => {
      const l = getLearnerById(p.learnerId);
      return { ...p, hours: placementHours(p.id), learner: l ? { name: l.name, email: l.email, phone: l.phone } : null };
    });
  const pIds = new Set(placements.map((p) => p.id));
  return NextResponse.json({
    coach,
    club,
    colleagues: getCoaches().filter((c) => c.clubId === coach.clubId),
    items,
    movements: getMovements().filter((m) => m.clubId === coach.clubId || itemIds.has(m.itemId)).slice(0, 150),
    inventories: getInventories().filter((i) => i.clubId === coach.clubId),
    photos: getPhotos().filter((p) => p.clubId === coach.clubId),
    placements,
    logs: getLogs().filter((l) => pIds.has(l.placementId)),
  });
}
