import type { Discipline, Level } from "@/lib/types";
import {
  Sprout,
  Users,
  Target,
  Crown,
  BookOpen,
  ShieldCheck,
  CalendarRange,
  Trophy,
  Dumbbell,
  Brain,
  Crosshair,
  Baby,
  Waves,
  Presentation,
  Briefcase,
  Video,
  ClipboardList,
  HeartPulse,
  Sparkles,
  type LucideIcon,
} from "lucide-react";

/**
 * Pictogrammes dessinés pour chaque discipline (le jeu d'icônes standard
 * n'a pas de raquette). Trait 1.8, `currentColor`, viewBox 24 : ils
 * s'alignent avec les icônes Lucide utilisées partout ailleurs.
 */
export function DisciplineIcon({
  discipline,
  size = 24,
  className = "",
  strokeWidth = 1.8,
}: {
  discipline: Discipline;
  size?: number;
  className?: string;
  strokeWidth?: number;
}) {
  const common = {
    width: size,
    height: size,
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
    className,
    "aria-hidden": true,
  };

  switch (discipline) {
    case "tennis":
      // Raquette cordée + balle
      return (
        <svg {...common}>
          <ellipse cx="9.5" cy="8.5" rx="5.5" ry="6.5" transform="rotate(-35 9.5 8.5)" />
          <path d="M6.2 5.2l6.6 6.6M4.9 8.3l5 5M8.1 3.9l5 5M5.4 11.6l5.9-5.9M7.6 13.1l5.3-5.3M4.6 9.6l5.1-5.1" opacity=".55" />
          <path d="M13.2 13.6l1.6 1.6M14.8 15.2l4.6 4.6" strokeWidth={strokeWidth + 0.6} />
          <circle cx="19" cy="5" r="2.3" />
          <path d="M17.1 4.1c.9.4 1.7 1.3 2 2.5" opacity=".7" />
        </svg>
      );
    case "beach-tennis":
      // Soleil, vagues de sable et balle
      return (
        <svg {...common}>
          <circle cx="16.5" cy="7" r="3" />
          <path d="M16.5 1.8v1.1M21.7 7h-1.1M20.2 3.3l-.8.8M12.8 3.3l.8.8" />
          <path d="M2 15.5c1.6-1.3 3.2-1.3 4.8 0s3.2 1.3 4.8 0 3.2-1.3 4.8 0 3.2 1.3 4.8 0" />
          <path d="M2 19.5c1.6-1.3 3.2-1.3 4.8 0s3.2 1.3 4.8 0 3.2-1.3 4.8 0 3.2 1.3 4.8 0" opacity=".55" />
          <circle cx="6.5" cy="8.5" r="2.4" />
          <path d="M4.6 7.5c1 .3 2.2 1.4 2.5 2.9" opacity=".7" />
        </svg>
      );
    case "padel":
      // Pala pleine perforée
      return (
        <svg {...common}>
          <path d="M10 2.5c4.1 0 7 2.9 7 6.6 0 3.8-2.7 6.6-5.6 6.9l-.6 3.3a1.6 1.6 0 01-1.6 1.3h-.4a1.6 1.6 0 01-1.6-1.3l-.6-3.3C3.7 15.7 3 12.9 3 9.1 3 5.4 5.9 2.5 10 2.5z" />
          <circle cx="7.6" cy="7.4" r=".7" fill="currentColor" />
          <circle cx="10" cy="6.4" r=".7" fill="currentColor" />
          <circle cx="12.4" cy="7.4" r=".7" fill="currentColor" />
          <circle cx="8.6" cy="10" r=".7" fill="currentColor" />
          <circle cx="11.4" cy="10" r=".7" fill="currentColor" />
          <circle cx="10" cy="12.4" r=".7" fill="currentColor" />
          <circle cx="19.2" cy="17.8" r="2.2" />
        </svg>
      );
    case "mini-tennis":
      // Petite raquette, grosse balle mousse, étincelle
      return (
        <svg {...common}>
          <circle cx="8" cy="9" r="4.2" />
          <path d="M5.3 6.6l5.4 5M5.3 11.4l5.4-5" opacity=".55" />
          <path d="M11 12.2l3.2 3.2" strokeWidth={strokeWidth + 0.6} />
          <circle cx="17.5" cy="17.5" r="3.6" />
          <path d="M14.6 16c1.5.2 3.6 1.6 4.4 4" opacity=".7" />
          <path d="M18.5 3.5v3M17 5h3" />
        </svg>
      );
  }
}

export const LEVEL_ICON: Record<Level, LucideIcon> = {
  initiateur: Sprout,
  animateur: Users,
  entraineur: Target,
  de: Crown,
};

export function LevelIcon({ level, size = 18, className = "" }: { level: Level; size?: number; className?: string }) {
  const Icon = LEVEL_ICON[level];
  return <Icon size={size} strokeWidth={2} className={className} aria-hidden />;
}

/**
 * Choisit une icône pour un module du programme d'après son intitulé.
 * Les règles vont du plus spécifique au plus général.
 */
const MODULE_RULES: [RegExp, LucideIcon][] = [
  [/s[ée]curit|pr[ée]vention|blessure|sant[ée]/i, ShieldCheck],
  [/histoire|r[èe]glement|r[èe]gle|th[ée]orie/i, BookOpen],
  [/enfant|4.?[-–]?\s?10|jeune|mini/i, Baby],
  [/sable|plage/i, Waves],
  [/comp[ée]tition|tournoi|match/i, Trophy],
  [/physique|pr[ée]paration|condition|athl[ée]t/i, Dumbbell],
  [/mental|tactique|lecture du jeu|strat[ée]g/i, Brain],
  [/technique|service|coup|volée|revers|geste/i, Crosshair],
  [/s[ée]ance|cycle|planif|programm|organisation/i, CalendarRange],
  [/vid[ée]o|analyse/i, Video],
  [/former|formateur|tutorat|p[ée]dagog|animation|groupe/i, Presentation],
  [/gestion|diriger|structure|club|management|projet/i, Briefcase],
  [/[ée]valuation|bilan|certif|examen/i, ClipboardList],
  [/r[ée]cup[ée]ration|nutrition/i, HeartPulse],
];

export function moduleIcon(title: string): LucideIcon {
  for (const [re, icon] of MODULE_RULES) if (re.test(title)) return icon;
  return Sparkles;
}
