import { NextRequest, NextResponse } from "next/server";
import { getEnrollmentById, getSessionById } from "@/lib/db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function toICSDate(dateStr: string): string {
  return dateStr.replace(/-/g, "");
}

export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  const enrollment = getEnrollmentById(params.id);
  if (!enrollment) {
    return NextResponse.json({ error: "Inscription introuvable." }, { status: 404 });
  }
  const session = getSessionById(enrollment.sessionId);
  if (!session) {
    return NextResponse.json({ error: "Session introuvable." }, { status: 404 });
  }

  // Date de fin exclusive pour un événement "journée entière" sur plusieurs jours (norme iCalendar).
  const endExclusive = new Date(session.endDate + "T00:00:00");
  endExclusive.setDate(endExclusive.getDate() + 1);
  const endStr = endExclusive.toISOString().slice(0, 10);

  const ics = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//MADES Formation Continue//FR",
    "CALSCALE:GREGORIAN",
    "BEGIN:VEVENT",
    `UID:${enrollment.id}@mades-formation`,
    `DTSTAMP:${toICSDate(new Date().toISOString().slice(0, 10))}T000000Z`,
    `DTSTART;VALUE=DATE:${toICSDate(session.startDate)}`,
    `DTEND;VALUE=DATE:${toICSDate(endStr)}`,
    `SUMMARY:${enrollment.formationTitle} — MADES Formation Continue`,
    `LOCATION:${session.location}`,
    `DESCRIPTION:Formation ${enrollment.formationTitle} (niveau ${enrollment.level})\\nFormateur : ${session.instructor}`,
    "END:VEVENT",
    "END:VCALENDAR",
  ].join("\r\n");

  return new NextResponse(ics, {
    headers: {
      "Content-Type": "text/calendar; charset=utf-8",
      "Content-Disposition": `attachment; filename="formation-${enrollment.id}.ics"`,
    },
  });
}
