-- Supabase Schema Migration
-- Generated on 2025-05-10T17:31:36.441Z

-- Create table users
CREATE TABLE IF NOT EXISTS "users" (
"id" SERIAL PRIMARY KEY,
"username" TEXT,
"email" TEXT NOT NULL UNIQUE,
"password" TEXT,
"full_name" TEXT,
"photo_url" TEXT,
"google_id" TEXT UNIQUE,
"language" TEXT DEFAULT "ar",
"theme" TEXT DEFAULT "system",
"stripe_customer_id" TEXT,
"stripe_subscription_id" TEXT,
"current_plan" TEXT DEFAULT "free",
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

