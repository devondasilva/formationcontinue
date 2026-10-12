import type {
  ClubStatus,
  EquipmentCategory,
  EquipmentCondition,
  EquipmentOrigin,
  EquipmentStatus,
  InventoryStatus,
  LogStatus,
  MovementType,
  PhotoKind,
  PlacementResult,
  PlacementStatus,
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


/* ================================================================== */
/*  Réseau : clubs, matériel, inventaires, alternance                 */
/* ================================================================== */

/** Délai au-delà duquel un inventaire est considéré en retard (jours). */
export const INVENTORY_MAX_AGE_DAYS = 90;

export const CLUB_STATUS_LABEL: Record<ClubStatus, string> = {
  actif: "Partenaire actif",
  en_convention: "Convention en cours",
  suspendu: "Suspendu",
};
export const CLUB_STATUS_TONE: Record<ClubStatus, Tone> = { actif: "success", en_convention: "orange", suspendu: "muted" };

export const EQUIPMENT_CATEGORIES: EquipmentCategory[] = [
  "raquettes",
  "balles",
  "filets_poteaux",
  "marquage",
  "coordination",
  "lance_balles",
  "mini_tennis",
  "rangement",
  "securite",
  "numerique",
  "autre",
];

export const CATEGORY_LABEL: Record<EquipmentCategory, string> = {
  raquettes: "Raquettes",
  balles: "Balles",
  filets_poteaux: "Filets & poteaux",
  marquage: "Plots & marquage",
  coordination: "Coordination & motricité",
  lance_balles: "Lance-balles",
  mini_tennis: "Kit mini-tennis",
  rangement: "Chariots & rangement",
  securite: "Sécurité & secours",
  numerique: "Numérique (tablette, caméra)",
  autre: "Autre",
};

/** Unité suggérée selon la catégorie. */
export const CATEGORY_UNIT: Record<EquipmentCategory, string> = {
  raquettes: "pièce",
  balles: "carton",
  filets_poteaux: "lot",
  marquage: "lot",
  coordination: "lot",
  lance_balles: "pièce",
  mini_tennis: "kit",
  rangement: "pièce",
  securite: "trousse",
  numerique: "pièce",
  autre: "pièce",
};

export const EQUIPMENT_CONDITIONS: EquipmentCondition[] = ["neuf", "bon", "use", "a_reparer", "hors_service"];
export const CONDITION_LABEL: Record<EquipmentCondition, string> = {
  neuf: "Neuf",
  bon: "Bon état",
  use: "Usé",
  a_reparer: "À réparer",
  hors_service: "Hors service",
};
export const CONDITION_TONE: Record<EquipmentCondition, Tone> = {
  neuf: "success",
  bon: "success",
  use: "orange",
  a_reparer: "danger",
  hors_service: "danger",
};

export const EQUIPMENT_STATUS_LABEL: Record<EquipmentStatus, string> = {
  en_service: "En service",
  en_reparation: "En réparation",
  perdu: "Perdu / volé",
  reforme: "Réformé",
};
export const EQUIPMENT_STATUS_TONE: Record<EquipmentStatus, Tone> = {
  en_service: "ink",
  en_reparation: "orange",
  perdu: "danger",
  reforme: "muted",
};

export const ORIGIN_LABEL: Record<EquipmentOrigin, string> = {
  dotation_mades: "Dotation MADES",
  club: "Matériel du club",
  don_partenaire: "Don d'un partenaire",
};

export const MOVEMENT_LABEL: Record<MovementType, string> = {
  dotation: "Dotation",
  declaration: "Déclaration",
  modification: "Modification",
  transfert: "Transfert",
  responsable: "Changement de responsable",
  inventaire: "Inventaire",
  etat: "Changement d'état",
  incident: "Incident (casse, perte, vol)",
  reparation: "Réparation",
  reforme: "Réforme",
  photo: "Photo ajoutée",
};

export const INVENTORY_STATUS_LABEL: Record<InventoryStatus, string> = {
  soumis: "À valider",
  valide: "Validé",
  a_revoir: "À revoir",
};
export const INVENTORY_STATUS_TONE: Record<InventoryStatus, Tone> = { soumis: "orange", valide: "success", a_revoir: "danger" };

export const PHOTO_KIND_LABEL: Record<PhotoKind, string> = {
  etat: "État",
  dotation: "Réception / dotation",
  inventaire: "Inventaire",
  incident: "Incident",
  reparation: "Réparation",
};

export const PLACEMENT_STATUS_LABEL: Record<PlacementStatus, string> = {
  planifie: "Planifiée",
  en_cours: "En cours",
  termine: "Terminée",
  interrompu: "Interrompue",
};
export const PLACEMENT_STATUS_TONE: Record<PlacementStatus, Tone> = {
  planifie: "muted",
  en_cours: "orange",
  termine: "success",
  interrompu: "danger",
};

export const PLACEMENT_RESULT_LABEL: Record<PlacementResult, string> = {
  acquis: "Compétences acquises",
  en_cours_acquisition: "En cours d'acquisition",
  non_acquis: "Non acquises",
};
export const PLACEMENT_RESULT_TONE: Record<PlacementResult, Tone> = {
  acquis: "success",
  en_cours_acquisition: "orange",
  non_acquis: "danger",
};

export const LOG_STATUS_LABEL: Record<LogStatus, string> = { a_valider: "À valider", valide: "Validée", refuse: "Refusée" };
export const LOG_STATUS_TONE: Record<LogStatus, Tone> = { a_valider: "orange", valide: "success", refuse: "danger" };

/** Nombre de jours écoulés depuis une date ISO (null si absente). */
export function daysSince(iso?: string | null): number | null {
  if (!iso) return null;
  const t = new Date(iso.length <= 10 ? `${iso}T12:00:00` : iso).getTime();
  if (Number.isNaN(t)) return null;
  return Math.floor((Date.now() - t) / 86_400_000);
}

export function formatFCFA(n: number): string {
  return `${Math.round(n).toLocaleString("fr-FR").replace(/\u202f/g, " ")} FCFA`;
}
