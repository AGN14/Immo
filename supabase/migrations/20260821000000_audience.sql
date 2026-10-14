-- =============================================================================
-- Mesure d'audience consentie.
--
-- Ce que le visiteur a accepté via le bandeau cookies (finalité
-- « analytique ») : pages vues, clics marqués, temps passé. Rien d'autre —
-- ni IP (non stockée), ni user-agent, ni fingerprint. L'identifiant de visite
-- est un UUID tiré côté navigateur, conservé un an : il rend un visiteur
-- reconnaissable d'une page à l'autre, jamais une personne identifiable.
--
-- Écriture ouverte (anon) mais BORNÉE : chemins et libellés plafonnés,
-- événements fermés, durées plausibles — un formulaire public ne doit pas
-- devenir un dépotoir. Lecture fermée : l'admin lit via la clé de service.
-- =============================================================================

create table public.evenement_audience (
  id uuid primary key default gen_random_uuid(),
  visite_id uuid not null,
  chemin text not null check (char_length(chemin) between 1 and 200),
  evenement text not null check (evenement in ('page_vue', 'clic', 'temps')),
  detail text check (detail is null or char_length(detail) <= 120),
  duree_ms integer check (duree_ms is null or (duree_ms >= 0 and duree_ms <= 86400000)),
  cree_le timestamptz not null default now()
);

create index evenement_audience_jour_idx on public.evenement_audience (cree_le desc);
create index evenement_audience_visite_idx on public.evenement_audience (visite_id, cree_le);

alter table public.evenement_audience enable row level security;

-- Le navigateur écrit ses propres événements, rien d'autre : aucune lecture.
create policy "audience: ecriture anonyme"
  on public.evenement_audience for insert
  to anon, authenticated
  with check (true);

comment on table public.evenement_audience is
  'Pages vues, clics et temps passé des visiteurs ayant accepté la mesure d''audience.';
