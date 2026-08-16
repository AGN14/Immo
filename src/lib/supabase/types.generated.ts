export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      abonnement: {
        Row: {
          cree_le: string
          id: string
          montant_fcfa: number
          periode_debut: string
          periode_fin: string
          plan_id: string
          proprietaire_id: string
          reference_externe: string
        }
        Insert: {
          cree_le?: string
          id?: string
          montant_fcfa: number
          periode_debut?: string
          periode_fin: string
          plan_id: string
          proprietaire_id: string
          reference_externe: string
        }
        Update: {
          cree_le?: string
          id?: string
          montant_fcfa?: number
          periode_debut?: string
          periode_fin?: string
          plan_id?: string
          proprietaire_id?: string
          reference_externe?: string
        }
        Relationships: [
          {
            foreignKeyName: "abonnement_plan_id_fkey"
            columns: ["plan_id"]
            isOneToOne: false
            referencedRelation: "plan"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "abonnement_proprietaire_id_fkey"
            columns: ["proprietaire_id"]
            isOneToOne: false
            referencedRelation: "proprietaire"
            referencedColumns: ["id"]
          },
        ]
      }
      bail: {
        Row: {
          cree_le: string
          date_debut: string
          date_fin: string | null
          id: string
          jour_echeance: number | null
          locataire_id: string
          lot_id: string
          loyer_mensuel_fcfa: number
          statut: string
        }
        Insert: {
          cree_le?: string
          date_debut: string
          date_fin?: string | null
          id?: string
          jour_echeance?: number | null
          locataire_id: string
          lot_id: string
          loyer_mensuel_fcfa: number
          statut: string
        }
        Update: {
          cree_le?: string
          date_debut?: string
          date_fin?: string | null
          id?: string
          jour_echeance?: number | null
          locataire_id?: string
          lot_id?: string
          loyer_mensuel_fcfa?: number
          statut?: string
        }
        Relationships: [
          {
            foreignKeyName: "bail_locataire_id_fkey"
            columns: ["locataire_id"]
            isOneToOne: false
            referencedRelation: "locataire"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bail_lot_id_fkey"
            columns: ["lot_id"]
            isOneToOne: false
            referencedRelation: "lot"
            referencedColumns: ["id"]
          },
        ]
      }
      bien: {
        Row: {
          adresse: string
          ascenseur: boolean
          balcon: boolean
          climatisation: boolean
          code: string | null
          cree_le: string
          description: string | null
          etages: number | null
          garage: boolean
          id: string
          image_url: string | null
          nom: string
          proprietaire_id: string
          quartier: string
          slug: string
          superficie_m2: number | null
          type: string
          ville: string
        }
        Insert: {
          adresse: string
          ascenseur?: boolean
          balcon?: boolean
          climatisation?: boolean
          code?: string | null
          cree_le?: string
          description?: string | null
          etages?: number | null
          garage?: boolean
          id?: string
          image_url?: string | null
          nom: string
          proprietaire_id: string
          quartier: string
          slug?: string
          superficie_m2?: number | null
          type: string
          ville: string
        }
        Update: {
          adresse?: string
          ascenseur?: boolean
          balcon?: boolean
          climatisation?: boolean
          code?: string | null
          cree_le?: string
          description?: string | null
          etages?: number | null
          garage?: boolean
          id?: string
          image_url?: string | null
          nom?: string
          proprietaire_id?: string
          quartier?: string
          slug?: string
          superficie_m2?: number | null
          type?: string
          ville?: string
        }
        Relationships: [
          {
            foreignKeyName: "bien_proprietaire_id_fkey"
            columns: ["proprietaire_id"]
            isOneToOne: false
            referencedRelation: "proprietaire"
            referencedColumns: ["id"]
          },
        ]
      }
      caution: {
        Row: {
          bail_id: string
          cree_le: string
          encaissee_le: string | null
          id: string
          montant_fcfa: number
          restituee_le: string | null
          statut: string
        }
        Insert: {
          bail_id: string
          cree_le?: string
          encaissee_le?: string | null
          id?: string
          montant_fcfa: number
          restituee_le?: string | null
          statut?: string
        }
        Update: {
          bail_id?: string
          cree_le?: string
          encaissee_le?: string | null
          id?: string
          montant_fcfa?: number
          restituee_le?: string | null
          statut?: string
        }
        Relationships: [
          {
            foreignKeyName: "caution_bail_id_fkey"
            columns: ["bail_id"]
            isOneToOne: false
            referencedRelation: "bail"
            referencedColumns: ["id"]
          },
        ]
      }
      consentement: {
        Row: {
          accepte: boolean
          auth_user_id: string
          cree_le: string
          finalite: string
          id: string
          texte: string
          version: string
        }
        Insert: {
          accepte?: boolean
          auth_user_id: string
          cree_le?: string
          finalite: string
          id?: string
          texte: string
          version: string
        }
        Update: {
          accepte?: boolean
          auth_user_id?: string
          cree_le?: string
          finalite?: string
          id?: string
          texte?: string
          version?: string
        }
        Relationships: [
          {
            foreignKeyName: "consentement_auth_user_id_fkey"
            columns: ["auth_user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      gestionnaire: {
        Row: {
          cree_le: string
          email: string | null
          id: string
          nom: string
          proprietaire_id: string
          telephone: string | null
        }
        Insert: {
          cree_le?: string
          email?: string | null
          id?: string
          nom: string
          proprietaire_id: string
          telephone?: string | null
        }
        Update: {
          cree_le?: string
          email?: string | null
          id?: string
          nom?: string
          proprietaire_id?: string
          telephone?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "gestionnaire_proprietaire_id_fkey"
            columns: ["proprietaire_id"]
            isOneToOne: false
            referencedRelation: "proprietaire"
            referencedColumns: ["id"]
          },
        ]
      }
      locataire: {
        Row: {
          auth_user_id: string | null
          cree_le: string
          date_naissance: string | null
          email: string | null
          garant_nom: string | null
          garant_telephone: string | null
          id: string
          nom: string
          occupants: number | null
          photo_url: string | null
          piece_numero: string | null
          piece_type: string | null
          profession: string | null
          proprietaire_id: string
          telephone: string | null
        }
        Insert: {
          auth_user_id?: string | null
          cree_le?: string
          date_naissance?: string | null
          email?: string | null
          garant_nom?: string | null
          garant_telephone?: string | null
          id?: string
          nom: string
          occupants?: number | null
          photo_url?: string | null
          piece_numero?: string | null
          piece_type?: string | null
          profession?: string | null
          proprietaire_id: string
          telephone?: string | null
        }
        Update: {
          auth_user_id?: string | null
          cree_le?: string
          date_naissance?: string | null
          email?: string | null
          garant_nom?: string | null
          garant_telephone?: string | null
          id?: string
          nom?: string
          occupants?: number | null
          photo_url?: string | null
          piece_numero?: string | null
          piece_type?: string | null
          profession?: string | null
          proprietaire_id?: string
          telephone?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "locataire_proprietaire_id_fkey"
            columns: ["proprietaire_id"]
            isOneToOne: false
            referencedRelation: "proprietaire"
            referencedColumns: ["id"]
          },
        ]
      }
      lot: {
        Row: {
          bien_id: string
          composition: string
          cree_le: string
          id: string
          loyer_reference_fcfa: number | null
          nom: string
        }
        Insert: {
          bien_id: string
          composition: string
          cree_le?: string
          id?: string
          loyer_reference_fcfa?: number | null
          nom: string
        }
        Update: {
          bien_id?: string
          composition?: string
          cree_le?: string
          id?: string
          loyer_reference_fcfa?: number | null
          nom?: string
        }
        Relationships: [
          {
            foreignKeyName: "lot_bien_id_fkey"
            columns: ["bien_id"]
            isOneToOne: false
            referencedRelation: "bien"
            referencedColumns: ["id"]
          },
        ]
      }
      newsletter_abonne: {
        Row: {
          actif: boolean
          cree_le: string
          email: string
          id: string
        }
        Insert: {
          actif?: boolean
          cree_le?: string
          email: string
          id?: string
        }
        Update: {
          actif?: boolean
          cree_le?: string
          email?: string
          id?: string
        }
        Relationships: []
      }
      paiement: {
        Row: {
          bail_id: string
          cree_le: string
          id: string
          montant_fcfa: number
          penalite_fcfa: number
          periode: string
          versement_id: string
        }
        Insert: {
          bail_id: string
          cree_le?: string
          id?: string
          montant_fcfa: number
          penalite_fcfa?: number
          periode: string
          versement_id: string
        }
        Update: {
          bail_id?: string
          cree_le?: string
          id?: string
          montant_fcfa?: number
          penalite_fcfa?: number
          periode?: string
          versement_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "paiement_bail_id_fkey"
            columns: ["bail_id"]
            isOneToOne: false
            referencedRelation: "bail"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "paiement_versement_id_fkey"
            columns: ["versement_id"]
            isOneToOne: false
            referencedRelation: "versement"
            referencedColumns: ["id"]
          },
        ]
      }
      plan: {
        Row: {
          description: string | null
          fonctionnalites: Json
          id: string
          max_baux: number | null
          nom: string
          prix_fcfa: number
          slug: string
        }
        Insert: {
          description?: string | null
          fonctionnalites?: Json
          id?: string
          max_baux?: number | null
          nom: string
          prix_fcfa: number
          slug: string
        }
        Update: {
          description?: string | null
          fonctionnalites?: Json
          id?: string
          max_baux?: number | null
          nom?: string
          prix_fcfa?: number
          slug?: string
        }
        Relationships: []
      }
      proprietaire: {
        Row: {
          auth_user_id: string | null
          compteur_quittance: number
          cree_le: string
          delai_tolerance_jours: number
          email: string
          id: string
          jour_echeance_defaut: number
          jour_reversement: number
          mot_de_passe_hash: string | null
          nom: string
          penalite_retard_fcfa: number
          plan_expire_le: string | null
          plan_id: string
          supprime_le: string | null
          telephone: string | null
        }
        Insert: {
          auth_user_id?: string | null
          compteur_quittance?: number
          cree_le?: string
          delai_tolerance_jours?: number
          email: string
          id?: string
          jour_echeance_defaut?: number
          jour_reversement?: number
          mot_de_passe_hash?: string | null
          nom: string
          penalite_retard_fcfa?: number
          plan_expire_le?: string | null
          plan_id?: string
          supprime_le?: string | null
          telephone?: string | null
        }
        Update: {
          auth_user_id?: string | null
          compteur_quittance?: number
          cree_le?: string
          delai_tolerance_jours?: number
          email?: string
          id?: string
          jour_echeance_defaut?: number
          jour_reversement?: number
          mot_de_passe_hash?: string | null
          nom?: string
          penalite_retard_fcfa?: number
          plan_expire_le?: string | null
          plan_id?: string
          supprime_le?: string | null
          telephone?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "proprietaire_plan_id_fkey"
            columns: ["plan_id"]
            isOneToOne: false
            referencedRelation: "plan"
            referencedColumns: ["id"]
          },
        ]
      }
      quittance: {
        Row: {
          annulee_le: string | null
          emise_le: string
          id: string
          motif_annulation: string | null
          numero: string
          paiement_id: string
          proprietaire_id: string
        }
        Insert: {
          annulee_le?: string | null
          emise_le?: string
          id?: string
          motif_annulation?: string | null
          numero: string
          paiement_id: string
          proprietaire_id: string
        }
        Update: {
          annulee_le?: string | null
          emise_le?: string
          id?: string
          motif_annulation?: string | null
          numero?: string
          paiement_id?: string
          proprietaire_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "quittance_paiement_id_fkey"
            columns: ["paiement_id"]
            isOneToOne: true
            referencedRelation: "paiement"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "quittance_proprietaire_id_fkey"
            columns: ["proprietaire_id"]
            isOneToOne: false
            referencedRelation: "proprietaire"
            referencedColumns: ["id"]
          },
        ]
      }
      reversement: {
        Row: {
          commission_fcfa: number
          cree_le: string
          execute_le: string | null
          id: string
          montant_brut_fcfa: number
          montant_net_fcfa: number
          periode: string
          prevu_le: string
          proprietaire_id: string
          reference_externe: string | null
          statut: string
        }
        Insert: {
          commission_fcfa?: number
          cree_le?: string
          execute_le?: string | null
          id?: string
          montant_brut_fcfa: number
          montant_net_fcfa: number
          periode: string
          prevu_le: string
          proprietaire_id: string
          reference_externe?: string | null
          statut: string
        }
        Update: {
          commission_fcfa?: number
          cree_le?: string
          execute_le?: string | null
          id?: string
          montant_brut_fcfa?: number
          montant_net_fcfa?: number
          periode?: string
          prevu_le?: string
          proprietaire_id?: string
          reference_externe?: string | null
          statut?: string
        }
        Relationships: [
          {
            foreignKeyName: "reversement_proprietaire_id_fkey"
            columns: ["proprietaire_id"]
            isOneToOne: false
            referencedRelation: "proprietaire"
            referencedColumns: ["id"]
          },
        ]
      }
      signalement: {
        Row: {
          bail_id: string | null
          confirme_le: string | null
          cree_le: string
          description: string
          id: string
          lot_id: string
          pris_en_charge_le: string | null
          resolu_le: string | null
          statut: string
          titre: string
          urgence: string
        }
        Insert: {
          bail_id?: string | null
          confirme_le?: string | null
          cree_le?: string
          description: string
          id?: string
          lot_id: string
          pris_en_charge_le?: string | null
          resolu_le?: string | null
          statut?: string
          titre: string
          urgence?: string
        }
        Update: {
          bail_id?: string | null
          confirme_le?: string | null
          cree_le?: string
          description?: string
          id?: string
          lot_id?: string
          pris_en_charge_le?: string | null
          resolu_le?: string | null
          statut?: string
          titre?: string
          urgence?: string
        }
        Relationships: [
          {
            foreignKeyName: "signalement_bail_id_fkey"
            columns: ["bail_id"]
            isOneToOne: false
            referencedRelation: "bail"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "signalement_lot_id_fkey"
            columns: ["lot_id"]
            isOneToOne: false
            referencedRelation: "lot"
            referencedColumns: ["id"]
          },
        ]
      }
      signalement_message: {
        Row: {
          auteur: string
          corps: string
          cree_le: string
          id: string
          signalement_id: string
        }
        Insert: {
          auteur: string
          corps: string
          cree_le?: string
          id?: string
          signalement_id: string
        }
        Update: {
          auteur?: string
          corps?: string
          cree_le?: string
          id?: string
          signalement_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "signalement_message_signalement_id_fkey"
            columns: ["signalement_id"]
            isOneToOne: false
            referencedRelation: "signalement"
            referencedColumns: ["id"]
          },
        ]
      }
      signalement_photo: {
        Row: {
          chemin: string
          cree_le: string
          id: string
          ordre: number
          signalement_id: string
        }
        Insert: {
          chemin: string
          cree_le?: string
          id?: string
          ordre?: number
          signalement_id: string
        }
        Update: {
          chemin?: string
          cree_le?: string
          id?: string
          ordre?: number
          signalement_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "signalement_photo_signalement_id_fkey"
            columns: ["signalement_id"]
            isOneToOne: false
            referencedRelation: "signalement"
            referencedColumns: ["id"]
          },
        ]
      }
      versement: {
        Row: {
          bail_id: string
          confirme_le: string | null
          confirme_par: string | null
          declare_le: string
          id: string
          methode: string
          montant_total_fcfa: number
          penalites_fcfa: number
          reference_externe: string | null
          reversement_id: string | null
          statut: string
        }
        Insert: {
          bail_id: string
          confirme_le?: string | null
          confirme_par?: string | null
          declare_le?: string
          id?: string
          methode: string
          montant_total_fcfa: number
          penalites_fcfa?: number
          reference_externe?: string | null
          reversement_id?: string | null
          statut: string
        }
        Update: {
          bail_id?: string
          confirme_le?: string | null
          confirme_par?: string | null
          declare_le?: string
          id?: string
          methode?: string
          montant_total_fcfa?: number
          penalites_fcfa?: number
          reference_externe?: string | null
          reversement_id?: string | null
          statut?: string
        }
        Relationships: [
          {
            foreignKeyName: "versement_bail_id_fkey"
            columns: ["bail_id"]
            isOneToOne: false
            referencedRelation: "bail"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "versement_reversement_id_fkey"
            columns: ["reversement_id"]
            isOneToOne: false
            referencedRelation: "reversement"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      proprietaire_reglages: {
        Row: {
          delai_tolerance_jours: number | null
          id: string | null
          jour_echeance_defaut: number | null
          jour_reversement: number | null
          nom: string | null
          penalite_retard_fcfa: number | null
        }
        Relationships: []
      }
    }
    Functions: {
      baux_actifs_du_proprietaire: {
        Args: { p_proprietaire_id: string }
        Returns: number
      }
      locataire_courant: { Args: never; Returns: string }
      prochain_numero_quittance: {
        Args: { p_proprietaire_id: string }
        Returns: string
      }
      proprietaire_courant: { Args: never; Returns: string }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const

