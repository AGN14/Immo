import { getSession } from "@/lib/auth/mock-session";

export default async function DashboardPage() {
  const session = await getSession();
  const nom = session?.nom ?? "Vous";

  return (
    <div>
      <span className="text-primary-deep font-mono text-[0.76rem] font-semibold tracking-[0.14em] uppercase">
        {session?.role === "locataire" ? "Espace locataire" : "Espace propriétaire"}
      </span>
      <h1 className="font-display text-ink mt-2 text-[1.9rem] font-bold">Bienvenue, {nom}.</h1>

      {session?.role === "locataire" ? (
        <p className="text-ink-2 mt-3 max-w-[46em] text-[0.95rem]">
          Votre compte locataire est prêt.{" "}
          {session.codeBien && (
            <>
              Vous avez rejoint le bien <strong className="text-ink">{session.codeBien}</strong>
              .{" "}
            </>
          )}
          Le paiement du loyer, le signalement de pannes et le suivi des litiges arrivent dans les
          prochaines étapes du produit.
        </p>
      ) : (
        <p className="text-ink-2 mt-3 max-w-[46em] text-[0.95rem]">
          Votre compte propriétaire est prêt. L&rsquo;ajout de biens, le suivi des loyers, la
          facturation automatique et la gestion des pannes et litiges arrivent dans les prochaines
          étapes du produit.
        </p>
      )}

      <div className="border-line bg-surface mt-8 rounded-md border border-dashed p-6 text-center">
        <p className="text-ink-3 text-[0.86rem]">
          Le tableau de bord complet (biens, locataires, loyers, pannes, litiges) arrive dans les
          prochaines phases.
        </p>
      </div>
    </div>
  );
}
