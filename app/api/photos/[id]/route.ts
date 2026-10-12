import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import { requireStaff } from "@/lib/auth";
import { PHOTOS_DIR, deletePhoto, getPhotoById } from "@/lib/network";
import { activeCoach, deny, notFound } from "@/lib/guard";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** Sert la photo (accès réservé à l'administration et aux coachs du club concerné). */
export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  const s = await requireStaff();
  if (!s) return deny("Connexion requise.", 401);
  const photo = getPhotoById(params.id);
  if (!photo) return notFound("Photo introuvable.");
  if (s.role === "coach" && activeCoach(s)?.clubId !== photo.clubId) return deny();
  try {
    const buf = fs.readFileSync(path.join(PHOTOS_DIR, path.basename(photo.fileName)));
    return new NextResponse(buf, {
      headers: { "Content-Type": photo.mimeType, "Cache-Control": "private, max-age=86400", "X-Content-Type-Options": "nosniff" },
    });
  } catch {
    return notFound("Fichier manquant.");
  }
}

/** Suppression : administration, ou l'auteur de la photo. */
export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  const s = await requireStaff();
  if (!s) return deny("Connexion requise.", 401);
  const photo = getPhotoById(params.id);
  if (!photo) return notFound("Photo introuvable.");
  if (s.role !== "admin" && !(photo.by.role === s.role && photo.by.id === s.id)) return deny("Seul l'auteur ou l'administration peut supprimer cette photo.");
  deletePhoto(params.id);
  return NextResponse.json({ ok: true });
}
