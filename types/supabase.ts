export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          first_name: string | null
          last_name: string | null
          name: string
          email: string
          contact_number: string | null
          department: string
          role: "STUDENT" | "FACULTY" | "ADMINISTRATOR"
          student_or_employee_id: string
          avatar_url: string | null
          status: "ACTIVE" | "DEACTIVATED"
          created_at: string
        }
        Insert: {
          id: string
          first_name?: string | null
          last_name?: string | null
          name: string
          email: string
          contact_number?: string | null
          department?: string
          role?: "STUDENT" | "FACULTY" | "ADMINISTRATOR"
          student_or_employee_id?: string
          avatar_url?: string | null
          status?: "ACTIVE" | "DEACTIVATED"
          created_at?: string
        }
        Update: {
          id?: string
          first_name?: string | null
          last_name?: string | null
          name?: string
          email?: string
          contact_number?: string | null
          department?: string
          role?: "STUDENT" | "FACULTY" | "ADMINISTRATOR"
          student_or_employee_id?: string
          avatar_url?: string | null
          status?: "ACTIVE" | "DEACTIVATED"
          created_at?: string
        }
      }
      facilities: {
        Row: {
          id: string
          name: string
          code: string
          description: string
          location: string
          building: string
          floor: string
          capacity: number
          status: "AVAILABLE" | "MAINTENANCE" | "BOOKED"
          image: string
          available_resources: string[]
          features: string[]
          operating_hours: string
          contact_person: string
          contact_email: string
          guidelines: string[]
        }
        Insert: {
          id: string
          name: string
          code: string
          description?: string
          location?: string
          building?: string
          floor?: string
          capacity?: number
          status?: "AVAILABLE" | "MAINTENANCE" | "BOOKED"
          image?: string
          available_resources?: string[]
          features?: string[]
          operating_hours?: string
          contact_person?: string
          contact_email?: string
          guidelines?: string[]
        }
        Update: {
          id?: string
          name?: string
          code?: string
          description?: string
          location?: string
          building?: string
          floor?: string
          capacity?: number
          status?: "AVAILABLE" | "MAINTENANCE" | "BOOKED"
          image?: string
          available_resources?: string[]
          features?: string[]
          operating_hours?: string
          contact_person?: string
          contact_email?: string
          guidelines?: string[]
        }
      }
      resources: {
        Row: {
          id: string
          name: string
          category: "AV_EQUIPMENT" | "AUDIO" | "FURNITURE" | "DISPLAY"
          facility_scope: string
          total_quantity: number
          available_quantity: number
          condition: "EXCELLENT" | "GOOD" | "FAIR" | "UNDER_REPAIR"
          unit: string
        }
        Insert: {
          id: string
          name: string
          category: "AV_EQUIPMENT" | "AUDIO" | "FURNITURE" | "DISPLAY"
          facility_scope?: string
          total_quantity?: number
          available_quantity?: number
          condition?: "EXCELLENT" | "GOOD" | "FAIR" | "UNDER_REPAIR"
          unit?: string
        }
        Update: {
          id?: string
          name?: string
          category?: "AV_EQUIPMENT" | "AUDIO" | "FURNITURE" | "DISPLAY"
          facility_scope?: string
          total_quantity?: number
          available_quantity?: number
          condition?: "EXCELLENT" | "GOOD" | "FAIR" | "UNDER_REPAIR"
          unit?: string
        }
      }
      reservations: {
        Row: {
          id: string
          reservation_code: string
          facility_id: string
          user_id: string
          event_name: string
          purpose: string
          date: string
          start_time: string
          end_time: string
          expected_attendees: number
          status: "PENDING" | "APPROVED" | "REJECTED" | "CANCELLED"
          submitted_at: string
          reviewed_at: string | null
          reviewed_by: string | null
          rejection_reason: string | null
          admin_notes: string | null
        }
        Insert: {
          id: string
          reservation_code: string
          facility_id: string
          user_id: string
          event_name: string
          purpose?: string
          date: string
          start_time: string
          end_time: string
          expected_attendees?: number
          status?: "PENDING" | "APPROVED" | "REJECTED" | "CANCELLED"
          submitted_at?: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          rejection_reason?: string | null
          admin_notes?: string | null
        }
        Update: {
          id?: string
          reservation_code?: string
          facility_id?: string
          user_id?: string
          event_name?: string
          purpose?: string
          date?: string
          start_time?: string
          end_time?: string
          expected_attendees?: number
          status?: "PENDING" | "APPROVED" | "REJECTED" | "CANCELLED"
          submitted_at?: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          rejection_reason?: string | null
          admin_notes?: string | null
        }
      }
      requested_resources: {
        Row: {
          id: string
          reservation_id: string
          resource_id: string
          name: string
          quantity: number
        }
        Insert: {
          id: string
          reservation_id: string
          resource_id: string
          name: string
          quantity?: number
        }
        Update: {
          id?: string
          reservation_id?: string
          resource_id?: string
          name?: string
          quantity?: number
        }
      }
      approval_logs: {
        Row: {
          id: string
          reservation_id: string
          reservation_code: string
          event_name: string
          facility_name: string
          actor_name: string
          actor_role: string
          action: string
          timestamp: string
          notes: string
        }
        Insert: {
          id: string
          reservation_id: string
          reservation_code?: string
          event_name?: string
          facility_name?: string
          actor_name?: string
          actor_role?: string
          action: string
          timestamp?: string
          notes?: string
        }
        Update: {
          id?: string
          reservation_id?: string
          reservation_code?: string
          event_name?: string
          facility_name?: string
          actor_name?: string
          actor_role?: string
          action?: string
          timestamp?: string
          notes?: string
        }
      }
      notifications: {
        Row: {
          id: string
          user_id: string | null
          target_role: string | null
          title: string
          message: string
          type: string
          timestamp: string
          read: boolean
          reservation_id: string | null
        }
        Insert: {
          id: string
          user_id?: string | null
          target_role?: string | null
          title: string
          message?: string
          type: string
          timestamp?: string
          read?: boolean
          reservation_id?: string | null
        }
        Update: {
          id?: string
          user_id?: string | null
          target_role?: string | null
          title?: string
          message?: string
          type?: string
          timestamp?: string
          read?: boolean
          reservation_id?: string | null
        }
      }
    }
  }
}
