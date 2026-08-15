import type { Metadata } from "next";
import { inter } from "@/fonts";
import "./globals.css";

export const metadata: Metadata = {
  title: "Xwégán",
  description:
    "Xwégán réunit propriétaires et locataires sur une seule plateforme : loyers suivis, pannes signalées avec photos, quittances numérotées automatiquement.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="fr" className={`${inter.variable} antialiased`}>
      <body>{children}</body>
    </html>
  );
}
