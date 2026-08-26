"use client";

import Link from "next/link";
import { useActionState } from "react";
import { signup, type EtatInscription } from "@/lib/auth/actions";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { MessageInscription } from "@/app/(auth)/inscription/MessageInscription";

const etatInitial: EtatInscription = {};

/**
 * Le formulaire d'inscription, commun aux deux profils.
 *
 * `useActionState` plutôt qu'une redirection : l'échec renvoyait auparavant
 * vers la même page avec un code en paramètre, ce qui rechargeait le
 * formulaire **vide**. Un code de bien mal recopié coûtait donc de ressaisir
 * le nom, l'adresse, le téléphone et le mot de passe — la page semblait
 * refuser d'avancer.
 *
 * Sans navigation, le navigateur conserve ce qui a été tapé : seule la ligne
 * fautive reste à corriger. Le succès, lui, redirige toujours — c'est le
 * serveur qui décide où, selon le profil.
 */
export function FormulaireInscription({
  role,
  plan,
  invitation,
}: {
  role: "locataire" | "proprietaire";
  /** Palier choisi depuis la grille tarifaire, transmis tel quel au serveur. */
  plan?: string;
  /**
   * Invitation validée en amont par la page. Sa présence remplace le code du
   * bien : le propriétaire a déjà désigné cette personne, lui demander en plus
   * un code qu'il vient de lui éviter n'aurait aucun sens.
   */
  invitation?: { jeton: string; nom?: string; telephone?: string; email?: string };
}) {
  const [etat, action, enCours] = useActionState(signup, etatInitial);

  return (
    <>
      <MessageInscription code={etat.erreur} />

      <form action={action} className="mt-6 flex flex-col gap-4">
        <input type="hidden" name="role" value={role} />
        {role === "proprietaire" && <input type="hidden" name="plan" value={plan ?? "essentiel"} />}

        {invitation && <input type="hidden" name="invitation" value={invitation.jeton} />}

        {role === "locataire" && !invitation && (
          <Input
            label="Code du bien"
            type="text"
            name="codeBien"
            placeholder="Ex. BAOBAB-3B"
            hint="Demandez ce code à votre propriétaire."
            required
          />
        )}

        <Input
          label="Nom complet"
          type="text"
          name="nom"
          placeholder={role === "locataire" ? "Kouadio Yves" : "Aïssatou Diallo"}
          defaultValue={invitation?.nom}
          required
        />
        <Input
          label="Adresse e-mail"
          type="email"
          name="email"
          placeholder="vous@exemple.com"
          defaultValue={invitation?.email}
          required
        />
        <Input
          label="Téléphone"
          type="tel"
          name="telephone"
          placeholder="+229 01 23 45 67"
          defaultValue={invitation?.telephone}
          required
        />
        {/* La longueur exigée est annoncée avant la saisie : la découvrir au
            moment du refus fait recommencer pour rien. */}
        <Input
          label="Mot de passe"
          type="password"
          name="password"
          minLength={8}
          hint="Huit caractères au minimum."
          required
        />

        <label className="text-ink-3 flex items-start gap-2 text-xs">
          <input
            type="checkbox"
            name="consentement"
            required
            className="accent-[var(--color-primary)] mt-0.5"
          />
          <span>
            J&rsquo;accepte les{" "}
            <Link href="/conditions-utilisation" className="text-primary font-semibold no-underline">
              Conditions d&rsquo;utilisation
            </Link>{" "}
            et la{" "}
            <Link href="/confidentialite" className="text-primary font-semibold no-underline">
              politique de confidentialité
            </Link>{" "}
            de Xwégán.
          </span>
        </label>

        <Button type="submit" variant="primary" block className="mt-1" disabled={enCours}>
          {enCours ? "Création en cours…" : "Créer mon compte"}
        </Button>
      </form>
    </>
  );
}
