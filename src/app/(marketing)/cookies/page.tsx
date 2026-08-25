import type { Metadata } from "next";
import { DocumentLegale } from "@/components/marketing/DocumentLegale";

export const metadata: Metadata = {
  title: "Cookies — Xwégán",
  description:
    "Quels cookies Xwégán utilise, à quoi ils servent et comment les gérer depuis votre navigateur.",
};

export default function CookiesPage() {
  return (
    <DocumentLegale
      type="Cookies"
      titre="Politique relative aux cookies"
      introduction="Ce document décrit les cookies déposés par Xwégán et la manière dont vous pouvez les contrôler."
      miseAJour="15 août 2026"
      sections={[
        {
          titre: "Qu&rsquo;est-ce qu&rsquo;un cookie ?",
          corps: (
            <p>
              Un cookie est un petit fichier texte déposé sur votre terminal (ordinateur, mobile,
              tablette) lors de la visite d&rsquo;un site. Il permet de conserver des informations entre
              deux pages ou plusieurs visites.
            </p>
          ),
        },
        {
          titre: "Cookies utilisés par Xwégán",
          corps: (
            <>
              <p>Nous utilisons uniquement des cookies strictement nécessaires au service :</p>
              <ul className="list-disc space-y-1 pl-5">
                <li>
                  Cookie de session d&rsquo;authentification (géré par Supabase) : maintient votre
                  connexion tant que vous êtes connecté ;
                </li>
                <li>
                  Cookies techniques : sécurité des requêtes et mémorisation de vos préférences
                  d&rsquo;affichage.
                </li>
              </ul>
              <p>
                Xwégán ne dépose pas, par défaut, de cookie de mesure d&rsquo;audience ou de
                publicité tiers.
              </p>
            </>
          ),
        },
        {
          titre: "Cookies de services tiers",
          corps: (
            <p>
              Le widget de paiement KKiaPay peut déposer ses propres cookies lors d&rsquo;un
              règlement. Ces cookies sont soumis à la politique de KKiaPay.
            </p>
          ),
        },
        {
          titre: "Consentement et gestion",
          corps: (
            <>
              <p>
                Les cookies strictement nécessaires à la sécurité de la session ne peuvent être
                désactivés sans rendre le service inutilisable. Pour les autres, vous pouvez à tout
                moment les gérer via les paramètres de votre navigateur :
              </p>
              <ul className="list-disc space-y-1 pl-5">
                <li>Chrome et Edge : Paramètres → Confidentialité et sécurité → Cookies ;</li>
                <li>Firefox : Paramètres → Vie privée et sécurité → Cookies ;</li>
                <li>Safari : Préférences → Confidentialité.</li>
              </ul>
            </>
          ),
        },
        {
          titre: "Modification",
          corps: (
            <p>
              Cette politique peut évoluer. La version en vigueur est celle publiée sur cette page,
              datée de la dernière mise à jour ci-dessus.
            </p>
          ),
        },
      ]}
    />
  );
}
