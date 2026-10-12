import { NextRequest, NextResponse } from "next/server";
import { requireAdmin, requireStaff } from "@/lib/auth";
import { deleteEquipment, getClubById, getCoachById, getEquipmentById, updateEquipment } from "@/lib/network";
import { DISCIPLINES, EQUIPMENT_CATEGORIES, EQUIPMENT_CONDITIONS } from "@/lib/labels";
import type { EquipmentItem } from "@/lib/types";
import { activeCoach, actorOf, bad, coachCanManage, deny, isDate, notFound, num, str } from "@/lib/guard";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const STATUSES = ["en_service", "en_reparation", "perdu", "reforme"];

/**
 * Modification d'un matériel.
 * - Coach (responsable ou responsable matériel du club) : état, statut (service / réparation),
 *   emplacement, notes. Les quantités ne changent que par inventaire ou incident.
 * - Administration : tous les champs, transfert de club et changement de responsable.
 */
export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const s = await requireStaff();
  if (!s) return deny("Connexion requise.", 401);
  const item = getEquipmentById(params.id);
  if (!item) return notFound("Matériel introuvable.");
  const b = await req.json().catch(() => ({}));
  const patch: Partial<EquipmentItem> = {};

  if ("condition" in b && (EQUIPMENT_CONDITIONS as string[]).includes(b.condition)) patch.condition = b.condition;
  if ("status" in b && STATUSES.includes(b.status)) patch.status = b.status;
  if ("storageLocation" in b) patch.storageLocation = str(b.storageLocation, 120) || undefined;
  if ("notes" in b) patch.notes = str(b.notes, 1000) || undefined;

  if (s.role === "coach") {
    const coach = activeCoach(s);
    if (!coach || !coachCanManage(coach, item)) return deny("Ce matériel n'est pas sous votre responsabilité.");
    if (patch.status === "reforme" || patch.status === "perdu") return bad("Utilisez « Signaler un incident » pour une perte ; la réforme est décidée par l'administration.");
    // Le responsable matériel du club peut réattribuer au sein du club.
    if ("responsibleCoachId" in b && coach.isEquipmentManager) {
      const rc = b.responsibleCoachId ? getCoachById(String(b.responsibleCoachId)) : null;
      if (b.responsibleCoachId && (!rc || rc.clubId !== coach.clubId)) return bad("Responsable invalide.");
      patch.responsibleCoachId = rc ? rc.id : null;
    }
  } else {
    if ("name" in b) patch.name = str(b.name, 140) || item.name;
    if ("category" in b && (EQUIPMENT_CATEGORIES as string[]).includes(b.category)) patch.category = b.category;
    if ("discipline" in b) patch.discipline = (DISCIPLINES as string[]).includes(b.discipline) ? b.discipline : undefined;
    if ("brand" in b) patch.brand = str(b.brand, 80) || undefined;
    if ("serialNumber" in b) patch.serialNumber = str(b.serialNumber, 80) || undefined;
    if ("unit" in b) patch.unit = str(b.unit, 20) || item.unit;
    if ("quantity" in b) patch.quantity = Math.round(num(b.quantity, 0, 100000));
    if ("unitValueFCFA" in b) patch.unitValueFCFA = b.unitValueFCFA === "" || b.unitValueFCFA === null ? undefined : Math.round(num(b.unitValueFCFA));
    if ("acquiredAt" in b) patch.acquiredAt = isDate(b.acquiredAt) ? b.acquiredAt : undefined;
    if ("origin" in b && ["dotation_mades", "club", "don_partenaire"].includes(b.origin)) patch.origin = b.origin;
    const targetClub = "clubId" in b ? str(b.clubId, 80) : item.clubId;
    if (!getClubById(targetClub)) return bad("Club inconnu.");
    if (targetClub !== item.clubId) patch.clubId = targetClub;
    if ("responsibleCoachId" in b || patch.clubId) {
      const rcId = "responsibleCoachId" in b ? String(b.responsibleCoachId || "") : "";
      const rc = rcId ? getCoachById(rcId) : null;
      if (rcId && (!rc || rc.clubId !== targetClub)) return bad("Le responsable doit être un coach du club de destination.");
      patch.responsibleCoachId = rc ? rc.id : null;
    }
  }

  const updated = updateEquipment(params.id, patch, actorOf(s), { note: str(b.note, 500) || undefined });
  return NextResponse.json({ item: updated });
}

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  const s = await requireAdmin();
  if (!s) return deny("Accès administrateur requis.", 401);
  return deleteEquipment(params.id, actorOf(s)) ? NextResponse.json({ ok: true }) : notFound("Matériel introuvable.");
}
