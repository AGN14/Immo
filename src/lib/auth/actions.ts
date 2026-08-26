"use server";

import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { supabaseUtilisateur } from "@/lib/supabase/utilisateur";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { PLAN_PAR_DEFAUT, PLANS, uuidDuPlan, type PlanId } from "@/lib/plans";
import { destroySession } from "@/lib/auth/session";
import { lireInvitation } from "@/lib/auth/invitation";

/**
 * Authentification par Supabase Auth.
 *
 * Les mots de passe vivent dans `auth.users`, hachés par Supabase — jamais
 * dans nos tables. Nos fiches `proprietaire` et `locataire` ne portent que le
 * lien `auth_user_id`, sur lequel s'appuient toutes les politiques RLS.
 *
 * Une seule connexion pour les deux rôles : c'est la fiche rattachée au compte
 * qui détermine où l'on atterrit, jamais le formulaire.
 */

/** Longueur minimale, alignée sur le réglage Supabase. */
const LONGUEUR_MINIMALE = 8;

/**
 * Version des documents juridiques (date de la dernière révision des
 * Conditions d'utilisation et de la Politique de confidentialité). Conservée
 * sur chaque ligne de consentement pour prouver ce qui a été accepté.
 */
const VERSION_CONSENTEMENT = "2026-08-15";

/** Le texte exact que coche l'utilisateur, tel qu'affiché à l'inscription. */
const TEXTE_CONSENTEMENT =
  "J'accepte les Conditions d'utilisation de Xwégán et la Politique de " +
  "confidentialité. En cochant cette case, je consens au traitement de mes " +
  "données personnelles (nom, e-mail, téléphone et données de gestion " +
  "locative que je renseigne) pour : la gestion de mon compte, le suivi des " +
  "loyers et paiements, le signalement des pannes et litiges, la facturation " +
  "et le contact au sujet de mon compte.";

/**
 * L'origine réelle de la requête, pour construire les liens des e-mails.
 * En dur, un lien de réinitialisation pointerait vers localhost dans les
 * courriels envoyés depuis une autre machine du réseau.
 */
async function origine(): Promise<string> {
  const h = await headers();
  const hote = h.get("x-forwarded-host") ?? h.get("host") ?? "localhost:3000";
  const protocole = h.get("x-forwarded-proto") ?? "http";
  return `${protocole}://${hote}`;
}

export async function login(formData: FormData) {
  const email = String(formData.get("email") ?? "")
    .trim()
    .toLowerCase();
  const motDePasse = String(formData.get("password") ?? "");

  const { error } = await supabaseUtilisateur().auth.signInWithPassword({
    email,
    password: motDePasse,
  });

  // Adresse inconnue et mot de passe faux donnent le même message : le
  // formulaire ne doit pas devenir un moyen de savoir qui a un compte ici.
  if (error) redirect("/connexion?erreur=identifiants");

  redirect("/dashboard");
}

/**
 * Se déconnecter ramène à l'accueil, pas au formulaire de connexion.
 *
 * Renvoyer vers `/connexion` proposait de se reconnecter à quelqu'un qui vient
 * justement de partir — et sur un poste partagé, laissait à l'écran un
 * formulaire pré-cadré pour le compte qu'on venait de quitter. L'accueil est
 * l'endroit neutre : on peut fermer l'onglet, ou se reconnecter en un clic.
 */
export async function logout() {
  await destroySession();
  redirect("/");
}

/** Ce que l'inscription renvoie au formulaire quand elle n'aboutit pas. */
export interface EtatInscription {
  erreur?: string;
}

/**
 * À l'inscription, le profil est un choix de l'utilisateur — contrairement à
 * la connexion, où il se déduit du compte.
 *
 * Deux écritures, dans cet ordre : le compte Supabase Auth, puis la fiche
 * métier qui le référence. Si la seconde échoue, on supprime le compte : un
 * utilisateur authentifié sans fiche ne peut rien faire et bloquerait son
 * adresse pour une nouvelle tentative.
 */
export async function signup(
  _etat: EtatInscription,
  formData: FormData,
): Promise<EtatInscription> {
  const role = formData.get("role") === "locataire" ? "locataire" : "proprietaire";
  const nom = String(formData.get("nom") ?? "Vous").trim();
  const email = String(formData.get("email") ?? "")
    .trim()
    .toLowerCase();
  const telephone = String(formData.get("telephone") ?? "").trim() || null;
  const motDePasse = String(formData.get("password") ?? "");
  if (motDePasse.length < LONGUEUR_MINIMALE) return { erreur: "court" };

  // Sans consentement, pas de compte : la politique ne s'applique qu'à ceux
  // qui l'ont acceptée, et la preuve (article 389) doit exister dès l'origine.
  if (formData.get("consentement") !== "on") return { erreur: "consentement" };

  // Le code de bien est vérifié AVANT de créer quoi que ce soit : inutile
  // d'ouvrir un compte qui ne pourra être rattaché à aucun parc.
  let proprietaireId: string | null = null;
  let invitationId: string | null = null;

  if (role === "locataire") {
    /**
     * Deux chemins d'entrée, et l'invitation prime.
     *
     * Elle est nominative, à usage unique et expire : le propriétaire a
     * explicitement désigné cette personne. Le code de bien, lui, reste ouvert
     * à quiconque l'a vu — il ne sert que le cas courant où le bailleur le
     * donne de vive voix.
     */
    const jeton = String(formData.get("invitation") ?? "").trim();
    if (jeton) {
      const lecture = await lireInvitation(jeton);
      // Le motif du refus est repris tel quel : « expirée » et « déjà
      // utilisée » n'appellent pas la même suite.
      if (!lecture.valide) return { erreur: `invitation-${lecture.motif}` };
      proprietaireId = lecture.invitation.proprietaireId;
      invitationId = lecture.invitation.id;
    }
  }

  if (role === "locataire" && !proprietaireId) {
    const code = String(formData.get("codeBien") ?? "")
      .trim()
      .toUpperCase();
    if (!code) return { erreur: "code" };

    // Client d'administration : le futur locataire n'a pas encore de jeton, et
    // n'aura jamais le droit de lire la table `bien` de ce propriétaire.
    const { data: bien } = await supabaseAdmin()
      .from("bien")
      .select("proprietaire_id")
      .eq("code", code)
      .maybeSingle();

    if (!bien) return { erreur: "code" };
    proprietaireId = bien.proprietaire_id;
  }

  const { data: compte, error: erreurCompte } = await supabaseUtilisateur().auth.signUp({
    email,
    password: motDePasse,
  });

  if (erreurCompte) return { erreur: codeDeLErreur(erreurCompte) };
  if (!compte.user) return { erreur: "1" };

  /**
   * Adresse déjà prise : Supabase répond 200 avec un utilisateur FACTICE plutôt
   * qu'une erreur, pour ne pas révéler qu'un compte existe à cette adresse. Le
   * seul signe est la liste `identities`, qui revient vide.
   *
   * La détection précédente cherchait « already » dans un message d'erreur qui
   * n'arrive jamais : on poursuivait donc avec un identifiant qui ne désigne
   * personne. Côté propriétaire l'unicité de l'e-mail arrêtait les frais ; côté
   * locataire, où cette contrainte n'existe pas, on créait une fiche orpheline
   * rattachée à un compte inexistant.
   */
  if ((compte.user.identities ?? []).length === 0) return { erreur: "existe" };

  const admin = supabaseAdmin();
  const authUserId = compte.user.id;

  let locataireCree: string | null = null;
  let erreurFiche;

  if (role === "locataire") {
    // L'identifiant est renvoyé : l'invitation doit savoir qui l'a consommée.
    const { data, error } = await admin
      .from("locataire")
      .insert({ proprietaire_id: proprietaireId!, nom, email, telephone, auth_user_id: authUserId })
      .select("id")
      .single();
    locataireCree = data?.id ?? null;
    erreurFiche = error;
  } else {
    const { error } = await admin.from("proprietaire").insert({
      nom,
      email,
      telephone,
      auth_user_id: authUserId,
      plan_id: uuidDuPlan(planDemande(formData)),
    });
    erreurFiche = error;
  }

  if (erreurFiche) {
    // Sans fiche, le compte est inutilisable : on ne laisse pas de coquille.
    await admin.auth.admin.deleteUser(authUserId);
    return { erreur: "1" };
  }

  // La preuve du consentement doit exister avec le compte, pas après coup. Si
  // elle manque, on déroule : sans elle, le compte n'a pas de base légale.
  const { error: erreurConsentement } = await admin.from("consentement").insert({
    auth_user_id: authUserId,
    finalite: "compte",
    version: VERSION_CONSENTEMENT,
    texte: TEXTE_CONSENTEMENT,
  });

  if (erreurConsentement) {
    await admin
      .from(role === "locataire" ? "locataire" : "proprietaire")
      .delete()
      .eq("auth_user_id", authUserId);
    await admin.auth.admin.deleteUser(authUserId);
    return { erreur: "1" };
  }

  /**
   * Pas de session ? Alors le projet exige une confirmation par e-mail, et
   * `signUp` n'a rien ouvert.
   *
   * On redirigeait malgré tout vers l'espace connecté, dont le layout appelle
   * `getSession()`, ne trouvait rien et renvoyait vers /connexion — où la
   * connexion échouait à son tour, l'adresse n'étant pas confirmée. Le compte
   * était bel et bien créé, mais l'écran donnait à croire le contraire.
   */
  /**
   * L'invitation est consommée en dernier, une fois le compte réellement
   * constitué. La marquer plus tôt l'aurait brûlée pour rien si l'inscription
   * avait échoué ensuite — et le propriétaire aurait dû en réémettre une.
   *
   * L'échec de cette écriture ne fait pas échouer l'inscription : le compte
   * existe, le refuser serait pire qu'un lien qui resterait utilisable.
   */
  if (invitationId) {
    await admin
      .from("invitation")
      .update({ utilisee_le: new Date().toISOString(), locataire_id: locataireCree })
      .eq("id", invitationId);
  }

  if (!compte.session) return { erreur: "confirmez" };

  // Le propriétaire choisit son palier ; le locataire va droit à son espace.
  redirect(role === "proprietaire" ? "/plans" : "/dashboard");
}

/**
 * Traduit l'échec de Supabase en un code que la page d'inscription sait dire.
 *
 * Tout tombait auparavant sur « 1 », y compris le quota d'e-mails — qui n'est
 * pas une faute de saisie et ne se corrige pas en réessayant tout de suite.
 */
function codeDeLErreur(erreur: { code?: string; message?: string }): string {
  const code = erreur.code ?? "";
  const message = (erreur.message ?? "").toLowerCase();

  if (code === "over_email_send_rate_limit" || message.includes("rate limit")) return "limite";
  if (code === "email_address_invalid" || message.includes("invalid")) return "adresse";
  if (code === "user_already_exists" || message.includes("already")) return "existe";
  if (code === "weak_password" || message.includes("password")) return "court";
  return "1";
}

/** Le lien « Passer en Pro » de la page Tarifs transporte le palier choisi. */
function planDemande(formData: FormData): PlanId {
  const demande = String(formData.get("plan") ?? "");
  return PLANS[demande as PlanId] ? (demande as PlanId) : PLAN_PAR_DEFAUT;
}

/**
 * Mot de passe oublié — première étape : l'envoi du lien.
 *
 * On répond la même chose que l'adresse existe ou non. Confirmer qu'un compte
 * existe renseignerait un attaquant, et l'utilisateur légitime, lui, reçoit
 * bien son courriel.
 */
export async function demanderReinitialisation(formData: FormData) {
  const email = String(formData.get("email") ?? "")
    .trim()
    .toLowerCase();

  if (email) {
    await supabaseUtilisateur().auth.resetPasswordForEmail(email, {
      redirectTo: `${await origine()}/auth/rappel?suite=/reinitialiser`,
    });
  }

  redirect("/connexion/oublie?envoye=1");
}

/**
 * Seconde étape : le nouveau mot de passe.
 *
 * Le lien du courriel a ouvert une session — c'est elle qui autorise le
 * changement. Sans session valide, `updateUser` échoue, ce qui interdit de
 * réinitialiser le mot de passe d'autrui en devinant une URL.
 */
export async function definirNouveauMotDePasse(formData: FormData) {
  const motDePasse = String(formData.get("password") ?? "");
  const confirmation = String(formData.get("confirmation") ?? "");

  if (motDePasse.length < LONGUEUR_MINIMALE) redirect("/reinitialiser?erreur=court");
  if (motDePasse !== confirmation) redirect("/reinitialiser?erreur=confirmation");

  const { error } = await supabaseUtilisateur().auth.updateUser({ password: motDePasse });
  if (error) redirect("/reinitialiser?erreur=expire");

  redirect("/dashboard");
}
