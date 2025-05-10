import { storage } from '../storage';
import axios, { AxiosError } from 'axios';

// Check if API keys are present
if (!process.env.SNAPCHAT_CLIENT_ID || !process.env.SNAPCHAT_CLIENT_SECRET) {
  console.error('Snapchat API credentials are missing. Please set SNAPCHAT_CLIENT_ID and SNAPCHAT_CLIENT_SECRET environment variables.');
}

// Get the correct callback URL based on environment
const getSnapchatCallbackUrl = (): string => {
  // First priority: Use the explicitly configured callback URL if available
  if (process.env.SNAPCHAT_CALLBACK_URL) {
    console.log('Using configured SNAPCHAT_CALLBACK_URL:', process.env.SNAPCHAT_CALLBACK_URL);
    return process.env.SNAPCHAT_CALLBACK_URL;
  }
  
  // For Replit environment
  const replit_domain = process.env.REPL_SLUG && process.env.REPL_OWNER 
    ? `https://${process.env.REPL_SLUG}.${process.env.REPL_OWNER}.repl.co`
    : null;
  
  if (replit_domain) {
    const replitCallback = `${replit_domain}/api/snapchat/callback`;
    console.log('Using Replit domain for callback URL:', replitCallback);
    return replitCallback;
  }
  
  // Fallback to production URL
  const productionCallback = 'https://app.ewasl.com/api/snapchat/callback';
  console.log('Falling back to production URL for callback:', productionCallback);
  return productionCallback;
};

// Log available configuration
console.log('Snapchat API configuration available:', {
  clientIdExists: !!process.env.SNAPCHAT_CLIENT_ID,
  clientSecretExists: !!process.env.SNAPCHAT_CLIENT_SECRET,
  callbackUrlExists: !!process.env.SNAPCHAT_CALLBACK_URL
});

// Helper to format API errors for better diagnostics
const formatAxiosError = (error: any): { message: string, details?: any } => {
  if (axios.isAxiosError(error)) {
    const axiosError = error as AxiosError;
    
    if (axiosError.response) {
      // The request was made and the server responded with a status code
      // that falls out of the range of 2xx
      return {
        message: `API error (${axiosError.response.status}): ${axiosError.message}`,
        details: axiosError.response.data
      };
    } else if (axiosError.request) {
      // The request was made but no response was received
      return {
        message: 'No response received from Snapchat API',
        details: { request: 'Request was sent but no response was received' }
      };
    } else {
      // Something happened in setting up the request that triggered an Error
      return {
        message: `Request configuration error: ${axiosError.message}`
      };
    }
  }
  
  // For non-Axios errors, just return the message
  return {
    message: error.message || 'Unknown error',
    details: error.stack || undefined
  };
};

export const SnapchatService = {
  /**
   * Generate OAuth URL for Snapchat authorization
   * @returns Snapchat OAuth URL for user authorization
   */
  async generateAuthLink() {
    // Make sure we have a valid callback URL
    const callbackUrl = getSnapchatCallbackUrl();
    
    if (!process.env.SNAPCHAT_CLIENT_ID) {
      console.error('Snapchat Client ID is missing');
      throw new Error('Snapchat Client ID is missing. Please set SNAPCHAT_CLIENT_ID environment variable.');
    }
    
    console.log('Generating Snapchat auth link with callback URL:', callbackUrl);
    
    try {
      // The scope required for marketing snapshots (posting content)
      const scope = 'snapchat.marketing.snapshots';
      
      // Generate a state parameter for security (to prevent CSRF)
      const state = Date.now().toString();
      
      // OAuth 2.0 authorization URL for Snapchat
      const authUrl = new URL('https://accounts.snapchat.com/accounts/oauth2/auth');
      authUrl.searchParams.append('client_id', process.env.SNAPCHAT_CLIENT_ID);
      authUrl.searchParams.append('redirect_uri', callbackUrl);
      authUrl.searchParams.append('response_type', 'code');
      authUrl.searchParams.append('scope', scope);
      authUrl.searchParams.append('state', state);
      
      // Save the auth URL for diagnostics
      const authUrlString = authUrl.toString();
      console.log('Generated Snapchat auth URL:', authUrlString);
      
      return { authUrl: authUrlString };
    } catch (error: any) {
      const formattedError = formatAxiosError(error);
      console.error('Error generating Snapchat auth link:', formattedError);
      throw new Error(`Failed to generate Snapchat authorization link: ${formattedError.message}`);
    }
  },

  /**
   * Complete the OAuth flow with the callback data
   * @param userId - ID of the user connecting their Snapchat account
   * @param code - Authorization code from callback
   * @returns Connected Snapchat account details
   */
  async handleCallback(userId: number, code: string) {
    try {
      if (!code) {
        throw new Error('Missing authorization code');
      }
      
      console.log(`Processing Snapchat callback for user ID: ${userId} with authorization code length: ${code.length}`);
      
      if (!process.env.SNAPCHAT_CLIENT_ID || !process.env.SNAPCHAT_CLIENT_SECRET) {
        console.error('Snapchat API credentials are missing');
        throw new Error('Snapchat API credentials are missing. Please set SNAPCHAT_CLIENT_ID and SNAPCHAT_CLIENT_SECRET environment variables.');
      }
      
      const callbackUrl = getSnapchatCallbackUrl();
      console.log('Using callback URL for token exchange:', callbackUrl);
      
      // Exchange authorization code for access token
      try {
        console.log('Requesting access token from Snapchat...');
        
        const tokenParams = new URLSearchParams({
          client_id: process.env.SNAPCHAT_CLIENT_ID,
          client_secret: process.env.SNAPCHAT_CLIENT_SECRET,
          code: code,
          grant_type: 'authorization_code',
          redirect_uri: callbackUrl
        });
        
        console.log('Token request parameters:', {
          client_id: `${process.env.SNAPCHAT_CLIENT_ID.substring(0, 5)}...`,
          redirect_uri: callbackUrl,
          grant_type: 'authorization_code'
        });
        
        const tokenResponse = await axios.post(
          'https://accounts.snapchat.com/login/oauth2/access_token', 
          tokenParams.toString(),
          {
            headers: {
              'Content-Type': 'application/x-www-form-urlencoded'
            }
          }
        );
        
        console.log('Received token response with status:', tokenResponse.status);
        
        const { access_token, refresh_token, expires_in } = tokenResponse.data;
        
        if (!access_token) {
          console.error('No access token received from Snapchat');
          throw new Error('No access token received from Snapchat');
        }
        
        console.log('Successfully obtained Snapchat access token');
        
        // Fetch user profile information
        console.log('Fetching Snapchat user profile...');
        
        const profileResponse = await axios.get('https://adsapi.snapchat.com/v1/me', {
          headers: {
            'Authorization': `Bearer ${access_token}`
          }
        });
        
        console.log('Received profile response with status:', profileResponse.status);
        
        // Extract user profile data
        const snapchatUser = profileResponse.data;
        console.log('Snapchat user profile fetched successfully');
        
        // Identify user properties safely
        const userId_safe = snapchatUser.id || snapchatUser.sub || `snapchat_user_${Date.now()}`;
        const username_safe = snapchatUser.username || snapchatUser.name || 'Snapchat User';
        const name_safe = snapchatUser.name || snapchatUser.username || 'Snapchat User';
        const picture_safe = snapchatUser.picture || null;
        
        console.log('Creating social account record for Snapchat user');
        
        // Store the Snapchat account in the database
        const snapchatAccount = await storage.createSocialAccount({
          userId,
          platform: 'snapchat',
          accountId: userId_safe,
          accountName: username_safe,
          accessToken: access_token,
          accessTokenSecret: null,
          refreshToken: refresh_token || null,
          username: username_safe,
          profileUrl: picture_safe,
          name: name_safe,
          // Add token expiration for refresh logic
          tokenExpiry: new Date(Date.now() + (expires_in * 1000))
        });
        
        console.log('Snapchat account created successfully with ID:', snapchatAccount.id);
        
        return snapchatAccount;
      } catch (tokenError: any) {
        const formattedError = formatAxiosError(tokenError);
        console.error('Error exchanging authorization code for tokens:', formattedError);
        
        // Provide a more specific error message based on the error
        if (tokenError.response?.status === 400) {
          throw new Error(`Authorization code invalid or expired: ${formattedError.message}`);
        } else if (tokenError.response?.status === 401) {
          throw new Error(`Authentication failed: ${formattedError.message}`);
        } else if (tokenError.response?.status === 403) {
          throw new Error(`Permission denied: ${formattedError.message}`);
        } else if (tokenError.code === 'ENOTFOUND' || tokenError.code === 'ETIMEDOUT') {
          throw new Error(`Network error connecting to Snapchat: ${formattedError.message}`);
        }
        
        throw new Error(`Failed to exchange authorization code: ${formattedError.message}`);
      }
    } catch (error: any) {
      const formattedError = formatAxiosError(error);
      console.error('Error handling Snapchat callback:', formattedError);
      throw new Error(`Failed to complete Snapchat authorization: ${formattedError.message}`);
    }
  },

  /**
   * Post content to Snapchat
   * @param userId - User ID
   * @param content - Content caption
   * @param imageUrl - URL to image
   * @returns Posted content data
   */
  async postContent(userId: number, content: string, imageUrl: string) {
    try {
      console.log(`Attempting to post content to Snapchat for user ID: ${userId}`);
      
      // Get the user's Snapchat account
      const snapchatAccount = await storage.getSocialAccountByPlatform(userId, 'snapchat');
      
      if (!snapchatAccount) {
        console.error('Snapchat account not found for user ID:', userId);
        throw new Error('Snapchat account not connected');
      }
      
      // Check if we have a valid access token
      if (!snapchatAccount.accessToken) {
        console.error('Snapchat access token missing for account ID:', snapchatAccount.id);
        throw new Error('Snapchat access token missing. Please reconnect your account.');
      }
      
      // Check if token is expired and refresh if needed
      if (snapchatAccount.tokenExpiry && new Date(snapchatAccount.tokenExpiry) < new Date()) {
        console.log('Snapchat access token expired. Attempting to refresh...');
        
        if (!snapchatAccount.refreshToken) {
          console.error('Snapchat refresh token missing for account ID:', snapchatAccount.id);
          throw new Error('Snapchat refresh token missing. Please reconnect your account.');
        }
        
        await this.refreshAccessToken(userId, snapchatAccount.id, snapchatAccount.refreshToken);
        console.log('Snapchat access token refreshed successfully');
        
        // Get updated account after refresh
        const updatedAccount = await storage.getSocialAccountByPlatform(userId, 'snapchat');
        if (!updatedAccount || !updatedAccount.accessToken) {
          console.error('Failed to refresh Snapchat access token for account ID:', snapchatAccount.id);
          throw new Error('Failed to refresh Snapchat access token');
        }
        
        snapchatAccount.accessToken = updatedAccount.accessToken;
      }
      
      console.log('Posting content to Snapchat API...');
      
      // In a real implementation, you'd use Snapchat's Content Publishing API
      // This is a placeholder as we need the actual marketing API documentation
      const response = await axios.post('https://adsapi.snapchat.com/v1/marketing/snapshots', {
        caption: content,
        media_url: imageUrl
      }, {
        headers: {
          'Authorization': `Bearer ${snapchatAccount.accessToken}`,
          'Content-Type': 'application/json'
        }
      });
      
      console.log('Content posted successfully to Snapchat with status:', response.status);
      
      return response.data;
    } catch (error: any) {
      const formattedError = formatAxiosError(error);
      console.error('Error posting to Snapchat:', formattedError);
      throw new Error(`Failed to post content to Snapchat: ${formattedError.message}`);
    }
  },

  /**
   * Refresh the access token for a Snapchat account
   * @param userId - User ID
   * @param accountId - Social account ID
   * @param refreshToken - Refresh token
   * @returns Updated account with new access token
   */
  async refreshAccessToken(userId: number, accountId: number, refreshToken: string) {
    try {
      console.log(`Refreshing Snapchat access token for user ID: ${userId}, account ID: ${accountId}`);
      
      if (!process.env.SNAPCHAT_CLIENT_ID || !process.env.SNAPCHAT_CLIENT_SECRET) {
        console.error('Snapchat API credentials are missing');
        throw new Error('Snapchat API credentials are missing. Please check your environment variables.');
      }
      
      // Exchange refresh token for new access token
      const tokenResponse = await axios.post('https://accounts.snapchat.com/login/oauth2/access_token', 
        new URLSearchParams({
          client_id: process.env.SNAPCHAT_CLIENT_ID,
          client_secret: process.env.SNAPCHAT_CLIENT_SECRET,
          refresh_token: refreshToken,
          grant_type: 'refresh_token'
        }), {
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded'
          }
        }
      );
      
      console.log('Received token refresh response with status:', tokenResponse.status);
      
      const { access_token, refresh_token, expires_in } = tokenResponse.data;
      
      if (!access_token) {
        console.error('No access token received from refresh token exchange');
        throw new Error('No access token received from Snapchat refresh token exchange');
      }
      
      console.log('Successfully refreshed Snapchat access token');
      
      // Update the stored account with new tokens
      const updatedAccount = await storage.updateSocialAccount(accountId, {
        accessToken: access_token,
        refreshToken: refresh_token || refreshToken, // Use new refresh token if provided, otherwise keep the old one
        tokenExpiry: new Date(Date.now() + (expires_in * 1000))
      });
      
      console.log('Updated Snapchat account record with new tokens');
      
      return updatedAccount;
    } catch (error: any) {
      const formattedError = formatAxiosError(error);
      console.error('Error refreshing Snapchat access token:', formattedError);
      throw new Error(`Failed to refresh Snapchat access token: ${formattedError.message}`);
    }
  },

  /**
   * Get basic Snapchat account stats
   * @param userId - User ID
   * @returns Snapchat account stats
   */
  async getAccountStats(userId: number) {
    try {
      console.log(`Fetching Snapchat account stats for user ID: ${userId}`);
      
      // Get the user's Snapchat account
      const snapchatAccount = await storage.getSocialAccountByPlatform(userId, 'snapchat');
      
      if (!snapchatAccount) {
        console.error('Snapchat account not found for user ID:', userId);
        throw new Error('Snapchat account not connected');
      }
      
      // Check if we have a valid access token
      if (!snapchatAccount.accessToken) {
        console.error('Snapchat access token missing for account ID:', snapchatAccount.id);
        throw new Error('Snapchat access token missing. Please reconnect your account.');
      }
      
      // Check if token is expired and refresh if needed
      if (snapchatAccount.tokenExpiry && new Date(snapchatAccount.tokenExpiry) < new Date()) {
        console.log('Snapchat access token expired. Attempting to refresh...');
        
        if (!snapchatAccount.refreshToken) {
          console.error('Snapchat refresh token missing for account ID:', snapchatAccount.id);
          throw new Error('Snapchat refresh token missing. Please reconnect your account.');
        }
        
        await this.refreshAccessToken(userId, snapchatAccount.id, snapchatAccount.refreshToken);
        console.log('Snapchat access token refreshed successfully');
        
        // Get updated account after refresh
        const updatedAccount = await storage.getSocialAccountByPlatform(userId, 'snapchat');
        if (!updatedAccount || !updatedAccount.accessToken) {
          console.error('Failed to refresh Snapchat access token for account ID:', snapchatAccount.id);
          throw new Error('Failed to refresh Snapchat access token');
        }
        
        snapchatAccount.accessToken = updatedAccount.accessToken;
      }
      
      console.log('Fetching stats from Snapchat API...');
      
      // In a real implementation, you'd fetch actual stats from Snapchat's API
      // This is a placeholder as we need the actual marketing API documentation
      const response = await axios.get(`https://adsapi.snapchat.com/v1/organizations/${snapchatAccount.accountId}/stats`, {
        headers: {
          'Authorization': `Bearer ${snapchatAccount.accessToken}`
        }
      });
      
      console.log('Received stats response with status:', response.status);
      
      const statsData = response.data;
      
      return {
        id: snapchatAccount.id,
        username: snapchatAccount.username || snapchatAccount.accountName,
        name: snapchatAccount.name || snapchatAccount.username || snapchatAccount.accountName,
        profileUrl: snapchatAccount.profileUrl,
        followers: statsData.followers || 0,
        engagement: {
          views: statsData.views || 0,
          interactions: statsData.interactions || 0,
          shares: statsData.shares || 0
        }
      };
    } catch (error: any) {
      const formattedError = formatAxiosError(error);
      console.error('Error getting Snapchat account stats:', formattedError);
      throw new Error(`Failed to get Snapchat account stats: ${formattedError.message}`);
    }
  },
  
  /**
   * Disconnect a Snapchat account
   * @param userId - User ID
   * @returns Success status
   */
  async disconnectAccount(userId: number) {
    try {
      console.log(`Disconnecting Snapchat account for user ID: ${userId}`);
      
      // Get the user's Snapchat account
      const snapchatAccount = await storage.getSocialAccountByPlatform(userId, 'snapchat');
      
      if (!snapchatAccount) {
        console.log('No Snapchat account found to disconnect for user ID:', userId);
        return true; // Already disconnected
      }
      
      // Delete the social account from the database
      const result = await storage.deleteSocialAccount(snapchatAccount.id);
      
      if (result) {
        console.log('Successfully disconnected Snapchat account with ID:', snapchatAccount.id);
      } else {
        console.error('Failed to disconnect Snapchat account with ID:', snapchatAccount.id);
      }
      
      return result;
    } catch (error: any) {
      console.error('Error disconnecting Snapchat account:', error);
      throw new Error(`Failed to disconnect Snapchat account: ${error.message}`);
    }
  }
};