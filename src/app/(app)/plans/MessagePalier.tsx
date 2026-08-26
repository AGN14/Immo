/**
 * Le retour d'un changement de palier.
 *
 * `choisirPlan` émettait quatre codes distincts et la page n'en lisait aucun :
 * on cliquait « Revenir à Essentiel », le serveur refusait, la page se
 * rechargeait à l'identique, sans un mot. Les paliers passaient alors pour de
 * simples encadrés décoratifs.
 *
 * Le cas « période en cours » n'est d'ailleurs pas une erreur : le refus
 * protège l'argent déjà versé. Il se dit donc sur un ton neutre, pas en rouge.
 */

const MESSAGES: Record<string, { ton: "info" | "erreur"; titre: string; suite: string }> = {
  "periode-en-cours": {
    ton: "info",
    titre: "Votre période payée court toujours.",
    suite:
      "Le retour à Essentiel prendra effet à son échéance — vous gardez d'ici là tout ce que vous avez réglé.",
  },
  paiement: {
    ton: "erreur",
    titre: "Ce palier se règle en ligne.",
    suite: "Utilisez le bouton de paiement de la carte : il vérifie la transaction avant d'activer le palier.",
  },
  palier: {
    ton: "erreur",
    titre: "Palier inconnu.",
    suite: "Rechargez la page et choisissez à nouveau.",
  },
  1: {
    ton: "erreur",
    titre: "Le changement n'a pas abouti.",
    suite: "Réessayez dans un instant. Si cela persiste, écrivez-nous.",
  },
};

export function MessagePalier({
  erreur,
  info,
}: {
  erreur?: string | string[];
  info?: string | string[];
}) {
  const premier = (v?: string | string[]) => (Array.isArray(v) ? v[0] : v);
  const cle = premier(info) ?? premier(erreur);
  if (!cle) return null;

  const m = MESSAGES[cle] ?? MESSAGES[1];
  const classe =
    m.ton === "info"
      ? "border-line bg-highlight text-ink"
      : "border-danger bg-danger-soft text-ink";

  return (
    <p className={`mt-6 rounded-md border px-4 py-3 text-sm ${classe}`}>
      <strong className="font-semibold">{m.titre}</strong> {m.suite}
    </p>
  );
}
