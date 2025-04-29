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
      cards: {
        Row: {
          content: Json
          created_at: string
          id: string
          is_published: boolean
          sections_enabled: Json
          template: Database["public"]["Enums"]["template_type"]
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          content?: Json
          created_at?: string
          id?: string
          is_published?: boolean
          sections_enabled?: Json
          template: Database["public"]["Enums"]["template_type"]
          title: string
          updated_at?: string
          user_id: string
        }
        Update: {
          content?: Json
          created_at?: string
          id?: string
          is_published?: boolean
          sections_enabled?: Json
          template?: Database["public"]["Enums"]["template_type"]
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      planning_lists: {
        Row: {
          created_at: string
          id: string
          name: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          name: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      planning_transactions: {
        Row: {
          amount: number
          category_id: string
          created_at: string
          date: string
          description: string
          id: string
          is_paid: boolean
          list_id: string
          observation: string | null
          type: string
          updated_at: string
          user_id: string
        }
        Insert: {
          amount: number
          category_id: string
          created_at?: string
          date?: string
          description: string
          id?: string
          is_paid?: boolean
          list_id: string
          observation?: string | null
          type: string
          updated_at?: string
          user_id: string
        }
        Update: {
          amount?: number
          category_id?: string
          created_at?: string
          date?: string
          description?: string
          id?: string
          is_paid?: boolean
          list_id?: string
          observation?: string | null
          type?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "planning_transactions_list_id_fkey"
            columns: ["list_id"]
            isOneToOne: false
            referencedRelation: "planning_lists"
            referencedColumns: ["id"]
          },
        ]
      }
      products: {
        Row: {
          brand: string | null
          category: Database["public"]["Enums"]["product_category"]
          created_at: string | null
          id: string
          last_price: number | null
          name: string
          unit: Database["public"]["Enums"]["unit_measure"]
          updated_at: string | null
          user_id: string
        }
        Insert: {
          brand?: string | null
          category: Database["public"]["Enums"]["product_category"]
          created_at?: string | null
          id?: string
          last_price?: number | null
          name: string
          unit?: Database["public"]["Enums"]["unit_measure"]
          updated_at?: string | null
          user_id: string
        }
        Update: {
          brand?: string | null
          category?: Database["public"]["Enums"]["product_category"]
          created_at?: string | null
          id?: string
          last_price?: number | null
          name?: string
          unit?: Database["public"]["Enums"]["unit_measure"]
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          id: string
          name: string | null
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          id: string
          name?: string | null
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          id?: string
          name?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      shopping_items: {
        Row: {
          checked: boolean
          created_at: string
          id: string
          list_id: string
          price: number
          product_id: string
          quantity: number
          updated_at: string
          user_id: string
        }
        Insert: {
          checked?: boolean
          created_at?: string
          id?: string
          list_id: string
          price?: number
          product_id: string
          quantity?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          checked?: boolean
          created_at?: string
          id?: string
          list_id?: string
          price?: number
          product_id?: string
          quantity?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "shopping_items_list_id_fkey"
            columns: ["list_id"]
            isOneToOne: false
            referencedRelation: "shopping_lists"
            referencedColumns: ["id"]
          },
        ]
      }
      shopping_lists: {
        Row: {
          budget: number
          created_at: string
          id: string
          name: string
          updated_at: string
          user_id: string
        }
        Insert: {
          budget?: number
          created_at?: string
          id?: string
          name: string
          updated_at?: string
          user_id: string
        }
        Update: {
          budget?: number
          created_at?: string
          id?: string
          name?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      product_category:
        | "laticinios"
        | "carnes"
        | "graos"
        | "bebidas"
        | "hortifruti"
        | "padaria"
        | "higiene"
        | "limpeza"
        | "outros"
        | "bebidas_alcoolicas"
        | "bebidas_nao_alcoolicas"
        | "carnes_bovinas"
        | "carnes_suinas"
        | "carnes_aves"
        | "carnes_peixes"
        | "carnes_frios"
        | "massas_frescas"
        | "massas_secas"
        | "graos_cereais"
        | "graos_leguminosas"
        | "hortifruti_verduras"
        | "hortifruti_legumes"
        | "hortifruti_frutas"
        | "padaria_paes"
        | "padaria_bolos"
        | "padaria_salgados"
        | "laticinios_leites"
        | "laticinios_queijos"
        | "laticinios_iogurtes"
        | "laticinios_manteigas"
        | "higiene_pessoal"
        | "higiene_bucal"
        | "limpeza_roupas"
        | "limpeza_casa"
        | "limpeza_cozinha"
        | "pet_shop"
        | "bebes"
        | "congelados"
        | "enlatados"
        | "temperos"
        | "doces"
        | "snacks"
        | "cafe"
        | "chas"
        | "suplementos"
        | "medicamentos"
      template_type:
        | "raiz-criativa"
        | "natural-local"
        | "premium-clean"
        | "divertido-pop"
      transaction_category:
        | "salario"
        | "freelance"
        | "beneficio"
        | "presente"
        | "aluguel"
        | "dividendos"
        | "outros_ganhos"
        | "moradia"
        | "alimentacao"
        | "transporte"
        | "saude"
        | "educacao"
        | "lazer"
        | "vestuario"
        | "contas"
        | "credito"
        | "pets"
        | "viagens"
        | "tecnologia"
        | "beleza"
        | "esportes"
        | "cultura"
        | "presentes"
        | "doacoes"
        | "seguros"
        | "impostos"
        | "investimentos"
        | "outros_gastos"
      unit_measure: "kg" | "g" | "l" | "ml" | "un"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DefaultSchema = Database[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
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
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
    | { schema: keyof Database },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof Database },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends { schema: keyof Database }
  ? Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      product_category: [
        "laticinios",
        "carnes",
        "graos",
        "bebidas",
        "hortifruti",
        "padaria",
        "higiene",
        "limpeza",
        "outros",
        "bebidas_alcoolicas",
        "bebidas_nao_alcoolicas",
        "carnes_bovinas",
        "carnes_suinas",
        "carnes_aves",
        "carnes_peixes",
        "carnes_frios",
        "massas_frescas",
        "massas_secas",
        "graos_cereais",
        "graos_leguminosas",
        "hortifruti_verduras",
        "hortifruti_legumes",
        "hortifruti_frutas",
        "padaria_paes",
        "padaria_bolos",
        "padaria_salgados",
        "laticinios_leites",
        "laticinios_queijos",
        "laticinios_iogurtes",
        "laticinios_manteigas",
        "higiene_pessoal",
        "higiene_bucal",
        "limpeza_roupas",
        "limpeza_casa",
        "limpeza_cozinha",
        "pet_shop",
        "bebes",
        "congelados",
        "enlatados",
        "temperos",
        "doces",
        "snacks",
        "cafe",
        "chas",
        "suplementos",
        "medicamentos"
      ],
      template_type: [
        "raiz-criativa",
        "natural-local",
        "premium-clean",
        "divertido-pop",
      ],
      transaction_category: [
        "salario",
        "freelance",
        "beneficio",
        "presente",
        "aluguel",
        "dividendos",
        "outros_ganhos",
        "moradia",
        "alimentacao",
        "transporte",
        "saude",
        "educacao",
        "lazer",
        "vestuario",
        "contas",
        "credito",
        "pets",
        "viagens",
        "tecnologia",
        "beleza",
        "esportes",
        "cultura",
        "presentes",
        "doacoes",
        "seguros",
        "impostos",
        "investimentos",
        "outros_gastos",
      ],
      unit_measure: ["kg", "g", "l", "ml", "un"],
    },
  },
} as const
