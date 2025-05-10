/**
 * Environment Configuration
 * 
 * This file centralizes all environment variables for the client application.
 * All variables are prefixed with VITE_ to be accessible in the client code.
 * 
 * IMPORTANT: Replace placeholder values with your actual keys in a .env file
 * DO NOT commit actual API keys to version control
 */

// Helper to get environment variables with smart fallbacks
const getEnv = (key: string, fallback: string = ''): string => {
  // For Vite, we need to use import.meta.env
  // TypeScript doesn't know about Vite's special import.meta.env by default
  const envVar = (import.meta as any).env[key];
  return (envVar || fallback) as string;
};

// Is development mode?
export const IS_DEVELOPMENT = (import.meta as any).env.DEV === true;

// Server URLs for API calls
export const API_CONFIG = {
  API_URL: getEnv('VITE_API_URL', IS_DEVELOPMENT ? 'http://localhost:3000/api' : 'https://api.ewasl.com'),
  CLIENT_URL: getEnv('VITE_CLIENT_URL', IS_DEVELOPMENT ? 'http://localhost:3000' : 'https://app.ewasl.com'),
};

// Authentication Providers
export const AUTH_CONFIG = {
  // Facebook
  FACEBOOK_APP_ID: getEnv('VITE_FACEBOOK_APP_ID', ''),
  
  // Google
  GOOGLE_CLIENT_ID: getEnv('VITE_GOOGLE_CLIENT_ID', ''),
  GOOGLE_REDIRECT_URI: getEnv('VITE_GOOGLE_REDIRECT_URI', `${API_CONFIG.CLIENT_URL}/oauth2callback`),
  
  // Instagram
  INSTAGRAM_APP_ID: getEnv('VITE_INSTAGRAM_APP_ID', ''),
  
  // LinkedIn
  LINKEDIN_CLIENT_ID: getEnv('VITE_LINKEDIN_CLIENT_ID', ''),
  LINKEDIN_REDIRECT_URI: getEnv('VITE_LINKEDIN_REDIRECT_URI', `${API_CONFIG.CLIENT_URL}/api/linkedin/callback`),
  
  // Twitter
  TWITTER_API_KEY: getEnv('VITE_TWITTER_API_KEY', ''),
  TWITTER_CALLBACK_URL: getEnv('VITE_TWITTER_CALLBACK_URL', `${API_CONFIG.CLIENT_URL}/auth/twitter/callback`),
  
  // Snapchat
  SNAPCHAT_CLIENT_ID: getEnv('VITE_SNAPCHAT_CLIENT_ID', ''),
  
  // Helper function to check if a provider is configured
  isProviderConfigured: (provider: string): boolean => {
    switch (provider.toLowerCase()) {
      case 'facebook':
        return !!getEnv('VITE_FACEBOOK_APP_ID', '');
      case 'google':
        return !!getEnv('VITE_GOOGLE_CLIENT_ID', '');
      case 'instagram':
        return !!getEnv('VITE_INSTAGRAM_APP_ID', '');
      case 'linkedin':
        return !!getEnv('VITE_LINKEDIN_CLIENT_ID', '');
      case 'twitter':
        return !!getEnv('VITE_TWITTER_API_KEY', '');
      case 'snapchat':
        return !!getEnv('VITE_SNAPCHAT_CLIENT_ID', '');
      default:
        return false;
    }
  },
  
  // Get array of configured providers
  getConfiguredProviders: (): string[] => {
    const providers = ['facebook', 'google', 'instagram', 'linkedin', 'twitter', 'snapchat'];
    return providers.filter(provider => AUTH_CONFIG.isProviderConfigured(provider));
  }
};

// Payments
export const PAYMENT_CONFIG = {
  STRIPE_PUBLIC_KEY: getEnv('VITE_STRIPE_PUBLIC_KEY', ''),
  IS_AVAILABLE: !!getEnv('VITE_STRIPE_PUBLIC_KEY', ''),
};

// Supabase Configuration
export const SUPABASE_CONFIG = {
  SUPABASE_URL: getEnv('VITE_SUPABASE_URL', ''),
  SUPABASE_ANON_KEY: getEnv('VITE_SUPABASE_ANON_KEY', ''),
  IS_AVAILABLE: !!(getEnv('VITE_SUPABASE_URL', '') && getEnv('VITE_SUPABASE_ANON_KEY', '')),
};

// Application Feature Flags - enables conditional rendering based on available services
export const FEATURE_FLAGS = {
  ENABLE_STRIPE_PAYMENTS: PAYMENT_CONFIG.IS_AVAILABLE,
  ENABLE_SUPABASE_FEATURES: SUPABASE_CONFIG.IS_AVAILABLE,
  ENABLE_SOCIAL_LOGIN: AUTH_CONFIG.getConfiguredProviders().length > 0,
};

// Log environment configuration in development
if (IS_DEVELOPMENT) {
  // Only log non-sensitive information
  console.log('=== Client Environment Configuration ===');
  console.log('API URLs:', API_CONFIG);
  console.log('Configured Auth Providers:', AUTH_CONFIG.getConfiguredProviders());
  console.log('Feature Flags:', FEATURE_FLAGS);
  console.log('=========================================');
  
  // Show warning if critical services are missing
  if (!SUPABASE_CONFIG.IS_AVAILABLE) {
    console.warn('⚠️ WARNING: Supabase configuration is missing. Some features may not work correctly.');
  }
} 