import { createClient } from '@supabase/supabase-js';
import type { Database } from '../../../server/types/supabase';
import { SUPABASE_CONFIG } from './env-config';

// Get environment variables from the config
const supabaseUrl = SUPABASE_CONFIG.SUPABASE_URL;
const supabaseAnonKey = SUPABASE_CONFIG.SUPABASE_ANON_KEY;

// Create Supabase client
export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true
  }
});

// Export helper functions
export async function signIn(email: string, password: string) {
  return await supabase.auth.signInWithPassword({ email, password });
}

export async function signUp(email: string, password: string, metadata?: any) {
  return await supabase.auth.signUp({
    email, 
    password,
    options: {
      data: metadata,
      emailRedirectTo: `${window.location.origin}/auth/callback`
    }
  });
}

export async function signOut() {
  return await supabase.auth.signOut();
}

export async function resetPassword(email: string) {
  return await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${window.location.origin}/auth/reset-password`
  });
}

export async function getCurrentUser() {
  return await supabase.auth.getUser();
}

export async function getCurrentSession() {
  return await supabase.auth.getSession();
}

export async function updateUserPassword(password: string) {
  return await supabase.auth.updateUser({ password });
}

export async function signInWithProvider(provider: 'google' | 'twitter' | 'facebook' | 'linkedin' | 'instagram' | 'snapchat') {
  return await supabase.auth.signInWithOAuth({
    provider: provider as any, // Type assertion needed as Supabase might not have all these types defined
    options: {
      redirectTo: `${window.location.origin}/auth/callback`
    }
  });
}

// Listen for auth changes
export function onAuthStateChange(callback: (event: any, session: any) => void) {
  return supabase.auth.onAuthStateChange(callback);
} 