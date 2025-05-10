import React, { createContext, useContext, useEffect, useState } from 'react';
import { 
  supabase, 
  signIn, 
  signUp, 
  signOut, 
  getCurrentUser, 
  getCurrentSession, 
  resetPassword, 
  updateUserPassword, 
  signInWithProvider,
  onAuthStateChange,
  updateProfile
} from '../lib/supabase-client';
import type { User, Session } from '@supabase/supabase-js';

// Define a ProfileUpdateData type
export type ProfileUpdateData = {
  full_name?: string;
  username?: string;
  avatar_url?: string;
};

type AuthContextType = {
  user: User | null;
  session: Session | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<{ error: any | null }>;
  register: (email: string, password: string, userData?: any) => Promise<{ error: any | null }>;
  logout: () => Promise<void>;
  forgotPassword: (email: string) => Promise<{ error: any | null }>;
  updatePassword: (password: string) => Promise<{ error: any | null }>;
  loginWithProvider: (provider: 'google' | 'twitter' | 'facebook' | 'linkedin' | 'instagram' | 'snapchat') => Promise<void>;
  updateUserProfile: (profileData: ProfileUpdateData) => Promise<{ error: any | null }>;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Check for existing session
    const initializeAuth = async () => {
      setIsLoading(true);
      try {
        const { data: { session } } = await getCurrentSession();
        setSession(session);
        
        if (session) {
          const { data: { user } } = await getCurrentUser();
          setUser(user);
        }
      } catch (error) {
        console.error('Error initializing auth:', error);
      } finally {
        setIsLoading(false);
      }
    };

    initializeAuth();

    // Subscribe to auth changes
    const { data: { subscription } } = onAuthStateChange((event, session) => {
      setSession(session);
      setUser(session?.user || null);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const login = async (email: string, password: string) => {
    try {
      const { error } = await signIn(email, password);
      return { error };
    } catch (error) {
      console.error('Login error:', error);
      return { error };
    }
  };

  const register = async (email: string, password: string, userData?: any) => {
    try {
      const { error } = await signUp(email, password, userData);
      return { error };
    } catch (error) {
      console.error('Registration error:', error);
      return { error };
    }
  };

  const logout = async () => {
    try {
      await signOut();
      setUser(null);
      setSession(null);
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  const forgotPassword = async (email: string) => {
    try {
      const { error } = await resetPassword(email);
      return { error };
    } catch (error) {
      console.error('Forgot password error:', error);
      return { error };
    }
  };

  const updatePassword = async (password: string) => {
    try {
      const { error } = await updateUserPassword(password);
      return { error };
    } catch (error) {
      console.error('Update password error:', error);
      return { error };
    }
  };

  const loginWithProvider = async (provider: 'google' | 'twitter' | 'facebook' | 'linkedin' | 'instagram' | 'snapchat') => {
    try {
      await signInWithProvider(provider);
    } catch (error) {
      console.error(`${provider} login error:`, error);
    }
  };

  const updateUserProfile = async (profileData: ProfileUpdateData) => {
    try {
      if (!user) {
        return { error: 'Not authenticated' };
      }

      const { error } = await updateProfile(profileData);
      
      if (!error) {
        // Update the local user state with the new profile data
        setUser({
          ...user,
          user_metadata: {
            ...user.user_metadata,
            ...profileData
          }
        });
      }
      
      return { error };
    } catch (error) {
      console.error('Update profile error:', error);
      return { error };
    }
  };

  return (
    <AuthContext.Provider value={{
      user,
      session,
      isLoading,
      isAuthenticated: !!user,
      login,
      register,
      logout,
      forgotPassword,
      updatePassword,
      loginWithProvider,
      updateUserProfile
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
} 