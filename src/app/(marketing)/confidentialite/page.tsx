import type { Metadata } from "next";
import { DocumentLegale } from "@/components/marketing/DocumentLegale";

export const metadata: Metadata = {
  title: "Politique de confidentialité — Xwégán",
  description:
    "Comment Xwégán collecte, utilise et protège vos données personnelles au Bénin, conformément au Code du numérique et au règlement UEMOA.",
};

export default function ConfidentialitePage() {
  return (
    <DocumentLegale
      type="Confidentialité"
      titre="Politique de confidentialité et de protection des données personnelles"
      introduction="Xwégán traite des données à caractère personnel. Cette politique vous explique lesquelles, pourquoi, pendant combien de temps, et quels sont vos droits. Elle est régie par la loi n° 2017-20 du 20 avril 2018 portant Code du numérique en République du Bénin et par le règlement n° 2018/01/CM/UEMOA relatif à la protection des données à caractère personnel."
      miseAJour="15 août 2026"
      sections={[
        {
          titre: "1. Responsable du traitement",
          corps: (
            <>
              <p>
                Le responsable du traitement est BOUDZOUMOU Florent Junior, personne physique,
                Fidjrosse, C/1776, Maison QUENUM Rogatien, Cotonou, Bénin.
              </p>
              <p>
                Pour toute question relative à vos données personnelles :{" "}
                <a href="mailto:contact@xwegan.com" className="text-primary font-semibold no-underline">
                  contact@xwegan.com
                </a>{" "}
                — [TÉLÉPHONE À COMPLÉTER].
              </p>
            </>
          ),
        },
        {
          titre: "2. Données collectées",
          corps: (
            <>
              <p>
                Nous collectons uniquement les données nécessaires au fonctionnement de la
                plateforme :
              </p>
              <ul className="list-disc space-y-1 pl-5">
                <li>
                  <strong>Pour votre compte :</strong> nom complet, adresse e-mail, numéro de
                  téléphone et mot de passe (stocké de façon sécurisée).
                </li>
                <li>
                  <strong>Côté propriétaire :</strong> biens immobiliers (nom, type, adresse,
                  quartier, ville), lots, montants de loyers, informations sur les locataires et
                  l&rsquo;historique des paiements, photos des pannes et des litiges.
                </li>
                <li>
                  <strong>Côté locataire :</strong> nom complet, e-mail, téléphone et code du bien
                  transmis par votre propriétaire.
                </li>
                <li>
                  <strong>Données d&rsquo;utilisation :</strong> pages consultées, adresse IP et journaux
                  de connexion, nécessaires à la sécurité et au bon fonctionnement du service.
                </li>
              </ul>
              <p>
                Les photos d&rsquo;identité et autres documents sensibles ne sont collectés que lorsqu&rsquo;un
                propriétaire les ajoute volontairement dans le cadre de la gestion de ses biens.
              </p>
            </>
          ),
        },
        {
          titre: "3. Finalités des traitements",
          corps: (
            <ul className="list-disc space-y-1 pl-5">
              <li>Création et gestion de votre compte (propriétaire ou locataire) ;</li>
              <li>Suivi des loyers, paiements, cautions et reversements en FCFA ;</li>
              <li>Signalement et suivi des pannes et des litiges ;</li>
              <li>Génération des factures et relances ;</li>
              <li>Gestion de votre abonnement (choix du palier et de ses limites) ;</li>
              <li>Envoi de la newsletter, uniquement si vous y avez consenti ;</li>
              <li>Recueil et preuve de votre consentement (article 389) ;</li>
              <li>Sécurité du service et prévention des fraudes.</li>
            </ul>
          ),
        },
        {
          titre: "4. Base légale des traitements",
          corps: (
            <p>
              Les traitements reposent sur le consentement (article 389 du Code du numérique),
              l&rsquo;exécution du contrat de service auquel vous avez souscrit, et le respect
              d&rsquo;obligations légales (notamment comptables et fiscales pour les paiements). Vous
              pouvez retirer votre consentement à tout moment, sans remettre en cause la licéité
              des traitements déjà effectués.
            </p>
          ),
        },
        {
          titre: "5. Durées de conservation",
          corps: (
            <ul className="list-disc space-y-1 pl-5">
              <li>
                <strong>Compte et données de gestion :</strong> le temps de votre utilisation du
                service, puis supprimés dans un délai de [X] mois après la clôture du compte, sous
                réserve des obligations légales.
              </li>
              <li>
                <strong>Données comptables et de paiement :</strong> conservées pendant la durée
                légale applicable (dix ans pour les documents comptables).
              </li>
              <li>
                <strong>Newsletter :</strong> jusqu&rsquo;au retrait de votre consentement.
              </li>
            </ul>
          ),
        },
        {
          titre: "6. Destinataires et sous-traitants",
          corps: (
            <p>
              Vos données sont accessibles aux seules personnes autorisées chez Xwégán. Elles peuvent
              être traitées par des sous-traitants techniques (hébergement, envoi d&rsquo;e-mails,
              paiement) liés par des contrats conformes au Code du numérique et au règlement UEMOA,
              imposant des garanties de sécurité et de confidentialité. Nous ne vendons jamais vos
              données.
            </p>
          ),
        },
        {
          titre: "7. Transferts de données vers l'étranger",
          corps: (
            <p>
              Certains sous-traitants (par exemple l&rsquo;hébergeur) peuvent être situés hors du Bénin.
              Tout transfert de données vers l&rsquo;étranger est effectué dans le respect des articles
              391 et 392 du Code du numérique, notamment par l&rsquo;adoption des clauses contractuelles
              types de l&rsquo;APDP ou une autorisation préalable de l&rsquo;Autorité lorsque celle-ci est
              requise.
            </p>
          ),
        },
        {
          titre: "8. Vos droits",
          corps: (
            <>
              <p>Conformément au Code du numérique, vous disposez des droits suivants :</p>
              <ul className="list-disc space-y-1 pl-5">
                <li>droit d&rsquo;accès à vos données (article 437) ;</li>
                <li>droit de rectification des données inexactes ou incomplètes ;</li>
                <li>droit à l&rsquo;effacement (droit à l&rsquo;oubli) ;</li>
                <li>droit d&rsquo;opposition au traitement, notamment pour la prospection ;</li>
                <li>droit de retirer votre consentement à tout moment (article 334) ;</li>
                <li>droit de ne pas être soumis à une décision exclusivement automatisée.</li>
              </ul>
              <p>
                Vous pouvez exercer ces droits en écrivant à{" "}
                <a href="mailto:contact@xwegan.com" className="text-primary font-semibold no-underline">
                  contact@xwegan.com
                </a>
                . Nous répondons dans un délai d&rsquo;un (1) mois à compter de la réception de votre
                demande. Pour supprimer votre compte et vos données, utilisez la fonctionnalité
                prévue à cet effet dans votre espace.
              </p>
            </>
          ),
        },
        {
          titre: "9. Délégué à la protection des données",
          corps: (
            <p>
              Un délégué à la protection des données (DPO) a été désigné — CHOUCHOU Curie — et
              peut être contacté à{" "}
              <a
                href="mailto:dpo@xwegan.com"
                className="text-primary font-semibold no-underline"
              >
                dpo@xwegan.com
              </a>
              . Le registre des activités de traitement est tenu et mis à jour conformément à
              l&rsquo;article 435 du Code du numérique.
            </p>
          ),
        },
        {
          titre: "10. Sécurité des données",
          corps: (
            <p>
              Nous mettons en œuvre des mesures techniques et organisationnelles appropriées
              (articles 424 à 426 du Code du numérique) : accès authentifié et habilité, chiffrement
              des données sensibles, sauvegardes, supervision des accès et plans de gestion des
              incidents. En cas de violation de données susceptible d&rsquo;engendrer un risque pour vos
              droits et libertés, nous vous en informons et notifions l&rsquo;APDP sans délai, comme le
              prévoit l&rsquo;article 427.
            </p>
          ),
        },
        {
          titre: "11. Cookies et traceurs",
          corps: (
            <p>
              Xwégán n&rsquo;utilise pas de traceurs publicitaires. Seuls des cookies strictement
              nécessaires au fonctionnement du service (authentification, préférences, sécurité)
              sont déposés. Ils ne nécessitent pas de consentement préalable. Le détail est
              documenté dans notre{" "}
              <a href="/cookies" className="text-primary font-semibold no-underline">
                politique de gestion des cookies
              </a>
              .
            </p>
          ),
        },
        {
          titre: "12. Réclamations auprès de l'APDP",
          corps: (
            <>
              <p>
                Si vous estimez que vos droits ne sont pas respectés, vous pouvez saisir l&rsquo;Autorité
                de Protection des Données Personnelles (APDP) :
              </p>
              <ul className="list-disc space-y-1 pl-5">
                <li>Site : https://www.apdp.bj</li>
                <li>E-mail : contact@apdp.bj</li>
                <li>
                  Adresse : Immeuble El Marzouk Joël, rue 6.076, Aïdjèdo, Cotonou — BP 01 BP 4837.
                </li>
              </ul>
            </>
          ),
        },
        {
          titre: "13. Évolution de cette politique",
          corps: (
            <p>
              Cette politique peut être mise à jour pour refléter l&rsquo;évolution du service ou des
              exigences légales. La version en vigueur est toujours celle publiée sur cette page,
              avec sa date de mise à jour. En cas de modification importante, nous vous en
              informons par e-mail.
            </p>
          ),
        },
      ]}
    />
  );
}