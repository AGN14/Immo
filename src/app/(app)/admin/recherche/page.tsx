import Link from "next/link";
import { requireAdmin } from "@/lib/admin/guard";
import { getAdminRecherche } from "@/lib/admin/queries";

export const metadata = { title: "Recherche · Administration" };

/**
 * Recherche support : on tape ce que le correspondant donne au téléphone —
 * nom, e-mail, nom de bien, titre de panne — et on tombe sur la fiche.
 */
export default async function RechercheAdminPage({
  searchParams,
}: {
  searchParams: Promise<{ [k: string]: string | string[] | undefined }>;
}) {
  await requireAdmin();
  const brut = (await searchParams).q;
  const q = Array.isArray(brut) ? (brut[0] ?? "") : (brut ?? "");
  const resultats = q.trim().length >= 2 ? await getAdminRecherche(q) : null;

  return (
    <div>
      <p className="text-ink-3 text-xs font-semibold tracking-wider uppercase">Administration</p>
      <h1 className="font-display text-ink mt-1 text-3xl font-semibold">Recherche</h1>

      <form action="/admin/recherche" method="get" className="mt-6 flex gap-2.5">
        <input
          type="search"
          name="q"
          defaultValue={q}
          placeholder="Nom, e-mail, bien, ville, panne… (2 lettres min.)"
          aria-label="Recherche globale"
          className="border-line bg-surface text-ink min-w-0 flex-1 rounded-md border px-3 py-2.5 text-sm"
        />
        <button
          type="submit"
          className="bg-primary text-on-primary hover:bg-primary-hi rounded-md px-4 py-2.5 text-sm font-semibold transition-colors"
        >
          Chercher
        </button>
      </form>

      {resultats && (
        <div className="mt-8 space-y-8">
          <section>
            <h2 className="font-display text-ink text-xl font-semibold">
              Comptes ({resultats.comptes.length})
            </h2>
            {resultats.comptes.length === 0 ? (
              <p className="text-ink-3 mt-2 text-sm">Aucun compte.</p>
            ) : (
              <ul className="border-line bg-surface mt-3 divide-y divide-line-soft rounded-md border">
                {resultats.comptes.map((c) => (
                  <li key={c.id}>
                    <Link
                      href={`/admin/comptes/${c.id}`}
                      className="block px-4 py-2.5 no-underline hover:bg-highlight"
                    >
                      <span className="text-ink block text-sm font-medium">{c.nom}</span>
                      <span className="text-ink-3 block text-xs">{c.email}</span>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </section>

          <section>
            <h2 className="font-display text-ink text-xl font-semibold">
              Biens ({resultats.biens.length})
            </h2>
            {resultats.biens.length === 0 ? (
              <p className="text-ink-3 mt-2 text-sm">Aucun bien.</p>
            ) : (
              <ul className="border-line bg-surface mt-3 divide-y divide-line-soft rounded-md border">
                {resultats.biens.map((b) => (
                  <li key={b.id} className="flex flex-wrap items-center justify-between gap-2 px-4 py-2.5">
                    <span className="text-ink text-sm font-medium">
                      {b.nom} <span className="text-ink-3 font-normal">· {b.ville}</span>
                    </span>
                    <Link
                      href={`/admin/comptes/${b.proprietaireId}`}
                      className="text-primary text-sm font-semibold no-underline"
                    >
                      {b.proprietaireEmail}
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </section>

          <section>
            <h2 className="font-display text-ink text-xl font-semibold">
              Signalements ({resultats.signalements.length})
            </h2>
            {resultats.signalements.length === 0 ? (
              <p className="text-ink-3 mt-2 text-sm">Aucun dossier.</p>
            ) : (
              <ul className="border-line bg-surface mt-3 divide-y divide-line-soft rounded-md border">
                {resultats.signalements.map((s) => (
                  <li key={s.id}>
                    <Link
                      href={`/admin/signalements/${s.id}`}
                      className="block px-4 py-2.5 no-underline hover:bg-highlight"
                    >
                      <span className="text-ink block text-sm font-medium">{s.titre}</span>
                      <span className="text-ink-3 block text-xs">
                        {s.statut} · {s.urgence}
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>
      )}
    </div>
  );
}
