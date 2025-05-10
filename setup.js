#!/usr/bin/env node

/**
 * eWas.com Project Setup Script
 * 
 * This script helps configure the environment for the eWas.com social media integration project.
 * It creates necessary environment files and provides guidance for setting up third-party services.
 */

import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';
import readline from 'readline';

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

// Helper function to prompt for input
const prompt = (question) => new Promise((resolve) => {
  rl.question(question, (answer) => resolve(answer));
});

async function main() {
  console.log('🚀 Welcome to eWas.com Project Setup');
  console.log('===================================\n');
  
  // Check if .env already exists
  if (fs.existsSync('.env')) {
    const overwrite = await prompt('An .env file already exists. Overwrite? (y/n): ');
    if (overwrite.toLowerCase() !== 'y') {
      console.log('Setup aborted. Existing .env file will be kept.');
      rl.close();
      return;
    }
  }
  
  console.log('\n📝 Creating environment configuration file...');
  
  // Supabase Configuration
  console.log('\n--- Supabase Configuration ---');
  const supabaseUrl = await prompt('Supabase URL (https://your-project-id.supabase.co): ');
  const supabaseAnonKey = await prompt('Supabase Anon Key: ');
  const supabaseServiceKey = await prompt('Supabase Service Key: ');
  
  // Social Media APIs
  console.log('\n--- Social Media API Configuration ---');
  console.log('For each platform, you need to register your app in their developer portal.');
  
  // Facebook
  console.log('\nFacebook Configuration:');
  console.log('Register at: https://developers.facebook.com/apps/');
  const facebookAppId = await prompt('Facebook App ID: ');
  const facebookAppSecret = await prompt('Facebook App Secret: ');
  
  // Google
  console.log('\nGoogle Configuration:');
  console.log('Register at: https://console.cloud.google.com/apis/credentials');
  const googleClientId = await prompt('Google Client ID: ');
  const googleClientSecret = await prompt('Google Client Secret: ');
  
  // Twitter
  console.log('\nTwitter Configuration:');
  console.log('Register at: https://developer.twitter.com/en/portal/dashboard');
  const twitterApiKey = await prompt('Twitter API Key: ');
  const twitterApiSecret = await prompt('Twitter API Secret: ');
  
  // Instagram (via Facebook)
  console.log('\nInstagram Configuration (via Facebook):');
  console.log('Connect Instagram to your Facebook App');
  const instagramAppId = await prompt('Instagram App ID (may be same as Facebook): ');
  const instagramAppSecret = await prompt('Instagram App Secret (may be same as Facebook): ');
  
  // LinkedIn
  console.log('\nLinkedIn Configuration:');
  console.log('Register at: https://www.linkedin.com/developers/apps/');
  const linkedinClientId = await prompt('LinkedIn Client ID: ');
  const linkedinClientSecret = await prompt('LinkedIn Client Secret: ');
  
  // Payments with Stripe
  console.log('\n--- Stripe Configuration ---');
  console.log('Register at: https://dashboard.stripe.com/apikeys');
  const stripePublicKey = await prompt('Stripe Public Key: ');
  const stripeSecretKey = await prompt('Stripe Secret Key: ');
  const stripeWebhookSecret = await prompt('Stripe Webhook Secret: ');
  
  // API Keys
  console.log('\n--- API Keys ---');
  const openaiApiKey = await prompt('OpenAI API Key (for content suggestions): ');
  const sendgridApiKey = await prompt('SendGrid API Key (for emails): ');
  
  // Session Secret
  console.log('\n--- Security Configuration ---');
  const sessionSecret = generateRandomString(32);
  console.log(`Generated session secret: ${sessionSecret}`);
  
  // Build the .env file content
  const envContent = `# Supabase Configuration
SUPABASE_URL=${supabaseUrl}
SUPABASE_ANON_KEY=${supabaseAnonKey}
SUPABASE_SERVICE_KEY=${supabaseServiceKey}

# Application Configuration
NODE_ENV=development
PORT=3000
APP_URL=http://localhost:3000

# Authentication Providers

# Facebook
VITE_FACEBOOK_APP_ID=${facebookAppId}
VITE_FACEBOOK_APP_SECRET=${facebookAppSecret}
FACEBOOK_REDIRECT_URL=http://localhost:3000/api/facebook/callback

# Google
VITE_GOOGLE_CLIENT_ID=${googleClientId}
VITE_GOOGLE_CLIENT_SECRET=${googleClientSecret}
VITE_GOOGLE_REDIRECT_URI=http://localhost:3000/oauth2callback

# Instagram
VITE_INSTAGRAM_APP_ID=${instagramAppId}
VITE_INSTAGRAM_APP_SECRET=${instagramAppSecret}
INSTAGRAM_REDIRECT_URL=http://localhost:3000/api/instagram/callback

# LinkedIn
VITE_LINKEDIN_CLIENT_ID=${linkedinClientId}
VITE_LINKEDIN_CLIENT_SECRET=${linkedinClientSecret}
VITE_LINKEDIN_REDIRECT_URI=http://localhost:3000/api/linkedin/callback

# Twitter
VITE_TWITTER_API_KEY=${twitterApiKey}
VITE_TWITTER_API_SECRET=${twitterApiSecret}
VITE_TWITTER_CALLBACK_URL=http://localhost:3000/auth/twitter/callback

# Payments
VITE_STRIPE_PUBLIC_KEY=${stripePublicKey}
VITE_STRIPE_SECRET_KEY=${stripeSecretKey}
STRIPE_WEBHOOK_SECRET=${stripeWebhookSecret}

# API Keys
VITE_OPENAI_API_KEY=${openaiApiKey}
VITE_SENDGRID_API_KEY=${sendgridApiKey}

# Client-side Supabase Configuration (used by Vite)
VITE_SUPABASE_URL=${supabaseUrl}
VITE_SUPABASE_ANON_KEY=${supabaseAnonKey}

# Session Configuration
SESSION_SECRET=${sessionSecret}

# Email Configuration
EMAIL_FROM=no-reply@ewas.com
EMAIL_SERVICE=sendgrid`;

  // Write the .env file
  fs.writeFileSync('.env', envContent);
  console.log('\n✅ .env file created successfully!');
  
  // Create a production .env file with placeholder reminder
  const prodEnvContent = envContent.replace(/NODE_ENV=development/, 'NODE_ENV=production');
  fs.writeFileSync('.env.production', prodEnvContent);
  console.log('✅ .env.production file created for deployment');
  
  // Setup instructions
  console.log('\n📋 Next Steps:');
  console.log('1. Set up your Supabase project and run migrations');
  console.log('2. Configure OAuth redirect URIs in each platform\'s developer console');
  console.log('3. Set up Stripe webhook endpoints');
  console.log('4. Configure SendGrid templates for emails');
  console.log('5. Start the development server: npm run dev');
  
  console.log('\n🔒 Security Reminder:');
  console.log('- Keep your .env files secure and never commit them to version control');
  console.log('- Update the redirect URLs in production to use your actual domain');
  
  rl.close();
}

// Helper function to generate a random string for session secret
function generateRandomString(length) {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

// Run the setup
main().catch(error => {
  console.error('Error during setup:', error);
  rl.close();
}); 