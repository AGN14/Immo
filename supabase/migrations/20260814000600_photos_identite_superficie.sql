-- Photos, superficie et identité.
--
-- 1. Bucket public pour les images (biens, avatars de locataires) : les
--    fichiers sont servis publiquement, l'upload passe par service_role.
-- 2. Superficie en m² sur les biens.
-- 3. Fiche locataire : photo, date de naissance, pièce d'identité, profession.
-- 4. Le pricing devient lisible : description + fonctionnalités par plan.

insert into storage.buckets (id, name, public)
values ('immo', 'immo', true)
on conflict (id) do update set public = true;

alter table public.bien add column superficie_m2 integer;

alter table public.locataire
  add column photo_url text,
  add column date_naissance date,
  add column piece_type text check (piece_type in ('cni', 'passeport', 'permis', 'carte-sejour', 'autre')),
  add column piece_numero text,
  add column profession text;

alter table public.plan
  add column description text,
  add column fonctionnalites jsonb not null default '[]'::jsonb;

update public.plan set
  description = 'Pour démarrer : suivez vos premiers logements en toute simplicité.',
  fonctionnalites = '[
    "Jusqu''à 3 baux actifs",
    "Biens, lots et locataires illimités",
    "Espace locataire avec code de bien",
    "Déclaration et confirmation des loyers",
    "Quittances numérotées automatiquement",
    "Suivi des loyers mois par mois"
  ]'::jsonb
where id = 'essentiel';

update public.plan set
  description = 'Pour les propriétaires qui développent leur parc et soignent leur image.',
  fonctionnalites = '[
    "Jusqu''à 20 baux actifs",
    "Tout le plan Essentiel",
    "Photos et présentation de vos biens",
    "Historique complet des baux et locataires",
    "Signalements : pannes et litiges",
    "Tableau de bord avec graphiques"
  ]'::jsonb
where id = 'pro';

update public.plan set
  description = 'Pour les professionnels de l''immobilier et les grandes agences.',
  fonctionnalites = '[
    "Baux illimités",
    "Tout le plan Pro",
    "Reversements automatiques aux propriétaires",
    "Export et analyse des données",
    "Plusieurs gestionnaires sur un même parc",
    "Accompagnement prioritaire"
  ]'::jsonb
where id = 'business';