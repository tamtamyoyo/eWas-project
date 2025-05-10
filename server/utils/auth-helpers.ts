import supabase from '../db';
import { getUserByEmail, createUser, updateUser } from './supabase-helpers';
import { Database } from '../types/supabase';

type UserRow = Database['public']['Tables']['users']['Row'];
type UserInsert = Database['public']['Tables']['users']['Insert'];

/**
 * Sign up a new user with email and password
 * @param email User's email
 * @param password User's password
 * @param userData Additional user data
 * @returns User object or null if sign up failed
 */
export async function signUpWithEmail(
  email: string, 
  password: string,
  userData: Omit<UserInsert, 'email' | 'password'>
): Promise<UserRow | null> {
  if (!supabase) {
    throw new Error('Authentication service not initialized');
  }
  
  // First sign up the user with Supabase Auth
  const { data: authData, error: authError } = await supabase.auth.signUp({
    email,
    password,
    options: {
      emailRedirectTo: `${process.env.APP_URL || 'http://localhost:3000'}/auth/callback`
    }
  });
  
  if (authError) {
    console.error('Error during user sign up with Supabase Auth:', authError);
    throw authError;
  }
  
  // Then add the user to our users table
  try {
    const user = await createUser({
      email,
      password: null, // Don't store the password in our table since Supabase Auth handles it
      ...userData
    });
    
    return user;
  } catch (error) {
    console.error('Error creating user in database after auth signup:', error);
    throw error;
  }
}

/**
 * Sign in a user with email and password
 * @param email User's email
 * @param password User's password
 * @returns Session data or null if sign in failed
 */
export async function signInWithEmail(email: string, password: string) {
  if (!supabase) {
    throw new Error('Authentication service not initialized');
  }
  
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password
  });
  
  if (error) {
    console.error('Error during user sign in:', error);
    throw error;
  }
  
  // Get the user details from our database
  const dbUser = await getUserByEmail(email);
  
  return {
    session: data.session,
    user: dbUser
  };
}

/**
 * Sign out the current user
 */
export async function signOut() {
  if (!supabase) {
    throw new Error('Authentication service not initialized');
  }
  
  const { error } = await supabase.auth.signOut();
  
  if (error) {
    console.error('Error during sign out:', error);
    throw error;
  }
  
  return true;
}

/**
 * Get the current session
 * @returns Current session or null if not authenticated
 */
export async function getSession() {
  if (!supabase) {
    throw new Error('Authentication service not initialized');
  }
  
  const { data, error } = await supabase.auth.getSession();
  
  if (error) {
    console.error('Error getting session:', error);
    throw error;
  }
  
  return data.session;
}

/**
 * Get the current user
 * @returns Current user or null if not authenticated
 */
export async function getCurrentUser() {
  if (!supabase) {
    throw new Error('Authentication service not initialized');
  }
  
  const { data, error } = await supabase.auth.getUser();
  
  if (error) {
    console.error('Error getting current user:', error);
    throw error;
  }
  
  if (!data.user) {
    return null;
  }
  
  // Get the user details from our database
  const dbUser = await getUserByEmail(data.user.email || '');
  
  return dbUser;
}

/**
 * Check if a user is authenticated
 * @returns True if user is authenticated, false otherwise
 */
export async function isAuthenticated() {
  const session = await getSession();
  return session !== null;
}

/**
 * Sign in with a social provider
 * @param provider Provider name (e.g., 'google', 'twitter')
 * @param redirectTo URL to redirect to after sign in
 */
export async function signInWithProvider(provider: 'google' | 'twitter' | 'facebook', redirectTo?: string) {
  if (!supabase) {
    throw new Error('Authentication service not initialized');
  }
  
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider,
    options: {
      redirectTo: redirectTo || `${process.env.APP_URL || 'http://localhost:3000'}/auth/callback`
    }
  });
  
  if (error) {
    console.error(`Error during sign in with ${provider}:`, error);
    throw error;
  }
  
  return data;
}

/**
 * Reset password
 * @param email User's email
 */
export async function resetPassword(email: string) {
  if (!supabase) {
    throw new Error('Authentication service not initialized');
  }
  
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${process.env.APP_URL || 'http://localhost:3000'}/auth/reset-password`
  });
  
  if (error) {
    console.error('Error during password reset:', error);
    throw error;
  }
  
  return true;
}

/**
 * Update a user's password
 * @param newPassword New password
 */
export async function updatePassword(newPassword: string) {
  if (!supabase) {
    throw new Error('Authentication service not initialized');
  }
  
  const { error } = await supabase.auth.updateUser({
    password: newPassword
  });
  
  if (error) {
    console.error('Error updating password:', error);
    throw error;
  }
  
  return true;
}

/**
 * Update a user's profile
 * @param userId User ID
 * @param userData User data to update
 */
export async function updateProfile(userId: number, userData: Partial<UserRow>) {
  return await updateUser(userId, userData);
}

/**
 * Handle auth state changes (like sign-ins)
 */
export function setupAuthStateListener() {
  if (!supabase) {
    throw new Error('Authentication service not initialized');
  }
  
  return supabase.auth.onAuthStateChange(async (event, session) => {
    if (event === 'SIGNED_IN' && session?.user) {
      const { user } = session;
      const email = user.email;
      
      if (!email) return;
      
      // Check if user exists in our DB
      const dbUser = await getUserByEmail(email);
      
      // Create user in our DB if it doesn't exist
      if (!dbUser) {
        const userMetadata = user.user_metadata || {};
        const appMetadata = user.app_metadata || {};
        
        const newUser: UserInsert = {
          email,
          username: email.split('@')[0],
          password: null,
          full_name: userMetadata.full_name || null,
          photo_url: userMetadata.avatar_url || null,
          google_id: appMetadata.provider === 'google' ? user.id : null,
          language: 'ar',
          theme: 'system',
          current_plan: 'free',
          is_owner: true,
          stripe_customer_id: null,
          stripe_subscription_id: null
        };
        
        await createUser(newUser);
      }
    }
  });
} 