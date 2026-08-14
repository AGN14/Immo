-- =============================================================================
-- Immo — schéma initial
--
-- Modèle : Proprietaire → Bien → Lot → Bail → Locataire, paiements sur le bail.
-- Le bail est l'unité facturée : c'est le nombre de baux ACTIFS qui détermine
-- le palier. Ni les biens, ni les lots vacants, ni les locataires ne comptent.
-- =============================================================================

-- ------------------------------------------------------------------ paliers
-- Table de référence : c'est elle qui fait autorité pour l'application de la
-- limite. Le fichier src/lib/plans.ts porte les mêmes valeurs pour l'affichage
-- de la page Tarifs — les deux doivent rester alignés.
create table public.plan (
  id text primary key check (id in ('essentiel', 'pro', 'business')),
  nom text not null,
  prix_fcfa integer not null check (prix_fcfa >= 0),
  -- null = illimité
  max_baux integer check (max_baux is null or max_baux > 0)
);

insert into public.plan (id, nom, prix_fcfa, max_baux) values
  ('essentiel', 'Essentiel', 0, 3),
  ('pro', 'Pro', 5000, 20),
  ('business', 'Business', 15000, null);

-- ------------------------------------------------------------ propriétaires
create table public.proprietaire (
  id uuid primary key default gen_random_uuid(),
  -- Rempli à la bascule vers Supabase Auth ; les politiques RLS s'appuient dessus.
  auth_user_id uuid unique references auth.users (id) on delete set null,
  nom text not null,
  email text not null unique,
  plan_id text not null default 'essentiel' references public.plan (id),
  cree_le timestamptz not null default now()
);

-- ------------------------------------------------------------------- biens
create table public.bien (
  id uuid primary key default gen_random_uuid(),
  proprietaire_id uuid not null references public.proprietaire (id) on delete cascade,
  nom text not null,
  type text not null check (type in ('immeuble', 'residence', 'concession', 'villa', 'maison')),
  adresse text not null,
  quartier text not null,
  ville text not null,
  cree_le timestamptz not null default now()
);

create index bien_proprietaire_idx on public.bien (proprietaire_id);

-- --------------------------------------------------------------------- lots
create table public.lot (
  id uuid primary key default gen_random_uuid(),
  bien_id uuid not null references public.bien (id) on delete cascade,
  nom text not null,
  -- Vocabulaire du marché ouest-africain. À partir de trois chambres, on parle
  -- d'appartement : il n'y a donc pas de palier « 3-chambres-salon ».
  composition text not null check (
    composition in (
      'entrer-coucher',
      'chambre-salon',
      '2-chambres-salon',
      'studio',
      'appartement',
      'villa',
      'boutique'
    )
  ),
  -- Ce que le logement vaut, indépendamment de son occupation : un lot vacant
  -- garde son prix. Le loyer réellement payé vit sur le bail et peut différer.
  -- Null tant que le propriétaire n'a pas fixé son prix.
  loyer_reference_fcfa integer check (loyer_reference_fcfa is null or loyer_reference_fcfa >= 0),
  cree_le timestamptz not null default now(),
  -- Deux lots homonymes dans le même bien seraient indistinguables.
  unique (bien_id, nom)
);

create index lot_bien_idx on public.lot (bien_id);

-- -------------------------------------------------------------- locataires
create table public.locataire (
  id uuid primary key default gen_random_uuid(),
  -- Les coordonnées d'un locataire ne franchissent jamais la frontière d'un parc.
  proprietaire_id uuid not null references public.proprietaire (id) on delete cascade,
  nom text not null,
  telephone text,
  email text,
  cree_le timestamptz not null default now()
);

create index locataire_proprietaire_idx on public.locataire (proprietaire_id);

-- --------------------------------------------------------------------- baux
create table public.bail (
  id uuid primary key default gen_random_uuid(),
  lot_id uuid not null references public.lot (id) on delete cascade,
  -- on delete restrict : on ne supprime pas un locataire qui a un historique.
  locataire_id uuid not null references public.locataire (id) on delete restrict,
  loyer_mensuel_fcfa integer not null check (loyer_mensuel_fcfa >= 0),
  date_debut date not null,
  date_fin date,
  statut text not null check (statut in ('actif', 'termine')),
  cree_le timestamptz not null default now(),
  -- Un bail actif court encore ; un bail terminé a forcément une date de fin.
  constraint bail_dates_coherentes check (
    (statut = 'actif' and date_fin is null)
    or (statut = 'termine' and date_fin is not null and date_fin >= date_debut)
  )
);

create index bail_lot_idx on public.bail (lot_id);
create index bail_locataire_idx on public.bail (locataire_id);

-- Un lot ne peut porter qu'UN bail actif à la fois. C'est la contrainte qui
-- interdit structurellement d'empiler plusieurs loyers sur un même logement
-- pour rester sous la limite d'un palier.
create unique index bail_un_seul_actif_par_lot on public.bail (lot_id) where statut = 'actif';

-- --------------------------------------------------------------- paiements
create table public.paiement (
  id uuid primary key default gen_random_uuid(),
  bail_id uuid not null references public.bail (id) on delete cascade,
  periode text not null check (periode ~ '^\d{4}-(0[1-9]|1[0-2])$'),
  montant_fcfa integer not null check (montant_fcfa >= 0),
  methode text not null check (methode in ('mobile-money', 'virement', 'especes')),
  statut text not null check (statut in ('recu', 'en-attente', 'echoue')),
  date_paiement date,
  cree_le timestamptz not null default now(),
  -- Un seul paiement par bail et par mois : pas de doublon d'encaissement.
  unique (bail_id, periode),
  -- Un paiement reçu porte forcément sa date.
  constraint paiement_date_si_recu check (statut <> 'recu' or date_paiement is not null)
);

create index paiement_bail_idx on public.paiement (bail_id);

-- ============================================================== quota =======

-- Compte les logements effectivement loués d'un propriétaire.
create or replace function public.baux_actifs_du_proprietaire(p_proprietaire_id uuid)
returns integer
language sql
stable
security definer
set search_path = public
as $$
  select count(*)::integer
  from public.bail b
  join public.lot l on l.id = b.lot_id
  join public.bien bi on bi.id = l.bien_id
  where bi.proprietaire_id = p_proprietaire_id
    and b.statut = 'actif';
$$;

-- Applique la limite du palier au moment où un bail devient actif.
--
-- Le contrôle vit ici, dans une transaction, et non dans l'interface : un
-- bouton désactivé n'arrête pas un appel direct. Le SELECT ... FOR UPDATE sur
-- la ligne du propriétaire sérialise deux créations simultanées, sans quoi
-- elles passeraient toutes les deux le comptage et créeraient un bail de trop.
--
-- Déclenché en AFTER, et non en BEFORE : les lignes d'un même INSERT multi-
-- lignes ne sont pas visibles entre elles dans un trigger BEFORE, si bien qu'un
-- seul INSERT de dix baux les aurait tous vus passer. En AFTER, chaque ligne
-- voit ses sœurs, et le compte est exact.
create or replace function public.verifier_quota_bail()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_proprietaire_id uuid;
  v_max integer;
  v_actifs integer;
begin
  if new.statut <> 'actif' then
    return null;
  end if;

  select bi.proprietaire_id
    into v_proprietaire_id
  from public.lot l
  join public.bien bi on bi.id = l.bien_id
  where l.id = new.lot_id;

  select p.max_baux
    into v_max
  from public.proprietaire pr
  join public.plan p on p.id = pr.plan_id
  where pr.id = v_proprietaire_id
  for update of pr;

  -- Palier illimité : rien à vérifier.
  if v_max is null then
    return null;
  end if;

  select count(*)
    into v_actifs
  from public.bail b
  join public.lot l on l.id = b.lot_id
  join public.bien bi on bi.id = l.bien_id
  where bi.proprietaire_id = v_proprietaire_id
    and b.statut = 'actif'
    and b.id is distinct from new.id;

  if v_actifs >= v_max then
    raise exception 'QUOTA_ATTEINT'
      using
        detail = format('%s logements loués sur %s autorisés', v_actifs, v_max),
        errcode = 'check_violation';
  end if;

  return null;
end;
$$;

create trigger bail_verifier_quota
  after insert or update of statut, lot_id on public.bail
  for each row
  execute function public.verifier_quota_bail();
