import Link from "next/link";
import { redirect } from "next/navigation";
import { signalerProbleme } from "@/lib/actions/locataire";
import { getLogementDuLocataire } from "@/lib/mock-data";
import { compositionLabel } from "@/lib/status-labels";
import { requireLocataire } from "@/lib/auth/mock-session";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";

const ERREURS: Record<string, string> = {
  TITRE_TROP_COURT: "Donnez un titre d'au moins 3 caractères.",
  DESCRIPTION_TROP_COURTE: "Décrivez le problème en quelques mots de plus.",
};

export default async function SignalerPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const { locataireId } = await requireLocataire();
  const logement = getLogementDuLocataire(locataireId);
  if (!logement?.lot || !logement.bien) redirect("/dashboard");

  const erreur = ERREURS[String((await searchParams).erreur ?? "")];

  return (
    <div className="mx-auto max-w-[640px]">
      <Link href="/dashboard" className="text-ink-3 hover:text-ink text-sm no-underline">
        ← Retour à mon espace
      </Link>

      <h1 className="font-display text-ink mt-3 text-3xl font-semibold">Signaler un problème</h1>
      <p className="text-ink-2 mt-2">
        {logement.lot.nom} — {compositionLabel[logement.lot.composition]}, {logement.bien.nom}.
      </p>

      {erreur && (
        <p className="border-danger bg-danger-soft text-ink mt-6 rounded-md border p-4 text-sm">
          {erreur}
        </p>
      )}

      <form action={signalerProbleme} className="mt-8 flex flex-col gap-5">
        <Input
          label="Quel est le problème ?"
          name="titre"
          type="text"
          placeholder="Ex. Fuite sous l'évier de la cuisine"
          required
          minLength={3}
        />

        <label className="flex flex-col gap-1.5">
          <span className="text-ink-2 text-sm font-medium">Décrivez-le</span>
          <textarea
            name="description"
            rows={5}
            required
            minLength={10}
            placeholder="Depuis quand ? Qu'avez-vous constaté ? Ce qui aide le plus, c'est ce que vous voyez."
            className="border-line bg-surface text-ink placeholder:text-ink-3 focus-visible:outline-primary rounded-md border px-3 py-2.5 text-base focus-visible:outline-2 focus-visible:outline-offset-1"
          />
        </label>

        <fieldset className="flex flex-col gap-2">
          <legend className="text-ink-2 mb-1 text-sm font-medium">Urgence</legend>
          {[
            { valeur: "basse", label: "Basse", aide: "Gênant, mais ça peut attendre." },
            { valeur: "normale", label: "Normale", aide: "À traiter dans les prochains jours." },
            {
              valeur: "haute",
              label: "Urgent",
              aide: "Fuite, panne électrique, porte qui ne ferme plus.",
            },
          ].map((o) => (
            <label
              key={o.valeur}
              className="border-line bg-surface hover:border-primary flex cursor-pointer items-start gap-3 rounded-md border p-3 transition-colors"
            >
              <input
                type="radio"
                name="urgence"
                value={o.valeur}
                defaultChecked={o.valeur === "normale"}
                className="accent-primary mt-1"
              />
              <span>
                <span className="text-ink block text-sm font-semibold">{o.label}</span>
                <span className="text-ink-3 block text-sm">{o.aide}</span>
              </span>
            </label>
          ))}
        </fieldset>

        <Button type="submit" variant="primary" block>
          Envoyer le signalement
        </Button>
      </form>

      <p className="text-ink-3 mt-6 text-sm">
        L&rsquo;ajout de photos arrivera avec le stockage de fichiers. Votre propriétaire est
        prévenu dès l&rsquo;envoi, et vous suivez l&rsquo;avancement depuis votre espace.
      </p>
    </div>
  );
}
