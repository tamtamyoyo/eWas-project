import { 
  users, 
  socialAccounts, 
  posts, 
  subscriptionPlans, 
  userStats,
  teamMembers,
  passwordResetTokens,
  type User, 
  type InsertUser,
  type SocialAccount,
  type InsertSocialAccount,
  type Post,
  type InsertPost,
  type SubscriptionPlan,
  type InsertSubscriptionPlan,
  type UserStats,
  type InsertUserStats,
  type TeamMember,
  type InsertTeamMember,
  type PasswordResetToken,
  type InsertPasswordResetToken
} from "@shared/schema";

export interface IStorage {
  // User operations
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  getUserByGoogleId(googleId: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  createGoogleUser(data: { email: string, fullName?: string, photoURL?: string, googleId: string }): Promise<User>;
  updateUser(id: number, userData: Partial<User>): Promise<User | undefined>;
  updateUserPassword(userId: number, hashedPassword: string): Promise<User | undefined>;
  updateStripeCustomerId(userId: number, stripeCustomerId: string): Promise<User | undefined>;
  updateUserStripeInfo(userId: number, stripeInfo: { stripeCustomerId: string, stripeSubscriptionId: string }): Promise<User | undefined>;
  updateUserPreferences(id: number, preferences: { language?: string, theme?: string }): Promise<User | undefined>;
  
  // Password reset operations
  createPasswordResetToken(token: InsertPasswordResetToken): Promise<PasswordResetToken>;
  getPasswordResetToken(token: string): Promise<PasswordResetToken | undefined>;
  deletePasswordResetToken(token: string): Promise<boolean>;
  
  // Social account operations
  getSocialAccounts(userId: number): Promise<SocialAccount[]>;
  getSocialAccountByPlatform(userId: number, platform: string): Promise<SocialAccount | undefined>;
  createSocialAccount(account: InsertSocialAccount): Promise<SocialAccount>;
  updateSocialAccount(id: number, accountData: Partial<SocialAccount>): Promise<SocialAccount | undefined>;
  deleteSocialAccount(id: number): Promise<boolean>;
  
  // Post operations
  getPosts(userId: number): Promise<Post[]>;
  getScheduledPosts(userId: number): Promise<Post[]>;
  getPost(id: number): Promise<Post | undefined>;
  createPost(post: InsertPost): Promise<Post>;
  updatePost(id: number, postData: Partial<Post>): Promise<Post | undefined>;
  deletePost(id: number): Promise<boolean>;
  
  // Subscription plan operations
  getSubscriptionPlans(): Promise<SubscriptionPlan[]>;
  getSubscriptionPlan(id: number): Promise<SubscriptionPlan | undefined>;
  createSubscriptionPlan(plan: InsertSubscriptionPlan): Promise<SubscriptionPlan>;
  
  // User stats operations
  getUserStats(userId: number): Promise<UserStats[]>;
  getUserStatsByPlatform(userId: number, platform: string): Promise<UserStats[]>;
  createUserStats(stats: InsertUserStats): Promise<UserStats>;
  
  // Team operations
  getTeamMembers(ownerId: number): Promise<TeamMember[]>;
  getTeamMember(id: number): Promise<TeamMember | undefined>;
  getTeamMemberByEmail(ownerId: number, email: string): Promise<TeamMember | undefined>;
  getTeamMemberByToken(token: string): Promise<TeamMember | undefined>;
  createTeamMember(teamMember: InsertTeamMember): Promise<TeamMember>;
  updateTeamMember(id: number, teamMemberData: Partial<TeamMember>): Promise<TeamMember | undefined>;
  deleteTeamMember(id: number): Promise<boolean>;
  getTeamMemberships(memberId: number): Promise<TeamMember[]>;
}

import { db } from "./db";
import { eq, and, gt, isNull, isNotNull } from "drizzle-orm";

export class DatabaseStorage implements IStorage {
  constructor() {
    // Initialize subscription plans when the server starts
    this.initializeSubscriptionPlans().catch(error => {
      console.error("Failed to initialize subscription plans:", error);
    });
  }

  // Initialize default subscription plans
  async initializeSubscriptionPlans() {
    // Check if there are any subscription plans already
    const existingPlans = await this.getSubscriptionPlans();
    
    // Only create plans if there are none
    if (existingPlans.length === 0) {
      console.log("Initializing subscription plans...");
      
      const starterPlan: InsertSubscriptionPlan = {
        name: "Starter",
        description: "For individuals and freelancers",
        price: 900, // $9 in cents
        interval: "monthly",
        features: JSON.stringify([
          "Connect 3 social accounts",
          "Schedule up to 30 posts",
          "Basic analytics"
        ]),
        maxAccounts: 3,
        maxScheduledPosts: 30,
        hasAdvancedAnalytics: false,
        hasTeamMembers: false,
        maxTeamMembers: 0,
        hasSocialListening: false
      };
      
      const businessPlan: InsertSubscriptionPlan = {
        name: "Business",
        description: "For small businesses",
        price: 1900, // $19 in cents
        interval: "monthly",
        features: JSON.stringify([
          "Connect 10 social accounts",
          "Unlimited scheduled posts",
          "Advanced analytics",
          "2 team members"
        ]),
        maxAccounts: 10,
        maxScheduledPosts: null,
        hasAdvancedAnalytics: true,
        hasTeamMembers: true,
        maxTeamMembers: 2,
        hasSocialListening: false
      };
      
      const agencyPlan: InsertSubscriptionPlan = {
        name: "Agency",
        description: "For marketing teams and agencies",
        price: 2900, // $29 in cents
        interval: "monthly",
        features: JSON.stringify([
          "Connect 25 social accounts",
          "Unlimited scheduled posts",
          "Advanced analytics",
          "Unlimited team members",
          "Social listening"
        ]),
        maxAccounts: 25,
        maxScheduledPosts: null,
        hasAdvancedAnalytics: true,
        hasTeamMembers: true,
        maxTeamMembers: null,
        hasSocialListening: true
      };
      
      await this.createSubscriptionPlan(starterPlan);
      await this.createSubscriptionPlan(businessPlan);
      await this.createSubscriptionPlan(agencyPlan);
      
      console.log("Subscription plans initialized successfully");
    }
  }

  // User operations
  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user;
  }
  
  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.email, email));
    return user;
  }
  
  async getUserByGoogleId(googleId: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.googleId, googleId));
    return user;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    // Set username to email if not provided
    if (!insertUser.username && insertUser.email) {
      insertUser.username = insertUser.email;
    }
    
    const [user] = await db.insert(users)
      .values({ ...insertUser, currentPlan: 'free' })
      .returning();
    return user;
  }
  
  async createGoogleUser(data: { email: string, fullName?: string, photoURL?: string, googleId: string }): Promise<User> {
    // Check if user with this Google ID already exists
    if (data.googleId) {
      const existingUser = await this.getUserByGoogleId(data.googleId);
      if (existingUser) {
        return existingUser;
      }
    }
    
    // Check if user with this email already exists
    const existingEmailUser = await this.getUserByEmail(data.email);
    if (existingEmailUser) {
      // If user exists but doesn't have googleId, update them
      if (!existingEmailUser.googleId && data.googleId) {
        const updatedUser = await this.updateUser(existingEmailUser.id, { 
          googleId: data.googleId,
          photoURL: data.photoURL || existingEmailUser.photoURL
        });
        return updatedUser || existingEmailUser;
      }
      return existingEmailUser;
    }
    
    // Create new user - explicitly providing null for password to avoid database constraints 
    const [user] = await db.insert(users)
      .values({
        email: data.email,
        username: data.email,
        fullName: data.fullName,
        photoURL: data.photoURL,
        googleId: data.googleId,
        password: null, // Explicitly set password to null for OAuth users
        currentPlan: 'free'
      })
      .returning();
    
    return user;
  }
  
  async updateUser(id: number, userData: Partial<User>): Promise<User | undefined> {
    const [updatedUser] = await db.update(users)
      .set(userData)
      .where(eq(users.id, id))
      .returning();
    return updatedUser;
  }
  
  async updateStripeCustomerId(userId: number, stripeCustomerId: string): Promise<User | undefined> {
    return this.updateUser(userId, { stripeCustomerId });
  }
  
  async updateUserStripeInfo(userId: number, stripeInfo: { stripeCustomerId: string, stripeSubscriptionId: string }): Promise<User | undefined> {
    return this.updateUser(userId, stripeInfo);
  }
  
  async updateUserPreferences(id: number, preferences: { language?: string, theme?: string }): Promise<User | undefined> {
    return this.updateUser(id, preferences);
  }
  
  async updateUserPassword(userId: number, hashedPassword: string): Promise<User | undefined> {
    return this.updateUser(userId, { password: hashedPassword });
  }
  
  // Password reset operations
  async createPasswordResetToken(token: InsertPasswordResetToken): Promise<PasswordResetToken> {
    const [result] = await db.insert(passwordResetTokens).values(token).returning();
    return result;
  }
  
  async getPasswordResetToken(token: string): Promise<PasswordResetToken | undefined> {
    const [resetToken] = await db.select().from(passwordResetTokens).where(eq(passwordResetTokens.token, token));
    return resetToken;
  }
  
  async deletePasswordResetToken(token: string): Promise<boolean> {
    const [result] = await db.delete(passwordResetTokens)
      .where(eq(passwordResetTokens.token, token))
      .returning();
    return !!result;
  }

  // Social account operations
  async getSocialAccounts(userId: number): Promise<SocialAccount[]> {
    return db.select().from(socialAccounts).where(eq(socialAccounts.userId, userId));
  }
  
  async getSocialAccountByPlatform(userId: number, platform: string): Promise<SocialAccount | undefined> {
    const [account] = await db.select().from(socialAccounts)
      .where(and(
        eq(socialAccounts.userId, userId),
        eq(socialAccounts.platform, platform)
      ));
    return account;
  }
  
  async createSocialAccount(account: InsertSocialAccount): Promise<SocialAccount> {
    const [result] = await db.insert(socialAccounts).values(account).returning();
    return result;
  }
  
  async updateSocialAccount(id: number, accountData: Partial<SocialAccount>): Promise<SocialAccount | undefined> {
    const [updatedAccount] = await db.update(socialAccounts)
      .set(accountData)
      .where(eq(socialAccounts.id, id))
      .returning();
    return updatedAccount;
  }
  
  async deleteSocialAccount(id: number): Promise<boolean> {
    const [result] = await db.delete(socialAccounts)
      .where(eq(socialAccounts.id, id))
      .returning();
    return !!result;
  }

  // Post operations
  async getPosts(userId: number): Promise<Post[]> {
    return db.select().from(posts).where(eq(posts.userId, userId));
  }
  
  async getScheduledPosts(userId: number): Promise<Post[]> {
    const now = new Date();
    console.log(`Fetching scheduled posts for user ${userId}. Current time: ${now.toISOString()}`);
    
    try {
      // Get all scheduled posts that are in the future, ordered by scheduledAt
      const scheduledPosts = await db.select().from(posts)
        .where(
          and(
            eq(posts.userId, userId),
            eq(posts.status, 'scheduled'),
            isNotNull(posts.scheduledAt), // Make sure scheduledAt is not null
            gt(posts.scheduledAt, now)    // Make sure scheduledAt is in the future
          )
        )
        .orderBy(posts.scheduledAt);
      
      console.log(`Found ${scheduledPosts.length} scheduled posts for user ${userId}`);
      
      // Log each post's scheduled date for debugging
      scheduledPosts.forEach(post => {
        console.log(`Post ${post.id} scheduled for: ${post.scheduledAt}`);
      });
      
      return scheduledPosts;
    } catch (error) {
      console.error("Error fetching scheduled posts:", error);
      throw error;
    }
  }
  
  async getPost(id: number): Promise<Post | undefined> {
    const [post] = await db.select().from(posts).where(eq(posts.id, id));
    return post;
  }
  
  async createPost(post: InsertPost): Promise<Post> {
    try {
      console.log("Creating post with data:", post);
      
      // Prepare post data
      const postData = {
        ...post,
        analytics: null,
        // Set publishedAt to current time for published posts, null for scheduled
        publishedAt: post.status === 'published' ? new Date() : null
      };
      
      // Log the sanitized input for debugging
      console.log("Sanitized post data for database:", {
        ...postData,
        content: postData.content?.substring(0, 30) + (postData.content?.length > 30 ? '...' : ''),
      });
      
      // Insert the post
      const [newPost] = await db.insert(posts)
        .values(postData)
        .returning();
        
      console.log(`Post created successfully with ID ${newPost.id}, status: ${newPost.status}`);
      
      return newPost;
    } catch (error) {
      console.error("Error creating post in database:", error);
      throw error;
    }
  }
  
  async updatePost(id: number, postData: Partial<Post>): Promise<Post | undefined> {
    const [updatedPost] = await db.update(posts)
      .set(postData)
      .where(eq(posts.id, id))
      .returning();
    return updatedPost;
  }
  
  async deletePost(id: number): Promise<boolean> {
    const [result] = await db.delete(posts)
      .where(eq(posts.id, id))
      .returning();
    return !!result;
  }

  // Subscription plan operations
  async getSubscriptionPlans(): Promise<SubscriptionPlan[]> {
    return db.select().from(subscriptionPlans);
  }
  
  async getSubscriptionPlan(id: number): Promise<SubscriptionPlan | undefined> {
    const [plan] = await db.select().from(subscriptionPlans).where(eq(subscriptionPlans.id, id));
    return plan;
  }
  
  async createSubscriptionPlan(plan: InsertSubscriptionPlan): Promise<SubscriptionPlan> {
    const [subscriptionPlan] = await db.insert(subscriptionPlans)
      .values(plan)
      .returning();
    return subscriptionPlan;
  }

  // User stats operations
  async getUserStats(userId: number): Promise<UserStats[]> {
    return db.select().from(userStats).where(eq(userStats.userId, userId));
  }
  
  async getUserStatsByPlatform(userId: number, platform: string): Promise<UserStats[]> {
    return db.select().from(userStats).where(
      and(
        eq(userStats.userId, userId),
        eq(userStats.platform, platform)
      )
    );
  }
  
  async createUserStats(stats: InsertUserStats): Promise<UserStats> {
    const [result] = await db.insert(userStats).values(stats).returning();
    return result;
  }

  // Team operations
  async getTeamMembers(ownerId: number): Promise<TeamMember[]> {
    return db.select().from(teamMembers).where(eq(teamMembers.ownerId, ownerId));
  }
  
  async getTeamMember(id: number): Promise<TeamMember | undefined> {
    const [member] = await db.select().from(teamMembers).where(eq(teamMembers.id, id));
    return member;
  }
  
  async getTeamMemberByEmail(ownerId: number, email: string): Promise<TeamMember | undefined> {
    const [member] = await db.select().from(teamMembers).where(
      and(
        eq(teamMembers.ownerId, ownerId),
        eq(teamMembers.inviteEmail, email)
      )
    );
    return member;
  }
  
  async getTeamMemberByToken(token: string): Promise<TeamMember | undefined> {
    const [member] = await db.select().from(teamMembers).where(eq(teamMembers.inviteToken, token));
    return member;
  }
  
  async createTeamMember(teamMember: InsertTeamMember): Promise<TeamMember> {
    const [result] = await db.insert(teamMembers).values(teamMember).returning();
    return result;
  }
  
  async updateTeamMember(id: number, teamMemberData: Partial<TeamMember>): Promise<TeamMember | undefined> {
    const [updatedMember] = await db.update(teamMembers)
      .set(teamMemberData)
      .where(eq(teamMembers.id, id))
      .returning();
    return updatedMember;
  }
  
  async deleteTeamMember(id: number): Promise<boolean> {
    const [result] = await db.delete(teamMembers)
      .where(eq(teamMembers.id, id))
      .returning();
    return !!result;
  }
  
  async getTeamMemberships(memberId: number): Promise<TeamMember[]> {
    return db.select().from(teamMembers).where(eq(teamMembers.memberId, memberId));
  }
}

export const storage = new DatabaseStorage();
