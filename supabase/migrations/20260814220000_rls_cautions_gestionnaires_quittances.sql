-- =============================================================================
-- Correctif de sécurité : trois tables mal gardées.
--
-- 1. `caution` et `gestionnaire` n'ont jamais reçu `enable row level security`.
--    La migration `privileges` accorde pourtant `grant all` à anon et
--    authenticated — son commentaire précise « c'est RLS qui garde la porte ».
--    C'est vrai lorsque RLS est activée. Ici elle ne l'était pas, et le grant
--    valait donc accès total : vérifié en conditions réelles, un locataire
--    pouvait insérer un gestionnaire dans le parc de son propriétaire.
--
--    Sans conséquence tant que l'application n'utilise que la clé de service,
--    mais la clé publiable part dans le navigateur : quiconque la lit pouvait
--    écrire dans ces deux tables.
--
-- 2. `quittance` n'a qu'une politique de lecture. Sous RLS, l'émission d'une
--    quittance à la confirmation d'un versement échouerait.
--
-- Rappel de la règle établie au correctif précédent : une politique
-- n'interroge jamais directement une table dont la politique renvoie vers la
-- première. On passe par les fonctions SECURITY DEFINER déjà en place.
-- =============================================================================

-- ------------------------------------------------------------- cautions
alter table public.caution enable row level security;

-- La caution suit son bail : le propriétaire du parc la gère, le locataire
-- concerné la consulte — c'est son argent.
create policy "caution: celles de son parc"
  on public.caution for all
  to authenticated
  using (bail_id in (select public.baux_du_proprietaire()))
  with check (bail_id in (select public.baux_du_proprietaire()));

create policy "caution: la sienne, en lecture"
  on public.caution for select
  to authenticated
  using (bail_id in (select public.baux_du_locataire()));

-- -------------------------------------------------------- gestionnaires
alter table public.gestionnaire enable row level security;

-- Rattachement direct, et strictement réservé au propriétaire : un locataire
-- n'a rien à connaître de l'organisation interne du parc.
create policy "gestionnaire: les siens"
  on public.gestionnaire for all
  to authenticated
  using (proprietaire_id = public.proprietaire_courant())
  with check (proprietaire_id = public.proprietaire_courant());

-- ------------------------------------------------------------ quittances
-- L'émission accompagne la confirmation d'un versement : c'est un acte du
-- propriétaire, jamais du locataire, qui ne peut que la lire.
create policy "quittance: le proprietaire emet les siennes"
  on public.quittance for insert
  to authenticated
  with check (proprietaire_id = public.proprietaire_courant());

-- L'annulation d'une quittance est une correction comptable : elle reste
-- possible, mais uniquement sur son propre parc.
create policy "quittance: le proprietaire annule les siennes"
  on public.quittance for update
  to authenticated
  using (proprietaire_id = public.proprietaire_courant())
  with check (proprietaire_id = public.proprietaire_courant());

-- ------------------------------------------------------------ vérification
-- Filet de sécurité : toute table du schéma public sans RLS activée est une
-- porte ouverte, vu les grants accordés. On échoue bruyamment plutôt que de
-- laisser passer la prochaine.
do $$
declare
  v_sans text;
begin
  select string_agg(c.relname, ', ')
    into v_sans
  from pg_class c
  join pg_namespace n on n.oid = c.relnamespace
  where n.nspname = 'public'
    and c.relkind = 'r'
    and not c.relrowsecurity;

  if v_sans is not null then
    raise exception 'TABLES_SANS_RLS'
      using detail = format('RLS désactivée sur : %s', v_sans);
  end if;
end $$;
