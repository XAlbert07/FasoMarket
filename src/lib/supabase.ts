import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables')
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          email: string
          full_name: string | null
          phone: string | null
          role: 'merchant' | 'admin'
          created_at: string
          updated_at: string | null
        }
        Insert: {
          id?: string
          email: string
          full_name?: string | null
          phone?: string | null
          role?: 'merchant' | 'admin'
          created_at?: string
          updated_at?: string | null
        }
        Update: {
          id?: string
          email?: string
          full_name?: string | null
          phone?: string | null
          role?: 'merchant' | 'admin'
          created_at?: string
          updated_at?: string | null
        }
      }

      categories: {
        Row: {
          id: string
          name: string
          slug: string
          description: string | null
          icon: string | null
          parent_id: string | null
          created_at: string
        }
        Insert: {
          id?: string
          name: string
          slug: string
          description?: string | null
          icon?: string | null
          parent_id?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          name?: string
          slug?: string
          description?: string | null
          icon?: string | null
          parent_id?: string | null
          created_at?: string
        }
      }

      listings: {
        Row: {
          id: string
          title: string
          description: string
          price: number
          currency: string
          category_id: string
          user_id: string
          location: string
          condition: 'new' | 'used' | 'refurbished'
          status: 'active' | 'sold' | 'expired' | 'suspended'
          images: string[]
          contact_phone: string | null
          contact_email: string | null
          contact_whatsapp: string | null
          featured: boolean
          views_count: number
          created_at: string
          updated_at: string
          expires_at: string | null
        }
        Insert: {
          id?: string
          title: string
          description: string
          price: number
          currency?: string
          category_id: string
          user_id: string
          location: string
          condition: 'new' | 'used' | 'refurbished'
          status?: 'active' | 'sold' | 'expired' | 'suspended'
          images?: string[]
          contact_phone?: string | null
          contact_email?: string | null
          contact_whatsapp?: string | null
          featured?: boolean
          views_count?: number
          created_at?: string
          updated_at?: string
          expires_at?: string | null
        }
        Update: {
          id?: string
          title?: string
          description?: string
          price?: number
          currency?: string
          category_id?: string
          user_id?: string
          location?: string
          condition?: 'new' | 'used' | 'refurbished'
          status?: 'active' | 'sold' | 'expired' | 'suspended'
          images?: string[]
          contact_phone?: string | null
          contact_email?: string | null
          contact_whatsapp?: string | null
          featured?: boolean
          views_count?: number
          created_at?: string
          updated_at?: string
          expires_at?: string | null
        }
      }

      messages: {
        Row: {
          id: string
          listing_id: string
          sender_id: string
          receiver_id: string
          content: string
          read: boolean
          created_at: string
        }
        Insert: {
          id?: string
          listing_id: string
          sender_id: string
          receiver_id: string
          content: string
          read?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          listing_id?: string
          sender_id?: string
          receiver_id?: string
          content?: string
          read?: boolean
          created_at?: string
        }
      }

      favorites: {
        Row: {
          id: string
          user_id: string
          listing_id: string
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          listing_id: string
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          listing_id?: string
          created_at?: string
        }
      }

      reports: {
        Row: {
          id: string
          listing_id: string | null
          user_id: string | null
          reporter_id: string
          reason: string
          description: string | null
          status: 'pending' | 'reviewed' | 'resolved' | 'dismissed'
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          listing_id?: string | null
          user_id?: string | null
          reporter_id: string
          reason: string
          description?: string | null
          status?: 'pending' | 'reviewed' | 'resolved' | 'dismissed'
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          listing_id?: string | null
          user_id?: string | null
          reporter_id?: string
          reason?: string
          description?: string | null
          status?: 'pending' | 'reviewed' | 'resolved' | 'dismissed'
          created_at?: string
          updated_at?: string
        }
      }
    }
  }
}
