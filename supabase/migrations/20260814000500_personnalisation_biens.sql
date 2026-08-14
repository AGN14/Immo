-- Personnalisation des biens : présentation (photo, description) et
-- équipements. Tout est optionnel : un bien reste créable sans rien de tout ça,
-- et les biens existants sont inchangés (valeurs par défaut).

alter table public.bien
  add column description text,
  add column image_url text,
  add column garage boolean not null default false,
  add column balcon boolean not null default false,
  add column ascenseur boolean not null default false,
  add column climatisation boolean not null default false;
