import { ReactNode, createContext, useContext, useEffect } from "react";
import { useAuth as useAuthHook } from "@/hooks/useAuth";
import { User } from "@shared/schema";

// Create the AuthContext
export type AuthContextType = ReturnType<typeof useAuthHook>;

export const AuthContext = createContext<AuthContextType | null>(null);

// For debugging - adds quick access to auth functions in development
const addDebugHelpers = (auth: AuthContextType) => {
  if (process.env.NODE_ENV !== 'production') {
    // @ts-ignore - Add to window for debugging
    window.__ewaslAuth = {
      // Get current user
      getCurrentUser: () => auth.user,
      // Check if authenticated
      isAuthenticated: () => auth.isAuthenticated,
      // Refresh user data
      refreshUser: () => auth.refetchUser(),
      // Manual test login
      testLogin: (email: string, password: string) => {
        console.log("Test login attempt with:", email);
        return auth.login({ email, password });
      },
      // Force logout
      forceLogout: () => {
        console.log("Force logout triggered");
        return auth.logout();
      },
      // Check session status
      checkSession: async () => {
        console.log("Checking session status...");
        try {
          await auth.refetchUser();
          return !!auth.user;
        } catch (err) {
          console.error("Session check failed:", err);
          return false;
        }
      }
    };
    
    console.log("Auth debug helpers added to window.__ewaslAuth");
  }
};

// AuthProvider component to wrap the app
export function AuthProvider({ children }: { children: ReactNode }) {
  const auth = useAuthHook();
  
  // Add debug helpers when component mounts
  useEffect(() => {
    addDebugHelpers(auth);
    
    // Log auth status changes
    console.log("Auth status:", auth.isAuthenticated ? "Authenticated" : "Not authenticated");
    
    // Setup periodic auth check in development
    if (process.env.NODE_ENV !== 'production') {
      const interval = setInterval(() => {
        try {
          auth.refetchUser();
        } catch (err) {
          console.warn("Periodic auth check failed:", err);
        }
      }, 60000); // Check every minute
      
      return () => clearInterval(interval);
    }
  }, [auth, auth.isAuthenticated]);
  
  return (
    <AuthContext.Provider value={auth}>
      {children}
    </AuthContext.Provider>
  );
}

// Custom hook to use auth context
export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  
  if (context === null) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  
  return context;
}