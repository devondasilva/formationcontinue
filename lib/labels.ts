import type {
  Discipline,
  EnrollmentStatus,
  Format,
  Level,
  PaymentMethod,
  SessionStatus,
} from "./types";

/** Libellés partagés — une seule source de vérité pour toute l'interface. */

/** Les 5 modules sportifs, présents à chaque niveau. */
export const DISCIPLINES: Discipline[] = ["tennis", "beach-tennis", "padel", "mini-tennis", "pickleball"];
export const LEVELS: Level[] = ["jes1", "jes2", "entraineur", "de"];
export const FORMATS: Format[] = ["presentiel", "distanciel", "hybride"];

export const DISCIPLINE_LABEL: Record<Discipline, string> = {
  tennis: "Tennis",
  "beach-tennis": "Beach Tennis",
  padel: "Padel",
  "mini-tennis": "Mini-Tennis",
  pickleball: "Pickleball",
};

export const DISCIPLINE_DESC: Record<Discipline, string> = {
  tennis: "La discipline fondatrice : technique, tactique et accompagnement des joueurs.",
  "beach-tennis": "Le jeu sur sable, en plein essor sur les plages d'Afrique de l'Ouest.",
  padel: "Jeu en double, parois vitrées, pédagogie de la découverte : un sport en forte croissance.",
  "mini-tennis": "Encadrer les 4–10 ans avec du matériel et une pédagogie adaptés.",
  pickleball: "Raquette pleine, balle perforée, terrain réduit : accessible à tous les âges.",
};

export const LEVEL_LABEL: Record<Level, string> = {
  jes1: "JES Niveau 1",
  jes2: "JES Niveau 2",
  entraineur: "Entraîneur sports de raquette",
  de: "Diplôme d'État",
};

/** Libellé court (pastilles, graphiques). */
export const LEVEL_SHORT: Record<Level, string> = {
  jes1: "JES 1",
  jes2: "JES 2",
  entraineur: "Entraîneur",
  de: "DE",
};

/** Sous-titre explicatif du sigle. */
export const LEVEL_SUB: Record<Level, string> = {
  jes1: "Jeune Éducateur de Sport",
  jes2: "Jeune Éducateur de Sport",
  entraineur: "Préparer à la compétition",
  de: "Avec nos partenaires",
};

export const LEVEL_DESC: Record<Level, string> = {
  jes1: "Encadrer en sécurité une première séance dans chaque sport de raquette.",
  jes2: "Conduire des cycles complets et animer des groupes de tous âges.",
  entraineur: "Entraîner et préparer des joueurs à la compétition.",
  de: "Diriger une structure et former des formateurs, avec nos partenaires.",
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
