import { createClient } from "@supabase/supabase-js";

const rawUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const rawAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!rawUrl || !rawAnonKey) {
  throw new Error(
    "Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY environment variables."
  );
}

export const supabaseUrl = rawUrl;
export const supabaseAnonKey = rawAnonKey;

type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          first_name: string | null;
          last_name: string | null;
          name: string;
          email: string;
          contact_number: string | null;
          department: string;
          role: string;
          student_or_employee_id: string;
          avatar_url: string | null;
          status: string;
          created_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["profiles"]["Row"]> & {
          id: string;
          name: string;
          email: string;
        };
        Update: Partial<Database["public"]["Tables"]["profiles"]["Row"]>;
        Relationships: [];
      };
      facilities: {
        Row: {
          id: string;
          name: string;
          code: string;
          description: string;
          location: string;
          building: string;
          floor: string;
          capacity: number;
          status: string;
          image: string;
          available_resources: string[];
          features: string[];
          operating_hours: string;
          contact_person: string;
          contact_email: string;
          guidelines: string[];
        };
        Insert: Partial<Database["public"]["Tables"]["facilities"]["Row"]> & {
          id: string;
          name: string;
          code: string;
        };
        Update: Partial<Database["public"]["Tables"]["facilities"]["Row"]>;
        Relationships: [];
      };
      resources: {
        Row: {
          id: string;
          name: string;
          category: string;
          facility_scope: string;
          total_quantity: number;
          available_quantity: number;
          condition: string;
          unit: string;
        };
        Insert: Partial<Database["public"]["Tables"]["resources"]["Row"]> & {
          id: string;
          name: string;
          category: string;
        };
        Update: Partial<Database["public"]["Tables"]["resources"]["Row"]>;
        Relationships: [];
      };
      reservations: {
        Row: {
          id: string;
          reservation_code: string;
          facility_id: string;
          user_id: string;
          event_name: string;
          purpose: string;
          date: string;
          start_time: string;
          end_time: string;
          expected_attendees: number;
          status: string;
          submitted_at: string;
          reviewed_at: string | null;
          reviewed_by: string | null;
          rejection_reason: string | null;
          admin_notes: string | null;
        };
        Insert: Partial<Database["public"]["Tables"]["reservations"]["Row"]> & {
          id: string;
          reservation_code: string;
          facility_id: string;
          user_id: string;
          event_name: string;
          date: string;
          start_time: string;
          end_time: string;
        };
        Update: Partial<Database["public"]["Tables"]["reservations"]["Row"]>;
        Relationships: [
          {
            foreignKeyName: "reservations_facility_id_fkey";
            columns: ["facility_id"];
            isOneToOne: false;
            referencedRelation: "facilities";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "reservations_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      requested_resources: {
        Row: {
          id: string;
          reservation_id: string;
          resource_id: string | null;
          name: string;
          quantity: number;
        };
        Insert: Partial<Database["public"]["Tables"]["requested_resources"]["Row"]> & {
          id: string;
          reservation_id: string;
          name: string;
        };
        Update: Partial<Database["public"]["Tables"]["requested_resources"]["Row"]>;
        Relationships: [
          {
            foreignKeyName: "requested_resources_reservation_id_fkey";
            columns: ["reservation_id"];
            isOneToOne: false;
            referencedRelation: "reservations";
            referencedColumns: ["id"];
          },
        ];
      };
      approval_logs: {
        Row: {
          id: string;
          reservation_id: string;
          reservation_code: string;
          event_name: string;
          facility_name: string;
          actor_name: string;
          actor_role: string;
          action: string;
          timestamp: string;
          notes: string;
        };
        Insert: Partial<Database["public"]["Tables"]["approval_logs"]["Row"]> & {
          id: string;
          reservation_id: string;
          action: string;
        };
        Update: Partial<Database["public"]["Tables"]["approval_logs"]["Row"]>;
        Relationships: [];
      };
      notifications: {
        Row: {
          id: string;
          user_id: string | null;
          target_role: string | null;
          title: string;
          message: string;
          type: string;
          timestamp: string;
          read: boolean;
          reservation_id: string | null;
        };
        Insert: Partial<Database["public"]["Tables"]["notifications"]["Row"]> & {
          id: string;
          title: string;
          type: string;
        };
        Update: Partial<Database["public"]["Tables"]["notifications"]["Row"]>;
        Relationships: [];
      };
      notification_reads: {
        Row: {
          notification_id: string;
          user_id: string;
          read_at: string;
          dismissed?: boolean;
        };
        Insert: {
          notification_id: string;
          user_id: string;
          read_at?: string;
          dismissed?: boolean;
        };
        Update: {
          notification_id?: string;
          user_id?: string;
          read_at?: string;
          dismissed?: boolean;
        };
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: {
      get_facility_schedule: {
        Args: Record<string, never>;
        Returns: Array<{
          id: string;
          facility_id: string;
          facility_name: string;
          event_name: string;
          user_name: string;
          user_role: string;
          date: string;
          start_time: string;
          end_time: string;
          status: string;
          is_owner: boolean;
        }>;
      };
      create_reservation_tx: {
        Args: {
          p_id: string;
          p_reservation_code: string;
          p_facility_id: string;
          p_event_name: string;
          p_purpose: string;
          p_date: string;
          p_start_time: string;
          p_end_time: string;
          p_expected_attendees: number;
          p_submitted_at: string;
          p_facility_name: string;
          p_resources: Json;
          p_log_id: string;
          p_user_notif_id: string;
          p_admin_notif_id: string;
        };
        Returns: undefined;
      };
      approve_reservation_tx: {
        Args: {
          p_reservation_id: string;
          p_reviewed_at: string;
          p_admin_notes: string;
          p_log_id: string;
          p_notif_id: string;
        };
        Returns: undefined;
      };
      reject_reservation_tx: {
        Args: {
          p_reservation_id: string;
          p_reviewed_at: string;
          p_rejection_reason: string;
          p_log_id: string;
          p_notif_id: string;
        };
        Returns: undefined;
      };
      update_reservation_tx: {
        Args: {
          p_reservation_id: string;
          p_facility_id: string;
          p_facility_name: string;
          p_event_name: string;
          p_purpose: string;
          p_date: string;
          p_start_time: string;
          p_end_time: string;
          p_expected_attendees: number;
          p_resources: Json;
          p_log_id: string;
          p_log_notes: string;
        };
        Returns: undefined;
      };
      delete_reservation_tx: {
        Args: {
          p_reservation_id: string;
          p_log_id: string | null;
        };
        Returns: undefined;
      };
      admin_update_user_access_tx: {
        Args: {
          p_target_user_id: string;
          p_next_role: string | null;
          p_next_status: string | null;
          p_log_id: string;
          p_notif_id: string | null;
        };
        Returns: undefined;
      };
      admin_update_facility_tx: {
        Args: {
          p_facility_id: string;
          p_updates: Json;
          p_action: string;
          p_log_id: string;
          p_notif_id: string | null;
        };
        Returns: undefined;
      };
      delete_resource_tx: {
        Args: {
          p_resource_id: string;
          p_log_id: string;
        };
        Returns: undefined;
      };
      create_resource_tx: {
        Args: {
          p_id: string;
          p_name: string;
          p_category: string;
          p_facility_scope: string;
          p_total_quantity: number;
          p_available_quantity: number;
          p_condition: string;
          p_unit: string;
          p_log_id: string;
        };
        Returns: undefined;
      };
    };
  };
}

export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey);

/** Ephemeral non-persisting client used for re-verifying credentials without mutating active session state. */
export function createEphemeralSupabaseClient() {
  return createClient<Database>(supabaseUrl, supabaseAnonKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });
}
