-- =============================================================================
-- Code de bien : le sésame du locataire.
--
-- Le locataire rejoint le parc de son propriétaire avec un code court, transmis
-- de vive voix (« BAOBAB-3B »). Le code est attribué automatiquement à la
-- création du bien : dérivé du nom, suffixé par un condensé de l'identifiant
-- pour rester unique. Pas de saisie supplémentaire pour le propriétaire.
-- =============================================================================

alter table public.bien
  add column code text;

-- Normalise le nom en base de code : minuscules accentuées → sans accent,
-- tout le reste hors A-Z/0-9 disparaît.
create or replace function public.attribuer_code_bien()
returns trigger
language plpgsql
as $$
declare
  v_base text;
begin
  v_base := upper(left(regexp_replace(
    translate(new.nom, 'àâäéèêëîïôöùûüçñ', 'aaaeeeeiioouuucn'),
    '[^A-Z0-9]',
    '',
    'g'
  ), 6));

  if v_base = '' then
    v_base := 'BIEN';
  end if;

  new.code := v_base || '-' || upper(substr(md5(new.id::text), 1, 4));
  return new;
end;
$$;

create trigger bien_attribuer_code
  before insert on public.bien
  for each row
  execute function public.attribuer_code_bien();

-- Unique pour que le code serve de clé de jointure ; on accepte les nulls
-- (les biens créés avant cette migration n'ont pas encore de code).
create unique index bien_code_idx on public.bien (code);