/** Reconnaît le type d'un lien vidéo pour l'afficher correctement (YouTube, Vimeo, fichier). */
export type VideoSource =
  | { kind: "youtube"; id: string }
  | { kind: "vimeo"; id: string }
  | { kind: "file"; src: string };

export function youtubeId(url: string): string | null {
  try {
    const u = new URL(url.trim());
    const host = u.hostname.replace(/^www\.|^m\./, "");
    if (host === "youtu.be") return u.pathname.slice(1).split("/")[0] || null;
    if (host.endsWith("youtube.com") || host.endsWith("youtube-nocookie.com")) {
      if (u.searchParams.get("v")) return u.searchParams.get("v");
      const m = u.pathname.match(/^\/(?:shorts|embed|live|v)\/([\w-]{6,})/);
      if (m) return m[1];
    }
  } catch {
    /* lien invalide */
  }
  return null;
}

export function parseVideo(url?: string | null): VideoSource | null {
  if (!url) return null;
  const yt = youtubeId(url);
  if (yt) return { kind: "youtube", id: yt };
  const vimeo = url.match(/vimeo\.com\/(?:video\/)?(\d+)/);
  if (vimeo) return { kind: "vimeo", id: vimeo[1] };
  if (/^\/api\/uploads\//.test(url) || /\.(mp4|webm|mov|m4v)(\?|$)/i.test(url)) return { kind: "file", src: url };
  return null;
}

export function videoThumb(v: VideoSource | null): string | null {
  if (v?.kind === "youtube") return `https://i.ytimg.com/vi/${v.id}/hqdefault.jpg`;
  return null;
}

export function embedUrl(v: VideoSource): string | null {
  if (v.kind === "youtube") return `https://www.youtube-nocookie.com/embed/${v.id}?autoplay=1&rel=0`;
  if (v.kind === "vimeo") return `https://player.vimeo.com/video/${v.id}?autoplay=1`;
  return null;
}

/** Drapeau emoji à partir d'un nom de pays courant (affichage décoratif, facultatif). */
const FLAGS: Record<string, string> = {
  france: "🇫🇷", belgique: "🇧🇪", suisse: "🇨🇭", canada: "🇨🇦", "états-unis": "🇺🇸", "etats-unis": "🇺🇸", usa: "🇺🇸",
  espagne: "🇪🇸", italie: "🇮🇹", portugal: "🇵🇹", allemagne: "🇩🇪", "royaume-uni": "🇬🇧", angleterre: "🇬🇧",
  bénin: "🇧🇯", benin: "🇧🇯", togo: "🇹🇬", "côte d'ivoire": "🇨🇮", "cote d'ivoire": "🇨🇮", sénégal: "🇸🇳", senegal: "🇸🇳",
  ghana: "🇬🇭", nigeria: "🇳🇬", cameroun: "🇨🇲", gabon: "🇬🇦", maroc: "🇲🇦", tunisie: "🇹🇳", "burkina faso": "🇧🇫",
  mali: "🇲🇱", niger: "🇳🇪", qatar: "🇶🇦", "émirats arabes unis": "🇦🇪", dubaï: "🇦🇪", brésil: "🇧🇷", mexique: "🇲🇽",
};
export function flagOf(country?: string): string {
  return (country && FLAGS[country.trim().toLowerCase()]) || "🌍";
}
