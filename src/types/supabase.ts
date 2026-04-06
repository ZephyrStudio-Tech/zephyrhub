export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type Database = {
  public: {
    Tables: {
      academy_content: {
        Row: { id: string; title: string; slug: string; category: string; video_url: string | null; thumbnail_url: string | null; description: string | null; sort_order: number | null; created_at: string | null; content_type: string | null; content_body: string | null; cover_image: string | null; };
        Insert: { id?: string; title: string; slug: string; category: string; video_url?: string | null; thumbnail_url?: string | null; description?: string | null; sort_order?: number | null; created_at?: string | null; content_type?: string | null; content_body?: string | null; cover_image?: string | null; };
        Update: { id?: string; title?: string; slug?: string; category?: string; video_url?: string | null; thumbnail_url?: string | null; description?: string | null; sort_order?: number | null; created_at?: string | null; content_type?: string | null; content_body?: string | null; cover_image?: string | null; };
      };
      agreements: {
        Row: { id: string; client_id: string; storage_path: string; created_at: string | null; };
        Insert: { id?: string; client_id: string; storage_path: string; created_at?: string | null; };
        Update: { id?: string; client_id?: string; storage_path?: string; created_at?: string | null; };
      };
      alerts: {
        Row: { id: string; client_id: string; message: string; interaction_id: string | null; created_at: string | null; read_at: string | null; };
        Insert: { id?: string; client_id: string; message: string; interaction_id?: string | null; created_at?: string | null; read_at?: string | null; };
        Update: { id?: string; client_id?: string; message?: string; interaction_id?: string | null; created_at?: string | null; read_at?: string | null; };
      };
      associates: {
        Row: { id: string; full_name: string; email: string; phone: string; dni: string | null; address: string | null; city: string | null; province: string | null; zip: string | null; entity_type: string | null; company_name: string | null; cif: string | null; fiscal_address: string | null; iban: string | null; default_commission: number | null; notes: string | null; is_active: boolean | null; created_at: string | null; updated_at: string | null; };
        Insert: { id: string; full_name: string; email: string; phone: string; dni?: string | null; address?: string | null; city?: string | null; province?: string | null; zip?: string | null; entity_type?: string | null; company_name?: string | null; cif?: string | null; fiscal_address?: string | null; iban?: string | null; default_commission?: number | null; notes?: string | null; is_active?: boolean | null; created_at?: string | null; updated_at?: string | null; };
        Update: { id?: string; full_name?: string; email?: string; phone?: string; dni?: string | null; address?: string | null; city?: string | null; province?: string | null; zip?: string | null; entity_type?: string | null; company_name?: string | null; cif?: string | null; fiscal_address?: string | null; iban?: string | null; default_commission?: number | null; notes?: string | null; is_active?: boolean | null; created_at?: string | null; updated_at?: string | null; };
      };
      audit_logs: {
        Row: { id: string; actor_id: string | null; action: string; entity_type: string; entity_id: string | null; payload: Json | null; created_at: string | null; };
        Insert: { id?: string; actor_id?: string | null; action: string; entity_type: string; entity_id?: string | null; payload?: Json | null; created_at?: string | null; };
        Update: { id?: string; actor_id?: string | null; action?: string; entity_type?: string; entity_id?: string | null; payload?: Json | null; created_at?: string | null; };
      };
      clients: {
        Row: { id: string; user_id: string | null; company_name: string; cif: string | null; service_type: string; current_state: string; consultant_id: string | null; created_at: string | null; updated_at: string | null; phone: string | null; email: string | null; full_name: string | null; province: string | null; company_size: string | null; entity_type: string | null; hardware_pref: string | null; web_state: string | null; complemento: string | null; kit_digital_prev: string | null; estado_hacienda: boolean | null; has_web_contract: boolean | null; has_ecommerce_contract: boolean | null; has_device: boolean | null; service_description: string | null; bono_granted_at: string | null; phase_i_submitted_at: string | null; phase_ii_submitted_at: string | null; pending_docs: boolean | null; };
        Insert: { id?: string; user_id?: string | null; company_name: string; cif?: string | null; service_type: string; current_state?: string; consultant_id?: string | null; created_at?: string | null; updated_at?: string | null; phone?: string | null; email?: string | null; full_name?: string | null; province?: string | null; company_size?: string | null; entity_type?: string | null; hardware_pref?: string | null; web_state?: string | null; complemento?: string | null; kit_digital_prev?: string | null; estado_hacienda?: boolean | null; has_web_contract?: boolean | null; has_ecommerce_contract?: boolean | null; has_device?: boolean | null; service_description?: string | null; bono_granted_at?: string | null; phase_i_submitted_at?: string | null; phase_ii_submitted_at?: string | null; pending_docs?: boolean | null; };
        Update: { id?: string; user_id?: string | null; company_name?: string; cif?: string | null; service_type?: string; current_state?: string; consultant_id?: string | null; created_at?: string | null; updated_at?: string | null; phone?: string | null; email?: string | null; full_name?: string | null; province?: string | null; company_size?: string | null; entity_type?: string | null; hardware_pref?: string | null; web_state?: string | null; complemento?: string | null; kit_digital_prev?: string | null; estado_hacienda?: boolean | null; has_web_contract?: boolean | null; has_ecommerce_contract?: boolean | null; has_device?: boolean | null; service_description?: string | null; bono_granted_at?: string | null; phase_i_submitted_at?: string | null; phase_ii_submitted_at?: string | null; pending_docs?: boolean | null; };
      };
      contracts: {
        Row: { id: string; client_id: string; type: string; current_state: string; started_at: string | null; created_at: string | null; updated_at: string | null; };
        Insert: { id?: string; client_id: string; type: string; current_state?: string; started_at?: string | null; created_at?: string | null; updated_at?: string | null; };
        Update: { id?: string; client_id?: string; type?: string; current_state?: string; started_at?: string | null; created_at?: string | null; updated_at?: string | null; };
      };
      device_orders: {
        Row: { id: string; client_id: string; device_id: string | null; status: string; shipping_name: string | null; shipping_address: string | null; shipping_city: string | null; shipping_province: string | null; shipping_zip: string | null; shipping_phone: string | null; bono_coverage: number | null; sale_price_snapshot: number | null; cost_price_snapshot: number | null; surcharge: number | null; payment_intent_id: string | null; payment_status: string | null; paid_at: string | null; tracking_number: string | null; tracking_url: string | null; shipped_at: string | null; delivered_at: string | null; notes: string | null; created_at: string | null; updated_at: string | null; };
        Insert: { id?: string; client_id: string; device_id?: string | null; status?: string; shipping_name?: string | null; shipping_address?: string | null; shipping_city?: string | null; shipping_province?: string | null; shipping_zip?: string | null; shipping_phone?: string | null; bono_coverage?: number | null; sale_price_snapshot?: number | null; cost_price_snapshot?: number | null; surcharge?: number | null; payment_intent_id?: string | null; payment_status?: string | null; paid_at?: string | null; tracking_number?: string | null; tracking_url?: string | null; shipped_at?: string | null; delivered_at?: string | null; notes?: string | null; created_at?: string | null; updated_at?: string | null; };
        Update: { id?: string; client_id?: string; device_id?: string | null; status?: string; shipping_name?: string | null; shipping_address?: string | null; shipping_city?: string | null; shipping_province?: string | null; shipping_zip?: string | null; shipping_phone?: string | null; bono_coverage?: number | null; sale_price_snapshot?: number | null; cost_price_snapshot?: number | null; surcharge?: number | null; payment_intent_id?: string | null; payment_status?: string | null; paid_at?: string | null; tracking_number?: string | null; tracking_url?: string | null; shipped_at?: string | null; delivered_at?: string | null; notes?: string | null; created_at?: string | null; updated_at?: string | null; };
      };
      devices: {
        Row: { id: string; name: string; description: string | null; category: string | null; brand: string | null; model: string | null; specs: Json | null; images: string[] | null; cost_price: number; sale_price: number; bono_coverage: number; is_available: boolean | null; stock: number | null; created_at: string | null; updated_at: string | null; };
        Insert: { id?: string; name: string; description?: string | null; category?: string | null; brand?: string | null; model?: string | null; specs?: Json | null; images?: string[] | null; cost_price: number; sale_price: number; bono_coverage?: number; is_available?: boolean | null; stock?: number | null; created_at?: string | null; updated_at?: string | null; };
        Update: { id?: string; name?: string; description?: string | null; category?: string | null; brand?: string | null; model?: string | null; specs?: Json | null; images?: string[] | null; cost_price?: number; sale_price?: number; bono_coverage?: number; is_available?: boolean | null; stock?: number | null; created_at?: string | null; updated_at?: string | null; };
      };
      documents: {
        Row: { id: string; client_id: string; slot_type: string; version: number; storage_path: string; status: string; rejection_reason: string | null; uploaded_at: string | null; reviewed_at: string | null; reviewed_by: string | null; created_at: string | null; };
        Insert: { id?: string; client_id: string; slot_type: string; version?: number; storage_path: string; status?: string; rejection_reason?: string | null; uploaded_at?: string | null; reviewed_at?: string | null; reviewed_by?: string | null; created_at?: string | null; };
        Update: { id?: string; client_id?: string; slot_type?: string; version?: number; storage_path?: string; status?: string; rejection_reason?: string | null; uploaded_at?: string | null; reviewed_at?: string | null; reviewed_by?: string | null; created_at?: string | null; };
      };
      interactions: {
        Row: { id: string; client_id: string; actor_id: string; type: string; metadata: Json | null; created_at: string | null; };
        Insert: { id?: string; client_id: string; actor_id: string; type: string; metadata?: Json | null; created_at?: string | null; };
        Update: { id?: string; client_id?: string; actor_id?: string; type?: string; metadata?: Json | null; created_at?: string | null; };
      };
      payments: {
        Row: { id: string; client_id: string; contract_type: "web" | "ecommerce"; phase: "fase_i" | "fase_ii"; expected_amount: number; received_amount: number | null; received_at: string | null; agent_commission: number | null; notes: string | null; created_at: string | null; updated_at: string | null; };
        Insert: { id?: string; client_id: string; contract_type: "web" | "ecommerce"; phase: "fase_i" | "fase_ii"; expected_amount: number; received_amount?: number | null; received_at?: string | null; agent_commission?: number | null; notes?: string | null; created_at?: string | null; updated_at?: string | null; };
        Update: { id?: string; client_id?: string; contract_type?: "web" | "ecommerce"; phase?: "fase_i" | "fase_ii"; expected_amount?: number; received_amount?: number | null; received_at?: string | null; agent_commission?: number | null; notes?: string | null; created_at?: string | null; updated_at?: string | null; };
      };
      profiles: {
        Row: { id: string; role: string; full_name: string | null; email: string | null; created_at: string | null; updated_at: string | null; };
        Insert: { id: string; role?: string; full_name?: string | null; email?: string | null; created_at?: string | null; updated_at?: string | null; };
        Update: { id?: string; role?: string; full_name?: string | null; email?: string | null; created_at?: string | null; updated_at?: string | null; };
      };
      referrals: {
        Row: { id: string; associate_id: string; client_id: string | null; contact_name: string; contact_phone: string; contact_email: string; entity_type: string | null; company_name: string | null; dni_cif: string | null; fiscal_address: string | null; notes: string | null; status: string; commission_amount: number; commission_status: string; commission_paid_at: string | null; commission_notes: string | null; created_at: string | null; updated_at: string | null; };
        Insert: { id?: string; associate_id: string; client_id?: string | null; contact_name: string; contact_phone: string; contact_email: string; entity_type?: string | null; company_name?: string | null; dni_cif?: string | null; fiscal_address?: string | null; notes?: string | null; status?: string; commission_amount?: number; commission_status?: string; commission_paid_at?: string | null; commission_notes?: string | null; created_at?: string | null; updated_at?: string | null; };
        Update: { id?: string; associate_id?: string; client_id?: string | null; contact_name?: string; contact_phone?: string; contact_email?: string; entity_type?: string | null; company_name?: string | null; dni_cif?: string | null; fiscal_address?: string | null; notes?: string | null; status?: string; commission_amount?: number; commission_status?: string; commission_paid_at?: string | null; commission_notes?: string | null; created_at?: string | null; updated_at?: string | null; };
      };
      support_requests: {
        Row: { id: string; client_id: string | null; user_id: string | null; category: string; message: string | null; created_at: string | null; status: string | null; admin_reply: string | null; updated_at: string | null; };
        Insert: { id?: string; client_id?: string | null; user_id?: string | null; category: string; message?: string | null; created_at?: string | null; status?: string | null; admin_reply?: string | null; updated_at?: string | null; };
        Update: { id?: string; client_id?: string | null; user_id?: string | null; category?: string; message?: string | null; created_at?: string | null; status?: string | null; admin_reply?: string | null; updated_at?: string | null; };
      };
      tech_evidences: {
        Row: { id: string; client_id: string; checklist_key: string; storage_path: string; uploaded_by: string; uploaded_at: string | null; created_at: string | null; };
        Insert: { id?: string; client_id: string; checklist_key: string; storage_path: string; uploaded_by: string; uploaded_at?: string | null; created_at?: string | null; };
        Update: { id?: string; client_id?: string; checklist_key?: string; storage_path?: string; uploaded_by?: string; uploaded_at?: string | null; created_at?: string | null; };
      };
      ticket_messages: {
        Row: { id: string; ticket_id: string | null; sender_id: string | null; sender_role: string; message: string; attachment_url: string | null; created_at: string | null; };
        Insert: { id?: string; ticket_id?: string | null; sender_id?: string | null; sender_role: string; message: string; attachment_url?: string | null; created_at?: string | null; };
        Update: { id?: string; ticket_id?: string | null; sender_id?: string | null; sender_role?: string; message?: string; attachment_url?: string | null; created_at?: string | null; };
      };
      triage_interactions: {
        Row: { id: string; lead_id: string; actor_id: string; type: string; metadata: Json | null; created_at: string | null; };
        Insert: { id?: string; lead_id: string; actor_id: string; type: string; metadata?: Json | null; created_at?: string | null; };
        Update: { id?: string; lead_id?: string; actor_id?: string; type?: string; metadata?: Json | null; created_at?: string | null; };
      };
      triage_leads: {
        Row: { id: string; created_at: string | null; entity_type: string; company_size: string; full_name: string; phone: string; email: string; province: string; company_name: string | null; nif: string | null; service_requested: string; hardware_pref: string | null; web_state: string | null; rgpd_accepted: boolean; status: string; complemento: string | null; sla_type: string | null; sla_canal: string | null; kit_digital_prev: string | null; current_state: string | null; notes: string | null; last_interaction_at: string | null; call_missed_count: number | null; };
        Insert: { id?: string; created_at?: string | null; entity_type: string; company_size: string; full_name: string; phone: string; email: string; province: string; company_name?: string | null; nif?: string | null; service_requested: string; hardware_pref?: string | null; web_state?: string | null; rgpd_accepted?: boolean; status?: string; complemento?: string | null; sla_type?: string | null; sla_canal?: string | null; kit_digital_prev?: string | null; current_state?: string | null; notes?: string | null; last_interaction_at?: string | null; call_missed_count?: number | null; };
        Update: { id?: string; created_at?: string | null; entity_type?: string; company_size?: string; full_name?: string; phone?: string; email?: string; province?: string; company_name?: string | null; nif?: string | null; service_requested: string; hardware_pref?: string | null; web_state?: string | null; rgpd_accepted?: boolean; status?: string; complemento?: string | null; sla_type?: string | null; sla_canal?: string | null; kit_digital_prev?: string | null; current_state?: string | null; notes?: string | null; last_interaction_at?: string | null; call_missed_count?: number | null; };
      };
    };
    Views: { [_ in never]: never };
    Functions: { [_ in never]: never };
    Enums: { [_ in never]: never };
    CompositeTypes: { [_ in never]: never };
  };
};

export type Tables<T extends keyof Database["public"]["Tables"]> = Database["public"]["Tables"][T]["Row"];
export type Enums<T extends keyof Database["public"]["Enums"]> = Database["public"]["Enums"][T];
export type ProfileRole = Database["public"]["Tables"]["profiles"]["Row"]["role"];
