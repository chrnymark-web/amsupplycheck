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
    PostgrestVersion: "14.4"
  }
  graphql_public: {
    Tables: {
      [_ in never]: never
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      graphql: {
        Args: {
          extensions?: Json
          operationName?: string
          query?: string
          variables?: Json
        }
        Returns: Json
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
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
      crm_activity_log: {
        Row: {
          action: string
          created_at: string
          deal_id: string
          details: Json | null
          id: string
          user_id: string | null
        }
        Insert: {
          action: string
          created_at?: string
          deal_id: string
          details?: Json | null
          id?: string
          user_id?: string | null
        }
        Update: {
          action?: string
          created_at?: string
          deal_id?: string
          details?: Json | null
          id?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "crm_activity_log_deal_id_fkey"
            columns: ["deal_id"]
            isOneToOne: false
            referencedRelation: "crm_deals"
            referencedColumns: ["id"]
          },
        ]
      }
      crm_comments: {
        Row: {
          body: string
          created_at: string
          deal_id: string
          id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          body: string
          created_at?: string
          deal_id: string
          id?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          body?: string
          created_at?: string
          deal_id?: string
          id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "crm_comments_deal_id_fkey"
            columns: ["deal_id"]
            isOneToOne: false
            referencedRelation: "crm_deals"
            referencedColumns: ["id"]
          },
        ]
      }
      crm_deal_labels: {
        Row: {
          deal_id: string
          label_id: string
        }
        Insert: {
          deal_id: string
          label_id: string
        }
        Update: {
          deal_id?: string
          label_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "crm_deal_labels_deal_id_fkey"
            columns: ["deal_id"]
            isOneToOne: false
            referencedRelation: "crm_deals"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "crm_deal_labels_label_id_fkey"
            columns: ["label_id"]
            isOneToOne: false
            referencedRelation: "crm_labels"
            referencedColumns: ["id"]
          },
        ]
      }
      crm_deals: {
        Row: {
          archived: boolean
          assigned_to: string | null
          contact_email: string
          contact_name: string
          created_at: string
          deal_value: number | null
          due_date: string | null
          id: string
          material: string | null
          position: number
          project_description: string | null
          quote_request_id: string | null
          source_page: string | null
          stage_id: string
          supplier_context: string | null
          technology: string | null
          title: string
          updated_at: string
          volume: string | null
        }
        Insert: {
          archived?: boolean
          assigned_to?: string | null
          contact_email: string
          contact_name: string
          created_at?: string
          deal_value?: number | null
          due_date?: string | null
          id?: string
          material?: string | null
          position?: number
          project_description?: string | null
          quote_request_id?: string | null
          source_page?: string | null
          stage_id: string
          supplier_context?: string | null
          technology?: string | null
          title: string
          updated_at?: string
          volume?: string | null
        }
        Update: {
          archived?: boolean
          assigned_to?: string | null
          contact_email?: string
          contact_name?: string
          created_at?: string
          deal_value?: number | null
          due_date?: string | null
          id?: string
          material?: string | null
          position?: number
          project_description?: string | null
          quote_request_id?: string | null
          source_page?: string | null
          stage_id?: string
          supplier_context?: string | null
          technology?: string | null
          title?: string
          updated_at?: string
          volume?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "crm_deals_quote_request_id_fkey"
            columns: ["quote_request_id"]
            isOneToOne: false
            referencedRelation: "quote_requests"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "crm_deals_stage_id_fkey"
            columns: ["stage_id"]
            isOneToOne: false
            referencedRelation: "crm_pipeline_stages"
            referencedColumns: ["id"]
          },
        ]
      }
      crm_labels: {
        Row: {
          color: string
          created_at: string
          id: string
          name: string
        }
        Insert: {
          color?: string
          created_at?: string
          id?: string
          name: string
        }
        Update: {
          color?: string
          created_at?: string
          id?: string
          name?: string
        }
        Relationships: []
      }
      crm_pipeline_stages: {
        Row: {
          color: string
          created_at: string
          id: string
          is_loss: boolean
          is_win: boolean
          name: string
          position: number
          slug: string
        }
        Insert: {
          color?: string
          created_at?: string
          id?: string
          is_loss?: boolean
          is_win?: boolean
          name: string
          position?: number
          slug: string
        }
        Update: {
          color?: string
          created_at?: string
          id?: string
          is_loss?: boolean
          is_win?: boolean
          name?: string
          position?: number
          slug?: string
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
          canonical_id: string | null
          category: string | null
          created_at: string
          description: string | null
          family: string | null
          hidden: boolean
          id: string
          is_category: boolean
          name: string
          slug: string
        }
        Insert: {
          canonical_id?: string | null
          category?: string | null
          created_at?: string
          description?: string | null
          family?: string | null
          hidden?: boolean
          id?: string
          is_category?: boolean
          name: string
          slug: string
        }
        Update: {
          canonical_id?: string | null
          category?: string | null
          created_at?: string
          description?: string | null
          family?: string | null
          hidden?: boolean
          id?: string
          is_category?: boolean
          name?: string
          slug?: string
        }
        Relationships: [
          {
            foreignKeyName: "materials_canonical_id_fkey"
            columns: ["canonical_id"]
            isOneToOne: false
            referencedRelation: "materials"
            referencedColumns: ["id"]
          },
        ]
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
      search_results: {
        Row: {
          completed_at: string | null
          created_at: string
          duration_ms: number | null
          error_message: string | null
          extracted_requirements: Json | null
          id: string
          matches: Json | null
          project_requirements: Json | null
          search_type: Database["public"]["Enums"]["search_type"]
          selected_material: string | null
          selected_technology: string | null
          status: Database["public"]["Enums"]["search_status"]
          stl_file_url: string | null
          stl_metrics: Json | null
          technology_rationale: Json | null
          total_suppliers_analyzed: number | null
          trigger_run_id: string | null
          user_id: string | null
        }
        Insert: {
          completed_at?: string | null
          created_at?: string
          duration_ms?: number | null
          error_message?: string | null
          extracted_requirements?: Json | null
          id?: string
          matches?: Json | null
          project_requirements?: Json | null
          search_type: Database["public"]["Enums"]["search_type"]
          selected_material?: string | null
          selected_technology?: string | null
          status?: Database["public"]["Enums"]["search_status"]
          stl_file_url?: string | null
          stl_metrics?: Json | null
          technology_rationale?: Json | null
          total_suppliers_analyzed?: number | null
          trigger_run_id?: string | null
          user_id?: string | null
        }
        Update: {
          completed_at?: string | null
          created_at?: string
          duration_ms?: number | null
          error_message?: string | null
          extracted_requirements?: Json | null
          id?: string
          matches?: Json | null
          project_requirements?: Json | null
          search_type?: Database["public"]["Enums"]["search_type"]
          selected_material?: string | null
          selected_technology?: string | null
          status?: Database["public"]["Enums"]["search_status"]
          stl_file_url?: string | null
          stl_metrics?: Json | null
          technology_rationale?: Json | null
          total_suppliers_analyzed?: number | null
          trigger_run_id?: string | null
          user_id?: string | null
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
          is_3d_printing_provider: boolean | null
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
          is_3d_printing_provider?: boolean | null
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
          is_3d_printing_provider?: boolean | null
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
        Relationships: []
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
          canonical_id: string | null
          category: string | null
          created_at: string
          description: string | null
          hidden: boolean
          id: string
          name: string
          slug: string
        }
        Insert: {
          canonical_id?: string | null
          category?: string | null
          created_at?: string
          description?: string | null
          hidden?: boolean
          id?: string
          name: string
          slug: string
        }
        Update: {
          canonical_id?: string | null
          category?: string | null
          created_at?: string
          description?: string | null
          hidden?: boolean
          id?: string
          name?: string
          slug?: string
        }
        Relationships: [
          {
            foreignKeyName: "technologies_canonical_id_fkey"
            columns: ["canonical_id"]
            isOneToOne: false
            referencedRelation: "technologies"
            referencedColumns: ["id"]
          },
        ]
      }
      technology_children: {
        Row: {
          child_technology_id: string
          created_at: string
          id: string
          parent_technology_id: string
        }
        Insert: {
          child_technology_id: string
          created_at?: string
          id?: string
          parent_technology_id: string
        }
        Update: {
          child_technology_id?: string
          created_at?: string
          id?: string
          parent_technology_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "technology_children_child_technology_id_fkey"
            columns: ["child_technology_id"]
            isOneToOne: false
            referencedRelation: "technologies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "technology_children_parent_technology_id_fkey"
            columns: ["parent_technology_id"]
            isOneToOne: false
            referencedRelation: "technologies"
            referencedColumns: ["id"]
          },
        ]
      }
      technology_materials: {
        Row: {
          created_at: string
          id: string
          material_id: string
          modality: string | null
          notes: string | null
          source_citation: string | null
          technology_id: string
          tier: string
        }
        Insert: {
          created_at?: string
          id?: string
          material_id: string
          modality?: string | null
          notes?: string | null
          source_citation?: string | null
          technology_id: string
          tier: string
        }
        Update: {
          created_at?: string
          id?: string
          material_id?: string
          modality?: string | null
          notes?: string | null
          source_citation?: string | null
          technology_id?: string
          tier?: string
        }
        Relationships: [
          {
            foreignKeyName: "technology_materials_material_id_fkey"
            columns: ["material_id"]
            isOneToOne: false
            referencedRelation: "materials"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "technology_materials_technology_id_fkey"
            columns: ["technology_id"]
            isOneToOne: false
            referencedRelation: "technologies"
            referencedColumns: ["id"]
          },
        ]
      }
      upload_events: {
        Row: {
          created_at: string
          file_extension: string | null
          file_name: string | null
          file_size_bytes: number
          id: string
          session_id: string | null
          source_page: string
          storage_path: string | null
          user_agent: string | null
        }
        Insert: {
          created_at?: string
          file_extension?: string | null
          file_name?: string | null
          file_size_bytes: number
          id?: string
          session_id?: string | null
          source_page: string
          storage_path?: string | null
          user_agent?: string | null
        }
        Update: {
          created_at?: string
          file_extension?: string | null
          file_name?: string | null
          file_size_bytes?: number
          id?: string
          session_id?: string | null
          source_page?: string
          storage_path?: string | null
          user_agent?: string | null
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
          last_pause_at: string | null
          last_pause_reason: string | null
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
          last_pause_at?: string | null
          last_pause_reason?: string | null
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
          last_pause_at?: string | null
          last_pause_reason?: string | null
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
      technology_materials_resolved: {
        Row: {
          inherited_from_child: boolean | null
          material_id: string | null
          modality: string | null
          notes: string | null
          source_citation: string | null
          technology_id: string | null
          tier: string | null
        }
        Relationships: []
      }
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
      search_status:
        | "pending"
        | "analyzing"
        | "matching"
        | "ranking"
        | "completed"
        | "failed"
      search_type: "requirement" | "stl"
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
  graphql_public: {
    Enums: {},
  },
  public: {
    Enums: {
      app_role: ["admin", "user"],
      search_status: [
        "pending",
        "analyzing",
        "matching",
        "ranking",
        "completed",
        "failed",
      ],
      search_type: ["requirement", "stl"],
    },
  },
} as const
