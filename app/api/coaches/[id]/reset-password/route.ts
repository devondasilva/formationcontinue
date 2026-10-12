import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { resetCoachPassword } from "@/lib/network";
import { deny, notFound } from "@/lib/guard";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(_req: NextRequest, { params }: { params: { id: string } }) {
  if (!(await requireAdmin())) return deny("Accès administrateur requis.", 401);
  const tempPassword = resetCoachPassword(params.id);
  return tempPassword ? NextResponse.json({ tempPassword }) : notFound("Coach introuvable.");
}
