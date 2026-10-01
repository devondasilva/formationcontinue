import { NextRequest, NextResponse } from "next/server";
import { verifyAdminCredentials } from "@/lib/db";
import { createSessionToken, SESSION_COOKIE } from "@/lib/auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  const { username, password } = (await req.json()) as { username: string; password: string };
  if (!username || !password) {
    return NextResponse.json({ error: "Identifiant et mot de passe requis." }, { status: 400 });
  }
  const admin = verifyAdminCredentials(username, password);
  if (!admin) {
    return NextResponse.json({ error: "Identifiant ou mot de passe incorrect." }, { status: 401 });
  }
  const token = await createSessionToken("admin", admin.id, admin.name);
  const res = NextResponse.json({ session: { role: "admin", id: admin.id, name: admin.name } });
  res.cookies.set(SESSION_COOKIE, token, {
    httpOnly: true, sameSite: "lax", secure: process.env.NODE_ENV === "production",
    path: "/", maxAge: 60 * 60 * 24 * 7,
  });
  return res;
}
