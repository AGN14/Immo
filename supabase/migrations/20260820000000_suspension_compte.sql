-- =============================================================================
-- Restriction des comptes : suspension.
--
-- Suspendre n'est pas supprimer : les baux, versements et quittances restent
-- intacts, mais le compte ne passe plus nulle part — ni l'interface (session
-- résolue à null), ni la base (fonction portail et politiques ci-dessous).
--
-- Le verrou tient en UN point : `proprietaire_courant()`, qu'utilisent toutes
-- les politiques du parc. Un suspendu y vaut NULL, et `x = NULL` n'est jamais
-- vrai — lecture comme écriture tombent d'un coup, sans toucher à chaque
-- politique. Seule la fiche elle-même (politiques adossées à `auth.uid()`
-- directement) reçoit le même filtre en clair.
--
-- À noter en marge : le bucket `immo` est public sans politique d'écriture
-- côté base — les dépôts passent uniquement par les actions serveur, déjà
-- fermées aux suspendus via la session. Un jeton encore valide dans l'heure
-- qui suit la suspension peut finir ses lectures publiques, pas écrire.
-- =============================================================================

alter table public.proprietaire
  add column suspendu_le timestamptz;

comment on column public.proprietaire.suspendu_le is
  'Compte restreint par un modérateur : banni de la session et de RLS, données intactes.';

create or replace function public.proprietaire_courant()
returns uuid
language sql
stable
security definer
set search_path = public
as $$
  select id from public.proprietaire
  where auth_user_id = auth.uid()
    and suspendu_le is null;
$$;

drop policy if exists "proprietaire: sa fiche" on public.proprietaire;
create policy "proprietaire: sa fiche"
  on public.proprietaire for select
  to authenticated
  using (auth_user_id = auth.uid() and suspendu_le is null);

drop policy if exists "proprietaire: modifie sa fiche" on public.proprietaire;
create policy "proprietaire: modifie sa fiche"
  on public.proprietaire for update
  to authenticated
  using (auth_user_id = auth.uid() and suspendu_le is null)
  with check (auth_user_id = auth.uid() and suspendu_le is null);

-- Le journal suit : une suspension sans trace de son auteur est exclue.
alter table public.evenement_admin
  drop constraint evenement_admin_action_check;

alter table public.evenement_admin
  add constraint evenement_admin_action_check
  check (action in ('plan_change', 'prolongation', 'moderation_statut', 'moderation_urgence', 'suspension', 'reintegration'));
