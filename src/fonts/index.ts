import localFont from "next/font/local";

export const fraunces = localFont({
  src: "./fraunces.woff2",
  weight: "500 800",
  style: "normal",
  variable: "--font-fraunces",
  display: "swap",
});

export const manrope = localFont({
  src: "./manrope.woff2",
  weight: "300 800",
  style: "normal",
  variable: "--font-manrope",
  display: "swap",
});

export const plexMono = localFont({
  src: [
    { path: "./plexmono-500.woff2", weight: "500", style: "normal" },
    { path: "./plexmono-600.woff2", weight: "600", style: "normal" },
  ],
  variable: "--font-plex-mono",
  display: "swap",
});
