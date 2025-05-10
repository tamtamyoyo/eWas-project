import { drizzle } from "drizzle-orm/neon-http";
import { neon } from "@neondatabase/serverless";
import * as schema from "@shared/schema";
import { createClient } from "@supabase/supabase-js";
import { Database } from "./types/supabase";

// Source Database (NeonDB with Drizzle ORM)
const sourceDbUrl = process.env.SOURCE_DATABASE_URL || process.env.DATABASE_URL;

// Target Database (Supabase)
const supabaseUrl = process.env.SUPABASE_URL || 'https://ymhkgyfgpddifplpsnyt.supabase.co';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY; // Use the service key for admin privileges

async function migrateData() {
  if (!sourceDbUrl) {
    console.error('Source database URL not found. Set SOURCE_DATABASE_URL environment variable.');
    process.exit(1);
  }

  if (!supabaseServiceKey) {
    console.error('Supabase service key not found. Set SUPABASE_SERVICE_KEY environment variable.');
    process.exit(1);
  }

  console.log('Starting migration from NeonDB to Supabase...');

  // Initialize source database
  const sql = neon(sourceDbUrl);
  const sourceDb = drizzle(sql, { schema });

  // Initialize Supabase client with service key for admin access
  const supabase = createClient<Database>(supabaseUrl, supabaseServiceKey);

  try {
    // 1. Migrate users
    console.log('Migrating users...');
    const users = await sourceDb.select().from(schema.users);
    
    for (const user of users) {
      console.log(`Migrating user: ${user.email}`);
      
      const { error: insertError } = await supabase
        .from('users')
        .upsert({
          id: user.id,
          email: user.email,
          username: user.username,
          password: user.password,
          full_name: user.fullName,
          photo_url: user.photoURL,
          google_id: user.googleId,
          language: user.language,
          theme: user.theme,
          stripe_customer_id: user.stripeCustomerId,
          stripe_subscription_id: user.stripeSubscriptionId,
          current_plan: user.currentPlan,
          is_owner: user.isOwner,
          created_at: user.createdAt?.toISOString()
        });
      
      if (insertError) {
        console.error(`Error migrating user ${user.email}:`, insertError);
      }
    }

    // 2. Migrate social accounts
    console.log('Migrating social accounts...');
    const socialAccounts = await sourceDb.select().from(schema.socialAccounts);
    
    for (const account of socialAccounts) {
      console.log(`Migrating social account: ${account.platform} for user ${account.userId}`);
      
      const { error: insertError } = await supabase
        .from('social_accounts')
        .upsert({
          id: account.id,
          user_id: account.userId,
          platform: account.platform,
          account_id: account.accountId,
          account_name: account.accountName,
          access_token: account.accessToken,
          access_token_secret: account.accessTokenSecret,
          refresh_token: account.refreshToken,
          token_expiry: account.tokenExpiry?.toISOString(),
          is_connected: account.isConnected,
          profile_url: account.profileUrl,
          username: account.username,
          name: account.name,
          created_at: account.createdAt?.toISOString()
        });
      
      if (insertError) {
        console.error(`Error migrating social account ${account.platform}:`, insertError);
      }
    }

    // 3. Migrate posts
    console.log('Migrating posts...');
    const posts = await sourceDb.select().from(schema.posts);
    
    for (const post of posts) {
      console.log(`Migrating post ID: ${post.id}`);
      
      const { error: insertError } = await supabase
        .from('posts')
        .upsert({
          id: post.id,
          user_id: post.userId,
          content: post.content,
          media_urls: post.mediaUrls,
          scheduled_at: post.scheduledAt?.toISOString(),
          published_at: post.publishedAt?.toISOString(),
          platforms: post.platforms,
          status: post.status,
          analytics: post.analytics,
          created_at: post.createdAt?.toISOString()
        });
      
      if (insertError) {
        console.error(`Error migrating post ${post.id}:`, insertError);
      }
    }

    // 4. Migrate subscription plans
    console.log('Migrating subscription plans...');
    const plans = await sourceDb.select().from(schema.subscriptionPlans);
    
    for (const plan of plans) {
      console.log(`Migrating subscription plan: ${plan.name}`);
      
      const { error: insertError } = await supabase
        .from('subscription_plans')
        .upsert({
          id: plan.id,
          name: plan.name,
          description: plan.description,
          price: plan.price,
          interval: plan.interval,
          features: plan.features,
          max_accounts: plan.maxAccounts,
          max_scheduled_posts: plan.maxScheduledPosts,
          has_advanced_analytics: plan.hasAdvancedAnalytics,
          has_team_members: plan.hasTeamMembers,
          max_team_members: plan.maxTeamMembers,
          has_social_listening: plan.hasSocialListening,
          created_at: plan.createdAt?.toISOString()
        });
      
      if (insertError) {
        console.error(`Error migrating subscription plan ${plan.name}:`, insertError);
      }
    }

    // 5. Migrate team members
    console.log('Migrating team members...');
    const teamMembers = await sourceDb.select().from(schema.teamMembers);
    
    for (const member of teamMembers) {
      console.log(`Migrating team member: ${member.inviteEmail}`);
      
      const { error: insertError } = await supabase
        .from('team_members')
        .upsert({
          id: member.id,
          owner_id: member.ownerId,
          member_id: member.memberId,
          role: member.role,
          status: member.status,
          invite_token: member.inviteToken,
          invite_email: member.inviteEmail,
          permissions: member.permissions,
          created_at: member.createdAt?.toISOString(),
          expires_at: member.expiresAt?.toISOString()
        });
      
      if (insertError) {
        console.error(`Error migrating team member ${member.inviteEmail}:`, insertError);
      }
    }

    console.log('Migration completed successfully!');

  } catch (error) {
    console.error('Error during migration:', error);
    process.exit(1);
  }
}

// Run the migration
migrateData(); 