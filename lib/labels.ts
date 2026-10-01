import type {
  Discipline,
  EnrollmentStatus,
  Format,
  Level,
  PaymentMethod,
  SessionStatus,
} from "./types";

/** Libellés partagés — une seule source de vérité pour toute l'interface. */

export const DISCIPLINES: Discipline[] = ["tennis", "beach-tennis", "padel", "mini-tennis"];
export const LEVELS: Level[] = ["initiateur", "animateur", "entraineur", "de"];
export const FORMATS: Format[] = ["presentiel", "distanciel", "hybride"];

export const DISCIPLINE_LABEL: Record<Discipline, string> = {
  "beach-tennis": "Beach Tennis",
  padel: "Padel",
  tennis: "Tennis",
  "mini-tennis": "Mini-Tennis",
};

export const DISCIPLINE_DESC: Record<Discipline, string> = {
  tennis: "La discipline fondatrice : technique, tactique et accompagnement de joueurs confirmés.",
  "beach-tennis": "Du premier contact avec le sable jusqu'au Diplôme d'État, une discipline en plein essor.",
  padel: "Jeu en double, parois vitrées, pédagogie de la découverte : un sport en forte croissance.",
  "mini-tennis": "Encadrer les 4–10 ans avec du matériel et une pédagogie adaptés.",
};

export const LEVEL_LABEL: Record<Level, string> = {
  initiateur: "Initiateur",
  animateur: "Animateur",
  entraineur: "Entraîneur",
  de: "Diplôme d'État",
};

export const LEVEL_DESC: Record<Level, string> = {
  initiateur: "Encadrer une première séance de découverte",
  animateur: "Conduire un cycle complet de progression",
  entraineur: "Préparer des joueurs à la compétition",
  de: "Diriger une structure, former des formateurs",
};

export const FORMAT_LABEL: Record<Format, string> = {
  presentiel: "Présentiel",
  distanciel: "Distanciel",
  hybride: "Hybride",
};

export const PAYMENT_LABEL: Record<PaymentMethod, string> = {
  mtn_momo: "MTN Mobile Money",
  moov_money: "Moov Money",
  carte_bancaire: "Carte bancaire",
  virement: "Virement bancaire",
};

export const ENROLLMENT_STATUS_LABEL: Record<EnrollmentStatus, string> = {
  en_attente: "En attente",
  confirmee: "Confirmée",
  terminee: "Terminée",
  annulee: "Annulée",
};

export const SESSION_STATUS_LABEL: Record<SessionStatus, string> = {
  ouverte: "Places disponibles",
  complete: "Complet",
  terminee: "Terminée",
  annulee: "Annulée",
};

export type Tone = "orange" | "ink" | "success" | "danger" | "muted";

export const ENROLLMENT_STATUS_TONE: Record<EnrollmentStatus, Tone> = {
  en_attente: "orange",
  confirmee: "ink",
  terminee: "success",
  annulee: "danger",
};

export const SESSION_STATUS_TONE: Record<SessionStatus, Tone> = {
  ouverte: "success",
  complete: "orange",
  terminee: "muted",
  annulee: "danger",
};

const MONTHS = ["janv.", "févr.", "mars", "avr.", "mai", "juin", "juil.", "août", "sept.", "oct.", "nov.", "déc."];

/** "2026-11-03" → "3 nov. 2026" (sans dépendre du fuseau du navigateur). */
export function formatDate(iso: string): string {
  const [y, m, d] = iso.slice(0, 10).split("-").map(Number);
  if (!y || !m || !d) return iso;
  return `${d} ${MONTHS[m - 1]} ${y}`;
}

/** Plage de dates compacte : "3 → 7 nov. 2026". */
export function formatRange(start: string, end: string): string {
  const [ys, ms, ds] = start.split("-").map(Number);
  const [ye, me] = end.split("-").map(Number);
  if (ys === ye && ms === me) return `${ds} → ${formatDate(end)}`;
  return `${formatDate(start)} → ${formatDate(end)}`;
}

export function dateParts(iso: string): { day: string; month: string; year: string } {
  const [y, m, d] = iso.split("-").map(Number);
  return { day: String(d).padStart(2, "0"), month: MONTHS[(m || 1) - 1], year: String(y) };
}
