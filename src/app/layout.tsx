import type { Metadata } from "next";
import { inter } from "@/fonts";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL("https://xwegan.dev-teams.tech"),
  alternates: {
    canonical: "https://xwegan.dev-teams.tech",
  },
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
    images: [
      {
        url: "/opengraph-image",
        width: 1200,
        height: 630,
        alt: "Xwégán — Gestion locative pour l'Afrique de l'Ouest",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Xwégán — Gestion locative pour l'Afrique de l'Ouest",
    description:
      "La plateforme de gestion locative pour propriétaires et locataires en Afrique de l'Ouest.",
    images: ["/opengraph-image"],
  },
  robots: { index: true, follow: true },
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Organization",
        "@id": "https://xwegan.dev-teams.tech/#organization",
        name: "Xwégán",
        url: "https://xwegan.dev-teams.tech",
        logo: "https://xwegan.dev-teams.tech/marque/logo.png",
        description:
          "Plateforme de gestion locative pour propriétaires et locataires en Afrique de l'Ouest : suivi des loyers en FCFA, signalement de pannes, gestion de litiges et génération automatique de quittances.",
      },
      {
        "@type": "SoftwareApplication",
        name: "Xwégán",
        applicationCategory: "BusinessApplication",
        operatingSystem: "Web",
        url: "https://xwegan.dev-teams.tech",
        offers: {
          "@type": "Offer",
          price: "0",
          priceCurrency: "XOF",
        },
        publisher: { "@id": "https://xwegan.dev-teams.tech/#organization" },
      },
      {
        "@type": "WebSite",
        "@id": "https://xwegan.dev-teams.tech/#website",
        url: "https://xwegan.dev-teams.tech",
        name: "Xwégán",
        inLanguage: "fr",
        publisher: { "@id": "https://xwegan.dev-teams.tech/#organization" },
      },
    ],
  };

  return (
    <html lang="fr" className={`${inter.variable} antialiased`}>
      <body>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
        {children}
      </body>
    </html>
  );
}
