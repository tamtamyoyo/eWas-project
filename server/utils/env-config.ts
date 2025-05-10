/**
 * Environment Configuration
 * 
 * This file handles environment variables with fallbacks for development and testing.
 * In production, these variables should be properly set in Railway.
 */

// Utility to get environment variables with defaults
const getEnv = (key: string, defaultValue: string = ''): string => {
  return process.env[key] || defaultValue;
};

// Utility to check if an environment variable is required in production
const requireInProduction = (key: string, value: string): string => {
  const isProduction = process.env.NODE_ENV === 'production';
  if (isProduction && !value) {
    // Log error but don't crash - helps with debugging deployment issues
    console.error(`Error: Required environment variable ${key} is not set in production!`);
  }
  return value;
};

// Is development mode?
export const IS_DEVELOPMENT = process.env.NODE_ENV !== 'production';

// Server configuration
export const SERVER_CONFIG = {
  PORT: parseInt(getEnv('PORT', '3000')),
  NODE_ENV: getEnv('NODE_ENV', 'development'),
  SESSION_SECRET: requireInProduction('SESSION_SECRET', getEnv('SESSION_SECRET', 'dev-session-secret-change-in-production')),
  CORS_ORIGIN: getEnv('CORS_ORIGIN', '*'),
  HOST: getEnv('HOST', 'localhost'),
  API_URL: getEnv('API_URL', IS_DEVELOPMENT ? 'http://localhost:3000/api' : 'https://api.ewasl.com'),
  CLIENT_URL: getEnv('CLIENT_URL', IS_DEVELOPMENT ? 'http://localhost:3000' : 'https://app.ewasl.com'),
};

// Database configuration
export const DB_CONFIG = {
  DATABASE_URL: requireInProduction('DATABASE_URL', getEnv('DATABASE_URL', '')),
};

// Supabase configuration
export const SUPABASE_CONFIG = {
  SUPABASE_URL: requireInProduction('SUPABASE_URL', getEnv('SUPABASE_URL', '')),
  SUPABASE_ANON_KEY: requireInProduction('SUPABASE_ANON_KEY', getEnv('SUPABASE_ANON_KEY', '')),
  SUPABASE_SERVICE_ROLE_KEY: requireInProduction('SUPABASE_SERVICE_ROLE_KEY', getEnv('SUPABASE_SERVICE_ROLE_KEY', '')),
};

// OpenAI configuration - Optional feature
export const OPENAI_CONFIG = {
  OPENAI_API_KEY: getEnv('OPENAI_API_KEY', ''),
  // Flag to track if feature is available based on key
  IS_AVAILABLE: !!getEnv('OPENAI_API_KEY', ''),
};

// Anthropic configuration - Optional feature
export const ANTHROPIC_CONFIG = {
  ANTHROPIC_API_KEY: getEnv('ANTHROPIC_API_KEY', ''),
  // Flag to track if feature is available based on key
  IS_AVAILABLE: !!getEnv('ANTHROPIC_API_KEY', ''),
};

// Email configuration
export const EMAIL_CONFIG = {
  SENDGRID_API_KEY: getEnv('SENDGRID_API_KEY', ''),
  EMAIL_FROM: getEnv('EMAIL_FROM', 'noreply@ewasl.com'),
  // Flag to track if email service is available
  IS_AVAILABLE: !!getEnv('SENDGRID_API_KEY', ''),
};

// Payment configuration - Optional feature
export const PAYMENT_CONFIG = {
  STRIPE_SECRET_KEY: getEnv('STRIPE_SECRET_KEY', ''),
  STRIPE_PUBLISHABLE_KEY: getEnv('STRIPE_PUBLISHABLE_KEY', ''),
  STRIPE_WEBHOOK_SECRET: getEnv('STRIPE_WEBHOOK_SECRET', ''),
  // Flag to track if payment feature is available
  IS_AVAILABLE: !!(getEnv('STRIPE_SECRET_KEY', '') && getEnv('STRIPE_PUBLISHABLE_KEY', '')),
};

// Social Media API configurations
export const SOCIAL_CONFIG = {
  // Twitter/X
  TWITTER: {
    API_KEY: getEnv('TWITTER_API_KEY', ''),
    API_SECRET: getEnv('TWITTER_API_SECRET', ''),
    CALLBACK_URL: getEnv('TWITTER_CALLBACK_URL', `${SERVER_CONFIG.CLIENT_URL}/auth/twitter/callback`),
    IS_AVAILABLE: !!(getEnv('TWITTER_API_KEY', '') && getEnv('TWITTER_API_SECRET', '')),
  },
  
  // Facebook
  FACEBOOK: {
    APP_ID: getEnv('FACEBOOK_APP_ID', ''),
    APP_SECRET: getEnv('FACEBOOK_APP_SECRET', ''),
    CALLBACK_URL: getEnv('FACEBOOK_CALLBACK_URL', `${SERVER_CONFIG.CLIENT_URL}/auth/facebook/callback`),
    IS_AVAILABLE: !!(getEnv('FACEBOOK_APP_ID', '') && getEnv('FACEBOOK_APP_SECRET', '')),
  },
  
  // Instagram
  INSTAGRAM: {
    CLIENT_ID: getEnv('INSTAGRAM_CLIENT_ID', ''),
    CLIENT_SECRET: getEnv('INSTAGRAM_CLIENT_SECRET', ''),
    CALLBACK_URL: getEnv('INSTAGRAM_CALLBACK_URL', `${SERVER_CONFIG.CLIENT_URL}/auth/instagram/callback`),
    IS_AVAILABLE: !!(getEnv('INSTAGRAM_CLIENT_ID', '') && getEnv('INSTAGRAM_CLIENT_SECRET', '')),
  },
  
  // LinkedIn
  LINKEDIN: {
    CLIENT_ID: getEnv('LINKEDIN_CLIENT_ID', ''),
    CLIENT_SECRET: getEnv('LINKEDIN_CLIENT_SECRET', ''),
    CALLBACK_URL: getEnv('LINKEDIN_CALLBACK_URL', `${SERVER_CONFIG.CLIENT_URL}/auth/linkedin/callback`),
    IS_AVAILABLE: !!(getEnv('LINKEDIN_CLIENT_ID', '') && getEnv('LINKEDIN_CLIENT_SECRET', '')),
  },
  
  // Snapchat
  SNAPCHAT: {
    CLIENT_ID: getEnv('SNAPCHAT_CLIENT_ID', ''),
    CLIENT_SECRET: getEnv('SNAPCHAT_CLIENT_SECRET', ''),
    CALLBACK_URL: getEnv('SNAPCHAT_CALLBACK_URL', `${SERVER_CONFIG.CLIENT_URL}/auth/snapchat/callback`),
    IS_AVAILABLE: !!(getEnv('SNAPCHAT_CLIENT_ID', '') && getEnv('SNAPCHAT_CLIENT_SECRET', '')),
  },
  
  // TikTok
  TIKTOK: {
    CLIENT_KEY: getEnv('TIKTOK_CLIENT_KEY', ''),
    CLIENT_SECRET: getEnv('TIKTOK_CLIENT_SECRET', ''),
    CALLBACK_URL: getEnv('TIKTOK_CALLBACK_URL', `${SERVER_CONFIG.CLIENT_URL}/auth/tiktok/callback`),
    IS_AVAILABLE: !!(getEnv('TIKTOK_CLIENT_KEY', '') && getEnv('TIKTOK_CLIENT_SECRET', '')),
  },
  
  // YouTube
  YOUTUBE: {
    API_KEY: getEnv('YOUTUBE_API_KEY', ''),
    CLIENT_ID: getEnv('YOUTUBE_CLIENT_ID', ''),
    CLIENT_SECRET: getEnv('YOUTUBE_CLIENT_SECRET', ''),
    CALLBACK_URL: getEnv('YOUTUBE_CALLBACK_URL', `${SERVER_CONFIG.CLIENT_URL}/auth/youtube/callback`),
    IS_AVAILABLE: !!(getEnv('YOUTUBE_API_KEY', '') || (getEnv('YOUTUBE_CLIENT_ID', '') && getEnv('YOUTUBE_CLIENT_SECRET', ''))),
  },
  
  // Get a list of all available social services
  getAvailableServices(): string[] {
    const available = [];
    if (this.TWITTER.IS_AVAILABLE) available.push('twitter');
    if (this.FACEBOOK.IS_AVAILABLE) available.push('facebook');
    if (this.INSTAGRAM.IS_AVAILABLE) available.push('instagram');
    if (this.LINKEDIN.IS_AVAILABLE) available.push('linkedin');
    if (this.SNAPCHAT.IS_AVAILABLE) available.push('snapchat');
    if (this.TIKTOK.IS_AVAILABLE) available.push('tiktok');
    if (this.YOUTUBE.IS_AVAILABLE) available.push('youtube');
    return available;
  }
}; 

// Application Feature Flags
export const FEATURE_FLAGS = {
  ENABLE_AI_ASSISTANT: !!OPENAI_CONFIG.IS_AVAILABLE || !!ANTHROPIC_CONFIG.IS_AVAILABLE,
  ENABLE_EMAIL_NOTIFICATIONS: !!EMAIL_CONFIG.IS_AVAILABLE,
  ENABLE_PAYMENT_PROCESSING: !!PAYMENT_CONFIG.IS_AVAILABLE,
};

// Log environment configuration in development
if (IS_DEVELOPMENT) {
  console.log('=== Environment Configuration ===');
  console.log('Server:', { 
    PORT: SERVER_CONFIG.PORT,
    NODE_ENV: SERVER_CONFIG.NODE_ENV,
    API_URL: SERVER_CONFIG.API_URL,
    CLIENT_URL: SERVER_CONFIG.CLIENT_URL,
  });
  console.log('Available Social Services:', SOCIAL_CONFIG.getAvailableServices());
  console.log('Feature Flags:', FEATURE_FLAGS);
  console.log('================================');
}

// Function to validate critical environment variables in production
export function validateEnvironment(): { valid: boolean; missingVars: string[] } {
  const isProduction = process.env.NODE_ENV === 'production';
  if (!isProduction) {
    return { valid: true, missingVars: [] };
  }

  const criticalVars = [
    'DATABASE_URL',
    'SUPABASE_URL', 
    'SUPABASE_ANON_KEY',
    'SESSION_SECRET'
  ];

  const missingVars = criticalVars.filter(key => !process.env[key]);
  return {
    valid: missingVars.length === 0,
    missingVars
  };
} 