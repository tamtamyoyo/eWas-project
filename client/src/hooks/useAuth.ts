import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useLocation } from "wouter";

export interface AuthUser {
  id: number;
  username: string;
  email: string;
  role?: string;
  createdAt?: string;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterCredentials {
  username: string;
  email: string;
  password: string;
}

export function useAuth() {
  const { toast } = useToast();
  const [isInitialized, setIsInitialized] = useState(false);
  const [, setLocation] = useLocation();
  
  // Fetch the current user with enhanced error handling and retry logic
  const {
    data: user,
    error,
    isLoading,
    refetch: refetchUser,
  } = useQuery({
    queryKey: ['/api/auth/user'],
    queryFn: async () => {
      console.log("Fetching current user data");
      
      try {
        // Use enhanced fetch with proper credentials and cache management
        const response = await fetch('/api/auth/user', {
          credentials: 'include',
          headers: {
            'Cache-Control': 'no-cache',
            'Accept': 'application/json',
            'X-Requested-With': 'XMLHttpRequest',
          },
          // Add timestamp to bypass cache
          cache: 'no-store',
        });
        
        console.log("Auth API response status:", response.status);
        
        // Check if we have a valid session
        if (response.status === 200) {
          const userData = await response.json();
          console.log("User data fetched successfully");
          // Add additional verification
          if (!userData.id) {
            console.error("User data invalid (missing ID)");
            return null;
          }
          return userData as AuthUser;
        }
        
        // Handle unauthorized case
        if (response.status === 401) {
          console.log("User not authenticated (401)");
          return null;
        }
        
        // Handle other error cases
        console.error("Failed to fetch user data:", response.status);
        throw new Error('Failed to fetch user data');
      } catch (error) {
        console.error("Error fetching user data:", error);
        throw error;
      }
    },
    staleTime: 60000, // 1 minute (reduced from 5 minutes)
    retry: 2, // Add retries for network errors
    retryDelay: 1000, // 1 second between retries
    enabled: isInitialized,
  });

  // Initialize the auth - fetch user on initial load
  useEffect(() => {
    setIsInitialized(true);
  }, []);
  
  // Enhanced Login mutation with better error handling and session management
  const loginMutation = useMutation({
    mutationFn: async (credentials: LoginCredentials) => {
      console.log("Attempting login with credentials:", { email: credentials.email });
      
      try {
        // Clear any previous auth state from cache
        queryClient.removeQueries({ queryKey: ['/api/auth/user'] });
        
        // Use enhanced API request with retries
        const response = await apiRequest('POST', '/api/auth/login', credentials, {
          withCacheBuster: true,
          retry: true
        });
        
        console.log("Login API response status:", response.status);
        
        if (!response.ok) {
          if (response.status === 401) {
            throw new Error('بريد إلكتروني أو كلمة مرور غير صحيحة');
          }
          
          try {
            const errorData = await response.json();
            throw new Error(errorData.message || 'تعذر تسجيل الدخول');
          } catch (jsonError) {
            // If JSON parsing fails, use status text
            throw new Error(`تعذر تسجيل الدخول (${response.status})`);
          }
        }
        
        const userData = await response.json() as AuthUser;
        console.log("Login successful, user data received");
        
        if (!userData || !userData.id) {
          throw new Error('بيانات المستخدم غير صالحة');
        }
        
        return userData;
      } catch (error: any) {
        console.error("Login error:", error);
        throw error;
      }
    },
    onSuccess: (userData: AuthUser) => {
      // Update cache
      queryClient.setQueryData(['/api/auth/user'], userData);
      
      // Force refetch to ensure we have latest data
      setTimeout(() => {
        refetchUser();
      }, 500);
      
      toast({
        title: 'تم تسجيل الدخول بنجاح',
        description: 'مرحبًا بعودتك',
      });
      
      setLocation('/dashboard');
    },
    onError: (error: Error) => {
      console.error("Login mutation error:", error);
      toast({
        title: 'خطأ في تسجيل الدخول',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  // Register mutation
  const registerMutation = useMutation({
    mutationFn: async (credentials: RegisterCredentials) => {
      console.log("Attempting registration with credentials:", { email: credentials.email, username: credentials.username });
      
      try {
        const response = await apiRequest('POST', '/api/auth/register', credentials);
        console.log("Register API response status:", response.status);
        
        if (!response.ok) {
          const errorData = await response.json();
          console.error("Registration error:", errorData);
          throw new Error(errorData.message || 'تعذر إنشاء الحساب');
        }
        
        const userData = await response.json() as AuthUser;
        console.log("Registration successful, user data received");
        return userData;
      } catch (error) {
        console.error("Registration error:", error);
        throw error;
      }
    },
    onSuccess: (userData: AuthUser) => {
      queryClient.setQueryData(['/api/auth/user'], userData);
      toast({
        title: 'تم إنشاء الحساب بنجاح',
        description: 'مرحبًا بك في وصل',
      });
      setLocation('/dashboard');
    },
    onError: (error: Error) => {
      toast({
        title: 'خطأ في إنشاء الحساب',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  // Enhanced Logout mutation with better handling of edge cases
  const logoutMutation = useMutation({
    mutationFn: async () => {
      console.log("Attempting logout");
      
      try {
        // Try the API logout first
        const response = await apiRequest('POST', '/api/auth/logout', undefined, {
          withCacheBuster: true,
          retry: true
        });
        
        console.log("Logout API response status:", response.status);
        
        // Even if the API fails, we'll clear the local state
        if (!response.ok) {
          console.warn(`Logout API returned ${response.status}, but continuing with client-side logout`);
          // Don't throw here - we'll still clear client state
        } else {
          console.log("Server logout successful");
        }
        
        // Always return success, as we'll handle client-side logout regardless
        return true;
      } catch (error) {
        // Log but don't rethrow - we want to clear client state regardless
        console.error("Logout API error:", error);
        return true; // Still return success for client-side logout
      }
    },
    onSuccess: () => {
      // Clear all query cache to ensure clean slate
      queryClient.clear();
      
      // Show success message
      toast({
        title: 'تم تسجيل الخروج بنجاح',
      });
      
      // Redirect to login page
      setLocation('/login');
    },
    onError: (error: Error) => {
      console.error("Logout error:", error);
      toast({
        title: 'خطأ في تسجيل الخروج',
        description: error.message,
        variant: 'destructive',
      });
      
      // Try to clear client state anyway
      queryClient.clear();
      setLocation('/login');
    },
  });

  const login = (credentials: LoginCredentials) => loginMutation.mutate(credentials);
  const register = (credentials: RegisterCredentials) => registerMutation.mutate(credentials);
  const logout = () => logoutMutation.mutate();

  return {
    user,
    error,
    isLoading,
    login,
    register,
    logout,
    refetchUser,
    isAuthenticated: !!user,
  };
}