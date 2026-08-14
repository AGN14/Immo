-- =============================================================================
-- Politiques RLS de l'espace locataire.
--
-- Les politiques écrites jusqu'ici ne connaissaient qu'un acteur : le
-- propriétaire. Tant que le serveur interrogeait la base avec la clé de
-- service, ça n'avait pas de conséquence. Dès que les lectures porteront le
-- jeton de l'utilisateur, un locataire ne verrait plus rien : ni son bail, ni
-- son logement, ni ses paiements.
--
-- Règle de lecture, valable pour toutes les politiques ci-dessous : un
-- locataire ne voit que ce qui pend à SES baux. Jamais le parc, jamais un
-- autre locataire, jamais un autre lot du même immeuble.
-- =============================================================================

-- ------------------------------------------------------------- sa fiche
-- Il faut pouvoir se lire soi-même : c'est ce qui permet à l'application de
-- résoudre le locataire connecté à partir de son jeton.
create policy "locataire: sa propre fiche"
  on public.locataire for select
  to authenticated
  using (auth_user_id = auth.uid());

-- ------------------------------------------------------------- ses baux
create policy "bail: les siens"
  on public.bail for select
  to authenticated
  using (locataire_id = public.locataire_courant());

-- --------------------------------------------------------- son logement
-- Le lot de ses baux, et lui seul. Un immeuble de dix appartements n'en
-- expose qu'un : celui qu'il occupe.
create policy "lot: celui de ses baux"
  on public.lot for select
  to authenticated
  using (
    exists (
      select 1 from public.bail b
      where b.lot_id = lot.id
        and b.locataire_id = public.locataire_courant()
    )
  );

-- ------------------------------------------------------------- son bien
-- L'adresse et le nom de la résidence, nécessaires pour situer le logement.
-- Les autres lots du bien restent invisibles : la politique ci-dessus s'en
-- charge, celle-ci ne donne accès qu'à l'enveloppe.
create policy "bien: celui de son logement"
  on public.bien for select
  to authenticated
  using (
    exists (
      select 1
      from public.bail b
      join public.lot l on l.id = b.lot_id
      where l.bien_id = bien.id
        and b.locataire_id = public.locataire_courant()
    )
  );

-- -------------------------------------------------------- ses paiements
-- En lecture : son historique et ses quittances.
create policy "paiement: ceux de ses baux"
  on public.paiement for select
  to authenticated
  using (
    exists (
      select 1 from public.bail b
      where b.id = paiement.bail_id
        and b.locataire_id = public.locataire_courant()
    )
  );

-- En écriture : la déclaration de paiement crée une ligne par mois couvert.
-- Bornée au même périmètre — on ne déclare pas un paiement sur le bail d'un
-- autre.
create policy "paiement: declare les siens"
  on public.paiement for insert
  to authenticated
  with check (
    exists (
      select 1 from public.bail b
      where b.id = paiement.bail_id
        and b.locataire_id = public.locataire_courant()
    )
  );

-- ============================================================================
-- Les réglages du propriétaire, vus par son locataire
--
-- Le calcul d'échéance a besoin de quatre champs : le nom (pour l'afficher),
-- le jour d'échéance, le montant de l'amende et le délai de tolérance.
--
-- RLS filtre des LIGNES, pas des colonnes : une politique de lecture sur
-- `proprietaire` exposerait aussi son e-mail, son compteur de quittances et
-- son empreinte de mot de passe. D'où cette vue, qui ne publie que le
-- strict nécessaire.
--
-- `security_invoker = off` : la vue s'exécute avec les droits de son
-- propriétaire et contourne donc la RLS de la table sous-jacente. C'est sa
-- clause WHERE qui fait le cloisonnement — d'où l'importance de la lire deux
-- fois plutôt qu'une.
-- ============================================================================
create view public.proprietaire_reglages
with (security_invoker = off) as
select
  p.id,
  p.nom,
  p.jour_echeance_defaut,
  p.jour_reversement,
  p.penalite_retard_fcfa,
  p.delai_tolerance_jours
from public.proprietaire p
where
  -- le propriétaire lui-même
  p.auth_user_id = auth.uid()
  -- ou le propriétaire du locataire connecté
  or p.id = (
    select l.proprietaire_id
    from public.locataire l
    where l.id = public.locataire_courant()
  );

grant select on public.proprietaire_reglages to authenticated;

comment on view public.proprietaire_reglages is
  'Réglages d''échéance et de pénalité, lisibles par le propriétaire et par ses locataires. Ne publie ni e-mail, ni compteur de quittances, ni empreinte de mot de passe.';
