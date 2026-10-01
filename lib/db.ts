import fs from "fs";
import path from "path";
import {
  Admin,
  Learner,
  Formation,
  TrainingSession,
  SessionStatus,
  Enrollment,
  EnrollmentStatus,
  Review,
  ExchangeRates,
  Level,
} from "./types";
import { hashPassword, verifyPassword } from "./password";

const dataDir = path.join(process.cwd(), "data");

function readJSON<T>(file: string): T {
  const filePath = path.join(dataDir, file);
  const raw = fs.readFileSync(filePath, "utf-8");
  return JSON.parse(raw) as T;
}

function writeJSON<T>(file: string, value: T): void {
  const filePath = path.join(dataDir, file);
  fs.writeFileSync(filePath, JSON.stringify(value, null, 2), "utf-8");
}

function newId(prefix: string): string {
  return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`;
}

// ---------- Admins ----------
export function getAdmins(): Admin[] {
  return readJSON<Admin[]>("admins.json");
}

export function verifyAdminCredentials(username: string, password: string): Admin | null {
  const admin = getAdmins().find((a) => a.username === username.trim());
  if (!admin) return null;
  return verifyPassword(password, admin.passwordHash, admin.passwordSalt) ? admin : null;
}

export type PublicAdmin = Omit<Admin, "passwordHash" | "passwordSalt">;

export function toPublicAdmin(a: Admin): PublicAdmin {
  const { passwordHash: _h, passwordSalt: _s, ...rest } = a;
  return rest;
}

export function createAdmin(username: string, name: string, password: string): Admin | null {
  const admins = getAdmins();
  const u = username.trim();
  if (admins.some((a) => a.username === u)) return null;
  const { hash, salt } = hashPassword(password);
  const admin: Admin = {
    id: newId("admin"),
    username: u,
    name: name.trim() || u,
    passwordHash: hash,
    passwordSalt: salt,
    createdAt: new Date().toISOString(),
  };
  admins.push(admin);
  writeJSON("admins.json", admins);
  return admin;
}

/** Refuse de supprimer le dernier administrateur restant. */
export function deleteAdmin(id: string): boolean {
  const admins = getAdmins();
  if (admins.length <= 1) return false;
  const next = admins.filter((a) => a.id !== id);
  if (next.length === admins.length) return false;
  writeJSON("admins.json", next);
  return true;
}

export function changeAdminPassword(id: string, current: string, next: string): "ok" | "bad-current" | "not-found" {
  const admins = getAdmins();
  const idx = admins.findIndex((a) => a.id === id);
  if (idx < 0) return "not-found";
  const a = admins[idx];
  if (!verifyPassword(current, a.passwordHash, a.passwordSalt)) return "bad-current";
  const { hash, salt } = hashPassword(next);
  admins[idx] = { ...a, passwordHash: hash, passwordSalt: salt };
  writeJSON("admins.json", admins);
  return "ok";
}

// ---------- Apprenants ----------
export function getLearners(): Learner[] {
  return readJSON<Learner[]>("learners.json");
}

export function getLearnerById(id: string): Learner | undefined {
  return getLearners().find((l) => l.id === id);
}

export function findOrCreateLearner(name: string, email: string, phone: string): Learner {
  const learners = getLearners();
  const existing = learners.find((l) => l.email === email.trim().toLowerCase());
  if (existing) return existing;
  const learner: Learner = {
    id: newId("lrn"),
    name: name.trim(),
    email: email.trim().toLowerCase(),
    phone: phone.trim(),
    createdAt: new Date().toISOString(),
  };
  learners.push(learner);
  writeJSON("learners.json", learners);
  return learner;
}

// ---------- Formations ----------
export function getFormations(): Formation[] {
  return readJSON<Formation[]>("formations.json");
}

export function getFormationById(id: string): Formation | undefined {
  return getFormations().find((f) => f.id === id);
}

export function createFormation(formation: Omit<Formation, "id" | "createdAt">): Formation {
  const formations = getFormations();
  const full: Formation = { ...formation, id: newId("frm"), createdAt: new Date().toISOString() };
  formations.push(full);
  writeJSON("formations.json", formations);
  return full;
}

export function updateFormation(
  id: string,
  patch: Partial<Omit<Formation, "id" | "createdAt">>
): Formation | undefined {
  const formations = getFormations();
  const idx = formations.findIndex((f) => f.id === id);
  if (idx === -1) return undefined;
  formations[idx] = { ...formations[idx], ...patch };
  writeJSON("formations.json", formations);
  return formations[idx];
}

export function deleteFormation(id: string): boolean {
  const formations = getFormations();
  const next = formations.filter((f) => f.id !== id);
  if (next.length === formations.length) return false;
  writeJSON("formations.json", next);
  return true;
}

// ---------- Sessions de formation ----------
export function getSessions(): TrainingSession[] {
  return readJSON<TrainingSession[]>("sessions.json");
}

export function getSessionById(id: string): TrainingSession | undefined {
  return getSessions().find((s) => s.id === id);
}

export function getSessionsByFormation(formationId: string): TrainingSession[] {
  return getSessions().filter((s) => s.formationId === formationId);
}

export function createSession(session: Omit<TrainingSession, "id" | "createdAt">): TrainingSession {
  const sessions = getSessions();
  const full: TrainingSession = { ...session, id: newId("ses"), createdAt: new Date().toISOString() };
  sessions.push(full);
  writeJSON("sessions.json", sessions);
  return full;
}

export function updateSession(
  id: string,
  patch: Partial<Omit<TrainingSession, "id" | "createdAt">>
): TrainingSession | undefined {
  const sessions = getSessions();
  const idx = sessions.findIndex((s) => s.id === id);
  if (idx === -1) return undefined;
  sessions[idx] = { ...sessions[idx], ...patch };
  writeJSON("sessions.json", sessions);
  return sessions[idx];
}

export function deleteSession(id: string): boolean {
  const sessions = getSessions();
  const next = sessions.filter((s) => s.id !== id);
  if (next.length === sessions.length) return false;
  writeJSON("sessions.json", next);
  return true;
}

export function getEnrolledCount(sessionId: string): number {
  return getEnrollments().filter(
    (e) => e.sessionId === sessionId && e.status !== "annulee"
  ).length;
}

// ---------- Inscriptions ----------
export function getEnrollments(): Enrollment[] {
  return readJSON<Enrollment[]>("enrollments.json");
}

export function getEnrollmentsByLearner(learnerId: string): Enrollment[] {
  return getEnrollments()
    .filter((e) => e.learnerId === learnerId)
    .sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1));
}

export function createEnrollment(
  enrollment: Omit<Enrollment, "id" | "createdAt" | "status" | "certificateIssued">
): Enrollment {
  const enrollments = getEnrollments();
  const full: Enrollment = {
    ...enrollment,
    status: "en_attente",
    certificateIssued: false,
    id: newId("enr"),
    createdAt: new Date().toISOString(),
  };
  enrollments.push(full);
  writeJSON("enrollments.json", enrollments);
  return full;
}

export function updateEnrollmentStatus(id: string, status: EnrollmentStatus): Enrollment | undefined {
  const enrollments = getEnrollments();
  const idx = enrollments.findIndex((e) => e.id === id);
  if (idx === -1) return undefined;
  enrollments[idx].status = status;
  if (status === "terminee") enrollments[idx].certificateIssued = true;
  writeJSON("enrollments.json", enrollments);
  return enrollments[idx];
}

export function getEnrollmentById(id: string): Enrollment | undefined {
  return getEnrollments().find((e) => e.id === id);
}

// ---------- Avis ----------
export function getReviews(): Review[] {
  return readJSON<Review[]>("reviews.json");
}

export function getReviewsByFormation(formationId: string): Review[] {
  return getReviews()
    .filter((r) => r.formationId === formationId)
    .sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1));
}

export function getFormationRating(formationId: string): { average: number; count: number } {
  const reviews = getReviewsByFormation(formationId);
  if (reviews.length === 0) return { average: 0, count: 0 };
  const sum = reviews.reduce((s, r) => s + r.rating, 0);
  return { average: Math.round((sum / reviews.length) * 10) / 10, count: reviews.length };
}

export function createReview(review: Omit<Review, "id" | "createdAt">): Review {
  const reviews = getReviews();
  const full: Review = { ...review, id: newId("rv"), createdAt: new Date().toISOString() };
  reviews.push(full);
  writeJSON("reviews.json", reviews);
  return full;
}

export function deleteReview(id: string): boolean {
  const reviews = getReviews();
  const next = reviews.filter((r) => r.id !== id);
  if (next.length === reviews.length) return false;
  writeJSON("reviews.json", next);
  return true;
}

// ---------- Taux de change ----------
export function getRates(): ExchangeRates {
  return readJSON<ExchangeRates>("rates.json");
}

export function updateRates(rates: { EUR: number; USD: number }): ExchangeRates {
  const full: ExchangeRates = { fcfaPerUnit: rates, updatedAt: new Date().toISOString() };
  writeJSON("rates.json", full);
  return full;
}

// ---------- Parcours / progression ----------
export const LEVEL_ORDER: Level[] = ["initiateur", "animateur", "entraineur", "de"];

export function getLearnerProgress(learnerId: string) {
  const enrollments = getEnrollmentsByLearner(learnerId).filter((e) => e.status === "terminee");
  const byDiscipline: Record<string, Level[]> = {};
  for (const e of enrollments) {
    if (!byDiscipline[e.discipline]) byDiscipline[e.discipline] = [];
    if (!byDiscipline[e.discipline].includes(e.level)) byDiscipline[e.discipline].push(e.level);
  }
  const totalHours = enrollments.reduce((s, e) => s + e.durationHours, 0);
  return { byDiscipline, totalHours, completedCount: enrollments.length };
}
