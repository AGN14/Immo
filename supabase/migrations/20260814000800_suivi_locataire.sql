-- Suivi du dossier locataire : occupation du logement et personne de confiance.

alter table public.locataire
  add column occupants integer check (occupants is null or occupants between 1 and 50),
  add column garant_nom text,
  add column garant_telephone text;
