import type {
  AlternanceLog,
  EquipmentItem,
  EquipmentMovement,
  EquipmentPhoto,
  Inventory,
  PartnerClub,
  Placement,
  PublicCoach,
  Enrollment,
  ExchangeRates,
  Formation,
  FormationDocument,
  Learner,
  Review,
  TrainingSession,
} from "@/lib/types";

/** Forme de la réponse de GET /api/stats, consommée par tout le back-office. */
export type AdminFormation = Formation;
export type AdminSession = TrainingSession & { enrolledCount: number };
export type AdminEnrollment = Enrollment;
export type AdminLearner = Learner;
export type AdminReview = Review;
export type AdminRates = ExchangeRates;

export interface Stats {
  totals: {
    learners: number;
    formations: number;
    sessions: number;
    enrollments: number;
    pendingEnrollments: number;
    totalRevenueFCFA: number;
    certificatesIssued: number;
    reviews: number;
  };
  learners: AdminLearner[];
  formations: AdminFormation[];
  sessions: AdminSession[];
  enrollments: AdminEnrollment[];
  reviews: AdminReview[];
  rates: AdminRates;
  documents: FormationDocument[];
  network: NetworkData;
}

export type AdminPlacement = Placement & { hours: { validated: number; pending: number } };

export interface ClubSummary {
  clubId: string;
  items: number;
  units: number;
  valueFCFA: number;
  toRepair: number;
  outOfService: number;
  unassigned: number;
  coaches: number;
  activeAlternants: number;
  lastInventoryDate: string | null;
  inventoryOverdue: boolean;
}

export interface NetworkData {
  clubs: PartnerClub[];
  coaches: PublicCoach[];
  equipment: EquipmentItem[];
  movements: EquipmentMovement[];
  inventories: Inventory[];
  photos: EquipmentPhoto[];
  placements: AdminPlacement[];
  logs: AlternanceLog[];
  summaries: ClubSummary[];
  totals: {
    clubs: number;
    coaches: number;
    items: number;
    units: number;
    valueFCFA: number;
    toRepair: number;
    outOfService: number;
    unassigned: number;
    inventoriesToReview: number;
    clubsInventoryOverdue: number;
    activePlacements: number;
    logsToValidate: number;
  };
}
