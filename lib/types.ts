export type Discipline = "beach-tennis" | "padel" | "tennis" | "mini-tennis";

// Parcours progressif inspiré du schéma des diplômes d'État français
// (initiateur -> animateur -> entraîneur -> Diplôme d'État).
export type Level = "initiateur" | "animateur" | "entraineur" | "de";

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

export interface Formation {
  id: string;
  title: string;
  discipline: Discipline;
  level: Level;
  format: Format;
  description: string;
  durationHours: number;
  prerequisites: string;
  certification: string; // ex. "Certificat Initiateur Beach Tennis MADES"
  syllabus: string[];
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
  discipline: Discipline;
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
