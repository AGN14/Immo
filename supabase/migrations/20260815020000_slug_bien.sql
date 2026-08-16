-- =============================================================================
-- Slug de bien : une URL qui se lit.
--
-- Les pages de biens s'ouvraient sur un UUID (/biens/6f2a…). Illisible, et
-- impossible à dicter ou à reconnaître dans un historique.
--
-- Le code du bien (« RLB-1C27 ») aurait fait un slug tout trouvé — il est déjà
-- unique et court. C'eût été une faute : ce code est un SECRET. Il suffit à
-- rattacher une inscription au parc d'un propriétaire (voir `signup` dans
-- src/lib/auth/actions.ts), sans validation de sa part. Une URL se retrouve
-- dans l'historique du navigateur, les captures d'écran, les journaux serveur
-- et les en-têtes Referer : y semer le code aurait laissé n'importe qui
-- s'inscrire dans le parc d'autrui. D'où une colonne dédiée, dérivée du nom.
--
-- L'unicité est PAR PROPRIÉTAIRE, et non globale. Les politiques RLS ne
-- laissent lire à un propriétaire que ses propres biens : /biens/villa-rose
-- résout donc chez chacun sa propre villa, sans ambiguïté possible. Exiger
-- l'unicité globale obligerait à suffixer des slugs qui n'entrent jamais en
-- collision du point de vue de qui les lit.
-- =============================================================================

alter table public.bien
  add column slug text;

-- « Résidence Les Baobabs » → « residence-les-baobabs ».
create or replace function public.slugifier(v_texte text)
returns text
language sql
immutable
as $$
  select trim(
    both '-' from regexp_replace(
      lower(translate(v_texte, 'àâäéèêëîïôöùûüçñÀÂÄÉÈÊËÎÏÔÖÙÛÜÇÑ', 'aaaeeeeiioouuucnAAAEEEEIIOOUUUCN')),
      '[^a-z0-9]+',
      '-',
      'g'
    )
  );
$$;

-- Le slug doit rester unique dans le parc du propriétaire. Deux « Villa Rose »
-- chez le même bailleur sont plausibles : on suffixe alors -2, -3, etc.
create or replace function public.attribuer_slug_bien()
returns trigger
language plpgsql
as $$
declare
  v_base text;
  v_slug text;
  v_n int := 1;
begin
  -- Au renommage, on ne régénère que si le nom a bougé : un slug stable est ce
  -- qui permet à un lien partagé de continuer à fonctionner.
  if tg_op = 'UPDATE' and new.nom is not distinct from old.nom and new.slug is not null then
    return new;
  end if;

  v_base := public.slugifier(new.nom);
  if v_base = '' then
    v_base := 'bien';
  end if;

  v_slug := v_base;
  while exists (
    select 1 from public.bien
    where proprietaire_id = new.proprietaire_id
      and slug = v_slug
      and id <> new.id
  ) loop
    v_n := v_n + 1;
    v_slug := v_base || '-' || v_n;
  end loop;

  new.slug := v_slug;
  return new;
end;
$$;

create trigger bien_attribuer_slug
  before insert or update of nom on public.bien
  for each row
  execute function public.attribuer_slug_bien();

-- Reprise de l'existant. La boucle plutôt qu'un UPDATE massif : le suffixe de
-- collision doit voir les slugs déjà posés par les tours précédents.
do $$
declare
  v_bien record;
  v_base text;
  v_slug text;
  v_n int;
begin
  for v_bien in select id, nom, proprietaire_id from public.bien where slug is null order by cree_le loop
    v_base := public.slugifier(v_bien.nom);
    if v_base = '' then
      v_base := 'bien';
    end if;

    v_slug := v_base;
    v_n := 1;
    while exists (
      select 1 from public.bien
      where proprietaire_id = v_bien.proprietaire_id and slug = v_slug
    ) loop
      v_n := v_n + 1;
      v_slug := v_base || '-' || v_n;
    end loop;

    update public.bien set slug = v_slug where id = v_bien.id;
  end loop;
end;
$$;

alter table public.bien
  alter column slug set not null;

create unique index bien_slug_idx on public.bien (proprietaire_id, slug);
