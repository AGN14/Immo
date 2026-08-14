-- =============================================================================
-- Politiques RLS — défense en profondeur
--
-- ÉTAT ACTUEL : l'application ne passe pas encore par Supabase Auth. Le serveur
-- interroge la base avec la clé de service, qui contourne RLS ; le cloisonnement
-- effectif est aujourd'hui assuré par la couche src/lib/data, où chaque requête
-- exige un proprietaire_id.
--
-- Ces politiques sont écrites maintenant pour deux raisons : elles empêchent
-- toute lecture depuis la clé publique (anon) dès aujourd'hui, et elles
-- deviennent la garantie principale le jour où proprietaire.auth_user_id sera
-- renseigné par Supabase Auth — sans qu'il y ait à repenser le modèle.
-- =============================================================================

alter table public.plan enable row level security;
alter table public.proprietaire enable row level security;
alter table public.bien enable row level security;
alter table public.lot enable row level security;
alter table public.locataire enable row level security;
alter table public.bail enable row level security;
alter table public.paiement enable row level security;

-- Le propriétaire connecté, résolu depuis le jeton Supabase Auth.
create or replace function public.proprietaire_courant()
returns uuid
language sql
stable
security definer
set search_path = public
as $$
  select id from public.proprietaire where auth_user_id = auth.uid();
$$;

-- Les paliers sont publics : la page Tarifs peut les lire sans être connectée.
create policy "plan: lecture publique"
  on public.plan for select
  to anon, authenticated
  using (true);

-- Un propriétaire ne voit que sa propre fiche.
create policy "proprietaire: sa fiche"
  on public.proprietaire for select
  to authenticated
  using (auth_user_id = auth.uid());

create policy "proprietaire: modifie sa fiche"
  on public.proprietaire for update
  to authenticated
  using (auth_user_id = auth.uid())
  with check (auth_user_id = auth.uid());

-- Biens : rattachement direct.
create policy "bien: son parc"
  on public.bien for all
  to authenticated
  using (proprietaire_id = public.proprietaire_courant())
  with check (proprietaire_id = public.proprietaire_courant());

-- Locataires : rattachement direct.
create policy "locataire: ses locataires"
  on public.locataire for all
  to authenticated
  using (proprietaire_id = public.proprietaire_courant())
  with check (proprietaire_id = public.proprietaire_courant());

-- Lots : par le bien parent.
create policy "lot: les lots de ses biens"
  on public.lot for all
  to authenticated
  using (
    exists (
      select 1 from public.bien b
      where b.id = lot.bien_id
        and b.proprietaire_id = public.proprietaire_courant()
    )
  )
  with check (
    exists (
      select 1 from public.bien b
      where b.id = lot.bien_id
        and b.proprietaire_id = public.proprietaire_courant()
    )
  );

-- Baux : par la chaîne lot → bien.
create policy "bail: les baux de ses lots"
  on public.bail for all
  to authenticated
  using (
    exists (
      select 1
      from public.lot l
      join public.bien b on b.id = l.bien_id
      where l.id = bail.lot_id
        and b.proprietaire_id = public.proprietaire_courant()
    )
  )
  with check (
    exists (
      select 1
      from public.lot l
      join public.bien b on b.id = l.bien_id
      where l.id = bail.lot_id
        and b.proprietaire_id = public.proprietaire_courant()
    )
  );

-- Paiements : par la chaîne bail → lot → bien.
create policy "paiement: les paiements de ses baux"
  on public.paiement for all
  to authenticated
  using (
    exists (
      select 1
      from public.bail ba
      join public.lot l on l.id = ba.lot_id
      join public.bien b on b.id = l.bien_id
      where ba.id = paiement.bail_id
        and b.proprietaire_id = public.proprietaire_courant()
    )
  )
  with check (
    exists (
      select 1
      from public.bail ba
      join public.lot l on l.id = ba.lot_id
      join public.bien b on b.id = l.bien_id
      where ba.id = paiement.bail_id
        and b.proprietaire_id = public.proprietaire_courant()
    )
  );
