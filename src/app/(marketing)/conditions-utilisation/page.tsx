import type { Metadata } from "next";
import { DocumentLegale } from "@/components/marketing/DocumentLegale";

export const metadata: Metadata = {
  title: "Conditions d'utilisation — Xwégán",
  description:
    "Conditions générales d'utilisation du service Xwégán pour propriétaires et locataires au Bénin.",
};

export default function ConditionsUtilisationPage() {
  return (
    <DocumentLegale
      type="Conditions"
      titre="Conditions générales d'utilisation"
      introduction="Les présentes conditions encadrent l'utilisation de la plateforme Xwégán par les propriétaires et les locataires. En créant un compte, vous les acceptez. Elles sont soumises au droit béninois, notamment à la loi n° 2017-20 portant Code du numérique."
      miseAJour="15 août 2026"
      sections={[
        {
          titre: "1. Objet du service",
          corps: (
            <p>
              Xwégán est une plateforme de gestion locative qui relie les propriétaires et leurs
              locataires sur un registre commun : suivi des loyers en FCFA, paiements, cautions,
              reversements, signalement des pannes et documentation des litiges.
            </p>
          ),
        },
        {
          titre: "2. Création et accès au compte",
          corps: (
            <>
              <p>
                Pour utiliser le service, vous créez un compte propriétaire ou locataire avec des
                informations exactes et à jour : nom complet, adresse e-mail et numéro de
                téléphone. Vous êtes responsable de la confidentialité de votre mot de passe et de
                toute activité réalisée depuis votre compte.
              </p>
              <p>
                Le compte locataire est créé à partir du code du bien, transmis par le
                propriétaire. L&rsquo;accès locataire est gratuit et le restera.
              </p>
            </>
          ),
        },
        {
          titre: "3. Abonnements et paiements",
          corps: (
            <>
              <p>Le service propriétaire est proposé selon trois offres :</p>
              <ul className="list-disc space-y-1 pl-5">
                <li>Essentiel : gratuit, jusqu&rsquo;à 3 logements loués ;</li>
                <li>Pro : 5 000 FCFA / mois, jusqu&rsquo;à 20 logements loués ;</li>
                <li>Business : 15 000 FCFA / mois, logements loués illimités.</li>
              </ul>
              <p>
                Les abonnements payants sont facturés en FCFA selon les modalités affichées à la
                souscription. Les montants sont dus pour chaque mois d&rsquo;utilisation. Vous pouvez
                résilier à tout moment ; la résiliation prend effet à la fin de la période en
                cours.
              </p>
            </>
          ),
        },
        {
          titre: "4. Limite de logements loués",
          corps: (
            <p>
              Le nombre de logements effectivement loués (baux actifs) est limité par votre offre.
              Lorsque la limite est atteinte, il n&rsquo;est plus possible de démarrer un nouveau bail
              actif tant que vous n&rsquo;avez pas libéré de la place ou souscrit à une offre supérieure.
              Cette règle s&rsquo;applique à tous les biens de votre compte, sans contournement possible.
            </p>
          ),
        },
        {
          titre: "5. Obligations des utilisateurs",
          corps: (
            <ul className="list-disc space-y-1 pl-5">
              <li>Fournir des informations exactes sur les biens, les locataires et les montants ;</li>
              <li>Déclarer les loyers, paiements, pannes et litiges de bonne foi ;</li>
              <li>Ne pas utiliser le service pour des activités illicites ou frauduleuses ;</li>
              <li>Respecter les droits des personnes dont les données sont enregistrées sur votre compte.</li>
            </ul>
          ),
        },
        {
          titre: "6. Gratuité du compte locataire",
          corps: (
            <p>
              Le locataire ne paie jamais pour utiliser Xwégán. Les loyers et autres montants versés
              au propriétaire sont réglés selon les modalités convenues entre les parties ; Xwégán
              n&rsquo;intervient pas comme organisme de paiement, sauf mention contraire explicite.
            </p>
          ),
        },
        {
          titre: "7. Propriété intellectuelle",
          corps: (
            <p>
              La plateforme, son code, ses marques, logos et contenus sont la propriété de Xwégán.
              Les données que vous enregistrez (biens, locataires, montants, photos) vous
              appartiennent et ne sont utilisées que pour vous fournir le service.
            </p>
          ),
        },
        {
          titre: "8. Disponibilité et responsabilité",
          corps: (
            <p>
              Xwégán s&rsquo;efforce de maintenir le service disponible et de sécuriser les données.
              Xwégán ne saurait être tenu responsable des décisions prises par les parties sur la
              base des informations enregistrées, ni des dommages indirects. L&rsquo;enregistrement d&rsquo;un
              paiement ou d&rsquo;un litige ne constitue pas un conseil juridique ni une décision de
              justice.
            </p>
          ),
        },
        {
          titre: "9. Suspension et résiliation",
          corps: (
            <p>
              Nous pouvons suspendre un compte en cas de violation des présentes conditions ou
              d&rsquo;utilisation frauduleuse du service. Vous pouvez à tout moment supprimer votre
              compte depuis votre espace. La suppression entraîne l&rsquo;effacement de vos données dans
              les conditions prévues par notre politique de confidentialité, sous réserve des
              obligations légales de conservation.
            </p>
          ),
        },
        {
          titre: "10. Protection des données",
          corps: (
            <p>
              Le traitement des données personnelles est décrit dans notre{" "}
              <a href="/confidentialite" className="text-primary font-semibold no-underline">
                politique de confidentialité
              </a>
              , conforme à la loi n° 2017-20 du 20 avril 2018 portant Code du numérique en
              République du Bénin et au règlement n° 2018/01/CM/UEMOA.
            </p>
          ),
        },
        {
          titre: "11. Droit applicable et litiges",
          corps: (
            <p>
              Les présentes conditions sont régies par le droit béninois. En cas de litige, les
              parties s&rsquo;efforceront de trouver une solution amiable avant toute action. À défaut,
              les tribunaux de Cotonou sont compétents, sauf disposition légale contraire.
            </p>
          ),
        },
        {
          titre: "12. Évolution des conditions",
          corps: (
            <p>
              Les présentes conditions peuvent être mises à jour. La version en vigueur est
              toujours celle publiée sur cette page, avec sa date. En cas de modification
              importante, vous en êtes informé par e-mail ; la poursuite de l&rsquo;utilisation du
              service vaut acceptation des nouvelles conditions.
            </p>
          ),
        },
      ]}
    />
  );
}