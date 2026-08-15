-- =============================================================================
-- Consentement et newsletter — ce que l'app déclare, elle le fait vraiment.
--
-- Le modèle de consentement (03) décrit un recueil de consentement à
-- l'inscription et une newsletter. Jusqu'ici l'app collectait déjà nom, e-mail
-- et téléphone, mais rien ne prouvait le consentement, et le formulaire de
-- newsletter du pied de page affichait un faux succès sans rien enregistrer —
-- le téléphone du propriétaire était même perdu faute de colonne.
--
-- On rend donc les documents vrais :
--   1. `proprietaire.telephone` — le numéro collecté est enfin stocké.
--   2. `consentement` — registre horodaté des consentements (article 389 du
--      Code du numérique), une ligne par compte et par finalité, avec le texte
--      exact accepté et la version de la politique.
--   3. `newsletter_abonne` — abonnés réels. L'écriture passe par le serveur
--      applicatif (clé de service) : aucune politique RLS d'écriture client.
-- =============================================================================

-- -------------------------------------------------- téléphone du propriétaire
-- Le formulaire d'inscription le demande déjà ; autant le conserver.
alter table public.proprietaire
  add column telephone text;

comment on column public.proprietaire.telephone is
  'Numéro collecté à l''inscription. Null si jamais renseigné.';

-- ------------------------------------------------------------ consentement
-- Une ligne par compte et par finalité : re-consentir met à jour la version et
-- le texte, l'horodatage d'origine est conservé.
create table public.consentement (
  id uuid primary key default gen_random_uuid(),
  auth_user_id uuid not null references auth.users (id) on delete cascade,
  finalite text not null check (finalite in ('compte', 'newsletter')),
  version text not null,
  texte text not null,
  accepte boolean not null default true,
  cree_le timestamptz not null default now(),
  constraint consentement_unique_par_finalite unique (auth_user_id, finalite)
);

comment on table public.consentement is
  'Preuve du recueil du consentement (article 389 du Code du numérique).';

alter table public.consentement enable row level security;

-- Chacun voit et retire son propre consentement ; l'écriture initiale se fait
-- par le serveur applicatif pendant l'inscription, avant l'ouverture de session.
create policy "consentement: le sien (lecture)"
  on public.consentement for select
  to authenticated
  using (auth_user_id = auth.uid());

create policy "consentement: le sien (retrait)"
  on public.consentement for update
  to authenticated
  using (auth_user_id = auth.uid())
  with check (auth_user_id = auth.uid());

-- ------------------------------------------------------------- newsletter
-- Abonnés réels : e-mail unique, désinscriptible en passant `actif` à false
-- (lien prévu dans chaque futur e-mail). Aucune écriture directe depuis le
-- client.
create table public.newsletter_abonne (
  id uuid primary key default gen_random_uuid(),
  email text not null unique,
  actif boolean not null default true,
  cree_le timestamptz not null default now()
);

comment on table public.newsletter_abonne is
  'Abonnés à la newsletter, avec leur consentement.';

alter table public.newsletter_abonne enable row level security;
-- Aucune politique d'écriture client : seul le serveur applicatif (clé de
-- service) insère ici, après vérification de la case de consentement.