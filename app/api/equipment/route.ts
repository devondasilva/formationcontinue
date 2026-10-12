import { NextRequest, NextResponse } from "next/server";
import { requireStaff } from "@/lib/auth";
import { createEquipment, getClubById, getCoachById } from "@/lib/network";
import { CATEGORY_UNIT, DISCIPLINES, EQUIPMENT_CATEGORIES, EQUIPMENT_CONDITIONS } from "@/lib/labels";
import type { Discipline, EquipmentCategory, EquipmentCondition, EquipmentOrigin } from "@/lib/types";
import { activeCoach, actorOf, bad, deny, isDate, num, str } from "@/lib/guard";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Ajout de matériel.
 * - Administration : dotation dans n'importe quel club, avec responsable.
 * - Coach : déclaration dans son propre club (il en devient responsable par défaut).
 */
export async function POST(req: NextRequest) {
  const s = await requireStaff();
  if (!s) return deny("Connexion requise.", 401);
  const b = await req.json().catch(() => ({}));

  const category = (EQUIPMENT_CATEGORIES as string[]).includes(b.category) ? (b.category as EquipmentCategory) : "autre";
  const condition = (EQUIPMENT_CONDITIONS as string[]).includes(b.condition) ? (b.condition as EquipmentCondition) : "neuf";
  const origin = (["dotation_mades", "club", "don_partenaire"] as EquipmentOrigin[]).includes(b.origin) ? (b.origin as EquipmentOrigin) : "dotation_mades";
  const name = str(b.name, 140);
  const quantity = Math.round(num(b.quantity, 0, 100000));
  if (!name) return bad("Désignation du matériel requise.");
  if (quantity < 1) return bad("Quantité d'au moins 1.");

  let clubId = str(b.clubId, 80);
  let responsibleCoachId: string | null = str(b.responsibleCoachId, 80) || null;
  if (s.role === "coach") {
    const coach = activeCoach(s);
    if (!coach) return deny("Compte coach désactivé.");
    clubId = coach.clubId;
    // Un coach déclare pour lui-même, sauf s'il est responsable matériel du club.
    if (!coach.isEquipmentManager || !responsibleCoachId) responsibleCoachId = coach.id;
  }
  if (!getClubById(clubId)) return bad("Club inconnu.");
  if (responsibleCoachId) {
    const rc = getCoachById(responsibleCoachId);
    if (!rc || rc.clubId !== clubId) return bad("Le responsable doit être un coach de ce club.");
  }

  const discipline = (DISCIPLINES as string[]).includes(b.discipline) ? (b.discipline as Discipline) : undefined;
  const item = createEquipment(
    {
      clubId,
      responsibleCoachId,
      category,
      name,
      discipline,
      brand: str(b.brand, 80) || undefined,
      serialNumber: str(b.serialNumber, 80) || undefined,
      quantity,
      unit: str(b.unit, 20) || CATEGORY_UNIT[category],
      condition,
      origin,
      acquiredAt: isDate(b.acquiredAt) ? b.acquiredAt : new Date().toISOString().slice(0, 10),
      unitValueFCFA: b.unitValueFCFA !== undefined && b.unitValueFCFA !== "" ? Math.round(num(b.unitValueFCFA, 0, 1e9)) : undefined,
      storageLocation: str(b.storageLocation, 120) || undefined,
      notes: str(b.notes, 1000) || undefined,
    },
    actorOf(s),
    str(b.note, 500) || undefined
  );
  return NextResponse.json({ item }, { status: 201 });
}
