import type { MetadataRoute } from "next";

const BASE = "https://xwegan.dev-teams.tech";

export default function sitemap(): MetadataRoute.Sitemap {
  const lastModified = new Date();
  return [
    { url: `${BASE}/`, lastModified, changeFrequency: "weekly", priority: 1.0 },
    { url: `${BASE}/connexion`, lastModified, changeFrequency: "monthly", priority: 0.8 },
    { url: `${BASE}/inscription`, lastModified, changeFrequency: "monthly", priority: 0.8 },
    {
      url: `${BASE}/inscription/locataire`,
      lastModified,
      changeFrequency: "monthly",
      priority: 0.7,
    },
    {
      url: `${BASE}/inscription/proprietaire`,
      lastModified,
      changeFrequency: "monthly",
      priority: 0.7,
    },
    { url: `${BASE}/plans`, lastModified, changeFrequency: "monthly", priority: 0.8 },
    { url: `${BASE}/contact`, lastModified, changeFrequency: "yearly", priority: 0.5 },
    {
      url: `${BASE}/signalements`,
      lastModified,
      changeFrequency: "monthly",
      priority: 0.6,
    },
    {
      url: `${BASE}/mentions-legales`,
      lastModified,
      changeFrequency: "yearly",
      priority: 0.4,
    },
    {
      url: `${BASE}/confidentialite`,
      lastModified,
      changeFrequency: "yearly",
      priority: 0.4,
    },
    { url: `${BASE}/cookies`, lastModified, changeFrequency: "yearly", priority: 0.4 },
    {
      url: `${BASE}/conditions-utilisation`,
      lastModified,
      changeFrequency: "yearly",
      priority: 0.4,
    },
  ];
}
