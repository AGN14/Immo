-- Nombre d'étages : pertinent pour les immeubles et les résidences, absent
-- pour les autres types de bien.
alter table public.bien
  add column etages integer
  check (etages is null or (etages between 1 and 100));