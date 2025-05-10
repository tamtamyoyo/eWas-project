#!/usr/bin/env node

/**
 * Supabase Complete Setup Script
 * This script sets up and deploys the complete Supabase configuration, including:
 * - Database schema
 * - RLS policies
 * - Storage buckets
 * - Edge functions
 * - Initial seed data
 */

import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';
import readline from 'readline';

// Load environment variables
dotenv.config();

// Create readline interface for user input
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

// Ask for confirmation
function confirm(question) {
  return new Promise((resolve) => {
    rl.question(`${question} (y/n) `, (answer) => {
      resolve(answer.toLowerCase() === 'y' || answer.toLowerCase() === 'yes');
    });
  });
}

// Ensure required environment variables
async function checkEnvVars() {
  const requiredVars = [
    'SUPABASE_URL',
    'SUPABASE_PROJECT_ID',
    'SUPABASE_ANON_KEY',
    'SUPABASE_SERVICE_KEY'
  ];
  
  const missingVars = requiredVars.filter(varName => !process.env[varName]);
  
  if (missingVars.length > 0) {
    console.error(`Missing required environment variables: ${missingVars.join(', ')}`);
    console.error('Please set these variables in a .env file or provide them when prompted.');
    
    for (const varName of missingVars) {
      process.env[varName] = await new Promise((resolve) => {
        rl.question(`Please enter ${varName}: `, (answer) => {
          resolve(answer);
        });
      });
    }
  }
}

// Main function
async function main() {
  try {
    console.log('========================================');
    console.log('Supabase Complete Setup and Deployment');
    console.log('========================================\n');
    
    // Check environment variables
    await checkEnvVars();
    
    // Initialize Supabase project
    console.log('\n▶️ Step 1: Initialize Supabase project\n');
    
    // Check if Supabase project is already set up
    let projectExists = false;
    try {
      const projectInfo = execSync(`npx supabase projects list`).toString();
      projectExists = projectInfo.includes(process.env.SUPABASE_PROJECT_ID);
    } catch (error) {
      console.log('Could not check project list. Assuming we need to log in.');
    }
    
    if (!projectExists) {
      // Login to Supabase
      console.log('Logging in to Supabase...');
      const shouldLogin = await confirm('Do you want to login to Supabase?');
      
      if (shouldLogin) {
        try {
          execSync('npx supabase login', { stdio: 'inherit' });
        } catch (error) {
          console.error('Failed to login to Supabase. Please try again.');
          process.exit(1);
        }
      }
    }
    
    // Link project
    console.log('\nLinking to Supabase project...');
    try {
      execSync(`npx supabase link --project-ref ${process.env.SUPABASE_PROJECT_ID}`, { stdio: 'inherit' });
    } catch (error) {
      console.error('Failed to link to Supabase project:', error.message);
      const shouldContinue = await confirm('Do you want to continue anyway?');
      if (!shouldContinue) process.exit(1);
    }
    
    // Deploy migrations
    console.log('\n▶️ Step 2: Deploy database migrations\n');
    
    const shouldMigrate = await confirm('Do you want to push database migrations?');
    if (shouldMigrate) {
      try {
        console.log('Pushing database migrations...');
        execSync('npx supabase db push', { stdio: 'inherit' });
      } catch (error) {
        console.error('Failed to push database migrations:', error.message);
        const shouldContinue = await confirm('Do you want to continue anyway?');
        if (!shouldContinue) process.exit(1);
      }
    }
    
    // Deploy storage configuration
    console.log('\n▶️ Step 3: Configure storage buckets\n');
    
    const shouldConfigureStorage = await confirm('Do you want to configure storage buckets?');
    if (shouldConfigureStorage) {
      try {
        console.log('Configuring storage buckets...');
        
        // Check if storage.sql exists
        const storageSqlPath = path.join(process.cwd(), 'supabase', 'storage.sql');
        if (fs.existsSync(storageSqlPath)) {
          // Get database connection string
          const connectionString = execSync(`npx supabase db pull --db-url-only`).toString().trim();
          
          // Apply storage configuration
          execSync(`psql "${connectionString}" -f ${storageSqlPath}`, { stdio: 'inherit' });
          console.log('Storage buckets configured successfully!');
        } else {
          console.error('storage.sql file not found. Skipping storage configuration.');
        }
      } catch (error) {
        console.error('Failed to configure storage buckets:', error.message);
        const shouldContinue = await confirm('Do you want to continue anyway?');
        if (!shouldContinue) process.exit(1);
      }
    }
    
    // Deploy edge functions
    console.log('\n▶️ Step 4: Deploy edge functions\n');
    
    const shouldDeployFunctions = await confirm('Do you want to deploy edge functions?');
    if (shouldDeployFunctions) {
      try {
        console.log('Deploying edge functions...');
        execSync('npx supabase functions deploy', { stdio: 'inherit' });
      } catch (error) {
        console.error('Failed to deploy edge functions:', error.message);
        const shouldContinue = await confirm('Do you want to continue anyway?');
        if (!shouldContinue) process.exit(1);
      }
    }
    
    // Seed initial data
    console.log('\n▶️ Step 5: Seed initial data\n');
    
    const shouldSeed = await confirm('Do you want to seed initial data? (This will reset your database!)');
    if (shouldSeed) {
      try {
        console.log('Seeding initial data...');
        execSync('npx supabase db reset', { stdio: 'inherit' });
      } catch (error) {
        console.error('Failed to seed initial data:', error.message);
        const shouldContinue = await confirm('Do you want to continue anyway?');
        if (!shouldContinue) process.exit(1);
      }
    }
    
    // Generate TypeScript types
    console.log('\n▶️ Step 6: Generate TypeScript types\n');
    
    const shouldGenerateTypes = await confirm('Do you want to generate TypeScript types?');
    if (shouldGenerateTypes) {
      try {
        console.log('Generating TypeScript types...');
        execSync('npx supabase gen types typescript --local > server/types/supabase.ts', { stdio: 'inherit' });
      } catch (error) {
        console.error('Failed to generate TypeScript types:', error.message);
      }
    }
    
    // Create a backup
    console.log('\n▶️ Step 7: Create a database backup\n');
    
    const shouldBackup = await confirm('Do you want to create a database backup?');
    if (shouldBackup) {
      try {
        console.log('Creating database backup...');
        
        // Ensure backup directory exists
        const backupDir = path.join(process.cwd(), 'backup');
        if (!fs.existsSync(backupDir)) {
          fs.mkdirSync(backupDir, { recursive: true });
        }
        
        // Generate timestamped backup filename
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        const backupFilename = `supabase_setup_backup_${timestamp}.sql`;
        const backupPath = path.join(backupDir, backupFilename);
        
        // Get database connection string
        const connectionString = execSync(`npx supabase db pull --db-url-only`).toString().trim();
        
        // Create backup
        execSync(`pg_dump --clean --if-exists --quote-all-identifiers --no-owner --no-privileges "${connectionString}" > "${backupPath}"`, { stdio: 'inherit' });
        
        console.log(`Backup created successfully at: ${backupPath}`);
      } catch (error) {
        console.error('Failed to create database backup:', error.message);
      }
    }
    
    console.log('\n========================================');
    console.log('🎉 Supabase setup and deployment completed!');
    console.log('========================================\n');
    
    // Final advice
    console.log('Next steps:');
    console.log('1. Set up authentication providers in the Supabase dashboard');
    console.log('2. Configure environment variables in your deployment platform');
    console.log('3. Test the application with the new Supabase configuration');
    console.log('4. Schedule regular backups for your database\n');
    
  } catch (error) {
    console.error('Error during setup and deployment:');
    console.error(error);
    process.exit(1);
  } finally {
    rl.close();
  }
}

main(); 