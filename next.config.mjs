/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // pdfkit lit ses fichiers de police (.afm) via des chemins relatifs à son
  // propre dossier au moment de l'exécution ; le bundling webpack casse cette
  // résolution. On le garde donc en dépendance Node externe (non empaquetée).
  experimental: {
    serverComponentsExternalPackages: ["pdfkit", "fontkit", "@foliojs-fork/fontkit"],
  },
};
export default nextConfig;
