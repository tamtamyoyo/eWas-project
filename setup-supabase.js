#!/usr/bin/env node

/**
 * Supabase Setup Script
 * 
 * This script helps set up a Supabase project for the eWas.com social media integration platform.
 * It provides step-by-step guidance for creating a Supabase project, setting up tables,
 * configuring authentication, and setting up security policies.
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

// Helper function to execute a command and return its output
const executeCommand = (command) => {
  try {
    return execSync(command, { encoding: 'utf8' });
  } catch (error) {
    console.error(`Error executing command: ${command}`);
    console.error(error.message);
    return null;
  }
};

async function main() {
  console.log('🚀 Welcome to eWas.com Supabase Setup');
  console.log('====================================\n');
  
  console.log('This script will guide you through setting up a Supabase project for eWas.com.');
  console.log('You\'ll need a Supabase account and the Supabase CLI installed.\n');
  
  const hasSupabaseCLI = checkSupabaseCLI();
  
  if (!hasSupabaseCLI) {
    console.log('❌ Supabase CLI not found. Please install it first:');
    console.log('npm install -g @supabase/cli');
    console.log('or');
    console.log('curl -fsSL https://install.supabase.io | sh');
    rl.close();
    return;
  }
  
  console.log('✅ Supabase CLI is installed.\n');
  
  // Step 1: Create or use existing Supabase project
  console.log('Step 1: Supabase Project Setup');
  console.log('-----------------------------');
  
  const createNew = await prompt('Do you want to create a new Supabase project? (y/n): ');
  
  let projectId, projectUrl, apiKey;
  
  if (createNew.toLowerCase() === 'y') {
    console.log('\nTo create a new project, you need to:');
    console.log('1. Go to https://app.supabase.com/projects');
    console.log('2. Click "New project"');
    console.log('3. Fill in the required information');
    console.log('4. Click "Create new project"');
    console.log('5. Wait for the project to be created (usually takes a few minutes)');
    
    console.log('\nAfter creating the project, you\'ll need the project details to continue.');
    
    const projectCreated = await prompt('\nHave you created the project? (y/n): ');
    
    if (projectCreated.toLowerCase() !== 'y') {
      console.log('Please create a Supabase project and then run this script again.');
      rl.close();
      return;
    }
  }
  
  // Get project details
  console.log('\nEnter your Supabase project details:');
  projectId = await prompt('Project ID (from the project URL, e.g., abcdefghijklmnopqrst): ');
  apiKey = await prompt('API Anon Key (from Project Settings > API): ');
  projectUrl = `https://${projectId}.supabase.co`;
  
  // Save details to .env file
  console.log('\nSaving Supabase details to .env file...');
  
  let envContent = '';
  
  if (fs.existsSync('.env')) {
    envContent = fs.readFileSync('.env', 'utf8');
    
    // Update Supabase values in existing .env file
    envContent = envContent
      .replace(/SUPABASE_URL=.*$/m, `SUPABASE_URL=${projectUrl}`)
      .replace(/SUPABASE_ANON_KEY=.*$/m, `SUPABASE_ANON_KEY=${apiKey}`)
      .replace(/VITE_SUPABASE_URL=.*$/m, `VITE_SUPABASE_URL=${projectUrl}`)
      .replace(/VITE_SUPABASE_ANON_KEY=.*$/m, `VITE_SUPABASE_ANON_KEY=${apiKey}`);
  } else {
    // Create new .env file with Supabase values
    envContent = `SUPABASE_URL=${projectUrl}
SUPABASE_ANON_KEY=${apiKey}
VITE_SUPABASE_URL=${projectUrl}
VITE_SUPABASE_ANON_KEY=${apiKey}`;
  }
  
  fs.writeFileSync('.env', envContent);
  console.log('✅ Supabase details saved to .env file.\n');
  
  // Step 2: Create database schema
  console.log('Step 2: Database Schema Setup');
  console.log('----------------------------');
  console.log('Now we\'ll set up the database schema in your Supabase project.\n');
  
  console.log('Creating database schema...');
  
  // Check if schema file exists
  if (!fs.existsSync('supabase-schema.sql')) {
    console.log('Generating schema from source...');
    try {
      executeCommand('node create-supabase-schema.js');
      console.log('✅ Schema file generated: supabase-schema.sql');
    } catch (error) {
      console.error('❌ Failed to generate schema file:', error);
      console.log('Please check the create-supabase-schema.js file and try again.');
      rl.close();
      return;
    }
  } else {
    console.log('✅ Found existing schema file: supabase-schema.sql');
  }
  
  console.log('\nTo apply this schema:');
  console.log('1. Open your Supabase dashboard: https://app.supabase.com/project/' + projectId);
  console.log('2. Go to the SQL Editor');
  console.log('3. Open the file supabase-schema.sql');
  console.log('4. Copy and paste the contents into the SQL Editor');
  console.log('5. Click "Run" to execute the SQL');
  
  const schemaApplied = await prompt('\nHave you applied the schema? (y/n): ');
  
  if (schemaApplied.toLowerCase() !== 'y') {
    console.log('Please apply the schema and then continue.');
  }
  
  // Step 3: Set up Row Level Security
  console.log('\nStep 3: Setting up Row Level Security (RLS)');
  console.log('----------------------------------------');
  console.log('Row Level Security ensures that users can only access their own data.\n');
  
  // Generate RLS policies
  console.log('Generating RLS policies...');
  try {
    executeCommand('node create-supabase-rls.js');
    console.log('✅ RLS policies generated: supabase-rls.sql');
  } catch (error) {
    console.error('❌ Failed to generate RLS policies:', error);
    rl.close();
    return;
  }
  
  console.log('\nTo apply these RLS policies:');
  console.log('1. Open your Supabase dashboard: https://app.supabase.com/project/' + projectId);
  console.log('2. Go to the SQL Editor');
  console.log('3. Open the file supabase-rls.sql');
  console.log('4. Copy and paste the contents into the SQL Editor');
  console.log('5. Click "Run" to execute the SQL');
  
  const rlsApplied = await prompt('\nHave you applied the RLS policies? (y/n): ');
  
  if (rlsApplied.toLowerCase() !== 'y') {
    console.log('Please apply the RLS policies and then continue.');
  }
  
  // Step 4: Configure Authentication
  console.log('\nStep 4: Authentication Setup');
  console.log('--------------------------');
  console.log('Now we\'ll configure authentication settings in Supabase.\n');
  
  console.log('To configure authentication:');
  console.log('1. Go to Authentication > Providers in the Supabase dashboard');
  console.log('2. Enable Email authentication and Social providers (Google, Facebook, Twitter, etc.)');
  console.log('3. For each social provider, add your OAuth credentials from your .env file');
  console.log('4. Configure redirect URLs for each provider');
  
  const authConfigured = await prompt('\nHave you configured authentication? (y/n): ');
  
  if (authConfigured.toLowerCase() !== 'y') {
    console.log('Please configure authentication and then continue.');
  }
  
  // Step 5: Initialize with seed data (optional)
  console.log('\nStep 5: Initialize with Seed Data (Optional)');
  console.log('------------------------------------------');
  
  const seedData = await prompt('Do you want to initialize the database with seed data? (y/n): ');
  
  if (seedData.toLowerCase() === 'y') {
    console.log('\nGenerating seed data script...');
    
    const seedSQL = `
-- Add subscription plans
INSERT INTO subscription_plans (name, description, price, interval, features, max_accounts, max_scheduled_posts, has_advanced_analytics, has_team_members, max_team_members, has_social_listening)
VALUES
  ('Free', 'Basic social media management for individuals', 0, 'month', '["Manage up to 3 social accounts", "Schedule up to 10 posts", "Basic analytics"]', 3, 10, false, false, 0, false),
  ('Pro', 'Advanced features for professionals', 1999, 'month', '["Manage up to 10 social accounts", "Unlimited scheduled posts", "Advanced analytics", "Team collaboration"]', 10, NULL, true, true, 3, false),
  ('Business', 'Complete solution for businesses', 4999, 'month', '["Manage up to 25 social accounts", "Unlimited scheduled posts", "Advanced analytics", "Team collaboration", "Social listening"]', 25, NULL, true, true, 10, true);
`;
    
    fs.writeFileSync('supabase-seed.sql', seedSQL);
    console.log('✅ Seed data script generated: supabase-seed.sql');
    
    console.log('\nTo apply the seed data:');
    console.log('1. Open your Supabase dashboard: https://app.supabase.com/project/' + projectId);
    console.log('2. Go to the SQL Editor');
    console.log('3. Open the file supabase-seed.sql');
    console.log('4. Copy and paste the contents into the SQL Editor');
    console.log('5. Click "Run" to execute the SQL');
    
    const seedApplied = await prompt('\nHave you applied the seed data? (y/n): ');
    
    if (seedApplied.toLowerCase() !== 'y') {
      console.log('Please apply the seed data and then continue.');
    }
  }
  
  // Setup completed
  console.log('\n🎉 Supabase Setup Completed!');
  console.log('--------------------------\n');
  
  console.log('Your Supabase project is now set up with:');
  console.log('✅ Database schema');
  console.log('✅ Row Level Security policies');
  console.log('✅ Authentication configuration');
  if (seedData.toLowerCase() === 'y') {
    console.log('✅ Seed data');
  }
  
  console.log('\nNext steps:');
  console.log('1. Configure environment variables for all other services (Stripe, SendGrid, etc.)');
  console.log('2. Run the application: npm run dev');
  
  rl.close();
}

function checkSupabaseCLI() {
  try {
    execSync('supabase --version', { stdio: 'ignore' });
    return true;
  } catch (error) {
    return false;
  }
}

// Run the setup
main().catch(error => {
  console.error('Error during setup:', error);
  rl.close();
}); 