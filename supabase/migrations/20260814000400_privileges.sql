-- =============================================================================
-- Privilèges des rôles Supabase.
--
-- Les tables sont créées par nos migrations, pas par le tableau de bord :
-- les rôles anon / authenticated / service_role n'héritent d'aucun privilège
-- et se heurtent à « permission denied ». On accorde l'accès complet aux trois
-- rôles, y compris pour les tables futures : c'est RLS qui garde la porte —
-- sans politique, aucun accès, quelle que soit la table.
-- =============================================================================

grant usage on schema public to anon, authenticated, service_role;

grant all on all tables in schema public to anon, authenticated, service_role;
grant all on all functions in schema public to anon, authenticated, service_role;
grant all on all sequences in schema public to anon, authenticated, service_role;

alter default privileges in schema public
  grant all on tables to anon, authenticated, service_role;
alter default privileges in schema public
  grant all on functions to anon, authenticated, service_role;
alter default privileges in schema public
  grant all on sequences to anon, authenticated, service_role;
