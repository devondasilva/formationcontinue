import type { Metadata, Viewport } from "next";
import "@fontsource/barlow-condensed/latin-800-italic.css";
import "@fontsource/barlow-condensed/latin-900-italic.css";
import "@fontsource/barlow-condensed/latin-ext-900-italic.css";
import "@fontsource/hanken-grotesk/latin-400.css";
import "@fontsource/hanken-grotesk/latin-500.css";
import "@fontsource/hanken-grotesk/latin-600.css";
import "@fontsource/hanken-grotesk/latin-700.css";
import "@fontsource/hanken-grotesk/latin-ext-400.css";
import "@fontsource/dm-mono/latin-400.css";
import "@fontsource/dm-mono/latin-500.css";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "MADES Formation Continue — JES, Entraîneur, Diplôme d'État",
    template: "%s · MADES Formation Continue",
  },
  description:
    "La formation continue MADES en 4 niveaux — JES Niveau 1, JES Niveau 2, Entraîneur sports de raquette, Diplôme d'État — avec à chaque niveau les modules tennis, beach tennis, padel, mini-tennis et pickleball.",
};

export const viewport: Viewport = {
  themeColor: "#FF4D00",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr">
      <body>{children}</body>
    </html>
  );
}
