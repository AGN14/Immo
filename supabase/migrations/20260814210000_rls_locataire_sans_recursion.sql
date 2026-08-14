-- =============================================================================
-- Correctif : récursion infinie dans les politiques de l'espace locataire.
--
-- La migration précédente a introduit un cycle. La politique « lot » que j'y
-- ai ajoutée interroge `bail` ; la politique « bail » existante interroge
-- `lot`. Chaque évaluation déclenche l'autre, et PostgreSQL s'arrête sur
-- 42P17 — pour le locataire comme pour le propriétaire, puisque le cycle
-- vaut dans les deux sens.
--
-- Le remède est celui déjà employé par `locataire_courant()` : une fonction
-- SECURITY DEFINER s'exécute avec les droits de son propriétaire, donc sans
-- déclencher les politiques des tables qu'elle lit. La chaîne de rattachement
-- se résout alors une fois, hors du système de politiques, et le cycle
-- disparaît.
--
-- Règle à retenir pour la suite : une politique ne doit jamais interroger
-- directement une table qui possède elle-même une politique renvoyant vers la
-- première. On passe par une fonction.
-- =============================================================================

-- ------------------------------------------------- résolutions cloisonnées
-- Chacune répond à « quels identifiants appartiennent au locataire connecté ? »
-- sans jamais passer par les politiques des tables traversées.

create or replace function public.baux_du_locataire()
returns setof uuid
language sql
stable
security definer
set search_path = public
as $$
  select id from public.bail where locataire_id = public.locataire_courant();
$$;

create or replace function public.lots_du_locataire()
returns setof uuid
language sql
stable
security definer
set search_path = public
as $$
  select lot_id from public.bail where locataire_id = public.locataire_courant();
$$;

create or replace function public.biens_du_locataire()
returns setof uuid
language sql
stable
security definer
set search_path = public
as $$
  select l.bien_id
  from public.lot l
  where l.id in (select lot_id from public.bail where locataire_id = public.locataire_courant());
$$;

-- --------------------------------------------------- politiques corrigées

drop policy if exists "lot: celui de ses baux" on public.lot;
create policy "lot: celui de ses baux"
  on public.lot for select
  to authenticated
  using (id in (select public.lots_du_locataire()));

drop policy if exists "bien: celui de son logement" on public.bien;
create policy "bien: celui de son logement"
  on public.bien for select
  to authenticated
  using (id in (select public.biens_du_locataire()));

drop policy if exists "paiement: ceux de ses baux" on public.paiement;
create policy "paiement: ceux de ses baux"
  on public.paiement for select
  to authenticated
  using (bail_id in (select public.baux_du_locataire()));

drop policy if exists "paiement: declare les siens" on public.paiement;
create policy "paiement: declare les siens"
  on public.paiement for insert
  to authenticated
  with check (bail_id in (select public.baux_du_locataire()));

-- `bail: les siens` ne traversait aucune table : elle ne participait pas au
-- cycle et reste inchangée.

-- ------------------------------------------- politiques du propriétaire
-- Elles interrogent `lot` et `bien`, qui portent désormais une politique
-- renvoyant vers `bail` : le cycle existerait toujours dans l'autre sens.
-- On leur applique le même traitement.

create or replace function public.lots_du_proprietaire()
returns setof uuid
language sql
stable
security definer
set search_path = public
as $$
  select l.id
  from public.lot l
  join public.bien b on b.id = l.bien_id
  where b.proprietaire_id = public.proprietaire_courant();
$$;

create or replace function public.baux_du_proprietaire()
returns setof uuid
language sql
stable
security definer
set search_path = public
as $$
  select b.id
  from public.bail b
  where b.lot_id in (select public.lots_du_proprietaire());
$$;

drop policy if exists "lot: les lots de ses biens" on public.lot;
create policy "lot: les lots de ses biens"
  on public.lot for all
  to authenticated
  using (id in (select public.lots_du_proprietaire()))
  with check (id in (select public.lots_du_proprietaire()));

drop policy if exists "bail: les baux de ses lots" on public.bail;
create policy "bail: les baux de ses lots"
  on public.bail for all
  to authenticated
  using (lot_id in (select public.lots_du_proprietaire()))
  with check (lot_id in (select public.lots_du_proprietaire()));

drop policy if exists "paiement: les paiements de ses baux" on public.paiement;
create policy "paiement: les paiements de ses baux"
  on public.paiement for all
  to authenticated
  using (bail_id in (select public.baux_du_proprietaire()))
  with check (bail_id in (select public.baux_du_proprietaire()));
