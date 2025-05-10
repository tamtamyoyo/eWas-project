#!/usr/bin/env node

/**
 * Supabase Backup Script
 * This script creates a backup of the Supabase database and stores it locally.
 * It can be scheduled to run periodically (e.g., daily) using a cron job.
 */

import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const BACKUP_DIR = path.join(process.cwd(), 'backup');
const MAX_BACKUPS = 30; // Keep at most 30 backups

// Create backup directory if it doesn't exist
if (!fs.existsSync(BACKUP_DIR)) {
  fs.mkdirSync(BACKUP_DIR, { recursive: true });
  console.log(`Created backup directory: ${BACKUP_DIR}`);
}

// Generate timestamped backup filename
const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
const backupFilename = `supabase_backup_${timestamp}.sql`;
const backupPath = path.join(BACKUP_DIR, backupFilename);

// Get required environment variables
const { SUPABASE_URL, SUPABASE_SERVICE_KEY, SUPABASE_DB_PASSWORD, SUPABASE_PROJECT_ID } = process.env;

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY || !SUPABASE_DB_PASSWORD || !SUPABASE_PROJECT_ID) {
  console.error('Missing required environment variables. Please check your .env file.');
  process.exit(1);
}

// Extract connection details from Supabase URL
const parseDatabaseUrl = (url) => {
  const regex = /^(https?:\/\/)?([^:\/\s]+)(.*)$/;
  const matches = url.match(regex);
  if (!matches) return null;
  
  const host = matches[2];
  return host.replace('.supabase.co', '');
};

const projectRef = parseDatabaseUrl(SUPABASE_URL) || SUPABASE_PROJECT_ID;

try {
  console.log(`Starting backup for project: ${projectRef}`);
  
  // Get database connection info using supabase CLI
  console.log('Getting database connection info...');
  const connectionString = execSync(`npx supabase db pull --db-url-only`, { 
    env: { 
      ...process.env,
      SUPABASE_ACCESS_TOKEN: SUPABASE_SERVICE_KEY
    }
  }).toString().trim();
  
  // Execute pg_dump to create backup
  console.log(`Creating backup at: ${backupPath}`);
  execSync(`pg_dump --clean --if-exists --quote-all-identifiers --no-owner --no-privileges "${connectionString}" > "${backupPath}"`);
  
  console.log('Backup completed successfully!');
  
  // Clean up old backups if there are more than MAX_BACKUPS
  const backupFiles = fs.readdirSync(BACKUP_DIR)
    .filter(file => file.startsWith('supabase_backup_') && file.endsWith('.sql'))
    .map(file => ({
      name: file,
      path: path.join(BACKUP_DIR, file),
      ctime: fs.statSync(path.join(BACKUP_DIR, file)).ctime
    }))
    .sort((a, b) => b.ctime - a.ctime);
  
  if (backupFiles.length > MAX_BACKUPS) {
    console.log(`Removing ${backupFiles.length - MAX_BACKUPS} old backups...`);
    backupFiles.slice(MAX_BACKUPS).forEach(file => {
      fs.unlinkSync(file.path);
      console.log(`Removed old backup: ${file.name}`);
    });
  }
  
  console.log(`Backup process completed. Current backups: ${Math.min(backupFiles.length, MAX_BACKUPS)}`);
} catch (error) {
  console.error('Error during backup process:');
  console.error(error.message || error);
  process.exit(1);
} 