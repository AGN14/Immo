-- Suppression de compte en douceur : le parc reste intact (baux, paiements,
-- quittances) mais le compte n'est plus reconnu à la connexion.

alter table public.proprietaire
  add column supprime_le timestamptz;

comment on column public.proprietaire.supprime_le is
  'Horodatage de la suppression volontaire du compte (soft delete).';
