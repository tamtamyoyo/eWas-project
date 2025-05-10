-- Complete Supabase Setup SQL
-- Generated on: 2025-05-10

-- ======================================================
-- PART 1: CREATE DATABASE SCHEMA
-- ======================================================

-- Create table users
CREATE TABLE IF NOT EXISTS "users" (
"id" SERIAL PRIMARY KEY,
"username" TEXT,
"email" TEXT NOT NULL UNIQUE,
"password" TEXT,
"full_name" TEXT,
"photo_url" TEXT,
"google_id" TEXT UNIQUE,
"language" TEXT DEFAULT 'ar',
"theme" TEXT DEFAULT 'system',
"stripe_customer_id" TEXT,
"stripe_subscription_id" TEXT,
"current_plan" TEXT DEFAULT 'free',
"is_owner" BOOLEAN DEFAULT true,
"created_at" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create table subscription_plans
CREATE TABLE IF NOT EXISTS "subscription_plans" (
"id" SERIAL PRIMARY KEY,
"name" TEXT NOT NULL,
"description" TEXT NOT NULL,
"price" INTEGER NOT NULL,
"interval" TEXT NOT NULL,
"features" JSONB NOT NULL,
"max_accounts" INTEGER NOT NULL,
"max_scheduled_posts" INTEGER,
"has_advanced_analytics" BOOLEAN DEFAULT false,
"has_team_members" BOOLEAN DEFAULT false,
"max_team_members" INTEGER,
"has_social_listening" BOOLEAN DEFAULT false,
"created_at" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create table social_accounts
CREATE TABLE IF NOT EXISTS "social_accounts" (
"id" SERIAL PRIMARY KEY,
"user_id" INTEGER NOT NULL,
"platform" TEXT NOT NULL,
"access_token" TEXT NOT NULL,
"refresh_token" TEXT,
"token_secret" TEXT,
"expires_at" TIMESTAMP WITH TIME ZONE,
"account_id" TEXT,
"username" TEXT,
"account_name" TEXT,
"profile_url" TEXT,
"avatar_url" TEXT,
"is_connected" BOOLEAN DEFAULT true,
"created_at" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
"updated_at" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create table posts
CREATE TABLE IF NOT EXISTS "posts" (
"id" SERIAL PRIMARY KEY,
"user_id" INTEGER NOT NULL,
"content" TEXT NOT NULL,
"media_urls" TEXT[],
"platforms" TEXT[] NOT NULL,
"scheduled_at" TIMESTAMP WITH TIME ZONE,
"published_at" TIMESTAMP WITH TIME ZONE,
"status" TEXT DEFAULT 'draft',
"is_archived" BOOLEAN DEFAULT false,
"created_at" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
"updated_at" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create table team_members
CREATE TABLE IF NOT EXISTS "team_members" (
"id" SERIAL PRIMARY KEY,
"team_id" INTEGER NOT NULL,
"user_id" INTEGER NOT NULL,
"role" TEXT DEFAULT 'member',
"permissions" TEXT[],
"created_at" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create table team_invitations
CREATE TABLE IF NOT EXISTS "team_invitations" (
"id" SERIAL PRIMARY KEY,
"team_id" INTEGER NOT NULL,
"email" TEXT NOT NULL,
"role" TEXT DEFAULT 'member',
"status" TEXT DEFAULT 'pending',
"expires_at" TIMESTAMP WITH TIME ZONE,
"created_at" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ======================================================
-- PART 2: ADD FOREIGN KEY CONSTRAINTS
-- ======================================================

-- Add foreign key constraints
ALTER TABLE "social_accounts" ADD CONSTRAINT "fk_social_accounts_user_id" 
  FOREIGN KEY ("user_id") REFERENCES "users" ("id") ON DELETE CASCADE;

ALTER TABLE "posts" ADD CONSTRAINT "fk_posts_user_id" 
  FOREIGN KEY ("user_id") REFERENCES "users" ("id") ON DELETE CASCADE;

ALTER TABLE "team_members" ADD CONSTRAINT "fk_team_members_team_id" 
  FOREIGN KEY ("team_id") REFERENCES "users" ("id") ON DELETE CASCADE;

ALTER TABLE "team_members" ADD CONSTRAINT "fk_team_members_user_id" 
  FOREIGN KEY ("user_id") REFERENCES "users" ("id") ON DELETE CASCADE;

ALTER TABLE "team_invitations" ADD CONSTRAINT "fk_team_invitations_team_id" 
  FOREIGN KEY ("team_id") REFERENCES "users" ("id") ON DELETE CASCADE;

-- ======================================================
-- PART 3: ROW LEVEL SECURITY POLICIES
-- ======================================================

-- Enable Row Level Security on all tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE social_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscription_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE team_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE team_invitations ENABLE ROW LEVEL SECURITY;

-- Create policies for users table
CREATE POLICY "Users can view their own user data" ON users
  FOR SELECT USING (auth.uid() = id::text);

CREATE POLICY "Users can update their own user data" ON users
  FOR UPDATE USING (auth.uid() = id::text);

-- Create policies for social_accounts table
CREATE POLICY "Users can view their own social accounts" ON social_accounts
  FOR SELECT USING (auth.uid() = user_id::text);

CREATE POLICY "Users can insert their own social accounts" ON social_accounts
  FOR INSERT WITH CHECK (auth.uid() = user_id::text);

CREATE POLICY "Users can update their own social accounts" ON social_accounts
  FOR UPDATE USING (auth.uid() = user_id::text);

CREATE POLICY "Users can delete their own social accounts" ON social_accounts
  FOR DELETE USING (auth.uid() = user_id::text);

-- Create policies for posts table
CREATE POLICY "Users can view their own posts" ON posts
  FOR SELECT USING (auth.uid() = user_id::text);

CREATE POLICY "Users can insert their own posts" ON posts
  FOR INSERT WITH CHECK (auth.uid() = user_id::text);

CREATE POLICY "Users can update their own posts" ON posts
  FOR UPDATE USING (auth.uid() = user_id::text);

CREATE POLICY "Users can delete their own posts" ON posts
  FOR DELETE USING (auth.uid() = user_id::text);

-- Create policies for subscription_plans table
CREATE POLICY "Anyone can view subscription plans" ON subscription_plans
  FOR SELECT USING (true);

-- Create policies for team_members table
CREATE POLICY "Team owners can view their team members" ON team_members
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id::text = auth.uid()
      AND users.is_owner = true
      AND users.id = team_members.team_id
    )
  );

CREATE POLICY "Users can view teams they belong to" ON team_members
  FOR SELECT USING (
    user_id::text = auth.uid()
  );

CREATE POLICY "Team owners can insert team members" ON team_members
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id::text = auth.uid()
      AND users.is_owner = true
      AND users.id = team_members.team_id
    )
  );

CREATE POLICY "Team owners can update team members" ON team_members
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id::text = auth.uid()
      AND users.is_owner = true
      AND users.id = team_members.team_id
    )
  );

CREATE POLICY "Team owners can delete team members" ON team_members
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id::text = auth.uid()
      AND users.is_owner = true
      AND users.id = team_members.team_id
    )
  );

-- Create policies for team_invitations table
CREATE POLICY "Team owners can view their team invitations" ON team_invitations
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id::text = auth.uid()
      AND users.is_owner = true
      AND users.id = team_invitations.team_id
    )
  );

CREATE POLICY "Users can view invitations sent to their email" ON team_invitations
  FOR SELECT USING (
    email = (
      SELECT email FROM users
      WHERE users.id::text = auth.uid()
    )
  );

CREATE POLICY "Team owners can insert team invitations" ON team_invitations
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id::text = auth.uid()
      AND users.is_owner = true
      AND users.id = team_invitations.team_id
    )
  );

CREATE POLICY "Team owners can delete team invitations" ON team_invitations
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id::text = auth.uid()
      AND users.is_owner = true
      AND users.id = team_invitations.team_id
    )
  ); 