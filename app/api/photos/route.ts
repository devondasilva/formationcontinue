import { NextRequest, NextResponse } from "next/server";
import { requireStaff } from "@/lib/auth";
import { PHOTO_MAX_BYTES, PHOTO_TYPES, getClubById, getEquipmentById, savePhoto } from "@/lib/network";
import type { PhotoKind } from "@/lib/types";
import { activeCoach, actorOf, bad, coachCanManage, deny, str } from "@/lib/guard";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const KINDS: PhotoKind[] = ["etat", "dotation", "inventaire", "incident", "reparation"];

/**
 * Téléversement d'une photo de preuve (multipart) : file, itemId?, clubId?, kind, caption.
 * Coach : uniquement sur son club (et sur un matériel qu'il gère s'il est précisé).
 */
export async function POST(req: NextRequest) {
  const s = await requireStaff();
  if (!s) return deny("Connexion requise.", 401);
  const form = await req.formData();
  const file = form.get("file");
  if (!(file instanceof File)) return bad("Aucune photo reçue.");
  const ext = (file.name.split(".").pop() ?? "jpg").toLowerCase();
  if (!PHOTO_TYPES[ext] && !file.type.startsWith("image/")) return bad("Formats acceptés : JPG, PNG, WebP, HEIC.");
  if (file.size > PHOTO_MAX_BYTES) return bad("Photo trop lourde (12 Mo maximum).");

  const buffer = Buffer.from(await file.arrayBuffer());
  const sniffed = sniffImage(buffer);
  if (!sniffed) return bad("Le fichier n'est pas une image valide.");

  const itemId = str(form.get("itemId"), 80) || undefined;
  const item = itemId ? getEquipmentById(itemId) : undefined;
  if (itemId && !item) return bad("Matériel introuvable.");
  let clubId = item?.clubId ?? str(form.get("clubId"), 80);

  if (s.role === "coach") {
    const coach = activeCoach(s);
    if (!coach) return deny("Compte coach désactivé.");
    if (item && !coachCanManage(coach, item)) return deny("Ce matériel n'est pas sous votre responsabilité.");
    clubId = coach.clubId;
  }
  if (!getClubById(clubId)) return bad("Club inconnu.");

  const kindRaw = str(form.get("kind"), 20) as PhotoKind;
  const photo = savePhoto(buffer, sniffed, {
    clubId,
    itemId,
    kind: KINDS.includes(kindRaw) ? kindRaw : "etat",
    caption: str(form.get("caption"), 200) || undefined,
    by: actorOf(s),
  });
  return NextResponse.json({ photo }, { status: 201 });
}

/** Reconnaît le format réel à partir des premiers octets (ne pas se fier à l'extension). */
function sniffImage(b: Buffer): "jpg" | "png" | "webp" | "heic" | null {
  if (b.length < 12) return null;
  if (b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff) return "jpg";
  if (b.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))) return "png";
  if (b.toString("ascii", 0, 4) === "RIFF" && b.toString("ascii", 8, 12) === "WEBP") return "webp";
  if (b.toString("ascii", 4, 8) === "ftyp" && /hei|mif|hev/.test(b.toString("ascii", 8, 12))) return "heic";
  return null;
}
