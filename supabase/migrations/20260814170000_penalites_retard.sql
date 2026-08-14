-- Pénalités de retard et seuil de préavis.
--
-- Règle métier : passé le jour d'échéance, un mois de loyer ne se règle plus au
-- prix du loyer seul — une amende forfaitaire s'y ajoute. Passé un délai de
-- tolérance supplémentaire, le propriétaire est fondé à donner congé.
--
-- Deux réglages appartiennent au propriétaire, pas au code : le montant de
-- l'amende et la durée de la tolérance. Les valeurs par défaut reprennent la
-- pratique courante — 5 000 F, et 5 jours après une échéance au 5, soit le 10.

alter table public.proprietaire
  add column penalite_retard_fcfa integer not null default 5000
    check (penalite_retard_fcfa >= 0),
  -- En jours après l'échéance, et non en date fixe : un bail dont l'échéance a
  -- été négociée au 20 doit garder le même délai de grâce qu'un bail au 5.
  add column delai_tolerance_jours smallint not null default 5
    check (delai_tolerance_jours between 0 and 28);

comment on column public.proprietaire.penalite_retard_fcfa is
  'Amende forfaitaire due pour chaque mois réglé après son échéance.';
comment on column public.proprietaire.delai_tolerance_jours is
  'Jours de tolérance après l''échéance. Au-delà, le mois impayé ouvre un préavis.';

-- L'amende est portée par le MOIS et non par le versement : elle est due par
-- mois en retard, et régulariser trois mois en coûte trois. La colonne est
-- distincte de montant_fcfa, qui reste le loyer seul — tous les cumuls de
-- revenus somment montant_fcfa, et y verser une pénalité gonflerait le chiffre
-- d'affaires locatif d'un produit qui n'en est pas.
alter table public.paiement
  add column penalite_fcfa integer not null default 0
    check (penalite_fcfa >= 0);

comment on column public.paiement.penalite_fcfa is
  'Amende encourue pour ce mois, figée à la déclaration. Hors loyer : exclue des revenus locatifs.';

-- Report de la somme des amendes des mois couverts, pour que le propriétaire
-- puisse pointer son relevé sans recomposer le détail ligne à ligne.
alter table public.versement
  add column penalites_fcfa integer not null default 0
    check (penalites_fcfa >= 0);

comment on column public.versement.penalites_fcfa is
  'Part de montant_total_fcfa imputable aux amendes de retard.';
