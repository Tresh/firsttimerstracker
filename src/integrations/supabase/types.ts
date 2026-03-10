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
      activity_flags: {
        Row: {
          created_at: string | null
          description: string | null
          flag_type: string
          flagged_user_id: string | null
          id: string
          resolved: boolean | null
          resolved_at: string | null
          resolved_by: string | null
          severity: string | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          flag_type: string
          flagged_user_id?: string | null
          id?: string
          resolved?: boolean | null
          resolved_at?: string | null
          resolved_by?: string | null
          severity?: string | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          flag_type?: string
          flagged_user_id?: string | null
          id?: string
          resolved?: boolean | null
          resolved_at?: string | null
          resolved_by?: string | null
          severity?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "activity_flags_flagged_user_id_fkey"
            columns: ["flagged_user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "activity_flags_resolved_by_fkey"
            columns: ["resolved_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      activity_log: {
        Row: {
          action_type: string
          created_at: string | null
          flag_reason: string | null
          id: string
          is_flagged: boolean | null
          metadata: Json | null
          reference_id: string | null
          reference_table: string | null
          user_id: string | null
        }
        Insert: {
          action_type: string
          created_at?: string | null
          flag_reason?: string | null
          id?: string
          is_flagged?: boolean | null
          metadata?: Json | null
          reference_id?: string | null
          reference_table?: string | null
          user_id?: string | null
        }
        Update: {
          action_type?: string
          created_at?: string | null
          flag_reason?: string | null
          id?: string
          is_flagged?: boolean | null
          metadata?: Json | null
          reference_id?: string | null
          reference_table?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "activity_log_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
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
      buddy_assignments: {
        Row: {
          active: boolean | null
          assigned_at: string | null
          assigned_by: string | null
          buddy_member_id: string
          first_timer_id: string
          id: string
        }
        Insert: {
          active?: boolean | null
          assigned_at?: string | null
          assigned_by?: string | null
          buddy_member_id: string
          first_timer_id: string
          id?: string
        }
        Update: {
          active?: boolean | null
          assigned_at?: string | null
          assigned_by?: string | null
          buddy_member_id?: string
          first_timer_id?: string
          id?: string
        }
        Relationships: [
          {
            foreignKeyName: "buddy_assignments_assigned_by_fkey"
            columns: ["assigned_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "buddy_assignments_buddy_member_id_fkey"
            columns: ["buddy_member_id"]
            isOneToOne: false
            referencedRelation: "members"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "buddy_assignments_first_timer_id_fkey"
            columns: ["first_timer_id"]
            isOneToOne: true
            referencedRelation: "members"
            referencedColumns: ["id"]
          },
        ]
      }
      call_campaigns: {
        Row: {
          campaign_type: string
          created_at: string | null
          created_by: string | null
          end_date: string | null
          id: string
          message_script: string | null
          objective: string
          organization_id: string | null
          priority: string | null
          start_date: string | null
          status: string | null
          target_type: string
          title: string
          updated_at: string | null
        }
        Insert: {
          campaign_type: string
          created_at?: string | null
          created_by?: string | null
          end_date?: string | null
          id?: string
          message_script?: string | null
          objective: string
          organization_id?: string | null
          priority?: string | null
          start_date?: string | null
          status?: string | null
          target_type: string
          title: string
          updated_at?: string | null
        }
        Update: {
          campaign_type?: string
          created_at?: string | null
          created_by?: string | null
          end_date?: string | null
          id?: string
          message_script?: string | null
          objective?: string
          organization_id?: string | null
          priority?: string | null
          start_date?: string | null
          status?: string | null
          target_type?: string
          title?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "call_campaigns_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "call_campaigns_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      call_logs: {
        Row: {
          call_timestamp: string | null
          caller_id: string
          created_at: string | null
          duration_seconds: number | null
          id: string
          member_id: string
          note: string | null
          outcome: string | null
          phone_number: string
          task_id: string | null
        }
        Insert: {
          call_timestamp?: string | null
          caller_id: string
          created_at?: string | null
          duration_seconds?: number | null
          id?: string
          member_id: string
          note?: string | null
          outcome?: string | null
          phone_number: string
          task_id?: string | null
        }
        Update: {
          call_timestamp?: string | null
          caller_id?: string
          created_at?: string | null
          duration_seconds?: number | null
          id?: string
          member_id?: string
          note?: string | null
          outcome?: string | null
          phone_number?: string
          task_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "call_logs_caller_id_fkey"
            columns: ["caller_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "call_logs_member_id_fkey"
            columns: ["member_id"]
            isOneToOne: false
            referencedRelation: "members"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "call_logs_task_id_fkey"
            columns: ["task_id"]
            isOneToOne: false
            referencedRelation: "follow_up_tasks"
            referencedColumns: ["id"]
          },
        ]
      }
      campaign_assignments: {
        Row: {
          assigned_at: string | null
          campaign_id: string | null
          id: string
          member_id: string | null
          notes: string | null
          priority_order: number | null
          rep_id: string | null
          status: string | null
        }
        Insert: {
          assigned_at?: string | null
          campaign_id?: string | null
          id?: string
          member_id?: string | null
          notes?: string | null
          priority_order?: number | null
          rep_id?: string | null
          status?: string | null
        }
        Update: {
          assigned_at?: string | null
          campaign_id?: string | null
          id?: string
          member_id?: string | null
          notes?: string | null
          priority_order?: number | null
          rep_id?: string | null
          status?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "campaign_assignments_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "call_campaigns"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "campaign_assignments_member_id_fkey"
            columns: ["member_id"]
            isOneToOne: false
            referencedRelation: "members"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "campaign_assignments_rep_id_fkey"
            columns: ["rep_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      campaign_call_logs: {
        Row: {
          assignment_id: string | null
          auto_detected_outcome: string | null
          call_end: string | null
          call_start: string | null
          campaign_id: string | null
          contact_method: string | null
          created_at: string | null
          duration_seconds: number | null
          id: string
          member_id: string | null
          outcome: string | null
          phone_number: string | null
          rep_id: string | null
          rep_note: string | null
        }
        Insert: {
          assignment_id?: string | null
          auto_detected_outcome?: string | null
          call_end?: string | null
          call_start?: string | null
          campaign_id?: string | null
          contact_method?: string | null
          created_at?: string | null
          duration_seconds?: number | null
          id?: string
          member_id?: string | null
          outcome?: string | null
          phone_number?: string | null
          rep_id?: string | null
          rep_note?: string | null
        }
        Update: {
          assignment_id?: string | null
          auto_detected_outcome?: string | null
          call_end?: string | null
          call_start?: string | null
          campaign_id?: string | null
          contact_method?: string | null
          created_at?: string | null
          duration_seconds?: number | null
          id?: string
          member_id?: string | null
          outcome?: string | null
          phone_number?: string | null
          rep_id?: string | null
          rep_note?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "campaign_call_logs_assignment_id_fkey"
            columns: ["assignment_id"]
            isOneToOne: false
            referencedRelation: "campaign_assignments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "campaign_call_logs_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "call_campaigns"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "campaign_call_logs_member_id_fkey"
            columns: ["member_id"]
            isOneToOne: false
            referencedRelation: "members"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "campaign_call_logs_rep_id_fkey"
            columns: ["rep_id"]
            isOneToOne: false
            referencedRelation: "profiles"
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
          assigned_role: string
          assigned_to: string | null
          call_attempted: boolean | null
          call_duration_seconds: number | null
          call_note: string | null
          call_outcome: string | null
          call_timestamp: string | null
          completed_at: string | null
          completed_by: string | null
          created_at: string | null
          due_date: string | null
          id: string
          is_manual_override: boolean | null
          is_urgent: boolean | null
          member_id: string
          notes: string | null
          override_reason: string | null
          proof_id: string | null
          proof_required: boolean | null
          rejected_at: string | null
          rejected_by: string | null
          rejection_note: string | null
          status: string
          task_category: string
          task_emoji: string | null
          task_key: string
          task_name: string
          updated_at: string | null
          urgent_hours: number | null
          verified_at: string | null
          verified_by: string | null
          week_number: number
        }
        Insert: {
          assigned_role: string
          assigned_to?: string | null
          call_attempted?: boolean | null
          call_duration_seconds?: number | null
          call_note?: string | null
          call_outcome?: string | null
          call_timestamp?: string | null
          completed_at?: string | null
          completed_by?: string | null
          created_at?: string | null
          due_date?: string | null
          id?: string
          is_manual_override?: boolean | null
          is_urgent?: boolean | null
          member_id: string
          notes?: string | null
          override_reason?: string | null
          proof_id?: string | null
          proof_required?: boolean | null
          rejected_at?: string | null
          rejected_by?: string | null
          rejection_note?: string | null
          status?: string
          task_category: string
          task_emoji?: string | null
          task_key: string
          task_name: string
          updated_at?: string | null
          urgent_hours?: number | null
          verified_at?: string | null
          verified_by?: string | null
          week_number: number
        }
        Update: {
          assigned_role?: string
          assigned_to?: string | null
          call_attempted?: boolean | null
          call_duration_seconds?: number | null
          call_note?: string | null
          call_outcome?: string | null
          call_timestamp?: string | null
          completed_at?: string | null
          completed_by?: string | null
          created_at?: string | null
          due_date?: string | null
          id?: string
          is_manual_override?: boolean | null
          is_urgent?: boolean | null
          member_id?: string
          notes?: string | null
          override_reason?: string | null
          proof_id?: string | null
          proof_required?: boolean | null
          rejected_at?: string | null
          rejected_by?: string | null
          rejection_note?: string | null
          status?: string
          task_category?: string
          task_emoji?: string | null
          task_key?: string
          task_name?: string
          updated_at?: string | null
          urgent_hours?: number | null
          verified_at?: string | null
          verified_by?: string | null
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
            foreignKeyName: "follow_up_tasks_completed_by_fkey"
            columns: ["completed_by"]
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
          {
            foreignKeyName: "follow_up_tasks_proof_id_fkey"
            columns: ["proof_id"]
            isOneToOne: false
            referencedRelation: "task_proof"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "follow_up_tasks_rejected_by_fkey"
            columns: ["rejected_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "follow_up_tasks_verified_by_fkey"
            columns: ["verified_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      foundation_school_attendance: {
        Row: {
          attended: boolean | null
          class_id: string | null
          id: string
          is_manual_override: boolean | null
          marked_at: string | null
          marked_by: string | null
          member_id: string | null
          notes: string | null
          qr_session_id: string | null
          scan_verified: boolean | null
        }
        Insert: {
          attended?: boolean | null
          class_id?: string | null
          id?: string
          is_manual_override?: boolean | null
          marked_at?: string | null
          marked_by?: string | null
          member_id?: string | null
          notes?: string | null
          qr_session_id?: string | null
          scan_verified?: boolean | null
        }
        Update: {
          attended?: boolean | null
          class_id?: string | null
          id?: string
          is_manual_override?: boolean | null
          marked_at?: string | null
          marked_by?: string | null
          member_id?: string | null
          notes?: string | null
          qr_session_id?: string | null
          scan_verified?: boolean | null
        }
        Relationships: [
          {
            foreignKeyName: "foundation_school_attendance_class_id_fkey"
            columns: ["class_id"]
            isOneToOne: false
            referencedRelation: "foundation_school_classes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "foundation_school_attendance_marked_by_fkey"
            columns: ["marked_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "foundation_school_attendance_member_id_fkey"
            columns: ["member_id"]
            isOneToOne: false
            referencedRelation: "members"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "foundation_school_attendance_qr_session_id_fkey"
            columns: ["qr_session_id"]
            isOneToOne: false
            referencedRelation: "fs_qr_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      foundation_school_classes: {
        Row: {
          class_code: string
          class_description: string | null
          class_number: number
          class_title: string
          created_at: string | null
          facilitator_id: string | null
          id: string
          is_exam: boolean | null
          organization_id: string | null
          scheduled_day: string | null
          scheduled_time: string | null
        }
        Insert: {
          class_code: string
          class_description?: string | null
          class_number: number
          class_title: string
          created_at?: string | null
          facilitator_id?: string | null
          id?: string
          is_exam?: boolean | null
          organization_id?: string | null
          scheduled_day?: string | null
          scheduled_time?: string | null
        }
        Update: {
          class_code?: string
          class_description?: string | null
          class_number?: number
          class_title?: string
          created_at?: string | null
          facilitator_id?: string | null
          id?: string
          is_exam?: boolean | null
          organization_id?: string | null
          scheduled_day?: string | null
          scheduled_time?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "foundation_school_classes_facilitator_id_fkey"
            columns: ["facilitator_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "foundation_school_classes_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      fs_qr_scans: {
        Row: {
          id: string
          ip_address: string | null
          member_id: string | null
          scanned_at: string | null
          session_id: string | null
          user_agent: string | null
        }
        Insert: {
          id?: string
          ip_address?: string | null
          member_id?: string | null
          scanned_at?: string | null
          session_id?: string | null
          user_agent?: string | null
        }
        Update: {
          id?: string
          ip_address?: string | null
          member_id?: string | null
          scanned_at?: string | null
          session_id?: string | null
          user_agent?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "fs_qr_scans_member_id_fkey"
            columns: ["member_id"]
            isOneToOne: false
            referencedRelation: "members"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fs_qr_scans_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "fs_qr_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      fs_qr_sessions: {
        Row: {
          class_id: string | null
          closed_at: string | null
          created_at: string | null
          generated_by: string | null
          id: string
          is_active: boolean | null
          opened_at: string | null
          organization_id: string | null
          qr_code: string
          scan_count: number | null
        }
        Insert: {
          class_id?: string | null
          closed_at?: string | null
          created_at?: string | null
          generated_by?: string | null
          id?: string
          is_active?: boolean | null
          opened_at?: string | null
          organization_id?: string | null
          qr_code: string
          scan_count?: number | null
        }
        Update: {
          class_id?: string | null
          closed_at?: string | null
          created_at?: string | null
          generated_by?: string | null
          id?: string
          is_active?: boolean | null
          opened_at?: string | null
          organization_id?: string | null
          qr_code?: string
          scan_count?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "fs_qr_sessions_class_id_fkey"
            columns: ["class_id"]
            isOneToOne: false
            referencedRelation: "foundation_school_classes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fs_qr_sessions_generated_by_fkey"
            columns: ["generated_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fs_qr_sessions_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
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
          birthday: string | null
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
          fs_classes_completed: number | null
          fs_enrolled: boolean | null
          fs_enrolled_date: string | null
          fs_exam_passed: boolean | null
          fs_exam_score: number | null
          fs_graduated: boolean | null
          fs_graduation_date: string | null
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
          birthday?: string | null
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
          fs_classes_completed?: number | null
          fs_enrolled?: boolean | null
          fs_enrolled_date?: string | null
          fs_exam_passed?: boolean | null
          fs_exam_score?: number | null
          fs_graduated?: boolean | null
          fs_graduation_date?: string | null
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
          birthday?: string | null
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
          fs_classes_completed?: number | null
          fs_enrolled?: boolean | null
          fs_enrolled_date?: string | null
          fs_exam_passed?: boolean | null
          fs_exam_score?: number | null
          fs_graduated?: boolean | null
          fs_graduation_date?: string | null
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
          must_change_password: boolean | null
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
          must_change_password?: boolean | null
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
          must_change_password?: boolean | null
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
      service_attendance: {
        Row: {
          id: string
          is_first_timer: boolean | null
          is_manual_override: boolean | null
          member_id: string | null
          scan_method: string | null
          scanned_at: string | null
          scanned_by: string | null
          service_id: string | null
        }
        Insert: {
          id?: string
          is_first_timer?: boolean | null
          is_manual_override?: boolean | null
          member_id?: string | null
          scan_method?: string | null
          scanned_at?: string | null
          scanned_by?: string | null
          service_id?: string | null
        }
        Update: {
          id?: string
          is_first_timer?: boolean | null
          is_manual_override?: boolean | null
          member_id?: string | null
          scan_method?: string | null
          scanned_at?: string | null
          scanned_by?: string | null
          service_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "service_attendance_member_id_fkey"
            columns: ["member_id"]
            isOneToOne: false
            referencedRelation: "members"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "service_attendance_scanned_by_fkey"
            columns: ["scanned_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "service_attendance_service_id_fkey"
            columns: ["service_id"]
            isOneToOne: false
            referencedRelation: "services"
            referencedColumns: ["id"]
          },
        ]
      }
      services: {
        Row: {
          actual_attendance: number | null
          created_at: string | null
          created_by: string | null
          expected_attendance: number | null
          id: string
          organization_id: string
          qr_active: boolean | null
          qr_closed_at: string | null
          qr_code: string
          qr_opened_at: string | null
          service_date: string
          service_name: string | null
          service_time: string | null
          service_type: string
          title: string | null
          valid_from: string
          valid_until: string
        }
        Insert: {
          actual_attendance?: number | null
          created_at?: string | null
          created_by?: string | null
          expected_attendance?: number | null
          id?: string
          organization_id: string
          qr_active?: boolean | null
          qr_closed_at?: string | null
          qr_code?: string
          qr_opened_at?: string | null
          service_date: string
          service_name?: string | null
          service_time?: string | null
          service_type?: string
          title?: string | null
          valid_from: string
          valid_until: string
        }
        Update: {
          actual_attendance?: number | null
          created_at?: string | null
          created_by?: string | null
          expected_attendance?: number | null
          id?: string
          organization_id?: string
          qr_active?: boolean | null
          qr_closed_at?: string | null
          qr_code?: string
          qr_opened_at?: string | null
          service_date?: string
          service_name?: string | null
          service_time?: string | null
          service_type?: string
          title?: string | null
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
      task_proof: {
        Row: {
          created_at: string | null
          gps_accuracy: number | null
          id: string
          is_manual_override: boolean | null
          latitude: number | null
          longitude: number | null
          override_reason: string | null
          photo_url: string | null
          proof_type: string | null
          task_id: string | null
          timestamp_taken: string | null
          uploaded_by: string | null
        }
        Insert: {
          created_at?: string | null
          gps_accuracy?: number | null
          id?: string
          is_manual_override?: boolean | null
          latitude?: number | null
          longitude?: number | null
          override_reason?: string | null
          photo_url?: string | null
          proof_type?: string | null
          task_id?: string | null
          timestamp_taken?: string | null
          uploaded_by?: string | null
        }
        Update: {
          created_at?: string | null
          gps_accuracy?: number | null
          id?: string
          is_manual_override?: boolean | null
          latitude?: number | null
          longitude?: number | null
          override_reason?: string | null
          photo_url?: string | null
          proof_type?: string | null
          task_id?: string | null
          timestamp_taken?: string | null
          uploaded_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "task_proof_task_id_fkey"
            columns: ["task_id"]
            isOneToOne: false
            referencedRelation: "follow_up_tasks"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "task_proof_uploaded_by_fkey"
            columns: ["uploaded_by"]
            isOneToOne: false
            referencedRelation: "profiles"
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
      create_followup_tasks: {
        Args: { _member_id: string; _registration_date?: string }
        Returns: undefined
      }
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
