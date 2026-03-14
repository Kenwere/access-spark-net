export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      organizations: {
        Row: {
          created_at: string
          id: string
          logo_url: string | null
          name: string
          owner_id: string
          subdomain: string
          support_email: string | null
          support_phone: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          logo_url?: string | null
          name?: string
          owner_id: string
          subdomain: string
          support_email?: string | null
          support_phone?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          logo_url?: string | null
          name?: string
          owner_id?: string
          subdomain?: string
          support_email?: string | null
          support_phone?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      packages: {
        Row: {
          active: boolean
          created_at: string
          data_limit: string | null
          duration_label: string
          duration_minutes: number
          id: string
          name: string
          org_id: string | null
          price: number
          speed_limit: string | null
          user_id: string
        }
        Insert: {
          active?: boolean
          created_at?: string
          data_limit?: string | null
          duration_label?: string
          duration_minutes?: number
          id?: string
          name: string
          org_id?: string | null
          price?: number
          speed_limit?: string | null
          user_id: string
        }
        Update: {
          active?: boolean
          created_at?: string
          data_limit?: string | null
          duration_label?: string
          duration_minutes?: number
          id?: string
          name?: string
          org_id?: string | null
          price?: number
          speed_limit?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "packages_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      payments: {
        Row: {
          amount: number
          created_at: string
          id: string
          method: string
          org_id: string | null
          package_name: string
          phone: string
          router_name: string | null
          session_expiry: string | null
          status: string
          transaction_id: string | null
          user_id: string
        }
        Insert: {
          amount?: number
          created_at?: string
          id?: string
          method?: string
          org_id?: string | null
          package_name: string
          phone: string
          router_name?: string | null
          session_expiry?: string | null
          status?: string
          transaction_id?: string | null
          user_id: string
        }
        Update: {
          amount?: number
          created_at?: string
          id?: string
          method?: string
          org_id?: string | null
          package_name?: string
          phone?: string
          router_name?: string | null
          session_expiry?: string | null
          status?: string
          transaction_id?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "payments_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          created_at: string
          email: string
          full_name: string
          id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          email?: string
          full_name?: string
          id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          email?: string
          full_name?: string
          id?: string
          updated_at?: string
        }
        Relationships: []
      }
      routers: {
        Row: {
          active_users: number
          api_port: number
          bandwidth_control: boolean
          created_at: string
          device_tracking: boolean
          disable_sharing: boolean
          dns_name: string | null
          hotspot_address: string | null
          id: string
          ip_address: string
          location: string
          model: string
          name: string
          org_id: string | null
          password: string
          payment_destination: string
          provision_token: string | null
          session_logging: boolean
          status: string
          user_id: string
          username: string
        }
        Insert: {
          active_users?: number
          api_port?: number
          bandwidth_control?: boolean
          created_at?: string
          device_tracking?: boolean
          disable_sharing?: boolean
          dns_name?: string | null
          hotspot_address?: string | null
          id?: string
          ip_address: string
          location?: string
          model?: string
          name: string
          org_id?: string | null
          password?: string
          payment_destination?: string
          provision_token?: string | null
          session_logging?: boolean
          status?: string
          user_id: string
          username?: string
        }
        Update: {
          active_users?: number
          api_port?: number
          bandwidth_control?: boolean
          created_at?: string
          device_tracking?: boolean
          disable_sharing?: boolean
          dns_name?: string | null
          hotspot_address?: string | null
          id?: string
          ip_address?: string
          location?: string
          model?: string
          name?: string
          org_id?: string | null
          password?: string
          payment_destination?: string
          provision_token?: string | null
          session_logging?: boolean
          status?: string
          user_id?: string
          username?: string
        }
        Relationships: [
          {
            foreignKeyName: "routers_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      sessions: {
        Row: {
          created_at: string
          device_ip: string | null
          duration_used: number | null
          id: string
          login_time: string
          logout_time: string | null
          mac_address: string | null
          org_id: string | null
          package_name: string
          phone: string
          router_id: string | null
          status: string
          user_id: string
        }
        Insert: {
          created_at?: string
          device_ip?: string | null
          duration_used?: number | null
          id?: string
          login_time?: string
          logout_time?: string | null
          mac_address?: string | null
          org_id?: string | null
          package_name: string
          phone: string
          router_id?: string | null
          status?: string
          user_id: string
        }
        Update: {
          created_at?: string
          device_ip?: string | null
          duration_used?: number | null
          id?: string
          login_time?: string
          logout_time?: string | null
          mac_address?: string | null
          org_id?: string | null
          package_name?: string
          phone?: string
          router_id?: string | null
          status?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "sessions_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sessions_router_id_fkey"
            columns: ["router_id"]
            isOneToOne: false
            referencedRelation: "routers"
            referencedColumns: ["id"]
          },
        ]
      }
      settings: {
        Row: {
          account_number: string | null
          allow_session_resume: boolean | null
          auto_disconnect: boolean | null
          background_style: string | null
          business_logo_url: string | null
          business_name: string | null
          created_at: string
          default_payment_method: string | null
          enable_https: boolean | null
          enable_intasend: boolean | null
          enable_mpesa_paybill: boolean | null
          enable_mpesa_till: boolean | null
          enable_paystack: boolean | null
          enable_pesapal: boolean | null
          id: string
          intasend_pub_key: string | null
          intasend_secret_key: string | null
          mac_binding: boolean | null
          org_id: string | null
          paybill_number: string | null
          paystack_pub_key: string | null
          paystack_secret_key: string | null
          pesapal_consumer_key: string | null
          pesapal_consumer_secret: string | null
          primary_color: string | null
          support_phone: string | null
          till_number: string | null
          updated_at: string
          user_id: string
          welcome_message: string | null
        }
        Insert: {
          account_number?: string | null
          allow_session_resume?: boolean | null
          auto_disconnect?: boolean | null
          background_style?: string | null
          business_logo_url?: string | null
          business_name?: string | null
          created_at?: string
          default_payment_method?: string | null
          enable_https?: boolean | null
          enable_intasend?: boolean | null
          enable_mpesa_paybill?: boolean | null
          enable_mpesa_till?: boolean | null
          enable_paystack?: boolean | null
          enable_pesapal?: boolean | null
          id?: string
          intasend_pub_key?: string | null
          intasend_secret_key?: string | null
          mac_binding?: boolean | null
          org_id?: string | null
          paybill_number?: string | null
          paystack_pub_key?: string | null
          paystack_secret_key?: string | null
          pesapal_consumer_key?: string | null
          pesapal_consumer_secret?: string | null
          primary_color?: string | null
          support_phone?: string | null
          till_number?: string | null
          updated_at?: string
          user_id: string
          welcome_message?: string | null
        }
        Update: {
          account_number?: string | null
          allow_session_resume?: boolean | null
          auto_disconnect?: boolean | null
          background_style?: string | null
          business_logo_url?: string | null
          business_name?: string | null
          created_at?: string
          default_payment_method?: string | null
          enable_https?: boolean | null
          enable_intasend?: boolean | null
          enable_mpesa_paybill?: boolean | null
          enable_mpesa_till?: boolean | null
          enable_paystack?: boolean | null
          enable_pesapal?: boolean | null
          id?: string
          intasend_pub_key?: string | null
          intasend_secret_key?: string | null
          mac_binding?: boolean | null
          org_id?: string | null
          paybill_number?: string | null
          paystack_pub_key?: string | null
          paystack_secret_key?: string | null
          pesapal_consumer_key?: string | null
          pesapal_consumer_secret?: string | null
          primary_color?: string | null
          support_phone?: string | null
          till_number?: string | null
          updated_at?: string
          user_id?: string
          welcome_message?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "settings_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      vouchers: {
        Row: {
          code: string
          created_at: string
          expiry_date: string | null
          id: string
          org_id: string | null
          package_id: string | null
          package_name: string
          status: string
          user_id: string
        }
        Insert: {
          code: string
          created_at?: string
          expiry_date?: string | null
          id?: string
          org_id?: string | null
          package_id?: string | null
          package_name: string
          status?: string
          user_id: string
        }
        Update: {
          code?: string
          created_at?: string
          expiry_date?: string | null
          id?: string
          org_id?: string | null
          package_id?: string | null
          package_name?: string
          status?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "vouchers_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "vouchers_package_id_fkey"
            columns: ["package_id"]
            isOneToOne: false
            referencedRelation: "packages"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "super_admin" | "admin" | "operator" | "support"
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
    Enums: {
      app_role: ["super_admin", "admin", "operator", "support"],
    },
  },
} as const
