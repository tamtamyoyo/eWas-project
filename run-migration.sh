#!/bin/bash

# Supabase Migration Script
# This script performs a step-by-step migration from NeonDB to Supabase

echo "=========================================="
echo "Starting Supabase Migration Process"
echo "=========================================="

# Check for required environment variables
if [ -z "$SUPABASE_URL" ]; then
  echo "Error: SUPABASE_URL environment variable is not set"
  echo "Please set it to your Supabase project URL"
  exit 1
fi

if [ -z "$SUPABASE_ANON_KEY" ]; then
  echo "Error: SUPABASE_ANON_KEY environment variable is not set"
  echo "Please set it to your Supabase project anon key"
  exit 1
fi

if [ -z "$SUPABASE_SERVICE_KEY" ]; then
  echo "Error: SUPABASE_SERVICE_KEY environment variable is not set"
  echo "Please set it to your Supabase project service key"
  exit 1
fi

# Step 1: Generate the schema SQL
echo "Generating schema SQL..."
node create-supabase-schema.js

# Check if the schema was generated successfully
if [ ! -f "supabase-schema.sql" ]; then
  echo "Error: Failed to generate schema SQL"
  exit 1
fi

echo "Schema SQL generated successfully"

# Step 2: Ask for confirmation before proceeding with migration
echo "=========================================="
echo "WARNING: This will migrate your data to Supabase."
echo "Make sure you have a backup of your current database."
echo "=========================================="
read -p "Do you want to continue with the migration? (y/n): " confirm

if [ "$confirm" != "y" ]; then
  echo "Migration aborted"
  exit 0
fi

# Step 3: Migrate data
echo "Starting data migration..."
npm run db:migrate-to-supabase

# Step 4: Verify the migration
echo "=========================================="
echo "Migration completed. Please verify the data in your Supabase dashboard."
echo "URL: $SUPABASE_URL"
echo "=========================================="

# Final step: Show next instructions
echo "Next steps:"
echo "1. Configure authentication providers in your Supabase dashboard"
echo "2. Update your environment variables in production"
echo "3. Deploy the updated application"
echo "==========================================" 