-- Mot de passe du propriétaire : exigé pour confirmer les modifications
-- sensibles (modification d'un bien). Hashé côté serveur, jamais en clair.
alter table public.proprietaire
  add column mot_de_passe_hash text;
