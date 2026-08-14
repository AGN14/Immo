-- Migration : Passage des plans en UUID
-- 1. On prépare la table plan
alter table public.proprietaire drop constraint if exists proprietaire_plan_id_fkey;

-- 2. On transforme la table plan
-- On garde l'ancien ID comme 'slug' pour la logique applicative
alter table public.plan rename column id to slug;
alter table public.plan add column id uuid default gen_random_uuid();

-- On insère des UUID fixes pour les plans de base (pour la cohérence du code)
update public.plan set id = '1799276d-4950-4050-93a8-4e38c92a6320' where slug = 'essentiel';
update public.plan set id = 'd14214f0-466d-4665-961a-821b0d2d3a6d' where slug = 'pro';
update public.plan set id = '74900a30-67c8-4777-a896-7a8717833a6c' where slug = 'business';

alter table public.plan alter column id set not null;
alter table public.plan drop constraint plan_pkey cascade;
alter table public.plan add primary key (id);
alter table public.plan add constraint plan_slug_key unique (slug);

-- 3. On met à jour la table proprietaire
-- On transforme temporairement plan_id pour stocker les UUID
alter table public.proprietaire rename column plan_id to plan_slug;
alter table public.proprietaire add column plan_id uuid;

-- Migration des données existantes (même si vide pour l'instant)
update public.proprietaire p
set plan_id = pl.id
from public.plan pl
where p.plan_slug = pl.slug;

-- On définit le défaut sur l'UUID d'Essentiel
alter table public.proprietaire alter column plan_id set default '1799276d-4950-4050-93a8-4e38c92a6320';
alter table public.proprietaire alter column plan_id set not null;
alter table public.proprietaire add constraint proprietaire_plan_id_fkey foreign key (plan_id) references public.plan(id);

-- On fait le ménage
alter table public.proprietaire drop column plan_slug;
