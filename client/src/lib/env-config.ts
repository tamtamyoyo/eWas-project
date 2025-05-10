/**
 * Environment Configuration
 * 
 * This file centralizes all environment variables for the application.
 * All variables are prefixed with VITE_ to be accessible in the client code.
 * 
 * IMPORTANT: Replace placeholder values with your actual keys in a .env file
 * DO NOT commit actual API keys to version control
 */

// Authentication Providers
export const AUTH_CONFIG = {
  // Facebook
  FACEBOOK_APP_ID: process.env.VITE_FACEBOOK_APP_ID || 'your-facebook-app-id',
  FACEBOOK_APP_SECRET: process.env.VITE_FACEBOOK_APP_SECRET || 'your-facebook-app-secret',
  
  // Google
  GOOGLE_CLIENT_ID: process.env.VITE_GOOGLE_CLIENT_ID || 'your-google-client-id',
  GOOGLE_CLIENT_SECRET: process.env.VITE_GOOGLE_CLIENT_SECRET || 'your-google-client-secret',
  GOOGLE_REDIRECT_URI: process.env.VITE_GOOGLE_REDIRECT_URI || 'https://app.ewasl.com/oauth2callback',
  
  // Instagram
  INSTAGRAM_APP_ID: process.env.VITE_INSTAGRAM_APP_ID || 'your-instagram-app-id',
  INSTAGRAM_APP_SECRET: process.env.VITE_INSTAGRAM_APP_SECRET || 'your-instagram-app-secret',
  
  // LinkedIn
  LINKEDIN_CLIENT_ID: process.env.VITE_LINKEDIN_CLIENT_ID || 'your-linkedin-client-id',
  LINKEDIN_CLIENT_SECRET: process.env.VITE_LINKEDIN_CLIENT_SECRET || 'your-linkedin-client-secret',
  LINKEDIN_REDIRECT_URI: process.env.VITE_LINKEDIN_REDIRECT_URI || 'https://app.ewasl.com/api/linkedin/callback',
  
  // Twitter
  TWITTER_API_KEY: process.env.VITE_TWITTER_API_KEY || 'your-twitter-api-key',
  TWITTER_API_SECRET: process.env.VITE_TWITTER_API_SECRET || 'your-twitter-api-secret',
  TWITTER_CALLBACK_URL: process.env.VITE_TWITTER_CALLBACK_URL || 'https://app.ewasl.com/auth/twitter/callback',
  
  // Snapchat
  SNAPCHAT_CLIENT_ID: process.env.VITE_SNAPCHAT_CLIENT_ID || 'your-snapchat-client-id',
  SNAPCHAT_CLIENT_SECRET: process.env.VITE_SNAPCHAT_CLIENT_SECRET || 'your-snapchat-client-secret',
};

// Payments
export const PAYMENT_CONFIG = {
  STRIPE_PUBLIC_KEY: process.env.VITE_STRIPE_PUBLIC_KEY || 'your-stripe-public-key',
  STRIPE_SECRET_KEY: process.env.VITE_STRIPE_SECRET_KEY || 'your-stripe-secret-key',
};

// API Keys
export const API_KEYS = {
  OPENAI_API_KEY: process.env.VITE_OPENAI_API_KEY || 'your-openai-api-key',
  SENDGRID_API_KEY: process.env.VITE_SENDGRID_API_KEY || 'your-sendgrid-api-key',
};

// Supabase Configuration
// Note: Getting these from existing env variables if available, otherwise using defaults
export const SUPABASE_CONFIG = {
  SUPABASE_URL: process.env.VITE_SUPABASE_URL || 'your-supabase-url',
  SUPABASE_ANON_KEY: process.env.VITE_SUPABASE_ANON_KEY || 'your-supabase-anon-key',
}; 