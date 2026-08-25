import type { Metadata } from "next";
import { inter } from "@/fonts";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL("https://xwegan.dev-teams.tech"),
  title: {
    default: "Xwégán — Gestion locative pour l'Afrique de l'Ouest",
    template: "%s · Xwégán",
  },
  description:
    "Xwégán réunit propriétaires et locataires sur une seule plateforme : loyers suivis à la FCFA près, pannes signalées avec photos, litiges documentés et quittances générées automatiquement. L'accès locataire est gratuit, seuls les propriétaires abonnés paient.",
  keywords: [
    "gestion locative",
    "loyers",
    "quittances",
    "propriétaires",
    "locataires",
    "Afrique de l'Ouest",
    "FCFA",
    "immobilier",
    "Xwégán",
  ],
  applicationName: "Xwégán",
  openGraph: {
    type: "website",
    locale: "fr_FR",
    url: "https://xwegan.dev-teams.tech",
    siteName: "Xwégán",
    title: "Xwégán — Gestion locative pour l'Afrique de l'Ouest",
    description:
      "Loyers suivis, pannes signalées, quittances automatiques : la gestion locative pensée pour l'Afrique de l'Ouest.",
  },
  twitter: {
    card: "summary_large_image",
    title: "Xwégán — Gestion locative pour l'Afrique de l'Ouest",
    description:
      "La plateforme de gestion locative pour propriétaires et locataires en Afrique de l'Ouest.",
  },
  robots: { index: true, follow: true },
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="fr" className={`${inter.variable} antialiased`}>
      <body>{children}</body>
    </html>
  );
}
