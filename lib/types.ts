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

export type UserRole = "admin" | "learner" | "coach";

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


/* ================================================================== */
/*  Réseau : clubs partenaires, coachs, matériel, alternance          */
/* ================================================================== */

export type ClubStatus = "actif" | "en_convention" | "suspendu";

/** Club partenaire qui accueille des apprenants en alternance et peut être doté en matériel. */
export interface PartnerClub {
  id: string;
  name: string;
  city: string;
  address: string;
  phone: string;
  email: string;
  /** Dirigeant / interlocuteur du club (signataire de la convention). */
  contactName: string;
  disciplines: Discipline[];
  /** Nombre d'apprenants que le club peut accueillir simultanément en alternance. */
  alternanceCapacity: number;
  status: ClubStatus;
  conventionStart?: string; // YYYY-MM-DD
  conventionEnd?: string; // YYYY-MM-DD
  notes?: string;
  createdAt: string;
}

/** Coach d'un club partenaire : tuteur d'alternance et/ou responsable de matériel. Se connecte à l'espace coach. */
export interface Coach {
  id: string;
  name: string;
  email: string;
  phone: string;
  clubId: string;
  /** Encadre des apprenants en alternance. */
  isTutor: boolean;
  /** A la charge du matériel (dotations) du club. */
  isEquipmentManager: boolean;
  active: boolean;
  passwordHash: string;
  passwordSalt: string;
  /** Mot de passe provisoire à changer à la première connexion. */
  mustChangePassword: boolean;
  lastLoginAt?: string;
  createdAt: string;
}

export type PublicCoach = Omit<Coach, "passwordHash" | "passwordSalt">;

export type EquipmentCategory =
  | "raquettes"
  | "balles"
  | "filets_poteaux"
  | "marquage"
  | "coordination"
  | "lance_balles"
  | "mini_tennis"
  | "rangement"
  | "securite"
  | "numerique"
  | "autre";

export type EquipmentCondition = "neuf" | "bon" | "use" | "a_reparer" | "hors_service";
export type EquipmentStatus = "en_service" | "en_reparation" | "perdu" | "reforme";
export type EquipmentOrigin = "dotation_mades" | "club" | "don_partenaire";

/** Une ligne de matériel (un article, éventuellement en plusieurs exemplaires : 24 raquettes, 6 cartons de balles…). */
export interface EquipmentItem {
  id: string;
  /** Code d'inventaire unique (étiquette), ex. « MFC-COT-0007 ». */
  code: string;
  clubId: string;
  /** Coach qui a la charge de ce matériel (null = non attribué). */
  responsibleCoachId: string | null;
  category: EquipmentCategory;
  name: string;
  discipline?: Discipline;
  brand?: string;
  serialNumber?: string;
  quantity: number;
  unit: string; // pièce, lot, carton, paire…
  condition: EquipmentCondition;
  status: EquipmentStatus;
  origin: EquipmentOrigin;
  acquiredAt?: string; // date de dotation / d'achat
  unitValueFCFA?: number;
  storageLocation?: string; // local, armoire…
  notes?: string;
  lastInventoryAt?: string;
  createdAt: string;
  updatedAt: string;
}

export type MovementType =
  | "dotation"
  | "declaration"
  | "modification"
  | "transfert"
  | "responsable"
  | "inventaire"
  | "etat"
  | "incident"
  | "reparation"
  | "reforme"
  | "photo";

export interface Actor {
  role: UserRole;
  id: string;
  name: string;
}

/** Journal de traçabilité : chaque changement sur un matériel est historisé. */
export interface EquipmentMovement {
  id: string;
  itemId: string;
  itemName: string;
  clubId: string;
  type: MovementType;
  qtyBefore?: number;
  qtyAfter?: number;
  conditionBefore?: EquipmentCondition;
  conditionAfter?: EquipmentCondition;
  fromClubId?: string;
  toClubId?: string;
  fromCoachId?: string | null;
  toCoachId?: string | null;
  note?: string;
  photoIds?: string[];
  by: Actor;
  createdAt: string;
}

export type InventoryStatus = "soumis" | "valide" | "a_revoir";

export interface InventoryLine {
  itemId: string;
  code: string;
  name: string;
  expectedQty: number;
  countedQty: number;
  conditionBefore: EquipmentCondition;
  condition: EquipmentCondition;
  note?: string;
  photoIds?: string[];
}

/** Inventaire réalisé par un coach (ou l'administration) sur le matériel dont il a la charge. */
export interface Inventory {
  id: string;
  clubId: string;
  by: Actor;
  date: string; // YYYY-MM-DD
  lines: InventoryLine[];
  /** Nombre de lignes avec un écart de quantité. */
  discrepancies: number;
  comment?: string;
  status: InventoryStatus;
  reviewedBy?: Actor;
  reviewedAt?: string;
  reviewComment?: string;
  createdAt: string;
}

export type PhotoKind = "etat" | "dotation" | "inventaire" | "incident" | "reparation";

/** Photo de preuve (état, dotation, inventaire, casse…) prise par un coach ou l'administration. */
export interface EquipmentPhoto {
  id: string;
  clubId: string;
  itemId?: string;
  inventoryId?: string;
  kind: PhotoKind;
  caption?: string;
  fileName: string; // stocké dans data/uploads/photos (accès authentifié)
  mimeType: string;
  size: number;
  by: Actor;
  createdAt: string;
}

export type PlacementStatus = "planifie" | "en_cours" | "termine" | "interrompu";
export type PlacementResult = "acquis" | "en_cours_acquisition" | "non_acquis";

/** Période d'alternance d'un apprenant dans un club partenaire, suivie par un coach tuteur. */
export interface Placement {
  id: string;
  learnerId: string;
  learnerName: string;
  enrollmentId?: string;
  formationId?: string;
  formationTitle?: string;
  level?: Level;
  clubId: string;
  tutorCoachId: string | null;
  startDate: string;
  endDate: string;
  /** Rythme, ex. « Mercredi après-midi + samedi matin ». */
  schedule: string;
  hoursPlanned: number;
  objectives?: string;
  /** Statut forcé (interrompu / terminé) ; sinon calculé depuis les dates. */
  status: PlacementStatus;
  evaluation?: { result: PlacementResult; comment: string; by: Actor; at: string };
  createdAt: string;
}

export type LogStatus = "a_valider" | "valide" | "refuse";

/** Entrée du carnet d'alternance : séance réalisée au club, validée par le tuteur. */
export interface AlternanceLog {
  id: string;
  placementId: string;
  date: string;
  hours: number;
  activity: string;
  status: LogStatus;
  by: Actor;
  tutorComment?: string;
  validatedBy?: Actor;
  validatedAt?: string;
  createdAt: string;
}
