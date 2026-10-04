/**
 * Module sportif enseigné à chaque niveau de formation
 * (le nom de type « Discipline » est conservé pour la compatibilité du code).
 */
export type Discipline = "tennis" | "beach-tennis" | "padel" | "mini-tennis" | "pickleball";

/**
 * Les 4 niveaux de formation MADES :
 * JES Niveau 1 → JES Niveau 2 → Entraîneur sports de raquette → Diplôme d'État (avec partenaires).
 */
export type Level = "jes1" | "jes2" | "entraineur" | "de";

export type Format = "presentiel" | "distanciel" | "hybride";

export type Currency = "FCFA" | "EUR" | "USD";
export type PaymentMethod = "mtn_momo" | "moov_money" | "carte_bancaire" | "virement";

export type UserRole = "admin" | "learner";

export interface Admin {
  id: string;
  username: string;
  name: string;
  passwordHash: string;
  passwordSalt: string;
  createdAt: string;
}

export interface SessionPayload {
  role: UserRole;
  id: string;
  name: string;
  exp: number;
}

export interface Learner {
  id: string;
  name: string;
  email: string;
  phone: string;
  createdAt: string;
}

/** Un module sportif à l'intérieur d'un niveau de formation. */
export interface FormationModule {
  discipline: Discipline;
  hours: number;
  topics: string[];
}

/** Une formation = un niveau complet ; l'inscription, le prix et le certificat portent sur le niveau. */
export interface Formation {
  id: string;
  title: string;
  level: Level;
  format: Format;
  description: string;
  durationHours: number;
  prerequisites: string;
  certification: string; // ex. "Certificat JES Niveau 1 — MADES"
  /** Modules sportifs du niveau (beach tennis, padel, mini-tennis, pickleball, tennis). */
  modules: FormationModule[];
  /** Tronc commun : contenus transversaux (pédagogie, sécurité, éthique…). */
  syllabus: string[];
  /** Mention de partenariat, ex. « Délivré en partenariat avec … » (surtout pour le DE). */
  partners?: string;
  priceFCFA: number;
  active: boolean;
  createdAt: string;
}

export type SessionStatus = "ouverte" | "complete" | "terminee" | "annulee";

export interface TrainingSession {
  id: string;
  formationId: string;
  formationTitle: string;
  startDate: string; // YYYY-MM-DD
  endDate: string; // YYYY-MM-DD
  location: string;
  instructor: string;
  capacity: number;
  status: SessionStatus;
  createdAt: string;
}

export type EnrollmentStatus = "en_attente" | "confirmee" | "terminee" | "annulee";

export interface Enrollment {
  id: string;
  learnerId: string;
  learnerName: string;
  sessionId: string;
  formationId: string;
  formationTitle: string;
  level: Level;
  durationHours: number;
  sessionStartDate: string;
  sessionEndDate: string;
  amountFCFA: number;
  currency: Currency;
  paymentMethod: PaymentMethod;
  status: EnrollmentStatus;
  certificateIssued: boolean;
  createdAt: string;
}

export interface Review {
  id: string;
  formationId: string;
  learnerId: string;
  learnerName: string;
  rating: number; // 1 à 5
  comment: string;
  createdAt: string;
}

export interface ExchangeRates {
  fcfaPerUnit: { EUR: number; USD: number };
  updatedAt: string;
}

/** Fiche technique (PDF, Word, Excel, image…) attachée à une formation, téléchargeable par les candidats. */
export interface FormationDocument {
  id: string;
  formationId: string;
  title: string;
  /** Module sportif concerné ; absent = document général du niveau. */
  discipline?: Discipline;
  fileName: string; // nom du fichier stocké dans data/uploads/docs
  originalName: string;
  mimeType: string;
  size: number; // octets
  createdAt: string;
}
