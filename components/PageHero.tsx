import type { ReactNode } from "react";
import Reveal from "./Reveal";
import SplitTitle from "./SplitTitle";

/** En-tête des pages intérieures : étiquette, grand titre animé, chapô, actions. */
export default function PageHero({
  tag,
  title,
  accent,
  text,
  children,
  aside,
}: {
  tag: string;
  title: string;
  accent?: string;
  text?: ReactNode;
  children?: ReactNode;
  /** Élément décoratif à droite (desktop). */
  aside?: ReactNode;
}) {
  return (
    <section className="relative overflow-hidden">
      <div className="grain pointer-events-none absolute inset-0" />
      <div className="relative mx-auto grid max-w-content items-end gap-8 px-5 pb-10 pt-8 sm:px-6 md:pt-12 lg:grid-cols-12">
        <div className="lg:col-span-8">
          <Reveal from="left">
            <p className="tag-label">{tag}</p>
          </Reveal>
          <SplitTitle text={title} accent={accent} className="h-display mt-4 text-[clamp(3rem,8vw,6rem)]" delay={0.05} />
          {text && (
            <Reveal delay={250}>
              <p className="mt-5 max-w-xl text-[17px] leading-relaxed text-mutedfg">{text}</p>
            </Reveal>
          )}
          {children && (
            <Reveal delay={350}>
              <div className="mt-8">{children}</div>
            </Reveal>
          )}
        </div>
        {aside && (
          <Reveal from="scale" delay={300} className="hidden justify-self-end lg:col-span-4 lg:block">
            {aside}
          </Reveal>
        )}
      </div>
    </section>
  );
}
