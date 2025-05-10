# Supabase Migration Guide

This guide outlines the steps to migrate from NeonDB/Drizzle to Supabase for the eWas social media management platform.

## Prerequisites

Before starting the migration, ensure you have:

1. A Supabase project created at [https://app.supabase.com](https://app.supabase.com)
2. Your Supabase project URL and API keys (anon key and service key)
3. Access to your current NeonDB database

## Migration Process

### 1. Set Up Environment Variables

Create or update your `.env` file with the following variables:

```
# Existing NeonDB Connection (source)
DATABASE_URL=postgresql://username:password@your-neon-db-host/dbname

# Supabase Connection (target)
SUPABASE_URL=https://your-project-id.supabase.co
SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_KEY=your-service-key
```

The `SUPABASE_SERVICE_KEY` is found in your Supabase dashboard under Project Settings > API.

### 2. Create Schema in Supabase

The schema has already been exported to SQL in the `supabase-schema.sql` file. Run this in your Supabase SQL editor to create all necessary tables:

1. Log in to your Supabase dashboard
2. Go to SQL Editor
3. Create a new query
4. Copy and paste the contents of `supabase-schema.sql`
5. Run the query

### 3. Migrate Data

Run the data migration script to transfer your existing data to Supabase:

```bash
npm run db:migrate-to-supabase
```

This script will:
- Connect to your existing NeonDB database
- Read all data from tables defined in your schema
- Insert the data into the corresponding Supabase tables
- Log progress and any errors encountered

### 4. Verify Migration

After the migration completes, verify the data in Supabase:

1. Go to your Supabase dashboard
2. Navigate to Table Editor
3. Check that all tables contain the expected data
4. Run test queries to verify data integrity

### 5. Update Application Configuration

The application has been updated to use Supabase. Ensure your production environment has the required environment variables:

```
SUPABASE_URL=https://your-project-id.supabase.co
SUPABASE_ANON_KEY=your-anon-key
```

### 6. Authentication Migration

If you're using authentication features, additional steps are required:

1. If you have existing users with passwords, you'll need to migrate them to Supabase Auth
2. For OAuth providers (Google, Twitter, etc.), configure them in Supabase Auth settings
3. Update callback URLs in your social media platform developer portals

### 7. Testing

Before switching production traffic to the new database:

1. Run the application with Supabase in a staging environment
2. Test all critical paths:
   - User registration and login
   - Social media connections
   - Post creation and scheduling
   - Analytics features
   - Team member invitations
   - Subscription management

### 8. Deployment

Once testing is complete:

1. Update your production environment variables to use Supabase
2. Deploy the updated application
3. Monitor for any issues

### 9. Rollback Plan

If issues are encountered:

1. Revert to the previous DB configuration using environment variables
2. Roll back the code changes that removed NeonDB support

## Completed Migration Tasks

- [x] Created Supabase database schema
- [x] Updated db.ts to use Supabase client
- [x] Added TypeScript types for Supabase
- [x] Created data migration script
- [x] Added migration documentation

## Post-Migration Optimization

After the migration is complete:

1. Review and optimize SQL queries for Supabase
2. Consider implementing Row Level Security (RLS) in Supabase for enhanced security
3. Set up automated backups for your Supabase database
4. Remove unused NeonDB code and dependencies when ready 