import Link from "next/link";
import { ArrowLeftIcon } from "@/components/ui/ArrowLeftIcon";
import { FormulaireInscription } from "@/app/(auth)/inscription/FormulaireInscription";
import { lireInvitation, type MotifRefus } from "@/lib/auth/invitation";

/**
 * Deux entrées pour un même écran.
 *
 * Avec une invitation, le propriétaire a déjà désigné la personne : le champ
 * « code du bien » disparaît et le formulaire arrive pré-rempli. Sans, on
 * retombe sur le code, saisi à la main.
 *
 * L'invitation est validée **ici**, avant l'affichage, et non au moment de
 * l'envoi : découvrir un lien expiré après avoir tout ressaisi serait la pire
 * des façons de l'apprendre.
 */
const REFUS: Record<MotifRefus, { titre: string; suite: string }> = {
  inconnue: {
    titre: "Ce lien d'invitation n'est pas valide.",
    suite:
      "Il a peut-être été tronqué en le copiant. Demandez à votre propriétaire de vous le renvoyer en entier.",
  },
  expiree: {
    titre: "Cette invitation a expiré.",
    suite:
      "Les liens ne valent que sept jours, par sécurité. Demandez-en un nouveau à votre propriétaire — cela lui prend quelques secondes.",
  },
  utilisee: {
    titre: "Cette invitation a déjà servi.",
    suite: "Votre compte existe donc probablement déjà : essayez de vous connecter.",
  },
};

export default async function InscriptionLocatairePage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const brut = (await searchParams).invitation;
  const jeton = Array.isArray(brut) ? brut[0] : brut;

  const lecture = jeton ? await lireInvitation(jeton) : null;
  const invitation =
    lecture?.valide === true
      ? {
          jeton: jeton!,
          nom: lecture.invitation.nom ?? undefined,
          telephone: lecture.invitation.telephone ?? undefined,
          email: lecture.invitation.email ?? undefined,
        }
      : undefined;
  const refus = lecture?.valide === false ? REFUS[lecture.motif] : null;

  return (
    <>
      <div className="border-line bg-surface rounded-lg border p-6 shadow-sm sm:p-8">
        <Link
          href="/inscription"
          className="text-ink-3 hover:text-ink inline-flex items-center gap-1.5 text-sm no-underline [&_svg]:size-4 [&_svg]:shrink-0"
        >
          <ArrowLeftIcon />
          Choisir un autre profil
        </Link>
        <h1 className="font-display text-ink mt-3 text-2xl font-semibold">
          {invitation ? "Vous êtes invité" : "Créer un compte locataire"}
        </h1>
        <p className="text-ink-2 mt-1 text-sm">
          {invitation
            ? "Votre propriétaire vous a ouvert un accès. Vérifiez vos informations et choisissez un mot de passe."
            : "Toujours gratuit. Il vous faut le code de votre bien, transmis par votre propriétaire."}
        </p>

        {refus && (
          <p className="border-danger bg-danger-soft text-ink mt-4 rounded-md border px-3 py-2.5 text-sm">
            <strong className="font-semibold">{refus.titre}</strong> {refus.suite}
          </p>
        )}

        {/* Un lien refusé ne bloque pas : le code de bien reste offert en
            secours, plutôt que de laisser la personne devant une impasse. */}
        <FormulaireInscription role="locataire" invitation={invitation} />
      </div>

      <p className="text-ink-2 mt-5 text-center text-sm">
        Déjà un compte ?{" "}
        <Link href="/connexion" className="text-primary font-semibold no-underline">
          Se connecter
        </Link>
      </p>
    </>
  );
}
