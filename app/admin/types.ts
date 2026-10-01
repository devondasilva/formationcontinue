import { Currency, Discipline, EnrollmentStatus, Format, Level, PaymentMethod, SessionStatus } from "@/lib/types";

export interface AdminFormation {
  id: string;
  title: string;
  discipline: Discipline;
  level: Level;
  format: Format;
  description: string;
  durationHours: number;
  prerequisites: string;
  certification: string;
  syllabus: string[];
  priceFCFA: number;
  active: boolean;
}

export interface AdminSession {
  id: string;
  formationId: string;
  formationTitle: string;
  startDate: string;
  endDate: string;
  location: string;
  instructor: string;
  capacity: number;
  status: SessionStatus;
  enrolledCount: number;
}

export interface AdminEnrollment {
  id: string;
  learnerName: string;
  formationTitle: string;
  discipline: Discipline;
  level: Level;
  sessionStartDate: string;
  sessionEndDate: string;
  amountFCFA: number;
  currency: Currency;
  paymentMethod: PaymentMethod;
  status: EnrollmentStatus;
  certificateIssued: boolean;
}

export interface AdminLearner {
  id: string;
  name: string;
  email: string;
  phone: string;
  createdAt: string;
}

export interface AdminReview {
  id: string;
  formationId: string;
  learnerName: string;
  rating: number;
  comment: string;
  createdAt: string;
}

export interface AdminRates {
  fcfaPerUnit: { EUR: number; USD: number };
  updatedAt: string;
}

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
