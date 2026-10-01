import { NextResponse } from "next/server";
import { getSessions, getEnrolledCount } from "@/lib/db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const sessions = getSessions()
    .map((s) => ({ ...s, enrolledCount: getEnrolledCount(s.id) }))
    .sort((a, b) => (a.startDate > b.startDate ? 1 : -1));
  return NextResponse.json({ sessions });
}
