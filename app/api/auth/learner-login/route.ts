import { NextRequest, NextResponse } from "next/server";
import { findOrCreateLearner } from "@/lib/db";
import { createSessionToken, SESSION_COOKIE } from "@/lib/auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  const { name, email, phone } = (await req.json()) as { name: string; email: string; phone: string };
  if (!name || !email || !phone) {
    return NextResponse.json({ error: "Nom, email et téléphone sont requis." }, { status: 400 });
  }
  const learner = findOrCreateLearner(name, email, phone);
  const token = await createSessionToken("learner", learner.id, learner.name);
  const res = NextResponse.json({
    session: { role: "learner", id: learner.id, name: learner.name },
    learner,
  });
  res.cookies.set(SESSION_COOKIE, token, {
    httpOnly: true, sameSite: "lax", secure: process.env.NODE_ENV === "production",
    path: "/", maxAge: 60 * 60 * 24 * 7,
  });
  return res;
}
