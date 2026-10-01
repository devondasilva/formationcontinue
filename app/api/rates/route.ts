import { NextRequest, NextResponse } from "next/server";
import { getRates, updateRates } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const rates = getRates();
  return NextResponse.json({ rates });
}

export async function PATCH(req: NextRequest) {
  const admin = await requireAdmin();
  if (!admin) {
    return NextResponse.json({ error: "Accès administrateur requis." }, { status: 401 });
  }
  const { EUR, USD } = (await req.json()) as { EUR: number; USD: number };
  if (!EUR || !USD || EUR <= 0 || USD <= 0) {
    return NextResponse.json({ error: "Taux EUR et USD requis et positifs." }, { status: 400 });
  }
  const rates = updateRates({ EUR, USD });
  return NextResponse.json({ rates });
}
