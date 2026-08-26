import "server-only";
import { supabaseAdmin } from "@/lib/supabase/admin";

/**
 * Lecture d'une invitation depuis son jeton.
 *
 * Client d'administration, comme pour le code de bien : celui qui ouvre le lien
 * n'a pas encore de session, et n'aura jamais le droit de lire la table
 * `invitation` d'un propriétaire. Le jeton EST l'autorisation — d'où ses 32
 * octets tirés au sort, et sa durée de vie limitée.
 */

export type MotifRefus = "inconnue" | "expiree" | "utilisee";

export interface InvitationValide {
  id: string;
  proprietaireId: string;
  lotId: string | null;
  nom: string | null;
  telephone: string | null;
  email: string | null;
}

export type LectureInvitation =
  | { valide: true; invitation: InvitationValide }
  | { valide: false; motif: MotifRefus };

/**
 * Les trois refus sont distingués parce qu'ils appellent des suites
 * différentes : un lien expiré se redemande au propriétaire, un lien déjà
 * utilisé signifie qu'on a déjà un compte, un lien inconnu est une faute de
 * copie. Un message unique aurait laissé chacun deviner.
 */
export async function lireInvitation(jeton: string): Promise<LectureInvitation> {
  if (!jeton) return { valide: false, motif: "inconnue" };

  const { data } = await supabaseAdmin()
    .from("invitation")
    .select("id, proprietaire_id, lot_id, nom, telephone, email, expire_le, utilisee_le")
    .eq("jeton", jeton)
    .maybeSingle();

  if (!data) return { valide: false, motif: "inconnue" };
  if (data.utilisee_le) return { valide: false, motif: "utilisee" };
  if (new Date(data.expire_le) <= new Date()) return { valide: false, motif: "expiree" };

  return {
    valide: true,
    invitation: {
      id: data.id,
      proprietaireId: data.proprietaire_id,
      lotId: data.lot_id,
      nom: data.nom,
      telephone: data.telephone,
      email: data.email,
    },
  };
}
