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
      branches: {
        Row: {
          id: string
          code: string
          name: string
          address: string | null
          phone: string | null
          active: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          code: string
          name: string
          address?: string | null
          phone?: string | null
          active?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          code?: string
          name?: string
          address?: string | null
          phone?: string | null
          active?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      branch_stock: {
        Row: {
          id: string
          product_id: string
          branch_id: string
          quantity: number
          last_updated: string
          created_at: string
        }
        Insert: {
          id?: string
          product_id: string
          branch_id: string
          quantity?: number
          last_updated?: string
          created_at?: string
        }
        Update: {
          id?: string
          product_id?: string
          branch_id?: string
          quantity?: number
          last_updated?: string
          created_at?: string
        }
      }
      profiles: {
        Row: {
          id: string
          email: string
          full_name: string | null
          phone: string | null
          avatar_url: string | null
          is_admin: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          email: string
          full_name?: string | null
          phone?: string | null
          avatar_url?: string | null
          is_admin?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          email?: string
          full_name?: string | null
          phone?: string | null
          avatar_url?: string | null
          is_admin?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      stores: {
        Row: {
          id: string
          name: string
          address: string
          city: string
          province: string | null
          phone: string
          whatsapp: string | null
          email: string | null
          latitude: number | null
          longitude: number | null
          opening_hours: Json
          background_image_url: string | null
          is_main: boolean
          active: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          address: string
          city?: string
          province?: string | null
          phone: string
          whatsapp?: string | null
          email?: string | null
          latitude?: number | null
          longitude?: number | null
          opening_hours?: Json
          background_image_url?: string | null
          is_main?: boolean
          active?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          address?: string
          city?: string
          province?: string | null
          phone?: string
          whatsapp?: string | null
          email?: string | null
          latitude?: number | null
          longitude?: number | null
          opening_hours?: Json
          background_image_url?: string | null
          is_main?: boolean
          active?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      categories: {
        Row: {
          id: string
          name: string
          slug: string
          description: string | null
          image_url: string | null
          parent_id: string | null
          display_order: number
          active: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          slug: string
          description?: string | null
          image_url?: string | null
          parent_id?: string | null
          display_order?: number
          active?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          slug?: string
          description?: string | null
          image_url?: string | null
          parent_id?: string | null
          display_order?: number
          active?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      brands: {
        Row: {
          id: string
          name: string
          slug: string
          logo_url: string | null
          website: string | null
          description: string | null
          featured: boolean
          active: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          slug: string
          logo_url?: string | null
          website?: string | null
          description?: string | null
          featured?: boolean
          active?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          slug?: string
          logo_url?: string | null
          website?: string | null
          description?: string | null
          featured?: boolean
          active?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      products: {
        Row: {
          id: string
          sku: string
          name: string
          slug: string
          description: string | null
          brand_id: string | null
          brand_name: string | null
          category_id: string | null
          width: number | null
          aspect_ratio: number | null
          rim_diameter: number | null
          construction: string | null
          load_index: number | null
          speed_rating: string | null
          extra_load: boolean
          run_flat: boolean
          seal_inside: boolean
          tube_type: boolean
          homologation: string | null
          original_description: string | null
          display_name: string | null
          parse_confidence: number | null
          parse_warnings: string[] | null
          season: string | null
          price: number | null
          sale_price: number | null
          cost: number | null
          stock_quantity: number
          stock: number // Alias for stock_quantity
          min_stock_alert: number
          features: Json
          specifications: Json
          status: 'active' | 'inactive' | 'out_of_stock'
          featured: boolean
          best_seller: boolean
          new_arrival: boolean
          meta_title: string | null
          meta_description: string | null
          meta_keywords: string[] | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          sku: string
          name: string
          slug: string
          description?: string | null
          brand_id?: string | null
          brand_name?: string | null
          category_id?: string | null
          width?: number | null
          aspect_ratio?: number | null
          rim_diameter?: number | null
          construction?: string | null
          load_index?: number | null
          speed_rating?: string | null
          extra_load?: boolean
          run_flat?: boolean
          seal_inside?: boolean
          tube_type?: boolean
          homologation?: string | null
          original_description?: string | null
          display_name?: string | null
          parse_confidence?: number | null
          parse_warnings?: string[] | null
          season?: string | null
          price?: number | null
          sale_price?: number | null
          cost?: number | null
          stock_quantity?: number
          stock?: number // Alias for stock_quantity
          min_stock_alert?: number
          features?: Json
          specifications?: Json
          status?: 'active' | 'inactive' | 'out_of_stock'
          featured?: boolean
          best_seller?: boolean
          new_arrival?: boolean
          meta_title?: string | null
          meta_description?: string | null
          meta_keywords?: string[] | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          sku?: string
          name?: string
          slug?: string
          description?: string | null
          brand_id?: string | null
          brand_name?: string | null
          category_id?: string | null
          width?: number | null
          aspect_ratio?: number | null
          rim_diameter?: number | null
          construction?: string | null
          load_index?: number | null
          speed_rating?: string | null
          extra_load?: boolean
          run_flat?: boolean
          seal_inside?: boolean
          tube_type?: boolean
          homologation?: string | null
          original_description?: string | null
          display_name?: string | null
          parse_confidence?: number | null
          parse_warnings?: string[] | null
          season?: string | null
          price?: number | null
          sale_price?: number | null
          cost?: number | null
          stock_quantity?: number
          stock?: number // Alias for stock_quantity
          min_stock_alert?: number
          features?: Json
          specifications?: Json
          status?: 'active' | 'inactive' | 'out_of_stock'
          featured?: boolean
          best_seller?: boolean
          new_arrival?: boolean
          meta_title?: string | null
          meta_description?: string | null
          meta_keywords?: string[] | null
          created_at?: string
          updated_at?: string
        }
      }
      product_images: {
        Row: {
          id: string
          product_id: string
          url: string
          alt_text: string | null
          is_primary: boolean
          display_order: number
          created_at: string
        }
        Insert: {
          id?: string
          product_id: string
          url: string
          alt_text?: string | null
          is_primary?: boolean
          display_order?: number
          created_at?: string
        }
        Update: {
          id?: string
          product_id?: string
          url?: string
          alt_text?: string | null
          is_primary?: boolean
          display_order?: number
          created_at?: string
        }
      }
      vouchers: {
        Row: {
          id: string
          code: string
          customer_name: string
          customer_email: string
          customer_phone: string
          product_id: string | null
          product_details: Json
          quantity: number
          unit_price: number
          total_price: number
          discount_percentage: number
          discount_amount: number
          final_price: number
          valid_from: string
          valid_until: string
          status: 'active' | 'redeemed' | 'expired' | 'cancelled'
          notes: string | null
          redeemed_at: string | null
          redeemed_by: string | null
          redemption_notes: string | null
          store_id: string | null
          created_by: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          code?: string
          customer_name: string
          customer_email: string
          customer_phone: string
          product_id?: string | null
          product_details: Json
          quantity?: number
          unit_price: number
          total_price: number
          discount_percentage?: number
          discount_amount?: number
          final_price: number
          valid_from?: string
          valid_until?: string
          status?: 'active' | 'redeemed' | 'expired' | 'cancelled'
          notes?: string | null
          redeemed_at?: string | null
          redeemed_by?: string | null
          redemption_notes?: string | null
          store_id?: string | null
          created_by?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          code?: string
          customer_name?: string
          customer_email?: string
          customer_phone?: string
          product_id?: string | null
          product_details?: Json
          quantity?: number
          unit_price?: number
          total_price?: number
          discount_percentage?: number
          discount_amount?: number
          final_price?: number
          valid_from?: string
          valid_until?: string
          status?: 'active' | 'redeemed' | 'expired' | 'cancelled'
          notes?: string | null
          redeemed_at?: string | null
          redeemed_by?: string | null
          redemption_notes?: string | null
          store_id?: string | null
          created_by?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      appointments: {
        Row: {
          id: string
          customer_name: string
          customer_email: string
          customer_phone: string
          vehicle_make: string | null
          vehicle_model: string | null
          vehicle_year: number | null
          service_type: string
          preferred_date: string
          preferred_time: string
          alternative_date: string | null
          alternative_time: string | null
          notes: string | null
          status: 'pending' | 'confirmed' | 'completed' | 'cancelled'
          source: 'website' | 'whatsapp' | 'phone' | 'walk_in' | 'app' | 'admin'
          store_id: string | null
          assigned_to: string | null
          confirmed_date: string | null
          confirmed_time: string | null
          confirmation_notes: string | null
          completed_at: string | null
          completion_notes: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          customer_name: string
          customer_email: string
          customer_phone: string
          vehicle_make?: string | null
          vehicle_model?: string | null
          vehicle_year?: number | null
          service_type: string
          preferred_date: string
          preferred_time: string
          alternative_date?: string | null
          alternative_time?: string | null
          notes?: string | null
          status?: 'pending' | 'confirmed' | 'completed' | 'cancelled'
          source?: 'website' | 'whatsapp' | 'phone' | 'walk_in' | 'app' | 'admin'
          store_id?: string | null
          assigned_to?: string | null
          confirmed_date?: string | null
          confirmed_time?: string | null
          confirmation_notes?: string | null
          completed_at?: string | null
          completion_notes?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          customer_name?: string
          customer_email?: string
          customer_phone?: string
          vehicle_make?: string | null
          vehicle_model?: string | null
          vehicle_year?: number | null
          service_type?: string
          preferred_date?: string
          preferred_time?: string
          alternative_date?: string | null
          alternative_time?: string | null
          notes?: string | null
          status?: 'pending' | 'confirmed' | 'completed' | 'cancelled'
          source?: 'website' | 'whatsapp' | 'phone' | 'walk_in' | 'app' | 'admin'
          store_id?: string | null
          assigned_to?: string | null
          confirmed_date?: string | null
          confirmed_time?: string | null
          confirmation_notes?: string | null
          completed_at?: string | null
          completion_notes?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      reviews: {
        Row: {
          id: string
          product_id: string
          user_id: string | null
          customer_name: string
          customer_email: string | null
          rating: number
          title: string | null
          comment: string
          verified_purchase: boolean
          helpful_count: number
          not_helpful_count: number
          admin_response: string | null
          admin_response_at: string | null
          is_featured: boolean
          is_approved: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          product_id: string
          user_id?: string | null
          customer_name: string
          customer_email?: string | null
          rating: number
          title?: string | null
          comment: string
          verified_purchase?: boolean
          helpful_count?: number
          not_helpful_count?: number
          admin_response?: string | null
          admin_response_at?: string | null
          is_featured?: boolean
          is_approved?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          product_id?: string
          user_id?: string | null
          customer_name?: string
          customer_email?: string | null
          rating?: number
          title?: string | null
          comment?: string
          verified_purchase?: boolean
          helpful_count?: number
          not_helpful_count?: number
          admin_response?: string | null
          admin_response_at?: string | null
          is_featured?: boolean
          is_approved?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      review_images: {
        Row: {
          id: string
          review_id: string
          url: string
          alt_text: string | null
          display_order: number
          created_at: string
        }
        Insert: {
          id?: string
          review_id: string
          url: string
          alt_text?: string | null
          display_order?: number
          created_at?: string
        }
        Update: {
          id?: string
          review_id?: string
          url?: string
          alt_text?: string | null
          display_order?: number
          created_at?: string
        }
      }
      cart_sessions: {
        Row: {
          id: string
          session_id: string
          user_id: string | null
          expires_at: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          session_id: string
          user_id?: string | null
          expires_at?: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          session_id?: string
          user_id?: string | null
          expires_at?: string
          created_at?: string
          updated_at?: string
        }
      }
      cart_items: {
        Row: {
          id: string
          cart_session_id: string
          product_id: string
          quantity: number
          price_at_time: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          cart_session_id: string
          product_id: string
          quantity?: number
          price_at_time: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          cart_session_id?: string
          product_id?: string
          quantity?: number
          price_at_time?: number
          created_at?: string
          updated_at?: string
        }
      }
      orders: {
        Row: {
          id: string
          customer_name: string
          customer_email: string
          customer_phone: string
          items: Json
          total: number
          status: 'pending' | 'confirmed' | 'completed' | 'cancelled'
          payment_method: string
          notes: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          customer_name: string
          customer_email: string
          customer_phone: string
          items: Json
          total: number
          status?: 'pending' | 'confirmed' | 'completed' | 'cancelled'
          payment_method: string
          notes?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          customer_name?: string
          customer_email?: string
          customer_phone?: string
          items?: Json
          total?: number
          status?: 'pending' | 'confirmed' | 'completed' | 'cancelled'
          payment_method?: string
          notes?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      quotes: {
        Row: {
          id: string
          customer_name: string
          customer_email: string | null
          customer_phone: string
          items: Json
          total: number
          status: 'pending' | 'confirmed' | 'completed' | 'cancelled'
          payment_method: string | null
          notes: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          customer_name: string
          customer_email?: string | null
          customer_phone: string
          items: Json
          total: number
          status?: 'pending' | 'confirmed' | 'completed' | 'cancelled'
          payment_method?: string | null
          notes?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          customer_name?: string
          customer_email?: string | null
          customer_phone?: string
          items?: Json
          total?: number
          status?: 'pending' | 'confirmed' | 'completed' | 'cancelled'
          payment_method?: string | null
          notes?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      service_vouchers: {
        Row: {
          id: string
          code: string
          customer_name: string
          customer_email: string
          customer_phone: string
          service_type: string
          service_details: Json | null
          discount_percentage: number
          discount_amount: number
          final_price: number
          valid_from: string
          valid_until: string
          is_redeemed: boolean
          notes: string | null
          redeemed_at: string | null
          redeemed_by: string | null
          redemption_notes: string | null
          store_id: string | null
          created_by: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          code?: string
          customer_name: string
          customer_email: string
          customer_phone: string
          service_type: string
          service_details?: Json | null
          discount_percentage?: number
          discount_amount?: number
          final_price: number
          valid_from?: string
          valid_until?: string
          is_redeemed?: boolean
          notes?: string | null
          redeemed_at?: string | null
          redeemed_by?: string | null
          redemption_notes?: string | null
          store_id?: string | null
          created_by?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          code?: string
          customer_name?: string
          customer_email?: string
          customer_phone?: string
          service_type?: string
          service_details?: Json | null
          discount_percentage?: number
          discount_amount?: number
          final_price?: number
          valid_from?: string
          valid_until?: string
          is_redeemed?: boolean
          notes?: string | null
          redeemed_at?: string | null
          redeemed_by?: string | null
          redemption_notes?: string | null
          store_id?: string | null
          created_by?: string | null
          created_at?: string
          updated_at?: string
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      calculate_cart_total: {
        Args: { session_uuid: string }
        Returns: {
          subtotal: number
          tax: number
          shipping: number
          total: number
          items_count: number
        }[]
      }
      clean_expired_carts: {
        Args: Record<PropertyKey, never>
        Returns: number
      }
      generate_voucher_code: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      get_analytics: {
        Args: { start_date: string; end_date: string }
        Returns: {
          total_vouchers: number
          active_vouchers: number
          redeemed_vouchers: number
          total_appointments: number
          pending_appointments: number
          completed_appointments: number
          total_reviews: number
          average_rating: number
          low_stock_products: number
        }[]
      }
      get_product_details: {
        Args: { product_slug: string }
        Returns: {
          id: string
          sku: string
          name: string
          slug: string
          description: string | null
          brand_id: string | null
          brand_name: string | null
          brand_slug: string | null
          category_id: string | null
          category_name: string | null
          category_slug: string | null
          width: number | null
          aspect_ratio: number | null
          rim_diameter: number | null
          load_index: number | null
          speed_rating: string | null
          season: string | null
          price: number
          sale_price: number | null
          stock_quantity: number
          features: Json
          specifications: Json
          status: 'active' | 'inactive' | 'out_of_stock'
          featured: boolean
          best_seller: boolean
          new_arrival: boolean
          images: Json
          rating: number
          review_count: number
          meta_title: string | null
          meta_description: string | null
        }[]
      }
      get_store_availability: {
        Args: { store_uuid: string; check_date: string }
        Returns: {
          time_slot: string
          is_available: boolean
          appointments_count: number
        }[]
      }
      search_products: {
        Args: {
          search_query?: string
          category_filter?: string
          brand_filter?: string
          min_price?: number
          max_price?: number
          limit_results?: number
        }
        Returns: {
          id: string
          name: string
          slug: string
          description: string | null
          price: number
          sale_price: number | null
          brand_name: string | null
          category_name: string | null
          image_url: string | null
          rating: number
          review_count: number
        }[]
      }
    }
    Enums: {
      appointment_status: 'pending' | 'confirmed' | 'completed' | 'cancelled'
      order_source: 'website' | 'whatsapp' | 'phone' | 'walk_in' | 'app' | 'admin'
      product_status: 'active' | 'inactive' | 'out_of_stock'
      voucher_status: 'active' | 'redeemed' | 'expired' | 'cancelled'
    }
  }
}