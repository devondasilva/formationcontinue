import { NextRequest, NextResponse } from "next/server";
import { requireStaff } from "@/lib/auth";
import { getEquipmentById, getPhotoById, reportIncident } from "@/lib/network";
import { EQUIPMENT_CONDITIONS } from "@/lib/labels";
import type { EquipmentCondition } from "@/lib/types";
import { activeCoach, actorOf, bad, coachCanManage, deny, notFound, num, str } from "@/lib/guard";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** Déclaration d'un incident (casse, perte, vol) avec photos de preuve. */
export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const s = await requireStaff();
  if (!s) return deny("Connexion requise.", 401);
  const item = getEquipmentById(params.id);
  if (!item) return notFound("Matériel introuvable.");
  if (s.role === "coach") {
    const coach = activeCoach(s);
    if (!coach || !coachCanManage(coach, item)) return deny("Ce matériel n'est pas sous votre responsabilité.");
  }
  const b = await req.json().catch(() => ({}));
  const note = str(b.note, 1000);
  if (!note) return bad("Décrivez ce qui s'est passé.");
  const kind = str(b.kind, 20); // casse | perte | vol
  const condition = (EQUIPMENT_CONDITIONS as string[]).includes(b.condition) ? (b.condition as EquipmentCondition) : undefined;
  const photoIds = Array.isArray(b.photoIds) ? b.photoIds.filter((id: unknown) => typeof id === "string" && getPhotoById(id)?.clubId === item.clubId) : [];
  const updated = reportIncident(
    params.id,
    {
      lostQty: kind === "perte" || kind === "vol" ? num(b.lostQty, 0, item.quantity) : 0,
      condition,
      status: kind === "casse" && condition === "a_reparer" ? "en_reparation" : undefined,
      note: `${kind === "vol" ? "Vol" : kind === "perte" ? "Perte" : "Casse / dégradation"} — ${note}`,
      photoIds,
    },
    actorOf(s)
  );
  return NextResponse.json({ item: updated });
}
