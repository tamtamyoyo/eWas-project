import { createClient, SupabaseClient, PostgrestResponse } from "@supabase/supabase-js";
import * as schema from "@shared/schema";
import { Database } from "./types/supabase";

// Supabase Configuration
const supabaseUrl = process.env.SUPABASE_URL || 'https://ymhkgyfgpddifplpsnyt.supabase.co';
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;

// Check if running in development mode and use mock data if needed
const isDevelopment = process.env.NODE_ENV === 'development';
const useMockData = isDevelopment && !supabaseAnonKey;

// Create Supabase client if keys are available
export let supabase: SupabaseClient<Database> | null = null;
if (supabaseAnonKey) {
  supabase = createClient<Database>(supabaseUrl, supabaseAnonKey, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true
    },
    global: {
      headers: {
        'x-application-name': 'eWas-social-platform'
      }
    }
  });
  console.log('Supabase client initialized successfully');
} else {
  console.log('Supabase client not initialized. Missing SUPABASE_ANON_KEY');
}

// Helper function to query data from Supabase
export const query = async <T = any>(
  table: string, 
  queryFn: ((query: any) => any) | null = null
): Promise<T[]> => {
  if (!supabase) {
    if (useMockData) {
      return mockQuery(table, queryFn) as T[];
    }
    throw new Error('Database not initialized. Check your environment variables.');
  }

  let queryBuilder = supabase.from(table).select();
  
  if (queryFn) {
    queryBuilder = queryFn(queryBuilder);
  }
  
  const { data, error }: PostgrestResponse<T> = await queryBuilder;
  
  if (error) {
    console.error(`Error querying ${table}:`, error);
    throw error;
  }
  
  return data || [];
};

// Mock database for local development when Supabase is not configured
const mockDb: Record<string, any[]> = {
  // Mock users table
  users: [
    { id: 1, email: 'test@example.com', username: 'testuser', fullName: 'Test User' }
  ],
  
  // Mock social accounts
  social_accounts: [
    { id: 1, user_id: 1, platform: 'twitter', access_token: 'mock-token', username: 'testtwitter', account_id: '12345', account_name: 'Test Twitter' },
    { id: 2, user_id: 1, platform: 'facebook', access_token: 'mock-token', username: 'testfacebook', account_id: '67890', account_name: 'Test Facebook' }
  ],
  
  // Mock posts
  posts: [
    { 
      id: 1, 
      user_id: 1, 
      content: 'This is a test post', 
      platforms: ['twitter', 'facebook'],
      status: 'published', 
      created_at: new Date() 
    }
  ],

  // Mock subscription plans
  subscription_plans: [
    {
      id: 1,
      name: 'Free',
      description: 'Basic plan',
      price: 0,
      interval: 'monthly',
      features: { basic: true },
      max_accounts: 2
    },
    {
      id: 2,
      name: 'Pro',
      description: 'Professional plan',
      price: 9900,
      interval: 'monthly',
      features: { basic: true, advanced: true },
      max_accounts: 10
    }
  ]
};

// Mock query function that simulates Supabase queries
const mockQuery = (table: string, queryFn: ((query: any) => any) | null) => {
  if (!mockDb[table]) {
    return [];
  }

  let result = [...mockDb[table]];
  
  if (queryFn) {
    // This is a simplified mock of how queryFn works
    // In real code, queryFn would modify the query builder
    // Here we just filter results based on common operations
    const mockQueryBuilder = {
      select: () => mockQueryBuilder,
      eq: (field: string, value: any) => {
        result = result.filter(row => row[field] === value);
        return mockQueryBuilder;
      },
      in: (field: string, values: any[]) => {
        result = result.filter(row => values.includes(row[field]));
        return mockQueryBuilder;
      },
      order: (field: string, { ascending }: { ascending: boolean }) => {
        result.sort((a, b) => {
          if (ascending) {
            return a[field] > b[field] ? 1 : -1;
          } else {
            return a[field] < b[field] ? 1 : -1;
          }
        });
        return mockQueryBuilder;
      },
      limit: (num: number) => {
        result = result.slice(0, num);
        return mockQueryBuilder;
      }
    };
    
    queryFn(mockQueryBuilder);
  }
  
  return result;
};

// Database schema types for TypeScript support
export const db = {
  schema
};

export default supabase;