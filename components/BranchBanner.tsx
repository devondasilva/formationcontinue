export default function BranchBanner() {
  return (
    <div className="bg-ink text-white/80 text-[11px] md:text-xs">
      <div className="max-w-content mx-auto px-6 py-2 flex flex-col md:flex-row items-center justify-center gap-1 md:gap-2 text-center">
        <span>
          Vous êtes sur <strong className="text-white font-bold">Formation Continue</strong>, une branche d&rsquo;activité de{" "}
          <strong className="text-white font-bold">MADES</strong> — pas le site institutionnel officiel.
        </span>
        <a
          href="https://www.mades.world"
          target="_blank"
          rel="noopener noreferrer"
          className="text-orange font-bold hover:underline whitespace-nowrap"
        >
          Voir mades.world ↗
        </a>
      </div>
    </div>
  );
}
