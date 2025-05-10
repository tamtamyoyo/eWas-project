import { pgTable, text, serial, integer, boolean, timestamp, jsonb, primaryKey } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username"),  // No longer required, will store email as username if not provided
  email: text("email").notNull().unique(),
  password: text("password"), // Can be null for OAuth users
  fullName: text("full_name"),
  photoURL: text("photo_url"), // For storing profile picture URL
  googleId: text("google_id").unique(), // For storing Google OAuth ID
  language: text("language").default("ar"), // Changed default to Arabic
  theme: text("theme").default("system"), // Theme preference: light, dark, system
  stripeCustomerId: text("stripe_customer_id"),
  stripeSubscriptionId: text("stripe_subscription_id"),
  currentPlan: text("current_plan").default("free"),
  isOwner: boolean("is_owner").default(true), // Indicates if the user is the team owner
  createdAt: timestamp("created_at").defaultNow(),
});

export const socialAccounts = pgTable("social_accounts", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id, { onDelete: "cascade" }).notNull(),
  platform: text("platform").notNull(), // facebook, instagram, twitter, linkedin, snapchat
  accountId: text("account_id").notNull(),
  accountName: text("account_name").notNull(),
  accessToken: text("access_token").notNull(),
  accessTokenSecret: text("access_token_secret"), // Added for Twitter OAuth 1.0a
  refreshToken: text("refresh_token"),
  tokenExpiry: timestamp("token_expiry"),
  isConnected: boolean("is_connected").default(true),
  profileUrl: text("profile_url"), // URL to profile picture
  username: text("username"), // Username on the platform
  name: text("name"), // Display name on the platform
  createdAt: timestamp("created_at").defaultNow(),
});

export const posts = pgTable("posts", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id, { onDelete: "cascade" }).notNull(),
  content: text("content").notNull(),
  mediaUrls: text("media_urls").array(),
  scheduledAt: timestamp("scheduled_at"),
  publishedAt: timestamp("published_at"),
  platforms: text("platforms").array().notNull(), // Array of platform names
  status: text("status").notNull(), // draft, scheduled, published, failed
  analytics: jsonb("analytics"), // Engagement metrics
  createdAt: timestamp("created_at").defaultNow(),
});

export const subscriptionPlans = pgTable("subscription_plans", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description").notNull(),
  price: integer("price").notNull(), // In cents
  interval: text("interval").notNull(), // monthly, yearly
  features: jsonb("features").notNull(),
  maxAccounts: integer("max_accounts").notNull(),
  maxScheduledPosts: integer("max_scheduled_posts"),
  hasAdvancedAnalytics: boolean("has_advanced_analytics").default(false),
  hasTeamMembers: boolean("has_team_members").default(false),
  maxTeamMembers: integer("max_team_members"),
  hasSocialListening: boolean("has_social_listening").default(false),
  createdAt: timestamp("created_at").defaultNow(),
});

export const passwordResetTokens = pgTable("password_reset_tokens", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id, { onDelete: "cascade" }).notNull(),
  token: text("token").notNull(),
  expiresAt: timestamp("expires_at").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const userStats = pgTable("user_stats", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id, { onDelete: "cascade" }).notNull(),
  platform: text("platform").notNull(),
  date: timestamp("date").notNull(),
  followers: integer("followers"),
  engagement: integer("engagement"),
  clicks: integer("clicks"),
  impressions: integer("impressions"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const teamMembers = pgTable("team_members", {
  id: serial("id").primaryKey(),
  ownerId: integer("owner_id").references(() => users.id, { onDelete: "cascade" }).notNull(), // Team owner (account owner)
  memberId: integer("member_id").references(() => users.id, { onDelete: "cascade" }).notNull(), // Team member
  role: text("role").notNull().default("editor"), // Role: editor, viewer, admin
  status: text("status").notNull().default("pending"), // Status: pending, active, declined
  inviteToken: text("invite_token"), // Token for invite link
  inviteEmail: text("invite_email").notNull(), // Email address for invitation
  permissions: jsonb("permissions"), // Specific permissions for this member
  createdAt: timestamp("created_at").defaultNow(),
  expiresAt: timestamp("expires_at"), // When the invitation expires
});

// Insert Schemas
export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
  createdAt: true,
  stripeCustomerId: true,
  stripeSubscriptionId: true,
  currentPlan: true,
  isOwner: true,
}).partial({
  username: true,
  password: true,
  fullName: true,
  photoURL: true,
  googleId: true,
});

export const insertSocialAccountSchema = createInsertSchema(socialAccounts).omit({
  id: true,
  createdAt: true,
});

export const insertPostSchema = createInsertSchema(posts).omit({
  id: true,
  createdAt: true,
  publishedAt: true,
  analytics: true,
});

export const insertSubscriptionPlanSchema = createInsertSchema(subscriptionPlans).omit({
  id: true,
  createdAt: true,
});

export const insertUserStatsSchema = createInsertSchema(userStats).omit({
  id: true,
  createdAt: true,
});

export const insertTeamMemberSchema = createInsertSchema(teamMembers).omit({
  id: true,
  createdAt: true,
});

export const insertPasswordResetTokenSchema = createInsertSchema(passwordResetTokens).omit({
  id: true,
  createdAt: true,
});

// Relations
export const usersRelations = relations(users, ({ many }) => ({
  socialAccounts: many(socialAccounts),
  posts: many(posts),
  userStats: many(userStats),
  ownedTeamMembers: many(teamMembers, { relationName: "teamOwner" }),
  teamMemberships: many(teamMembers, { relationName: "teamMember" }),
  passwordResetTokens: many(passwordResetTokens),
}));

export const socialAccountsRelations = relations(socialAccounts, ({ one }) => ({
  user: one(users, {
    fields: [socialAccounts.userId],
    references: [users.id],
  }),
}));

export const postsRelations = relations(posts, ({ one }) => ({
  user: one(users, {
    fields: [posts.userId],
    references: [users.id],
  }),
}));

export const userStatsRelations = relations(userStats, ({ one }) => ({
  user: one(users, {
    fields: [userStats.userId],
    references: [users.id],
  }),
}));

export const teamMembersRelations = relations(teamMembers, ({ one }) => ({
  owner: one(users, {
    fields: [teamMembers.ownerId],
    references: [users.id],
    relationName: "teamOwner",
  }),
  member: one(users, {
    fields: [teamMembers.memberId],
    references: [users.id],
    relationName: "teamMember",
  }),
}));

export const passwordResetTokensRelations = relations(passwordResetTokens, ({ one }) => ({
  user: one(users, {
    fields: [passwordResetTokens.userId],
    references: [users.id],
  }),
}));

// Types
export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;

export type InsertSocialAccount = z.infer<typeof insertSocialAccountSchema>;
export type SocialAccount = typeof socialAccounts.$inferSelect;

export type InsertPost = z.infer<typeof insertPostSchema>;
export type Post = typeof posts.$inferSelect;

export type InsertSubscriptionPlan = z.infer<typeof insertSubscriptionPlanSchema>;
export type SubscriptionPlan = typeof subscriptionPlans.$inferSelect;

export type InsertUserStats = z.infer<typeof insertUserStatsSchema>;
export type UserStats = typeof userStats.$inferSelect;

export type InsertTeamMember = z.infer<typeof insertTeamMemberSchema>;
export type TeamMember = typeof teamMembers.$inferSelect;

export type InsertPasswordResetToken = z.infer<typeof insertPasswordResetTokenSchema>;
export type PasswordResetToken = typeof passwordResetTokens.$inferSelect;
