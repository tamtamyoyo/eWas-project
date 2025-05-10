import type { Express, Request, Response, NextFunction } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertUserSchema, insertSocialAccountSchema, insertPostSchema, insertTeamMemberSchema, insertPasswordResetTokenSchema } from "@shared/schema";
import session from "express-session";
import passport from "passport";
import { Strategy as LocalStrategy } from "passport-local";
import MemoryStore from "memorystore";
import bcrypt from "bcryptjs";
import Stripe from "stripe";
import multer from "multer";
import path from "path";
import fs from "fs";
import crypto from "crypto";
import { TwitterService } from "./services/twitter";
import { FacebookService } from "./services/facebook";
import { getHost } from "./services/facebook";
import { InstagramService } from "./services/instagram";
import { GoogleService } from "./services/google";
import { LinkedInService } from "./services/linkedin";
import { SnapchatService } from "./services/snapchat";
import { TikTokService } from "./services/tiktok";
import { YouTubeService } from "./services/youtube";
import { ContentAnalyzer } from "./services/contentAnalyzer";
import { sendSupportMessage, type SupportMessage } from "./services/supportService";
import { EngagementPredictor } from "./services/engagementPredictor";

// Extend session interface to add custom properties
declare module 'express-session' {
  interface SessionData {
    twitterAuth?: {
      oauth_token_secret?: string;
    };
  }
}

// Initialize session store
const SessionStore = MemoryStore(session);

// Initialize Stripe (will use dummy keys if not provided)
const stripeSecretKey = process.env.STRIPE_SECRET_KEY || "sk_test_dummy";
const stripe = new Stripe(stripeSecretKey, {
  apiVersion: "2025-03-31.basil",
});

// Get the environment
const isProduction = process.env.NODE_ENV === 'production';
const cookieDomain = isProduction ? '.ewasl.com' : undefined;

export async function registerRoutes(app: Express): Promise<Server> {
  // Significantly enhanced session setup for better reliability
  app.use(
    session({
      cookie: { 
        maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days for better persistence
        secure: isProduction, // Only use secure in production
        sameSite: isProduction ? 'none' : 'lax', // Better cross-origin handling
        httpOnly: true,
        path: '/',
        domain: cookieDomain
      }, 
      store: new SessionStore({
        checkPeriod: 24 * 60 * 60 * 1000, // prune expired entries every 24h
      }),
      resave: false, // Changed to false to prevent race conditions
      saveUninitialized: false, // Changed to false for better compliance with privacy laws
      secret: process.env.SESSION_SECRET || "ewasl-secure-session-secret-key-with-additional-entropy-for-better-security",
      name: 'ewasl.sid', // Custom name to avoid fingerprinting
      rolling: true, // Reset expiration with each response
      unset: 'destroy' // Automatically remove destroyed sessions
    })
  );
  
  // Log session middleware setup
  console.log("Session middleware configured with:", {
    cookieMaxAge: "30 days",
    secure: isProduction,
    sameSite: isProduction ? "none" : "lax",
    domain: cookieDomain || "default"
  });

  // Passport initialization
  app.use(passport.initialize());
  app.use(passport.session());

  // Passport local strategy
  passport.use(
    new LocalStrategy(
      { usernameField: "email" },
      async (email, password, done) => {
        try {
          const user = await storage.getUserByEmail(email);
          if (!user) {
            return done(null, false, { message: "Incorrect email or password" });
          }

          // Check if password is available (might be null for OAuth users)
          if (!user.password) {
            return done(null, false, { message: "Incorrect email or password" });
          }
          
          const isMatch = await bcrypt.compare(password, user.password);
          if (!isMatch) {
            return done(null, false, { message: "Incorrect email or password" });
          }

          return done(null, user);
        } catch (error) {
          return done(error);
        }
      }
    )
  );

  passport.serializeUser((user: any, done) => {
    done(null, user.id);
  });

  passport.deserializeUser(async (id: number, done) => {
    try {
      const user = await storage.getUser(id);
      done(null, user);
    } catch (error) {
      done(error);
    }
  });

  // Enhanced Authentication middleware with detailed logging and session handling
  const isAuthenticated = (req: Request, res: Response, next: any) => {
    // First, handle CORS headers consistently
    const origin = req.headers.origin || '*';
    res.setHeader('Access-Control-Allow-Credentials', 'true');
    res.setHeader('Access-Control-Allow-Origin', origin);
    res.setHeader('Access-Control-Allow-Methods', 'GET,HEAD,PUT,PATCH,POST,DELETE');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Accept, X-Requested-With, Authorization');
    
    // For preflight OPTIONS requests
    if (req.method === 'OPTIONS') {
      return res.status(200).end();
    }
    
    // Debugging log
    const timestamp = new Date().toISOString();
    console.log(`[${timestamp}] Auth check, isAuthenticated:`, req.isAuthenticated());
    console.log(`[${timestamp}] Session ID:`, req.sessionID || "No session ID");
    
    // Fast path - if already authenticated by passport
    if (req.isAuthenticated() && req.user) {
      return next();
    }
    
    // Recovery path - if session exists but passport authentication is missing
    if (req.session && req.session.passport && req.session.passport.user) {
      console.log(`[${timestamp}] Session has user ID but isAuthenticated() returned false. Attempting recovery...`);
      
      // Try to recover the session
      storage.getUser(req.session.passport.user)
        .then(user => {
          if (user) {
            console.log(`[${timestamp}] User found in database. Manually setting req.user`);
            (req as any).user = user;
            return next();
          } else {
            console.log(`[${timestamp}] User not found in database.`);
            return res.status(401).json({ message: "Unauthorized" });
          }
        })
        .catch(err => {
          console.error(`[${timestamp}] Error recovering session:`, err);
          return res.status(401).json({ message: "Unauthorized" });
        });
    } else {
      console.log(`[${timestamp}] No session or passport data found`);
      return res.status(401).json({ message: "Unauthorized" });
    }
  };

  // Authentication routes
  app.post("/api/auth/register", async (req, res) => {
    try {
      const validatedData = insertUserSchema.parse(req.body);
      
      // Check if user already exists
      const existingUser = await storage.getUserByEmail(validatedData.email);
      if (existingUser) {
        return res.status(400).json({ message: "Email already in use" });
      }

      // Hash password if provided
      let hashedPassword = null;
      if (validatedData.password && typeof validatedData.password === 'string') {
        const salt = await bcrypt.genSalt(10);
        hashedPassword = await bcrypt.hash(validatedData.password, salt);
      }

      // Create user with hashed password if available
      const user = await storage.createUser({
        ...validatedData,
        password: hashedPassword,
      });

      // Remove password from response
      const { password, ...userWithoutPassword } = user;
      
      res.status(201).json(userWithoutPassword);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  app.post("/api/auth/login", (req, res, next) => {
    console.log("Login attempt with email:", req.body.email);
    console.log("Session ID before auth:", req.sessionID);
    
    passport.authenticate("local", (err: any, user: any, info: any) => {
      if (err) {
        console.error("Login error:", err);
        return next(err);
      }
      
      if (!user) {
        console.log("Authentication failed:", info.message);
        return res.status(401).json({ message: info.message });
      }
      
      console.log("User authenticated successfully:", user.id);
      
      req.logIn(user, (err) => {
        if (err) {
          console.error("Login session error:", err);
          return next(err);
        }
        
        console.log("Session established. Is authenticated:", req.isAuthenticated());
        console.log("Session ID after login:", req.sessionID);
        
        // Ensure session data is saved before responding
        req.session.save((err) => {
          if (err) {
            console.error("Error saving session on login:", err);
            return next(err);
          }
          
          console.log("Session successfully saved with user ID:", req.session.passport?.user);
          
          // Add CORS headers
          res.setHeader('Access-Control-Allow-Credentials', 'true');
          res.setHeader('Access-Control-Allow-Origin', req.headers.origin || '*');
          
          // Remove sensitive data from response
          const { password, ...userWithoutPassword } = user;
          
          // Return success response
          return res.json({
            ...userWithoutPassword,
            sessionId: req.sessionID, // Include session ID for debugging
            authSuccess: true
          });
        });
      });
    })(req, res, next);
  });

  app.post("/api/auth/logout", (req, res) => {
    const timestamp = new Date().toISOString();
    console.log(`[${timestamp}] Logout requested for user:`, req.user ? (req.user as any).id : 'Not logged in');
    
    if (req.session) {
      console.log(`[${timestamp}] Session exists (${req.sessionID}). Destroying session...`);
      
      // Add a callback to handle session destruction completion
      req.session.destroy((err) => {
        if (err) {
          console.error(`[${timestamp}] Error destroying session:`, err);
          return res.status(500).json({ message: "Failed to logout" });
        }
        
        // Clear the session cookie from the client
        res.clearCookie('ewasl.sid', {
          path: '/',
          domain: process.env.NODE_ENV === 'production' ? '.ewasl.com' : undefined,
          httpOnly: true,
          secure: process.env.NODE_ENV === 'production',
          sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax'
        });
        
        console.log(`[${timestamp}] Session destroyed successfully`);
        res.status(200).json({ message: "Logged out successfully" });
      });
    } else {
      console.log(`[${timestamp}] No session to destroy. User already logged out.`);
      res.status(200).json({ message: "Already logged out" });
    }
  });
  
  // Google OAuth routes
  app.get("/api/google/auth", async (req, res) => {
    try {
      const authUrl = await GoogleService.generateAuthLink();
      res.json({ authUrl });
    } catch (error: any) {
      console.error("Error generating Google auth URL:", error);
      res.status(500).json({ 
        message: "Failed to generate Google authorization URL",
        errorType: error.message === 'Google OAuth credentials are not configured' ? 'CREDENTIALS_MISSING' : 'GENERAL_ERROR'
      });
    }
  });
  
  // Google OAuth callback handler
  app.get(["/oauth2callback", "/auth/google/callback"], async (req, res) => {
    try {
      const { code, error, state } = req.query;
      
      console.log('Google OAuth Callback received:', {
        code: code ? 'EXISTS' : 'MISSING',
        error: error || 'NONE',
        state: state || 'NONE'
      });
      
      if (error) {
        console.error('Google OAuth error:', error);
        return res.redirect(`/login?error=google_oauth_error&message=${encodeURIComponent(String(error))}`);
      }
      
      if (!code) {
        console.error('Google callback missing code parameter');
        return res.redirect('/login?error=google_missing_code');
      }
      
      // For unauthenticated callbacks, we need to create an account or log the user in
      // We'll redirect back to a page that will use the code to complete the auth
      console.log('Google OAuth successful, redirecting with code');
      
      // Create an encoded and timestamped token for temporary storage
      const tempToken = Buffer.from(JSON.stringify({
        code: String(code),
        timestamp: Date.now()
      })).toString('base64');
      
      // Redirect to a page that will complete the auth
      return res.redirect(`/login?action=google_auth&token=${encodeURIComponent(tempToken)}`);
    } catch (error: any) {
      console.error('Google OAuth callback error:', error);
      return res.redirect(`/login?error=google_callback_error&message=${encodeURIComponent(error.message || 'Unknown error')}`);
    }
  });
  
  app.post("/api/google/callback", async (req, res) => {
    try {
      const { code } = req.body;
      
      if (!code) {
        return res.status(400).json({ message: "Authorization code is required" });
      }
      
      // Exchange the code for user information
      const userInfo = await GoogleService.handleCallback(code);
      
      // Create or get user from database
      const user = await storage.createGoogleUser({
        email: userInfo.email,
        fullName: userInfo.fullName,
        photoURL: userInfo.photoURL,
        googleId: userInfo.googleId
      });
      
      // Log in the user
      req.login(user, (err) => {
        if (err) {
          return res.status(500).json({ message: "Login failed after OAuth" });
        }
        
        // Remove password from response
        const { password, ...userWithoutPassword } = user;
        return res.status(200).json(userWithoutPassword);
      });
    } catch (error: any) {
      console.error("Google OAuth callback error:", error);
      res.status(500).json({ message: error.message });
    }
  });
  
  // Google OAuth callback handler (for supabase redirect)
  app.post("/api/auth/google-callback", async (req, res) => {
    try {
      const { email, fullName, photoURL, googleId } = req.body;
      
      if (!email || !googleId) {
        return res.status(400).json({ message: "Email and Google ID are required" });
      }
      
      // Create or get user from database
      const user = await storage.createGoogleUser({
        email,
        fullName,
        photoURL,
        googleId
      });
      
      // Log in the user
      req.login(user, (err) => {
        if (err) {
          return res.status(500).json({ message: "Login failed after OAuth" });
        }
        
        // Remove password from response
        const { password, ...userWithoutPassword } = user;
        return res.status(200).json(userWithoutPassword);
      });
    } catch (error: any) {
      console.error("Google OAuth callback error:", error);
      res.status(500).json({ message: error.message });
    }
  });

  app.get("/api/auth/user", (req, res) => {
    console.log("Auth user request, isAuthenticated:", req.isAuthenticated());
    console.log("Session ID:", req.sessionID || "No session ID");
    
    // Debug session details
    if (req.session) {
      console.log("Session exists, passport data:", req.session.passport ? "Yes" : "No");
      if (req.session.passport) {
        console.log("Passport user ID:", req.session.passport.user);
      }
    } else {
      console.log("No session object available");
    }
    
    // Add CORS headers
    res.setHeader('Access-Control-Allow-Credentials', 'true');
    res.setHeader('Access-Control-Allow-Origin', req.headers.origin || '*');
    
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Unauthorized" });
    }
    
    console.log("User authenticated:", req.user);
    const { password, ...userWithoutPassword } = req.user as any;
    
    return res.json({
      ...userWithoutPassword,
      sessionId: req.sessionID, // Include session ID for debugging
    });
  });
  
  // Password reset endpoints
  app.post("/api/auth/forgot-password", async (req, res) => {
    try {
      const { email } = req.body;
      
      // Find user
      const user = await storage.getUserByEmail(email);
      if (!user) {
        // For security reasons, don't reveal that the email doesn't exist
        return res.json({ message: "If this email exists, a password reset link will be sent" });
      }
      
      // Generate reset token
      const resetToken = crypto.randomBytes(32).toString('hex');
      const tokenHash = crypto.createHash('sha256').update(resetToken).digest('hex');
      
      // Set expiration (48 hours from now)
      const expiresAt = new Date();
      expiresAt.setHours(expiresAt.getHours() + 48);
      
      // Save token to database
      await storage.createPasswordResetToken({
        userId: user.id,
        token: tokenHash,
        expiresAt
      });
      
      // Create reset URL
      // In a production environment, this should point to the frontend route
      const resetUrl = `${process.env.SITE_URL || 'http://localhost:5000'}/reset-password/${resetToken}`;
      
      // Send email
      try {
        const { emailService } = await import('./services/emailService');
        await emailService.sendPasswordResetEmail({
          email: user.email,
          resetToken,
          resetUrl,
          expiresInHours: 48
        });
      } catch (emailError) {
        console.error("Error sending password reset email:", emailError);
        return res.status(500).json({ message: "Error sending password reset email" });
      }
      
      res.json({ message: "Password reset email sent" });
    } catch (error: any) {
      console.error("Forgot password error:", error);
      res.status(500).json({ message: error.message });
    }
  });
  
  app.post("/api/auth/reset-password", async (req, res) => {
    try {
      const { token, password } = req.body;
      
      // Hash token
      const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
      
      // Find token in database
      const resetToken = await storage.getPasswordResetToken(tokenHash);
      if (!resetToken) {
        return res.status(400).json({ message: "Invalid or expired token" });
      }
      
      // Check if token is expired
      if (new Date() > new Date(resetToken.expiresAt)) {
        return res.status(400).json({ message: "Token has expired" });
      }
      
      // Hash password
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(password, salt);
      
      // Update user password
      await storage.updateUserPassword(resetToken.userId, hashedPassword);
      
      // Delete token
      await storage.deletePasswordResetToken(tokenHash);
      
      res.json({ message: "Password has been reset successfully" });
    } catch (error: any) {
      console.error("Reset password error:", error);
      res.status(500).json({ message: error.message });
    }
  });

  // User routes
  app.put("/api/users/:id", isAuthenticated, async (req, res) => {
    try {
      const userId = parseInt(req.params.id);
      const user = req.user as any;
      
      // Ensure user can only update their own account
      if (user.id !== userId) {
        return res.status(403).json({ message: "Forbidden" });
      }
      
      const updatedUser = await storage.updateUser(userId, req.body);
      if (!updatedUser) {
        return res.status(404).json({ message: "User not found" });
      }
      
      const { password, ...userWithoutPassword } = updatedUser;
      res.json(userWithoutPassword);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });
  
  app.put("/api/users/:id/preferences", isAuthenticated, async (req, res) => {
    try {
      const userId = parseInt(req.params.id);
      const user = req.user as any;
      
      // Ensure user can only update their own preferences
      if (user.id !== userId) {
        return res.status(403).json({ message: "Forbidden" });
      }
      
      const { language, theme } = req.body;
      const updatedUser = await storage.updateUserPreferences(userId, { language, theme });
      if (!updatedUser) {
        return res.status(404).json({ message: "User not found" });
      }
      
      const { password, ...userWithoutPassword } = updatedUser;
      res.json(userWithoutPassword);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  // Social account routes
  app.get("/api/social-accounts", isAuthenticated, async (req, res) => {
    try {
      const user = req.user as any;
      const accounts = await storage.getSocialAccounts(user.id);
      res.json(accounts);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.post("/api/social-accounts", isAuthenticated, async (req, res) => {
    try {
      const user = req.user as any;
      const validatedData = insertSocialAccountSchema.parse({
        ...req.body,
        userId: user.id
      });
      
      const account = await storage.createSocialAccount(validatedData);
      res.status(201).json(account);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  app.delete("/api/social-accounts/:id", isAuthenticated, async (req, res) => {
    try {
      const accountId = parseInt(req.params.id);
      const success = await storage.deleteSocialAccount(accountId);
      
      if (!success) {
        return res.status(404).json({ message: "Social account not found" });
      }
      
      res.json({ message: "Social account deleted successfully" });
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // Post routes
  app.get("/api/posts", isAuthenticated, async (req, res) => {
    try {
      const user = req.user as any;
      const posts = await storage.getPosts(user.id);
      res.json(posts);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.get("/api/posts/scheduled", isAuthenticated, async (req, res) => {
    try {
      const user = req.user as any;
      const scheduledPosts = await storage.getScheduledPosts(user.id);
      res.json(scheduledPosts);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });
  
  // New endpoint to get real metrics from connected social accounts
  app.get("/api/user-metrics", isAuthenticated, async (req, res) => {
    try {
      const user = req.user as any;
      const socialAccounts = await storage.getSocialAccounts(user.id);
      const allPosts = await storage.getPosts(user.id);
      const publishedPosts = allPosts.filter(post => post.status === 'published');
      const scheduledPosts = allPosts.filter(post => post.status === 'scheduled');
      
      // Get platform-specific stats when available
      const platformStats = await Promise.all(
        socialAccounts.map(async (account) => {
          let stats = null;
          try {
            switch (account.platform.toLowerCase()) {
              case 'facebook':
                stats = await FacebookService.getAccountStats(user.id);
                break;
              case 'instagram':
                stats = await InstagramService.getAccountStats(user.id);
                break;
              case 'twitter':
                stats = await TwitterService.getAccountStats(user.id);
                break;
              case 'linkedin':
                stats = await LinkedInService.getAccountStats(user.id);
                break;
              case 'snapchat':
                stats = await SnapchatService.getAccountStats(user.id);
                break;
            }
          } catch (error) {
            console.error(`Error fetching stats for ${account.platform}:`, error);
            // Return basic account info without stats
            return {
              platform: account.platform,
              accountName: account.accountName,
              username: account.username,
              profileUrl: account.profileUrl,
              status: 'connected'
            };
          }
          
          return {
            platform: account.platform,
            accountName: account.accountName,
            username: account.username,
            profileUrl: account.profileUrl,
            stats,
            status: 'connected'
          };
        })
      );
      
      // Aggregate metrics
      const metrics = {
        accounts: {
          total: socialAccounts.length,
          platforms: socialAccounts.map(acc => acc.platform.toLowerCase()),
          details: platformStats
        },
        posts: {
          total: allPosts.length,
          published: publishedPosts.length,
          scheduled: scheduledPosts.length,
          byPlatform: socialAccounts.reduce((acc, account) => {
            const platform = account.platform.toLowerCase();
            acc[platform] = allPosts.filter(post => 
              post.platforms.includes(platform)
            ).length;
            return acc;
          }, {} as Record<string, number>)
        },
        // Include platform specific metrics when available
        platformMetrics: platformStats.filter(stat => stat.stats).map(stat => stat.stats)
      };
      
      res.json(metrics);
    } catch (error: any) {
      console.error("Error fetching user metrics:", error);
      res.status(500).json({ 
        message: "Failed to fetch user metrics", 
        error: error.message 
      });
    }
  });

  app.post("/api/posts", isAuthenticated, async (req, res) => {
    try {
      const user = req.user as any;
      
      // Get the post data from the request
      const { content, mediaUrls, platforms, status, scheduledAt } = req.body;
      
      // Validate required fields
      if (!content && (!mediaUrls || mediaUrls.length === 0)) {
        return res.status(400).json({ message: "محتوى المنشور مطلوب. يرجى إدخال نص أو إضافة صورة" });
      }
      
      if (!platforms || platforms.length === 0) {
        return res.status(400).json({ message: "يرجى اختيار منصة واحدة على الأقل" });
      }
      
      // Validate the scheduled date if status is 'scheduled'
      if (status === 'scheduled') {
        if (!scheduledAt) {
          return res.status(400).json({ 
            message: "تاريخ الجدولة مطلوب للمنشورات المجدولة",
            code: "invalid_type"
          });
        }
        
        const scheduledDate = new Date(scheduledAt);
        if (isNaN(scheduledDate.getTime())) {
          return res.status(400).json({ 
            message: "صيغة التاريخ غير صحيحة",
            code: "invalid_type",
            expected: "date",
            received: "string",
            path: ["scheduledAt"]
          });
        }
        
        const now = new Date();
        console.log(`Validating scheduled date: ${scheduledDate.toISOString()} vs now: ${now.toISOString()}`);
        
        if (scheduledDate <= now) {
          return res.status(400).json({ 
            message: "يجب أن يكون تاريخ الجدولة في المستقبل",
            code: "invalid_date"
          });
        }
      }
      
      // Prepare the data for the database
      const postData = {
        userId: user.id,
        content,
        platforms,
        mediaUrls: mediaUrls || [],
        status: status || 'published',
        scheduledAt: status === 'scheduled' ? new Date(scheduledAt) : null,
        createdAt: new Date(),
        updatedAt: new Date()
      };
      
      console.log("Schedule time being saved:", status === 'scheduled' ? new Date(scheduledAt).toISOString() : 'Not scheduled');
      
      console.log("Creating post with data:", postData);
      
      // Validate the data against the schema
      const validatedData = insertPostSchema.parse(postData);
      
      // Create the post
      const post = await storage.createPost(validatedData);
      
      // Return the created post
      res.status(201).json(post);
      
      // TODO: If post is not scheduled, send to social media platforms
      if (status !== 'scheduled') {
        // In a real implementation, this would publish to social media
        console.log("Post would be published immediately to:", platforms);
      }
    } catch (error: any) {
      console.error("Error creating post:", error);
      res.status(400).json({ message: "فشل في إنشاء المنشور: " + error.message });
    }
  });

  app.put("/api/posts/:id", isAuthenticated, async (req, res) => {
    try {
      const postId = parseInt(req.params.id);
      const user = req.user as any;
      
      // First, check if the post exists and belongs to the current user
      const existingPost = await storage.getPost(postId);
      
      if (!existingPost) {
        return res.status(404).json({ message: "المنشور غير موجود" });
      }
      
      if (existingPost.userId !== user.id) {
        return res.status(403).json({ message: "ليس لديك صلاحية تحديث هذا المنشور" });
      }
      
      // Get the post data from the request
      const { content, mediaUrls, platforms, status, scheduledAt } = req.body;
      
      // Validate required fields
      if (!content && (!mediaUrls || mediaUrls.length === 0)) {
        return res.status(400).json({ message: "محتوى المنشور مطلوب. يرجى إدخال نص أو إضافة صورة" });
      }
      
      if (!platforms || platforms.length === 0) {
        return res.status(400).json({ message: "يرجى اختيار منصة واحدة على الأقل" });
      }
      
      // Prepare the update data
      let updatedData: any = {
        content,
        platforms,
      };
      
      // Handle media URLs if provided
      if (mediaUrls) {
        updatedData.mediaUrls = mediaUrls;
      }
      
      // Handle scheduling
      if (status === 'scheduled') {
        if (!scheduledAt) {
          return res.status(400).json({ 
            message: "تاريخ الجدولة مطلوب للمنشورات المجدولة",
            code: "invalid_type"
          });
        }
        
        const scheduledDate = new Date(scheduledAt);
        if (isNaN(scheduledDate.getTime())) {
          return res.status(400).json({ 
            message: "صيغة التاريخ غير صحيحة",
            code: "invalid_type",
            expected: "date",
            received: "string",
            path: ["scheduledAt"]
          });
        }
        
        const now = new Date();
        console.log(`Validating scheduled date: ${scheduledDate.toISOString()} vs now: ${now.toISOString()}`);
        
        if (scheduledDate <= now) {
          return res.status(400).json({ 
            message: "يجب أن يكون تاريخ الجدولة في المستقبل",
            code: "invalid_date"
          });
        }
        
        updatedData.status = 'scheduled';
        updatedData.scheduledAt = scheduledDate;
        console.log("Setting scheduled date to:", scheduledDate.toISOString());
      } else {
        updatedData.status = status || 'draft';
        // Only set scheduledAt to null if status is not scheduled
        if (status !== 'scheduled') {
          updatedData.scheduledAt = null;
        }
      }
      
      // Update the updatedAt timestamp
      updatedData.updatedAt = new Date();
      
      console.log("Updating post with data:", updatedData);
      
      // Update the post
      const updatedPost = await storage.updatePost(postId, updatedData);
      
      // Return the updated post
      res.json(updatedPost);
    } catch (error: any) {
      console.error("Error updating post:", error);
      res.status(400).json({ message: "فشل في تحديث المنشور: " + error.message });
    }
  });

  app.delete("/api/posts/:id", isAuthenticated, async (req, res) => {
    try {
      const postId = parseInt(req.params.id);
      const success = await storage.deletePost(postId);
      
      if (!success) {
        return res.status(404).json({ message: "Post not found" });
      }
      
      res.json({ message: "Post deleted successfully" });
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });
  
  // Configure multer storage
  const storage_config = multer.diskStorage({
    destination: (req, file, cb) => {
      // Make sure uploads directory exists
      const uploadsDir = path.resolve(process.cwd(), 'public/uploads');
      if (!fs.existsSync(uploadsDir)) {
        fs.mkdirSync(uploadsDir, { recursive: true });
      }
      console.log(`Saving uploads to: ${uploadsDir}`);
      cb(null, uploadsDir);
    },
    filename: (req, file, cb) => {
      // Generate unique filename with timestamp and original extension
      const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
      const ext = path.extname(file.originalname);
      // Sanitize filename
      const sanitizedName = uniqueSuffix + ext.toLowerCase();
      cb(null, sanitizedName);
    }
  });
  
  // Create multer upload instance with file filtering
  const upload = multer({ 
    storage: storage_config,
    limits: {
      fileSize: 10 * 1024 * 1024, // 10MB limit
    },
    fileFilter: (req, file, cb) => {
      // Accept only image and video file types
      const filetypes = /jpeg|jpg|png|gif|mp4|webp/;
      const mimetype = filetypes.test(file.mimetype);
      const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
      
      if (mimetype && extname) {
        return cb(null, true);
      }
      cb(new Error("Only image and video files are allowed (jpg, png, gif, mp4, webp)"));
    }
  });
  
  // Media upload endpoint
  app.post("/api/upload-media", isAuthenticated, (req, res) => {
    // Use upload middleware with error handling
    upload.array('files', 10)(req, res, (err) => {
      if (err) {
        console.error("Media upload error:", err);
        // Better error handling
        if (err.code === 'LIMIT_FILE_SIZE') {
          return res.status(413).json({ message: "File too large. Maximum size is 10MB." });
        }
        return res.status(400).json({ message: err.message || "File upload error" });
      }
      
      try {
        const user = req.user as any;
        const files = req.files as Express.Multer.File[];
        
        if (!files || files.length === 0) {
          return res.status(400).json({ message: "No files uploaded" });
        }
        
        console.log(`Upload successful. Received ${files.length} files from user ${user.id}`);
        
        // Generate URLs for each uploaded file
        const fileUrls = files.map(file => {
          // Create a URL that can be accessed from the client
          const relativeUrl = `/uploads/${file.filename}`;
          console.log(`File saved: ${file.originalname} -> ${relativeUrl}`);
          return relativeUrl;
        });
        
        res.status(200).json({ fileUrls });
      } catch (error: any) {
        console.error("Media upload processing error:", error);
        res.status(500).json({ message: error.message });
      }
    });
  });

  // Subscription plan routes
  app.get("/api/subscription-plans", async (req, res) => {
    try {
      const plans = await storage.getSubscriptionPlans();
      res.json(plans);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // Stripe payment route for one-time payments
  app.post("/api/create-payment-intent", isAuthenticated, async (req, res) => {
    try {
      const { amount, planId, metadata } = req.body;
      const user = req.user as any;
      
      if (!amount) {
        return res.status(400).json({ message: "Amount is required" });
      }

      // Create a PaymentIntent with the order amount and currency
      const paymentIntent = await stripe.paymentIntents.create({
        amount: Math.round(amount), // Amount in cents
        currency: "usd",
        metadata: {
          planId: planId?.toString(),
          userId: user.id.toString(),
          ...metadata
        },
      });

      res.json({ clientSecret: paymentIntent.client_secret });
    } catch (error: any) {
      console.error("Error creating payment intent:", error);
      res.status(500).json({ message: "Error creating payment intent: " + error.message });
    }
  });

  // Endpoint for creating or getting a subscription with a custom price
  app.post("/api/get-or-create-subscription", isAuthenticated, async (req, res) => {
    const user = req.user as any;
    const { planId, priceAmount, interval, planName } = req.body;
    
    if (!planId || !priceAmount) {
      return res.status(400).json({ message: "Plan ID and price amount are required" });
    }
    
    try {
      // Check if user already has a subscription
      if (user.stripeSubscriptionId) {
        try {
          const subscription = await stripe.subscriptions.retrieve(user.stripeSubscriptionId, {
            expand: ['latest_invoice.payment_intent']
          });
          
          // If subscription is active, return it
          if (subscription.status === 'active') {
            return res.json({
              subscriptionId: subscription.id,
              clientSecret: null, // No need for client secret if already active
            });
          }
          
          // Otherwise, continue to create a new one
        } catch (err) {
          // If subscription doesn't exist anymore or is invalid, continue to create a new one
          console.log("Existing subscription not found, creating new one");
        }
      }
      
      // Create or get Stripe customer
      let customerId = user.stripeCustomerId;
      
      if (!customerId) {
        if (!user.email) {
          return res.status(400).json({ message: "User email is required" });
        }

        const customer = await stripe.customers.create({
          email: user.email,
          name: user.fullName || user.username,
        });
        
        customerId = customer.id;
        
        // Update user with Stripe customer ID
        await storage.updateStripeCustomerId(user.id, customerId);
      }
      
      // Create a product for this plan
      const product = await stripe.products.create({
        name: planName || `${interval === 'yearly' ? 'Yearly' : 'Monthly'} Plan`,
        description: `${interval === 'yearly' ? 'Yearly' : 'Monthly'} subscription plan`,
      });
      
      // Create a price for the subscription
      const price = await stripe.prices.create({
        product: product.id,
        unit_amount: priceAmount,
        currency: 'usd',
        recurring: {
          interval: interval === 'yearly' ? 'year' : 'month',
        },
      });
      
      // Create subscription with the price
      const subscription = await stripe.subscriptions.create({
        customer: customerId,
        items: [{ price: price.id }],
        payment_behavior: 'default_incomplete',
        expand: ['latest_invoice.payment_intent'],
        metadata: {
          userId: user.id.toString(),
          planName: planName ? planName.toLowerCase() : 'custom',
        }
      });
      
      // Update user with subscription ID
      await storage.updateUserStripeInfo(user.id, {
        stripeCustomerId: customerId,
        stripeSubscriptionId: subscription.id
      });
      
      // Return the client secret for payment
      const invoice = subscription.latest_invoice as any;
      const paymentIntent = invoice?.payment_intent;
      
      res.json({
        subscriptionId: subscription.id,
        clientSecret: paymentIntent?.client_secret || null,
      });
    } catch (error: any) {
      console.error("Error creating subscription:", error);
      res.status(500).json({ message: error.message });
    }
  });
  
  // Original subscription creation endpoint
  app.post("/api/create-subscription", isAuthenticated, async (req, res) => {
    const user = req.user as any;
    const { planId } = req.body;
    
    if (!planId) {
      return res.status(400).json({ message: "Plan ID is required" });
    }
    
    try {
      const plan = await storage.getSubscriptionPlan(parseInt(planId));
      
      if (!plan) {
        return res.status(404).json({ message: "Subscription plan not found" });
      }
      
      let customer;
      
      // Check if user already has a Stripe customer ID
      if (user.stripeCustomerId) {
        customer = { id: user.stripeCustomerId };
      } else {
        // Create a new customer
        customer = await stripe.customers.create({
          email: user.email,
          name: user.fullName || user.username,
        });
        
        // Update user with Stripe customer ID
        await storage.updateStripeCustomerId(user.id, customer.id);
      }
      
      // First, create a product
      const product = await stripe.products.create({
        name: plan.name,
        description: plan.description,
      });
      
      // Then create a price for that product
      const price = await stripe.prices.create({
        product: product.id,
        currency: 'usd',
        unit_amount: plan.price,
        recurring: {
          interval: plan.interval === 'yearly' ? 'year' : 'month',
        },
      });
      
      // Create subscription with price
      const subscription = await stripe.subscriptions.create({
        customer: customer.id,
        items: [{ price: price.id }],
        payment_behavior: 'default_incomplete',
        expand: ['latest_invoice.payment_intent'],
        metadata: {
          userId: user.id.toString(),
          planName: plan.name.toLowerCase(),
        }
      });
      
      // Update user with subscription ID and plan
      await storage.updateUser(user.id, {
        stripeSubscriptionId: subscription.id,
        currentPlan: plan.name.toLowerCase(),
      });
      
      res.json({
        subscriptionId: subscription.id,
        clientSecret: (subscription.latest_invoice as any)?.payment_intent?.client_secret,
      });
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // Stripe webhook handler
  app.post('/api/stripe-webhook', async (req, res) => {
    try {
      const sig = req.headers['stripe-signature'];
      const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET;
      
      if (!sig || !endpointSecret) {
        return res.status(400).json({ message: "Missing stripe signature or webhook secret" });
      }

      // Verify webhook signature
      let event;
      
      try {
        event = stripe.webhooks.constructEvent(req.body, sig, endpointSecret);
      } catch (err: any) {
        console.error(`Webhook Error: ${err.message}`);
        return res.status(400).json({ message: `Webhook Error: ${err.message}` });
      }
      
      // Handle the event
      switch (event.type) {
        case 'invoice.payment_succeeded':
          const invoice = event.data.object as any;
          if (invoice.subscription) {
            // Update user's subscription status
            const subscriptionId = typeof invoice.subscription === 'string' 
              ? invoice.subscription 
              : invoice.subscription.id;
              
            const subscription = await stripe.subscriptions.retrieve(subscriptionId);
            
            if (subscription && subscription.metadata && subscription.metadata.userId) {
              const userId = parseInt(subscription.metadata.userId);
              const planName = subscription.metadata.planName || 'business';
              
              // Update user's current plan
              await storage.updateUser(userId, { 
                currentPlan: planName.toLowerCase()
              });
            }
          }
          break;
          
        case 'customer.subscription.deleted':
          const subscription = event.data.object as any;
          if (subscription.metadata && subscription.metadata.userId) {
            const userId = parseInt(subscription.metadata.userId);
            
            // Reset user's plan to free
            await storage.updateUser(userId, { 
              currentPlan: 'free',
              stripeSubscriptionId: null
            });
          }
          break;
          
        default:
          console.log(`Unhandled event type ${event.type}`);
      }

      res.json({ received: true });
    } catch (error: any) {
      console.error("Error processing Stripe webhook:", error);
      res.status(400).json({ message: `Webhook Error: ${error.message}` });
    }
  });

  // User stats routes
  app.get("/api/user-stats", isAuthenticated, async (req, res) => {
    try {
      const user = req.user as any;
      const stats = await storage.getUserStats(user.id);
      res.json(stats);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // Twitter OAuth Routes
  app.get("/api/twitter/auth", isAuthenticated, async (req, res) => {
    const timestamp = new Date().toISOString();
    try {
      // Check Twitter API configuration
      if (!process.env.TWITTER_API_KEY || !process.env.TWITTER_API_SECRET) {
        return res.status(503).json({ 
          message: "Twitter API credentials are not configured", 
          error: "CREDENTIALS_MISSING",
          details: {
            callbackUrl: process.env.TWITTER_CALLBACK_URL || "NOT_SET"
          }
        });
      }
      
      // Log debugging information
      console.log(`[${timestamp}] Initiating Twitter OAuth flow`);
      console.log(`[${timestamp}] Authenticated user ID: ${(req.user as any).id}`);
      
      // Generate authentication URL and tokens
      const authData = await TwitterService.generateAuthLink();
      
      // Store the oauth_token_secret in the session with timestamp
      if (req.session) {
        req.session.twitterAuth = {
          oauth_token_secret: authData.oauth_token_secret,
          oauth_token: authData.oauth_token,
          timestamp: Date.now()
        };
        
        // Force session save to ensure it's stored before redirect
        await new Promise<void>((resolve, reject) => {
          req.session.save((err) => {
            if (err) {
              console.error(`[${timestamp}] Error saving session:`, err);
              reject(err);
            } else {
              console.log(`[${timestamp}] Session saved successfully with oauth_token_secret`);
              resolve();
            }
          });
        });
        
        console.log(`[${timestamp}] Twitter OAuth session data stored:`, {
          hasTokenSecret: !!req.session.twitterAuth?.oauth_token_secret,
          hasOAuthToken: !!req.session.twitterAuth?.oauth_token,
          tokenSecretLength: req.session.twitterAuth?.oauth_token_secret?.length || 0,
          sessionID: req.sessionID
        });
      } else {
        console.error(`[${timestamp}] No session available to store OAuth token secret`);
        return res.status(500).json({ 
          message: "Session not available", 
          error: "SESSION_UNAVAILABLE"
        });
      }
      
      // Return the auth URL to the client
      res.json({
        authUrl: authData.authUrl,
        oauth_token: authData.oauth_token,
        // Optional: create a token with the oauth_token_secret that can be stored client-side
        // This is a fallback in case the session is lost
        secureToken: Buffer.from(JSON.stringify({
          oauth_token_secret: authData.oauth_token_secret,
          oauth_token: authData.oauth_token,
          timestamp: Date.now()
        })).toString('base64')
      });
    } catch (error: any) {
      console.error(`[${timestamp}] Twitter auth initialization error:`, error);
      
      // Handle specific error codes
      if (error.message && error.message.includes('callback')) {
        return res.status(500).json({ 
          message: "Invalid Twitter callback URL configuration."
        });
      }
      
      res.status(500).json({ 
        message: "Error initiating Twitter authentication", 
        error: error.message
      });
    }
  });
  
  // Twitter callback route - this is needed to handle the OAuth redirect
  // Also support both local testing path and production path
  app.get(["/twitter-callback", "/auth/twitter/callback"], async (req, res) => {
    try {
      const { oauth_token, oauth_verifier, denied } = req.query;
      const timestamp = new Date().toISOString();
      
      console.log(`[${timestamp}] Twitter callback received:`, {
        oauth_token: oauth_token ? "EXISTS" : "MISSING",
        oauth_verifier: oauth_verifier ? "EXISTS" : "MISSING",
        denied: denied ? "DENIED" : "NOT_DENIED",
        sessionID: req.sessionID || "NO_SESSION"
      });
      
      // Check if the user denied the authorization
      if (denied) {
        console.log(`[${timestamp}] User denied Twitter authorization`);
        return res.redirect('/connect?error=twitter_auth_denied');
      }
      
      // Check if all required parameters are present
      if (!oauth_token || !oauth_verifier) {
        console.log(`[${timestamp}] Missing required OAuth parameters in Twitter callback`);
        return res.redirect('/connect?error=twitter_missing_params');
      }
      
      // Check if Twitter credentials are configured
      if (!process.env.TWITTER_API_KEY || !process.env.TWITTER_API_SECRET) {
        console.error(`[${timestamp}] Twitter API credentials are missing in callback handler`);
        return res.redirect('/connect?error=twitter_credentials_missing');
      }
      
      // Check for the oauth_token_secret in the session
      const oauth_token_secret = req.session?.twitterAuth?.oauth_token_secret || '';
      
      // Log session info for debugging
      console.log(`[${timestamp}] Session info for Twitter callback:`, {
        hasSession: !!req.session,
        sessionID: req.sessionID || 'NONE',
        hasTwitterAuth: !!req.session?.twitterAuth,
        hasTokenSecret: !!req.session?.twitterAuth?.oauth_token_secret,
        tokenSecretLength: req.session?.twitterAuth?.oauth_token_secret?.length || 0
      });
      
      // Return a simple page that calls the actual API endpoint to complete the auth
      // We need to do this since the user might not be authenticated at this point
      res.send(`
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <title>Completing Twitter Authentication...</title>
          <script>
            // Function to complete the authentication once the window loads
            window.onload = function() {
              // Get timestamp for debugging
              const timestamp = new Date().toISOString();
              console.log(\`[\${timestamp}] Twitter callback page loaded\`);
              
              // Store the OAuth data in localStorage
              localStorage.setItem('twitter_oauth_verifier', '${oauth_verifier}');
              localStorage.setItem('twitter_oauth_token', '${oauth_token}');
              
              // Store the oauth_token_secret from the session if available
              ${oauth_token_secret ? `localStorage.setItem('twitter_oauth_token_secret', '${oauth_token_secret}');` : ''}
              
              console.log(\`[\${timestamp}] Twitter OAuth data stored in localStorage\`, {
                hasOauthToken: !!localStorage.getItem('twitter_oauth_token'),
                hasOauthVerifier: !!localStorage.getItem('twitter_oauth_verifier'),
                hasOauthTokenSecret: !!localStorage.getItem('twitter_oauth_token_secret')
              });
              
              // Alert the parent window that the auth is complete
              if (window.opener) {
                console.log(\`[\${timestamp}] Posting message to parent window\`);
                window.opener.postMessage({ 
                  type: 'TWITTER_AUTH_COMPLETE',
                  oauth_token: '${oauth_token}',
                  oauth_verifier: '${oauth_verifier}'
                  ${oauth_token_secret ? `, oauth_token_secret: '${oauth_token_secret}'` : ''}
                }, '*');
                
                // Close this window
                console.log(\`[\${timestamp}] Closing popup window in 1 second\`);
                setTimeout(() => window.close(), 1000);
              } else {
                // If no opener, redirect to connect page
                console.log(\`[\${timestamp}] No opener found, redirecting to connect page\`);
                window.location.href = '/connect?success=twitter_connected';
              }
            };
          </script>
          <style>
            body {
              font-family: Arial, sans-serif;
              display: flex;
              justify-content: center;
              align-items: center;
              height: 100vh;
              margin: 0;
              background-color: #f5f8fa;
            }
            .container {
              text-align: center;
              padding: 20px;
              border-radius: 10px;
              box-shadow: 0 0 10px rgba(0,0,0,0.1);
              background-color: white;
            }
            .spinner {
              display: inline-block;
              width: 50px;
              height: 50px;
              border: 3px solid rgba(29,161,242,0.3);
              border-radius: 50%;
              border-top-color: #1da1f2;
              animation: spin 1s ease-in-out infinite;
            }
            @keyframes spin {
              to { transform: rotate(360deg); }
            }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="spinner"></div>
            <h2 style="color: #1da1f2; margin-top: 20px;">Completing Twitter Authentication...</h2>
            <p>Please wait while we complete your Twitter connection.</p>
          </div>
        </body>
        </html>
      `);
    } catch (error: any) {
      console.error("Error in Twitter callback route:", error);
      res.redirect(`/connect?error=twitter_callback_error&message=${encodeURIComponent(error.message)}`);
    }
  });
  
  // Facebook OAuth Routes
  app.get("/api/facebook/auth", isAuthenticated, async (req, res) => {
    try {
      // Check if Facebook API credentials are configured
      if (!process.env.FACEBOOK_APP_ID || !process.env.FACEBOOK_APP_SECRET) {
        return res.status(503).json({ 
          message: "Facebook API credentials are not configured", 
          error: "CREDENTIALS_MISSING",
          details: "Please add FACEBOOK_APP_ID and FACEBOOK_APP_SECRET to environment variables"
        });
      }
      
      // Log debugging information
      console.log("Initiating Facebook OAuth flow:");
      console.log(`Authenticated user ID: ${(req.user as any).id}`);
      
      // Generate Facebook authentication URL
      const authData = await FacebookService.generateAuthLink();
      
      // Include the redirect URI in the response for debugging
      res.json({
        authUrl: authData.authUrl,
        state: authData.state,
        redirectUri: authData.redirectUri, // Include the redirect URI for debugging
        appId: process.env.FACEBOOK_APP_ID ? "Valid (set)" : "Missing",
        appSecret: process.env.FACEBOOK_APP_SECRET ? "Valid (set)" : "Missing",
      });
    } catch (error: any) {
      console.error("Facebook auth error:", error);
      res.status(500).json({ 
        message: "Error initiating Facebook authentication", 
        error: error.message,
        errorType: "FACEBOOK_AUTH_ERROR"
      });
    }
  });
  
  // Process Facebook connection from client after redirect
  // Enhanced Facebook complete-auth endpoint that can work with or without active session
  app.post("/api/facebook/complete-auth", async (req, res) => {
    try {
      const { token } = req.body;
      const user = req.user as any;
      
      if (!token) {
        return res.status(400).json({ 
          message: "Token is required",
          errorType: "INVALID_REQUEST" 
        });
      }
      
      try {
        // Decode the token that contains the auth code
        const tokenData = JSON.parse(Buffer.from(token, 'base64').toString('utf-8'));
        
        // Verify token has not expired (10 minute limit)
        if (!tokenData.timestamp || Date.now() - tokenData.timestamp > 10 * 60 * 1000) {
          return res.status(400).json({
            message: "Token has expired. Please try connecting again.",
            errorType: "TOKEN_EXPIRED"
          });
        }
        
        // Extract the code and complete Facebook OAuth flow
        const code = tokenData.code;
        
        if (!code) {
          return res.status(400).json({
            message: "Invalid token format. Missing authorization code.",
            errorType: "INVALID_TOKEN_FORMAT"
          });
        }
        
        // Complete the OAuth flow with the extracted code
        const facebookAccount = await FacebookService.handleCallback(user.id, code);
        
        // Return success response with account details
        res.json({
          success: true,
          account: facebookAccount
        });
      } catch (parseError) {
        console.error("Error parsing Facebook auth token:", parseError);
        return res.status(400).json({
          message: "Invalid token format",
          errorType: "INVALID_TOKEN"
        });
      }
    } catch (error: any) {
      console.error("Error completing Facebook auth:", error);
      
      let statusCode = 500;
      let errorType = "FACEBOOK_AUTH_ERROR";
      
      // Handle specific error types
      if (error.message.includes("API credentials")) {
        statusCode = 503;
        errorType = "CREDENTIALS_MISSING";
      } else if (error.message.includes("code is invalid")) {
        statusCode = 400;
        errorType = "INVALID_CODE";
      }
      
      res.status(statusCode).json({
        message: error.message || "Error completing Facebook authentication",
        errorType
      });
    }
  });
  
  // Facebook OAuth callback as GET (how Facebook redirects after authentication)
  app.get("/api/facebook/callback", async (req, res) => {
    try {
      const { code, error, error_reason, error_description, state } = req.query;
      
      console.log('=====================================');
      console.log('Facebook OAuth Callback Received');
      console.log('=====================================');
      console.log('Request URL:', req.originalUrl);
      console.log('Query parameters:', req.query);
      console.log('Full request details:');
      console.log(`- Host: ${req.headers.host}`);
      console.log(`- Protocol: ${req.protocol}`);
      console.log(`- Original URL: ${req.originalUrl}`);
      console.log(`- Referer: ${req.headers.referer || 'None'}`);
      console.log(`- User-Agent: ${req.headers['user-agent']}`);
      console.log(`- Host URL: ${getHost()}`);
      console.log(`- Session ID: ${req.sessionID || 'No session ID'}`);
      console.log(`- Is Authenticated: ${req.isAuthenticated()}`);
      console.log('=====================================');
      
      // First check if Facebook returned an error
      if (error) {
        console.error("Facebook returned an error:", { error, error_reason, error_description });
        return res.redirect(`/connect?error=facebook_oauth_error&message=${encodeURIComponent(String(error_description) || String(error_reason) || String(error))}`);
      }
      
      if (!code) {
        console.error("Facebook callback missing code parameter");
        // Redirect the user back to the connect page with an error
        return res.redirect('/connect?error=facebook_missing_code');
      }
      
      // Check if Facebook API credentials are configured
      if (!process.env.FACEBOOK_APP_ID || !process.env.FACEBOOK_APP_SECRET) {
        console.error("Facebook credentials not configured");
        return res.redirect('/connect?error=facebook_credentials_missing');
      }
      
      // Check if the user is already authenticated
      if (req.isAuthenticated()) {
        // User is authenticated, we can handle the callback directly here
        console.log('User is authenticated, completing Facebook connection directly');
        try {
          const user = req.user as any;
          const facebookAccount = await FacebookService.handleCallback(user.id, String(code));
          
          console.log('Facebook account connected successfully for authenticated user:', {
            userId: user.id,
            accountId: facebookAccount.accountId,
            accountName: facebookAccount.accountName
          });
          
          // Redirect to the connect page with success parameter
          return res.redirect('/connect?status=facebook_connected');
        } catch (fbError: any) {
          console.error('Error connecting Facebook account:', fbError);
          return res.redirect(`/connect?error=facebook_connection_error&message=${encodeURIComponent(fbError.message)}`);
        }
      }
      
      // For unauthenticated callbacks, we need to handle this differently
      // We'll redirect back to a page that will check auth status and 
      // complete the connection if the user is authenticated
      
      // Create an encoded and timestamped token for temporary storage
      // This will be verified on the client side
      const tempToken = Buffer.from(JSON.stringify({
        code: String(code),
        timestamp: Date.now()
      })).toString('base64');
      
      // Store token in session if possible to maintain connection to same session
      if (req.session) {
        req.session.facebookPendingToken = tempToken;
        console.log('Stored Facebook token in session:', req.sessionID);
      }
      
      // Redirect the user back to the connect page with success message and temp token
      console.log('Redirecting to connect page with token');
      return res.redirect(`/connect?action=facebook_connect&token=${encodeURIComponent(tempToken)}`);
    } catch (error: any) {
      console.error("Facebook callback GET error:", error);
      
      // Create a detailed error message
      const errorMessage = error.message || "Unknown error";
      let errorParam = 'facebook_unknown_error';
      let errorDetails = '';
      
      if (errorMessage.includes('code')) {
        errorParam = 'facebook_invalid_code';
      } else if (errorMessage.includes('token')) {
        errorParam = 'facebook_token_error';
      } else if (errorMessage.includes('authentication') || errorMessage.includes('credentials')) {
        errorParam = 'facebook_auth_failed';
      }
      
      // Add detailed error message for debugging
      errorDetails = `&message=${encodeURIComponent(errorMessage)}`;
      console.log(`Redirecting with error: ${errorParam}, details: ${errorMessage}`);
      
      return res.redirect(`/connect?error=${errorParam}${errorDetails}`);
    }
  });
  
  // Original POST endpoint for compatibility
  app.post("/api/facebook/callback", isAuthenticated, async (req, res) => {
    try {
      const { code } = req.body;
      const user = req.user as any;
      
      if (!code) {
        return res.status(400).json({ message: "Authorization code is required" });
      }
      
      // Check if Facebook API credentials are configured
      if (!process.env.FACEBOOK_APP_ID || !process.env.FACEBOOK_APP_SECRET) {
        return res.status(503).json({ 
          message: "Facebook API credentials are not configured", 
          error: "CREDENTIALS_MISSING",
          details: "Please add FACEBOOK_APP_ID and FACEBOOK_APP_SECRET to environment variables"
        });
      }
      
      // Complete the OAuth flow
      const facebookAccount = await FacebookService.handleCallback(user.id, code);
      
      res.json(facebookAccount);
    } catch (error: any) {
      console.error("Facebook callback error:", error);
      
      let statusCode = 500;
      let errorType = "FACEBOOK_AUTH_ERROR";
      
      // Check for specific error types
      if (error.message.includes("API credentials are not configured")) {
        statusCode = 503;
        errorType = "CREDENTIALS_MISSING";
      } else if (error.message.includes("code is invalid")) {
        statusCode = 400;
        errorType = "INVALID_CODE";
      }
      
      res.status(statusCode).json({ 
        message: "Error completing Facebook authentication", 
        error: error.message,
        errorType: errorType
      });
    }
  });
  
  app.post("/api/facebook/post", isAuthenticated, async (req, res) => {
    try {
      const { content, mediaUrl } = req.body;
      const user = req.user as any;
      
      if (!content) {
        return res.status(400).json({ message: "Content is required" });
      }
      
      // Get the user's Facebook account to check if connected
      const facebookAccount = await storage.getSocialAccountByPlatform(user.id, 'facebook');
      
      if (!facebookAccount || !facebookAccount.accessToken) {
        return res.status(403).json({ 
          message: "Facebook account not connected", 
          errorType: "ACCOUNT_NOT_CONNECTED"
        });
      }
      
      // Post to Facebook
      const postData = await FacebookService.postToFacebook(user.id, content, mediaUrl);
      
      res.json({
        success: true,
        post: postData
      });
    } catch (error: any) {
      console.error("Facebook post error:", error);
      
      let statusCode = 500;
      let errorType = "FACEBOOK_POST_ERROR";
      
      // Handle different types of errors
      if (error.message.includes("not connected")) {
        statusCode = 403;
        errorType = "ACCOUNT_NOT_CONNECTED";
      } else if (error.message.includes("API credentials")) {
        statusCode = 503;
        errorType = "CREDENTIALS_MISSING";
      } else if (error.message.includes("token is invalid")) {
        statusCode = 401;
        errorType = "TOKEN_INVALID";
      }
      
      res.status(statusCode).json({ 
        message: "Error posting to Facebook", 
        error: error.message,
        errorType: errorType
      });
    }
  });
  
  app.get("/api/facebook/stats", isAuthenticated, async (req, res) => {
    try {
      const user = req.user as any;
      
      // Get the user's Facebook account to check if connected
      const facebookAccount = await storage.getSocialAccountByPlatform(user.id, 'facebook');
      
      if (!facebookAccount || !facebookAccount.accessToken) {
        return res.status(403).json({ 
          message: "Facebook account not connected", 
          errorType: "ACCOUNT_NOT_CONNECTED"
        });
      }
      
      // Get Facebook account stats
      const stats = await FacebookService.getAccountStats(user.id);
      
      res.json(stats);
    } catch (error: any) {
      console.error("Facebook stats error:", error);
      
      let statusCode = 500;
      let errorType = "FACEBOOK_STATS_ERROR";
      
      // Handle different types of errors
      if (error.message.includes("not connected")) {
        statusCode = 403;
        errorType = "ACCOUNT_NOT_CONNECTED";
      } else if (error.message.includes("API credentials")) {
        statusCode = 503;
        errorType = "CREDENTIALS_MISSING";
      } else if (error.message.includes("token is invalid")) {
        statusCode = 401;
        errorType = "TOKEN_INVALID";
      }
      
      res.status(statusCode).json({ 
        message: "Error fetching Facebook stats", 
        error: error.message,
        errorType: errorType
      });
    }
  });
  
  // Instagram OAuth Routes
  app.get("/api/instagram/auth", isAuthenticated, async (req, res) => {
    try {
      // Check if Instagram API credentials are configured
      if (!process.env.INSTAGRAM_APP_ID || !process.env.INSTAGRAM_APP_SECRET) {
        return res.status(503).json({ 
          message: "Instagram API credentials are not configured", 
          error: "CREDENTIALS_MISSING",
          details: "Please add INSTAGRAM_APP_ID and INSTAGRAM_APP_SECRET to environment variables"
        });
      }
      
      // Generate Instagram authentication URL
      const authData = InstagramService.generateAuthLink();
      
      // Instagram auth data only contains authUrl, no state
      res.json(authData);
    } catch (error: any) {
      console.error("Instagram auth error:", error);
      res.status(500).json({ 
        message: "Error initiating Instagram authentication", 
        error: error.message,
        errorType: "INSTAGRAM_AUTH_ERROR"
      });
    }
  });
  
  // Instagram callback handler for GET requests from OAuth redirect
  // Instagram OAuth callback handler for redirect from Instagram
  app.get("/api/instagram/callback", (req, res) => {
    try {
      const { code, error, error_reason, error_description } = req.query;
      
      // First check if Instagram returned an error
      if (error) {
        console.error("Instagram returned an error:", { error, error_reason, error_description });
        return res.redirect(`/connect?error=instagram_oauth_error&message=${encodeURIComponent(String(error_description) || String(error_reason) || String(error))}`);
      }
      
      if (!code) {
        console.error("Instagram callback missing code parameter");
        return res.redirect('/connect?error=instagram_missing_code');
      }
      
      // Check if Instagram API credentials are configured
      if (!process.env.INSTAGRAM_APP_ID || !process.env.INSTAGRAM_APP_SECRET) {
        console.error("Instagram credentials not configured");
        return res.redirect('/connect?error=instagram_credentials_missing');
      }
      
      // Create token with auth code and user ID if available
      const tokenData = {
        code: String(code),
        timestamp: Date.now(),
        userId: req.isAuthenticated() ? (req.user as any).id : undefined
      };
      
      const tempToken = Buffer.from(JSON.stringify(tokenData)).toString('base64');
      
      // Redirect to connect page with token
      return res.redirect(`/connect?action=instagram_connect&token=${encodeURIComponent(tempToken)}`);
    } catch (error: any) {
      console.error("Instagram callback error:", error);
      return res.redirect(`/connect?error=instagram_error&message=${encodeURIComponent(error.message || "Unknown error")}`);
    }
  });
  
  // Instagram complete-auth endpoint for completing connection after redirect
  // Enhanced Instagram complete-auth endpoint that can work with or without active session
  app.post("/api/instagram/complete-auth", async (req, res) => {
    try {
      const { token } = req.body;
      
      if (!token) {
        return res.status(400).json({ 
          message: "Token is required",
          errorType: "INVALID_REQUEST" 
        });
      }
      
      try {
        // Decode the token that contains the auth code and user info
        const tokenData = JSON.parse(Buffer.from(token, 'base64').toString('utf-8'));
        
        // Verify token has not expired (30 minute limit to account for potential delays)
        if (!tokenData.timestamp || Date.now() - tokenData.timestamp > 30 * 60 * 1000) {
          return res.status(400).json({
            message: "Token has expired. Please try connecting again.",
            errorType: "TOKEN_EXPIRED"
          });
        }
        
        // Extract the code and user information
        const { code, userId } = tokenData;
        
        if (!code) {
          return res.status(400).json({
            message: "Invalid token format. Missing authorization code.",
            errorType: "INVALID_TOKEN_FORMAT"
          });
        }
        
        // If no user is authenticated, we need a userId in the token
        if (!req.isAuthenticated() && !userId) {
          return res.status(401).json({
            message: "Authentication required. Please log in and try again.",
            errorType: "AUTH_REQUIRED"
          });
        }
        
        // Use either the authenticated user's ID or the one from the token
        const effectiveUserId = req.isAuthenticated() ? (req.user as any).id : userId;
        
        // Check if Instagram API credentials are configured
        if (!process.env.INSTAGRAM_APP_ID || !process.env.INSTAGRAM_APP_SECRET) {
          return res.status(503).json({ 
            message: "Instagram API credentials are not configured", 
            error: "CREDENTIALS_MISSING",
            details: "Please add INSTAGRAM_APP_ID and INSTAGRAM_APP_SECRET to environment variables"
          });
        }
        
        console.log(`Completing Instagram authentication for user ID: ${effectiveUserId}`);
        
        // Complete the OAuth flow
        const instagramAccount = await InstagramService.handleCallback(effectiveUserId, code);
        
        // Return success response with account details
        res.json({
          success: true,
          account: instagramAccount
        });
      } catch (parseError) {
        console.error("Error parsing Instagram auth token:", parseError);
        return res.status(400).json({
          message: "Invalid token format",
          errorType: "INVALID_TOKEN"
        });
      }
    } catch (error: any) {
      console.error("Error completing Instagram auth:", error);
      
      let statusCode = 500;
      let errorType = "INSTAGRAM_AUTH_ERROR";
      
      // Check for specific error types
      if (error.message.includes("API credentials are not configured")) {
        statusCode = 503;
        errorType = "CREDENTIALS_MISSING";
      } else if (error.message.includes("code is invalid")) {
        statusCode = 400;
        errorType = "INVALID_CODE";
      }
      
      res.status(statusCode).json({ 
        message: "Error completing Instagram authentication", 
        error: error.message,
        errorType: errorType
      });
    }
  });
  
  // Original POST callback for compatibility
  app.post("/api/instagram/callback", isAuthenticated, async (req, res) => {
    try {
      const { code } = req.body;
      const user = req.user as any;
      
      if (!code) {
        return res.status(400).json({ message: "Authorization code is required" });
      }
      
      // Check if Instagram API credentials are configured
      if (!process.env.INSTAGRAM_APP_ID || !process.env.INSTAGRAM_APP_SECRET) {
        return res.status(503).json({ 
          message: "Instagram API credentials are not configured", 
          error: "CREDENTIALS_MISSING",
          details: "Please add INSTAGRAM_APP_ID and INSTAGRAM_APP_SECRET to environment variables"
        });
      }
      
      // Complete the OAuth flow
      const instagramAccount = await InstagramService.handleCallback(user.id, code);
      
      res.json(instagramAccount);
    } catch (error: any) {
      console.error("Instagram callback error:", error);
      
      let statusCode = 500;
      let errorType = "INSTAGRAM_AUTH_ERROR";
      
      // Check for specific error types
      if (error.message.includes("API credentials are not configured")) {
        statusCode = 503;
        errorType = "CREDENTIALS_MISSING";
      } else if (error.message.includes("code is invalid")) {
        statusCode = 400;
        errorType = "INVALID_CODE";
      }
      
      res.status(statusCode).json({ 
        message: "Error completing Instagram authentication", 
        error: error.message,
        errorType: errorType
      });
    }
  });
  
  // LinkedIn OAuth Routes
  app.get("/api/linkedin/auth", isAuthenticated, async (req, res) => {
    try {
      // Check if LinkedIn API credentials are configured
      if (!process.env.LINKEDIN_CLIENT_ID || !process.env.LINKEDIN_CLIENT_SECRET) {
        return res.status(503).json({ 
          message: "LinkedIn API credentials are not configured", 
          errorType: "CREDENTIALS_MISSING" 
        });
      }
      
      // Generate LinkedIn authentication URL
      const authUrl = await LinkedInService.generateAuthLink();
      
      res.json({ authUrl });
    } catch (error: any) {
      console.error("LinkedIn auth error:", error);
      res.status(500).json({ 
        message: "Error initiating LinkedIn authentication", 
        error: error.message || 'Failed to generate LinkedIn authorization link'
      });
    }
  });
  
  // Handle LinkedIn callback - this can come from either POST or GET
  app.get("/api/linkedin/callback", async (req, res) => {
    try {
      const { code, error, error_description, state } = req.query;
      
      // Log receipt of callback with relevant details for debugging
      console.log('=====================================');
      console.log('LinkedIn OAuth Callback Received');
      console.log('=====================================');
      console.log('Request URL:', req.originalUrl);
      console.log('Query parameters:', req.query);
      console.log('Full request details:');
      console.log(`- Host: ${req.headers.host}`);
      console.log(`- Protocol: ${req.protocol}`);
      console.log(`- Original URL: ${req.originalUrl}`);
      console.log(`- Referer: ${req.headers.referer || 'None'}`);
      console.log(`- User-Agent: ${req.headers['user-agent']}`);
      console.log(`- Session ID: ${req.sessionID || 'No session ID'}`);
      console.log(`- Is Authenticated: ${req.isAuthenticated()}`);
      console.log('=====================================');
      
      if (error) {
        console.error("LinkedIn returned an error:", { error, error_description });
        return res.redirect(`/connect?error=linkedin_oauth_error&message=${encodeURIComponent(String(error_description) || 'LinkedIn authorization failed')}`);
      }
      
      if (!code) {
        console.error("LinkedIn callback missing code parameter");
        // Redirect the user back to the connect page with an error
        return res.redirect('/connect?error=linkedin_missing_code');
      }

      // Attempt to get the stored OAuth state from local storage (via cookie)
      // This is accessed in the ConnectHandler component
      
      // Create an encoded and timestamped token for temporary storage
      // This will be verified on the client side and include user ID if available
      const tokenData = {
        code: String(code),
        timestamp: Date.now(),
        // Include the userId for completing the auth if no session exists when token is processed
        userId: req.isAuthenticated() ? (req.user as any).id : undefined
      };
      
      console.log('Creating temp token with data:', {
        codePresent: !!tokenData.code,
        timestamp: new Date(tokenData.timestamp).toISOString(),
        userIdPresent: !!tokenData.userId
      });
      
      const tempToken = Buffer.from(JSON.stringify(tokenData)).toString('base64');
      
      // Redirect the user back to the connect page with success message and temp token
      return res.redirect(`/connect?action=linkedin_connect&token=${encodeURIComponent(tempToken)}`);
    } catch (error: any) {
      console.error("LinkedIn callback GET error:", error);
      
      // Create a detailed error message
      const errorMessage = error.message || "Unknown error";
      let errorParam = 'linkedin_unknown_error';
      let errorDetails = '';
      
      if (errorMessage.includes('code')) {
        errorParam = 'linkedin_invalid_code';
      } else if (errorMessage.includes('token')) {
        errorParam = 'linkedin_token_error';
      } else if (errorMessage.includes('authentication') || errorMessage.includes('credentials')) {
        errorParam = 'linkedin_auth_failed';
      }
      
      // Add detailed error message for debugging
      errorDetails = `&message=${encodeURIComponent(errorMessage)}`;
      console.log(`Redirecting with error: ${errorParam}, details: ${errorMessage}`);
      
      return res.redirect(`/connect?error=${errorParam}${errorDetails}`);
    }
  });
  
  // LinkedIn complete-auth endpoint for completing connection after redirect
  // Enhanced LinkedIn complete-auth endpoint that can work with or without active session
  app.post("/api/linkedin/complete-auth", async (req, res) => {
    try {
      const { token } = req.body;
      
      if (!token) {
        return res.status(400).json({ 
          message: "Token is required",
          errorType: "INVALID_REQUEST" 
        });
      }
      
      try {
        // Decode the token that contains the auth code and user info
        const tokenData = JSON.parse(Buffer.from(token, 'base64').toString('utf-8'));
        
        // Verify token has not expired (30 minute limit to account for potential delays)
        if (!tokenData.timestamp || Date.now() - tokenData.timestamp > 30 * 60 * 1000) {
          return res.status(400).json({
            message: "Token has expired. Please try connecting again.",
            errorType: "TOKEN_EXPIRED"
          });
        }
        
        // Extract the code and user information
        const { code, userId } = tokenData;
        
        if (!code) {
          return res.status(400).json({
            message: "Invalid token format. Missing authorization code.",
            errorType: "INVALID_TOKEN_FORMAT"
          });
        }
        
        // If no user is authenticated, we need a userId in the token
        if (!req.isAuthenticated() && !userId) {
          return res.status(401).json({
            message: "Authentication required. Please log in and try again.",
            errorType: "AUTH_REQUIRED"
          });
        }
        
        // Use either the authenticated user's ID or the one from the token
        const effectiveUserId = req.isAuthenticated() ? (req.user as any).id : userId;
        
        // Check if LinkedIn API credentials are configured
        if (!process.env.LINKEDIN_CLIENT_ID || !process.env.LINKEDIN_CLIENT_SECRET) {
          return res.status(503).json({ 
            message: "LinkedIn API credentials are not configured", 
            errorType: "CREDENTIALS_MISSING" 
          });
        }
        
        console.log(`Completing LinkedIn authentication for user ID: ${effectiveUserId}`);
        
        // Exchange authorization code for access token and user info
        // The LinkedInService.handleCallback method now handles the database operations
        const linkedInAccount = await LinkedInService.handleCallback(effectiveUserId, code);
        
        if (!linkedInAccount) {
          return res.status(400).json({ 
            message: "Failed to get LinkedIn account details", 
            errorType: "LINKEDIN_API_ERROR" 
          });
        }
        
        // Return success response with account details
        res.json({
          success: true,
          account: linkedInAccount
        });
      } catch (parseError) {
        console.error("Error parsing LinkedIn auth token:", parseError);
        return res.status(400).json({
          message: "Invalid token format",
          errorType: "INVALID_TOKEN"
        });
      }
    } catch (error: any) {
      console.error("Error completing LinkedIn auth:", error);
      
      let statusCode = 500;
      let errorType = "LINKEDIN_AUTH_ERROR";
      
      // Handle various error types
      if (error.message.includes('invalid_client')) {
        statusCode = 401;
        errorType = "AUTHENTICATION_FAILED";
      } else if (error.message.includes('invalid_grant')) {
        statusCode = 401;
        errorType = "INVALID_TOKEN";
      }
      
      res.status(statusCode).json({
        message: error.message || "Error completing LinkedIn authentication",
        errorType
      });
    }
  });

  // Legacy endpoint for backward compatibility
  app.post("/api/linkedin/callback", isAuthenticated, async (req, res) => {
    try {
      const { code } = req.body;
      const user = req.user as any;
      
      // Check if LinkedIn API credentials are configured
      if (!process.env.LINKEDIN_CLIENT_ID || !process.env.LINKEDIN_CLIENT_SECRET) {
        return res.status(503).json({ 
          message: "LinkedIn API credentials are not configured", 
          errorType: "CREDENTIALS_MISSING" 
        });
      }
      
      // Handle callback directly using the LinkedIn service which now handles DB operations
      const account = await LinkedInService.handleCallback(user.id, code);
      
      if (!account) {
        return res.status(400).json({ 
          message: "Failed to get LinkedIn account details", 
          errorType: "LINKEDIN_API_ERROR" 
        });
      }
      
      res.json(account);
    } catch (error: any) {
      console.error("LinkedIn callback error:", error);
      
      // Handle various error types
      if (error.message.includes('invalid_client')) {
        return res.status(401).json({ 
          message: "LinkedIn API authentication failed. Please reconnect your account.", 
          errorType: "AUTHENTICATION_FAILED" 
        });
      }
      
      if (error.message.includes('invalid_grant')) {
        return res.status(401).json({ 
          message: "Invalid or expired LinkedIn authentication tokens. Please try connecting again.", 
          errorType: "INVALID_TOKEN" 
        });
      }
      
      res.status(500).json({ 
        message: "Error completing LinkedIn authentication", 
        error: error.message || 'Unknown error during LinkedIn authentication'
      });
    }
  });
  
  app.post("/api/linkedin/post", isAuthenticated, async (req, res) => {
    try {
      const { content, mediaUrl } = req.body;
      const user = req.user as any;
      
      if (!content) {
        return res.status(400).json({ message: "Content is required" });
      }
      
      // Get the user's LinkedIn account to check if connected
      const linkedInAccount = await storage.getSocialAccountByPlatform(user.id, 'linkedin');
      
      if (!linkedInAccount) {
        return res.status(400).json({ 
          message: "LinkedIn account not connected", 
          errorType: "ACCOUNT_NOT_CONNECTED" 
        });
      }
      
      // Post to LinkedIn
      // Handle the case where accessToken might be a string
      // Post to LinkedIn
      const result = await LinkedInService.postToLinkedIn(
        user.id,
        content,
        mediaUrl
      );
      
      // Create a post record in the database
      const post = await storage.createPost({
        userId: user.id,
        content,
        mediaUrls: mediaUrl ? [mediaUrl] : null,
        platforms: ['linkedin'],
        status: 'published',
        scheduledAt: null
      });
      
      res.json(post);
    } catch (error: any) {
      console.error("LinkedIn post error:", error);
      
      // Handle various error types
      if (error.message.includes('expired') || error.message.includes('invalid_token')) {
        return res.status(401).json({ 
          message: "LinkedIn authorization has expired. Please reconnect your account.", 
          errorType: "TOKEN_EXPIRED" 
        });
      }
      
      if (error.message.includes('permission') || error.message.includes('scope')) {
        return res.status(403).json({ 
          message: "Missing permissions to post to LinkedIn. Please reconnect with proper permissions.", 
          errorType: "PERMISSION_DENIED" 
        });
      }
      
      if (error.message.includes('rate limit') || error.message.includes('too many requests')) {
        return res.status(429).json({ 
          message: "LinkedIn posting rate limit exceeded. Please try again later.", 
          errorType: "RATE_LIMIT_EXCEEDED" 
        });
      }
      
      res.status(500).json({ 
        message: "Error posting to LinkedIn", 
        error: error.message || 'Unknown error while posting to LinkedIn'
      });
    }
  });
  
  app.get("/api/linkedin/stats", isAuthenticated, async (req, res) => {
    try {
      const user = req.user as any;
      
      // Get the user's LinkedIn account to check if connected
      const linkedInAccount = await storage.getSocialAccountByPlatform(user.id, 'linkedin');
      
      if (!linkedInAccount) {
        return res.status(400).json({ 
          message: "LinkedIn account not connected", 
          errorType: "ACCOUNT_NOT_CONNECTED" 
        });
      }
      
      // Get LinkedIn account stats
      const stats = await LinkedInService.getAccountStats(user.id);
      
      res.json(stats);
    } catch (error: any) {
      console.error("LinkedIn stats error:", error);
      
      // Handle various error types
      if (error.message.includes('expired') || error.message.includes('invalid_token')) {
        return res.status(401).json({ 
          message: "LinkedIn authorization has expired. Please reconnect your account.", 
          errorType: "TOKEN_EXPIRED" 
        });
      }
      
      if (error.message.includes('permission') || error.message.includes('scope')) {
        return res.status(403).json({ 
          message: "Missing permissions to access LinkedIn stats. Please reconnect with proper permissions.", 
          errorType: "PERMISSION_DENIED" 
        });
      }
      
      res.status(500).json({ 
        message: "Error fetching LinkedIn stats", 
        error: error.message || 'Unknown error while fetching LinkedIn stats'
      });
    }
  });

  // Snapchat API routes
  app.get("/api/snapchat/auth", isAuthenticated, async (req, res) => {
    try {
      console.log(`Generating Snapchat auth link for user ID: ${(req.user as any).id}`);
      const authLink = await SnapchatService.generateAuthLink();
      
      // Log the auth URL (masking most of it for security)
      const authUrlString = authLink.authUrl;
      const maskedAuthUrl = authUrlString.substring(0, 60) + '...' + authUrlString.substring(authUrlString.length - 30);
      console.log('Generated Snapchat auth URL (masked):', maskedAuthUrl);
      
      res.json(authLink);
    } catch (error: any) {
      console.error("Snapchat auth error:", error);
      
      // More detailed error response with error code
      const errorCode = error.code || 'UNKNOWN_ERROR';
      const status = errorCode === 'AUTHENTICATION_FAILED' ? 401 : 500;
      
      res.status(status).json({ 
        message: "API authentication failed. Please check your Snapchat API credentials.",
        error: error.message,
        code: errorCode,
        // Include callback URL info for diagnostic purposes
        callbackInfo: {
          configured: !!process.env.SNAPCHAT_CALLBACK_URL,
          workspace: process.env.REPL_SLUG && process.env.REPL_OWNER 
            ? `https://${process.env.REPL_SLUG}.${process.env.REPL_OWNER}.repl.co/snapchat/callback` 
            : null
        }
      });
    }
  });

  app.post("/api/snapchat/callback", isAuthenticated, async (req, res) => {
    try {
      const { code } = req.body;
      
      if (!code) {
        return res.status(400).json({ 
          message: "Missing authorization code",
          details: "The authorization code from Snapchat was not provided in the request"
        });
      }
      
      const user = req.user as any;
      console.log(`Processing Snapchat callback for user ID: ${user.id}`);
      
      // Mask the code for logging (show only first and last few chars)
      const maskedCode = code.substring(0, 4) + '...' + code.substring(code.length - 4);
      console.log(`Processing code starting with ${maskedCode.substring(0, 4)}`);
      
      const account = await SnapchatService.handleCallback(user.id, code);
      
      console.log(`Successfully connected Snapchat account: ${account.accountName} (ID: ${account.id})`);
      res.json({
        ...account,
        message: "Snapchat account connected successfully"
      });
    } catch (error: any) {
      console.error("Snapchat callback error:", error);
      
      // More context-specific error handling
      let status = 500;
      let errorMessage = error.message;
      let errorDetails = null;
      
      if (error.message.includes('authorization code')) {
        status = 400;
        errorMessage = "Invalid or expired authorization code";
        errorDetails = "The code provided by Snapchat is invalid or has expired. Please try connecting again.";
      } else if (error.message.includes('Authentication failed') || error.message.includes('credentials')) {
        status = 401;
        errorMessage = "Authentication with Snapchat failed";
        errorDetails = "The API credentials for Snapchat may be invalid or have insufficient permissions.";
      } else if (error.message.includes('Permission denied')) {
        status = 403;
        errorMessage = "Permission denied by Snapchat";
        errorDetails = "The app doesn't have the required permissions or the user denied permissions.";
      } else if (error.message.includes('Network error')) {
        status = 503;
        errorMessage = "Connection to Snapchat failed";
        errorDetails = "Unable to reach Snapchat servers. This may be temporary, please try again later.";
      }
      
      res.status(status).json({ 
        message: errorMessage,
        details: errorDetails,
        error: error.message
      });
    }
  });

  app.delete("/api/snapchat/disconnect", isAuthenticated, async (req, res) => {
    try {
      const user = req.user as any;
      console.log(`Disconnecting Snapchat account for user ID: ${user.id}`);
      
      // Use the service method instead of direct database access
      const success = await SnapchatService.disconnectAccount(user.id);
      
      if (success) {
        console.log(`Successfully disconnected Snapchat account for user ID: ${user.id}`);
        res.json({ 
          message: "Snapchat account disconnected successfully",
          success: true
        });
      } else {
        console.error(`Failed to disconnect Snapchat account for user ID: ${user.id}`);
        res.status(500).json({ 
          message: "Failed to disconnect Snapchat account",
          success: false
        });
      }
    } catch (error: any) {
      console.error("Snapchat disconnect error:", error);
      res.status(500).json({ 
        message: error.message,
        success: false
      });
    }
  });

  app.post("/api/snapchat/post", isAuthenticated, async (req, res) => {
    try {
      const { content, imageUrl } = req.body;
      
      if (!content) {
        return res.status(400).json({ message: "Content is required" });
      }
      
      const user = req.user as any;
      const result = await SnapchatService.postContent(user.id, content, imageUrl);
      
      res.json(result);
    } catch (error: any) {
      console.error("Snapchat post error:", error);
      res.status(500).json({ message: error.message });
    }
  });

  app.get("/api/snapchat/stats", isAuthenticated, async (req, res) => {
    try {
      const user = req.user as any;
      
      // Get the user's Snapchat account to check if connected
      const snapchatAccount = await storage.getSocialAccountByPlatform(user.id, 'snapchat');
      
      if (!snapchatAccount) {
        return res.status(400).json({ 
          message: "Snapchat account not connected", 
          errorType: "ACCOUNT_NOT_CONNECTED" 
        });
      }
      
      // Get Snapchat account stats
      const stats = await SnapchatService.getAccountStats(user.id);
      
      res.json(stats);
    } catch (error: any) {
      console.error("Snapchat stats error:", error);
      
      // Handle various error types
      if (error.message.includes('expired') || error.message.includes('invalid_token')) {
        return res.status(401).json({ 
          message: "Snapchat authorization has expired. Please reconnect your account.", 
          errorType: "TOKEN_EXPIRED" 
        });
      }
      
      if (error.message.includes('permission') || error.message.includes('scope')) {
        return res.status(403).json({ 
          message: "Missing permissions to access Snapchat stats. Please reconnect with proper permissions.", 
          errorType: "PERMISSION_DENIED" 
        });
      }
      
      res.status(500).json({ 
        message: "Error fetching Snapchat stats", 
        error: error.message || 'Unknown error while fetching Snapchat stats'
      });
    }
  });
  
  // Instagram post endpoint
  app.post("/api/instagram/post", isAuthenticated, async (req, res) => {
    try {
      const { content, mediaUrl } = req.body;
      const user = req.user as any;
      
      if (!content) {
        return res.status(400).json({ message: "Content is required" });
      }
      
      if (!mediaUrl) {
        return res.status(400).json({ 
          message: "Media URL is required for Instagram posts", 
          errorType: "MEDIA_REQUIRED"
        });
      }
      
      // Get the user's Instagram account to check if connected
      const instagramAccount = await storage.getSocialAccountByPlatform(user.id, 'instagram');
      
      if (!instagramAccount || !instagramAccount.accessToken) {
        return res.status(403).json({ 
          message: "Instagram account not connected", 
          errorType: "ACCOUNT_NOT_CONNECTED"
        });
      }
      
      // Post to Instagram
      const result = await InstagramService.postToInstagram(user.id, content, mediaUrl);
      
      // The Instagram service might return a limitations object if posting isn't available
      if (result && !result.success) {
        return res.status(422).json({
          message: result.message || "Instagram posting limitations",
          limitations: result.limitations,
          errorType: "INSTAGRAM_LIMITATIONS"
        });
      }
      
      res.json({
        success: true,
        post: result
      });
    } catch (error: any) {
      console.error("Instagram post error:", error);
      
      let statusCode = 500;
      let errorType = "INSTAGRAM_POST_ERROR";
      
      // Handle different types of errors
      if (error.message.includes("not connected")) {
        statusCode = 403;
        errorType = "ACCOUNT_NOT_CONNECTED";
      } else if (error.message.includes("API credentials")) {
        statusCode = 503;
        errorType = "CREDENTIALS_MISSING";
      } else if (error.message.includes("token is invalid")) {
        statusCode = 401;
        errorType = "TOKEN_INVALID";
      } else if (error.message.includes("require media")) {
        statusCode = 400;
        errorType = "MEDIA_REQUIRED";
      }
      
      res.status(statusCode).json({ 
        message: "Error posting to Instagram", 
        error: error.message,
        errorType: errorType
      });
    }
  });
  
  app.get("/api/instagram/stats", isAuthenticated, async (req, res) => {
    try {
      const user = req.user as any;
      
      // Get the user's Instagram account to check if connected
      const instagramAccount = await storage.getSocialAccountByPlatform(user.id, 'instagram');
      
      if (!instagramAccount || !instagramAccount.accessToken) {
        return res.status(403).json({ 
          message: "Instagram account not connected", 
          errorType: "ACCOUNT_NOT_CONNECTED"
        });
      }
      
      // Get Instagram account stats
      const stats = await InstagramService.getAccountStats(user.id);
      
      res.json(stats);
    } catch (error: any) {
      console.error("Instagram stats error:", error);
      
      let statusCode = 500;
      let errorType = "INSTAGRAM_STATS_ERROR";
      
      // Handle different types of errors
      if (error.message.includes("not connected")) {
        statusCode = 403;
        errorType = "ACCOUNT_NOT_CONNECTED";
      } else if (error.message.includes("API credentials")) {
        statusCode = 503;
        errorType = "CREDENTIALS_MISSING";
      } else if (error.message.includes("token is invalid")) {
        statusCode = 401;
        errorType = "TOKEN_INVALID";
      }
      
      res.status(statusCode).json({ 
        message: "Error fetching Instagram stats", 
        error: error.message,
        errorType: errorType
      });
    }
  });

  // Complete-auth endpoint for Twitter that works without session requirements
  app.post("/api/twitter/complete-auth", isAuthenticated, async (req, res) => {
    try {
      const { oauth_token, oauth_verifier, oauth_token_secret } = req.body;
      const user = req.user as any;
      const timestamp = new Date().toISOString();
      
      // Log the parameters for debugging
      console.log(`[${timestamp}] Twitter complete-auth received:`, {
        oauth_token: oauth_token ? "EXISTS" : "MISSING",
        oauth_token_length: oauth_token?.length,
        oauth_verifier: oauth_verifier ? "EXISTS" : "MISSING",
        oauth_verifier_length: oauth_verifier?.length,
        oauth_token_secret: oauth_token_secret ? "EXISTS" : "MISSING",
        oauth_token_secret_length: oauth_token_secret?.length,
        user_id: user?.id || "NO_USER"
      });
      
      // Validate required parameters
      if (!oauth_token || !oauth_verifier || !oauth_token_secret) {
        const missing = [];
        if (!oauth_token) missing.push("oauth_token");
        if (!oauth_verifier) missing.push("oauth_verifier");
        if (!oauth_token_secret) missing.push("oauth_token_secret");
        
        console.error(`[${timestamp}] Missing Twitter OAuth parameters: ${missing.join(", ")}`);
        return res.status(400).json({
          message: `Missing required parameters: ${missing.join(", ")}`,
          errorType: "INVALID_REQUEST"
        });
      }
      
      // Check if user is available (should be from previous authentication)
      if (!user || !user.id) {
        return res.status(401).json({
          message: "User authentication required",
          errorType: "AUTHENTICATION_REQUIRED"
        });
      }
      
      // Ensure Twitter API keys are configured
      if (!process.env.TWITTER_API_KEY || !process.env.TWITTER_API_SECRET) {
        return res.status(503).json({ 
          message: "Twitter API credentials are not configured", 
          error: "CREDENTIALS_MISSING",
          details: "Please add TWITTER_API_KEY and TWITTER_API_SECRET to environment variables"
        });
      }
      
      // Complete the Twitter authentication flow
      const twitterAccount = await TwitterService.handleCallback(
        user.id,
        oauth_token,
        oauth_verifier,
        oauth_token_secret
      );
      
      // Return success
      res.status(200).json({
        success: true,
        account: twitterAccount
      });
    } catch (error: any) {
      console.error("Error completing Twitter auth:", error);
      
      let statusCode = 500;
      let errorType = "TWITTER_AUTH_ERROR";
      
      // Check for specific error types
      if (error.message?.includes("API credentials are not configured")) {
        statusCode = 503;
        errorType = "CREDENTIALS_MISSING";
      } else if (error.message?.includes("Invalid OAuth token")) {
        statusCode = 400;
        errorType = "INVALID_TOKEN";
      }
      
      res.status(statusCode).json({ 
        message: "Error completing Twitter authentication", 
        error: error.message || "Unknown error",
        errorType: errorType
      });
    }
  });

  // Legacy callback endpoint for backward compatibility
  app.post("/api/twitter/callback", isAuthenticated, async (req, res) => {
    try {
      const { oauth_token, oauth_verifier, oauth_token_secret: bodyTokenSecret } = req.body;
      const user = req.user as any;
      
      // Get oauth_token_secret from session first, then fall back to request body
      let oauth_token_secret = req.session?.twitterAuth?.oauth_token_secret;
      
      // Use the token secret from the request body as fallback if session doesn't have it
      if (!oauth_token_secret && bodyTokenSecret) {
        oauth_token_secret = bodyTokenSecret;
        console.log("Using oauth_token_secret from request body as fallback");
      }
      
      console.log("Twitter callback received:", { 
        oauth_token: oauth_token ? "EXISTS" : "MISSING", 
        oauth_verifier: oauth_verifier ? "EXISTS" : "MISSING",
        oauth_token_secret: oauth_token_secret ? "EXISTS" : "MISSING",
        session_id: req.sessionID
      });
      
      if (!oauth_token || !oauth_verifier) {
        console.error("Missing required OAuth parameters (token or verifier)");
        return res.status(400).json({ 
          message: "Missing required OAuth parameters", 
          detail: "oauth_token and oauth_verifier are required"
        });
      }
      
      if (!oauth_token_secret) {
        console.error("Missing oauth_token_secret in both session and request body");
        return res.status(400).json({ 
          message: "Authentication data missing", 
          detail: "oauth_token_secret not found. Please try authenticating again with a new browser session."
        });
      }
      
      // Ensure Twitter API keys are configured
      if (!process.env.TWITTER_API_KEY || !process.env.TWITTER_API_SECRET) {
        return res.status(503).json({ 
          message: "Twitter API credentials are not configured", 
          error: "CREDENTIALS_MISSING",
          details: "Please add TWITTER_API_KEY and TWITTER_API_SECRET to environment variables"
        });
      }
      
      // Complete the OAuth flow
      const twitterAccount = await TwitterService.handleCallback(
        user.id,
        oauth_token,
        oauth_verifier,
        oauth_token_secret
      );
      
      console.log("Twitter account connected successfully:", {
        accountId: twitterAccount.accountId,
        username: twitterAccount.username
      });
      
      res.json(twitterAccount);
    } catch (error: any) {
      console.error("Twitter callback error:", error);
      const timestamp = new Date().toISOString();
      
      // Log detailed error info for debugging
      console.log(`[${timestamp}] Twitter callback error details:`, {
        message: error.message,
        stack: error.stack,
        code: error.code
      });
      
      // Provide specific error messages for frontend display
      if (error.message && error.message.includes('API authentication failed')) {
        return res.status(401).json({ 
          message: "Twitter API authentication failed. Please reconnect your account.",
          errorType: "API_AUTH_FAILED"
        });
      } else if (error.message && error.message.includes('token')) {
        return res.status(400).json({ 
          message: "Invalid or expired Twitter authentication tokens. Please try connecting again.",
          errorType: "TOKEN_ERROR"
        });
      } else if (error.message && error.message.includes('callback')) {
        return res.status(400).json({ 
          message: "Invalid callback URL configuration. Please contact support.",
          errorType: "CALLBACK_ERROR"
        });
      } else if (error.message && error.message.includes('rate limit')) {
        return res.status(429).json({ 
          message: "Twitter API rate limit exceeded. Please try again later.",
          errorType: "RATE_LIMIT"
        });
      } else if (error.message && error.message.includes('credentials')) {
        return res.status(503).json({ 
          message: "Twitter API credentials are invalid or missing.",
          errorType: "CREDENTIALS_ERROR"
        });
      }
      
      res.status(500).json({ 
        message: "Error completing Twitter authentication", 
        error: error.message || 'Unknown error during Twitter authentication',
        errorType: "UNKNOWN_ERROR"
      });
    }
  });

  app.post("/api/twitter/post", isAuthenticated, async (req, res) => {
    try {
      const { content, mediaIds } = req.body;
      const user = req.user as any;
      
      if (!content) {
        return res.status(400).json({ message: "Tweet content is required" });
      }

      // Ensure Twitter API keys are configured
      if (!process.env.TWITTER_API_KEY || !process.env.TWITTER_API_SECRET) {
        return res.status(503).json({ 
          message: "Twitter API credentials are not configured", 
          error: "CREDENTIALS_MISSING",
          details: "Please add TWITTER_API_KEY and TWITTER_API_SECRET to environment variables"
        });
      }
      
      // Check that user has a connected Twitter account
      const twitterAccount = await storage.getSocialAccountByPlatform(user.id, 'twitter');
      if (!twitterAccount) {
        return res.status(403).json({ 
          message: "Twitter account not connected",
          error: "ACCOUNT_NOT_CONNECTED" 
        });
      }
      
      // Post the tweet
      const tweetData = await TwitterService.postTweet(user.id, content, mediaIds);
      
      res.json({ success: true, tweet: tweetData });
    } catch (error: any) {
      console.error("Twitter post error:", error);
      
      // Handle different types of errors
      if (error.message && error.message.includes('not connected')) {
        return res.status(403).json({ 
          message: "Twitter account not connected",
          error: "ACCOUNT_NOT_CONNECTED" 
        });
      } else if (error.message && error.message.includes('API authentication failed')) {
        return res.status(401).json({ 
          message: "Twitter API authentication failed. Please reconnect your account.",
          error: "AUTH_FAILED"
        });
      } else if (error.message && error.message.includes('API keys are missing')) {
        return res.status(503).json({ 
          message: "Twitter API credentials are not configured",
          error: "CREDENTIALS_MISSING" 
        });
      }
      
      res.status(500).json({ 
        message: "Error posting tweet", 
        error: error.message || "Unknown error posting to Twitter"
      });
    }
  });

  app.get("/api/twitter/stats", isAuthenticated, async (req, res) => {
    try {
      const user = req.user as any;
      
      // Ensure Twitter API keys are configured
      if (!process.env.TWITTER_API_KEY || !process.env.TWITTER_API_SECRET) {
        return res.status(503).json({ 
          message: "Twitter API credentials are not configured", 
          error: "CREDENTIALS_MISSING",
          details: "Please add TWITTER_API_KEY and TWITTER_API_SECRET to environment variables"
        });
      }
      
      // Check that user has a connected Twitter account
      const twitterAccount = await storage.getSocialAccountByPlatform(user.id, 'twitter');
      if (!twitterAccount) {
        return res.status(403).json({ 
          message: "Twitter account not connected",
          error: "ACCOUNT_NOT_CONNECTED" 
        });
      }
      
      // Get Twitter account stats
      const stats = await TwitterService.getAccountStats(user.id);
      
      res.json(stats);
    } catch (error: any) {
      console.error("Twitter stats error:", error);
      
      // Handle different types of errors
      if (error.message && error.message.includes('not connected')) {
        return res.status(403).json({ 
          message: "Twitter account not connected",
          error: "ACCOUNT_NOT_CONNECTED" 
        });
      } else if (error.message && error.message.includes('API authentication failed')) {
        return res.status(401).json({ 
          message: "Twitter API authentication failed. Please reconnect your account.",
          error: "AUTH_FAILED"
        });
      } else if (error.message && error.message.includes('API keys are missing')) {
        return res.status(503).json({ 
          message: "Twitter API credentials are not configured",
          error: "CREDENTIALS_MISSING" 
        });
      }
      
      res.status(500).json({ 
        message: "Error fetching Twitter stats", 
        error: error.message || "Unknown error fetching Twitter data"
      });
    }
  });

  // Content Analyzer routes
  app.post("/api/content/analyze", isAuthenticated, async (req, res) => {
    try {
      const { content, platform, language, audience, purpose } = req.body;
      
      if (!content) {
        return res.status(400).json({ message: "Content is required" });
      }
      
      const analysis = await ContentAnalyzer.analyzeContent(content, {
        platform,
        language,
        audience,
        purpose
      });
      
      res.json(analysis);
    } catch (error: any) {
      console.error("Content analysis error:", error);
      res.status(500).json({ message: "Error analyzing content", error: error.message });
    }
  });

  app.post("/api/content/suggest", isAuthenticated, async (req, res) => {
    try {
      const { content, analysis, platform, audience } = req.body;
      
      if (!content || !analysis) {
        return res.status(400).json({ message: "Content and analysis are required" });
      }
      
      const suggestions = await ContentAnalyzer.getSuggestions(content, analysis, {
        platform,
        audience
      });
      
      res.json(suggestions);
    } catch (error: any) {
      console.error("Content suggestion error:", error);
      res.status(500).json({ message: "Error generating content suggestions", error: error.message });
    }
  });
  
  // Engagement prediction endpoint
  app.post("/api/predictions/engagement", isAuthenticated, async (req, res) => {
    try {
      const { content, mediaUrls, platforms } = req.body;
      const user = req.user as any;
      
      if (!content) {
        return res.status(400).json({ message: "Content is required" });
      }
      
      if (!platforms || !Array.isArray(platforms) || platforms.length === 0) {
        return res.status(400).json({ message: "At least one platform must be specified" });
      }
      
      // Check for OpenAI API key
      if (!process.env.OPENAI_API_KEY) {
        return res.status(503).json({ 
          message: "OpenAI API credentials are not configured", 
          error: "CREDENTIALS_MISSING",
          details: "Please add OPENAI_API_KEY to environment variables"
        });
      }
      
      // Generate predictions for each platform
      const predictions: Record<string, any> = {};
      
      // Process platforms in parallel
      await Promise.all(platforms.map(async (platform) => {
        try {
          // Get user stats if available
          let userFollowers = undefined;
          let userType = undefined;
          
          // Get social account followers for more accurate predictions if available
          const socialAccount = await storage.getSocialAccountByPlatform(user.id, platform);
          if (socialAccount) {
            // Use follower count if available from social account
            // For now, we'll use default values in the prediction service
          }
          
          // Generate prediction
          const prediction = await EngagementPredictor.predictEngagement({
            content,
            mediaUrls,
            platform,
            userFollowers,
            userType
          });
          
          predictions[platform] = prediction;
        } catch (error) {
          console.error(`Error predicting engagement for ${platform}:`, error);
          predictions[platform] = null;
        }
      }));
      
      res.json({ predictions });
    } catch (error: any) {
      console.error("Engagement prediction error:", error);
      res.status(500).json({ 
        message: "Error predicting engagement", 
        error: error.message 
      });
    }
  });

  // Support form routes
  app.post("/api/support/send-message", async (req, res) => {
    try {
      const { name, email, subject, message } = req.body;
      
      // Basic validation
      if (!name || !email || !subject || !message) {
        return res.status(400).json({ message: "All fields are required" });
      }
      
      const supportMessage: SupportMessage = {
        name,
        email,
        subject,
        message
      };
      
      const success = await sendSupportMessage(supportMessage);
      
      if (success) {
        res.json({ success: true, message: "Support message sent successfully" });
      } else {
        res.status(500).json({ success: false, message: "Failed to send support message" });
      }
    } catch (error: any) {
      console.error("Support message error:", error);
      res.status(500).json({ message: "Error sending support message", error: error.message });
    }
  });

  // Note: Instagram routes have been consolidated
  // The previous duplicate routes were removed to prevent conflicts
  // See the implementation around line 1299 for the current Instagram integration
  
  // Instagram Webhook Routes
  // Webhook verification endpoint for Instagram
  app.get('/instagram/webhook', (req, res) => {
    InstagramService.verifyWebhook(req, res);
  });

  // Webhook event handler endpoint for Instagram
  app.post('/instagram/webhook', (req, res) => {
    InstagramService.handleWebhookEvent(req, res);
  });

  // Team Member Routes
  // Get all team members for the current user (where user is the owner)
  app.get("/api/team-members", isAuthenticated, async (req, res) => {
    try {
      const user = req.user as any;
      const teamMembers = await storage.getTeamMembers(user.id);
      res.json(teamMembers);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // Get team memberships for the current user (where user is a member of others' teams)
  app.get("/api/team-memberships", isAuthenticated, async (req, res) => {
    try {
      const user = req.user as any;
      const memberships = await storage.getTeamMemberships(user.id);
      res.json(memberships);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // Get a specific team member
  app.get("/api/team-members/:id", isAuthenticated, async (req, res) => {
    try {
      const memberId = parseInt(req.params.id);
      const teamMember = await storage.getTeamMember(memberId);
      
      if (!teamMember) {
        return res.status(404).json({ message: "Team member not found" });
      }
      
      // Ensure user is either the owner or the member
      const user = req.user as any;
      if (teamMember.ownerId !== user.id && teamMember.memberId !== user.id) {
        return res.status(403).json({ message: "Forbidden" });
      }
      
      res.json(teamMember);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // Create a new team member (invite)
  app.post("/api/team-members", isAuthenticated, async (req, res) => {
    try {
      const user = req.user as any;
      
      // Check if user has permission to add team members (based on subscription plan)
      const userPlan = user.currentPlan || 'free';
      const plans = await storage.getSubscriptionPlans();
      const currentPlan = plans.find(plan => plan.name.toLowerCase() === userPlan.toLowerCase());
      
      if (!currentPlan || !currentPlan.hasTeamMembers) {
        return res.status(403).json({ 
          message: "Your current plan doesn't support team members",
          code: "PLAN_RESTRICTION"
        });
      }
      
      // Check if user has reached team member limit
      if (currentPlan.maxTeamMembers !== null) {
        const existingMembers = await storage.getTeamMembers(user.id);
        if (existingMembers.length >= currentPlan.maxTeamMembers) {
          return res.status(403).json({ 
            message: "You have reached the maximum number of team members for your plan",
            code: "MEMBER_LIMIT_REACHED"
          });
        }
      }
      
      // Generate a random invite token
      const inviteToken = Math.random().toString(36).substring(2, 15) + 
                         Math.random().toString(36).substring(2, 15);
      
      // Set expiration date for invitation (48 hours from now)
      const expiresAt = new Date();
      expiresAt.setHours(expiresAt.getHours() + 48);
      
      const validatedData = insertTeamMemberSchema.parse({
        ...req.body,
        ownerId: user.id,
        inviteToken,
        expiresAt,
        status: 'pending'
      });
      
      // Check if team member with this email already exists
      const existingMember = await storage.getTeamMemberByEmail(user.id, validatedData.inviteEmail);
      if (existingMember) {
        return res.status(400).json({ 
          message: "A team member with this email has already been invited",
          code: "DUPLICATE_INVITE"
        });
      }
      
      const teamMember = await storage.createTeamMember(validatedData);
      
      // Here you would typically send an email to the invited user with the invite link
      // For now, we'll just return the team member data including the token
      
      res.status(201).json(teamMember);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  // Accept team invitation
  app.post("/api/team-invitations/:token/accept", isAuthenticated, async (req, res) => {
    try {
      const token = req.params.token;
      const user = req.user as any;
      
      // Find invitation by token
      const invitation = await storage.getTeamMemberByToken(token);
      if (!invitation) {
        return res.status(404).json({ message: "Invitation not found" });
      }
      
      // Check if invitation has expired
      if (invitation.expiresAt && new Date(invitation.expiresAt) < new Date()) {
        return res.status(400).json({ 
          message: "This invitation has expired",
          code: "INVITATION_EXPIRED"
        });
      }
      
      // Check if the email matches
      if (invitation.inviteEmail !== user.email) {
        return res.status(403).json({ 
          message: "This invitation is for a different email address",
          code: "EMAIL_MISMATCH"
        });
      }
      
      // Update invitation status and set the member ID
      const updatedInvitation = await storage.updateTeamMember(invitation.id, {
        status: 'active',
        memberId: user.id,
        inviteToken: null // Clear the token as it's no longer needed
      });
      
      res.json(updatedInvitation);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // Decline team invitation
  app.post("/api/team-invitations/:token/decline", isAuthenticated, async (req, res) => {
    try {
      const token = req.params.token;
      const user = req.user as any;
      
      // Find invitation by token
      const invitation = await storage.getTeamMemberByToken(token);
      if (!invitation) {
        return res.status(404).json({ message: "Invitation not found" });
      }
      
      // Check if the email matches
      if (invitation.inviteEmail !== user.email) {
        return res.status(403).json({ message: "This invitation is for a different email address" });
      }
      
      // Update invitation status
      const updatedInvitation = await storage.updateTeamMember(invitation.id, {
        status: 'declined',
        inviteToken: null // Clear the token as it's no longer needed
      });
      
      res.json(updatedInvitation);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // Update team member (change role, etc.)
  app.put("/api/team-members/:id", isAuthenticated, async (req, res) => {
    try {
      const memberId = parseInt(req.params.id);
      const user = req.user as any;
      
      // Get the team member
      const teamMember = await storage.getTeamMember(memberId);
      if (!teamMember) {
        return res.status(404).json({ message: "Team member not found" });
      }
      
      // Ensure user is the owner of this team
      if (teamMember.ownerId !== user.id) {
        return res.status(403).json({ message: "Forbidden" });
      }
      
      // Update the team member
      const updatedMember = await storage.updateTeamMember(memberId, req.body);
      res.json(updatedMember);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  // Delete team member
  app.delete("/api/team-members/:id", isAuthenticated, async (req, res) => {
    try {
      const memberId = parseInt(req.params.id);
      const user = req.user as any;
      
      // Get the team member
      const teamMember = await storage.getTeamMember(memberId);
      if (!teamMember) {
        return res.status(404).json({ message: "Team member not found" });
      }
      
      // Ensure user is the owner of this team
      if (teamMember.ownerId !== user.id) {
        return res.status(403).json({ message: "Forbidden" });
      }
      
      // Delete the team member
      const success = await storage.deleteTeamMember(memberId);
      if (!success) {
        return res.status(500).json({ message: "Failed to delete team member" });
      }
      
      res.json({ message: "Team member deleted successfully" });
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // Resend invitation
  app.post("/api/team-members/:id/resend-invitation", isAuthenticated, async (req, res) => {
    try {
      const memberId = parseInt(req.params.id);
      const user = req.user as any;
      
      // Get the team member
      const teamMember = await storage.getTeamMember(memberId);
      if (!teamMember) {
        return res.status(404).json({ message: "Team member not found" });
      }
      
      // Ensure user is the owner of this team
      if (teamMember.ownerId !== user.id) {
        return res.status(403).json({ message: "Forbidden" });
      }
      
      // Check if member is still in pending status
      if (teamMember.status !== 'pending') {
        return res.status(400).json({ 
          message: "This invitation has already been accepted or declined",
          code: "INVALID_STATUS"
        });
      }
      
      // Generate a new token and update expiration
      const inviteToken = Math.random().toString(36).substring(2, 15) + 
                         Math.random().toString(36).substring(2, 15);
      
      const expiresAt = new Date();
      expiresAt.setHours(expiresAt.getHours() + 48);
      
      // Update the invitation
      const updatedMember = await storage.updateTeamMember(memberId, {
        inviteToken,
        expiresAt
      });
      
      // Here you would typically send a new email to the invited user
      
      res.json(updatedMember);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // TikTok Auth Endpoints
  // -------------------------------------------------------------------------
  
  // Generate TikTok auth URL
  app.get("/api/tiktok/auth-url", isAuthenticated, async (req, res) => {
    try {
      const authUrl = await TikTokService.generateAuthLink();
      res.json({ url: authUrl });
    } catch (error: any) {
      console.error("TikTok auth URL generation error:", error);
      res.status(500).json({ 
        message: error.message || "Failed to generate TikTok authorization URL",
        errorType: "TIKTOK_AUTH_URL_ERROR"
      });
    }
  });

  // TikTok OAuth callback endpoint
  app.get("/api/tiktok/callback", async (req, res) => {
    try {
      const { code } = req.query;
      
      if (!code) {
        console.error("TikTok callback missing code parameter");
        return res.redirect("/connect?error=tiktok_missing_code");
      }
      
      // Store the authorization code in a temporary token to be processed client-side
      const tokenData = {
        code: code as string,
        platform: "tiktok",
        timestamp: Date.now(),
        // Include the userId for completing the auth if no session exists when token is processed
        userId: req.isAuthenticated() ? (req.user as any).id : undefined
      };
      
      console.log('Creating temp token with data:', {
        codePresent: !!tokenData.code,
        timestamp: new Date(tokenData.timestamp).toISOString(),
        userIdPresent: !!tokenData.userId
      });
      
      const tempToken = Buffer.from(JSON.stringify(tokenData)).toString('base64');
      
      // Redirect the user back to the connect page with success message and temp token
      return res.redirect(`/connect?action=tiktok_connect&token=${encodeURIComponent(tempToken)}`);
    } catch (error: any) {
      console.error("TikTok callback GET error:", error);
      
      // Create a detailed error message
      const errorMessage = error.message || "Unknown error";
      let errorParam = 'tiktok_unknown_error';
      let errorDetails = '';
      
      if (errorMessage.includes('code')) {
        errorParam = 'tiktok_invalid_code';
      } else if (errorMessage.includes('token')) {
        errorParam = 'tiktok_token_error';
      } else if (errorMessage.includes('authentication') || errorMessage.includes('credentials')) {
        errorParam = 'tiktok_auth_failed';
      }
      
      // Add detailed error message for debugging
      errorDetails = `&message=${encodeURIComponent(errorMessage)}`;
      console.log(`Redirecting with error: ${errorParam}, details: ${errorMessage}`);
      
      return res.redirect(`/connect?error=${errorParam}${errorDetails}`);
    }
  });

  // TikTok complete-auth endpoint for completing connection after redirect
  app.post("/api/tiktok/complete-auth", async (req, res) => {
    try {
      const { token } = req.body;
      
      if (!token) {
        return res.status(400).json({ 
          message: "Token is required",
          errorType: "INVALID_REQUEST" 
        });
      }
      
      try {
        // Decode and parse the token
        const tokenData = JSON.parse(Buffer.from(token, 'base64').toString());
        const { code, userId: tokenUserId } = tokenData;
        
        if (!code) {
          return res.status(400).json({ 
            message: "Authorization code is missing from token",
            errorType: "INVALID_TOKEN" 
          });
        }
        
        // Determine the user ID to use
        // First try the authenticated user, then fall back to the ID in the token
        let userId;
        
        if (req.isAuthenticated()) {
          userId = (req.user as any).id;
        } else if (tokenUserId) {
          userId = tokenUserId;
        } else {
          return res.status(401).json({ 
            message: "User not authenticated and no user ID in token",
            errorType: "AUTH_REQUIRED" 
          });
        }
        
        // Complete the authorization
        const tiktokAccount = await TikTokService.handleCallback(userId, code);
        
        if (!tiktokAccount) {
          return res.status(400).json({ 
            message: "Failed to get TikTok account details", 
            errorType: "TIKTOK_API_ERROR" 
          });
        }
        
        // Return success response with account details
        res.json({
          success: true,
          account: tiktokAccount
        });
      } catch (parseError) {
        console.error("Error parsing TikTok auth token:", parseError);
        return res.status(400).json({
          message: "Invalid token format",
          errorType: "INVALID_TOKEN"
        });
      }
    } catch (error: any) {
      console.error("Error completing TikTok auth:", error);
      
      let statusCode = 500;
      let errorType = "TIKTOK_AUTH_ERROR";
      
      // Handle various error types
      if (error.message.includes('invalid_client')) {
        statusCode = 401;
        errorType = "AUTHENTICATION_FAILED";
      } else if (error.message.includes('invalid_grant')) {
        statusCode = 401;
        errorType = "INVALID_TOKEN";
      }
      
      res.status(statusCode).json({
        message: error.message || "Error completing TikTok authentication",
        errorType
      });
    }
  });

  // Post to TikTok
  app.post("/api/tiktok/post", isAuthenticated, async (req, res) => {
    try {
      const { content, mediaUrl } = req.body;
      const user = req.user as any;
      
      if (!content) {
        return res.status(400).json({ 
          message: "Content is required", 
          errorType: "MISSING_CONTENT" 
        });
      }
      
      if (!mediaUrl) {
        return res.status(400).json({ 
          message: "TikTok posts require a video file", 
          errorType: "MISSING_MEDIA" 
        });
      }
      
      // Check if TikTok account is connected
      const tiktokAccount = await storage.getSocialAccountByPlatform(user.id, 'tiktok');
      
      if (!tiktokAccount) {
        return res.status(400).json({ 
          message: "TikTok account not connected", 
          errorType: "ACCOUNT_NOT_CONNECTED" 
        });
      }
      
      // Post to TikTok
      const result = await TikTokService.postToTikTok(
        user.id,
        content,
        mediaUrl
      );
      
      // Create a post record in the database
      const post = await storage.createPost({
        userId: user.id,
        content,
        mediaUrls: [mediaUrl],
        platforms: ['tiktok'],
        status: 'published',
        scheduledAt: null
      });
      
      res.json(post);
    } catch (error: any) {
      console.error("TikTok post error:", error);
      
      // Handle various error types
      if (error.message.includes('expired') || error.message.includes('invalid_token')) {
        return res.status(401).json({ 
          message: "TikTok authorization has expired. Please reconnect your account.", 
          errorType: "TOKEN_EXPIRED" 
        });
      }
      
      if (error.message.includes('permission') || error.message.includes('scope')) {
        return res.status(403).json({ 
          message: "Missing permissions to post to TikTok. Please reconnect with proper permissions.", 
          errorType: "PERMISSION_DENIED" 
        });
      }
      
      if (error.message.includes('rate limit') || error.message.includes('too many requests')) {
        return res.status(429).json({ 
          message: "TikTok posting rate limit exceeded. Please try again later.", 
          errorType: "RATE_LIMIT_EXCEEDED" 
        });
      }
      
      res.status(500).json({
        message: error.message || "Error posting to TikTok",
        errorType: "TIKTOK_POST_ERROR"
      });
    }
  });
  
  // YouTube Auth Endpoints
  // -------------------------------------------------------------------------

  // Generate YouTube auth URL
  app.get("/api/youtube/auth-url", isAuthenticated, async (req, res) => {
    try {
      const authUrl = await YouTubeService.generateAuthLink();
      res.json({ url: authUrl });
    } catch (error: any) {
      console.error("YouTube auth URL generation error:", error);
      res.status(500).json({ 
        message: error.message || "Failed to generate YouTube authorization URL",
        errorType: "YOUTUBE_AUTH_URL_ERROR"
      });
    }
  });

  // YouTube OAuth callback endpoint
  app.get("/api/youtube/callback", async (req, res) => {
    try {
      const { code } = req.query;
      
      if (!code) {
        console.error("YouTube callback missing code parameter");
        return res.redirect("/connect?error=youtube_missing_code");
      }
      
      // Store the authorization code in a temporary token to be processed client-side
      const tokenData = {
        code: code as string,
        platform: "youtube",
        timestamp: Date.now(),
        // Include the userId for completing the auth if no session exists when token is processed
        userId: req.isAuthenticated() ? (req.user as any).id : undefined
      };
      
      console.log('Creating temp token with data:', {
        codePresent: !!tokenData.code,
        timestamp: new Date(tokenData.timestamp).toISOString(),
        userIdPresent: !!tokenData.userId
      });
      
      const tempToken = Buffer.from(JSON.stringify(tokenData)).toString('base64');
      
      // Redirect the user back to the connect page with success message and temp token
      return res.redirect(`/connect?action=youtube_connect&token=${encodeURIComponent(tempToken)}`);
    } catch (error: any) {
      console.error("YouTube callback GET error:", error);
      
      // Create a detailed error message
      const errorMessage = error.message || "Unknown error";
      let errorParam = 'youtube_unknown_error';
      let errorDetails = '';
      
      if (errorMessage.includes('code')) {
        errorParam = 'youtube_invalid_code';
      } else if (errorMessage.includes('token')) {
        errorParam = 'youtube_token_error';
      } else if (errorMessage.includes('authentication') || errorMessage.includes('credentials')) {
        errorParam = 'youtube_auth_failed';
      }
      
      // Add detailed error message for debugging
      errorDetails = `&message=${encodeURIComponent(errorMessage)}`;
      console.log(`Redirecting with error: ${errorParam}, details: ${errorMessage}`);
      
      return res.redirect(`/connect?error=${errorParam}${errorDetails}`);
    }
  });

  // YouTube complete-auth endpoint for completing connection after redirect
  app.post("/api/youtube/complete-auth", async (req, res) => {
    try {
      const { token } = req.body;
      
      if (!token) {
        return res.status(400).json({ 
          message: "Token is required",
          errorType: "INVALID_REQUEST" 
        });
      }
      
      try {
        // Decode and parse the token
        const tokenData = JSON.parse(Buffer.from(token, 'base64').toString());
        const { code, userId: tokenUserId } = tokenData;
        
        if (!code) {
          return res.status(400).json({ 
            message: "Authorization code is missing from token",
            errorType: "INVALID_TOKEN" 
          });
        }
        
        // Determine the user ID to use
        // First try the authenticated user, then fall back to the ID in the token
        let userId;
        
        if (req.isAuthenticated()) {
          userId = (req.user as any).id;
        } else if (tokenUserId) {
          userId = tokenUserId;
        } else {
          return res.status(401).json({ 
            message: "User not authenticated and no user ID in token",
            errorType: "AUTH_REQUIRED" 
          });
        }
        
        // Complete the authorization
        const youtubeAccount = await YouTubeService.handleCallback(userId, code);
        
        if (!youtubeAccount) {
          return res.status(400).json({ 
            message: "Failed to get YouTube account details", 
            errorType: "YOUTUBE_API_ERROR" 
          });
        }
        
        // Return success response with account details
        res.json({
          success: true,
          account: youtubeAccount
        });
      } catch (parseError) {
        console.error("Error parsing YouTube auth token:", parseError);
        return res.status(400).json({
          message: "Invalid token format",
          errorType: "INVALID_TOKEN"
        });
      }
    } catch (error: any) {
      console.error("Error completing YouTube auth:", error);
      
      let statusCode = 500;
      let errorType = "YOUTUBE_AUTH_ERROR";
      
      // Handle various error types
      if (error.message.includes('invalid_client')) {
        statusCode = 401;
        errorType = "AUTHENTICATION_FAILED";
      } else if (error.message.includes('invalid_grant')) {
        statusCode = 401;
        errorType = "INVALID_TOKEN";
      }
      
      res.status(statusCode).json({
        message: error.message || "Error completing YouTube authentication",
        errorType
      });
    }
  });

  // Post to YouTube
  app.post("/api/youtube/post", isAuthenticated, async (req, res) => {
    try {
      const { content, mediaUrl } = req.body;
      const user = req.user as any;
      
      if (!content) {
        return res.status(400).json({ 
          message: "Content is required", 
          errorType: "MISSING_CONTENT" 
        });
      }
      
      if (!mediaUrl) {
        return res.status(400).json({ 
          message: "YouTube posts require a video file", 
          errorType: "MISSING_MEDIA" 
        });
      }
      
      // Check if YouTube account is connected
      const youtubeAccount = await storage.getSocialAccountByPlatform(user.id, 'youtube');
      
      if (!youtubeAccount) {
        return res.status(400).json({ 
          message: "YouTube account not connected", 
          errorType: "ACCOUNT_NOT_CONNECTED" 
        });
      }
      
      // Post to YouTube
      const result = await YouTubeService.postToYouTube(
        user.id,
        content,
        mediaUrl
      );
      
      // Create a post record in the database
      const post = await storage.createPost({
        userId: user.id,
        content,
        mediaUrls: [mediaUrl],
        platforms: ['youtube'],
        status: 'published',
        scheduledAt: null
      });
      
      res.json(post);
    } catch (error: any) {
      console.error("YouTube post error:", error);
      
      // Handle various error types
      if (error.message.includes('expired') || error.message.includes('invalid_token')) {
        return res.status(401).json({ 
          message: "YouTube authorization has expired. Please reconnect your account.", 
          errorType: "TOKEN_EXPIRED" 
        });
      }
      
      if (error.message.includes('permission') || error.message.includes('scope')) {
        return res.status(403).json({ 
          message: "Missing permissions to post to YouTube. Please reconnect with proper permissions.", 
          errorType: "PERMISSION_DENIED" 
        });
      }
      
      if (error.message.includes('rate limit') || error.message.includes('too many requests')) {
        return res.status(429).json({ 
          message: "YouTube posting rate limit exceeded. Please try again later.", 
          errorType: "RATE_LIMIT_EXCEEDED" 
        });
      }
      
      res.status(500).json({
        message: error.message || "Error posting to YouTube",
        errorType: "YOUTUBE_POST_ERROR"
      });
    }
  });

  const httpServer = createServer(app);

  return httpServer;
}
