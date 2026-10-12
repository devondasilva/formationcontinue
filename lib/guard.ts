import { NextResponse } from "next/server";
import type { Actor, ClubStatus, Discipline, EquipmentItem, PublicCoach, SessionPayload } from "./types";
import { DISCIPLINES } from "./labels";
import { getCoachById } from "./network";

/** Auteur d'une action, à partir de la session. */
export function actorOf(s: SessionPayload): Actor {
  return { role: s.role, id: s.id, name: s.name };
}

export const deny = (msg = "Accès refusé.", status = 403) => NextResponse.json({ error: msg }, { status });
export const bad = (msg: string) => NextResponse.json({ error: msg }, { status: 400 });
export const notFound = (msg = "Introuvable.") => NextResponse.json({ error: msg }, { status: 404 });

/** Coach actif correspondant à la session (null si désactivé ou supprimé). */
export function activeCoach(s: SessionPayload): PublicCoach | null {
  if (s.role !== "coach") return null;
  const c = getCoachById(s.id);
  return c && c.active ? c : null;
}

/**
 * Un coach peut agir sur un matériel de son club s'il en est responsable,
 * ou s'il est « responsable matériel » du club (il gère tout le parc).
 */
export function coachCanManage(coach: PublicCoach, item: EquipmentItem): boolean {
  if (item.clubId !== coach.clubId) return false;
  return coach.isEquipmentManager || item.responsibleCoachId === coach.id;
}

export function str(v: unknown, max = 300): string {
  return typeof v === "string" ? v.trim().slice(0, max) : "";
}
export function num(v: unknown, min = 0, max = 1_000_000_000): number {
  const n = Number(v);
  if (!Number.isFinite(n)) return min;
  return Math.max(min, Math.min(max, n));
}
export function isDate(v: unknown): v is string {
  return typeof v === "string" && /^\d{4}-\d{2}-\d{2}$/.test(v);
}

/** Lecture et nettoyage d'un formulaire de club partenaire. */
export function parseClub(b: Record<string, unknown>) {
  const status = (["actif", "en_convention", "suspendu"] as ClubStatus[]).includes(b.status as ClubStatus) ? (b.status as ClubStatus) : "en_convention";
  const disciplines = Array.isArray(b.disciplines) ? (b.disciplines.filter((d) => (DISCIPLINES as string[]).includes(d as string)) as Discipline[]) : [];
  return {
    name: str(b.name, 120),
    city: str(b.city, 80),
    address: str(b.address, 200),
    phone: str(b.phone, 40),
    email: str(b.email, 120),
    contactName: str(b.contactName, 120),
    disciplines,
    alternanceCapacity: Math.round(num(b.alternanceCapacity, 0, 200)),
    status,
    conventionStart: isDate(b.conventionStart) ? b.conventionStart : undefined,
    conventionEnd: isDate(b.conventionEnd) ? b.conventionEnd : undefined,
    notes: str(b.notes, 2000) || undefined,
  };
}

