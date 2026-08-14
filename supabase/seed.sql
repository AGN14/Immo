-- =============================================================================
-- Jeu de démonstration.
--
-- Il existe pour rendre les règles d'échéance *visibles* : un parc où tout le
-- monde est à jour ne montre ni amende ni préavis. Les trois locataires ci-
-- dessous couvrent les trois états que le calcul sait produire.
--
-- Les dates sont ancrées sur août 2026 (échéance au 5, tolérance de 5 jours,
-- donc limite au 10). Rejoué plus tard, le jeu vieillit : les mois impayés
-- restent impayés et le préavis ne fait que s'aggraver, ce qui reste cohérent.
--
-- Idempotent : relancer le seed sur une base déjà peuplée ne fait rien.
-- =============================================================================

do $$
declare
  v_prop      uuid := '11111111-1111-1111-1111-111111111111';
  v_bien      uuid := '22222222-2222-2222-2222-222222222222';
  v_lot_3b    uuid := '33333333-3333-3333-3333-333333333301';
  v_lot_1a    uuid := '33333333-3333-3333-3333-333333333302';
  v_lot_2c    uuid := '33333333-3333-3333-3333-333333333303';
  v_ibrahima  uuid := '44444444-4444-4444-4444-444444444401';
  v_fatou     uuid := '44444444-4444-4444-4444-444444444402';
  v_awa       uuid := '44444444-4444-4444-4444-444444444403';
  v_bail_3b   uuid := '55555555-5555-5555-5555-555555555501';
  v_bail_1a   uuid := '55555555-5555-5555-5555-555555555502';
  v_bail_2c   uuid := '55555555-5555-5555-5555-555555555503';

  v_mois      date;
  v_versement uuid;
  v_paiement  uuid;
  v_numero    integer := 0;
begin
  if exists (select 1 from public.proprietaire where email = 'thierry@immo.app') then
    raise notice 'Jeu de démonstration déjà présent — seed ignoré.';
    return;
  end if;

  -- --------------------------------------------------------------- le parc
  -- Palier Pro : le quota d'Essentiel (3 baux) serait atteint pile, et toute
  -- création manuelle depuis l'interface se heurterait au mur.
  insert into public.proprietaire
    (id, nom, email, plan_id, jour_echeance_defaut, jour_reversement,
     penalite_retard_fcfa, delai_tolerance_jours)
  values
    (v_prop, 'Thierry Yerima', 'thierry@immo.app', 'pro', 5, 1, 5000, 5);

  insert into public.bien (id, proprietaire_id, nom, type, adresse, quartier, ville)
  values (v_bien, v_prop, 'Résidence Les Baobabs', 'residence',
          'Rue 12 x Avenue Bourguiba', 'Sacré-Cœur', 'Dakar');

  insert into public.lot (id, bien_id, nom, composition, loyer_reference_fcfa) values
    (v_lot_3b, v_bien, 'Appt 3B', 'appartement',      75000),
    (v_lot_1a, v_bien, 'Appt 1A', '2-chambres-salon', 60000),
    (v_lot_2c, v_bien, 'Appt 2C', 'chambre-salon',    50000);

  insert into public.locataire (id, proprietaire_id, nom, telephone, email) values
    (v_ibrahima, v_prop, 'Ibrahima Diallo', '+221 77 512 44 09', 'ibrahima.diallo@example.com'),
    (v_fatou,    v_prop, 'Fatou Ndiaye',    '+221 77 145 22 08', 'fatou.ndiaye@example.com'),
    (v_awa,      v_prop, 'Awa Traoré',      '+221 78 331 07 66', 'awa.traore@example.com');

  -- Ibrahima : échéance héritée du propriétaire (le 5).
  insert into public.bail (id, lot_id, locataire_id, loyer_mensuel_fcfa, date_debut, statut)
  values (v_bail_3b, v_lot_3b, v_ibrahima, 75000, '2026-01-01', 'actif');

  -- Fatou : échéance négociée au 12. C'est ce décalage qui la laisse « en
  -- retard » sans préavis le 14 août, là où Ibrahima a déjà franchi sa limite.
  insert into public.bail
    (id, lot_id, locataire_id, loyer_mensuel_fcfa, date_debut, statut, jour_echeance)
  values (v_bail_1a, v_lot_1a, v_fatou, 60000, '2026-03-01', 'actif', 12);

  insert into public.bail (id, lot_id, locataire_id, loyer_mensuel_fcfa, date_debut, statut)
  values (v_bail_2c, v_lot_2c, v_awa, 50000, '2026-04-01', 'actif');

  -- ------------------------------------------------------- historique payé
  -- Un versement confirmé par mois, réglé avant l'échéance — donc sans amende.
  -- C'est l'historique « propre » sur lequel le retard récent se détache.
  --
  -- On boucle sur les mois plutôt que sur les baux : la quittance doit être
  -- numérotée dans l'ordre chronologique du propriétaire, et une numérotation
  -- bail par bail entrelacerait les dates.
  for v_mois in
    select generate_series(date '2026-01-01', date '2026-08-01', interval '1 month')
  loop
    -- Ibrahima : payé de janvier à mai, puis plus rien.
    if v_mois between date '2026-01-01' and date '2026-05-01' then
      v_versement := gen_random_uuid();
      v_paiement  := gen_random_uuid();
      v_numero    := v_numero + 1;

      insert into public.versement
        (id, bail_id, montant_total_fcfa, penalites_fcfa, methode, reference_externe,
         statut, confirme_par, declare_le, confirme_le)
      values (v_versement, v_bail_3b, 75000, 0, 'mobile-money',
              'MP' || to_char(v_mois, 'YYMM') || '03.HIST', 'confirme', 'proprietaire',
              v_mois + 2, v_mois + 2);

      insert into public.paiement (id, bail_id, versement_id, periode, montant_fcfa, penalite_fcfa)
      values (v_paiement, v_bail_3b, v_versement, to_char(v_mois, 'YYYY-MM'), 75000, 0);

      insert into public.quittance (paiement_id, proprietaire_id, numero, emise_le)
      values (v_paiement, v_prop, '2026-' || lpad(v_numero::text, 4, '0'), v_mois + 2);
    end if;

    -- Fatou : payé de mars à juillet. Août reste dû.
    if v_mois between date '2026-03-01' and date '2026-07-01' then
      v_versement := gen_random_uuid();
      v_paiement  := gen_random_uuid();
      v_numero    := v_numero + 1;

      insert into public.versement
        (id, bail_id, montant_total_fcfa, penalites_fcfa, methode, reference_externe,
         statut, confirme_par, declare_le, confirme_le)
      values (v_versement, v_bail_1a, 60000, 0, 'mobile-money',
              'MP' || to_char(v_mois, 'YYMM') || '09.HIST', 'confirme', 'proprietaire',
              v_mois + 8, v_mois + 8);

      insert into public.paiement (id, bail_id, versement_id, periode, montant_fcfa, penalite_fcfa)
      values (v_paiement, v_bail_1a, v_versement, to_char(v_mois, 'YYYY-MM'), 60000, 0);

      insert into public.quittance (paiement_id, proprietaire_id, numero, emise_le)
      values (v_paiement, v_prop, '2026-' || lpad(v_numero::text, 4, '0'), v_mois + 8);
    end if;

    -- Awa : payé d'avril à juillet, à jour.
    if v_mois between date '2026-04-01' and date '2026-07-01' then
      v_versement := gen_random_uuid();
      v_paiement  := gen_random_uuid();
      v_numero    := v_numero + 1;

      insert into public.versement
        (id, bail_id, montant_total_fcfa, penalites_fcfa, methode, reference_externe,
         statut, confirme_par, declare_le, confirme_le)
      values (v_versement, v_bail_2c, 50000, 0, 'virement',
              'VIR-' || to_char(v_mois, 'YYYY-MM'), 'confirme', 'proprietaire',
              v_mois + 2, v_mois + 2);

      insert into public.paiement (id, bail_id, versement_id, periode, montant_fcfa, penalite_fcfa)
      values (v_paiement, v_bail_2c, v_versement, to_char(v_mois, 'YYYY-MM'), 50000, 0);

      insert into public.quittance (paiement_id, proprietaire_id, numero, emise_le)
      values (v_paiement, v_prop, '2026-' || lpad(v_numero::text, 4, '0'), v_mois + 2);
    end if;
  end loop;

  -- Le compteur doit refléter les quittances émises, sinon la prochaine
  -- émission réutiliserait un numéro déjà pris.
  update public.proprietaire set compteur_quittance = v_numero where id = v_prop;

  -- ------------------------------------------------- déclaration en attente
  -- Awa a déclaré août le 3, avant son échéance : aucune amende. Le versement
  -- reste « initié » — c'est le cas qui alimente le bouton de confirmation.
  v_versement := gen_random_uuid();
  insert into public.versement
    (id, bail_id, montant_total_fcfa, penalites_fcfa, methode, reference_externe,
     statut, declare_le)
  values (v_versement, v_bail_2c, 50000, 0, 'mobile-money',
          'MP260803.1147.K21908', 'initie', '2026-08-03');

  insert into public.paiement (bail_id, versement_id, periode, montant_fcfa, penalite_fcfa)
  values (v_bail_2c, v_versement, '2026-08', 50000, 0);

  -- ------------------------------------------------------------ signalement
  insert into public.signalement (lot_id, bail_id, titre, description, urgence, statut)
  values (v_lot_3b, v_bail_3b, 'Fuite sous l''évier de la cuisine',
          'L''eau coule dès qu''on ouvre le robinet. Le placard commence à gonfler.',
          'haute', 'pris-en-charge');

  raise notice 'Jeu de démonstration chargé : % quittances émises.', v_numero;
end $$;
