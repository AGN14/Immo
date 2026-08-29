import type { Metadata } from "next";
import { DocumentLegale } from "@/components/marketing/DocumentLegale";

export const metadata: Metadata = {
  title: "Mentions légales — Xwégán",
  description:
    "Éditeur du site Xwégán, hébergement et coordonnées de contact, conformément au Code du numérique du Bénin.",
};

export default function MentionsLegalesPage() {
  return (
    <DocumentLegale
      type="Mentions légales"
      titre="Mentions légales du site Xwégán"
      introduction="Les informations qui suivent identifient l'éditeur et l'hébergeur du site, comme l'exige le Code du numérique en République du Bénin."
      miseAJour="25 août 2026"
      sections={[
        {
          titre: "Éditeur du site",
          corps: (
            <>
              <p>
                Xwégán est un projet mené par une équipe, sans structure juridique
                constituée à ce jour. Conformément au Code du numérique de la République du Bénin,
                l&rsquo;éditeur du site est <strong>Xwégán</strong>.
              </p>
              <p>
                Contact :{" "}
                <a href="mailto:contact@xwegan.com" className="text-primary font-semibold no-underline">
                  contact@xwegan.com
                </a>
              </p>
            </>
          ),
        },
        {
          titre: "Directeur de la publication",
          corps: (
            <p>
              Le directeur de la publication est Xwégán. Les contenus publiés sur le site
              engagent leur auteur.
            </p>
          ),
        },
        {
          titre: "Hébergement",
          corps: (
            <>
              <p>
                Le site est hébergé par Supabase (supabase.com), société fournissant
                l&rsquo;infrastructure, l&rsquo;authentification et le stockage des photos. Les données peuvent
                être stockées dans une région située hors du Bénin ; les modalités et garanties de
                ce transfert sont détaillées dans notre{" "}
                <a href="/confidentialite" className="text-primary font-semibold no-underline">
                  politique de confidentialité
                </a>
                .
              </p>
            </>
          ),
        },
        {
          titre: "Propriété intellectuelle",
          corps: (
            <p>
              Le nom Xwégán, le logo, les textes, les visuels et l&rsquo;ensemble des éléments du site sont
              protégés par le droit de la propriété intellectuelle. Toute reproduction ou
              représentation, totale ou partielle, sans autorisation écrite préalable de l&rsquo;éditeur
              est interdite.
            </p>
          ),
        },
        {
          titre: "Protection des données personnelles",
          corps: (
            <p>
              Le site collecte et traite des données à caractère personnel dans le respect de la
              loi n° 2017-20 du 20 avril 2018 portant Code du numérique en République du Bénin et
              du règlement n° 2018/01/CM/UEMOA relatif à la protection des données à caractère
              personnel. Pour connaître vos droits et exercer vos recours, consultez notre{" "}
              <a href="/confidentialite" className="text-primary font-semibold no-underline">
                politique de confidentialité
              </a>
              .
            </p>
          ),
        },
        {
          titre: "Droit applicable",
          corps: (
            <p>
              Le présent site et ses contenus sont soumis au droit béninois. En cas de litige, les
              juridictions de Cotonou sont seules compétentes, sauf disposition légale contraire.
            </p>
          ),
        },
      ]}
    />
  );
}