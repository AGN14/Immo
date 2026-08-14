import localFont from "next/font/local";

export const sourceSerif = localFont({
  src: "./source-serif-4.woff2",
  weight: "200 900",
  style: "normal",
  variable: "--font-source-serif",
  display: "swap",
});

export const inter = localFont({
  src: "./inter.woff2",
  weight: "100 900",
  style: "normal",
  variable: "--font-inter",
  display: "swap",
});
