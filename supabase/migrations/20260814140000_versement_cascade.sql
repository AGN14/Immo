-- Un versement appartient à un bail : supprimer le bail (via la suppression
-- d'un bien) supprime aussi ses versements. Avant, la contrainte restrict
-- faisait échouer la suppression du bien tant qu'un versement existait.
alter table public.versement
  drop constraint versement_bail_id_fkey,
  add constraint versement_bail_id_fkey
    foreign key (bail_id) references public.bail (id) on delete cascade;