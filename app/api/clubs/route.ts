import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { createClub, getClubs } from "@/lib/network";
import { bad, deny, parseClub } from "@/lib/guard";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** Liste publique des clubs partenaires (sans les notes internes). */
export async function GET() {
  const clubs = getClubs()
    .filter((c) => c.status !== "suspendu")
    .map(({ notes: _n, email: _e, phone: _p, ...c }) => c);
  return NextResponse.json({ clubs });
}

export async function POST(req: NextRequest) {
  if (!(await requireAdmin())) return deny("Accès administrateur requis.", 401);
  const data = parseClub(await req.json().catch(() => ({})));
  if (!data.name || !data.city) return bad("Nom et ville du club requis.");
  return NextResponse.json({ club: createClub(data) }, { status: 201 });
}
