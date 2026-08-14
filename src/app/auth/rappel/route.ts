import { NextResponse, type NextRequest } from "next/server";
import { supabaseUtilisateur } from "@/lib/supabase/utilisateur";

/**
 * Point d'atterrissage des liens envoyés par courriel.
 *
 * Supabase place dans le lien un code à usage unique. Il faut l'échanger
 * contre une session — c'est cet échange qui prouve que la personne a bien
 * reçu le courriel, et c'est lui qui autorise ensuite le changement de mot de
 * passe.
 *
 * L'échange ne peut avoir lieu que dans un gestionnaire de route ou une action :
 * une page ne peut pas écrire les cookies de session.
 */
export async function GET(request: NextRequest) {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  // On n'accepte qu'un chemin interne : une URL absolue ferait de cette route
  // un tremplin de redirection vers un site tiers.
  const demande = url.searchParams.get("suite") ?? "/dashboard";
  const suite = demande.startsWith("/") && !demande.startsWith("//") ? demande : "/dashboard";

  if (!code) {
    return NextResponse.redirect(new URL("/connexion?erreur=lien", request.url));
  }

  const { error } = await supabaseUtilisateur().auth.exchangeCodeForSession(code);
  if (error) {
    return NextResponse.redirect(new URL("/connexion?erreur=lien", request.url));
  }

  return NextResponse.redirect(new URL(suite, request.url));
}
