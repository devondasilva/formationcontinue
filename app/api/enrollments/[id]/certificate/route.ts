import { NextRequest, NextResponse } from "next/server";
import PDFDocument from "pdfkit";
import { getEnrollmentById } from "@/lib/db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const LEVEL_LABEL: Record<string, string> = {
  initiateur: "Initiateur",
  animateur: "Animateur",
  entraineur: "Entraîneur",
  de: "Diplôme d'État (DE)",
};
const DISCIPLINE_LABEL: Record<string, string> = {
  "beach-tennis": "Beach Tennis",
  padel: "Padel",
  tennis: "Tennis",
  "mini-tennis": "Mini-Tennis",
};

export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  const enrollment = getEnrollmentById(params.id);
  if (!enrollment) {
    return NextResponse.json({ error: "Inscription introuvable." }, { status: 404 });
  }
  if (!enrollment.certificateIssued) {
    return NextResponse.json({ error: "Le certificat n'est pas encore délivré." }, { status: 400 });
  }

  const pdfBuffer: Buffer = await new Promise((resolve, reject) => {
    const doc = new PDFDocument({ size: "A4", layout: "landscape", margin: 0 });
    const chunks: Buffer[] = [];
    doc.on("data", (c) => chunks.push(c));
    doc.on("end", () => resolve(Buffer.concat(chunks)));
    doc.on("error", reject);

    const W = doc.page.width;
    const H = doc.page.height;
    const ink = "#0B1220";
    const gold = "#F2B705";
    const blue = "#2F6FED";

    // Fond et bordure
    doc.rect(0, 0, W, H).fill("#FFFFFF");
    doc.rect(24, 24, W - 48, H - 48).lineWidth(2).stroke(ink);
    doc.rect(34, 34, W - 68, H - 68).lineWidth(0.75).stroke(gold);

    doc.fillColor(blue).fontSize(12).font("Helvetica-Bold")
      .text("MADES FORMATION CONTINUE", 0, 70, { align: "center", characterSpacing: 3 });

    doc.fillColor(ink).fontSize(34).font("Helvetica-Bold")
      .text("CERTIFICAT DE FORMATION", 0, 110, { align: "center" });

    doc.fillColor("#555555").fontSize(12).font("Helvetica")
      .text("Ce certificat est décerné à", 0, 175, { align: "center" });

    doc.fillColor(ink).fontSize(28).font("Helvetica-Bold")
      .text(enrollment.learnerName, 0, 200, { align: "center" });

    doc.fillColor("#555555").fontSize(13).font("Helvetica")
      .text("pour avoir suivi avec succès la formation", 0, 250, { align: "center" });

    doc.fillColor(gold).fontSize(20).font("Helvetica-Bold")
      .text(
        `${DISCIPLINE_LABEL[enrollment.discipline] ?? enrollment.discipline} — Niveau ${LEVEL_LABEL[enrollment.level] ?? enrollment.level}`,
        0, 280, { align: "center" }
      );

    doc.fillColor(ink).fontSize(14).font("Helvetica-Bold")
      .text(enrollment.formationTitle, 0, 312, { align: "center" });

    doc.fillColor("#555555").fontSize(11).font("Helvetica")
      .text(
        `${enrollment.durationHours} heures de formation · du ${enrollment.sessionStartDate} au ${enrollment.sessionEndDate}`,
        0, 340, { align: "center" }
      );

    const bottomY = H - 90;
    doc.fontSize(9).fillColor("#888888")
      .text(`Certificat n° ${enrollment.id}`, 60, bottomY)
      .text(`Délivré le ${new Date().toLocaleDateString("fr-FR")}`, 60, bottomY + 14);

    doc.fontSize(10).fillColor(ink).font("Helvetica-Bold")
      .text("Direction pédagogique MADES", W - 260, bottomY + 6, { width: 200, align: "right" });

    doc.end();
  });

  return new NextResponse(new Uint8Array(pdfBuffer), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="certificat-${enrollment.id}.pdf"`,
    },
  });
}
