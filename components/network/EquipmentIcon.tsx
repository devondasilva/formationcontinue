import {
  Box,
  Circle,
  Cone,
  Dumbbell,
  Grid3x3,
  HeartPulse,
  Package,
  Rocket,
  ShoppingCart,
  Tablet,
  Baby,
  type LucideIcon,
  type LucideProps,
} from "lucide-react";
import type { EquipmentCategory } from "@/lib/types";

export const CATEGORY_ICON: Record<EquipmentCategory, LucideIcon> = {
  raquettes: Dumbbell,
  balles: Circle,
  filets_poteaux: Grid3x3,
  marquage: Cone,
  coordination: Box,
  lance_balles: Rocket,
  mini_tennis: Baby,
  rangement: ShoppingCart,
  securite: HeartPulse,
  numerique: Tablet,
  autre: Package,
};

export function EquipmentIcon({ category, ...props }: { category: EquipmentCategory } & LucideProps) {
  const Icon = CATEGORY_ICON[category] ?? Package;
  return <Icon {...props} />;
}
