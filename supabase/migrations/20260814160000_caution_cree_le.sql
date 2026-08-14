-- Horodatage manquant sur la table caution (tri par défaut de la liste).

alter table public.caution
  add column cree_le timestamptz not null default now();

create index if not exists caution_cree_le_idx on public.caution (cree_le desc);