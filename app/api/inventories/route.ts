import { NextRequest, NextResponse } from "next/server";
import { requireStaff } from "@/lib/auth";
import { getClubById, getEquipment, submitInventory } from "@/lib/network";
import { EQUIPMENT_CONDITIONS } from "@/lib/labels";
import type { EquipmentCondition } from "@/lib/types";
import { activeCoach, actorOf, bad, coachCanManage, deny, num, str } from "@/lib/guard";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Soumission d'un inventaire : { clubId (admin), lines: [{ itemId, countedQty, condition, note, photoIds }], comment }.
 * Un coach n'inventorie que le matériel qu'il gère.
 */
export async function POST(req: NextRequest) {
  const s = await requireStaff();
  if (!s) return deny("Connexion requise.", 401);
  const b = await req.json().catch(() => ({}));
  let clubId = str(b.clubId, 80);
  const raw: unknown[] = Array.isArray(b.lines) ? b.lines : [];

  let allowed = new Set(getEquipment().filter((e) => e.clubId === clubId).map((e) => e.id));
  if (s.role === "coach") {
    const coach = activeCoach(s);
    if (!coach) return deny("Compte coach désactivé.");
    clubId = coach.clubId;
    allowed = new Set(getEquipment().filter((e) => coachCanManage(coach, e)).map((e) => e.id));
  }
  if (!getClubById(clubId)) return bad("Club inconnu.");

  const lines = raw
    .map((l) => l as Record<string, unknown>)
    .filter((l) => allowed.has(String(l.itemId)))
    .map((l) => ({
      itemId: String(l.itemId),
      countedQty: Math.round(num(l.countedQty, 0, 100000)),
      condition: (EQUIPMENT_CONDITIONS as string[]).includes(l.condition as string) ? (l.condition as EquipmentCondition) : "bon",
      note: str(l.note, 300),
      photoIds: Array.isArray(l.photoIds) ? (l.photoIds as unknown[]).filter((x): x is string => typeof x === "string").slice(0, 10) : [],
    }));
  const inv = submitInventory(clubId, lines, actorOf(s), str(b.comment, 1000));
  if (inv === "empty") return bad("Aucune ligne d'inventaire valide.");
  return NextResponse.json({ inventory: inv }, { status: 201 });
}
