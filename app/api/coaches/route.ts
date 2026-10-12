import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { createCoach, getClubById } from "@/lib/network";
import { bad, deny, str } from "@/lib/guard";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** Crée un coach et renvoie son mot de passe provisoire (affiché une seule fois). */
export async function POST(req: NextRequest) {
  if (!(await requireAdmin())) return deny("Accès administrateur requis.", 401);
  const b = await req.json().catch(() => ({}));
  const data = {
    name: str(b.name, 120),
    email: str(b.email, 120),
    phone: str(b.phone, 40),
    clubId: str(b.clubId, 80),
    isTutor: Boolean(b.isTutor),
    isEquipmentManager: Boolean(b.isEquipmentManager),
  };
  if (!data.name || !/^\S+@\S+\.\S+$/.test(data.email)) return bad("Nom et email valide requis.");
  if (!getClubById(data.clubId)) return bad("Choisissez le club du coach.");
  const r = createCoach(data);
  if (r === "email-taken") return bad("Un coach utilise déjà cet email.");
  return NextResponse.json(r, { status: 201 });
}
