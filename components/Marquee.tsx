/** Bandeau défilant façon mades-site (« EMPLOI · EMPLOI · »). */
export default function Marquee({
  items,
  className = "",
  outline = false,
  outlineEvery = false,
  fast = false,
}: {
  items: string[];
  className?: string;
  /** Tous les mots en contour. */
  outline?: boolean;
  /** Un mot sur deux en contour. */
  outlineEvery?: boolean;
  fast?: boolean;
}) {
  const row = items.flatMap((t, i) => [
    <span key={`t${i}`} className={outline || (outlineEvery && i % 2 === 1) ? "text-stroke" : ""}>
      {t}
    </span>,
    <span key={`s${i}`} className="mx-[0.35em] inline-block h-[0.18em] w-[0.18em] rotate-45 bg-orange" />,
  ]);
  return (
    <div className={`overflow-hidden whitespace-nowrap ${className}`} aria-hidden>
      <div className={`inline-flex ${fast ? "animate-marquee-fast" : "animate-marquee"} hover:[animation-play-state:paused]`}>
        <div className="flex items-center pr-[0.35em]">{row}</div>
        <div className="flex items-center pr-[0.35em]">{row}</div>
      </div>
    </div>
  );
}
