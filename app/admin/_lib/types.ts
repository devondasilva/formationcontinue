import type {
  Enrollment,
  ExchangeRates,
  Formation,
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
}
