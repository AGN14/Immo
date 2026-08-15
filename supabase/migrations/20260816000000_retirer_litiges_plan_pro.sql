-- Retire la mention « litiges » de la liste de fonctionnalités du plan Pro :
-- la fonctionnalité n'existe pas (aucune table, aucun écran, aucune action).
-- Voir relecture éditoriale de l'accueil, 2026-08-16.

update public.plan set
  fonctionnalites = '[
    "Jusqu''à 20 baux actifs",
    "Tout le plan Essentiel",
    "Photos et présentation de vos biens",
    "Historique complet des baux et locataires",
    "Signalement de pannes avec photos",
    "Tableau de bord avec graphiques"
  ]'::jsonb
where slug = 'pro';
