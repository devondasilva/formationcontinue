import { NextRequest, NextResponse } from "next/server";
import { verifyCoachCredentials } from "@/lib/network";
import { createSessionToken, SESSION_COOKIE } from "@/lib/auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  const { email, password } = (await req.json().catch(() => ({}))) as { email?: string; password?: string };
  if (!email || !password) return NextResponse.json({ error: "Email et mot de passe requis." }, { status: 400 });
  const coach = verifyCoachCredentials(email, password);
  if (coach === "inactive") return NextResponse.json({ error: "Compte désactivé. Contactez l'équipe MADES." }, { status: 403 });
  if (!coach) return NextResponse.json({ error: "Email ou mot de passe incorrect." }, { status: 401 });
  const token = await createSessionToken("coach", coach.id, coach.name);
  const res = NextResponse.json({ session: { role: "coach", id: coach.id, name: coach.name }, mustChangePassword: coach.mustChangePassword });
  res.cookies.set(SESSION_COOKIE, token, {
    httpOnly: true, sameSite: "lax", secure: process.env.NODE_ENV === "production",
    path: "/", maxAge: 60 * 60 * 24 * 7,
  });
  return res;
}
