-- =============================================================================
-- Abonnements : le palier se paie, et il expire.
--
-- Jusqu'ici `choisirPlan` écrivait le palier sans rien facturer — passer en
-- Business était gratuit. On introduit donc une échéance, et l'historique des
-- paiements qui la prolonge.
--
-- PRINCIPE : le palier EFFECTIF se déduit, il n'est jamais rétrogradé par une
-- écriture. `plan_id` retient ce qui a été payé, `plan_expire_le` jusqu'à
-- quand ; passé cette date, le compte retombe sur Essentiel sans que personne
-- n'ait rien à exécuter. Même raisonnement que pour les statuts de loyer : une
-- tâche nocturne qui rétrograde les comptes se désynchronise au premier
-- incident, et laisse des propriétaires payants bloqués un dimanche.
--
-- CONSÉQUENCE VOULUE : un propriétaire sur Pro avec 12 baux qui ne renouvelle
-- pas garde ses 12 baux — rien n'est perdu, rien n'est masqué — mais ne peut
-- plus en créer tant qu'il dépasse la limite d'Essentiel. C'est le trigger de
-- quota qui l'applique, une fois branché sur le palier effectif.
-- =============================================================================

alter table public.proprietaire
  add column plan_expire_le timestamptz;

comment on column public.proprietaire.plan_expire_le is
  'Fin de la période payée. Null = palier gratuit, sans échéance.';

-- ------------------------------------------------------------ palier effectif
-- Essentiel est gratuit : il n'expire jamais et sert de filet.
create or replace function public.plan_effectif(p_proprietaire_id uuid)
returns uuid
language sql
stable
security definer
set search_path = public
as $$
  select case
    when pr.plan_expire_le is null then pr.plan_id
    when pr.plan_expire_le > now() then pr.plan_id
    else (select id from public.plan where slug = 'essentiel')
  end
  from public.proprietaire pr
  where pr.id = p_proprietaire_id;
$$;

comment on function public.plan_effectif is
  'Palier réellement applicable : celui payé s''il court encore, Essentiel sinon.';

-- ------------------------------------------------------------- abonnements
-- Chaque paiement prolonge la période. On garde la trace pour la comptabilité
-- et pour qu'un propriétaire puisse justifier ce qu'il a versé.
create table public.abonnement (
  id uuid primary key default gen_random_uuid(),
  proprietaire_id uuid not null references public.proprietaire (id) on delete cascade,
  plan_id uuid not null references public.plan (id),
  montant_fcfa integer not null check (montant_fcfa >= 0),
  -- Identifiant de transaction chez l'opérateur de paiement.
  reference_externe text not null,
  periode_debut timestamptz not null default now(),
  periode_fin timestamptz not null,
  cree_le timestamptz not null default now(),
  constraint abonnement_periode_coherente check (periode_fin > periode_debut)
);

create index abonnement_proprietaire_idx on public.abonnement (proprietaire_id, periode_fin desc);

-- Même garde-fou que pour les loyers : une transaction ne peut prolonger
-- qu'un seul abonnement. Sans ça, un rejeu du callback offrirait des mois.
create unique index abonnement_transaction_unique on public.abonnement (reference_externe);

alter table public.abonnement enable row level security;

create policy "abonnement: les siens"
  on public.abonnement for select
  to authenticated
  using (proprietaire_id = public.proprietaire_courant());

-- L'écriture passe par le serveur applicatif, après vérification du paiement
-- auprès de l'opérateur : aucune politique d'insertion pour les clients.

-- --------------------------------------------------------- quota : palier réel
-- Le trigger lisait `pr.plan_id`, c'est-à-dire le palier PAYÉ, même expiré.
-- Un compte Pro échu conservait donc ses 20 baux autorisés. On le branche sur
-- le palier effectif : à l'expiration, la limite d'Essentiel s'applique, et
-- les baux existants restent intacts mais aucun nouveau ne passe.
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

  -- Le verrou reste sur la ligne du propriétaire : deux créations simultanées
  -- passeraient sinon toutes les deux le comptage.
  perform 1 from public.proprietaire where id = v_proprietaire_id for update;

  select p.max_baux
    into v_max
  from public.plan p
  where p.id = public.plan_effectif(v_proprietaire_id);

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
