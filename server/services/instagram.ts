import { Request, Response } from 'express';
import { storage } from '../storage';
import { SocialAccount } from '@shared/schema';
import axios from 'axios';
import crypto from 'crypto';

// Replace with your actual verification token
const VERIFY_TOKEN = "eWaslToken123";

// ALWAYS use production host for Instagram redirect URIs
const getHost = (): string => {
  // Always use production domain for Instagram API to avoid OAuth callback issues
  return 'https://app.ewasl.com';
};

// Check if the required environment variables are set
const INSTAGRAM_APP_ID = process.env.INSTAGRAM_APP_ID;
const INSTAGRAM_APP_SECRET = process.env.INSTAGRAM_APP_SECRET;

if (!INSTAGRAM_APP_ID || !INSTAGRAM_APP_SECRET) {
  console.warn('Instagram API credentials are missing. Instagram integration will not work properly.');
}

/**
 * Instagram API service
 */
export const InstagramService = {
  /**
   * Handle webhook verification request from Instagram
   * This is called when Instagram wants to verify our webhook endpoint
   */
  verifyWebhook(req: Request, res: Response) {
    const mode = req.query['hub.mode'];
    const token = req.query['hub.verify_token'];
    const challenge = req.query['hub.challenge'];

    if (mode && token === VERIFY_TOKEN) {
      console.log('Instagram webhook verified successfully');
      res.status(200).send(challenge);
    } else {
      console.error('Instagram webhook verification failed', { mode, token });
      res.sendStatus(403); // Forbidden
    }
  },

  /**
   * Handle incoming webhook events from Instagram
   * This is called when Instagram sends events to our webhook
   */
  handleWebhookEvent(req: Request, res: Response) {
    try {
      const body = req.body;
      
      console.log('Received Instagram webhook event:', JSON.stringify(body, null, 2));
      
      // Process different event types
      if (body.object === 'instagram') {
        // Handle Instagram specific events
        body.entry?.forEach(async (entry: any) => {
          const webhookEvent = entry.changes?.[0]?.value;
          
          if (webhookEvent) {
            // Record the event for analytics
            await processInstagramEvent(webhookEvent);
          }
        });
      }
      
      // Return a '200 OK' response to acknowledge receipt of the event
      res.status(200).json({ received: true });
    } catch (error) {
      console.error('Error handling Instagram webhook event:', error);
      res.status(500).json({ error: 'Error processing webhook' });
    }
  },

  /**
   * Generate authentication link for Instagram
   */
  generateAuthLink() {
    try {
      // Using Facebook Login with Instagram permissions for Business API
      const facebookAuthUrl = 'https://www.facebook.com/v18.0/dialog/oauth';
      const clientId = process.env.FACEBOOK_APP_ID; // Use Facebook App ID for Instagram Business API
      const redirectUri = `${getHost()}/api/instagram/callback`;
      const responseType = 'code';
      const state = 'instagram-' + Math.random().toString(36).substring(2, 15);
      
      // Business API requires Facebook permissions to access Instagram Business accounts
      const scope = 'public_profile,email,pages_show_list,pages_read_engagement,pages_manage_posts,instagram_basic,instagram_content_publish,instagram_manage_insights';
      
      if (!clientId) {
        console.error('Facebook App ID not configured in environment variables');
        throw new Error('Facebook App ID not configured');
      }
      
      console.log(`Generating Instagram auth link with Facebook App ID: ${clientId.substring(0, 4)}...`);
      console.log(`Using Instagram redirect URI: ${redirectUri}`);
      
      // Build the auth URL with all required parameters
      const authUrl = `${facebookAuthUrl}?` +
        `client_id=${clientId}` +
        `&redirect_uri=${encodeURIComponent(redirectUri)}` +
        `&state=${state}` +
        `&response_type=${responseType}` + 
        `&scope=${encodeURIComponent(scope)}`;
      
      console.log(`Generated Instagram auth URL via Facebook: ${authUrl.substring(0, 75)}...`);
      
      return { authUrl };
    } catch (error: any) {
      console.error('Error generating Instagram auth link:', error);
      throw new Error(`Failed to generate Instagram authorization link: ${error.message}`);
    }
  },

  /**
   * Handle callback from Instagram OAuth flow
   * @param userId - User ID from our system
   * @param code - Authorization code from Instagram
   */
  async handleCallback(userId: number, code: string) {
    try {
      if (!code) {
        console.error('Missing Instagram authorization code');
        throw new Error('Missing Instagram authorization code');
      }
      
      // Mask the code for logging (show only first and last few chars)
      const maskedCode = code.substring(0, 4) + '...' + code.substring(code.length - 4);
      console.log(`Handling Instagram callback for user ${userId} with code: ${maskedCode}`);
      
      // Validate API credentials (we use Facebook's credentials for Instagram Business API)
      if (!process.env.FACEBOOK_APP_ID || !process.env.FACEBOOK_APP_SECRET) {
        console.error('Facebook API credentials not configured (required for Instagram Business API)');
        throw new Error('Facebook API credentials not configured (required for Instagram Business API)');
      }
      
      console.log('Facebook credentials available - proceeding with Instagram token exchange');
      
      // Exchange the authorization code for an access token using Facebook Graph API
      const redirectUri = `${getHost()}/api/instagram/callback`;
      
      console.log(`Using redirect URI for token exchange: ${redirectUri}`);
      
      // Function to generate the appsecret_proof required by Facebook
      const generateAppSecretProof = (accessToken: string, appSecret: string): string => {
        // Using the imported crypto module
        return crypto
          .createHmac('sha256', appSecret)
          .update(accessToken)
          .digest('hex');
      };
      
      // First, exchange the code for a Facebook access token
      try {
        const tokenResponse = await axios.get('https://graph.facebook.com/v18.0/oauth/access_token', {
          params: {
            client_id: process.env.FACEBOOK_APP_ID,
            client_secret: process.env.FACEBOOK_APP_SECRET,
            redirect_uri: redirectUri,
            code: code
          }
        });
        
        if (!tokenResponse.data.access_token) {
          console.error('Facebook token response missing access_token:', tokenResponse.data);
          throw new Error('Failed to get access token from Facebook');
        }
        
        const accessToken = tokenResponse.data.access_token;
        console.log('Successfully obtained Facebook access token');
        
        // Generate the appsecret_proof for secure API calls
        const appSecretProof = generateAppSecretProof(accessToken, process.env.FACEBOOK_APP_SECRET || '');
        
        // Get user info with appsecret_proof for security
        const userResponse = await axios.get('https://graph.facebook.com/v18.0/me', {
          params: {
            fields: 'id,name,email',
            access_token: accessToken,
            appsecret_proof: appSecretProof
          }
        });
        
        console.log(`Facebook user info retrieved: user ID ${userResponse.data.id}`);
        
        // Get the user's Instagram business accounts with appsecret_proof
        const accountsResponse = await axios.get('https://graph.facebook.com/v18.0/me/accounts', {
          params: {
            access_token: accessToken,
            appsecret_proof: appSecretProof
          }
        });
        
        console.log(`Retrieved ${accountsResponse.data.data?.length || 0} Facebook pages`);
        
        if (!accountsResponse.data.data || accountsResponse.data.data.length === 0) {
          throw new Error('No Facebook Pages found. You need a Facebook Page to connect your Instagram Business account.');
        }
        
        // For each Facebook page, check if there's a connected Instagram business account
        let instagramBusinessAccount = null;
        let pageAccessToken = null;
        let pageName = null;
        
        for (const page of accountsResponse.data.data) {
          console.log(`Checking page ${page.name} for Instagram business account...`);
          
          try {
            // Generate page-specific appsecret_proof
            const pageAppSecretProof = generateAppSecretProof(page.access_token, process.env.FACEBOOK_APP_SECRET || '');
            
            const pageResponse = await axios.get(`https://graph.facebook.com/v18.0/${page.id}`, {
              params: {
                fields: 'instagram_business_account',
                access_token: page.access_token,
                appsecret_proof: pageAppSecretProof
              }
            });
            
            if (pageResponse.data.instagram_business_account) {
              instagramBusinessAccount = pageResponse.data.instagram_business_account;
              pageAccessToken = page.access_token;
              pageName = page.name;
              console.log(`Found Instagram business account for page ${page.name}`);
              break;
            }
          } catch (pageError) {
            console.error(`Error checking page ${page.id} for Instagram account:`, pageError);
            // Continue to next page
          }
        }
        
        if (!instagramBusinessAccount) {
          throw new Error('No Instagram Business account found connected to your Facebook Pages. Please connect an Instagram account to one of your Facebook Pages in the Facebook Business Manager.');
        }
        
        // Generate appsecret_proof for the page access token
        const pageAppSecretProof = pageAccessToken ? 
          generateAppSecretProof(pageAccessToken, process.env.FACEBOOK_APP_SECRET || '') : '';
        
        // Get Instagram account details with appsecret_proof
        const instagramResponse = await axios.get(`https://graph.facebook.com/v18.0/${instagramBusinessAccount.id}`, {
          params: {
            fields: 'id,username,profile_picture_url',
            access_token: pageAccessToken,
            appsecret_proof: pageAppSecretProof
          }
        });
        
        console.log(`Retrieved Instagram account details for ${instagramResponse.data.username}`);
        
        // Store the Instagram account in our database
        const accountInfo = {
          accessToken: pageAccessToken,
          appSecret: process.env.FACEBOOK_APP_SECRET, // Store to generate appsecret_proof for future calls
          accountId: instagramBusinessAccount.id,
          username: instagramResponse.data.username,
          profileUrl: instagramResponse.data.profile_picture_url,
          accountName: pageName || instagramResponse.data.username
        };
        const account = await this.initializeAccount(userId, accountInfo);
        
        console.log(`Successfully connected Instagram account for user ${userId}: ${instagramResponse.data.username}`);
        return { success: true, account };
      } catch (apiError: any) {
        console.error('Error during Instagram API token exchange:', apiError.response?.data || apiError.message);
        throw new Error(`Instagram API error: ${apiError.response?.data?.error?.message || apiError.message}`);
      }
    } catch (error: any) {
      console.error('Instagram callback error:', error);
      throw new Error(`Instagram callback failed: ${error.message || 'Unknown error'}`);
    }
  },

  /**
   * Post content to Instagram
   */
  async postToInstagram(userId: number, content: string, mediaUrl: string) {
    try {
      // This would make an actual API call to Instagram
      console.log(`Posting to Instagram for user ${userId}: ${content}`);
      
      // Simulate successful post
      return {
        success: true,
        id: 'instagram-post-id',
        url: 'https://instagram.com/post/123',
        posted_at: new Date()
      };
    } catch (error) {
      console.error('Instagram post error:', error);
      return {
        success: false,
        message: 'Failed to post to Instagram',
        limitations: {
          media_required: true,
          max_text_length: 2200
        }
      };
    }
  },

  /**
   * Get account statistics from Instagram
   */
  async getAccountStats(userId: number) {
    try {
      // This would make an actual API call to Instagram
      console.log(`Getting Instagram account stats for user ${userId}`);
      
      // Return simulated stats
      return {
        followers: 1250,
        following: 450,
        posts: 78,
        engagement_rate: 3.2,
        impressions_last_week: 5600,
        profile_views_last_week: 320
      };
    } catch (error) {
      console.error('Instagram stats error:', error);
      throw error;
    }
  },

  /**
   * Initialize Instagram API for a user account
   * @param userId - User ID in our system
   * @param accountInfo - Instagram account information or authorization code
   */
  async initializeAccount(userId: number, accountInfo: any) {
    try {
      // Store the Instagram account in the database
      const account: SocialAccount | undefined = await storage.getSocialAccountByPlatform(userId, 'instagram');
      
      // If accountInfo is a string, it's the old method with just the code
      // If it's an object, it contains the account details extracted from the API
      const isDetailedInfo = typeof accountInfo === 'object';
      
      // Set default values in case we don't have detailed info
      const accountDetails = {
        accessToken: isDetailedInfo ? accountInfo.accessToken : 'instagram-access-token',
        refreshToken: '', // Instagram Business API doesn't use refresh tokens in the same way
        accountId: isDetailedInfo ? accountInfo.accountId : 'instagram-user-id',
        accountName: isDetailedInfo ? accountInfo.accountName : 'Instagram Account',
        username: isDetailedInfo ? accountInfo.username : 'instagram-username',
        profileUrl: isDetailedInfo ? accountInfo.profileUrl : 'https://instagram.com/username'
      };
      
      if (account) {
        console.log(`Updating existing Instagram account for user ${userId}`);
        // Update existing account
        return await storage.updateSocialAccount(account.id, {
          accessToken: accountDetails.accessToken,
          refreshToken: accountDetails.refreshToken,
          tokenExpiry: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000), // 60 days from now
          username: accountDetails.username,
          accountName: accountDetails.accountName,
          profileUrl: accountDetails.profileUrl,
          isConnected: true
        });
      } else {
        console.log(`Creating new Instagram account for user ${userId}`);
        // Create new account
        return await storage.createSocialAccount({
          userId,
          platform: 'instagram',
          accountId: accountDetails.accountId,
          accountName: accountDetails.accountName,
          accessToken: accountDetails.accessToken,
          refreshToken: accountDetails.refreshToken,
          tokenExpiry: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000), // 60 days from now
          username: accountDetails.username,
          profileUrl: accountDetails.profileUrl,
          isConnected: true,
          name: accountDetails.accountName
        });
      }
    } catch (error) {
      console.error('Error initializing Instagram account:', error);
      throw error;
    }
  }
};

/**
 * Process Instagram events for analytics
 */
async function processInstagramEvent(event: any) {
  // Implement logic to process and store Instagram events
  // This could update counts in the userStats table
  
  const eventType = event.event_type || 'unknown';
  const instagramUserId = event.user_id;
  
  // Find the user associated with this Instagram account
  try {
    // Find social account by platform user ID
    // Update analytics accordingly
    console.log(`Processed Instagram ${eventType} event for user ${instagramUserId}`);
  } catch (error) {
    console.error('Error processing Instagram event:', error);
  }
}