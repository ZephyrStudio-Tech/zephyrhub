/**
 * Supabase Database Types
 *
 * Generated manually from schema analysis.
 * Replace with: pnpm supabase gen types typescript --linked > src/types/supabase.ts
 */

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type AppRole = "beneficiario" | "consultor" | "tecnico" | "admin" | "asociado";
export type ServiceType = "web" | "ecommerce" | "seo" | "device";
export type PipelineState =
  | "nuevo_lead" | "contactado" | "primera_consulta" | "documentacion_pendiente"
  | "documentacion_completa" | "solicitud_enviada" | "solicitud_aprobada"
  | "contrato_firmado" | "implementacion" | "formacion" | "justificacion_1"
  | "justificacion_2" | "completado" | "cancelado" | "rechazado"
  | "baja" | "perdido" | "en_espera" | "revision" | "incidencia"
  | "pre_consultoria" | "consultoria" | "en_desarrollo" | "cerrado";
export type StatusEnum = "pending" | "in_progress" | "completed" | "cancelled";
export type DocumentStatus = "pending" | "approved" | "rejected";
export type DeviceOrderStatus = "pendiente" | "enviado" | "entregado" | "cancelado";
export type PaymentPhase = "anticipo" | "intermedio" | "final";
export type PaymentContract = "web" | "ecommerce";
export type InteractionType =
  | "call" | "email" | "meeting" | "note" | "document_approved"
  | "document_rejected" | "state_change";
export type CommissionStatus = "pendiente" | "pagado" | "cancelado";
export type ReferralStatus =
  | "recibido" | "contactado" | "en_proceso" | "convertido" | "descartado";

export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          email: string | null;
          full_name: string | null;
          role: AppRole;
          created_at: string;
          updated_at: string | null;
        };
        Insert: {
          id: string;
          email?: string | null;
          full_name?: string | null;
          role?: AppRole;
          created_at?: string;
          updated_at?: string | null;
        };
        Update: {
          id?: string;
          email?: string | null;
          full_name?: string | null;
          role?: AppRole;
          created_at?: string;
          updated_at?: string | null;
        };
        Relationships: [];
      };
      clients: {
        Row: {
          id: string;
          full_name: string | null;
          email: string | null;
          phone: string | null;
          company_name: string | null;
          cif: string | null;
          nif: string | null;
          current_state: string;
          service_type: string | null;
          service_description: string | null;
          consultant_id: string | null;
          has_device: boolean;
          pending_docs: boolean;
          province: string | null;
          entity_type: string | null;
          company_size: string | null;
          hardware_pref: string | null;
          web_state: string | null;
          complemento: string | null;
          kit_digital_prev: string | null;
          created_at: string;
          updated_at: string | null;
        };
        Insert: {
          id?: string;
          full_name?: string | null;
          email?: string | null;
          phone?: string | null;
          company_name?: string | null;
          cif?: string | null;
          nif?: string | null;
          current_state?: string;
          service_type?: string | null;
          service_description?: string | null;
          consultant_id?: string | null;
          has_device?: boolean;
          pending_docs?: boolean;
          province?: string | null;
          entity_type?: string | null;
          company_size?: string | null;
          hardware_pref?: string | null;
          web_state?: string | null;
          complemento?: string | null;
          kit_digital_prev?: string | null;
          created_at?: string;
          updated_at?: string | null;
        };
        Update: {
          id?: string;
          full_name?: string | null;
          email?: string | null;
          phone?: string | null;
          company_name?: string | null;
          cif?: string | null;
          nif?: string | null;
          current_state?: string;
          service_type?: string | null;
          service_description?: string | null;
          consultant_id?: string | null;
          has_device?: boolean;
          pending_docs?: boolean;
          province?: string | null;
          entity_type?: string | null;
          company_size?: string | null;
          hardware_pref?: string | null;
          web_state?: string | null;
          complemento?: string | null;
          kit_digital_prev?: string | null;
          created_at?: string;
          updated_at?: string | null;
        };
        Relationships: [];
      };
      contracts: {
        Row: {
          id: string;
          client_id: string;
          type: string;
          current_state: string;
          created_at: string;
          updated_at: string | null;
        };
        Insert: {
          id?: string;
          client_id: string;
          type: string;
          current_state?: string;
          created_at?: string;
          updated_at?: string | null;
        };
        Update: {
          id?: string;
          client_id?: string;
          type?: string;
          current_state?: string;
          created_at?: string;
          updated_at?: string | null;
        };
        Relationships: [];
      };
      payments: {
        Row: {
          id: string;
          client_id: string;
          contract_id: string | null;
          phase: string;
          contract_type: string | null;
          expected_amount: number;
          received_amount: number | null;
          agent_commission: number | null;
          paid_at: string | null;
          created_at: string;
          updated_at: string | null;
        };
        Insert: {
          id?: string;
          client_id: string;
          contract_id?: string | null;
          phase: string;
          contract_type?: string | null;
          expected_amount: number;
          received_amount?: number | null;
          agent_commission?: number | null;
          paid_at?: string | null;
          created_at?: string;
          updated_at?: string | null;
        };
        Update: {
          id?: string;
          client_id?: string;
          contract_id?: string | null;
          phase?: string;
          contract_type?: string | null;
          expected_amount?: number;
          received_amount?: number | null;
          agent_commission?: number | null;
          paid_at?: string | null;
          created_at?: string;
          updated_at?: string | null;
        };
        Relationships: [];
      };
      documents: {
        Row: {
          id: string;
          client_id: string;
          slot_type: string;
          version: number;
          status: string;
          storage_path: string | null;
          rejection_reason: string | null;
          uploaded_at: string | null;
          created_at: string;
          updated_at: string | null;
        };
        Insert: {
          id?: string;
          client_id: string;
          slot_type: string;
          version?: number;
          status?: string;
          storage_path?: string | null;
          rejection_reason?: string | null;
          uploaded_at?: string | null;
          created_at?: string;
          updated_at?: string | null;
        };
        Update: {
          id?: string;
          client_id?: string;
          slot_type?: string;
          version?: number;
          status?: string;
          storage_path?: string | null;
          rejection_reason?: string | null;
          uploaded_at?: string | null;
          created_at?: string;
          updated_at?: string | null;
        };
        Relationships: [];
      };
      agreements: {
        Row: {
          id: string;
          client_id: string;
          storage_path: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          client_id: string;
          storage_path: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          client_id?: string;
          storage_path?: string;
          created_at?: string;
        };
        Relationships: [];
      };
      devices: {
        Row: {
          id: string;
          name: string;
          brand: string | null;
          model: string | null;
          category: string;
          description: string | null;
          specs: Json | null;
          cost_price: number;
          sale_price: number;
          bono_coverage: number;
          stock: number;
          is_available: boolean;
          images: string[];
          created_at: string;
          updated_at: string | null;
        };
        Insert: {
          id?: string;
          name: string;
          brand?: string | null;
          model?: string | null;
          category: string;
          description?: string | null;
          specs?: Json | null;
          cost_price: number;
          sale_price: number;
          bono_coverage: number;
          stock?: number;
          is_available?: boolean;
          images?: string[];
          created_at?: string;
          updated_at?: string | null;
        };
        Update: {
          id?: string;
          name?: string;
          brand?: string | null;
          model?: string | null;
          category?: string;
          description?: string | null;
          specs?: Json | null;
          cost_price?: number;
          sale_price?: number;
          bono_coverage?: number;
          stock?: number;
          is_available?: boolean;
          images?: string[];
          created_at?: string;
          updated_at?: string | null;
        };
        Relationships: [];
      };
      device_orders: {
        Row: {
          id: string;
          client_id: string;
          device_id: string | null;
          status: string;
          surcharge: number | null;
          created_at: string;
          updated_at: string | null;
        };
        Insert: {
          id?: string;
          client_id: string;
          device_id?: string | null;
          status?: string;
          surcharge?: number | null;
          created_at?: string;
          updated_at?: string | null;
        };
        Update: {
          id?: string;
          client_id?: string;
          device_id?: string | null;
          status?: string;
          surcharge?: number | null;
          created_at?: string;
          updated_at?: string | null;
        };
        Relationships: [];
      };
      interactions: {
        Row: {
          id: string;
          client_id: string;
          actor_id: string | null;
          type: string;
          metadata: Json | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          client_id: string;
          actor_id?: string | null;
          type: string;
          metadata?: Json | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          client_id?: string;
          actor_id?: string | null;
          type?: string;
          metadata?: Json | null;
          created_at?: string;
        };
        Relationships: [];
      };
      alerts: {
        Row: {
          id: string;
          client_id: string;
          message: string;
          interaction_id: string | null;
          read_at: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          client_id: string;
          message: string;
          interaction_id?: string | null;
          read_at?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          client_id?: string;
          message?: string;
          interaction_id?: string | null;
          read_at?: string | null;
          created_at?: string;
        };
        Relationships: [];
      };
      audit_logs: {
        Row: {
          id: string;
          actor_id: string | null;
          action: string;
          entity_type: string;
          entity_id: string | null;
          payload: Json | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          actor_id?: string | null;
          action: string;
          entity_type: string;
          entity_id?: string | null;
          payload?: Json | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          actor_id?: string | null;
          action?: string;
          entity_type?: string;
          entity_id?: string | null;
          payload?: Json | null;
          created_at?: string;
        };
        Relationships: [];
      };
      support_requests: {
        Row: {
          id: string;
          user_id: string;
          client_id: string | null;
          category: string;
          message: string | null;
          status: string;
          admin_reply: string | null;
          created_at: string;
          updated_at: string | null;
        };
        Insert: {
          id?: string;
          user_id: string;
          client_id?: string | null;
          category: string;
          message?: string | null;
          status?: string;
          admin_reply?: string | null;
          created_at?: string;
          updated_at?: string | null;
        };
        Update: {
          id?: string;
          user_id?: string;
          client_id?: string | null;
          category?: string;
          message?: string | null;
          status?: string;
          admin_reply?: string | null;
          created_at?: string;
          updated_at?: string | null;
        };
        Relationships: [];
      };
      ticket_messages: {
        Row: {
          id: string;
          ticket_id: string;
          message: string;
          attachment_url: string | null;
          sender_role: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          ticket_id: string;
          message: string;
          attachment_url?: string | null;
          sender_role: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          ticket_id?: string;
          message?: string;
          attachment_url?: string | null;
          sender_role?: string;
          created_at?: string;
        };
        Relationships: [];
      };
      tech_evidences: {
        Row: {
          id: string;
          client_id: string;
          checklist_key: string;
          storage_path: string;
          uploaded_by: string | null;
          uploaded_at: string;
        };
        Insert: {
          id?: string;
          client_id: string;
          checklist_key: string;
          storage_path: string;
          uploaded_by?: string | null;
          uploaded_at?: string;
        };
        Update: {
          id?: string;
          client_id?: string;
          checklist_key?: string;
          storage_path?: string;
          uploaded_by?: string | null;
          uploaded_at?: string;
        };
        Relationships: [];
      };
      associates: {
        Row: {
          id: string;
          full_name: string;
          email: string | null;
          phone: string | null;
          company_name: string | null;
          entity_type: string | null;
          default_commission: number;
          created_at: string;
          updated_at: string | null;
        };
        Insert: {
          id: string;
          full_name: string;
          email?: string | null;
          phone?: string | null;
          company_name?: string | null;
          entity_type?: string | null;
          default_commission?: number;
          created_at?: string;
          updated_at?: string | null;
        };
        Update: {
          id?: string;
          full_name?: string;
          email?: string | null;
          phone?: string | null;
          company_name?: string | null;
          entity_type?: string | null;
          default_commission?: number;
          created_at?: string;
          updated_at?: string | null;
        };
        Relationships: [];
      };
      referrals: {
        Row: {
          id: string;
          associate_id: string;
          contact_name: string;
          contact_phone: string | null;
          contact_email: string | null;
          entity_type: string | null;
          company_name: string | null;
          dni_cif: string | null;
          fiscal_address: string | null;
          notes: string | null;
          status: string;
          commission_amount: number | null;
          commission_status: string;
          client_id: string | null;
          created_at: string;
          updated_at: string | null;
        };
        Insert: {
          id?: string;
          associate_id: string;
          contact_name: string;
          contact_phone?: string | null;
          contact_email?: string | null;
          entity_type?: string | null;
          company_name?: string | null;
          dni_cif?: string | null;
          fiscal_address?: string | null;
          notes?: string | null;
          status?: string;
          commission_amount?: number | null;
          commission_status?: string;
          client_id?: string | null;
          created_at?: string;
          updated_at?: string | null;
        };
        Update: {
          id?: string;
          associate_id?: string;
          contact_name?: string;
          contact_phone?: string | null;
          contact_email?: string | null;
          entity_type?: string | null;
          company_name?: string | null;
          dni_cif?: string | null;
          fiscal_address?: string | null;
          notes?: string | null;
          status?: string;
          commission_amount?: number | null;
          commission_status?: string;
          client_id?: string | null;
          created_at?: string;
          updated_at?: string | null;
        };
        Relationships: [];
      };
      academy_content: {
        Row: {
          id: string;
          title: string;
          slug: string;
          category: string;
          description: string | null;
          content_type: string;
          video_url: string | null;
          content_body: string | null;
          cover_image: string | null;
          sort_order: number;
          created_at: string;
          updated_at: string | null;
        };
        Insert: {
          id?: string;
          title: string;
          slug: string;
          category?: string;
          description?: string | null;
          content_type?: string;
          video_url?: string | null;
          content_body?: string | null;
          cover_image?: string | null;
          sort_order?: number;
          created_at?: string;
          updated_at?: string | null;
        };
        Update: {
          id?: string;
          title?: string;
          slug?: string;
          category?: string;
          description?: string | null;
          content_type?: string;
          video_url?: string | null;
          content_body?: string | null;
          cover_image?: string | null;
          sort_order?: number;
          created_at?: string;
          updated_at?: string | null;
        };
        Relationships: [];
      };
      triage_leads: {
        Row: {
          id: string;
          full_name: string;
          email: string | null;
          phone: string | null;
          company_name: string | null;
          nif: string | null;
          entity_type: string;
          company_size: string | null;
          province: string | null;
          service_requested: string | null;
          hardware_pref: string | null;
          web_state: string | null;
          complemento: string | null;
          kit_digital_prev: string | null;
          rgpd_accepted: boolean;
          current_state: string;
          status: string;
          notes: string | null;
          call_missed_count: number;
          last_interaction_at: string | null;
          created_at: string;
          updated_at: string | null;
        };
        Insert: {
          id?: string;
          full_name: string;
          email?: string | null;
          phone?: string | null;
          company_name?: string | null;
          nif?: string | null;
          entity_type?: string;
          company_size?: string | null;
          province?: string | null;
          service_requested?: string | null;
          hardware_pref?: string | null;
          web_state?: string | null;
          complemento?: string | null;
          kit_digital_prev?: string | null;
          rgpd_accepted?: boolean;
          current_state?: string;
          status?: string;
          notes?: string | null;
          call_missed_count?: number;
          last_interaction_at?: string | null;
          created_at?: string;
          updated_at?: string | null;
        };
        Update: {
          id?: string;
          full_name?: string;
          email?: string | null;
          phone?: string | null;
          company_name?: string | null;
          nif?: string | null;
          entity_type?: string;
          company_size?: string | null;
          province?: string | null;
          service_requested?: string | null;
          hardware_pref?: string | null;
          web_state?: string | null;
          complemento?: string | null;
          kit_digital_prev?: string | null;
          rgpd_accepted?: boolean;
          current_state?: string;
          status?: string;
          notes?: string | null;
          call_missed_count?: number;
          last_interaction_at?: string | null;
          created_at?: string;
          updated_at?: string | null;
        };
        Relationships: [];
      };
      triage_interactions: {
        Row: {
          id: string;
          lead_id: string;
          actor_id: string | null;
          type: string;
          metadata: Json | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          lead_id: string;
          actor_id?: string | null;
          type: string;
          metadata?: Json | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          lead_id?: string;
          actor_id?: string | null;
          type?: string;
          metadata?: Json | null;
          created_at?: string;
        };
        Relationships: [];
      };
      schema_migrations: {
        Row: {
          version: string;
          inserted_at: string | null;
        };
        Insert: {
          version: string;
          inserted_at?: string | null;
        };
        Update: {
          version?: string;
          inserted_at?: string | null;
        };
        Relationships: [];
      };
    };
    Views: {
      [key: string]: {
        Row: Record<string, unknown>;
        Relationships: unknown[];
      };
    };
    Functions: {
      increment_lead_missed_calls: {
        Args: { lead_id: string };
        Returns: void;
      };
      [key: string]: {
        Args: Record<string, unknown>;
        Returns: unknown;
      };
    };
    Enums: {
      app_role: AppRole;
      service_type: ServiceType;
      pipeline_state: PipelineState;
      interaction_type: InteractionType;
      [key: string]: string;
    };
    CompositeTypes: {
      [key: string]: unknown;
    };
  };
};

// Helper types
export type Tables<T extends keyof Database["public"]["Tables"]> =
  Database["public"]["Tables"][T]["Row"];
export type Enums<T extends keyof Database["public"]["Enums"]> =
  Database["public"]["Enums"][T];
export type ProfileRole = Database["public"]["Tables"]["profiles"]["Row"]["role"];