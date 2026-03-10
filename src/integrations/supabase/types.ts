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
      attendance: {
        Row: {
          created_at: string | null
          id: string
          is_first_timer: boolean | null
          logged_by: string | null
          member_id: string | null
          phone_number: string | null
          scan_method: string
          scanned_at: string | null
          service_id: string
          verified: boolean | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          is_first_timer?: boolean | null
          logged_by?: string | null
          member_id?: string | null
          phone_number?: string | null
          scan_method?: string
          scanned_at?: string | null
          service_id: string
          verified?: boolean | null
        }
        Update: {
          created_at?: string | null
          id?: string
          is_first_timer?: boolean | null
          logged_by?: string | null
          member_id?: string | null
          phone_number?: string | null
          scan_method?: string
          scanned_at?: string | null
          service_id?: string
          verified?: boolean | null
        }
        Relationships: [
          {
            foreignKeyName: "attendance_logged_by_fkey"
            columns: ["logged_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "attendance_member_id_fkey"
            columns: ["member_id"]
            isOneToOne: false
            referencedRelation: "members"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "attendance_service_id_fkey"
            columns: ["service_id"]
            isOneToOne: false
            referencedRelation: "services"
            referencedColumns: ["id"]
          },
        ]
      }
      cell_groups: {
        Row: {
          created_at: string | null
          id: string
          leader_id: string | null
          location: string | null
          name: string
          organization_id: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          leader_id?: string | null
          location?: string | null
          name: string
          organization_id?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          leader_id?: string | null
          location?: string | null
          name?: string
          organization_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "cell_groups_leader_id_fkey"
            columns: ["leader_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cell_groups_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      departments: {
        Row: {
          created_at: string | null
          id: string
          leader_id: string | null
          name: string
          organization_id: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          leader_id?: string | null
          name: string
          organization_id?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          leader_id?: string | null
          name?: string
          organization_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "departments_leader_id_fkey"
            columns: ["leader_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "departments_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      emp_attendance: {
        Row: {
          created_at: string | null
          emp_display_name: string
          id: string
          match_method: string | null
          matched: boolean | null
          member_id: string | null
          session_id: string
        }
        Insert: {
          created_at?: string | null
          emp_display_name: string
          id?: string
          match_method?: string | null
          matched?: boolean | null
          member_id?: string | null
          session_id: string
        }
        Update: {
          created_at?: string | null
          emp_display_name?: string
          id?: string
          match_method?: string | null
          matched?: boolean | null
          member_id?: string | null
          session_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "emp_attendance_member_id_fkey"
            columns: ["member_id"]
            isOneToOne: false
            referencedRelation: "members"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "emp_attendance_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "emp_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      emp_sessions: {
        Row: {
          created_at: string | null
          id: string
          imported_by: string | null
          matched_count: number | null
          raw_csv: string | null
          session_date: string
          total_count: number | null
          unmatched_count: number | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          imported_by?: string | null
          matched_count?: number | null
          raw_csv?: string | null
          session_date: string
          total_count?: number | null
          unmatched_count?: number | null
        }
        Update: {
          created_at?: string | null
          id?: string
          imported_by?: string | null
          matched_count?: number | null
          raw_csv?: string | null
          session_date?: string
          total_count?: number | null
          unmatched_count?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "emp_sessions_imported_by_fkey"
            columns: ["imported_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      follow_up_tasks: {
        Row: {
          action_name: string
          assigned_to: string | null
          completed: boolean | null
          completed_at: string | null
          created_at: string | null
          due_date: string | null
          id: string
          member_id: string
          week_number: number
        }
        Insert: {
          action_name: string
          assigned_to?: string | null
          completed?: boolean | null
          completed_at?: string | null
          created_at?: string | null
          due_date?: string | null
          id?: string
          member_id: string
          week_number: number
        }
        Update: {
          action_name?: string
          assigned_to?: string | null
          completed?: boolean | null
          completed_at?: string | null
          created_at?: string | null
          due_date?: string | null
          id?: string
          member_id?: string
          week_number?: number
        }
        Relationships: [
          {
            foreignKeyName: "follow_up_tasks_assigned_to_fkey"
            columns: ["assigned_to"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "follow_up_tasks_member_id_fkey"
            columns: ["member_id"]
            isOneToOne: false
            referencedRelation: "members"
            referencedColumns: ["id"]
          },
        ]
      }
      members: {
        Row: {
          address: string | null
          age_range: string | null
          assigned_cell_group: string | null
          assigned_follow_up_leader: string | null
          baptism_date: string | null
          baptism_status: Database["public"]["Enums"]["baptism_status"] | null
          created_at: string | null
          date_of_first_visit: string
          department_joined: string | null
          email: string | null
          emp_display_name: string | null
          foundation_school_end: string | null
          foundation_school_start: string | null
          foundation_school_status:
            | Database["public"]["Enums"]["foundation_school_status"]
            | null
          full_name: string
          gender: string | null
          group_assigned: string | null
          id: string
          invited_by: string | null
          invited_by_name: string | null
          kingschat_name: string | null
          kingschat_phone: string | null
          location: string | null
          organization_id: string | null
          phone_number: string | null
          prefix: Database["public"]["Enums"]["member_prefix"] | null
          registered_by: string | null
          service_attended: Database["public"]["Enums"]["service_type"]
          status: Database["public"]["Enums"]["member_status"]
          updated_at: string | null
        }
        Insert: {
          address?: string | null
          age_range?: string | null
          assigned_cell_group?: string | null
          assigned_follow_up_leader?: string | null
          baptism_date?: string | null
          baptism_status?: Database["public"]["Enums"]["baptism_status"] | null
          created_at?: string | null
          date_of_first_visit: string
          department_joined?: string | null
          email?: string | null
          emp_display_name?: string | null
          foundation_school_end?: string | null
          foundation_school_start?: string | null
          foundation_school_status?:
            | Database["public"]["Enums"]["foundation_school_status"]
            | null
          full_name: string
          gender?: string | null
          group_assigned?: string | null
          id?: string
          invited_by?: string | null
          invited_by_name?: string | null
          kingschat_name?: string | null
          kingschat_phone?: string | null
          location?: string | null
          organization_id?: string | null
          phone_number?: string | null
          prefix?: Database["public"]["Enums"]["member_prefix"] | null
          registered_by?: string | null
          service_attended: Database["public"]["Enums"]["service_type"]
          status?: Database["public"]["Enums"]["member_status"]
          updated_at?: string | null
        }
        Update: {
          address?: string | null
          age_range?: string | null
          assigned_cell_group?: string | null
          assigned_follow_up_leader?: string | null
          baptism_date?: string | null
          baptism_status?: Database["public"]["Enums"]["baptism_status"] | null
          created_at?: string | null
          date_of_first_visit?: string
          department_joined?: string | null
          email?: string | null
          emp_display_name?: string | null
          foundation_school_end?: string | null
          foundation_school_start?: string | null
          foundation_school_status?:
            | Database["public"]["Enums"]["foundation_school_status"]
            | null
          full_name?: string
          gender?: string | null
          group_assigned?: string | null
          id?: string
          invited_by?: string | null
          invited_by_name?: string | null
          kingschat_name?: string | null
          kingschat_phone?: string | null
          location?: string | null
          organization_id?: string | null
          phone_number?: string | null
          prefix?: Database["public"]["Enums"]["member_prefix"] | null
          registered_by?: string | null
          service_attended?: Database["public"]["Enums"]["service_type"]
          status?: Database["public"]["Enums"]["member_status"]
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "members_assigned_cell_group_fkey"
            columns: ["assigned_cell_group"]
            isOneToOne: false
            referencedRelation: "cell_groups"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "members_assigned_follow_up_leader_fkey"
            columns: ["assigned_follow_up_leader"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "members_department_joined_fkey"
            columns: ["department_joined"]
            isOneToOne: false
            referencedRelation: "departments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "members_invited_by_fkey"
            columns: ["invited_by"]
            isOneToOne: false
            referencedRelation: "members"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "members_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "members_registered_by_fkey"
            columns: ["registered_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      notifications: {
        Row: {
          created_at: string | null
          id: string
          message: string
          read: boolean | null
          title: string
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          message: string
          read?: boolean | null
          title: string
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          message?: string
          read?: boolean | null
          title?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "notifications_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      organizations: {
        Row: {
          created_at: string | null
          id: string
          level: Database["public"]["Enums"]["org_level"]
          name: string
          parent_id: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          level: Database["public"]["Enums"]["org_level"]
          name: string
          parent_id?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          level?: Database["public"]["Enums"]["org_level"]
          name?: string
          parent_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "organizations_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string | null
          full_name: string
          id: string
          organization_id: string | null
          phone_number: string | null
          role_title: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string | null
          full_name: string
          id?: string
          organization_id?: string | null
          phone_number?: string | null
          role_title?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string | null
          full_name?: string
          id?: string
          organization_id?: string | null
          phone_number?: string | null
          role_title?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "profiles_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      services: {
        Row: {
          created_at: string | null
          created_by: string | null
          id: string
          organization_id: string
          qr_code: string
          service_date: string
          service_name: string | null
          service_type: string
          valid_from: string
          valid_until: string
        }
        Insert: {
          created_at?: string | null
          created_by?: string | null
          id?: string
          organization_id: string
          qr_code?: string
          service_date: string
          service_name?: string | null
          service_type?: string
          valid_from: string
          valid_until: string
        }
        Update: {
          created_at?: string | null
          created_by?: string | null
          id?: string
          organization_id?: string
          qr_code?: string
          service_date?: string
          service_name?: string | null
          service_type?: string
          valid_from?: string
          valid_until?: string
        }
        Relationships: [
          {
            foreignKeyName: "services_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "services_organization_id_fkey"
            columns: ["organization_id"]
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
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
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
      member_completeness: {
        Args: { member_row: Database["public"]["Tables"]["members"]["Row"] }
        Returns: number
      }
    }
    Enums: {
      app_role:
        | "admin"
        | "pastor"
        | "cell_leader"
        | "follow_up_team"
        | "king_admin"
        | "erediauwa_admin"
        | "loveworldcity_admin"
        | "youth_teens_admin"
        | "church_pastor"
        | "reception_team"
        | "department_head"
        | "foundation_school_staff"
        | "foundation_school_leader"
        | "department_staff"
      baptism_status: "Not Baptized" | "Baptized"
      foundation_school_status: "Not Started" | "In Progress" | "Completed"
      member_prefix:
        | "Brother"
        | "Sister"
        | "Pastor"
        | "Deacon"
        | "Deaconess"
        | "Evang"
        | "Dr"
        | "Prof"
      member_status:
        | "First Timer"
        | "Second Timer"
        | "New Convert"
        | "Member"
        | "Worker"
      org_level: "group" | "church"
      service_type:
        | "Sunday Service"
        | "Midweek Service"
        | "Cell Meeting"
        | "Special Program"
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
      app_role: [
        "admin",
        "pastor",
        "cell_leader",
        "follow_up_team",
        "king_admin",
        "erediauwa_admin",
        "loveworldcity_admin",
        "youth_teens_admin",
        "church_pastor",
        "reception_team",
        "department_head",
        "foundation_school_staff",
        "foundation_school_leader",
        "department_staff",
      ],
      baptism_status: ["Not Baptized", "Baptized"],
      foundation_school_status: ["Not Started", "In Progress", "Completed"],
      member_prefix: [
        "Brother",
        "Sister",
        "Pastor",
        "Deacon",
        "Deaconess",
        "Evang",
        "Dr",
        "Prof",
      ],
      member_status: [
        "First Timer",
        "Second Timer",
        "New Convert",
        "Member",
        "Worker",
      ],
      org_level: ["group", "church"],
      service_type: [
        "Sunday Service",
        "Midweek Service",
        "Cell Meeting",
        "Special Program",
      ],
    },
  },
} as const
