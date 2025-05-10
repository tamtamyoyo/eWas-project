import { TwitterApi } from 'twitter-api-v2';
import { storage } from '../storage';

// Check if API keys are present
if (!process.env.TWITTER_API_KEY || !process.env.TWITTER_API_SECRET) {
  console.error('Twitter API keys are missing. Please set TWITTER_API_KEY and TWITTER_API_SECRET environment variables.');
}

// Initialize the base Twitter client safely only when needed
const getTwitterClient = () => {
  if (!process.env.TWITTER_API_KEY || !process.env.TWITTER_API_SECRET) {
    throw new Error('Twitter API keys are missing. Please set TWITTER_API_KEY and TWITTER_API_SECRET environment variables.');
  }
  
  // Using type assertion to resolve typing issues with the Twitter API library
  return new TwitterApi({
    appKey: process.env.TWITTER_API_KEY as string,
    appSecret: process.env.TWITTER_API_SECRET as string,
  } as any);
};

// Get user Twitter client with user tokens
const getUserTwitterClient = (accessToken: string, accessSecret: string) => {
  if (!process.env.TWITTER_API_KEY || !process.env.TWITTER_API_SECRET) {
    throw new Error('Twitter API keys are missing. Please set TWITTER_API_KEY and TWITTER_API_SECRET environment variables.');
  }
  
  if (!accessToken || !accessSecret) {
    throw new Error('Twitter user tokens are missing. User needs to reconnect their account.');
  }
  
  // Using type assertion to resolve typing issues with the Twitter API library
  return new TwitterApi({
    appKey: process.env.TWITTER_API_KEY as string,
    appSecret: process.env.TWITTER_API_SECRET as string,
    accessToken: accessToken,
    accessSecret: accessSecret,
  } as any);
};

console.log('Twitter API configuration available:', {
  appKeyExists: !!process.env.TWITTER_API_KEY,
  appSecretExists: !!process.env.TWITTER_API_SECRET,
  callbackUrlExists: !!process.env.TWITTER_CALLBACK_URL,
});

export const TwitterService = {
  /**
   * Generate OAuth URL for Twitter authorization
   * @returns Twitter OAuth URL and temporary tokens
   */
  async generateAuthLink() {
    const timestamp = new Date().toISOString();
    
    // Use the callback URL from environment variables or fallback to a default
    const callbackUrl = process.env.TWITTER_CALLBACK_URL || 'https://app.ewasl.com/api/twitter/callback';
    console.log(`[${timestamp}] Using Twitter callback URL:`, callbackUrl);
    
    if (!process.env.TWITTER_API_KEY || !process.env.TWITTER_API_SECRET) {
      console.error(`[${timestamp}] Twitter API keys are missing`);
      throw new Error('Twitter API credentials are missing or invalid. Please check your API keys and try again.');
    }
    
    console.log(`[${timestamp}] Attempting to generate Twitter auth link with callback URL:`, callbackUrl);
    console.log(`[${timestamp}] Twitter API key length:`, process.env.TWITTER_API_KEY.length);
    console.log(`[${timestamp}] Twitter API secret length:`, process.env.TWITTER_API_SECRET.length);
    
    try {
      // Initialize Twitter client with the appropriate configuration
      const client = getTwitterClient();
      
      // Generate auth link for the callback URL (using OAuth 1.0a as required by X API)
      console.log(`[${timestamp}] Calling Twitter API to generate auth link...`);
      
      const authLink = await client.generateAuthLink(callbackUrl, { 
        linkMode: 'authorize'
      });
      
      console.log(`[${timestamp}] Twitter auth link generated successfully:`, {
        url: authLink.url ? 'VALID_URL' : 'MISSING_URL',
        oauth_token: authLink.oauth_token ? 'VALID_TOKEN' : 'MISSING_TOKEN',
        oauth_token_secret: authLink.oauth_token_secret ? 'VALID_SECRET' : 'MISSING_SECRET',
      });
      
      return {
        authUrl: authLink.url,
        oauth_token: authLink.oauth_token,
        oauth_token_secret: authLink.oauth_token_secret,
      };
    } catch (error: any) {
      console.error(`[${timestamp}] Error generating Twitter auth link:`, error);
      
      // Detailed error logging for debugging
      if (error.data) {
        console.error(`[${timestamp}] Twitter API error data:`, JSON.stringify(error.data));
      }
      
      if (error.request) {
        console.error(`[${timestamp}] Twitter API request details:`, {
          url: error.request?.options?.url || 'Unknown URL',
          method: error.request?.options?.method || 'Unknown Method',
          headers: error.request?.options?.headers ? 'Present' : 'Missing'
        });
      }
      
      // More detailed error information based on common error patterns
      if (error.code === 32 || error.code === 401 || 
          (error.message && error.message.includes('401 Unauthorized'))) {
        throw new Error('Twitter API authentication failed. Your API keys may be invalid or expired.');
      } else if (error.code === 415 || 
                (error.message && error.message.includes('Unsupported Media Type'))) {
        throw new Error('Twitter API request format error. This may be caused by an issue with the API library.');
      } else if (error.code === 400 || error.code === 403 || 
                (error.message && error.message.includes('callback'))) {
        throw new Error('Invalid Twitter callback URL or insufficient app permissions. Please check your callback URL and app settings.');
      } else if (error.message && error.message.includes('Failed to fetch')) {
        throw new Error('Network error when connecting to Twitter API. Please check your internet connection and try again.');
      } else if (error.message && error.message.includes('timed out')) {
        throw new Error('Twitter API request timed out. This could be due to a temporary Twitter service issue. Please try again later.');
      }
      
      throw new Error('Failed to generate Twitter authorization link: ' + (error.message || 'Unknown error. Twitter may be experiencing issues.'));
    }
  },

  /**
   * Complete the OAuth flow with the callback data
   * @param userId - ID of the user connecting their Twitter account
   * @param oauthToken - OAuth token from callback
   * @param oauthVerifier - OAuth verifier from callback
   * @param oauthTokenSecret - Previously stored OAuth token secret
   * @returns Connected Twitter account details
   */
  async handleCallback(
    userId: number,
    oauthToken: string,
    oauthVerifier: string,
    oauthTokenSecret: string
  ) {
    const timestamp = new Date().toISOString();
    
    try {
      console.log(`[${timestamp}] Processing Twitter callback for user ID ${userId}:`, {
        hasOauthToken: !!oauthToken,
        oauthTokenLength: oauthToken ? oauthToken.length : 0,
        hasOauthVerifier: !!oauthVerifier,
        oauthVerifierLength: oauthVerifier ? oauthVerifier.length : 0,
        hasOauthTokenSecret: !!oauthTokenSecret,
        oauthTokenSecretLength: oauthTokenSecret ? oauthTokenSecret.length : 0,
      });
      
      // Validate parameters
      if (!oauthToken) {
        console.error(`[${timestamp}] Missing OAuth token for Twitter callback`);
        throw new Error('Missing OAuth token. Please try connecting again.');
      }
      
      if (!oauthVerifier) {
        console.error(`[${timestamp}] Missing OAuth verifier for Twitter callback`);
        throw new Error('Missing OAuth verifier. Please try connecting again.');
      }
      
      if (!oauthTokenSecret) {
        console.error(`[${timestamp}] Missing OAuth token secret for Twitter callback`);
        throw new Error('Missing OAuth token secret. Please try connecting again with a new browser session.');
      }
      
      if (!process.env.TWITTER_API_KEY || !process.env.TWITTER_API_SECRET) {
        console.error(`[${timestamp}] Twitter API keys are missing in callback handler`);
        throw new Error('Twitter API credentials are missing. Please contact support.');
      }
      
      console.log(`[${timestamp}] Creating temporary Twitter client for token exchange with API key length: ${process.env.TWITTER_API_KEY.length}`);
      console.log(`[${timestamp}] Twitter callback URL configuration: ${process.env.TWITTER_CALLBACK_URL || 'Not set in environment'}`);
      
      
      // Create a temporary client for token exchange with properly typed parameters
      const tempClient = new TwitterApi({
        appKey: process.env.TWITTER_API_KEY as string,
        appSecret: process.env.TWITTER_API_SECRET as string, 
        accessToken: oauthToken,
        accessSecret: oauthTokenSecret,
      } as any); // Using 'any' to bypass TypeScript checking as the library typing may be incorrect

      console.log(`[${timestamp}] Attempting to exchange OAuth tokens...`);
      
      // Exchange the request tokens for access tokens
      const { client: loggedClient, accessToken, accessSecret } = 
        await tempClient.login(oauthVerifier);
      
      console.log(`[${timestamp}] Successfully exchanged tokens, obtained access tokens`);
      console.log(`[${timestamp}] Fetching Twitter user profile...`);
      
      // Get the user's Twitter profile
      const twitterUser = await loggedClient.v2.me({ 
        'user.fields': ['profile_image_url', 'name', 'username'] 
      });
      
      console.log(`[${timestamp}] Successfully retrieved Twitter profile for:`, {
        username: twitterUser.data.username,
        hasName: !!twitterUser.data.name,
        hasProfileImage: !!twitterUser.data.profile_image_url
      });
      
      // Store the Twitter account in the database
      console.log(`[${timestamp}] Saving Twitter account to database...`);
      
      const twitterAccount = await storage.createSocialAccount({
        userId,
        platform: 'twitter',
        accountId: twitterUser.data.id,
        accountName: twitterUser.data.username, // Use username as accountName
        accessToken,
        accessTokenSecret: accessSecret,
        refreshToken: null,
        username: twitterUser.data.username,
        profileUrl: twitterUser.data.profile_image_url || null,
        name: twitterUser.data.name,
      });
      
      console.log(`[${timestamp}] Twitter account successfully saved with ID:`, twitterAccount.id);
      
      return twitterAccount;
    } catch (error: any) {
      console.error(`[${timestamp}] Error handling Twitter callback:`, error);
      
      // Log details for debugging
      if (error.data) {
        console.error(`[${timestamp}] Twitter callback error data:`, JSON.stringify(error.data));
      }
      
      // Provide more specific error messages
      if (error.message && error.message.includes("Invalid OAuth verifier")) {
        throw new Error('Twitter authentication failed: Invalid OAuth verifier. Please try connecting again.');
      } else if (error.message && error.message.includes("Invalid OAuth access token")) {
        throw new Error('Twitter authentication failed: Invalid OAuth token. Please try reconnecting your account.');
      } else if (error.message && error.message.includes("Could not authenticate")) {
        throw new Error('Twitter authentication failed: Could not authenticate with Twitter. API keys may be invalid.');
      } else if (error.message && error.message.includes("rate limit")) {
        throw new Error('Twitter rate limit exceeded. Please wait a few minutes and try again.');
      }
      
      throw new Error('Failed to complete Twitter authorization: ' + (error.message || 'Unknown error'));
    }
  },

  /**
   * Post a tweet on behalf of the user
   * @param userId - User ID
   * @param content - Tweet content
   * @param mediaIds - Optional Twitter media IDs
   * @returns Posted tweet data
   */
  async postTweet(userId: number, content: string, mediaIds?: string[]) {
    try {
      // Get the user's Twitter account
      const twitterAccount = await storage.getSocialAccountByPlatform(userId, 'twitter');
      
      if (!twitterAccount) {
        throw new Error('Twitter account not connected');
      }
      
      // Check if we have all necessary tokens
      if (!twitterAccount.accessToken || !twitterAccount.accessTokenSecret) {
        throw new Error('Twitter access tokens missing. Please reconnect your account.');
      }
      
      // Create a client with the user's access tokens using our helper function
      const userClient = getUserTwitterClient(
        twitterAccount.accessToken, 
        twitterAccount.accessTokenSecret
      ) as TwitterApi; // Cast to TwitterApi type
      
      // Post the tweet
      // Handle media IDs correctly to match the Twitter API requirements
      let mediaOptions;
      if (mediaIds && mediaIds.length > 0) {
        // Convert to tuple types based on the number of media IDs
        if (mediaIds.length === 1) {
          mediaOptions = { media_ids: [mediaIds[0]] as [string] };
        } else if (mediaIds.length === 2) {
          mediaOptions = { media_ids: [mediaIds[0], mediaIds[1]] as [string, string] };
        } else if (mediaIds.length === 3) {
          mediaOptions = { media_ids: [mediaIds[0], mediaIds[1], mediaIds[2]] as [string, string, string] };
        } else if (mediaIds.length >= 4) {
          mediaOptions = { media_ids: [mediaIds[0], mediaIds[1], mediaIds[2], mediaIds[3]] as [string, string, string, string] };
        }
      }
      
      const tweetData = await userClient.v2.tweet(content, {
        media: mediaOptions
      });
      
      return tweetData;
    } catch (error) {
      console.error('Error posting tweet:', error);
      throw new Error('Failed to post tweet');
    }
  },

  /**
   * Get basic Twitter account stats
   * @param userId - User ID
   * @returns Twitter account stats
   */
  async getAccountStats(userId: number) {
    try {
      // Get the user's Twitter account
      const twitterAccount = await storage.getSocialAccountByPlatform(userId, 'twitter');
      
      if (!twitterAccount) {
        throw new Error('Twitter account not connected');
      }
      
      // Check if we have all necessary tokens
      if (!twitterAccount.accessToken || !twitterAccount.accessTokenSecret) {
        throw new Error('Twitter access tokens missing. Please reconnect your account.');
      }
      
      // Create a client with the user's access tokens using our helper function
      const userClient = getUserTwitterClient(
        twitterAccount.accessToken, 
        twitterAccount.accessTokenSecret
      ) as TwitterApi; // Cast to TwitterApi type
      
      // Get follower count and other user data
      const userData = await userClient.v2.user(twitterAccount.accountId, {
        'user.fields': ['public_metrics', 'profile_image_url', 'description']
      });
      
      if (!userData.data) {
        throw new Error('Failed to retrieve Twitter user data');
      }
      
      // Get recent tweets for engagement analysis
      const tweets = await userClient.v2.userTimeline(twitterAccount.accountId, {
        max_results: 10,
        'tweet.fields': ['public_metrics', 'created_at'],
      });
      
      // Calculate average engagement metrics
      const tweetMetrics = tweets.data.data.map(tweet => tweet.public_metrics);
      const avgEngagement = tweetMetrics.length > 0 
        ? {
            likes: tweetMetrics.reduce((sum, metrics) => sum + (metrics?.like_count || 0), 0) / tweetMetrics.length,
            retweets: tweetMetrics.reduce((sum, metrics) => sum + (metrics?.retweet_count || 0), 0) / tweetMetrics.length,
            replies: tweetMetrics.reduce((sum, metrics) => sum + (metrics?.reply_count || 0), 0) / tweetMetrics.length,
          }
        : { likes: 0, retweets: 0, replies: 0 };
      
      // Using the correct field names from our schema
      const username = twitterAccount.username || twitterAccount.accountName;
      
      return {
        id: twitterAccount.id,
        username,
        name: twitterAccount.name || username,
        profileUrl: twitterAccount.profileUrl || null,
        followers: userData.data.public_metrics?.followers_count || 0,
        following: userData.data.public_metrics?.following_count || 0,
        tweets: userData.data.public_metrics?.tweet_count || 0,
        engagement: avgEngagement,
      };
    } catch (error) {
      console.error('Error getting Twitter account stats:', error);
      throw new Error('Failed to get Twitter account stats');
    }
  }
};