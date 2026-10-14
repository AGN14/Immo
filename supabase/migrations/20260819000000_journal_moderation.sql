-- =============================================================================
-- Journal d'audit : la modération aussi laisse une trace.
--
-- Les transitions de statut et changements d'urgence décidés par un
-- modérateur engagent la responsabilité de la plateforme (fermer le
-- signalement de quelqu'un d'autre) : même traçabilité que les gestes
-- commerciaux — acteur, cible, résumé.
-- =============================================================================

alter table public.evenement_admin
  drop constraint evenement_admin_action_check;

alter table public.evenement_admin
  add constraint evenement_admin_action_check
  check (action in ('plan_change', 'prolongation', 'moderation_statut', 'moderation_urgence'));
