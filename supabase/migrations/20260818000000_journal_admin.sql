-- =============================================================================
-- Journal d'audit des gestes admin.
--
-- Changer le plan d'un compte ou prolonger son abonnement à la main engage
-- l'argent du SaaS (un mois offert, un palier forcé) : on doit savoir QUI a
-- fait QUOI, QUAND et SUR QUEL compte. Jusqu'ici ces gestes ne laissaient
-- qu'une ligne d'abonnement à 0 F, muette sur son auteur.
--
-- Écriture serveur uniquement (clé de service), comme `abonnement` : aucune
-- politique d'insertion pour les clients, RLS ne sert qu'à fermer la lecture.
-- =============================================================================

create table public.evenement_admin (
  id uuid primary key default gen_random_uuid(),
  cree_le timestamptz not null default now(),
  acteur_email text not null,
  action text not null check (action in ('plan_change', 'prolongation')),
  proprietaire_id uuid references public.proprietaire (id) on delete set null,
  resume text not null
);

create index evenement_admin_recent_idx on public.evenement_admin (cree_le desc);
create index evenement_admin_proprietaire_idx on public.evenement_admin (proprietaire_id, cree_le desc);

alter table public.evenement_admin enable row level security;

comment on table public.evenement_admin is
  'Audit des gestes manuels depuis /admin : changement de plan, prolongation.';
