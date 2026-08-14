-- =============================================================================
-- Espace locataire : paiements, quittances, reversements, signalements
--
-- Principe central : un ACTE DE PAIEMENT n'est pas un MOIS DE LOYER.
-- Un versement couvre 1 à N mois ; chaque mois reste une ligne, parce qu'une
-- quittance est mensuelle. La confirmation porte sur le versement — l'opérateur
-- confirme une transaction, pas un mois.
--
-- Étape 1 (aujourd'hui) : le locataire déclare, le propriétaire confirme.
-- Étape 2 (PawaPay)     : l'opérateur confirme par webhook. Seul l'auteur de la
--                          confirmation change ; le modèle reste identique.
-- =============================================================================

-- ------------------------------------------------------------- échéances
-- Le loyer est payé d'avance : l'échéance de la période 2026-09 tombe le
-- jour_echeance de septembre 2026. Défaut au 5, surchargeable par bail.
alter table public.proprietaire
  add column jour_echeance_defaut smallint not null default 5
    check (jour_echeance_defaut between 1 and 31),
  -- Jour du mois où Immo reverse les loyers collectés. Défini par le propriétaire.
  add column jour_reversement smallint not null default 1
    check (jour_reversement between 1 and 28),
  -- Compteur de numérotation des quittances : continu et sans trou.
  add column compteur_quittance integer not null default 0;

alter table public.bail
  add column jour_echeance smallint check (jour_echeance between 1 and 31);

comment on column public.bail.jour_echeance is
  'Surcharge du jour d''échéance négocié sur ce bail. Null = règle du propriétaire.';

-- ----------------------------------------------------------- reversements
-- Le virement mensuel d'Immo vers le propriétaire, groupant les loyers encaissés.
create table public.reversement (
  id uuid primary key default gen_random_uuid(),
  proprietaire_id uuid not null references public.proprietaire (id) on delete restrict,
  periode text not null check (periode ~ '^\d{4}-(0[1-9]|1[0-2])$'),
  montant_brut_fcfa integer not null check (montant_brut_fcfa >= 0),
  commission_fcfa integer not null default 0 check (commission_fcfa >= 0),
  montant_net_fcfa integer not null check (montant_net_fcfa >= 0),
  statut text not null check (statut in ('prevu', 'envoye', 'echoue')),
  -- Identifiant du payout chez le prestataire (PawaPay).
  reference_externe text,
  prevu_le date not null,
  execute_le timestamptz,
  cree_le timestamptz not null default now(),
  unique (proprietaire_id, periode),
  constraint reversement_net_coherent check (montant_net_fcfa = montant_brut_fcfa - commission_fcfa)
);

create index reversement_proprietaire_idx on public.reversement (proprietaire_id);

-- ------------------------------------------------------------- versements
create table public.versement (
  id uuid primary key default gen_random_uuid(),
  bail_id uuid not null references public.bail (id) on delete restrict,
  montant_total_fcfa integer not null check (montant_total_fcfa > 0),
  methode text not null check (methode in ('mobile-money', 'virement', 'especes')),
  -- Référence saisie par le locataire à l'étape 1, identifiant PawaPay à l'étape 2.
  reference_externe text,
  statut text not null check (statut in ('initie', 'confirme', 'echoue', 'annule')),
  -- Qui a confirmé : c'est la seule chose qui changera avec l'intégration.
  confirme_par text check (confirme_par in ('proprietaire', 'operateur')),
  declare_le timestamptz not null default now(),
  confirme_le timestamptz,
  -- Rattachement au virement mensuel vers le propriétaire.
  reversement_id uuid references public.reversement (id) on delete set null,
  constraint versement_confirmation_coherente check (
    (statut = 'confirme' and confirme_le is not null and confirme_par is not null)
    or (statut <> 'confirme' and confirme_le is null)
  )
);

create index versement_bail_idx on public.versement (bail_id);
create index versement_reversement_idx on public.versement (reversement_id);

-- --------------------------------------------------------------- paiements
-- Le paiement n'a plus ni méthode ni statut : ils appartiennent au versement.
-- Un mois sans ligne de paiement est un mois non payé — inutile de le stocker.
alter table public.paiement
  drop column methode,
  drop column statut,
  drop column date_paiement,
  add column versement_id uuid not null references public.versement (id) on delete cascade;

create index paiement_versement_idx on public.paiement (versement_id);

-- ------------------------------------------------------------- quittances
-- Émise dès la confirmation de l'encaissement : le locataire est libéré de sa
-- dette au moment où l'argent est reçu, indépendamment du reversement.
create table public.quittance (
  id uuid primary key default gen_random_uuid(),
  paiement_id uuid not null unique references public.paiement (id) on delete restrict,
  proprietaire_id uuid not null references public.proprietaire (id) on delete restrict,
  -- Continu et sans trou par propriétaire : un trou invalide la comptabilité.
  numero text not null,
  emise_le timestamptz not null default now(),
  -- Une quittance ne se corrige pas : on l'annule et on en réémet une.
  annulee_le timestamptz,
  motif_annulation text,
  unique (proprietaire_id, numero)
);

create index quittance_proprietaire_idx on public.quittance (proprietaire_id);

-- Attribue le prochain numéro en verrouillant la ligne du propriétaire, pour que
-- deux émissions simultanées ne puissent pas produire le même numéro.
create or replace function public.prochain_numero_quittance(p_proprietaire_id uuid)
returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  v_compteur integer;
begin
  update public.proprietaire
     set compteur_quittance = compteur_quittance + 1
   where id = p_proprietaire_id
  returning compteur_quittance into v_compteur;

  return to_char(now(), 'YYYY') || '-' || lpad(v_compteur::text, 4, '0');
end;
$$;

-- ----------------------------------------------------------- signalements
-- Rattaché au LOT, pas au bail : une fuite est un fait du logement et doit
-- rester visible quand le locataire change. On garde qui l'a signalée.
create table public.signalement (
  id uuid primary key default gen_random_uuid(),
  lot_id uuid not null references public.lot (id) on delete cascade,
  -- Null quand c'est le propriétaire qui signale sur un lot vacant.
  bail_id uuid references public.bail (id) on delete set null,
  titre text not null,
  description text not null,
  urgence text not null default 'normale' check (urgence in ('basse', 'normale', 'haute')),
  -- « confirme » = le locataire valide la résolution. Sans cette étape, le
  -- propriétaire clôt seul et le désaccord devient un litige.
  statut text not null default 'signale'
    check (statut in ('signale', 'pris-en-charge', 'resolu', 'confirme', 'annule')),
  cree_le timestamptz not null default now(),
  pris_en_charge_le timestamptz,
  resolu_le timestamptz,
  confirme_le timestamptz
);

create index signalement_lot_idx on public.signalement (lot_id);
create index signalement_bail_idx on public.signalement (bail_id);

create table public.signalement_photo (
  id uuid primary key default gen_random_uuid(),
  signalement_id uuid not null references public.signalement (id) on delete cascade,
  chemin text not null,
  ordre smallint not null default 0,
  cree_le timestamptz not null default now(),
  unique (signalement_id, ordre)
);

create index signalement_photo_idx on public.signalement_photo (signalement_id);

-- « Trois photos suffisent » : la promesse du site devient une contrainte.
create or replace function public.limiter_photos_signalement()
returns trigger
language plpgsql
as $$
begin
  if (select count(*) from public.signalement_photo where signalement_id = new.signalement_id) > 3 then
    raise exception 'TROP_DE_PHOTOS' using detail = 'Trois photos au maximum par signalement.';
  end if;
  return null;
end;
$$;

create trigger signalement_photo_limite
  after insert on public.signalement_photo
  for each row
  execute function public.limiter_photos_signalement();

-- Le fil horodaté qui remplace la conversation WhatsApp.
create table public.signalement_message (
  id uuid primary key default gen_random_uuid(),
  signalement_id uuid not null references public.signalement (id) on delete cascade,
  auteur text not null check (auteur in ('locataire', 'proprietaire')),
  corps text not null,
  cree_le timestamptz not null default now()
);

create index signalement_message_idx on public.signalement_message (signalement_id, cree_le);

-- ============================================================ RLS ==========

alter table public.reversement enable row level security;
alter table public.versement enable row level security;
alter table public.quittance enable row level security;
alter table public.signalement enable row level security;
alter table public.signalement_photo enable row level security;
alter table public.signalement_message enable row level security;

-- Le locataire connecté, résolu depuis le jeton Supabase Auth. Pendant de
-- proprietaire_courant() : c'est ce qui cloisonnera l'espace locataire.
alter table public.locataire
  add column auth_user_id uuid unique references auth.users (id) on delete set null;

create or replace function public.locataire_courant()
returns uuid
language sql
stable
security definer
set search_path = public
as $$
  select id from public.locataire where auth_user_id = auth.uid();
$$;

create policy "reversement: les siens"
  on public.reversement for select
  to authenticated
  using (proprietaire_id = public.proprietaire_courant());

create policy "versement: propriétaire et locataire concernés"
  on public.versement for all
  to authenticated
  using (
    exists (
      select 1
      from public.bail b
      join public.lot l on l.id = b.lot_id
      join public.bien bi on bi.id = l.bien_id
      where b.id = versement.bail_id
        and (
          bi.proprietaire_id = public.proprietaire_courant()
          or b.locataire_id = public.locataire_courant()
        )
    )
  )
  with check (
    exists (
      select 1 from public.bail b
      where b.id = versement.bail_id
        and b.locataire_id = public.locataire_courant()
    )
  );

create policy "quittance: propriétaire et locataire concernés"
  on public.quittance for select
  to authenticated
  using (
    proprietaire_id = public.proprietaire_courant()
    or exists (
      select 1
      from public.paiement p
      join public.bail b on b.id = p.bail_id
      where p.id = quittance.paiement_id
        and b.locataire_id = public.locataire_courant()
    )
  );

create policy "signalement: propriétaire et locataire concernés"
  on public.signalement for all
  to authenticated
  using (
    exists (
      select 1
      from public.lot l
      join public.bien bi on bi.id = l.bien_id
      where l.id = signalement.lot_id
        and bi.proprietaire_id = public.proprietaire_courant()
    )
    or exists (
      select 1 from public.bail b
      where b.id = signalement.bail_id
        and b.locataire_id = public.locataire_courant()
    )
  )
  with check (
    exists (
      select 1
      from public.lot l
      join public.bien bi on bi.id = l.bien_id
      where l.id = signalement.lot_id
        and bi.proprietaire_id = public.proprietaire_courant()
    )
    or exists (
      select 1 from public.bail b
      where b.id = signalement.bail_id
        and b.locataire_id = public.locataire_courant()
    )
  );

create policy "photos: suivent leur signalement"
  on public.signalement_photo for all
  to authenticated
  using (
    exists (select 1 from public.signalement s where s.id = signalement_photo.signalement_id)
  )
  with check (
    exists (select 1 from public.signalement s where s.id = signalement_photo.signalement_id)
  );

create policy "messages: suivent leur signalement"
  on public.signalement_message for all
  to authenticated
  using (
    exists (select 1 from public.signalement s where s.id = signalement_message.signalement_id)
  )
  with check (
    exists (select 1 from public.signalement s where s.id = signalement_message.signalement_id)
  );
