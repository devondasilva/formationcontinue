import type { Config } from "tailwindcss";

/**
 * Identité visuelle alignée sur mades-site.vercel.app :
 * orange #FF4D00, encre #0A0A08, fond papier #F8F8F6,
 * titres Barlow Condensed 900 italique, texte Hanken Grotesk, détails DM Mono.
 */
const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        ink: "#0A0A08",
        ink2: "#151515",
        bg: "#F8F8F6",
        sand: "#EFEFEB",
        muted: "#EDEDE9",
        mutedfg: "#666660",
        line: "#E3E3DE",
        orange: "#FF4D00",
        orangeD: "#D63F00",
        orangeL: "#FFEDE4",
        success: "#15803D",
        danger: "#DC2626",
        white: "#FFFFFF",
      },
      fontFamily: {
        display: ['"Barlow Condensed"', '"Arial Narrow"', "sans-serif"],
        body: ['"Hanken Grotesk"', "ui-sans-serif", "system-ui", "sans-serif"],
        mono: ['"DM Mono"', "ui-monospace", "monospace"],
      },
      borderRadius: {
        card: "1.25rem",
      },
      maxWidth: {
        content: "76rem",
      },
      boxShadow: {
        glow: "0 10px 30px -10px rgba(255, 77, 0, 0.55)",
        lift: "0 24px 50px -24px rgba(10, 10, 8, 0.35)",
        soft: "0 1px 2px rgba(10,10,8,.04), 0 8px 24px -12px rgba(10,10,8,.12)",
      },
      keyframes: {
        marquee: { from: { transform: "translateX(0)" }, to: { transform: "translateX(-50%)" } },
        shimmer: { to: { transform: "translateX(100%)" } },
        floaty: { "0%,100%": { transform: "translateY(0)" }, "50%": { transform: "translateY(-8px)" } },
        spinSlow: { to: { transform: "rotate(360deg)" } },
        pulseRing: {
          "0%": { boxShadow: "0 0 0 0 rgba(255,77,0,.5)" },
          "100%": { boxShadow: "0 0 0 14px rgba(255,77,0,0)" },
        },
        nudge: { "0%,100%": { transform: "translateX(0)" }, "50%": { transform: "translateX(4px)" } },
      },
      animation: {
        marquee: "marquee 28s linear infinite",
        "marquee-fast": "marquee 16s linear infinite",
        shimmer: "shimmer 1.6s infinite",
        floaty: "floaty 4s ease-in-out infinite",
        spinSlow: "spinSlow 18s linear infinite",
        pulseRing: "pulseRing 2s ease-out infinite",
        nudge: "nudge 1.4s ease-in-out infinite",
      },
    },
  },
  plugins: [],
};
export default config;
