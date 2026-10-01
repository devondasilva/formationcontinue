import { NextRequest, NextResponse } from "next/server";
import { createAdmin, getAdmins, toPublicAdmin } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "Accès administrateur requis." }, { status: 401 });
  return NextResponse.json({ admins: getAdmins().map(toPublicAdmin), me: admin.id });
}

export async function POST(req: NextRequest) {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "Accès administrateur requis." }, { status: 401 });
  const { username, name, password } = (await req.json()) as { username?: string; name?: string; password?: string };
  if (!username || !password) {
    return NextResponse.json({ error: "Identifiant et mot de passe requis." }, { status: 400 });
  }
  if (!/^[a-zA-Z0-9._-]{3,32}$/.test(username.trim())) {
    return NextResponse.json({ error: "Identifiant : 3 à 32 caractères (lettres, chiffres, . _ -)." }, { status: 400 });
  }
  if (password.length < 8) {
    return NextResponse.json({ error: "Le mot de passe doit contenir au moins 8 caractères." }, { status: 400 });
  }
  const created = createAdmin(username, name ?? "", password);
  if (!created) return NextResponse.json({ error: "Cet identifiant existe déjà." }, { status: 409 });
  return NextResponse.json({ admin: toPublicAdmin(created) });
}
