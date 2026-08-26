-- =============================================================================
-- Invitation d'un locataire par son propriétaire.
--
-- Jusqu'ici, un locataire rejoignait un parc en saisissant le code du bien
-- (« RLB-1C27 »). Ce code faisait deux métiers incompatibles :
--
--   — barrière trop faible : il est affiché sur la fiche du bien, donc dans
--     toutes les captures d'écran. Quiconque le voyait s'inscrivait dans le
--     parc, sans que le propriétaire soit consulté — `locataire` n'a aucune
--     colonne de validation.
--   — condition trop rigide : sans code, aucune issue. Impasse totale.
--
-- L'invitation sépare les deux. Elle est nominative, à usage unique, expire, et
-- c'est le propriétaire qui la crée : il décide qui entre, et quand.
--
-- Le jeton n'est pas généré ici mais côté application, où `randomBytes` donne
-- une valeur sûre et directement utilisable dans une URL. La base se contente
-- d'en garantir l'unicité.
--
-- Le code de bien reste en place : il sert le cas courant, où le bailleur donne
-- le code de vive voix. L'invitation est le chemin sûr, le code le chemin
-- rapide. Retirer le code se décidera plus tard, à l'usage.
-- =============================================================================

create table if not exists public.invitation (
  id uuid primary key default gen_random_uuid(),
  proprietaire_id uuid not null references public.proprietaire (id) on delete cascade,

  -- Facultatif : inviter directement sur un logement précis. Sans lui,
  -- l'invitation rattache au parc et le bail se crée ensuite.
  lot_id uuid references public.lot (id) on delete set null,

  -- Le secret transporté par l'URL. Unique globalement : c'est lui qu'on
  -- retrouve, sans connaître le propriétaire au moment de la lecture.
  jeton text not null unique,

  -- Pré-remplissage du formulaire. Le propriétaire connaît déjà son locataire ;
  -- lui faire retaper son propre nom n'apporte rien.
  nom text,
  telephone text,
  email text,

  creee_le timestamptz not null default now(),

  -- Une invitation qui traîne est une porte ouverte. Sept jours par défaut :
  -- assez pour transmettre par WhatsApp et laisser répondre, trop peu pour
  -- qu'un lien oublié dans une conversation reste exploitable des mois.
  expire_le timestamptz not null default (now() + interval '7 days'),

  -- Usage unique : renseigné à l'inscription, l'invitation ne vaut plus rien.
  utilisee_le timestamptz,
  locataire_id uuid references public.locataire (id) on delete set null
);

create index if not exists invitation_proprietaire_idx
  on public.invitation (proprietaire_id);

alter table public.invitation enable row level security;

-- Le propriétaire gère les siennes, et rien d'autre. Personne n'a d'accès en
-- lecture par le jeton : la validation à l'inscription passe par le client
-- d'administration, le futur locataire n'ayant pas encore de session.
create policy "invitation: les siennes"
  on public.invitation for select
  to authenticated
  using (proprietaire_id = public.proprietaire_courant());

create policy "invitation: creer les siennes"
  on public.invitation for insert
  to authenticated
  with check (proprietaire_id = public.proprietaire_courant());

create policy "invitation: revoquer les siennes"
  on public.invitation for delete
  to authenticated
  using (proprietaire_id = public.proprietaire_courant());
