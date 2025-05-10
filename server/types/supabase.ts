// Generated types for Supabase
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
      users: {
        Row: {
          id: number
          username: string | null
          email: string
          password: string | null
          full_name: string | null
          photo_url: string | null
          google_id: string | null
          language: string
          theme: string
          stripe_customer_id: string | null
          stripe_subscription_id: string | null
          current_plan: string
          is_owner: boolean
          created_at: string
        }
        Insert: {
          id?: number
          username?: string | null
          email: string
          password?: string | null
          full_name?: string | null
          photo_url?: string | null
          google_id?: string | null
          language?: string
          theme?: string
          stripe_customer_id?: string | null
          stripe_subscription_id?: string | null
          current_plan?: string
          is_owner?: boolean
          created_at?: string
        }
        Update: {
          id?: number
          username?: string | null
          email?: string
          password?: string | null
          full_name?: string | null
          photo_url?: string | null
          google_id?: string | null
          language?: string
          theme?: string
          stripe_customer_id?: string | null
          stripe_subscription_id?: string | null
          current_plan?: string
          is_owner?: boolean
          created_at?: string
        }
      }
      social_accounts: {
        Row: {
          id: number
          user_id: number
          platform: string
          account_id: string
          account_name: string
          access_token: string
          access_token_secret: string | null
          refresh_token: string | null
          token_expiry: string | null
          is_connected: boolean
          profile_url: string | null
          username: string | null
          name: string | null
          created_at: string
        }
        Insert: {
          id?: number
          user_id: number
          platform: string
          account_id: string
          account_name: string
          access_token: string
          access_token_secret?: string | null
          refresh_token?: string | null
          token_expiry?: string | null
          is_connected?: boolean
          profile_url?: string | null
          username?: string | null
          name?: string | null
          created_at?: string
        }
        Update: {
          id?: number
          user_id?: number
          platform?: string
          account_id?: string
          account_name?: string
          access_token?: string
          access_token_secret?: string | null
          refresh_token?: string | null
          token_expiry?: string | null
          is_connected?: boolean
          profile_url?: string | null
          username?: string | null
          name?: string | null
          created_at?: string
        }
      }
      posts: {
        Row: {
          id: number
          user_id: number
          content: string
          media_urls: string[] | null
          scheduled_at: string | null
          published_at: string | null
          platforms: string[]
          status: string
          analytics: Json | null
          created_at: string
        }
        Insert: {
          id?: number
          user_id: number
          content: string
          media_urls?: string[] | null
          scheduled_at?: string | null
          published_at?: string | null
          platforms: string[]
          status: string
          analytics?: Json | null
          created_at?: string
        }
        Update: {
          id?: number
          user_id?: number
          content?: string
          media_urls?: string[] | null
          scheduled_at?: string | null
          published_at?: string | null
          platforms?: string[]
          status?: string
          analytics?: Json | null
          created_at?: string
        }
      }
      subscription_plans: {
        Row: {
          id: number
          name: string
          description: string
          price: number
          interval: string
          features: Json
          max_accounts: number
          max_scheduled_posts: number | null
          has_advanced_analytics: boolean
          has_team_members: boolean
          max_team_members: number | null
          has_social_listening: boolean
          created_at: string
        }
        Insert: {
          id?: number
          name: string
          description: string
          price: number
          interval: string
          features: Json
          max_accounts: number
          max_scheduled_posts?: number | null
          has_advanced_analytics?: boolean
          has_team_members?: boolean
          max_team_members?: number | null
          has_social_listening?: boolean
          created_at?: string
        }
        Update: {
          id?: number
          name?: string
          description?: string
          price?: number
          interval?: string
          features?: Json
          max_accounts?: number
          max_scheduled_posts?: number | null
          has_advanced_analytics?: boolean
          has_team_members?: boolean
          max_team_members?: number | null
          has_social_listening?: boolean
          created_at?: string
        }
      }
      team_members: {
        Row: {
          id: number
          owner_id: number
          member_id: number
          role: string
          status: string
          invite_token: string | null
          invite_email: string
          permissions: Json | null
          created_at: string
          expires_at: string | null
        }
        Insert: {
          id?: number
          owner_id: number
          member_id: number
          role?: string
          status?: string
          invite_token?: string | null
          invite_email: string
          permissions?: Json | null
          created_at?: string
          expires_at?: string | null
        }
        Update: {
          id?: number
          owner_id?: number
          member_id?: number
          role?: string
          status?: string
          invite_token?: string | null
          invite_email?: string
          permissions?: Json | null
          created_at?: string
          expires_at?: string | null
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
} 