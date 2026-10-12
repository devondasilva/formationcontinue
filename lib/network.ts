/**
 * Réseau MADES Formation Continue : clubs partenaires, coachs (tuteurs /
 * responsables matériel), matériel doté, inventaires, photos de preuve et
 * alternance des apprenants.
 *
 * Même principe que lib/db.ts : stockage JSON sous /data, couche isolée
 * remplaçable par une vraie base sans toucher aux routes ni aux pages.
 * Toute modification de matériel est historisée (journal des mouvements).
 */
import fs from "fs";
import path from "path";
import crypto from "crypto";
import type {
  Actor,
  AlternanceLog,
  Coach,
  EquipmentCondition,
  EquipmentItem,
  EquipmentMovement,
  EquipmentPhoto,
  Inventory,
  InventoryLine,
  LogStatus,
  PartnerClub,
  Placement,
  PlacementStatus,
  PublicCoach,
} from "./types";
import { hashPassword, verifyPassword } from "./password";
import { INVENTORY_MAX_AGE_DAYS, daysSince } from "./labels";

const dataDir = path.join(process.cwd(), "data");
export const PHOTOS_DIR = path.join(dataDir, "uploads", "photos");

function read<T>(file: string): T[] {
  try {
    return JSON.parse(fs.readFileSync(path.join(dataDir, file), "utf-8")) as T[];
  } catch {
    return [];
  }
}
function write<T>(file: string, value: T[]): void {
  fs.writeFileSync(path.join(dataDir, file), JSON.stringify(value, null, 2), "utf-8");
}
function newId(prefix: string): string {
  return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`;
}
const now = () => new Date().toISOString();
const today = () => new Date().toISOString().slice(0, 10);

/* ------------------------------------------------------------------ */
/*  Clubs partenaires                                                  */
/* ------------------------------------------------------------------ */

export function getClubs(): PartnerClub[] {
  return read<PartnerClub>("clubs.json").sort((a, b) => a.name.localeCompare(b.name, "fr"));
}
export function getClubById(id: string): PartnerClub | undefined {
  return getClubs().find((c) => c.id === id);
}
export function createClub(data: Omit<PartnerClub, "id" | "createdAt">): PartnerClub {
  const list = read<PartnerClub>("clubs.json");
  const club: PartnerClub = { ...data, id: newId("club"), createdAt: now() };
  list.push(club);
  write("clubs.json", list);
  return club;
}
export function updateClub(id: string, patch: Partial<Omit<PartnerClub, "id" | "createdAt">>): PartnerClub | undefined {
  const list = read<PartnerClub>("clubs.json");
  const i = list.findIndex((c) => c.id === id);
  if (i < 0) return undefined;
  list[i] = { ...list[i], ...patch };
  write("clubs.json", list);
  return list[i];
}
/** Refuse la suppression d'un club qui porte encore du matériel, des coachs ou des alternances. */
export function deleteClub(id: string): "ok" | "not-found" | "in-use" {
  const list = read<PartnerClub>("clubs.json");
  if (!list.some((c) => c.id === id)) return "not-found";
  const used =
    getEquipment().some((e) => e.clubId === id && e.status !== "reforme") ||
    getCoaches().some((c) => c.clubId === id) ||
    getPlacements().some((p) => p.clubId === id);
  if (used) return "in-use";
  write("clubs.json", list.filter((c) => c.id !== id));
  return "ok";
}

/* ------------------------------------------------------------------ */
/*  Coachs                                                             */
/* ------------------------------------------------------------------ */

function readCoaches(): Coach[] {
  return read<Coach>("coaches.json");
}
export function toPublicCoach(c: Coach): PublicCoach {
  const { passwordHash: _h, passwordSalt: _s, ...rest } = c;
  return rest;
}
export function getCoaches(): PublicCoach[] {
  return readCoaches()
    .map(toPublicCoach)
    .sort((a, b) => a.name.localeCompare(b.name, "fr"));
}
export function getCoachById(id: string): PublicCoach | undefined {
  const c = readCoaches().find((x) => x.id === id);
  return c ? toPublicCoach(c) : undefined;
}

/** Mot de passe provisoire lisible (sans caractères ambigus), à transmettre au coach. */
export function generateTempPassword(): string {
  const alphabet = "ABCDEFGHJKMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789";
  const bytes = crypto.randomBytes(10);
  let out = "";
  for (let i = 0; i < 10; i++) out += alphabet[bytes[i] % alphabet.length];
  return `${out.slice(0, 5)}-${out.slice(5)}`;
}

export function createCoach(
  data: Pick<Coach, "name" | "email" | "phone" | "clubId" | "isTutor" | "isEquipmentManager">
): { coach: PublicCoach; tempPassword: string } | "email-taken" {
  const list = readCoaches();
  const email = data.email.trim().toLowerCase();
  if (list.some((c) => c.email === email)) return "email-taken";
  const tempPassword = generateTempPassword();
  const { hash, salt } = hashPassword(tempPassword);
  const coach: Coach = {
    ...data,
    name: data.name.trim(),
    email,
    phone: data.phone.trim(),
    active: true,
    passwordHash: hash,
    passwordSalt: salt,
    mustChangePassword: true,
    id: newId("coach"),
    createdAt: now(),
  };
  list.push(coach);
  write("coaches.json", list);
  return { coach: toPublicCoach(coach), tempPassword };
}

export function updateCoach(
  id: string,
  patch: Partial<Pick<Coach, "name" | "email" | "phone" | "clubId" | "isTutor" | "isEquipmentManager" | "active">>
): PublicCoach | "email-taken" | undefined {
  const list = readCoaches();
  const i = list.findIndex((c) => c.id === id);
  if (i < 0) return undefined;
  if (patch.email) {
    const email = patch.email.trim().toLowerCase();
    if (list.some((c) => c.email === email && c.id !== id)) return "email-taken";
    patch.email = email;
  }
  const prevClub = list[i].clubId;
  list[i] = { ...list[i], ...patch };
  write("coaches.json", list);
  // Changement de club : le matériel de l'ancien club n'est plus sous sa responsabilité.
  if (patch.clubId && patch.clubId !== prevClub) {
    const items = read<EquipmentItem>("equipment.json");
    let changed = false;
    for (const it of items)
      if (it.responsibleCoachId === id && it.clubId === prevClub) {
        it.responsibleCoachId = null;
        it.updatedAt = now();
        changed = true;
      }
    if (changed) write("equipment.json", items);
  }
  return toPublicCoach(list[i]);
}

export function resetCoachPassword(id: string): string | undefined {
  const list = readCoaches();
  const i = list.findIndex((c) => c.id === id);
  if (i < 0) return undefined;
  const tempPassword = generateTempPassword();
  const { hash, salt } = hashPassword(tempPassword);
  list[i] = { ...list[i], passwordHash: hash, passwordSalt: salt, mustChangePassword: true };
  write("coaches.json", list);
  return tempPassword;
}

export function changeCoachPassword(id: string, current: string, next: string): "ok" | "bad-current" | "not-found" {
  const list = readCoaches();
  const i = list.findIndex((c) => c.id === id);
  if (i < 0) return "not-found";
  if (!verifyPassword(current, list[i].passwordHash, list[i].passwordSalt)) return "bad-current";
  const { hash, salt } = hashPassword(next);
  list[i] = { ...list[i], passwordHash: hash, passwordSalt: salt, mustChangePassword: false };
  write("coaches.json", list);
  return "ok";
}

export function verifyCoachCredentials(email: string, password: string): PublicCoach | "inactive" | null {
  const list = readCoaches();
  const i = list.findIndex((c) => c.email === email.trim().toLowerCase());
  if (i < 0) return null;
  const c = list[i];
  if (!verifyPassword(password, c.passwordHash, c.passwordSalt)) return null;
  if (!c.active) return "inactive";
  list[i] = { ...c, lastLoginAt: now() };
  write("coaches.json", list);
  return toPublicCoach(list[i]);
}

/** Retire un coach : son matériel repasse « non attribué », ses alternances perdent leur tuteur (historique conservé). */
export function deleteCoach(id: string): boolean {
  const list = readCoaches();
  if (!list.some((c) => c.id === id)) return false;
  write("coaches.json", list.filter((c) => c.id !== id));
  const items = getEquipment();
  let touched = false;
  for (const it of items) if (it.responsibleCoachId === id) (it.responsibleCoachId = null), (touched = true);
  if (touched) write("equipment.json", items);
  const pls = getPlacements();
  let ptouched = false;
  for (const p of pls) if (p.tutorCoachId === id) (p.tutorCoachId = null), (ptouched = true);
  if (ptouched) write("placements.json", pls);
  return true;
}

/* ------------------------------------------------------------------ */
/*  Matériel + journal des mouvements                                  */
/* ------------------------------------------------------------------ */

export function getEquipment(): EquipmentItem[] {
  return read<EquipmentItem>("equipment.json");
}
export function getEquipmentById(id: string): EquipmentItem | undefined {
  return getEquipment().find((e) => e.id === id);
}
export function getMovements(): EquipmentMovement[] {
  return read<EquipmentMovement>("equipment-movements.json").sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1));
}

function logMovement(m: Omit<EquipmentMovement, "id" | "createdAt">): EquipmentMovement {
  const list = read<EquipmentMovement>("equipment-movements.json");
  const full: EquipmentMovement = { ...m, id: newId("mv"), createdAt: now() };
  list.push(full);
  write("equipment-movements.json", list);
  return full;
}

/** Code d'inventaire lisible et unique : MFC-<3 lettres du club>-<n°>. */
function nextCode(clubId: string, items: EquipmentItem[]): string {
  const club = getClubById(clubId);
  const prefix = (club?.city || club?.name || "CLB")
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^A-Za-z]/g, "")
    .slice(0, 3)
    .toUpperCase()
    .padEnd(3, "X");
  const nums = items
    .map((i) => i.code)
    .filter((c) => c.startsWith(`MFC-${prefix}-`))
    .map((c) => Number(c.split("-").pop()) || 0);
  const n = (nums.length ? Math.max(...nums) : 0) + 1;
  return `MFC-${prefix}-${String(n).padStart(4, "0")}`;
}

export type NewEquipment = Omit<EquipmentItem, "id" | "code" | "createdAt" | "updatedAt" | "lastInventoryAt" | "status"> & {
  status?: EquipmentItem["status"];
};

export function createEquipment(data: NewEquipment, by: Actor, note?: string): EquipmentItem {
  const items = getEquipment();
  const item: EquipmentItem = {
    ...data,
    status: data.status ?? "en_service",
    id: newId("eq"),
    code: nextCode(data.clubId, items),
    createdAt: now(),
    updatedAt: now(),
  };
  items.push(item);
  write("equipment.json", items);
  logMovement({
    itemId: item.id,
    itemName: item.name,
    clubId: item.clubId,
    type: by.role === "admin" && item.origin !== "club" ? "dotation" : "declaration",
    qtyAfter: item.quantity,
    conditionAfter: item.condition,
    toCoachId: item.responsibleCoachId,
    note,
    by,
  });
  return item;
}

/**
 * Met à jour un matériel et journalise automatiquement ce qui a changé
 * (quantité, état, club, responsable, statut).
 */
export function updateEquipment(
  id: string,
  patch: Partial<Omit<EquipmentItem, "id" | "code" | "createdAt" | "updatedAt">>,
  by: Actor,
  opts: { note?: string; type?: EquipmentMovement["type"]; photoIds?: string[] } = {}
): EquipmentItem | undefined {
  const items = getEquipment();
  const i = items.findIndex((e) => e.id === id);
  if (i < 0) return undefined;
  const before = items[i];
  // Ignore les clés explicitement indéfinies (patch partiel).
  for (const k of Object.keys(patch) as (keyof typeof patch)[]) if (patch[k] === undefined) delete patch[k];
  const after: EquipmentItem = { ...before, ...patch, updatedAt: now() };
  items[i] = after;
  write("equipment.json", items);

  const base = { itemId: id, itemName: after.name, clubId: after.clubId, by, note: opts.note, photoIds: opts.photoIds };
  if (patch.clubId && patch.clubId !== before.clubId) {
    logMovement({ ...base, type: "transfert", fromClubId: before.clubId, toClubId: after.clubId, fromCoachId: before.responsibleCoachId, toCoachId: after.responsibleCoachId });
  } else if (patch.responsibleCoachId !== undefined && patch.responsibleCoachId !== before.responsibleCoachId) {
    logMovement({ ...base, type: "responsable", fromCoachId: before.responsibleCoachId, toCoachId: after.responsibleCoachId });
  }
  const qtyChanged = patch.quantity !== undefined && patch.quantity !== before.quantity;
  const condChanged = patch.condition !== undefined && patch.condition !== before.condition;
  const statusChanged = patch.status !== undefined && patch.status !== before.status;
  if (qtyChanged || condChanged || statusChanged || opts.type) {
    const type =
      opts.type ??
      (patch.status === "reforme" ? "reforme" : (statusChanged && before.status === "en_reparation") || (condChanged && before.condition === "a_reparer" && (after.condition === "bon" || after.condition === "neuf")) ? "reparation" : condChanged && !qtyChanged ? "etat" : "modification");
    logMovement({
      ...base,
      type,
      qtyBefore: qtyChanged ? before.quantity : undefined,
      qtyAfter: qtyChanged ? after.quantity : undefined,
      conditionBefore: condChanged ? before.condition : undefined,
      conditionAfter: condChanged ? after.condition : undefined,
    });
  }
  return after;
}

/** Suppression définitive (erreur de saisie) ; préférer la réforme pour garder l'historique. */
export function deleteEquipment(id: string, by: Actor): boolean {
  const items = getEquipment();
  const it = items.find((e) => e.id === id);
  if (!it) return false;
  write("equipment.json", items.filter((e) => e.id !== id));
  logMovement({ itemId: id, itemName: it.name, clubId: it.clubId, type: "modification", note: "Fiche supprimée (erreur de saisie)", by });
  return true;
}

/** Incident déclaré (casse, perte, vol) : met à jour quantité / état / statut et garde la trace avec photos. */
export function reportIncident(
  id: string,
  data: { lostQty?: number; condition?: EquipmentCondition; status?: EquipmentItem["status"]; note: string; photoIds?: string[] },
  by: Actor
): EquipmentItem | undefined {
  const it = getEquipmentById(id);
  if (!it) return undefined;
  const lost = Math.max(0, Math.min(it.quantity, Math.floor(data.lostQty ?? 0)));
  return updateEquipment(
    id,
    {
      quantity: it.quantity - lost,
      condition: data.condition ?? it.condition,
      status: data.status ?? (data.condition === "a_reparer" ? "en_reparation" : it.status),
    },
    by,
    { type: "incident", note: data.note, photoIds: data.photoIds }
  );
}

/* ------------------------------------------------------------------ */
/*  Photos de preuve                                                   */
/* ------------------------------------------------------------------ */

export const PHOTO_TYPES: Record<string, string> = { jpg: "image/jpeg", jpeg: "image/jpeg", png: "image/png", webp: "image/webp", heic: "image/heic" };
export const PHOTO_MAX_BYTES = 12 * 1024 * 1024;

export function getPhotos(): EquipmentPhoto[] {
  return read<EquipmentPhoto>("equipment-photos.json").sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1));
}
export function getPhotoById(id: string): EquipmentPhoto | undefined {
  return getPhotos().find((p) => p.id === id);
}
export function savePhoto(buffer: Buffer, ext: string, meta: Omit<EquipmentPhoto, "id" | "fileName" | "mimeType" | "size" | "createdAt">): EquipmentPhoto {
  fs.mkdirSync(PHOTOS_DIR, { recursive: true });
  const fileName = `${Date.now().toString(36)}-${crypto.randomBytes(4).toString("hex")}.${ext}`;
  fs.writeFileSync(path.join(PHOTOS_DIR, fileName), buffer);
  const list = read<EquipmentPhoto>("equipment-photos.json");
  const photo: EquipmentPhoto = { ...meta, id: newId("ph"), fileName, mimeType: PHOTO_TYPES[ext] ?? "image/jpeg", size: buffer.length, createdAt: now() };
  list.push(photo);
  write("equipment-photos.json", list);
  // Les photos d'incident / d'inventaire sont rattachées au mouvement correspondant :
  // on ne journalise ici que les photos « libres » (état, réception, réparation).
  if (meta.itemId && meta.kind !== "incident" && meta.kind !== "inventaire") {
    const it = getEquipmentById(meta.itemId);
    if (it) logMovement({ itemId: it.id, itemName: it.name, clubId: it.clubId, type: "photo", note: meta.caption, photoIds: [photo.id], by: meta.by });
  }
  return photo;
}
export function deletePhoto(id: string): boolean {
  const list = read<EquipmentPhoto>("equipment-photos.json");
  const ph = list.find((p) => p.id === id);
  if (!ph) return false;
  write("equipment-photos.json", list.filter((p) => p.id !== id));
  try {
    fs.unlinkSync(path.join(PHOTOS_DIR, path.basename(ph.fileName)));
  } catch {
    /* déjà absent */
  }
  return true;
}

/* ------------------------------------------------------------------ */
/*  Inventaires                                                        */
/* ------------------------------------------------------------------ */

export function getInventories(): Inventory[] {
  return read<Inventory>("inventories.json").sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1));
}

/**
 * Enregistre un inventaire : les quantités et états comptés deviennent la
 * référence (avec mouvement « inventaire » quand ils diffèrent), et la date
 * de dernier inventaire est mise à jour sur chaque matériel compté.
 */
export function submitInventory(
  clubId: string,
  lines: { itemId: string; countedQty: number; condition: EquipmentCondition; note?: string; photoIds?: string[] }[],
  by: Actor,
  comment?: string
): Inventory | "empty" {
  const items = getEquipment();
  const full: InventoryLine[] = [];
  for (const l of lines) {
    const it = items.find((x) => x.id === l.itemId && x.clubId === clubId);
    if (!it) continue;
    full.push({
      itemId: it.id,
      code: it.code,
      name: it.name,
      expectedQty: it.quantity,
      countedQty: Math.max(0, Math.floor(Number(l.countedQty) || 0)),
      conditionBefore: it.condition,
      condition: l.condition,
      note: l.note?.trim() || undefined,
      photoIds: l.photoIds?.length ? l.photoIds : undefined,
    });
  }
  if (full.length === 0) return "empty";

  const inv: Inventory = {
    id: newId("inv"),
    clubId,
    by,
    date: today(),
    lines: full,
    discrepancies: full.filter((l) => l.countedQty !== l.expectedQty).length,
    comment: comment?.trim() || undefined,
    // Sans écart, l'inventaire est validé d'office ; sinon l'administration le revoit.
    status: full.some((l) => l.countedQty !== l.expectedQty) ? "soumis" : "valide",
    createdAt: now(),
  };
  const list = read<Inventory>("inventories.json");
  list.push(inv);
  write("inventories.json", list);

  for (const l of full) {
    const changed = l.countedQty !== l.expectedQty || l.condition !== l.conditionBefore;
    updateEquipment(
      l.itemId,
      {
        quantity: l.countedQty,
        condition: l.condition,
        lastInventoryAt: inv.date,
      },
      by,
      changed ? { type: "inventaire", note: l.note ?? `Inventaire du ${inv.date}`, photoIds: l.photoIds } : {}
    );
  }
  // Rattache les photos prises pendant l'inventaire.
  const photoIds = full.flatMap((l) => l.photoIds ?? []);
  if (photoIds.length) {
    const photos = read<EquipmentPhoto>("equipment-photos.json");
    for (const p of photos) if (photoIds.includes(p.id)) p.inventoryId = inv.id;
    write("equipment-photos.json", photos);
  }
  return inv;
}

export function reviewInventory(id: string, status: "valide" | "a_revoir", by: Actor, comment?: string): Inventory | undefined {
  const list = read<Inventory>("inventories.json");
  const i = list.findIndex((x) => x.id === id);
  if (i < 0) return undefined;
  list[i] = { ...list[i], status, reviewedBy: by, reviewedAt: now(), reviewComment: comment?.trim() || undefined };
  write("inventories.json", list);
  return list[i];
}

/* ------------------------------------------------------------------ */
/*  Alternance                                                         */
/* ------------------------------------------------------------------ */

/** Statut effectif : forcé (terminé / interrompu) ou déduit des dates. */
export function placementStatus(p: Placement): PlacementStatus {
  if (p.status === "interrompu" || p.status === "termine") return p.status;
  const t = today();
  if (t < p.startDate) return "planifie";
  if (t > p.endDate) return "termine";
  return "en_cours";
}

export function getPlacements(): Placement[] {
  return read<Placement>("placements.json")
    .map((p) => ({ ...p, status: placementStatus(p) }))
    .sort((a, b) => (a.startDate < b.startDate ? 1 : -1));
}
export function getPlacementById(id: string): Placement | undefined {
  return getPlacements().find((p) => p.id === id);
}
export function createPlacement(data: Omit<Placement, "id" | "createdAt" | "status">): Placement {
  const list = read<Placement>("placements.json");
  const p: Placement = { ...data, status: "planifie", id: newId("alt"), createdAt: now() };
  list.push(p);
  write("placements.json", list);
  return { ...p, status: placementStatus(p) };
}
export function updatePlacement(id: string, patch: Partial<Omit<Placement, "id" | "createdAt">>): Placement | undefined {
  const list = read<Placement>("placements.json");
  const i = list.findIndex((p) => p.id === id);
  if (i < 0) return undefined;
  list[i] = { ...list[i], ...patch };
  write("placements.json", list);
  return { ...list[i], status: placementStatus(list[i]) };
}
export function deletePlacement(id: string): boolean {
  const list = read<Placement>("placements.json");
  if (!list.some((p) => p.id === id)) return false;
  write("placements.json", list.filter((p) => p.id !== id));
  write("alternance-logs.json", getLogs().filter((l) => l.placementId !== id));
  return true;
}

export function getLogs(): AlternanceLog[] {
  return read<AlternanceLog>("alternance-logs.json").sort((a, b) => (a.date < b.date ? 1 : -1));
}
export function createLog(data: Pick<AlternanceLog, "placementId" | "date" | "hours" | "activity">, by: Actor): AlternanceLog {
  const list = read<AlternanceLog>("alternance-logs.json");
  const byTutor = by.role === "coach" || by.role === "admin";
  const log: AlternanceLog = {
    ...data,
    hours: Math.max(0.5, Math.min(12, Number(data.hours) || 0)),
    activity: data.activity.trim(),
    // Une séance saisie par le tuteur (ou l'admin) est validée d'emblée.
    status: byTutor ? "valide" : "a_valider",
    by,
    validatedBy: byTutor ? by : undefined,
    validatedAt: byTutor ? now() : undefined,
    id: newId("log"),
    createdAt: now(),
  };
  list.push(log);
  write("alternance-logs.json", list);
  return log;
}
export function reviewLog(id: string, status: Exclude<LogStatus, "a_valider">, by: Actor, comment?: string): AlternanceLog | undefined {
  const list = read<AlternanceLog>("alternance-logs.json");
  const i = list.findIndex((l) => l.id === id);
  if (i < 0) return undefined;
  list[i] = { ...list[i], status, tutorComment: comment?.trim() || list[i].tutorComment, validatedBy: by, validatedAt: now() };
  write("alternance-logs.json", list);
  return list[i];
}
export function deleteLog(id: string): boolean {
  const list = read<AlternanceLog>("alternance-logs.json");
  if (!list.some((l) => l.id === id)) return false;
  write("alternance-logs.json", list.filter((l) => l.id !== id));
  return true;
}

/** Heures validées / en attente d'une alternance. */
export function placementHours(placementId: string, logs = getLogs()) {
  const mine = logs.filter((l) => l.placementId === placementId);
  return {
    validated: mine.filter((l) => l.status === "valide").reduce((s, l) => s + l.hours, 0),
    pending: mine.filter((l) => l.status === "a_valider").reduce((s, l) => s + l.hours, 0),
  };
}

/* ------------------------------------------------------------------ */
/*  Synthèses                                                          */
/* ------------------------------------------------------------------ */

/** Indicateurs par club : matériel, valeur, état, dernier inventaire, alternants. */
export function clubSummaries() {
  const clubs = getClubs();
  const items = getEquipment().filter((e) => e.status !== "reforme");
  const coaches = getCoaches();
  const placements = getPlacements();
  const inventories = getInventories();
  return clubs.map((c) => {
    const mine = items.filter((e) => e.clubId === c.id);
    const lastInv = inventories.find((i) => i.clubId === c.id);
    const age = daysSince(lastInv?.date);
    return {
      clubId: c.id,
      items: mine.length,
      units: mine.reduce((s, e) => s + e.quantity, 0),
      valueFCFA: mine.reduce((s, e) => s + e.quantity * (e.unitValueFCFA ?? 0), 0),
      toRepair: mine.filter((e) => e.condition === "a_reparer" || e.status === "en_reparation").length,
      outOfService: mine.filter((e) => e.condition === "hors_service" || e.status === "perdu").length,
      unassigned: mine.filter((e) => !e.responsibleCoachId).length,
      coaches: coaches.filter((x) => x.clubId === c.id).length,
      activeAlternants: placements.filter((p) => p.clubId === c.id && p.status === "en_cours").length,
      lastInventoryDate: lastInv?.date ?? null,
      inventoryOverdue: mine.length > 0 && (age === null || age > INVENTORY_MAX_AGE_DAYS),
    };
  });
}
