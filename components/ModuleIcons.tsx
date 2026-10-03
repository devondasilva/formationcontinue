import type { Discipline } from "@/lib/types";
import { DISCIPLINE_LABEL } from "@/lib/labels";
import { DisciplineIcon } from "./icons/DisciplineIcon";

/** Rangée de pastilles d'icônes des modules sportifs d'un niveau. */
export default function ModuleIcons({
  modules,
  size = "md",
  tone = "light",
  labels = false,
}: {
  modules: Discipline[];
  size?: "sm" | "md";
  tone?: "light" | "dark" | "glass";
  labels?: boolean;
}) {
  const box = size === "sm" ? "h-7 w-7 rounded-lg" : "h-9 w-9 rounded-xl";
  const icon = size === "sm" ? 15 : 19;
  const tones = {
    light: "bg-muted text-ink group-hover:bg-orangeL group-hover:text-orange",
    dark: "bg-ink text-white",
    glass: "bg-white/15 text-white backdrop-blur",
  };
  return (
    <ul className={`flex flex-wrap ${labels ? "gap-x-3 gap-y-2" : "gap-1.5"}`} aria-label="Modules">
      {modules.map((d, i) => (
        <li key={d} className="flex items-center gap-1.5" title={DISCIPLINE_LABEL[d]}>
          <span
            className={`inline-flex items-center justify-center transition-all duration-300 group-hover:-translate-y-0.5 ${box} ${tones[tone]}`}
            style={{ transitionDelay: `${i * 40}ms` }}
          >
            <DisciplineIcon discipline={d} size={icon} />
          </span>
          {labels && <span className="text-xs font-semibold">{DISCIPLINE_LABEL[d]}</span>}
          {!labels && <span className="sr-only">{DISCIPLINE_LABEL[d]}</span>}
        </li>
      ))}
    </ul>
  );
}
