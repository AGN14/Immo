import type { Metadata } from "next";
import { DocumentLegale } from "@/components/marketing/DocumentLegale";

export const metadata: Metadata = {
  title: "Conditions d'utilisation — Xwégán",
  description:
    "Règles d'utilisation de Xwégán, comptes, paiements et abonnements, responsabilité et droit applicable au Bénin.",
};

export default function ConditionsUtilisationPage() {
  return (
    <DocumentLegale
      type="Conditions d'utilisation"
      titre="Conditions générales d'utilisation"
      introduction="En utilisant Xwégán, vous acceptez les présentes conditions. Merci de les lire attentivement."
      miseAJour="15 août 2026"
      sections={[
        {
          titre: "Objet",
          corps: (
            <p>
              Xwégán est une plateforme de gestion locative mettant en relation propriétaires et
              locataires. Les présentes conditions définissent les règles d&rsquo;accès et
              d&rsquo;utilisation du service.
            </p>
          ),
        },
        {
          titre: "Acceptation",
          corps: (
            <p>
              L&rsquo;inscription et l&rsquo;utilisation de la plateforme valent acceptation sans
              réserve des présentes conditions. Si vous n&rsquo;acceptez pas ces conditions, vous ne
              devez pas utiliser le service.
            </p>
          ),
        },
        {
          titre: "Comptes",
          corps: (
            <>
              <p>Vous êtes responsable :</p>
              <ul className="list-disc space-y-1 pl-5">
                <li>de l&rsquo;exactitude des informations fournies à l&rsquo;inscription ;</li>
                <li>de la confidentialité de votre mot de passe et de votre session ;</li>
                <li>de l&rsquo;activité réalisée depuis votre compte.</li>
              </ul>
              <p>
                L&rsquo;accès locataire est gratuit. Seuls les comptes propriétaires souscrivent un
                abonnement.
              </p>
            </>
          ),
        },
        {
          titre: "Règles d'utilisation",
          corps: (
            <>
              <p>Il est interdit de :</p>
              <ul className="list-disc space-y-1 pl-5">
                <li>saisir de fausses identités ou des données mensongères ;</li>
                <li>utiliser la plateforme à des fins illicites ;</li>
                <li>porter atteinte aux données d&rsquo;autrui ou à la sécurité du service.</li>
              </ul>
            </>
          ),
        },
        {
          titre: "Paiements et abonnements",
          corps: (
            <>
              <p>
                Les abonnements propriétaires sont réglés via KKiaPay (Mobile Money et autres moyens
                pris en charge). Sauf indication contraire, l&rsquo;abonnement est reconductible selon
                la périodicité choisie. Aucun remboursement n&rsquo;est dû pour une période déjà
                commencée, sauf disposition légale contraire.
              </p>
            </>
          ),
        },
        {
          titre: "Responsabilité",
          corps: (
            <p>
              Xwégán fournit le service en l&rsquo;état, sans garantie d&rsquo;absence
              d&rsquo;interruption. La plateforme ne se substitue pas aux obligations légales du
              propriétaire ou du locataire. En cas de force majeure, l&rsquo;exécution du service peut
              être suspendue.
            </p>
          ),
        },
        {
          titre: "Propriété intellectuelle",
          corps: (
            <p>
              Les éléments de la plateforme (nom, logo, contenus, code) sont protégés. Toute
              reproduction non autorisée est interdite.
            </p>
          ),
        },
        {
          titre: "Résiliation",
          corps: (
            <p>
              Vous pouvez fermer votre compte à tout moment depuis votre espace personnel ou en
              écrivant à{" "}
              <a href="mailto:contact@xwegan.com" className="text-primary font-semibold no-underline">
                contact@xwegan.com
              </a>
              . Xwégán peut suspendre un compte en cas de manquement aux présentes conditions.
            </p>
          ),
        },
        {
          titre: "Droit applicable",
          corps: (
            <p>
              Les présentes conditions sont soumises au droit béninois. En cas de litige, les
              juridictions de Cotonou sont compétentes, sauf disposition légale contraire.
            </p>
          ),
        },
      ]}
    />
  );
}
