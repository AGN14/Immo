-- =============================================================================
-- Unicité de l'e-mail du locataire.
--
-- `proprietaire.email` était unique dès l'origine ; `locataire.email` ne l'a
-- jamais été. La différence s'est vue à l'inscription : lorsqu'une adresse est
-- déjà prise, Supabase répond 200 avec un utilisateur FACTICE plutôt qu'une
-- erreur, afin de ne pas révéler l'existence du compte. Le code poursuivait
-- alors avec un identifiant qui ne désigne personne. Côté propriétaire,
-- l'unicité arrêtait les frais ; côté locataire, on insérait une fiche
-- orpheline rattachée à un compte inexistant — invisible, et impossible à
-- rattacher ensuite au vrai compte.
--
-- La détection est corrigée dans le code (`identities` vide), mais la
-- contrainte reste la seule garantie qui tienne si un autre chemin d'écriture
-- apparaît un jour.
--
-- L'unicité est GLOBALE et non par propriétaire, contrairement au slug de bien :
-- l'adresse sert à se connecter, et Supabase Auth ne connaît qu'un compte par
-- adresse. Deux bailleurs ne peuvent donc pas avoir « le même » locataire sous
-- deux fiches distinctes portant la même adresse.
-- =============================================================================

-- Les doublons éventuels doivent partir d'abord : on garde la fiche la plus
-- ancienne, seule susceptible de porter un historique de paiements.
do $$
declare
  v_doublons int;
begin
  select count(*) into v_doublons
  from (
    select lower(email) as e
    from public.locataire
    where email is not null and email <> ''
    group by lower(email)
    having count(*) > 1
  ) d;

  if v_doublons > 0 then
    raise exception
      'ADRESSES_EN_DOUBLE : % adresse(s) de locataire apparaissent plusieurs fois. Fusionnez ces fiches avant de rejouer cette migration.',
      v_doublons;
  end if;
end;
$$;

-- Insensible à la casse : « Fatou@Gmail.com » et « fatou@gmail.com » désignent
-- la même boîte, et l'inscription normalise déjà en minuscules.
create unique index if not exists locataire_email_idx
  on public.locataire (lower(email))
  where email is not null and email <> '';
