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
      article_bookmarks: {
        Row: {
          article_id: string
          article_image_url: string | null
          article_published_at: string | null
          article_source: string | null
          article_title: string
          article_url: string
          bookmarked_at: string | null
          id: string
          notes: string | null
          user_id: string
        }
        Insert: {
          article_id: string
          article_image_url?: string | null
          article_published_at?: string | null
          article_source?: string | null
          article_title: string
          article_url: string
          bookmarked_at?: string | null
          id?: string
          notes?: string | null
          user_id: string
        }
        Update: {
          article_id?: string
          article_image_url?: string | null
          article_published_at?: string | null
          article_source?: string | null
          article_title?: string
          article_url?: string
          bookmarked_at?: string | null
          id?: string
          notes?: string | null
          user_id?: string
        }
        Relationships: []
      }
      audit_logs: {
        Row: {
          action: string
          created_at: string
          id: string
          ip_address: unknown
          new_values: Json | null
          old_values: Json | null
          record_id: string | null
          table_name: string | null
          tenant_id: string | null
          user_agent: string | null
          user_id: string | null
        }
        Insert: {
          action: string
          created_at?: string
          id?: string
          ip_address?: unknown
          new_values?: Json | null
          old_values?: Json | null
          record_id?: string | null
          table_name?: string | null
          tenant_id?: string | null
          user_agent?: string | null
          user_id?: string | null
        }
        Update: {
          action?: string
          created_at?: string
          id?: string
          ip_address?: unknown
          new_values?: Json | null
          old_values?: Json | null
          record_id?: string | null
          table_name?: string | null
          tenant_id?: string | null
          user_agent?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "audit_logs_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      bid_comments: {
        Row: {
          bid_id: string
          comment: string
          comment_type: string
          created_at: string
          id: string
          is_internal: boolean | null
          updated_at: string
          user_id: string
        }
        Insert: {
          bid_id: string
          comment: string
          comment_type?: string
          created_at?: string
          id?: string
          is_internal?: boolean | null
          updated_at?: string
          user_id: string
        }
        Update: {
          bid_id?: string
          comment?: string
          comment_type?: string
          created_at?: string
          id?: string
          is_internal?: boolean | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "bid_comments_bid_id_fkey"
            columns: ["bid_id"]
            isOneToOne: false
            referencedRelation: "vendor_bids"
            referencedColumns: ["id"]
          },
        ]
      }
      bid_lines: {
        Row: {
          id: string
          notes: string | null
          rfq_lot_id: string
          submitted_at: string
          unit_price: number
          vendor_id: string
        }
        Insert: {
          id?: string
          notes?: string | null
          rfq_lot_id: string
          submitted_at?: string
          unit_price: number
          vendor_id: string
        }
        Update: {
          id?: string
          notes?: string | null
          rfq_lot_id?: string
          submitted_at?: string
          unit_price?: number
          vendor_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "bid_lines_rfq_lot_id_fkey"
            columns: ["rfq_lot_id"]
            isOneToOne: false
            referencedRelation: "rfq_lots"
            referencedColumns: ["id"]
          },
        ]
      }
      bid_scores: {
        Row: {
          bid_id: string
          completion_rate_score: number | null
          id: string
          price_score: number | null
          rating_score: number | null
          response_time_score: number | null
          scored_at: string | null
          scored_by: string | null
          tier_bonus: number | null
          total_score: number | null
        }
        Insert: {
          bid_id: string
          completion_rate_score?: number | null
          id?: string
          price_score?: number | null
          rating_score?: number | null
          response_time_score?: number | null
          scored_at?: string | null
          scored_by?: string | null
          tier_bonus?: number | null
          total_score?: number | null
        }
        Update: {
          bid_id?: string
          completion_rate_score?: number | null
          id?: string
          price_score?: number | null
          rating_score?: number | null
          response_time_score?: number | null
          scored_at?: string | null
          scored_by?: string | null
          tier_bonus?: number | null
          total_score?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "bid_scores_bid_id_fkey"
            columns: ["bid_id"]
            isOneToOne: false
            referencedRelation: "vendor_bids"
            referencedColumns: ["id"]
          },
        ]
      }
      bookings: {
        Row: {
          check_in_date: string
          check_out_date: string
          created_at: string | null
          guest_details: Json | null
          guests: number
          id: string
          payment_status: string | null
          property_id: number | null
          special_requests: string | null
          status: string | null
          total_amount: number
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          check_in_date: string
          check_out_date: string
          created_at?: string | null
          guest_details?: Json | null
          guests?: number
          id?: string
          payment_status?: string | null
          property_id?: number | null
          special_requests?: string | null
          status?: string | null
          total_amount: number
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          check_in_date?: string
          check_out_date?: string
          created_at?: string | null
          guest_details?: Json | null
          guests?: number
          id?: string
          payment_status?: string | null
          property_id?: number | null
          special_requests?: string | null
          status?: string | null
          total_amount?: number
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "bookings_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "properties"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bookings_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "public_property_listings_masked"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bookings_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "safe_property_listings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bookings_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      compliance_docs: {
        Row: {
          doc_name: string
          doc_type: string
          expiry_date: string | null
          file_path: string
          file_url: string | null
          id: string
          status: string
          tenant_id: string
          uploaded_at: string
          vendor_id: string
          verified_at: string | null
          verified_by: string | null
        }
        Insert: {
          doc_name: string
          doc_type: string
          expiry_date?: string | null
          file_path: string
          file_url?: string | null
          id?: string
          status?: string
          tenant_id: string
          uploaded_at?: string
          vendor_id: string
          verified_at?: string | null
          verified_by?: string | null
        }
        Update: {
          doc_name?: string
          doc_type?: string
          expiry_date?: string | null
          file_path?: string
          file_url?: string | null
          id?: string
          status?: string
          tenant_id?: string
          uploaded_at?: string
          vendor_id?: string
          verified_at?: string | null
          verified_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "compliance_docs_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      contracts: {
        Row: {
          contract_number: string
          contract_value: number
          created_at: string
          created_by: string
          description: string | null
          end_date: string
          id: string
          project_id: string | null
          rfq_id: string | null
          start_date: string
          status: string
          tenant_id: string
          terms: Json | null
          title: string
          updated_at: string
          vendor_id: string
        }
        Insert: {
          contract_number: string
          contract_value: number
          created_at?: string
          created_by: string
          description?: string | null
          end_date: string
          id?: string
          project_id?: string | null
          rfq_id?: string | null
          start_date: string
          status?: string
          tenant_id: string
          terms?: Json | null
          title: string
          updated_at?: string
          vendor_id: string
        }
        Update: {
          contract_number?: string
          contract_value?: number
          created_at?: string
          created_by?: string
          description?: string | null
          end_date?: string
          id?: string
          project_id?: string | null
          rfq_id?: string | null
          start_date?: string
          status?: string
          tenant_id?: string
          terms?: Json | null
          title?: string
          updated_at?: string
          vendor_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "contracts_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contracts_rfq_id_fkey"
            columns: ["rfq_id"]
            isOneToOne: false
            referencedRelation: "rfqs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contracts_rfq_id_fkey"
            columns: ["rfq_id"]
            isOneToOne: false
            referencedRelation: "rfqs_public_masked"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contracts_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      documents: {
        Row: {
          file_name: string
          file_path: string
          file_size: number | null
          file_url: string | null
          id: string
          mime_type: string | null
          related_to_id: string | null
          related_to_type: string
          tenant_id: string
          uploaded_at: string
          uploaded_by: string
        }
        Insert: {
          file_name: string
          file_path: string
          file_size?: number | null
          file_url?: string | null
          id?: string
          mime_type?: string | null
          related_to_id?: string | null
          related_to_type: string
          tenant_id: string
          uploaded_at?: string
          uploaded_by: string
        }
        Update: {
          file_name?: string
          file_path?: string
          file_size?: number | null
          file_url?: string | null
          id?: string
          mime_type?: string | null
          related_to_id?: string | null
          related_to_type?: string
          tenant_id?: string
          uploaded_at?: string
          uploaded_by?: string
        }
        Relationships: [
          {
            foreignKeyName: "documents_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      email_templates: {
        Row: {
          created_at: string | null
          html_content: string
          id: string
          is_active: boolean | null
          name: string
          subject: string
          text_content: string | null
          updated_at: string | null
          variables: Json | null
        }
        Insert: {
          created_at?: string | null
          html_content: string
          id?: string
          is_active?: boolean | null
          name: string
          subject: string
          text_content?: string | null
          updated_at?: string | null
          variables?: Json | null
        }
        Update: {
          created_at?: string | null
          html_content?: string
          id?: string
          is_active?: boolean | null
          name?: string
          subject?: string
          text_content?: string | null
          updated_at?: string | null
          variables?: Json | null
        }
        Relationships: []
      }
      financial_reports: {
        Row: {
          created_at: string
          data: Json | null
          generated_by: string
          id: string
          net_profit: number | null
          period_end: string
          period_start: string
          report_type: string
          title: string
          total_expenses: number | null
          total_revenue: number | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          data?: Json | null
          generated_by: string
          id?: string
          net_profit?: number | null
          period_end: string
          period_start: string
          report_type: string
          title: string
          total_expenses?: number | null
          total_revenue?: number | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          data?: Json | null
          generated_by?: string
          id?: string
          net_profit?: number | null
          period_end?: string
          period_start?: string
          report_type?: string
          title?: string
          total_expenses?: number | null
          total_revenue?: number | null
          updated_at?: string
        }
        Relationships: []
      }
      invoices: {
        Row: {
          amount: number
          client_email: string
          client_name: string
          created_at: string
          created_by: string
          currency: string
          description: string | null
          due_date: string | null
          id: string
          invoice_number: string
          invoice_type: string | null
          line_items: Json | null
          milestone_id: string | null
          project_id: string | null
          status: string
          tenant_id: string | null
          updated_at: string
          vendor_id: string | null
        }
        Insert: {
          amount?: number
          client_email: string
          client_name: string
          created_at?: string
          created_by: string
          currency?: string
          description?: string | null
          due_date?: string | null
          id?: string
          invoice_number: string
          invoice_type?: string | null
          line_items?: Json | null
          milestone_id?: string | null
          project_id?: string | null
          status?: string
          tenant_id?: string | null
          updated_at?: string
          vendor_id?: string | null
        }
        Update: {
          amount?: number
          client_email?: string
          client_name?: string
          created_at?: string
          created_by?: string
          currency?: string
          description?: string | null
          due_date?: string | null
          id?: string
          invoice_number?: string
          invoice_type?: string | null
          line_items?: Json | null
          milestone_id?: string | null
          project_id?: string | null
          status?: string
          tenant_id?: string | null
          updated_at?: string
          vendor_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "invoices_milestone_id_fkey"
            columns: ["milestone_id"]
            isOneToOne: false
            referencedRelation: "project_milestones"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "invoices_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "invoices_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      maintenance_requests: {
        Row: {
          actual_cost: number | null
          assigned_vendor_id: string | null
          assigned_vendor_name: string | null
          category: string
          completed_date: string | null
          cost_estimate: number | null
          created_at: string
          description: string
          id: string
          images: string[] | null
          notes: string | null
          priority: string
          property_id: string
          property_name: string
          scheduled_date: string | null
          status: string
          tenant_id: string | null
          title: string
          updated_at: string
        }
        Insert: {
          actual_cost?: number | null
          assigned_vendor_id?: string | null
          assigned_vendor_name?: string | null
          category: string
          completed_date?: string | null
          cost_estimate?: number | null
          created_at?: string
          description: string
          id?: string
          images?: string[] | null
          notes?: string | null
          priority?: string
          property_id: string
          property_name: string
          scheduled_date?: string | null
          status?: string
          tenant_id?: string | null
          title: string
          updated_at?: string
        }
        Update: {
          actual_cost?: number | null
          assigned_vendor_id?: string | null
          assigned_vendor_name?: string | null
          category?: string
          completed_date?: string | null
          cost_estimate?: number | null
          created_at?: string
          description?: string
          id?: string
          images?: string[] | null
          notes?: string | null
          priority?: string
          property_id?: string
          property_name?: string
          scheduled_date?: string | null
          status?: string
          tenant_id?: string | null
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      messages: {
        Row: {
          content: string
          created_at: string
          id: string
          is_read: boolean | null
          parent_message_id: string | null
          recipient_id: string
          sender_id: string
          subject: string
          updated_at: string
        }
        Insert: {
          content: string
          created_at?: string
          id?: string
          is_read?: boolean | null
          parent_message_id?: string | null
          recipient_id: string
          sender_id: string
          subject: string
          updated_at?: string
        }
        Update: {
          content?: string
          created_at?: string
          id?: string
          is_read?: boolean | null
          parent_message_id?: string | null
          recipient_id?: string
          sender_id?: string
          subject?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "messages_parent_message_id_fkey"
            columns: ["parent_message_id"]
            isOneToOne: false
            referencedRelation: "messages"
            referencedColumns: ["id"]
          },
        ]
      }
      milestone_deliverables: {
        Row: {
          approved_at: string | null
          approved_by: string | null
          file_name: string
          file_path: string
          file_size: number | null
          file_url: string | null
          id: string
          is_approved: boolean | null
          milestone_id: string
          mime_type: string | null
          uploaded_at: string
          uploaded_by: string
        }
        Insert: {
          approved_at?: string | null
          approved_by?: string | null
          file_name: string
          file_path: string
          file_size?: number | null
          file_url?: string | null
          id?: string
          is_approved?: boolean | null
          milestone_id: string
          mime_type?: string | null
          uploaded_at?: string
          uploaded_by: string
        }
        Update: {
          approved_at?: string | null
          approved_by?: string | null
          file_name?: string
          file_path?: string
          file_size?: number | null
          file_url?: string | null
          id?: string
          is_approved?: boolean | null
          milestone_id?: string
          mime_type?: string | null
          uploaded_at?: string
          uploaded_by?: string
        }
        Relationships: [
          {
            foreignKeyName: "milestone_deliverables_milestone_id_fkey"
            columns: ["milestone_id"]
            isOneToOne: false
            referencedRelation: "project_milestones"
            referencedColumns: ["id"]
          },
        ]
      }
      news_analytics: {
        Row: {
          article_id: string
          article_title: string | null
          category: string | null
          created_at: string | null
          event_type: string
          id: string
          session_id: string | null
          source: string | null
          user_id: string | null
        }
        Insert: {
          article_id: string
          article_title?: string | null
          category?: string | null
          created_at?: string | null
          event_type: string
          id?: string
          session_id?: string | null
          source?: string | null
          user_id?: string | null
        }
        Update: {
          article_id?: string
          article_title?: string | null
          category?: string | null
          created_at?: string | null
          event_type?: string
          id?: string
          session_id?: string | null
          source?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      news_articles: {
        Row: {
          author: string | null
          category: string | null
          content: string | null
          created_at: string | null
          created_by: string | null
          description: string | null
          external_id: string | null
          id: string
          image_url: string | null
          is_featured: boolean | null
          is_published: boolean | null
          published_at: string
          source: string
          source_type: string
          title: string
          updated_at: string | null
          url: string
        }
        Insert: {
          author?: string | null
          category?: string | null
          content?: string | null
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          external_id?: string | null
          id?: string
          image_url?: string | null
          is_featured?: boolean | null
          is_published?: boolean | null
          published_at?: string
          source: string
          source_type: string
          title: string
          updated_at?: string | null
          url: string
        }
        Update: {
          author?: string | null
          category?: string | null
          content?: string | null
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          external_id?: string | null
          id?: string
          image_url?: string | null
          is_featured?: boolean | null
          is_published?: boolean | null
          published_at?: string
          source?: string
          source_type?: string
          title?: string
          updated_at?: string | null
          url?: string
        }
        Relationships: []
      }
      newsletter_subscriptions: {
        Row: {
          categories: string[] | null
          confirmed_at: string | null
          created_at: string | null
          email: string
          id: string
          is_active: boolean | null
          subscription_type: string | null
          unsubscribed_at: string | null
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          categories?: string[] | null
          confirmed_at?: string | null
          created_at?: string | null
          email: string
          id?: string
          is_active?: boolean | null
          subscription_type?: string | null
          unsubscribed_at?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          categories?: string[] | null
          confirmed_at?: string | null
          created_at?: string | null
          email?: string
          id?: string
          is_active?: boolean | null
          subscription_type?: string | null
          unsubscribed_at?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      notifications: {
        Row: {
          action_url: string | null
          category: string | null
          created_at: string
          id: string
          message: string
          priority: string | null
          read: boolean | null
          title: string
          type: string
          user_id: string
        }
        Insert: {
          action_url?: string | null
          category?: string | null
          created_at?: string
          id?: string
          message: string
          priority?: string | null
          read?: boolean | null
          title: string
          type?: string
          user_id: string
        }
        Update: {
          action_url?: string | null
          category?: string | null
          created_at?: string
          id?: string
          message?: string
          priority?: string | null
          read?: boolean | null
          title?: string
          type?: string
          user_id?: string
        }
        Relationships: []
      }
      payment_documents: {
        Row: {
          file_name: string
          file_path: string
          file_size: number | null
          file_type: string
          id: string
          payment_id: string
          uploaded_at: string
          uploaded_by: string
        }
        Insert: {
          file_name: string
          file_path: string
          file_size?: number | null
          file_type: string
          id?: string
          payment_id: string
          uploaded_at?: string
          uploaded_by: string
        }
        Update: {
          file_name?: string
          file_path?: string
          file_size?: number | null
          file_type?: string
          id?: string
          payment_id?: string
          uploaded_at?: string
          uploaded_by?: string
        }
        Relationships: [
          {
            foreignKeyName: "payment_documents_payment_id_fkey"
            columns: ["payment_id"]
            isOneToOne: false
            referencedRelation: "vendor_payments"
            referencedColumns: ["id"]
          },
        ]
      }
      payment_refunds: {
        Row: {
          admin_notes: string | null
          amount: number
          created_at: string | null
          id: string
          payment_id: string | null
          processed_at: string | null
          processed_by: string | null
          reason: string
          requested_by: string | null
          status: string | null
          stripe_refund_id: string | null
          updated_at: string | null
        }
        Insert: {
          admin_notes?: string | null
          amount: number
          created_at?: string | null
          id?: string
          payment_id?: string | null
          processed_at?: string | null
          processed_by?: string | null
          reason: string
          requested_by?: string | null
          status?: string | null
          stripe_refund_id?: string | null
          updated_at?: string | null
        }
        Update: {
          admin_notes?: string | null
          amount?: number
          created_at?: string | null
          id?: string
          payment_id?: string | null
          processed_at?: string | null
          processed_by?: string | null
          reason?: string
          requested_by?: string | null
          status?: string | null
          stripe_refund_id?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "payment_refunds_payment_id_fkey"
            columns: ["payment_id"]
            isOneToOne: false
            referencedRelation: "vendor_payments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payment_refunds_processed_by_fkey"
            columns: ["processed_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payment_refunds_requested_by_fkey"
            columns: ["requested_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      payment_templates: {
        Row: {
          amount: number
          created_at: string
          created_by: string
          description: string | null
          id: string
          is_active: boolean | null
          name: string
          payment_type: string
          updated_at: string
        }
        Insert: {
          amount: number
          created_at?: string
          created_by: string
          description?: string | null
          id?: string
          is_active?: boolean | null
          name: string
          payment_type: string
          updated_at?: string
        }
        Update: {
          amount?: number
          created_at?: string
          created_by?: string
          description?: string | null
          id?: string
          is_active?: boolean | null
          name?: string
          payment_type?: string
          updated_at?: string
        }
        Relationships: []
      }
      payments: {
        Row: {
          amount: number
          contract_id: string | null
          created_at: string
          created_by: string
          id: string
          invoice_id: string | null
          notes: string | null
          payment_date: string
          payment_method: string | null
          reference_number: string | null
          status: string
          tenant_id: string
          updated_at: string
        }
        Insert: {
          amount: number
          contract_id?: string | null
          created_at?: string
          created_by: string
          id?: string
          invoice_id?: string | null
          notes?: string | null
          payment_date: string
          payment_method?: string | null
          reference_number?: string | null
          status?: string
          tenant_id: string
          updated_at?: string
        }
        Update: {
          amount?: number
          contract_id?: string | null
          created_at?: string
          created_by?: string
          id?: string
          invoice_id?: string | null
          notes?: string | null
          payment_date?: string
          payment_method?: string | null
          reference_number?: string | null
          status?: string
          tenant_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "payments_contract_id_fkey"
            columns: ["contract_id"]
            isOneToOne: false
            referencedRelation: "contracts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payments_invoice_id_fkey"
            columns: ["invoice_id"]
            isOneToOne: false
            referencedRelation: "invoices"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payments_invoice_id_fkey"
            columns: ["invoice_id"]
            isOneToOne: false
            referencedRelation: "vendor_invoice_summary"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payments_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      profile_name_audit: {
        Row: {
          change_reason: string | null
          changed_at: string
          changed_by: string | null
          id: string
          ip_address: unknown
          new_name: string
          old_name: string | null
          profile_id: string
          user_agent: string | null
        }
        Insert: {
          change_reason?: string | null
          changed_at?: string
          changed_by?: string | null
          id?: string
          ip_address?: unknown
          new_name: string
          old_name?: string | null
          profile_id: string
          user_agent?: string | null
        }
        Update: {
          change_reason?: string | null
          changed_at?: string
          changed_by?: string | null
          id?: string
          ip_address?: unknown
          new_name?: string
          old_name?: string | null
          profile_id?: string
          user_agent?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "profile_name_audit_changed_by_fkey"
            columns: ["changed_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "profile_name_audit_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      profile_photos: {
        Row: {
          file_name: string
          file_path: string
          file_size: number | null
          id: string
          is_active: boolean | null
          mime_type: string | null
          uploaded_at: string | null
          user_id: string
        }
        Insert: {
          file_name: string
          file_path: string
          file_size?: number | null
          id?: string
          is_active?: boolean | null
          mime_type?: string | null
          uploaded_at?: string | null
          user_id: string
        }
        Update: {
          file_name?: string
          file_path?: string
          file_size?: number | null
          id?: string
          is_active?: boolean | null
          mime_type?: string | null
          uploaded_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          address: string | null
          avatar_url: string | null
          city: string | null
          created_at: string | null
          email: string
          full_name: string | null
          id: string
          phone: string | null
          role: string | null
          sms_enabled: boolean | null
          state: string | null
          status: string | null
          tenant_id: string | null
          updated_at: string | null
          zip_code: string | null
        }
        Insert: {
          address?: string | null
          avatar_url?: string | null
          city?: string | null
          created_at?: string | null
          email: string
          full_name?: string | null
          id: string
          phone?: string | null
          role?: string | null
          sms_enabled?: boolean | null
          state?: string | null
          status?: string | null
          tenant_id?: string | null
          updated_at?: string | null
          zip_code?: string | null
        }
        Update: {
          address?: string | null
          avatar_url?: string | null
          city?: string | null
          created_at?: string | null
          email?: string
          full_name?: string | null
          id?: string
          phone?: string | null
          role?: string | null
          sms_enabled?: boolean | null
          state?: string | null
          status?: string | null
          tenant_id?: string | null
          updated_at?: string | null
          zip_code?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "profiles_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      project_assignments: {
        Row: {
          assigned_at: string
          assigned_by: string
          estimated_hours: number | null
          hourly_rate: number | null
          id: string
          project_id: string
          status: string
          vendor_id: string
        }
        Insert: {
          assigned_at?: string
          assigned_by: string
          estimated_hours?: number | null
          hourly_rate?: number | null
          id?: string
          project_id: string
          status?: string
          vendor_id: string
        }
        Update: {
          assigned_at?: string
          assigned_by?: string
          estimated_hours?: number | null
          hourly_rate?: number | null
          id?: string
          project_id?: string
          status?: string
          vendor_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "project_assignments_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      project_documents: {
        Row: {
          created_at: string | null
          file_name: string
          file_path: string
          file_size: number | null
          file_type: string
          id: string
          is_required_for_bidding: boolean | null
          project_id: string | null
          uploaded_by: string | null
        }
        Insert: {
          created_at?: string | null
          file_name: string
          file_path: string
          file_size?: number | null
          file_type: string
          id?: string
          is_required_for_bidding?: boolean | null
          project_id?: string | null
          uploaded_by?: string | null
        }
        Update: {
          created_at?: string | null
          file_name?: string
          file_path?: string
          file_size?: number | null
          file_type?: string
          id?: string
          is_required_for_bidding?: boolean | null
          project_id?: string | null
          uploaded_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "project_documents_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "project_documents_uploaded_by_fkey"
            columns: ["uploaded_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      project_milestones: {
        Row: {
          amount: number
          completed_by: string | null
          completion_date: string | null
          created_at: string
          description: string | null
          due_date: string | null
          id: string
          name: string
          order_index: number
          project_id: string
          status: string
          updated_at: string
        }
        Insert: {
          amount?: number
          completed_by?: string | null
          completion_date?: string | null
          created_at?: string
          description?: string | null
          due_date?: string | null
          id?: string
          name: string
          order_index?: number
          project_id: string
          status?: string
          updated_at?: string
        }
        Update: {
          amount?: number
          completed_by?: string | null
          completion_date?: string | null
          created_at?: string
          description?: string | null
          due_date?: string | null
          id?: string
          name?: string
          order_index?: number
          project_id?: string
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "project_milestones_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      projects: {
        Row: {
          assigned_vendor_id: string | null
          attachments: string[] | null
          budget_max: number | null
          budget_min: number | null
          category: string
          created_at: string
          created_by: string
          deadline: string | null
          description: string | null
          documents: Json | null
          id: string
          location: string | null
          preferred_start_date: string | null
          priority: string
          property_id: number | null
          requirements_documents: string[] | null
          skills_required: string[] | null
          status: string
          tenant_id: string | null
          title: string
          updated_at: string
        }
        Insert: {
          assigned_vendor_id?: string | null
          attachments?: string[] | null
          budget_max?: number | null
          budget_min?: number | null
          category: string
          created_at?: string
          created_by: string
          deadline?: string | null
          description?: string | null
          documents?: Json | null
          id?: string
          location?: string | null
          preferred_start_date?: string | null
          priority?: string
          property_id?: number | null
          requirements_documents?: string[] | null
          skills_required?: string[] | null
          status?: string
          tenant_id?: string | null
          title: string
          updated_at?: string
        }
        Update: {
          assigned_vendor_id?: string | null
          attachments?: string[] | null
          budget_max?: number | null
          budget_min?: number | null
          category?: string
          created_at?: string
          created_by?: string
          deadline?: string | null
          description?: string | null
          documents?: Json | null
          id?: string
          location?: string | null
          preferred_start_date?: string | null
          priority?: string
          property_id?: number | null
          requirements_documents?: string[] | null
          skills_required?: string[] | null
          status?: string
          tenant_id?: string | null
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "projects_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      properties: {
        Row: {
          address: string | null
          amenities: string | null
          available_date: string | null
          bathrooms: number | null
          bedrooms: number | null
          city: string | null
          description: string | null
          id: number
          image_urls: string | null
          latitude: number | null
          longitude: number | null
          owner_id: string | null
          price: number | null
          property_type: string | null
          square_feet: string | null
          state: string | null
          status: string | null
          title: string | null
          zip_code: number | null
        }
        Insert: {
          address?: string | null
          amenities?: string | null
          available_date?: string | null
          bathrooms?: number | null
          bedrooms?: number | null
          city?: string | null
          description?: string | null
          id?: number
          image_urls?: string | null
          latitude?: number | null
          longitude?: number | null
          owner_id?: string | null
          price?: number | null
          property_type?: string | null
          square_feet?: string | null
          state?: string | null
          status?: string | null
          title?: string | null
          zip_code?: number | null
        }
        Update: {
          address?: string | null
          amenities?: string | null
          available_date?: string | null
          bathrooms?: number | null
          bedrooms?: number | null
          city?: string | null
          description?: string | null
          id?: number
          image_urls?: string | null
          latitude?: number | null
          longitude?: number | null
          owner_id?: string | null
          price?: number | null
          property_type?: string | null
          square_feet?: string | null
          state?: string | null
          status?: string | null
          title?: string | null
          zip_code?: number | null
        }
        Relationships: []
      }
      property_inquiries: {
        Row: {
          created_at: string | null
          email: string
          id: string
          inquiry_type: string | null
          message: string
          name: string
          phone: string | null
          property_id: number | null
          status: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          email: string
          id?: string
          inquiry_type?: string | null
          message: string
          name: string
          phone?: string | null
          property_id?: number | null
          status?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          email?: string
          id?: string
          inquiry_type?: string | null
          message?: string
          name?: string
          phone?: string | null
          property_id?: number | null
          status?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "property_inquiries_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "properties"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "property_inquiries_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "public_property_listings_masked"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "property_inquiries_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "safe_property_listings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "property_inquiries_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      protected_admins: {
        Row: {
          protected_at: string
          protected_by: string | null
          reason: string | null
          user_id: string
        }
        Insert: {
          protected_at?: string
          protected_by?: string | null
          reason?: string | null
          user_id: string
        }
        Update: {
          protected_at?: string
          protected_by?: string | null
          reason?: string | null
          user_id?: string
        }
        Relationships: []
      }
      quick_quote_requests: {
        Row: {
          budget_max: number | null
          budget_min: number | null
          contact_email: string | null
          contact_name: string | null
          contact_phone: string | null
          created_at: string | null
          description: string
          expires_at: string | null
          id: string
          location_address: string | null
          location_city: string | null
          location_zip: string | null
          preferred_start_date: string | null
          property_id: number | null
          property_manager_id: string | null
          service_category: string
          status: string | null
          title: string
          updated_at: string | null
          urgency: string | null
        }
        Insert: {
          budget_max?: number | null
          budget_min?: number | null
          contact_email?: string | null
          contact_name?: string | null
          contact_phone?: string | null
          created_at?: string | null
          description: string
          expires_at?: string | null
          id?: string
          location_address?: string | null
          location_city?: string | null
          location_zip?: string | null
          preferred_start_date?: string | null
          property_id?: number | null
          property_manager_id?: string | null
          service_category: string
          status?: string | null
          title: string
          updated_at?: string | null
          urgency?: string | null
        }
        Update: {
          budget_max?: number | null
          budget_min?: number | null
          contact_email?: string | null
          contact_name?: string | null
          contact_phone?: string | null
          created_at?: string | null
          description?: string
          expires_at?: string | null
          id?: string
          location_address?: string | null
          location_city?: string | null
          location_zip?: string | null
          preferred_start_date?: string | null
          property_id?: number | null
          property_manager_id?: string | null
          service_category?: string
          status?: string | null
          title?: string
          updated_at?: string | null
          urgency?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "quick_quote_requests_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "properties"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "quick_quote_requests_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "public_property_listings_masked"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "quick_quote_requests_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "safe_property_listings"
            referencedColumns: ["id"]
          },
        ]
      }
      rate_limits: {
        Row: {
          created_at: string | null
          endpoint: string
          id: string
          identifier: string
          requests_count: number
          window_start: string
        }
        Insert: {
          created_at?: string | null
          endpoint: string
          id?: string
          identifier: string
          requests_count?: number
          window_start: string
        }
        Update: {
          created_at?: string | null
          endpoint?: string
          id?: string
          identifier?: string
          requests_count?: number
          window_start?: string
        }
        Relationships: []
      }
      rfq_access_grants: {
        Row: {
          granted_at: string
          granted_by: string | null
          id: string
          notes: string | null
          revoked_at: string | null
          rfq_id: string
          user_id: string
        }
        Insert: {
          granted_at?: string
          granted_by?: string | null
          id?: string
          notes?: string | null
          revoked_at?: string | null
          rfq_id: string
          user_id: string
        }
        Update: {
          granted_at?: string
          granted_by?: string | null
          id?: string
          notes?: string | null
          revoked_at?: string | null
          rfq_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "rfq_access_grants_rfq_id_fkey"
            columns: ["rfq_id"]
            isOneToOne: false
            referencedRelation: "rfqs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "rfq_access_grants_rfq_id_fkey"
            columns: ["rfq_id"]
            isOneToOne: false
            referencedRelation: "rfqs_public_masked"
            referencedColumns: ["id"]
          },
        ]
      }
      rfq_access_requests: {
        Row: {
          admin_notes: string | null
          company_name: string | null
          created_at: string
          email: string | null
          full_name: string | null
          id: string
          message: string | null
          phone: string | null
          reviewed_at: string | null
          reviewed_by: string | null
          rfi_answers: Json
          rfq_id: string
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          admin_notes?: string | null
          company_name?: string | null
          created_at?: string
          email?: string | null
          full_name?: string | null
          id?: string
          message?: string | null
          phone?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          rfi_answers?: Json
          rfq_id: string
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          admin_notes?: string | null
          company_name?: string | null
          created_at?: string
          email?: string | null
          full_name?: string | null
          id?: string
          message?: string | null
          phone?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          rfi_answers?: Json
          rfq_id?: string
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "rfq_access_requests_rfq_id_fkey"
            columns: ["rfq_id"]
            isOneToOne: false
            referencedRelation: "rfqs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "rfq_access_requests_rfq_id_fkey"
            columns: ["rfq_id"]
            isOneToOne: false
            referencedRelation: "rfqs_public_masked"
            referencedColumns: ["id"]
          },
        ]
      }
      rfq_audit_log: {
        Row: {
          action: string
          actor_id: string | null
          after_data: Json | null
          before_data: Json | null
          created_at: string
          entity_id: string | null
          entity_type: string
          id: string
          rfq_id: string | null
        }
        Insert: {
          action: string
          actor_id?: string | null
          after_data?: Json | null
          before_data?: Json | null
          created_at?: string
          entity_id?: string | null
          entity_type: string
          id?: string
          rfq_id?: string | null
        }
        Update: {
          action?: string
          actor_id?: string | null
          after_data?: Json | null
          before_data?: Json | null
          created_at?: string
          entity_id?: string | null
          entity_type?: string
          id?: string
          rfq_id?: string | null
        }
        Relationships: []
      }
      rfq_documents: {
        Row: {
          category_badge: string | null
          created_at: string | null
          document_type: string | null
          file_name: string
          file_path: string
          file_size: number | null
          file_url: string | null
          id: string
          is_required_for_bidding: boolean | null
          mime_type: string | null
          rfq_id: string
          uploaded_by: string | null
        }
        Insert: {
          category_badge?: string | null
          created_at?: string | null
          document_type?: string | null
          file_name: string
          file_path: string
          file_size?: number | null
          file_url?: string | null
          id?: string
          is_required_for_bidding?: boolean | null
          mime_type?: string | null
          rfq_id: string
          uploaded_by?: string | null
        }
        Update: {
          category_badge?: string | null
          created_at?: string | null
          document_type?: string | null
          file_name?: string
          file_path?: string
          file_size?: number | null
          file_url?: string | null
          id?: string
          is_required_for_bidding?: boolean | null
          mime_type?: string | null
          rfq_id?: string
          uploaded_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "rfq_documents_rfq_id_fkey"
            columns: ["rfq_id"]
            isOneToOne: false
            referencedRelation: "rfqs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "rfq_documents_rfq_id_fkey"
            columns: ["rfq_id"]
            isOneToOne: false
            referencedRelation: "rfqs_public_masked"
            referencedColumns: ["id"]
          },
        ]
      }
      rfq_invites: {
        Row: {
          id: string
          invited_at: string
          invited_by: string
          rfq_id: string
          status: string
          vendor_id: string
        }
        Insert: {
          id?: string
          invited_at?: string
          invited_by: string
          rfq_id: string
          status?: string
          vendor_id: string
        }
        Update: {
          id?: string
          invited_at?: string
          invited_by?: string
          rfq_id?: string
          status?: string
          vendor_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "rfq_invites_rfq_id_fkey"
            columns: ["rfq_id"]
            isOneToOne: false
            referencedRelation: "rfqs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "rfq_invites_rfq_id_fkey"
            columns: ["rfq_id"]
            isOneToOne: false
            referencedRelation: "rfqs_public_masked"
            referencedColumns: ["id"]
          },
        ]
      }
      rfq_lots: {
        Row: {
          created_at: string
          id: string
          lot_name: string
          quantity: number
          rfq_id: string
          specifications: Json | null
          unit_of_measure: string
        }
        Insert: {
          created_at?: string
          id?: string
          lot_name: string
          quantity: number
          rfq_id: string
          specifications?: Json | null
          unit_of_measure: string
        }
        Update: {
          created_at?: string
          id?: string
          lot_name?: string
          quantity?: number
          rfq_id?: string
          specifications?: Json | null
          unit_of_measure?: string
        }
        Relationships: [
          {
            foreignKeyName: "rfq_lots_rfq_id_fkey"
            columns: ["rfq_id"]
            isOneToOne: false
            referencedRelation: "rfqs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "rfq_lots_rfq_id_fkey"
            columns: ["rfq_id"]
            isOneToOne: false
            referencedRelation: "rfqs_public_masked"
            referencedColumns: ["id"]
          },
        ]
      }
      rfq_properties: {
        Row: {
          created_at: string
          id: string
          notes: string | null
          property_id: number
          rfq_id: string
          service_types: string[]
        }
        Insert: {
          created_at?: string
          id?: string
          notes?: string | null
          property_id: number
          rfq_id: string
          service_types?: string[]
        }
        Update: {
          created_at?: string
          id?: string
          notes?: string | null
          property_id?: number
          rfq_id?: string
          service_types?: string[]
        }
        Relationships: [
          {
            foreignKeyName: "rfq_properties_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "properties"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "rfq_properties_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "public_property_listings_masked"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "rfq_properties_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "safe_property_listings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "rfq_properties_rfq_id_fkey"
            columns: ["rfq_id"]
            isOneToOne: false
            referencedRelation: "rfqs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "rfq_properties_rfq_id_fkey"
            columns: ["rfq_id"]
            isOneToOne: false
            referencedRelation: "rfqs_public_masked"
            referencedColumns: ["id"]
          },
        ]
      }
      rfq_templates: {
        Row: {
          category: string
          created_at: string | null
          created_by: string
          default_milestones: Json | null
          description: string | null
          estimated_budget_max: number | null
          estimated_budget_min: number | null
          id: string
          is_active: boolean | null
          name: string
          required_certifications: string[] | null
          scope_of_work: string | null
          typical_duration_days: number | null
          updated_at: string | null
        }
        Insert: {
          category: string
          created_at?: string | null
          created_by: string
          default_milestones?: Json | null
          description?: string | null
          estimated_budget_max?: number | null
          estimated_budget_min?: number | null
          id?: string
          is_active?: boolean | null
          name: string
          required_certifications?: string[] | null
          scope_of_work?: string | null
          typical_duration_days?: number | null
          updated_at?: string | null
        }
        Update: {
          category?: string
          created_at?: string | null
          created_by?: string
          default_milestones?: Json | null
          description?: string | null
          estimated_budget_max?: number | null
          estimated_budget_min?: number | null
          id?: string
          is_active?: boolean | null
          name?: string
          required_certifications?: string[] | null
          scope_of_work?: string | null
          typical_duration_days?: number | null
          updated_at?: string | null
        }
        Relationships: []
      }
      rfqs: {
        Row: {
          budget_guidance: Json | null
          building_details: Json | null
          category: string | null
          codes_compliance: Json | null
          commercial_framework: Json | null
          created_at: string
          created_by: string
          deadline: string
          description: string | null
          document_control: Json | null
          executive_summary: Json | null
          expected_duration: string | null
          id: string
          property_id: number | null
          staffing_requirements: Json | null
          status: string
          system_strategy: Json | null
          technical_specs: Json | null
          tenant_id: string
          title: string
          unit_configuration: Json | null
          updated_at: string
        }
        Insert: {
          budget_guidance?: Json | null
          building_details?: Json | null
          category?: string | null
          codes_compliance?: Json | null
          commercial_framework?: Json | null
          created_at?: string
          created_by: string
          deadline: string
          description?: string | null
          document_control?: Json | null
          executive_summary?: Json | null
          expected_duration?: string | null
          id?: string
          property_id?: number | null
          staffing_requirements?: Json | null
          status?: string
          system_strategy?: Json | null
          technical_specs?: Json | null
          tenant_id: string
          title: string
          unit_configuration?: Json | null
          updated_at?: string
        }
        Update: {
          budget_guidance?: Json | null
          building_details?: Json | null
          category?: string | null
          codes_compliance?: Json | null
          commercial_framework?: Json | null
          created_at?: string
          created_by?: string
          deadline?: string
          description?: string | null
          document_control?: Json | null
          executive_summary?: Json | null
          expected_duration?: string | null
          id?: string
          property_id?: number | null
          staffing_requirements?: Json | null
          status?: string
          system_strategy?: Json | null
          technical_specs?: Json | null
          tenant_id?: string
          title?: string
          unit_configuration?: Json | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "rfqs_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "properties"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "rfqs_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "public_property_listings_masked"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "rfqs_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "safe_property_listings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "rfqs_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      rss_feed_sources: {
        Row: {
          category: string | null
          created_at: string | null
          fetch_interval_minutes: number | null
          id: string
          is_active: boolean | null
          last_fetched_at: string | null
          name: string
          updated_at: string | null
          url: string
        }
        Insert: {
          category?: string | null
          created_at?: string | null
          fetch_interval_minutes?: number | null
          id?: string
          is_active?: boolean | null
          last_fetched_at?: string | null
          name: string
          updated_at?: string | null
          url: string
        }
        Update: {
          category?: string | null
          created_at?: string | null
          fetch_interval_minutes?: number | null
          id?: string
          is_active?: boolean | null
          last_fetched_at?: string | null
          name?: string
          updated_at?: string | null
          url?: string
        }
        Relationships: []
      }
      security_events: {
        Row: {
          created_at: string | null
          details: Json | null
          event_type: string
          id: string
          ip_address: unknown
          severity: string
          user_agent: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          details?: Json | null
          event_type: string
          id?: string
          ip_address?: unknown
          severity: string
          user_agent?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          details?: Json | null
          event_type?: string
          id?: string
          ip_address?: unknown
          severity?: string
          user_agent?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      sent_emails: {
        Row: {
          created_at: string | null
          email_type: string
          error_message: string | null
          html_content: string
          id: string
          metadata: Json | null
          opened_at: string | null
          parent_email_id: string | null
          recipient_email: string
          recipient_name: string | null
          recipient_user_id: string | null
          resend_count: number | null
          sent_at: string | null
          sent_by: string | null
          status: string
          subject: string
          template_used: string | null
          text_content: string | null
        }
        Insert: {
          created_at?: string | null
          email_type?: string
          error_message?: string | null
          html_content: string
          id?: string
          metadata?: Json | null
          opened_at?: string | null
          parent_email_id?: string | null
          recipient_email: string
          recipient_name?: string | null
          recipient_user_id?: string | null
          resend_count?: number | null
          sent_at?: string | null
          sent_by?: string | null
          status?: string
          subject: string
          template_used?: string | null
          text_content?: string | null
        }
        Update: {
          created_at?: string | null
          email_type?: string
          error_message?: string | null
          html_content?: string
          id?: string
          metadata?: Json | null
          opened_at?: string | null
          parent_email_id?: string | null
          recipient_email?: string
          recipient_name?: string | null
          recipient_user_id?: string | null
          resend_count?: number | null
          sent_at?: string | null
          sent_by?: string | null
          status?: string
          subject?: string
          template_used?: string | null
          text_content?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "sent_emails_parent_email_id_fkey"
            columns: ["parent_email_id"]
            isOneToOne: false
            referencedRelation: "sent_emails"
            referencedColumns: ["id"]
          },
        ]
      }
      stripe_customers: {
        Row: {
          created_at: string | null
          id: string
          stripe_customer_id: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          stripe_customer_id: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          stripe_customer_id?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      stripe_payments: {
        Row: {
          amount: number
          created_at: string | null
          currency: string | null
          description: string | null
          id: string
          metadata: Json | null
          status: string
          stripe_checkout_session_id: string | null
          stripe_payment_intent_id: string | null
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          amount: number
          created_at?: string | null
          currency?: string | null
          description?: string | null
          id?: string
          metadata?: Json | null
          status?: string
          stripe_checkout_session_id?: string | null
          stripe_payment_intent_id?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          amount?: number
          created_at?: string | null
          currency?: string | null
          description?: string | null
          id?: string
          metadata?: Json | null
          status?: string
          stripe_checkout_session_id?: string | null
          stripe_payment_intent_id?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      stripe_subscriptions: {
        Row: {
          cancel_at_period_end: boolean | null
          created_at: string | null
          current_period_end: string | null
          current_period_start: string | null
          id: string
          price_id: string | null
          status: string
          stripe_customer_id: string
          stripe_subscription_id: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          cancel_at_period_end?: boolean | null
          created_at?: string | null
          current_period_end?: string | null
          current_period_start?: string | null
          id?: string
          price_id?: string | null
          status?: string
          stripe_customer_id: string
          stripe_subscription_id: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          cancel_at_period_end?: boolean | null
          created_at?: string | null
          current_period_end?: string | null
          current_period_start?: string | null
          id?: string
          price_id?: string | null
          status?: string
          stripe_customer_id?: string
          stripe_subscription_id?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      subscribers: {
        Row: {
          created_at: string
          email: string
          id: string
          stripe_customer_id: string | null
          subscribed: boolean
          subscription_end: string | null
          subscription_tier: string | null
          updated_at: string
          user_id: string | null
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
          stripe_customer_id?: string | null
          subscribed?: boolean
          subscription_end?: string | null
          subscription_tier?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          stripe_customer_id?: string | null
          subscribed?: boolean
          subscription_end?: string | null
          subscription_tier?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Relationships: []
      }
      subscription_requests: {
        Row: {
          admin_notes: string | null
          created_at: string | null
          current_plan: string | null
          id: string
          processed_at: string | null
          processed_by: string | null
          requested_at: string | null
          requested_plan: string
          status: string
          updated_at: string | null
          vendor_id: string
        }
        Insert: {
          admin_notes?: string | null
          created_at?: string | null
          current_plan?: string | null
          id?: string
          processed_at?: string | null
          processed_by?: string | null
          requested_at?: string | null
          requested_plan: string
          status?: string
          updated_at?: string | null
          vendor_id: string
        }
        Update: {
          admin_notes?: string | null
          created_at?: string | null
          current_plan?: string | null
          id?: string
          processed_at?: string | null
          processed_by?: string | null
          requested_at?: string | null
          requested_plan?: string
          status?: string
          updated_at?: string | null
          vendor_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "subscription_requests_processed_by_fkey"
            columns: ["processed_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "subscription_requests_vendor_id_fkey"
            columns: ["vendor_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      system_health: {
        Row: {
          checked_at: string | null
          created_at: string | null
          error_message: string | null
          id: string
          metadata: Json | null
          response_time_ms: number | null
          service_name: string
          status: string
        }
        Insert: {
          checked_at?: string | null
          created_at?: string | null
          error_message?: string | null
          id?: string
          metadata?: Json | null
          response_time_ms?: number | null
          service_name: string
          status: string
        }
        Update: {
          checked_at?: string | null
          created_at?: string | null
          error_message?: string | null
          id?: string
          metadata?: Json | null
          response_time_ms?: number | null
          service_name?: string
          status?: string
        }
        Relationships: []
      }
      system_settings: {
        Row: {
          category: string | null
          created_at: string | null
          description: string | null
          key: string
          updated_at: string | null
          value: string
        }
        Insert: {
          category?: string | null
          created_at?: string | null
          description?: string | null
          key: string
          updated_at?: string | null
          value: string
        }
        Update: {
          category?: string | null
          created_at?: string | null
          description?: string | null
          key?: string
          updated_at?: string | null
          value?: string
        }
        Relationships: []
      }
      team_members: {
        Row: {
          avatar_url: string | null
          bio: string | null
          created_at: string | null
          department: string | null
          email: string
          full_name: string
          hire_date: string | null
          id: string
          phone: string | null
          role: string
          skills: string[] | null
          status: string | null
          title: string | null
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          avatar_url?: string | null
          bio?: string | null
          created_at?: string | null
          department?: string | null
          email: string
          full_name: string
          hire_date?: string | null
          id?: string
          phone?: string | null
          role: string
          skills?: string[] | null
          status?: string | null
          title?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          avatar_url?: string | null
          bio?: string | null
          created_at?: string | null
          department?: string | null
          email?: string
          full_name?: string
          hire_date?: string | null
          id?: string
          phone?: string | null
          role?: string
          skills?: string[] | null
          status?: string | null
          title?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      tenants: {
        Row: {
          created_at: string | null
          id: string
          name: string
          plan: string | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          name: string
          plan?: string | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          name?: string
          plan?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      transactions: {
        Row: {
          amount: number
          application_id: string | null
          booking_id: string | null
          completed_at: string | null
          created_at: string | null
          currency: string | null
          id: string
          payment_method: string | null
          status: string | null
          stripe_payment_intent_id: string | null
          stripe_session_id: string | null
          user_id: string | null
        }
        Insert: {
          amount: number
          application_id?: string | null
          booking_id?: string | null
          completed_at?: string | null
          created_at?: string | null
          currency?: string | null
          id?: string
          payment_method?: string | null
          status?: string | null
          stripe_payment_intent_id?: string | null
          stripe_session_id?: string | null
          user_id?: string | null
        }
        Update: {
          amount?: number
          application_id?: string | null
          booking_id?: string | null
          completed_at?: string | null
          created_at?: string | null
          currency?: string | null
          id?: string
          payment_method?: string | null
          status?: string | null
          stripe_payment_intent_id?: string | null
          stripe_session_id?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "transactions_application_id_fkey"
            columns: ["application_id"]
            isOneToOne: false
            referencedRelation: "vendor_applications"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "transactions_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "bookings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "transactions_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "bookings_staff_view"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "transactions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      user_approval_requests: {
        Row: {
          admin_notes: string | null
          company_name: string | null
          created_at: string
          email: string
          full_name: string | null
          id: string
          phone: string | null
          reviewed_at: string | null
          reviewed_by: string | null
          role_requested: string
          status: string
          user_id: string
        }
        Insert: {
          admin_notes?: string | null
          company_name?: string | null
          created_at?: string
          email: string
          full_name?: string | null
          id?: string
          phone?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          role_requested?: string
          status?: string
          user_id: string
        }
        Update: {
          admin_notes?: string | null
          company_name?: string | null
          created_at?: string
          email?: string
          full_name?: string | null
          id?: string
          phone?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          role_requested?: string
          status?: string
          user_id?: string
        }
        Relationships: []
      }
      user_notification_settings: {
        Row: {
          created_at: string
          email_notifications: boolean
          id: string
          invoice_alerts: boolean
          marketing_emails: boolean
          payment_alerts: boolean
          project_updates: boolean
          push_notifications: boolean
          security_alerts: boolean
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          email_notifications?: boolean
          id?: string
          invoice_alerts?: boolean
          marketing_emails?: boolean
          payment_alerts?: boolean
          project_updates?: boolean
          push_notifications?: boolean
          security_alerts?: boolean
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          email_notifications?: boolean
          id?: string
          invoice_alerts?: boolean
          marketing_emails?: boolean
          payment_alerts?: boolean
          project_updates?: boolean
          push_notifications?: boolean
          security_alerts?: boolean
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      user_preferences: {
        Row: {
          bid_notifications: boolean | null
          created_at: string | null
          email_notifications: boolean | null
          id: string
          payment_alerts: boolean | null
          phone_number: string | null
          profile_visibility: string | null
          project_alerts: boolean | null
          sms_notifications: boolean | null
          two_factor_enabled: boolean | null
          two_factor_verified_at: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          bid_notifications?: boolean | null
          created_at?: string | null
          email_notifications?: boolean | null
          id?: string
          payment_alerts?: boolean | null
          phone_number?: string | null
          profile_visibility?: string | null
          project_alerts?: boolean | null
          sms_notifications?: boolean | null
          two_factor_enabled?: boolean | null
          two_factor_verified_at?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          bid_notifications?: boolean | null
          created_at?: string | null
          email_notifications?: boolean | null
          id?: string
          payment_alerts?: boolean | null
          phone_number?: string | null
          profile_visibility?: string | null
          project_alerts?: boolean | null
          sms_notifications?: boolean | null
          two_factor_enabled?: boolean | null
          two_factor_verified_at?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          granted_at: string | null
          granted_by: string | null
          id: string
          role: string
          user_id: string
        }
        Insert: {
          granted_at?: string | null
          granted_by?: string | null
          id?: string
          role: string
          user_id: string
        }
        Update: {
          granted_at?: string | null
          granted_by?: string | null
          id?: string
          role?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_roles_granted_by_fkey"
            columns: ["granted_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_roles_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      vendor_applications: {
        Row: {
          budget_max: number | null
          budget_min: number | null
          created_at: string | null
          deadline: string | null
          id: string
          location: string | null
          preferred_start_date: string | null
          priority: string | null
          project_description: string
          project_title: string
          project_type: string
          property_id: number | null
          status: string | null
          user_id: string | null
        }
        Insert: {
          budget_max?: number | null
          budget_min?: number | null
          created_at?: string | null
          deadline?: string | null
          id?: string
          location?: string | null
          preferred_start_date?: string | null
          priority?: string | null
          project_description: string
          project_title: string
          project_type: string
          property_id?: number | null
          status?: string | null
          user_id?: string | null
        }
        Update: {
          budget_max?: number | null
          budget_min?: number | null
          created_at?: string | null
          deadline?: string | null
          id?: string
          location?: string | null
          preferred_start_date?: string | null
          priority?: string | null
          project_description?: string
          project_title?: string
          project_type?: string
          property_id?: number | null
          status?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "vendor_applications_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "properties"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "vendor_applications_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "public_property_listings_masked"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "vendor_applications_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "safe_property_listings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "vendor_applications_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      vendor_bids: {
        Row: {
          admin_feedback: string | null
          admin_notes: Json | null
          application_id: string | null
          bid_amount: number
          certifications: Json | null
          company_info: Json | null
          document_uploads: Json | null
          estimated_duration: string | null
          experience: Json | null
          feedback_at: string | null
          feedback_by: string | null
          id: string
          pricing: Json | null
          project_id: string | null
          proposal_details: string
          rfq_id: string | null
          status: string | null
          submitted_at: string | null
          terms_accepted: boolean | null
          terms_accepted_at: string | null
          vendor_id: string
        }
        Insert: {
          admin_feedback?: string | null
          admin_notes?: Json | null
          application_id?: string | null
          bid_amount: number
          certifications?: Json | null
          company_info?: Json | null
          document_uploads?: Json | null
          estimated_duration?: string | null
          experience?: Json | null
          feedback_at?: string | null
          feedback_by?: string | null
          id?: string
          pricing?: Json | null
          project_id?: string | null
          proposal_details: string
          rfq_id?: string | null
          status?: string | null
          submitted_at?: string | null
          terms_accepted?: boolean | null
          terms_accepted_at?: string | null
          vendor_id: string
        }
        Update: {
          admin_feedback?: string | null
          admin_notes?: Json | null
          application_id?: string | null
          bid_amount?: number
          certifications?: Json | null
          company_info?: Json | null
          document_uploads?: Json | null
          estimated_duration?: string | null
          experience?: Json | null
          feedback_at?: string | null
          feedback_by?: string | null
          id?: string
          pricing?: Json | null
          project_id?: string | null
          proposal_details?: string
          rfq_id?: string | null
          status?: string | null
          submitted_at?: string | null
          terms_accepted?: boolean | null
          terms_accepted_at?: string | null
          vendor_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "vendor_bids_application_id_fkey"
            columns: ["application_id"]
            isOneToOne: false
            referencedRelation: "vendor_applications"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "vendor_bids_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "vendor_bids_rfq_id_fkey"
            columns: ["rfq_id"]
            isOneToOne: false
            referencedRelation: "rfqs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "vendor_bids_rfq_id_fkey"
            columns: ["rfq_id"]
            isOneToOne: false
            referencedRelation: "rfqs_public_masked"
            referencedColumns: ["id"]
          },
        ]
      }
      vendor_contacts: {
        Row: {
          company: string | null
          contact_type: string
          created_at: string | null
          email: string | null
          id: string
          last_contact_date: string | null
          name: string
          next_followup_date: string | null
          notes: string | null
          phone: string | null
          source: string | null
          status: string | null
          updated_at: string | null
          vendor_id: string
        }
        Insert: {
          company?: string | null
          contact_type?: string
          created_at?: string | null
          email?: string | null
          id?: string
          last_contact_date?: string | null
          name: string
          next_followup_date?: string | null
          notes?: string | null
          phone?: string | null
          source?: string | null
          status?: string | null
          updated_at?: string | null
          vendor_id: string
        }
        Update: {
          company?: string | null
          contact_type?: string
          created_at?: string | null
          email?: string | null
          id?: string
          last_contact_date?: string | null
          name?: string
          next_followup_date?: string | null
          notes?: string | null
          phone?: string | null
          source?: string | null
          status?: string | null
          updated_at?: string | null
          vendor_id?: string
        }
        Relationships: []
      }
      vendor_document_comments: {
        Row: {
          comment_text: string
          comment_type: string
          created_at: string | null
          document_id: string
          id: string
          is_internal: boolean | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          comment_text: string
          comment_type: string
          created_at?: string | null
          document_id: string
          id?: string
          is_internal?: boolean | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          comment_text?: string
          comment_type?: string
          created_at?: string | null
          document_id?: string
          id?: string
          is_internal?: boolean | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "vendor_document_comments_document_id_fkey"
            columns: ["document_id"]
            isOneToOne: false
            referencedRelation: "vendor_documents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "vendor_document_comments_document_id_fkey"
            columns: ["document_id"]
            isOneToOne: false
            referencedRelation: "vendor_documents_safe"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "vendor_document_comments_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      vendor_documents: {
        Row: {
          document_type: string
          file_name: string
          file_path: string
          file_size: number | null
          file_url: string | null
          id: string
          is_verified: boolean | null
          mime_type: string | null
          uploaded_at: string | null
          vendor_id: string
          verified_at: string | null
          verified_by: string | null
        }
        Insert: {
          document_type: string
          file_name: string
          file_path: string
          file_size?: number | null
          file_url?: string | null
          id?: string
          is_verified?: boolean | null
          mime_type?: string | null
          uploaded_at?: string | null
          vendor_id: string
          verified_at?: string | null
          verified_by?: string | null
        }
        Update: {
          document_type?: string
          file_name?: string
          file_path?: string
          file_size?: number | null
          file_url?: string | null
          id?: string
          is_verified?: boolean | null
          mime_type?: string | null
          uploaded_at?: string | null
          vendor_id?: string
          verified_at?: string | null
          verified_by?: string | null
        }
        Relationships: []
      }
      vendor_inquiries: {
        Row: {
          admin_response: string | null
          category: string
          created_at: string | null
          id: string
          message: string
          priority: string | null
          responded_at: string | null
          responded_by: string | null
          status: string | null
          subject: string
          updated_at: string | null
          vendor_id: string
        }
        Insert: {
          admin_response?: string | null
          category: string
          created_at?: string | null
          id?: string
          message: string
          priority?: string | null
          responded_at?: string | null
          responded_by?: string | null
          status?: string | null
          subject: string
          updated_at?: string | null
          vendor_id: string
        }
        Update: {
          admin_response?: string | null
          category?: string
          created_at?: string | null
          id?: string
          message?: string
          priority?: string | null
          responded_at?: string | null
          responded_by?: string | null
          status?: string | null
          subject?: string
          updated_at?: string | null
          vendor_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "vendor_inquiries_responded_by_fkey"
            columns: ["responded_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "vendor_inquiries_vendor_id_fkey"
            columns: ["vendor_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      vendor_invitations: {
        Row: {
          accepted_at: string | null
          company_name: string
          created_at: string | null
          email: string
          id: string
          invite_message: string | null
          invited_at: string | null
          invited_by: string | null
          specialties: string[] | null
          status: string | null
        }
        Insert: {
          accepted_at?: string | null
          company_name: string
          created_at?: string | null
          email: string
          id?: string
          invite_message?: string | null
          invited_at?: string | null
          invited_by?: string | null
          specialties?: string[] | null
          status?: string | null
        }
        Update: {
          accepted_at?: string | null
          company_name?: string
          created_at?: string | null
          email?: string
          id?: string
          invite_message?: string | null
          invited_at?: string | null
          invited_by?: string | null
          specialties?: string[] | null
          status?: string | null
        }
        Relationships: []
      }
      vendor_lead_credits: {
        Row: {
          credit_balance: number | null
          last_purchase_at: string | null
          total_purchased: number | null
          total_used: number | null
          updated_at: string | null
          vendor_id: string
        }
        Insert: {
          credit_balance?: number | null
          last_purchase_at?: string | null
          total_purchased?: number | null
          total_used?: number | null
          updated_at?: string | null
          vendor_id: string
        }
        Update: {
          credit_balance?: number | null
          last_purchase_at?: string | null
          total_purchased?: number | null
          total_used?: number | null
          updated_at?: string | null
          vendor_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "vendor_lead_credits_vendor_id_fkey"
            columns: ["vendor_id"]
            isOneToOne: true
            referencedRelation: "safe_vendor_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "vendor_lead_credits_vendor_id_fkey"
            columns: ["vendor_id"]
            isOneToOne: true
            referencedRelation: "vendor_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      vendor_lead_matches: {
        Row: {
          created_at: string | null
          estimated_duration: string | null
          id: string
          match_score: number | null
          notified_at: string | null
          quote_amount: number | null
          quote_notes: string | null
          quote_request_id: string | null
          responded_at: string | null
          response_status: string | null
          vendor_id: string | null
          viewed_at: string | null
        }
        Insert: {
          created_at?: string | null
          estimated_duration?: string | null
          id?: string
          match_score?: number | null
          notified_at?: string | null
          quote_amount?: number | null
          quote_notes?: string | null
          quote_request_id?: string | null
          responded_at?: string | null
          response_status?: string | null
          vendor_id?: string | null
          viewed_at?: string | null
        }
        Update: {
          created_at?: string | null
          estimated_duration?: string | null
          id?: string
          match_score?: number | null
          notified_at?: string | null
          quote_amount?: number | null
          quote_notes?: string | null
          quote_request_id?: string | null
          responded_at?: string | null
          response_status?: string | null
          vendor_id?: string | null
          viewed_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "vendor_lead_matches_quote_request_id_fkey"
            columns: ["quote_request_id"]
            isOneToOne: false
            referencedRelation: "quick_quote_requests"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "vendor_lead_matches_vendor_id_fkey"
            columns: ["vendor_id"]
            isOneToOne: false
            referencedRelation: "safe_vendor_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "vendor_lead_matches_vendor_id_fkey"
            columns: ["vendor_id"]
            isOneToOne: false
            referencedRelation: "vendor_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      vendor_notification_settings: {
        Row: {
          bid_notifications: boolean | null
          created_at: string | null
          email_notifications: boolean | null
          id: string
          marketing: boolean | null
          newsletter: boolean | null
          payment_alerts: boolean | null
          project_alerts: boolean | null
          push_notifications: boolean | null
          sms_notifications: boolean | null
          system_updates: boolean | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          bid_notifications?: boolean | null
          created_at?: string | null
          email_notifications?: boolean | null
          id?: string
          marketing?: boolean | null
          newsletter?: boolean | null
          payment_alerts?: boolean | null
          project_alerts?: boolean | null
          push_notifications?: boolean | null
          sms_notifications?: boolean | null
          system_updates?: boolean | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          bid_notifications?: boolean | null
          created_at?: string | null
          email_notifications?: boolean | null
          id?: string
          marketing?: boolean | null
          newsletter?: boolean | null
          payment_alerts?: boolean | null
          project_alerts?: boolean | null
          push_notifications?: boolean | null
          sms_notifications?: boolean | null
          system_updates?: boolean | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      vendor_payment_methods: {
        Row: {
          account_type: string | null
          bank_address: string | null
          bank_name: string | null
          brand: string | null
          created_at: string
          full_legal_name: string | null
          iban: string | null
          id: string
          is_default: boolean
          last_four: string
          owner_address: string | null
          stripe_payment_method_id: string
          swift_code: string | null
          type: string
          updated_at: string
          vendor_id: string
          wire_instructions: string | null
        }
        Insert: {
          account_type?: string | null
          bank_address?: string | null
          bank_name?: string | null
          brand?: string | null
          created_at?: string
          full_legal_name?: string | null
          iban?: string | null
          id?: string
          is_default?: boolean
          last_four: string
          owner_address?: string | null
          stripe_payment_method_id: string
          swift_code?: string | null
          type: string
          updated_at?: string
          vendor_id: string
          wire_instructions?: string | null
        }
        Update: {
          account_type?: string | null
          bank_address?: string | null
          bank_name?: string | null
          brand?: string | null
          created_at?: string
          full_legal_name?: string | null
          iban?: string | null
          id?: string
          is_default?: boolean
          last_four?: string
          owner_address?: string | null
          stripe_payment_method_id?: string
          swift_code?: string | null
          type?: string
          updated_at?: string
          vendor_id?: string
          wire_instructions?: string | null
        }
        Relationships: []
      }
      vendor_payments: {
        Row: {
          amount: number
          created_at: string
          created_by: string
          description: string | null
          due_date: string | null
          id: string
          metadata: Json | null
          notes: string | null
          paid_at: string | null
          payment_method: string | null
          payment_type: string
          refunded_at: string | null
          status: string
          stripe_payment_intent_id: string | null
          stripe_session_id: string | null
          template_id: string | null
          title: string
          updated_at: string
          user_type: string | null
          vendor_id: string
        }
        Insert: {
          amount: number
          created_at?: string
          created_by: string
          description?: string | null
          due_date?: string | null
          id?: string
          metadata?: Json | null
          notes?: string | null
          paid_at?: string | null
          payment_method?: string | null
          payment_type: string
          refunded_at?: string | null
          status?: string
          stripe_payment_intent_id?: string | null
          stripe_session_id?: string | null
          template_id?: string | null
          title: string
          updated_at?: string
          user_type?: string | null
          vendor_id: string
        }
        Update: {
          amount?: number
          created_at?: string
          created_by?: string
          description?: string | null
          due_date?: string | null
          id?: string
          metadata?: Json | null
          notes?: string | null
          paid_at?: string | null
          payment_method?: string | null
          payment_type?: string
          refunded_at?: string | null
          status?: string
          stripe_payment_intent_id?: string | null
          stripe_session_id?: string | null
          template_id?: string | null
          title?: string
          updated_at?: string
          user_type?: string | null
          vendor_id?: string
        }
        Relationships: []
      }
      vendor_payout_settings: {
        Row: {
          account_holder_name: string | null
          bank_account_last4: string | null
          card_brand: string | null
          card_last4: string | null
          created_at: string | null
          id: string
          is_verified: boolean | null
          minimum_payout_amount: number | null
          payout_method: string | null
          payout_schedule: string | null
          routing_number: string | null
          tax_id_last4: string | null
          updated_at: string | null
          vendor_id: string | null
          verified_at: string | null
          verified_by: string | null
        }
        Insert: {
          account_holder_name?: string | null
          bank_account_last4?: string | null
          card_brand?: string | null
          card_last4?: string | null
          created_at?: string | null
          id?: string
          is_verified?: boolean | null
          minimum_payout_amount?: number | null
          payout_method?: string | null
          payout_schedule?: string | null
          routing_number?: string | null
          tax_id_last4?: string | null
          updated_at?: string | null
          vendor_id?: string | null
          verified_at?: string | null
          verified_by?: string | null
        }
        Update: {
          account_holder_name?: string | null
          bank_account_last4?: string | null
          card_brand?: string | null
          card_last4?: string | null
          created_at?: string | null
          id?: string
          is_verified?: boolean | null
          minimum_payout_amount?: number | null
          payout_method?: string | null
          payout_schedule?: string | null
          routing_number?: string | null
          tax_id_last4?: string | null
          updated_at?: string | null
          vendor_id?: string | null
          verified_at?: string | null
          verified_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "vendor_payout_settings_vendor_id_fkey"
            columns: ["vendor_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "vendor_payout_settings_verified_by_fkey"
            columns: ["verified_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      vendor_payouts: {
        Row: {
          acknowledged_at: string | null
          amount: number
          created_at: string
          id: string
          metadata: Json | null
          notes: string | null
          payout_date: string | null
          payout_method: string | null
          processed_by: string | null
          reference: string | null
          requested_at: string | null
          status: string
          transaction_id: string | null
          updated_at: string
          vendor_acknowledged: boolean | null
          vendor_id: string
          vendor_notes: string | null
        }
        Insert: {
          acknowledged_at?: string | null
          amount?: number
          created_at?: string
          id?: string
          metadata?: Json | null
          notes?: string | null
          payout_date?: string | null
          payout_method?: string | null
          processed_by?: string | null
          reference?: string | null
          requested_at?: string | null
          status?: string
          transaction_id?: string | null
          updated_at?: string
          vendor_acknowledged?: boolean | null
          vendor_id: string
          vendor_notes?: string | null
        }
        Update: {
          acknowledged_at?: string | null
          amount?: number
          created_at?: string
          id?: string
          metadata?: Json | null
          notes?: string | null
          payout_date?: string | null
          payout_method?: string | null
          processed_by?: string | null
          reference?: string | null
          requested_at?: string | null
          status?: string
          transaction_id?: string | null
          updated_at?: string
          vendor_acknowledged?: boolean | null
          vendor_id?: string
          vendor_notes?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "vendor_payouts_processed_by_fkey"
            columns: ["processed_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      vendor_portfolio_items: {
        Row: {
          after_image_url: string | null
          before_image_url: string | null
          category: string
          client_name: string | null
          completion_date: string | null
          created_at: string | null
          description: string | null
          display_order: number | null
          id: string
          is_featured: boolean | null
          project_id: string | null
          tags: string[] | null
          title: string
          updated_at: string | null
          vendor_id: string
        }
        Insert: {
          after_image_url?: string | null
          before_image_url?: string | null
          category: string
          client_name?: string | null
          completion_date?: string | null
          created_at?: string | null
          description?: string | null
          display_order?: number | null
          id?: string
          is_featured?: boolean | null
          project_id?: string | null
          tags?: string[] | null
          title: string
          updated_at?: string | null
          vendor_id: string
        }
        Update: {
          after_image_url?: string | null
          before_image_url?: string | null
          category?: string
          client_name?: string | null
          completion_date?: string | null
          created_at?: string | null
          description?: string | null
          display_order?: number | null
          id?: string
          is_featured?: boolean | null
          project_id?: string | null
          tags?: string[] | null
          title?: string
          updated_at?: string | null
          vendor_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "vendor_portfolio_items_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      vendor_profiles: {
        Row: {
          address: string | null
          availability_status: string | null
          avatar_url: string | null
          average_rating: number | null
          background_check_verified: boolean | null
          business_license: string | null
          certifications: string[] | null
          company_name: string
          completed_jobs: number | null
          created_at: string | null
          description: string | null
          email: string | null
          id: string
          insurance_verified: boolean | null
          is_verified: boolean | null
          last_active_at: string | null
          phone: string | null
          public_avatar_url: string | null
          rating: number | null
          response_time_hours: number | null
          service_areas: string[] | null
          specialties: string[] | null
          subscription_expires_at: string | null
          subscription_plan: string | null
          subscription_status: string | null
          subscription_tier: string | null
          success_rate: number | null
          tenant_id: string | null
          updated_at: string | null
          user_id: string | null
          verification_approved_at: string | null
          verification_approved_by: string | null
          verification_status: boolean | null
          website: string | null
          years_experience: number | null
        }
        Insert: {
          address?: string | null
          availability_status?: string | null
          avatar_url?: string | null
          average_rating?: number | null
          background_check_verified?: boolean | null
          business_license?: string | null
          certifications?: string[] | null
          company_name: string
          completed_jobs?: number | null
          created_at?: string | null
          description?: string | null
          email?: string | null
          id?: string
          insurance_verified?: boolean | null
          is_verified?: boolean | null
          last_active_at?: string | null
          phone?: string | null
          public_avatar_url?: string | null
          rating?: number | null
          response_time_hours?: number | null
          service_areas?: string[] | null
          specialties?: string[] | null
          subscription_expires_at?: string | null
          subscription_plan?: string | null
          subscription_status?: string | null
          subscription_tier?: string | null
          success_rate?: number | null
          tenant_id?: string | null
          updated_at?: string | null
          user_id?: string | null
          verification_approved_at?: string | null
          verification_approved_by?: string | null
          verification_status?: boolean | null
          website?: string | null
          years_experience?: number | null
        }
        Update: {
          address?: string | null
          availability_status?: string | null
          avatar_url?: string | null
          average_rating?: number | null
          background_check_verified?: boolean | null
          business_license?: string | null
          certifications?: string[] | null
          company_name?: string
          completed_jobs?: number | null
          created_at?: string | null
          description?: string | null
          email?: string | null
          id?: string
          insurance_verified?: boolean | null
          is_verified?: boolean | null
          last_active_at?: string | null
          phone?: string | null
          public_avatar_url?: string | null
          rating?: number | null
          response_time_hours?: number | null
          service_areas?: string[] | null
          specialties?: string[] | null
          subscription_expires_at?: string | null
          subscription_plan?: string | null
          subscription_status?: string | null
          subscription_tier?: string | null
          success_rate?: number | null
          tenant_id?: string | null
          updated_at?: string | null
          user_id?: string | null
          verification_approved_at?: string | null
          verification_approved_by?: string | null
          verification_status?: boolean | null
          website?: string | null
          years_experience?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "vendor_profiles_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "vendor_profiles_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "vendor_profiles_verification_approved_by_fkey"
            columns: ["verification_approved_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      vendor_reviews: {
        Row: {
          communication_rating: number | null
          created_at: string | null
          id: string
          is_verified_project: boolean | null
          overall_rating: number
          photos: string[] | null
          project_id: string | null
          punctuality_rating: number | null
          quality_rating: number | null
          review_text: string | null
          reviewer_id: string
          status: string | null
          updated_at: string | null
          value_rating: number | null
          vendor_id: string
          vendor_response: string | null
          vendor_response_at: string | null
        }
        Insert: {
          communication_rating?: number | null
          created_at?: string | null
          id?: string
          is_verified_project?: boolean | null
          overall_rating: number
          photos?: string[] | null
          project_id?: string | null
          punctuality_rating?: number | null
          quality_rating?: number | null
          review_text?: string | null
          reviewer_id: string
          status?: string | null
          updated_at?: string | null
          value_rating?: number | null
          vendor_id: string
          vendor_response?: string | null
          vendor_response_at?: string | null
        }
        Update: {
          communication_rating?: number | null
          created_at?: string | null
          id?: string
          is_verified_project?: boolean | null
          overall_rating?: number
          photos?: string[] | null
          project_id?: string | null
          punctuality_rating?: number | null
          quality_rating?: number | null
          review_text?: string | null
          reviewer_id?: string
          status?: string | null
          updated_at?: string | null
          value_rating?: number | null
          vendor_id?: string
          vendor_response?: string | null
          vendor_response_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "vendor_reviews_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "vendor_reviews_vendor_id_fkey"
            columns: ["vendor_id"]
            isOneToOne: false
            referencedRelation: "safe_vendor_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "vendor_reviews_vendor_id_fkey"
            columns: ["vendor_id"]
            isOneToOne: false
            referencedRelation: "vendor_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      vendor_tiers: {
        Row: {
          average_rating: number | null
          current_tier: string | null
          next_tier_progress: Json | null
          review_count: number | null
          tier_updated_at: string | null
          total_completed_jobs: number | null
          total_revenue: number | null
          vendor_id: string
        }
        Insert: {
          average_rating?: number | null
          current_tier?: string | null
          next_tier_progress?: Json | null
          review_count?: number | null
          tier_updated_at?: string | null
          total_completed_jobs?: number | null
          total_revenue?: number | null
          vendor_id: string
        }
        Update: {
          average_rating?: number | null
          current_tier?: string | null
          next_tier_progress?: Json | null
          review_count?: number | null
          tier_updated_at?: string | null
          total_completed_jobs?: number | null
          total_revenue?: number | null
          vendor_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "vendor_tiers_vendor_id_fkey"
            columns: ["vendor_id"]
            isOneToOne: true
            referencedRelation: "safe_vendor_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "vendor_tiers_vendor_id_fkey"
            columns: ["vendor_id"]
            isOneToOne: true
            referencedRelation: "vendor_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      work_orders: {
        Row: {
          assigned_to: string | null
          completed_date: string | null
          contract_id: string | null
          created_at: string
          created_by: string
          description: string | null
          id: string
          priority: string
          property_id: number | null
          scheduled_date: string | null
          status: string
          tenant_id: string
          title: string
          updated_at: string
        }
        Insert: {
          assigned_to?: string | null
          completed_date?: string | null
          contract_id?: string | null
          created_at?: string
          created_by: string
          description?: string | null
          id?: string
          priority?: string
          property_id?: number | null
          scheduled_date?: string | null
          status?: string
          tenant_id: string
          title: string
          updated_at?: string
        }
        Update: {
          assigned_to?: string | null
          completed_date?: string | null
          contract_id?: string | null
          created_at?: string
          created_by?: string
          description?: string | null
          id?: string
          priority?: string
          property_id?: number | null
          scheduled_date?: string | null
          status?: string
          tenant_id?: string
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "work_orders_contract_id_fkey"
            columns: ["contract_id"]
            isOneToOne: false
            referencedRelation: "contracts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "work_orders_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "properties"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "work_orders_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "public_property_listings_masked"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "work_orders_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "safe_property_listings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "work_orders_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      bookings_staff_view: {
        Row: {
          check_in_date: string | null
          check_out_date: string | null
          created_at: string | null
          guest_details: Json | null
          guests: number | null
          id: string | null
          payment_status: string | null
          property_id: number | null
          special_requests: string | null
          status: string | null
          total_amount: number | null
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          check_in_date?: string | null
          check_out_date?: string | null
          created_at?: string | null
          guest_details?: never
          guests?: number | null
          id?: string | null
          payment_status?: string | null
          property_id?: number | null
          special_requests?: string | null
          status?: string | null
          total_amount?: number | null
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          check_in_date?: string | null
          check_out_date?: string | null
          created_at?: string | null
          guest_details?: never
          guests?: number | null
          id?: string | null
          payment_status?: string | null
          property_id?: number | null
          special_requests?: string | null
          status?: string | null
          total_amount?: number | null
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "bookings_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "properties"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bookings_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "public_property_listings_masked"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bookings_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "safe_property_listings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bookings_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      public_property_listings_masked: {
        Row: {
          amenities: string | null
          available_date: string | null
          bathrooms: number | null
          bedrooms: number | null
          city: string | null
          description: string | null
          id: number | null
          image_urls: string | null
          location_display: string | null
          price: number | null
          price_range: string | null
          property_type: string | null
          square_feet: string | null
          state: string | null
          status: string | null
          title: string | null
        }
        Insert: {
          amenities?: string | null
          available_date?: string | null
          bathrooms?: number | null
          bedrooms?: number | null
          city?: string | null
          description?: string | null
          id?: number | null
          image_urls?: string | null
          location_display?: never
          price?: number | null
          price_range?: never
          property_type?: string | null
          square_feet?: string | null
          state?: string | null
          status?: string | null
          title?: string | null
        }
        Update: {
          amenities?: string | null
          available_date?: string | null
          bathrooms?: number | null
          bedrooms?: number | null
          city?: string | null
          description?: string | null
          id?: number | null
          image_urls?: string | null
          location_display?: never
          price?: number | null
          price_range?: never
          property_type?: string | null
          square_feet?: string | null
          state?: string | null
          status?: string | null
          title?: string | null
        }
        Relationships: []
      }
      rfqs_public_masked: {
        Row: {
          category: string | null
          created_at: string | null
          deadline: string | null
          expected_duration: string | null
          id: string | null
          preview: string | null
          project_address_summary: string | null
          status: string | null
          title: string | null
        }
        Insert: {
          category?: string | null
          created_at?: string | null
          deadline?: string | null
          expected_duration?: string | null
          id?: string | null
          preview?: never
          project_address_summary?: never
          status?: string | null
          title?: string | null
        }
        Update: {
          category?: string | null
          created_at?: string | null
          deadline?: string | null
          expected_duration?: string | null
          id?: string | null
          preview?: never
          project_address_summary?: never
          status?: string | null
          title?: string | null
        }
        Relationships: []
      }
      safe_property_listings: {
        Row: {
          address: string | null
          amenities: string | null
          available_date: string | null
          bathrooms: number | null
          bedrooms: number | null
          city: string | null
          description: string | null
          id: number | null
          image_urls: string | null
          price: number | null
          property_type: string | null
          square_feet: string | null
          state: string | null
          status: string | null
          title: string | null
          zip_code: number | null
        }
        Insert: {
          address?: string | null
          amenities?: string | null
          available_date?: string | null
          bathrooms?: number | null
          bedrooms?: number | null
          city?: string | null
          description?: string | null
          id?: number | null
          image_urls?: string | null
          price?: number | null
          property_type?: string | null
          square_feet?: string | null
          state?: string | null
          status?: string | null
          title?: string | null
          zip_code?: number | null
        }
        Update: {
          address?: string | null
          amenities?: string | null
          available_date?: string | null
          bathrooms?: number | null
          bedrooms?: number | null
          city?: string | null
          description?: string | null
          id?: number | null
          image_urls?: string | null
          price?: number | null
          property_type?: string | null
          square_feet?: string | null
          state?: string | null
          status?: string | null
          title?: string | null
          zip_code?: number | null
        }
        Relationships: []
      }
      safe_vendor_profiles: {
        Row: {
          address: string | null
          availability_status: string | null
          average_rating: number | null
          background_check_verified: boolean | null
          certifications: string[] | null
          company_name: string | null
          completed_jobs: number | null
          created_at: string | null
          description: string | null
          email: string | null
          id: string | null
          insurance_verified: boolean | null
          is_verified: boolean | null
          phone: string | null
          public_avatar_url: string | null
          rating: number | null
          response_time_hours: number | null
          service_areas: string[] | null
          specialties: string[] | null
          subscription_tier: string | null
          success_rate: number | null
          user_id: string | null
          website: string | null
          years_experience: number | null
        }
        Insert: {
          address?: never
          availability_status?: string | null
          average_rating?: number | null
          background_check_verified?: boolean | null
          certifications?: string[] | null
          company_name?: string | null
          completed_jobs?: number | null
          created_at?: string | null
          description?: string | null
          email?: never
          id?: string | null
          insurance_verified?: boolean | null
          is_verified?: boolean | null
          phone?: never
          public_avatar_url?: string | null
          rating?: number | null
          response_time_hours?: number | null
          service_areas?: string[] | null
          specialties?: string[] | null
          subscription_tier?: string | null
          success_rate?: number | null
          user_id?: string | null
          website?: string | null
          years_experience?: number | null
        }
        Update: {
          address?: never
          availability_status?: string | null
          average_rating?: number | null
          background_check_verified?: boolean | null
          certifications?: string[] | null
          company_name?: string | null
          completed_jobs?: number | null
          created_at?: string | null
          description?: string | null
          email?: never
          id?: string | null
          insurance_verified?: boolean | null
          is_verified?: boolean | null
          phone?: never
          public_avatar_url?: string | null
          rating?: number | null
          response_time_hours?: number | null
          service_areas?: string[] | null
          specialties?: string[] | null
          subscription_tier?: string | null
          success_rate?: number | null
          user_id?: string | null
          website?: string | null
          years_experience?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "vendor_profiles_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      vendor_documents_safe: {
        Row: {
          document_type: string | null
          file_name: string | null
          file_path: string | null
          file_size: number | null
          file_url: string | null
          id: string | null
          is_verified: boolean | null
          mime_type: string | null
          uploaded_at: string | null
          vendor_id: string | null
          verified_at: string | null
          verified_by: string | null
        }
        Insert: {
          document_type?: string | null
          file_name?: string | null
          file_path?: never
          file_size?: number | null
          file_url?: never
          id?: string | null
          is_verified?: boolean | null
          mime_type?: string | null
          uploaded_at?: string | null
          vendor_id?: string | null
          verified_at?: string | null
          verified_by?: string | null
        }
        Update: {
          document_type?: string | null
          file_name?: string | null
          file_path?: never
          file_size?: number | null
          file_url?: never
          id?: string | null
          is_verified?: boolean | null
          mime_type?: string | null
          uploaded_at?: string | null
          vendor_id?: string | null
          verified_at?: string | null
          verified_by?: string | null
        }
        Relationships: []
      }
      vendor_invoice_summary: {
        Row: {
          amount: number | null
          client_email_masked: string | null
          client_name: string | null
          created_at: string | null
          currency: string | null
          due_date: string | null
          id: string | null
          invoice_number: string | null
          milestone_id: string | null
          project_id: string | null
          status: string | null
          updated_at: string | null
          vendor_id: string | null
        }
        Insert: {
          amount?: number | null
          client_email_masked?: never
          client_name?: never
          created_at?: string | null
          currency?: string | null
          due_date?: string | null
          id?: string | null
          invoice_number?: string | null
          milestone_id?: string | null
          project_id?: string | null
          status?: string | null
          updated_at?: string | null
          vendor_id?: string | null
        }
        Update: {
          amount?: number | null
          client_email_masked?: never
          client_name?: never
          created_at?: string | null
          currency?: string | null
          due_date?: string | null
          id?: string | null
          invoice_number?: string | null
          milestone_id?: string | null
          project_id?: string | null
          status?: string | null
          updated_at?: string | null
          vendor_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "invoices_milestone_id_fkey"
            columns: ["milestone_id"]
            isOneToOne: false
            referencedRelation: "project_milestones"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "invoices_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Functions: {
      admin_approve_vendor:
        | {
            Args: {
              p_approved?: boolean
              p_notes?: string
              p_vendor_id: string
            }
            Returns: Json
          }
        | {
            Args: { approved: boolean; vendor_id_param: string }
            Returns: Json
          }
      admin_approve_vendor_enhanced: {
        Args: { p_approved?: boolean; p_notes?: string; p_vendor_id: string }
        Returns: Json
      }
      admin_assign_role: {
        Args: { p_granted_by?: string; p_role: string; p_user_id: string }
        Returns: Json
      }
      admin_assign_vendor: {
        Args: { project_id_param: string; vendor_id_param: string }
        Returns: Json
      }
      admin_assign_vendor_to_project_secure: {
        Args: { p_project_id: string; p_vendor_id: string }
        Returns: Json
      }
      admin_create_payment: {
        Args: {
          p_amount: number
          p_description: string
          p_due_date?: string
          p_payment_type: string
          p_title: string
          p_user_id: string
          p_user_type: string
        }
        Returns: Json
      }
      admin_create_project: {
        Args: {
          p_budget_max?: number
          p_budget_min?: number
          p_category: string
          p_deadline?: string
          p_description: string
          p_location?: string
          p_priority?: string
          p_property_id?: number
          p_skills_required?: string[]
          p_title: string
        }
        Returns: Json
      }
      admin_create_vendor_payment: {
        Args: {
          p_amount: number
          p_description: string
          p_due_date?: string
          p_payment_type: string
          p_template_id?: string
          p_title: string
          p_vendor_id: string
        }
        Returns: Json
      }
      admin_create_vendor_payment_secure: {
        Args: {
          p_amount: number
          p_description: string
          p_due_date?: string
          p_payment_type: string
          p_title: string
          p_vendor_id: string
        }
        Returns: Json
      }
      admin_get_vendor_payment_methods: {
        Args: { target_vendor_id: string }
        Returns: {
          created_at: string
          id: string
          is_default: boolean
          type: string
          vendor_id: string
        }[]
      }
      admin_invite_vendor: {
        Args: {
          p_company_name: string
          p_email: string
          p_invite_message?: string
          p_specialties?: string[]
        }
        Returns: Json
      }
      admin_send_payout: {
        Args: {
          p_amount: number
          p_notes?: string
          p_reference: string
          p_vendor_id: string
        }
        Returns: Json
      }
      admin_update_project_status_secure: {
        Args: { p_project_id: string; p_status: string }
        Returns: Json
      }
      admin_update_vendor_status_secure: {
        Args: { p_status: string; p_vendor_id: string }
        Returns: Json
      }
      assign_user_role: {
        Args: { new_role: string; target_user_id: string }
        Returns: undefined
      }
      assign_vendor_to_project:
        | {
            Args: {
              p_assigned_by?: string
              p_estimated_hours?: number
              p_hourly_rate?: number
              p_project_id: string
              p_vendor_id: string
            }
            Returns: undefined
          }
        | {
            Args: { project_id_param: string; vendor_id_param: string }
            Returns: Json
          }
      award_contract: {
        Args: {
          p_contract_value: number
          p_end_date: string
          p_rfq_id: string
          p_start_date: string
          p_vendor_id: string
        }
        Returns: string
      }
      calculate_bid_score: { Args: { p_bid_id: string }; Returns: number }
      can_access_room: { Args: { room_id: string }; Returns: boolean }
      check_auth_rate_limit: {
        Args: {
          p_identifier: string
          p_max_attempts?: number
          p_window_minutes?: number
        }
        Returns: boolean
      }
      check_rate_limit: {
        Args: {
          p_endpoint: string
          p_identifier: string
          p_max_requests?: number
          p_window_minutes?: number
        }
        Returns: boolean
      }
      cleanup_rate_limits: { Args: never; Returns: number }
      create_rfq: {
        Args: {
          p_deadline: string
          p_description: string
          p_lots: Json
          p_property_id: number
          p_title: string
        }
        Returns: string
      }
      create_secure_notification: {
        Args: {
          p_action_url?: string
          p_message: string
          p_title: string
          p_type?: string
          p_user_id: string
        }
        Returns: string
      }
      current_user_has_role: { Args: { role_name: string }; Returns: boolean }
      current_user_id: { Args: never; Returns: string }
      current_user_tenant_id: { Args: never; Returns: string }
      enhanced_auth_rate_limit_check: {
        Args: {
          p_endpoint: string
          p_identifier: string
          p_lockout_minutes?: number
          p_max_attempts?: number
          p_window_minutes?: number
        }
        Returns: boolean
      }
      enhanced_rate_limit_check: {
        Args: {
          p_endpoint: string
          p_identifier: string
          p_max_requests?: number
          p_window_minutes?: number
        }
        Returns: boolean
      }
      get_admin_dashboard_stats: {
        Args: never
        Returns: {
          active_projects: number
          completed_projects: number
          pending_projects: number
          total_projects: number
          total_properties: number
          total_users: number
          total_vendors: number
        }[]
      }
      get_admin_dashboard_stats_optimized: { Args: never; Returns: Json }
      get_admin_testing_stats: { Args: never; Returns: Json }
      get_current_user_roles: {
        Args: never
        Returns: {
          role: string
        }[]
      }
      get_document_signed_url: {
        Args: { bucket_name: string; expires_in?: number; file_path: string }
        Returns: string
      }
      get_masked_vendor_data: {
        Args: { vendor_user_id: string }
        Returns: Json
      }
      get_profile_image_url: {
        Args: { bucket_name: string; expires_in?: number; file_path: string }
        Returns: string
      }
      get_project_stats: {
        Args: never
        Returns: {
          completed_projects: number
          in_progress_projects: number
          open_projects: number
          total_projects: number
        }[]
      }
      get_public_property_count: {
        Args: {
          p_bedrooms?: number
          p_city?: string
          p_max_price?: number
          p_min_price?: number
          p_property_type?: string
          p_status?: string
        }
        Returns: number
      }
      get_public_property_listings: {
        Args: {
          p_bedrooms?: number
          p_city?: string
          p_limit?: number
          p_max_price?: number
          p_min_price?: number
          p_offset?: number
          p_property_type?: string
          p_status?: string
        }
        Returns: {
          amenities: string
          available_date: string
          bathrooms: number
          bedrooms: number
          city: string
          description: string
          id: number
          image_urls: string
          location_display: string
          price: number
          price_range: string
          property_type: string
          square_feet: string
          state: string
          status: string
          title: string
        }[]
      }
      get_recent_activity_summary: {
        Args: { activity_limit?: number; user_uuid: string }
        Returns: Json
      }
      get_tenant_emails: {
        Args: never
        Returns: {
          email: string
          full_name: string
          user_id: string
        }[]
      }
      get_user_id: { Args: never; Returns: string }
      get_user_profile_with_roles: {
        Args: { p_user_id: string }
        Returns: Json
      }
      get_user_roles: {
        Args: { user_uuid: string }
        Returns: {
          role: string
        }[]
      }
      get_user_tenant_id: { Args: { _user_id?: string }; Returns: string }
      get_vendor_dashboard_stats: {
        Args: { p_vendor_id: string }
        Returns: Json
      }
      get_vendor_dashboard_summary_optimized: {
        Args: { vendor_user_id: string }
        Returns: Json
      }
      get_vendor_emails: {
        Args: never
        Returns: {
          company_name: string
          email: string
          user_id: string
        }[]
      }
      get_vendor_projects_summary: {
        Args: {
          page_limit?: number
          page_offset?: number
          project_status?: string
          vendor_user_id: string
        }
        Returns: Json
      }
      has_pending_access_request: {
        Args: { p_user_id: string }
        Returns: boolean
      }
      has_rfq_access: {
        Args: { _rfq: string; _user: string }
        Returns: boolean
      }
      has_role: { Args: { _role: string; _user_id: string }; Returns: boolean }
      invite_vendors_to_rfq: {
        Args: { p_rfq_id: string; p_vendor_ids: string[] }
        Returns: Json
      }
      is_admin: { Args: never; Returns: boolean }
      is_admin_user: { Args: { user_uuid?: string }; Returns: boolean }
      is_current_user_admin: { Args: never; Returns: boolean }
      is_dashboard_query: { Args: never; Returns: boolean }
      is_staff_in_tenant: {
        Args: { target_tenant_id?: string }
        Returns: boolean
      }
      is_staff_or_admin: { Args: never; Returns: boolean }
      is_tenant_admin: {
        Args: { target_tenant_id?: string; user_uuid: string }
        Returns: boolean
      }
      log_audit_event: {
        Args: {
          p_action: string
          p_new_values?: Json
          p_old_values?: Json
          p_record_id: string
          p_table_name: string
        }
        Returns: undefined
      }
      log_audit_event_secure: {
        Args: {
          p_action: string
          p_new_values?: Json
          p_old_values?: Json
          p_record_id: string
          p_table_name: string
        }
        Returns: undefined
      }
      log_authorization_failure: { Args: never; Returns: undefined }
      log_security_audit: {
        Args: { p_details?: Json; p_event_type: string; p_severity: string }
        Returns: undefined
      }
      log_security_audit_enhanced: {
        Args: {
          p_details?: Json
          p_event_type: string
          p_severity: string
          p_user_id?: string
        }
        Returns: undefined
      }
      log_security_event: {
        Args: {
          details?: Json
          event_type: string
          p_record_id?: string
          p_table_name?: string
        }
        Returns: undefined
      }
      mask_email: { Args: { email: string }; Returns: string }
      migrate_existing_avatars: { Args: never; Returns: undefined }
      optimized_rate_limit_check: {
        Args: {
          p_endpoint: string
          p_identifier: string
          p_max_requests?: number
          p_window_minutes?: number
        }
        Returns: boolean
      }
      room_id_from_topic: { Args: { topic: string }; Returns: string }
      search_vendors_public: {
        Args: {
          p_location?: string
          p_min_rating?: number
          p_specialties?: string[]
        }
        Returns: {
          availability_status: string
          company_name: string
          completed_jobs: number
          id: string
          is_verified: boolean
          rating: number
          response_time_hours: number
          specialties: string[]
        }[]
      }
      set_user_role: {
        Args: { p_role: string; p_user: string }
        Returns: undefined
      }
      submit_access_request: {
        Args: {
          p_company_name?: string
          p_full_name?: string
          p_phone?: string
          p_role_requested: string
        }
        Returns: Json
      }
      submit_bid: {
        Args: {
          p_bid_lines: Json
          p_notes?: string
          p_rfq_id: string
          p_vendor_id: string
        }
        Returns: string
      }
      test_connection: { Args: never; Returns: string }
      update_project_status:
        | {
            Args: { p_project_id: string; p_status: string; p_user_id?: string }
            Returns: undefined
          }
        | {
            Args: { new_status: string; project_id_param: string }
            Returns: Json
          }
      update_vendor_profile_secure: {
        Args: {
          p_address?: string
          p_certifications?: string[]
          p_company_name?: string
          p_description?: string
          p_phone?: string
          p_specialties?: string[]
          p_user_id: string
          p_website?: string
          p_years_experience?: number
        }
        Returns: Json
      }
      user_has_role:
        | { Args: { role_name: string }; Returns: boolean }
        | { Args: { role_name: string; user_uuid: string }; Returns: boolean }
      user_has_role_in_tenant: {
        Args: {
          role_name: string
          target_tenant_id?: string
          user_uuid: string
        }
        Returns: boolean
      }
      validate_and_sanitize_input: {
        Args: { p_allow_html?: boolean; p_input: string; p_max_length?: number }
        Returns: string
      }
      validate_and_sanitize_input_enhanced: {
        Args: {
          p_allow_html?: boolean
          p_field_name?: string
          p_input: string
          p_max_length?: number
        }
        Returns: string
      }
      validate_and_sanitize_input_secure: {
        Args: { p_allow_html?: boolean; p_input: string; p_max_length?: number }
        Returns: string
      }
      validate_password_strength: {
        Args: { password: string }
        Returns: boolean
      }
    }
    Enums: {
      app_role:
        | "admin"
        | "property_manager"
        | "vendor"
        | "property_owner"
        | "tenant"
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
        "property_manager",
        "vendor",
        "property_owner",
        "tenant",
      ],
    },
  },
} as const
