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
    PostgrestVersion: "14.18"
  }
  public: {
    Tables: {
      applications: {
        Row: {
          age: number | null
          applicant_name: string
          application_date: string
          application_id: string
          category: string
          created_at: string | null
          fee_date: string
          id: string
          is_active: boolean
          last_paid_date: string | null
          mobile_number: string | null
          plan_id: string | null
          updated_at: string | null
          weight: number | null
          whatsapp_number: string | null
          workout_time: string | null
        }
        Insert: {
          age?: number | null
          applicant_name: string
          application_date: string
          application_id: string
          category: string
          created_at?: string | null
          fee_date: string
          id?: string
          is_active?: boolean
          last_paid_date?: string | null
          mobile_number?: string | null
          plan_id?: string | null
          updated_at?: string | null
          weight?: number | null
          whatsapp_number?: string | null
          workout_time?: string | null
        }
        Update: {
          age?: number | null
          applicant_name?: string
          application_date?: string
          application_id?: string
          category?: string
          created_at?: string | null
          fee_date?: string
          id?: string
          is_active?: boolean
          last_paid_date?: string | null
          mobile_number?: string | null
          plan_id?: string | null
          updated_at?: string | null
          weight?: number | null
          whatsapp_number?: string | null
          workout_time?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "applications_plan_id_fkey"
            columns: ["plan_id"]
            isOneToOne: false
            referencedRelation: "plans"
            referencedColumns: ["id"]
          },
        ]
      }
      current_due: {
        Row: {
          application_id: string
          created_at: string | null
          due_date: string
          id: string
          last_reminder_sent_at: string | null
          reminder_sent_count: number
          updated_at: string | null
        }
        Insert: {
          application_id: string
          created_at?: string | null
          due_date: string
          id?: string
          last_reminder_sent_at?: string | null
          reminder_sent_count?: number
          updated_at?: string | null
        }
        Update: {
          application_id?: string
          created_at?: string | null
          due_date?: string
          id?: string
          last_reminder_sent_at?: string | null
          reminder_sent_count?: number
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "current_due_application_id_fkey"
            columns: ["application_id"]
            isOneToOne: true
            referencedRelation: "applications"
            referencedColumns: ["id"]
          },
        ]
      }
      payments: {
        Row: {
          amount: number
          application_id: string
          created_at: string | null
          created_by: string
          id: string
          paid_date: string
          plan_id: string
        }
        Insert: {
          amount: number
          application_id: string
          created_at?: string | null
          created_by: string
          id?: string
          paid_date: string
          plan_id: string
        }
        Update: {
          amount?: number
          application_id?: string
          created_at?: string | null
          created_by?: string
          id?: string
          paid_date?: string
          plan_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "payments_application_id_fkey"
            columns: ["application_id"]
            isOneToOne: false
            referencedRelation: "applications"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payments_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payments_plan_id_fkey"
            columns: ["plan_id"]
            isOneToOne: false
            referencedRelation: "plans"
            referencedColumns: ["id"]
          },
        ]
      }
      plans: {
        Row: {
          amount: number
          created_at: string | null
          duration_months: number
          id: string
          is_active: boolean | null
          name: string
          updated_at: string | null
        }
        Insert: {
          amount: number
          created_at?: string | null
          duration_months: number
          id?: string
          is_active?: boolean | null
          name: string
          updated_at?: string | null
        }
        Update: {
          amount?: number
          created_at?: string | null
          duration_months?: number
          id?: string
          is_active?: boolean | null
          name?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      users: {
        Row: {
          created_at: string | null
          id: string
          is_active: boolean
          join_date: string | null
          name: string
          role: string
          trainer_category: string | null
          updated_at: string | null
          username: string
        }
        Insert: {
          created_at?: string | null
          id: string
          is_active?: boolean
          join_date?: string | null
          name: string
          role: string
          trainer_category?: string | null
          updated_at?: string | null
          username: string
        }
        Update: {
          created_at?: string | null
          id?: string
          is_active?: boolean
          join_date?: string | null
          name?: string
          role?: string
          trainer_category?: string | null
          updated_at?: string | null
          username?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      app_user_role: { Args: never; Returns: string }
      can_see_application: { Args: { _app: string }; Returns: boolean }
      can_see_category: { Args: { _cat: string }; Returns: boolean }
      create_application: {
        Args: {
          _age: number
          _app_no: string
          _app_date: string
          _category: string
          _mobile: string
          _name: string
          _plan: string
          _weight: number
          _whatsapp: string
          _workout: string
        }
        Returns: {
          age: number | null
          applicant_name: string
          application_date: string
          application_id: string
          category: string
          created_at: string | null
          fee_date: string
          id: string
          is_active: boolean
          last_paid_date: string | null
          mobile_number: string | null
          plan_id: string | null
          updated_at: string | null
          weight: number | null
          whatsapp_number: string | null
          workout_time: string | null
        }
        SetofOptions: {
          from: "*"
          to: "applications"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      deactivate_application: { Args: { _app: string }; Returns: undefined }
      is_manager: { Args: never; Returns: boolean }
      mark_reminder_sent: { Args: { _app: string }; Returns: undefined }
      reactivate_application: {
        Args: { _app: string; _plan: string; _start: string }
        Returns: string
      }
      record_payment: {
        Args: {
          _amount: number
          _app: string
          _paid_date: string
          _plan: string
        }
        Returns: Json
      }
      update_application: {
        Args: {
          _age: number
          _app_no: string
          _category: string
          _id: string
          _mobile: string
          _name: string
          _weight: number
          _whatsapp: string
          _workout: string
        }
        Returns: undefined
      }
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
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
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
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
