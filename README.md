# Xwégán

Plateforme de gestion locative pour l'Afrique de l'Ouest. Elle réunit **propriétaires** et
**locataires** au même endroit : loyers suivis à la FCFA près, pannes signalées avec photos,
litiges documentés, factures générées automatiquement.

L'accès locataire est gratuit ; seuls les propriétaires souscrivent un abonnement.

## Démarrer

```bash
npm install
npm run dev
```

Le site tourne sur http://localhost:3000.

| Commande            | Effet                       |
| ------------------- | --------------------------- |
| `npm run dev`       | serveur de développement    |
| `npm run build`     | build de production         |
| `npm run start`     | sert le build de production |
| `npm run lint`      | ESLint                      |
| `npm run typecheck` | TypeScript sans émission    |

## Structure

```
src/
  app/
    (app)/          espace connecté : dashboard, biens, locataires, loyers
    (auth)/         connexion et inscription
    page.tsx        landing publique
    globals.css     palette, échelle typographique, rayons
  components/
    marketing/      sections de la landing
    dashboard/      composants de l'espace connecté
    ui/             primitives partagées (Button, Input, StatusPill…)
  fonts/            Source Serif 4 + Inter, auto-hébergées
  lib/
    auth/           actions serveur et session
    actions/        écritures (Server Actions), une par domaine
    data/           lectures, cloisonnées par propriétaire (Supabase)
    supabase/       client serveur et types générés
    echeances.ts    échéances, retards, pénalités — calcul pur, rien de stocké
    types.ts        types du domaine
    status-labels.ts  libellés et tons des statuts
  proxy.ts          redirections d'authentification (convention Next 16)
supabase/
  migrations/       schéma, RLS, quotas, pénalités
  seed.sql          jeu de démonstration
```

## Design

**Typographie** — Source Serif 4 pour les titres, Inter pour le texte et les chiffres.
Aucune taille arbitraire : une échelle de 8 pas définie dans `globals.css`. Les montants
s'alignent via `font-variant-numeric: tabular-nums`, pas via une police monospace.

**Palette** — beige et terracotta, un seul thème clair partagé par la landing et l'espace
connecté. Toutes les valeurs sont des tokens dans `globals.css` ; aucune couleur n'est écrite
en dur dans les composants.

## État actuel

Les données sont **simulées** (`src/lib/mock-data`) et l'authentification aussi : la session
vit dans un cookie et `login` résout le rôle depuis l'annuaire des locataires connus. Cette
résolution est le seul endroit à remplacer le jour où un vrai backend arrive.

Les témoignages, chiffres et montants affichés sont des données de démonstration.
