import type { Metadata } from "next";
import { DocumentLegale } from "@/components/marketing/DocumentLegale";

export const metadata: Metadata = {
  title: "Politique de cookies — Xwégán",
  description:
    "Quels cookies Xwégán dépose sur votre navigateur, à quoi ils servent et comment les gérer, conformément au Code du numérique du Bénin.",
};

export default function CookiesPage() {
  return (
    <DocumentLegale
      type="Cookies"
      titre="Politique de gestion des cookies"
      introduction="Cette page décrit les cookies et traceurs utilisés par Xwégán, leur finalité et la manière de les gérer. Elle est établie conformément au Code du numérique de la République du Bénin."
      miseAJour="15 août 2026"
      sections={[
        {
          titre: "1. Qu'est-ce qu'un cookie ?",
          corps: (
            <p>
              Un cookie est un petit fichier texte déposé sur votre appareil (ordinateur, tablette,
              téléphone) lors de la consultation d&rsquo;un site. Il permet au site de conserver des
              informations pendant votre navigation.
            </p>
          ),
        },
        {
          titre: "2. Cookies utilisés par Xwégán",
          corps: (
            <>
              <p>Xwégán n&rsquo;utilise aucun traceur publicitaire ni cookie de suivi commercial.</p>
              <p>Seuls des cookies strictement nécessaires au fonctionnement du service sont déposés :</p>
              <ul className="list-disc space-y-1 pl-5">
                <li>
                  <strong>Authentification :</strong> pour garder votre session ouverte lorsque
                  vous êtes connecté ;
                </li>
                <li>
                  <strong>Préférences :</strong> pour mémoriser vos choix d&rsquo;affichage et de
                  configuration ;
                </li>
                <li>
                  <strong>Sécurité :</strong> pour protéger le service contre les abus et les
                  fraudes.
                </li>
              </ul>
            </>
          ),
        },
        {
          titre: "3. Consentement",
          corps: (
            <p>
              Les cookies strictement nécessaires ne requièrent pas de consentement préalable :
              sans eux, le service ne pourrait pas fonctionner. Si Xwégán mettait un jour en place
              des traceurs de mesure ou de publicité, votre consentement exprès serait recueilli
              avant leur dépôt, avec la possibilité de le retirer à tout moment.
            </p>
          ),
        },
        {
          titre: "4. Gérer vos cookies",
          corps: (
            <p>
              Vous pouvez à tout moment modifier vos préférences ou supprimer les cookies via les
              réglages de votre navigateur (Chrome, Firefox, Safari, Edge, Opera). La
              désactivation des cookies strictement nécessaires peut empêcher l&rsquo;accès à votre
              compte ou dégrader le fonctionnement du service.
            </p>
          ),
        },
        {
          titre: "5. Durée de conservation",
          corps: (
            <p>
              Les cookies de session sont supprimés à la fermeture de votre navigateur. Les cookies
              de préférences sont conservés pour une durée maximale de [X] mois, après quoi ils
              sont renouvelés ou supprimés.
            </p>
          ),
        },
        {
          titre: "6. Contact",
          corps: (
            <p>
              Pour toute question relative aux cookies ou à vos données personnelles :{" "}
              <a
                href="mailto:contact@xwegan.com"
                className="text-primary font-semibold no-underline"
              >
                contact@xwegan.com
              </a>
              , ou consultez notre{" "}
              <a href="/confidentialite" className="text-primary font-semibold no-underline">
                politique de confidentialité
              </a>
              .
            </p>
          ),
        },
      ]}
    />
  );
}