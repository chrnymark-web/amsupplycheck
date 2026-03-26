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
    PostgrestVersion: "13.0.5"
  }
  public: {
    Tables: {
      ai_match_analytics: {
        Row: {
          created_at: string
          extracted_requirements: Json | null
          id: string
          match_duration_ms: number | null
          match_score_avg: number | null
          matched_suppliers: Json | null
          project_description: string
          selected_supplier_id: string | null
        }
        Insert: {
          created_at?: string
          extracted_requirements?: Json | null
          id?: string
          match_duration_ms?: number | null
          match_score_avg?: number | null
          matched_suppliers?: Json | null
          project_description: string
          selected_supplier_id?: string | null
        }
        Update: {
          created_at?: string
          extracted_requirements?: Json | null
          id?: string
          match_duration_ms?: number | null
          match_score_avg?: number | null
          matched_suppliers?: Json | null
          project_description?: string
          selected_supplier_id?: string | null
        }
        Relationships: []
      }
      certifications: {
        Row: {
          created_at: string
          description: string | null
          id: string
          name: string
          slug: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          name: string
          slug: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          name?: string
          slug?: string
        }
        Relationships: []
      }
      chat_analytics: {
        Row: {
          conversation_duration_ms: number | null
          created_at: string
          id: string
          message_count: number | null
          session_id: string
          suppliers_mentioned: string[] | null
          tools_used: string[] | null
          topics_discussed: string[] | null
          updated_at: string
          user_satisfied: boolean | null
        }
        Insert: {
          conversation_duration_ms?: number | null
          created_at?: string
          id?: string
          message_count?: number | null
          session_id: string
          suppliers_mentioned?: string[] | null
          tools_used?: string[] | null
          topics_discussed?: string[] | null
          updated_at?: string
          user_satisfied?: boolean | null
        }
        Update: {
          conversation_duration_ms?: number | null
          created_at?: string
          id?: string
          message_count?: number | null
          session_id?: string
          suppliers_mentioned?: string[] | null
          tools_used?: string[] | null
          topics_discussed?: string[] | null
          updated_at?: string
          user_satisfied?: boolean | null
        }
        Relationships: []
      }
      chat_sessions: {
        Row: {
          context: Json | null
          created_at: string
          id: string
          messages: Json
          session_id: string
          updated_at: string
        }
        Insert: {
          context?: Json | null
          created_at?: string
          id?: string
          messages?: Json
          session_id: string
          updated_at?: string
        }
        Update: {
          context?: Json | null
          created_at?: string
          id?: string
          messages?: Json
          session_id?: string
          updated_at?: string
        }
        Relationships: []
      }
      countries: {
        Row: {
          code: string | null
          created_at: string
          id: string
          name: string
          region: string | null
        }
        Insert: {
          code?: string | null
          created_at?: string
          id?: string
          name: string
          region?: string | null
        }
        Update: {
          code?: string | null
          created_at?: string
          id?: string
          name?: string
          region?: string | null
        }
        Relationships: []
      }
      discovered_suppliers: {
        Row: {
          created_at: string
          description: string | null
          discovery_confidence: number | null
          id: string
          location_city: string | null
          location_country: string | null
          materials: string[] | null
          name: string
          raw_data: Json | null
          rejection_reason: string | null
          reviewed_at: string | null
          reviewed_by: string | null
          search_query: string | null
          source_url: string | null
          status: string
          technologies: string[] | null
          updated_at: string
          website: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          discovery_confidence?: number | null
          id?: string
          location_city?: string | null
          location_country?: string | null
          materials?: string[] | null
          name: string
          raw_data?: Json | null
          rejection_reason?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          search_query?: string | null
          source_url?: string | null
          status?: string
          technologies?: string[] | null
          updated_at?: string
          website: string
        }
        Update: {
          created_at?: string
          description?: string | null
          discovery_confidence?: number | null
          id?: string
          location_city?: string | null
          location_country?: string | null
          materials?: string[] | null
          name?: string
          raw_data?: Json | null
          rejection_reason?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          search_query?: string | null
          source_url?: string | null
          status?: string
          technologies?: string[] | null
          updated_at?: string
          website?: string
        }
        Relationships: []
      }
      discovery_config: {
        Row: {
          alert_on_failure: boolean
          auto_approve_threshold: number | null
          created_at: string
          daily_digest_enabled: boolean
          email_recipients: string[] | null
          id: string
          notifications_enabled: boolean
          regions_enabled: string[]
          schedule_cron: string
          search_queries: string[]
          updated_at: string
        }
        Insert: {
          alert_on_failure?: boolean
          auto_approve_threshold?: number | null
          created_at?: string
          daily_digest_enabled?: boolean
          email_recipients?: string[] | null
          id?: string
          notifications_enabled?: boolean
          regions_enabled?: string[]
          schedule_cron?: string
          search_queries?: string[]
          updated_at?: string
        }
        Update: {
          alert_on_failure?: boolean
          auto_approve_threshold?: number | null
          created_at?: string
          daily_digest_enabled?: boolean
          email_recipients?: string[] | null
          id?: string
          notifications_enabled?: boolean
          regions_enabled?: string[]
          schedule_cron?: string
          search_queries?: string[]
          updated_at?: string
        }
        Relationships: []
      }
      discovery_runs: {
        Row: {
          completed_at: string | null
          error_message: string | null
          id: string
          logs: Json | null
          search_queries: string[] | null
          started_at: string
          status: string
          suppliers_duplicate: number | null
          suppliers_found: number | null
          suppliers_new: number | null
        }
        Insert: {
          completed_at?: string | null
          error_message?: string | null
          id?: string
          logs?: Json | null
          search_queries?: string[] | null
          started_at?: string
          status?: string
          suppliers_duplicate?: number | null
          suppliers_found?: number | null
          suppliers_new?: number | null
        }
        Update: {
          completed_at?: string | null
          error_message?: string | null
          id?: string
          logs?: Json | null
          search_queries?: string[] | null
          started_at?: string
          status?: string
          suppliers_duplicate?: number | null
          suppliers_found?: number | null
          suppliers_new?: number | null
        }
        Relationships: []
      }
      materials: {
        Row: {
          category: string | null
          created_at: string
          description: string | null
          id: string
          name: string
          slug: string
        }
        Insert: {
          category?: string | null
          created_at?: string
          description?: string | null
          id?: string
          name: string
          slug: string
        }
        Update: {
          category?: string | null
          created_at?: string
          description?: string | null
          id?: string
          name?: string
          slug?: string
        }
        Relationships: []
      }
      newsletter_signups: {
        Row: {
          created_at: string
          email: string
          id: string
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
        }
        Relationships: []
      }
      quote_requests: {
        Row: {
          created_at: string
          email: string
          id: string
          material_preference: string | null
          name: string
          project_description: string | null
          source_page: string | null
          status: string
          supplier_context: string | null
          technology_preference: string | null
          volume: string | null
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
          material_preference?: string | null
          name: string
          project_description?: string | null
          source_page?: string | null
          status?: string
          supplier_context?: string | null
          technology_preference?: string | null
          volume?: string | null
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          material_preference?: string | null
          name?: string
          project_description?: string | null
          source_page?: string | null
          status?: string
          supplier_context?: string | null
          technology_preference?: string | null
          volume?: string | null
        }
        Relationships: []
      }
      saved_searches: {
        Row: {
          areas: string[] | null
          certifications: string[] | null
          created_at: string
          id: string
          materials: string[] | null
          name: string
          query: string | null
          technologies: string[] | null
          urgency: string | null
          user_id: string
          volume: string | null
        }
        Insert: {
          areas?: string[] | null
          certifications?: string[] | null
          created_at?: string
          id?: string
          materials?: string[] | null
          name: string
          query?: string | null
          technologies?: string[] | null
          urgency?: string | null
          user_id: string
          volume?: string | null
        }
        Update: {
          areas?: string[] | null
          certifications?: string[] | null
          created_at?: string
          id?: string
          materials?: string[] | null
          name?: string
          query?: string | null
          technologies?: string[] | null
          urgency?: string | null
          user_id?: string
          volume?: string | null
        }
        Relationships: []
      }
      scrape_cache: {
        Row: {
          created_at: string
          html: string
          id: string
          key: string
          visible_text: string | null
        }
        Insert: {
          created_at?: string
          html: string
          id?: string
          key: string
          visible_text?: string | null
        }
        Update: {
          created_at?: string
          html?: string
          id?: string
          key?: string
          visible_text?: string | null
        }
        Relationships: []
      }
      search_analytics: {
        Row: {
          clicked_supplier_ids: string[] | null
          created_at: string
          extracted_certifications: string[] | null
          extracted_materials: string[] | null
          extracted_regions: string[] | null
          extracted_technologies: string[] | null
          id: string
          production_volume: string | null
          query: string
          results_count: number | null
          search_duration_ms: number | null
          search_type: string | null
          session_id: string | null
          user_corrections: Json | null
        }
        Insert: {
          clicked_supplier_ids?: string[] | null
          created_at?: string
          extracted_certifications?: string[] | null
          extracted_materials?: string[] | null
          extracted_regions?: string[] | null
          extracted_technologies?: string[] | null
          id?: string
          production_volume?: string | null
          query: string
          results_count?: number | null
          search_duration_ms?: number | null
          search_type?: string | null
          session_id?: string | null
          user_corrections?: Json | null
        }
        Update: {
          clicked_supplier_ids?: string[] | null
          created_at?: string
          extracted_certifications?: string[] | null
          extracted_materials?: string[] | null
          extracted_regions?: string[] | null
          extracted_technologies?: string[] | null
          id?: string
          production_volume?: string | null
          query?: string
          results_count?: number | null
          search_duration_ms?: number | null
          search_type?: string | null
          session_id?: string | null
          user_corrections?: Json | null
        }
        Relationships: []
      }
      supplier_applications: {
        Row: {
          company: string
          created_at: string
          email: string
          id: string
          name: string
        }
        Insert: {
          company: string
          created_at?: string
          email: string
          id?: string
          name: string
        }
        Update: {
          company?: string
          created_at?: string
          email?: string
          id?: string
          name?: string
        }
        Relationships: []
      }
      supplier_certifications: {
        Row: {
          certification_id: string
          created_at: string
          id: string
          supplier_id: string
        }
        Insert: {
          certification_id: string
          created_at?: string
          id?: string
          supplier_id: string
        }
        Update: {
          certification_id?: string
          created_at?: string
          id?: string
          supplier_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "supplier_certifications_certification_id_fkey"
            columns: ["certification_id"]
            isOneToOne: false
            referencedRelation: "certifications"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "supplier_certifications_supplier_id_fkey"
            columns: ["supplier_id"]
            isOneToOne: false
            referencedRelation: "suppliers"
            referencedColumns: ["id"]
          },
        ]
      }
      supplier_materials: {
        Row: {
          created_at: string
          id: string
          material_id: string
          supplier_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          material_id: string
          supplier_id: string
        }
        Update: {
          created_at?: string
          id?: string
          material_id?: string
          supplier_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "supplier_materials_material_id_fkey"
            columns: ["material_id"]
            isOneToOne: false
            referencedRelation: "materials"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "supplier_materials_supplier_id_fkey"
            columns: ["supplier_id"]
            isOneToOne: false
            referencedRelation: "suppliers"
            referencedColumns: ["id"]
          },
        ]
      }
      supplier_tags: {
        Row: {
          created_at: string
          id: string
          supplier_id: string
          tag_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          supplier_id: string
          tag_id: string
        }
        Update: {
          created_at?: string
          id?: string
          supplier_id?: string
          tag_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "supplier_tags_supplier_id_fkey"
            columns: ["supplier_id"]
            isOneToOne: false
            referencedRelation: "suppliers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "supplier_tags_tag_id_fkey"
            columns: ["tag_id"]
            isOneToOne: false
            referencedRelation: "tags"
            referencedColumns: ["id"]
          },
        ]
      }
      supplier_technologies: {
        Row: {
          created_at: string
          id: string
          supplier_id: string
          technology_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          supplier_id: string
          technology_id: string
        }
        Update: {
          created_at?: string
          id?: string
          supplier_id?: string
          technology_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "supplier_technologies_supplier_id_fkey"
            columns: ["supplier_id"]
            isOneToOne: false
            referencedRelation: "suppliers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "supplier_technologies_technology_id_fkey"
            columns: ["technology_id"]
            isOneToOne: false
            referencedRelation: "technologies"
            referencedColumns: ["id"]
          },
        ]
      }
      suppliers: {
        Row: {
          card_style: string | null
          certifications: string[] | null
          country_id: string | null
          created_at: string | null
          description: string | null
          description_extended: Json | null
          has_instant_quote: boolean | null
          has_rush_service: boolean | null
          id: string
          last_validated_at: string | null
          last_validation_confidence: number | null
          lead_time_indicator: string | null
          listing_type: string | null
          location_address: string | null
          location_city: string | null
          location_country: string | null
          location_lat: number | null
          location_lng: number | null
          logo_url: string | null
          materials: string[] | null
          metadata: Json | null
          name: string
          premium: boolean | null
          rating: number | null
          region: string | null
          review_count: number | null
          supplier_id: string
          technologies: string[] | null
          updated_at: string | null
          validation_failures: number | null
          verified: boolean | null
          website: string | null
        }
        Insert: {
          card_style?: string | null
          certifications?: string[] | null
          country_id?: string | null
          created_at?: string | null
          description?: string | null
          description_extended?: Json | null
          has_instant_quote?: boolean | null
          has_rush_service?: boolean | null
          id?: string
          last_validated_at?: string | null
          last_validation_confidence?: number | null
          lead_time_indicator?: string | null
          listing_type?: string | null
          location_address?: string | null
          location_city?: string | null
          location_country?: string | null
          location_lat?: number | null
          location_lng?: number | null
          logo_url?: string | null
          materials?: string[] | null
          metadata?: Json | null
          name: string
          premium?: boolean | null
          rating?: number | null
          region?: string | null
          review_count?: number | null
          supplier_id: string
          technologies?: string[] | null
          updated_at?: string | null
          validation_failures?: number | null
          verified?: boolean | null
          website?: string | null
        }
        Update: {
          card_style?: string | null
          certifications?: string[] | null
          country_id?: string | null
          created_at?: string | null
          description?: string | null
          description_extended?: Json | null
          has_instant_quote?: boolean | null
          has_rush_service?: boolean | null
          id?: string
          last_validated_at?: string | null
          last_validation_confidence?: number | null
          lead_time_indicator?: string | null
          listing_type?: string | null
          location_address?: string | null
          location_city?: string | null
          location_country?: string | null
          location_lat?: number | null
          location_lng?: number | null
          logo_url?: string | null
          materials?: string[] | null
          metadata?: Json | null
          name?: string
          premium?: boolean | null
          rating?: number | null
          region?: string | null
          review_count?: number | null
          supplier_id?: string
          technologies?: string[] | null
          updated_at?: string | null
          validation_failures?: number | null
          verified?: boolean | null
          website?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "suppliers_country_id_fkey"
            columns: ["country_id"]
            isOneToOne: false
            referencedRelation: "countries"
            referencedColumns: ["id"]
          },
        ]
      }
      tags: {
        Row: {
          category: string | null
          created_at: string
          id: string
          name: string
          slug: string
        }
        Insert: {
          category?: string | null
          created_at?: string
          id?: string
          name: string
          slug: string
        }
        Update: {
          category?: string | null
          created_at?: string
          id?: string
          name?: string
          slug?: string
        }
        Relationships: []
      }
      technologies: {
        Row: {
          category: string | null
          created_at: string
          description: string | null
          id: string
          name: string
          slug: string
        }
        Insert: {
          category?: string | null
          created_at?: string
          description?: string | null
          id?: string
          name: string
          slug: string
        }
        Update: {
          category?: string | null
          created_at?: string
          description?: string | null
          id?: string
          name?: string
          slug?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string | null
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      validation_config: {
        Row: {
          auto_approve_location_updates: boolean | null
          auto_approve_material_updates: boolean | null
          auto_approve_missing_data: boolean | null
          auto_approve_technology_updates: boolean | null
          created_at: string | null
          enabled: boolean | null
          id: string
          monthly_validation_limit: number | null
          updated_at: string | null
          validation_paused: boolean | null
          validation_schedule_cron: string | null
          validations_this_month: number | null
        }
        Insert: {
          auto_approve_location_updates?: boolean | null
          auto_approve_material_updates?: boolean | null
          auto_approve_missing_data?: boolean | null
          auto_approve_technology_updates?: boolean | null
          created_at?: string | null
          enabled?: boolean | null
          id?: string
          monthly_validation_limit?: number | null
          updated_at?: string | null
          validation_paused?: boolean | null
          validation_schedule_cron?: string | null
          validations_this_month?: number | null
        }
        Update: {
          auto_approve_location_updates?: boolean | null
          auto_approve_material_updates?: boolean | null
          auto_approve_missing_data?: boolean | null
          auto_approve_technology_updates?: boolean | null
          created_at?: string | null
          enabled?: boolean | null
          id?: string
          monthly_validation_limit?: number | null
          updated_at?: string | null
          validation_paused?: boolean | null
          validation_schedule_cron?: string | null
          validations_this_month?: number | null
        }
        Relationships: []
      }
      validation_results: {
        Row: {
          cache_hit: boolean | null
          created_at: string
          id: string
          location_confidence: number | null
          location_current: string | null
          location_match: boolean | null
          location_scraped: string | null
          materials_confidence: number | null
          materials_current: string[] | null
          materials_match: boolean | null
          materials_scraped: string[] | null
          notes: string | null
          overall_confidence: number | null
          overall_match: boolean | null
          pages_scraped: number | null
          puppeteer_success: boolean | null
          reviewed: boolean | null
          scraped_at: string
          scraped_content: Json | null
          scraping_errors: Json | null
          scraping_time_ms: number | null
          supplier_id: string
          supplier_name: string
          supplier_website: string | null
          technologies_confidence: number | null
          technologies_current: string[] | null
          technologies_match: boolean | null
          technologies_scraped: string[] | null
          updated_at: string
        }
        Insert: {
          cache_hit?: boolean | null
          created_at?: string
          id?: string
          location_confidence?: number | null
          location_current?: string | null
          location_match?: boolean | null
          location_scraped?: string | null
          materials_confidence?: number | null
          materials_current?: string[] | null
          materials_match?: boolean | null
          materials_scraped?: string[] | null
          notes?: string | null
          overall_confidence?: number | null
          overall_match?: boolean | null
          pages_scraped?: number | null
          puppeteer_success?: boolean | null
          reviewed?: boolean | null
          scraped_at?: string
          scraped_content?: Json | null
          scraping_errors?: Json | null
          scraping_time_ms?: number | null
          supplier_id: string
          supplier_name: string
          supplier_website?: string | null
          technologies_confidence?: number | null
          technologies_current?: string[] | null
          technologies_match?: boolean | null
          technologies_scraped?: string[] | null
          updated_at?: string
        }
        Update: {
          cache_hit?: boolean | null
          created_at?: string
          id?: string
          location_confidence?: number | null
          location_current?: string | null
          location_match?: boolean | null
          location_scraped?: string | null
          materials_confidence?: number | null
          materials_current?: string[] | null
          materials_match?: boolean | null
          materials_scraped?: string[] | null
          notes?: string | null
          overall_confidence?: number | null
          overall_match?: boolean | null
          pages_scraped?: number | null
          puppeteer_success?: boolean | null
          reviewed?: boolean | null
          scraped_at?: string
          scraped_content?: Json | null
          scraping_errors?: Json | null
          scraping_time_ms?: number | null
          supplier_id?: string
          supplier_name?: string
          supplier_website?: string | null
          technologies_confidence?: number | null
          technologies_current?: string[] | null
          technologies_match?: boolean | null
          technologies_scraped?: string[] | null
          updated_at?: string
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
      reset_monthly_validation_counter: { Args: never; Returns: undefined }
      trigger_validation: { Args: never; Returns: Json }
    }
    Enums: {
      app_role: "admin" | "user"
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
      app_role: ["admin", "user"],
    },
  },
} as const
