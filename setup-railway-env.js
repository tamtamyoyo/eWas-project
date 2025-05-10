#!/usr/bin/env node

/**
 * Railway Environment Setup Helper
 * 
 * This script helps you set up the required environment variables for your Railway deployment.
 * Run with: node setup-railway-env.js
 */

const fs = require('fs');
const readline = require('readline');
const { execSync } = require('child_process');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

// Default minimal configuration with fallbacks
const minimalConfig = {
  // Core
  NODE_ENV: 'production',
  PORT: '3000',
  HOST: '0.0.0.0',
  SESSION_SECRET: `ewas-${Math.random().toString(36).substring(2, 15)}`,
  
  // Database (required)
  DATABASE_URL: '',
  
  // Supabase (required)
  SUPABASE_URL: '',
  SUPABASE_ANON_KEY: '',
  SUPABASE_SERVICE_ROLE_KEY: '',
};

// Function to prompt user for variables
async function promptForVariables() {
  const config = { ...minimalConfig };
  
  console.log("\n🚀 eWas.com Railway Environment Setup 🚀");
  console.log("=======================================");
  console.log("Let's set up the required environment variables for your Railway deployment.");
  console.log("Leave blank to use defaults where available or skip optional services.");
  console.log("=======================================\n");
  
  // Database URL (Required)
  config.DATABASE_URL = await askQuestion("PostgreSQL DATABASE_URL (required): ");
  if (!config.DATABASE_URL) {
    console.error("❌ DATABASE_URL is required!");
    process.exit(1);
  }
  
  // Supabase (Required)
  console.log("\n📦 Supabase Configuration (Required)");
  config.SUPABASE_URL = await askQuestion("SUPABASE_URL (required): ");
  config.SUPABASE_ANON_KEY = await askQuestion("SUPABASE_ANON_KEY (required): ");
  config.SUPABASE_SERVICE_ROLE_KEY = await askQuestion("SUPABASE_SERVICE_ROLE_KEY (required): ");
  
  if (!config.SUPABASE_URL || !config.SUPABASE_ANON_KEY || !config.SUPABASE_SERVICE_ROLE_KEY) {
    console.error("❌ All Supabase configuration values are required!");
    process.exit(1);
  }
  
  // Session Secret
  const customSessionSecret = await askQuestion("\nCustom SESSION_SECRET (leave blank for auto-generated): ");
  if (customSessionSecret) {
    config.SESSION_SECRET = customSessionSecret;
  }
  
  // Client & API URLs
  console.log("\n🔗 Application URLs");
  const customApiUrl = await askQuestion("API_URL (Railway will generate if blank): ");
  if (customApiUrl) {
    config.API_URL = customApiUrl;
  }
  
  const customClientUrl = await askQuestion("CLIENT_URL (Railway will generate if blank): ");
  if (customClientUrl) {
    config.CLIENT_URL = customClientUrl;
  }
  
  // Optional: OpenAI
  console.log("\n🧠 OpenAI Integration (Optional)");
  const openaiKey = await askQuestion("OPENAI_API_KEY (optional): ");
  if (openaiKey) {
    config.OPENAI_API_KEY = openaiKey;
  }
  
  // Optional: Social Media Integrations
  console.log("\n📱 Social Media Integrations (Optional, can be added later)");
  console.log("Skip this section if you don't need these services yet.");
  
  const setupSocial = await askQuestion("Set up social media credentials now? (y/n, default: n): ");
  if (setupSocial.toLowerCase() === 'y') {
    // Twitter/X
    console.log("\nTwitter/X Configuration:");
    const twitterApiKey = await askQuestion("TWITTER_API_KEY: ");
    const twitterApiSecret = await askQuestion("TWITTER_API_SECRET: ");
    if (twitterApiKey && twitterApiSecret) {
      config.TWITTER_API_KEY = twitterApiKey;
      config.TWITTER_API_SECRET = twitterApiSecret;
      config.TWITTER_CALLBACK_URL = await askQuestion("TWITTER_CALLBACK_URL (default: https://your-app.up.railway.app/auth/twitter/callback): ") || 
        "https://your-app.up.railway.app/auth/twitter/callback";
    }
    
    // Facebook
    console.log("\nFacebook Configuration:");
    const facebookAppId = await askQuestion("FACEBOOK_APP_ID: ");
    const facebookAppSecret = await askQuestion("FACEBOOK_APP_SECRET: ");
    if (facebookAppId && facebookAppSecret) {
      config.FACEBOOK_APP_ID = facebookAppId;
      config.FACEBOOK_APP_SECRET = facebookAppSecret;
      config.FACEBOOK_CALLBACK_URL = await askQuestion("FACEBOOK_CALLBACK_URL (default: https://your-app.up.railway.app/auth/facebook/callback): ") || 
        "https://your-app.up.railway.app/auth/facebook/callback";
    }
    
    // LinkedIn
    console.log("\nLinkedIn Configuration:");
    const linkedinClientId = await askQuestion("LINKEDIN_CLIENT_ID: ");
    const linkedinClientSecret = await askQuestion("LINKEDIN_CLIENT_SECRET: ");
    if (linkedinClientId && linkedinClientSecret) {
      config.LINKEDIN_CLIENT_ID = linkedinClientId;
      config.LINKEDIN_CLIENT_SECRET = linkedinClientSecret;
      config.LINKEDIN_CALLBACK_URL = await askQuestion("LINKEDIN_CALLBACK_URL (default: https://your-app.up.railway.app/auth/linkedin/callback): ") || 
        "https://your-app.up.railway.app/auth/linkedin/callback";
    }
  }
  
  // Save configuration
  try {
    fs.writeFileSync('.env.railway', Object.entries(config).map(([key, value]) => `${key}=${value}`).join('\n'));
    console.log("\n✅ Configuration saved to .env.railway");
  } catch (error) {
    console.error("❌ Error saving configuration:", error);
  }
  
  // Instructions for Railway
  console.log("\n🚂 Railway Setup Instructions:");
  console.log("1. Log in to Railway.app");
  console.log("2. Go to your eWas project");
  console.log("3. Click on the 'Variables' tab");
  console.log("4. Click 'New Variable'");
  console.log("5. Choose 'Import from .env'");
  console.log("6. Upload the .env.railway file we just created");
  console.log("7. Click 'Add' to add the variables to your project");
  console.log("\nAlternatively, you can add each variable manually from your .env.railway file.");
  
  // Ask if they want to view the generated config
  const viewConfig = await askQuestion("\nView generated configuration? (y/n, default: n): ");
  if (viewConfig.toLowerCase() === 'y') {
    console.log("\n📝 Generated Environment Variables:");
    console.log("=======================================");
    Object.entries(config).forEach(([key, value]) => {
      // Mask sensitive values
      if (key.includes('SECRET') || key.includes('KEY') || key.includes('PASSWORD')) {
        console.log(`${key}=${value.substring(0, 3)}...${value.substring(value.length - 3)}`);
      } else {
        console.log(`${key}=${value}`);
      }
    });
    console.log("=======================================");
  }
  
  console.log("\n🎉 Setup complete! Deploy your application to Railway with these environment variables.");
  
  rl.close();
}

// Helper function to ask a question and return the answer
function askQuestion(question) {
  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      resolve(answer);
    });
  });
}

// Run the script
promptForVariables(); 