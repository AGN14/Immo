-- Gestionnaires d'un parc (plan Business) et cautions liées aux baux.

create table if not exists public.gestionnaire (
  id uuid primary key default gen_random_uuid(),
  proprietaire_id uuid not null references public.proprietaire (id) on delete cascade,
  nom text not null,
  email text,
  telephone text,
  cree_le timestamptz not null default now()
);

create index if not exists gestionnaire_proprietaire_idx on public.gestionnaire (proprietaire_id);

create table if not exists public.caution (
  id uuid primary key default gen_random_uuid(),
  bail_id uuid not null references public.bail (id) on delete cascade,
  montant_fcfa integer not null check (montant_fcfa > 0),
  statut text not null default 'due' check (statut in ('due', 'encaisee', 'restituee')),
  encaissee_le timestamptz,
  restituee_le timestamptz
);

create unique index if not exists caution_un_par_bail on public.caution (bail_id);