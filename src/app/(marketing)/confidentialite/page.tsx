import type { Metadata } from "next";
import { DocumentLegale } from "@/components/marketing/DocumentLegale";

export const metadata: Metadata = {
  title: "Politique de confidentialité — Xwégán",
  description:
    "Données collectées par Xwégán, finalités, hébergement, transferts et droits des personnes concernées, conformément au Code du numérique du Bénin.",
};

export default function ConfidentialitePage() {
  return (
    <DocumentLegale
      type="Confidentialité"
      titre="Politique de confidentialité"
      introduction="Xwégán accorde une grande importance à la protection de vos données personnelles. Cette politique explique ce qui est collecté, pourquoi, et quels sont vos droits."
      miseAJour="15 août 2026"
      sections={[
        {
          titre: "Responsable du traitement",
          corps: (
            <p>
              Le responsable du traitement est Xwégán, représenté par [À COMPLÉTER].
              Pour toute question sur la protection des données, écrivez à{" "}
              <a href="mailto:contact@xwegan.com" className="text-primary font-semibold no-underline">
                contact@xwegan.com
              </a>
              .
            </p>
          ),
        },
        {
          titre: "Données collectées",
          corps: (
            <>
              <p>Nous collectons les données strictement nécessaires au fonctionnement du service :</p>
              <ul className="list-disc space-y-1 pl-5">
                <li>
                  Données de compte : adresse e-mail, mot de passe (stocké sous forme de hachage
                  sécurisé), rôle (propriétaire ou locataire).
                </li>
                <li>
                  Données d&rsquo;activité : biens immobiliers, locataires, loyers, quittances,
                  signalements et photos jointes aux pannes.
                </li>
                <li>
                  Données de paiement : en cas d&rsquo;abonnement, les informations de transaction sont
                  confiées au prestataire KKiaPay ; nous ne stockons pas vos coordonnées bancaires.
                </li>
              </ul>
            </>
          ),
        },
        {
          titre: "Finalités du traitement",
          corps: (
            <p>
              Ces données servent à fournir la gestion locative (suivi des loyers, quittances,
              signalements), à facturer les abonnements, à assurer le support et à respecter nos
              obligations légales.
            </p>
          ),
        },
        {
          titre: "Base légale",
          corps: (
            <p>
              Le traitement repose sur l&rsquo;exécution du contrat (article 7 de la loi n° 2017-20 du 20
              avril 2018 portant Code du numérique en République du Bénin), votre consentement et,
              le cas échéant, le respect d&rsquo;une obligation légale. Le règlement n° 2018/01/CM/UEMOA
              relatif à la protection des données à caractère personnel s&rsquo;applique également.
            </p>
          ),
        },
        {
          titre: "Hébergement et sous-traitants",
          corps: (
            <>
              <p>
                L&rsquo;infrastructure est hébergée par Supabase (supabase.com), qui fournit la base de
                données, l&rsquo;authentification et le stockage des photos. Les paiements sont traités
                par KKiaPay (kkiapay.com).
              </p>
              <p>
                Ces sous-traitants peuvent stocker des données dans une région située hors du Bénin.
                Des garanties contractuelles encadrent ce transfert.
              </p>
            </>
          ),
        },
        {
          titre: "Durée de conservation",
          corps: (
            <p>
              Les données de compte sont conservées tant que votre compte est actif. Les données
              d&rsquo;activité sont conservées pendant la durée strictement nécessaire à la gestion du
              bien, puis supprimées à la clôture du compte, sauf obligation de conservation légale.
            </p>
          ),
        },
        {
          titre: "Vos droits",
          corps: (
            <>
              <p>Conformément à la loi, vous disposez d&rsquo;un droit d&rsquo;accès, de rectification, d&rsquo;effacement, d&rsquo;opposition et de portabilité de vos données. Vous pouvez :</p>
              <ul className="list-disc space-y-1 pl-5">
                <li>modifier vos informations depuis votre espace personnel ;</li>
                <li>
                  demander la suppression de votre compte à{" "}
                  <a href="mailto:contact@xwegan.com" className="text-primary font-semibold no-underline">
                    contact@xwegan.com
                  </a>{" "}
                  ;
                </li>
                <li>introduire une réclamation auprès de l&rsquo;autorité compétente au Bénin.</li>
              </ul>
            </>
          ),
        },
        {
          titre: "Sécurité",
          corps: (
            <p>
              Nous mettons en œuvre des mesures techniques et organisationnelles (chiffrement des mots
              de passe, accès restreint aux données) pour protéger vos informations contre toute
              atteinte accidentelle ou illicite.
            </p>
          ),
        },
      ]}
    />
  );
}
