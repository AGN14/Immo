/**
 * Le retour d'une inscription qui n'a pas abouti.
 *
 * Les deux formulaires redirigeaient vers eux-mêmes avec un code en paramètre,
 * mais un seul code — « consentement » — était affiché. Tous les autres
 * ramenaient un formulaire vide et muet : l'utilisateur ne savait pas si sa
 * demande avait échoué, ni pourquoi, ni s'il devait recommencer.
 *
 * Chaque message dit ce qui s'est passé ET ce qu'il faut faire. Un message qui
 * se contente de constater l'échec laisse la personne exactement où elle était.
 */

const ECHECS: Record<string, { titre: string; suite: string }> = {
  court: {
    titre: "Mot de passe trop court.",
    suite: "Il en faut au moins huit caractères.",
  },
  consentement: {
    titre: "Acceptation requise.",
    suite:
      "Cochez la case des Conditions d'utilisation et de la Politique de confidentialité pour créer un compte.",
  },
  code: {
    titre: "Ce code de bien ne correspond à aucun logement.",
    suite:
      "Vérifiez-le auprès de votre propriétaire : il figure sur la fiche de son bien, et s'écrit sous la forme BAOBAB-3B.",
  },
  existe: {
    titre: "Un compte utilise déjà cette adresse.",
    suite: "Connectez-vous, ou passez par « mot de passe oublié » si vous l'avez perdu.",
  },
  adresse: {
    titre: "Cette adresse e-mail est refusée.",
    suite:
      "Les domaines de test comme example.com ne sont pas acceptés. Utilisez une adresse réelle.",
  },
  // Cas d'exploitation, pas d'erreur de saisie : le mur des e-mails de
  // Supabase. Le dire franchement évite que la personne réessaie en boucle en
  // croyant s'être trompée.
  limite: {
    titre: "Trop d'inscriptions en peu de temps.",
    suite:
      "Le service d'envoi d'e-mails est momentanément saturé. Réessayez dans une heure — votre saisie n'est pas en cause.",
  },
  // Le lien a pu expirer entre l'ouverture de la page et l'envoi du formulaire :
  // ces trois cas sont donc aussi renvoyés par le serveur, pas seulement
  // détectés à l'affichage.
  "invitation-inconnue": {
    titre: "Ce lien d'invitation n'est pas valide.",
    suite: "Demandez à votre propriétaire de vous le renvoyer en entier.",
  },
  "invitation-expiree": {
    titre: "Cette invitation a expiré.",
    suite: "Les liens ne valent que sept jours. Demandez-en un nouveau à votre propriétaire.",
  },
  "invitation-utilisee": {
    titre: "Cette invitation a déjà servi.",
    suite: "Votre compte existe donc probablement déjà : essayez de vous connecter.",
  },
  1: {
    titre: "La création du compte a échoué.",
    suite: "Réessayez dans un instant. Si cela persiste, écrivez-nous et nous regarderons.",
  },
};

export function MessageInscription({ code }: { code?: string | string[] }) {
  // Un paramètre d'URL peut être répété (?erreur=a&erreur=b) : Next livre alors
  // un tableau. On retient le premier plutôt que d'afficher « a,b ».
  const cle = Array.isArray(code) ? code[0] : code;
  if (!cle) return null;

  // Le compte existe, il manque seulement la confirmation : c'est une réussite
  // partielle, pas un échec, et le ton doit le refléter.
  if (cle === "confirmez") {
    return (
      <p className="border-success bg-success-soft text-ink mt-4 rounded-md border px-3 py-2.5 text-sm">
        <strong className="font-semibold">Votre compte est créé.</strong> Ouvrez le lien de
        confirmation que nous venons de vous envoyer par e-mail, puis connectez-vous.
      </p>
    );
  }

  const echec = ECHECS[cle] ?? ECHECS[1];

  return (
    <p className="border-danger bg-danger-soft text-ink mt-4 rounded-md border px-3 py-2.5 text-sm">
      <strong className="font-semibold">{echec.titre}</strong> {echec.suite}
    </p>
  );
}
