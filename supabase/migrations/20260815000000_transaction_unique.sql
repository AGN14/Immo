-- =============================================================================
-- Une transaction d'opérateur ne peut solder qu'un seul versement.
--
-- Le paiement en ligne rend la main au navigateur avec un identifiant de
-- transaction. Rien n'empêche de rappeler l'action avec le même identifiant :
-- rechargement de page, double-clic, ou appel délibéré. Sans garde-fou, chaque
-- rappel créerait un versement et émettrait une nouvelle quittance pour un
-- argent encaissé une seule fois.
--
-- Le contrôle vit ici, dans une contrainte, et non dans le code applicatif :
-- deux requêtes simultanées passeraient toutes les deux un « ce versement
-- existe-t-il déjà ? » avant que l'une n'ait écrit. La base, elle, tranche.
--
-- Index partiel : `reference_externe` reste libre pour les déclarations
-- manuelles, où le locataire recopie une référence Mobile Money qui peut
-- légitimement se répéter ou rester vide. Seuls les versements confirmés par
-- l'opérateur sont contraints.
-- =============================================================================

create unique index versement_transaction_operateur_unique
  on public.versement (reference_externe)
  where confirme_par = 'operateur' and reference_externe is not null;

comment on index public.versement_transaction_operateur_unique is
  'Interdit qu''une même transaction opérateur solde deux versements (rejeu du callback).';
