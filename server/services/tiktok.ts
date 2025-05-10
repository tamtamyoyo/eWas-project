import { storage } from '../storage';
import axios from 'axios';
import crypto from 'crypto';

// Check if the required environment variables are set
const TIKTOK_CLIENT_KEY = process.env.TIKTOK_CLIENT_KEY;
const TIKTOK_CLIENT_SECRET = process.env.TIKTOK_CLIENT_SECRET;

if (!TIKTOK_CLIENT_KEY || !TIKTOK_CLIENT_SECRET) {
  console.warn('TikTok API credentials are missing. TikTok integration will not work properly.');
}

// TikTok API Base URLs
const AUTH_API_BASE = 'https://open-api.tiktok.com';
const GRAPH_API_BASE = 'https://open.tiktokapis.com/v2';

// Get host dynamically for redirect URI
export const getHost = (): string => {
  const isProduction = process.env.NODE_ENV === 'production';
  
  // Use production URL in production, otherwise use the current host
  if (isProduction) {
    return 'https://app.ewasl.com';
  }
  
  // For development, get the host from the environment or use a default
  const devHost = process.env.REPLIT_URL || 'http://localhost:5000';
  return devHost;
};

export const TikTokService = {
  /**
   * Generate OAuth URL for TikTok authorization
   * @returns TikTok OAuth URL
   */
  async generateAuthLink() {
    try {
      if (!TIKTOK_CLIENT_KEY) {
        throw new Error('TikTok Client Key is not configured');
      }

      const redirectUri = `${getHost()}/api/tiktok/callback`;
      const state = 'state-' + Math.random().toString(36).substring(2, 15);
      
      console.log('TikTok OAuth Configuration:');
      console.log(`- Client Key: ${TIKTOK_CLIENT_KEY ? 'Valid (set)' : 'Missing'}`);
      console.log(`- Client Secret: ${TIKTOK_CLIENT_SECRET ? 'Valid (set)' : 'Missing'}`);
      console.log(`- Redirect URI: ${redirectUri}`);
      console.log(`- Host URL: ${getHost()}`);
      
      // Generate the OAuth URL for TikTok
      const authUrl = `${AUTH_API_BASE}/platform/oauth/connect/` +
        `?client_key=${TIKTOK_CLIENT_KEY}` +
        `&response_type=code` +
        `&redirect_uri=${encodeURIComponent(redirectUri)}` +
        `&state=${state}` +
        `&scope=user.info.basic,video.list,video.upload`;

      return {
        authUrl,
        state,
        redirectUri // Return the redirect URI for debugging
      };
    } catch (error: any) {
      console.error('Error generating TikTok auth link:', error);
      throw new Error(`Failed to generate TikTok authorization link: ${error.message}`);
    }
  },

  /**
   * Complete the OAuth flow with the callback data
   * @param userId - ID of the user connecting their TikTok account
   * @param code - Authorization code from callback
   * @returns Connected TikTok account details
   */
  async handleCallback(userId: number, code: string) {
    try {
      if (!TIKTOK_CLIENT_KEY || !TIKTOK_CLIENT_SECRET) {
        throw new Error('TikTok API credentials are not configured');
      }

      console.log(`Handling TikTok callback for userId: ${userId}, code starts with: ${code.substring(0, 10)}...`);

      const redirectUri = `${getHost()}/api/tiktok/callback`;
      
      console.log(`Using TikTok redirect URI: ${redirectUri}`);
      
      // Exchange the authorization code for an access token
      console.log('Getting TikTok access token...');
      const tokenResponse = await axios.post(`${AUTH_API_BASE}/oauth/access_token/`, null, {
        params: {
          client_key: TIKTOK_CLIENT_KEY,
          client_secret: TIKTOK_CLIENT_SECRET,
          code: code,
          grant_type: 'authorization_code'
        }
      }).catch(error => {
        console.error('TikTok token exchange error:', error.response?.data || error.message);
        throw new Error(`TikTok token exchange failed: ${error.response?.data?.error_description || error.message}`);
      });
      
      const tokenData = tokenResponse.data.data;
      
      if (!tokenData || !tokenData.access_token) {
        console.error('TikTok token response missing access_token:', tokenResponse.data);
        throw new Error('Failed to get access token from TikTok');
      }
      
      console.log('Successfully obtained TikTok access token');
      const accessToken = tokenData.access_token;
      const openId = tokenData.open_id; // TikTok's unique user identifier
      const refreshToken = tokenData.refresh_token || '';
      const expiresIn = tokenData.expires_in || 86400; // Default 24 hours if not provided
      
      // Get user details
      const userResponse = await axios.get(`${GRAPH_API_BASE}/user/info/`, {
        headers: {
          'Authorization': `Bearer ${accessToken}`
        },
        params: {
          fields: 'open_id,avatar_url,display_name,username'
        }
      });
      
      if (!userResponse.data.data || !userResponse.data.data.user) {
        throw new Error('Failed to get user information from TikTok');
      }
      
      const userData = userResponse.data.data.user;
      
      // Store the account in the database
      const tiktokAccount = await storage.createSocialAccount({
        userId,
        platform: 'tiktok',
        accountId: openId,
        accountName: userData.display_name || userData.username || 'TikTok User',
        accessToken: accessToken,
        refreshToken: refreshToken,
        username: userData.username || '',
        profileUrl: userData.avatar_url || null,
        name: userData.display_name || '',
        tokenExpiry: new Date(Date.now() + expiresIn * 1000),
      });
      
      return tiktokAccount;
    } catch (error: any) {
      console.error('Error handling TikTok callback:', error);
      
      // Provide more detailed error message
      if (error.response) {
        const tikTokError = error.response.data.error || {};
        throw new Error(`TikTok authorization failed: ${tikTokError.message || error.message}`);
      }
      
      throw new Error(`Failed to complete TikTok authorization: ${error.message}`);
    }
  },

  /**
   * Post content to TikTok
   * @param userId - User ID
   * @param content - Post content (description)
   * @param mediaUrl - Video URL (required for TikTok)
   * @returns Posted content data
   */
  async postToTikTok(userId: number, content: string, mediaUrl: string) {
    try {
      // Get the user's TikTok account
      const tiktokAccount = await storage.getSocialAccountByPlatform(userId, 'tiktok');
      
      if (!tiktokAccount || !tiktokAccount.accessToken) {
        throw new Error('TikTok account not connected or missing access token');
      }
      
      const accessToken = tiktokAccount.accessToken;
      const openId = tiktokAccount.accountId;
      
      // TikTok requires a video file for posting
      if (!mediaUrl) {
        throw new Error('TikTok requires a video file for posting');
      }
      
      // Check if the mediaUrl is a video file
      if (!mediaUrl.match(/\.(mp4|mov)$/i)) {
        throw new Error('TikTok only supports video uploads (.mp4 or .mov)');
      }
      
      // TikTok video upload is a multi-step process:
      // 1. Initiate an upload
      // 2. Upload the video chunks
      // 3. Complete the upload and publish
      
      // This is a simplified version that would need to be expanded
      // with actual file handling for a production implementation
      
      // Step 1: Initiate upload
      const initiateResponse = await axios.post(`${GRAPH_API_BASE}/video/upload/`, {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        },
        data: {
          open_id: openId,
          description: content
        }
      });
      
      // In a real implementation, we would now:
      // 1. Download the video from mediaUrl
      // 2. Upload it in chunks to the TikTok API
      // 3. Complete the upload
      
      // This is a placeholder for the actual implementation
      return {
        id: 'tiktok-post-id', // This would be the actual post ID in a real implementation
        message: content,
        created_time: new Date().toISOString(),
        permalink_url: `https://www.tiktok.com/@${tiktokAccount.username}`,
      };
    } catch (error: any) {
      console.error('Error posting to TikTok:', error);
      
      // Provide more detailed error message
      if (error.response) {
        const tikTokError = error.response.data.error || {};
        throw new Error(`Failed to post to TikTok: ${tikTokError.message || error.message}`);
      }
      
      throw new Error(`Failed to post to TikTok: ${error.message}`);
    }
  },

  /**
   * Get basic TikTok account stats
   * @param userId - User ID
   * @returns TikTok account stats
   */
  async getAccountStats(userId: number) {
    try {
      // Get the user's TikTok account
      const tiktokAccount = await storage.getSocialAccountByPlatform(userId, 'tiktok');
      
      if (!tiktokAccount || !tiktokAccount.accessToken) {
        throw new Error('TikTok account not connected or missing access token');
      }
      
      const accessToken = tiktokAccount.accessToken;
      const openId = tiktokAccount.accountId;
      
      // Get user stats from TikTok
      const statsResponse = await axios.get(`${GRAPH_API_BASE}/research/user/stats/`, {
        headers: {
          'Authorization': `Bearer ${accessToken}`
        },
        params: {
          open_id: openId,
          fields: 'follower_count,following_count,likes_count,video_count'
        }
      });
      
      const userData = statsResponse.data.data;
      
      // Get recent videos to calculate engagement
      const videosResponse = await axios.get(`${GRAPH_API_BASE}/video/list/`, {
        headers: {
          'Authorization': `Bearer ${accessToken}`
        },
        params: {
          open_id: openId,
          fields: 'id,like_count,comment_count,share_count,view_count',
          cursor: 0,
          max_count: 10
        }
      });
      
      const videos = videosResponse.data.data.videos || [];
      let totalLikes = 0;
      let totalComments = 0;
      let totalShares = 0;
      let totalViews = 0;
      
      videos.forEach((video: any) => {
        totalLikes += video.like_count || 0;
        totalComments += video.comment_count || 0;
        totalShares += video.share_count || 0;
        totalViews += video.view_count || 0;
      });
      
      return {
        id: tiktokAccount.id,
        username: tiktokAccount.username || tiktokAccount.accountName,
        name: tiktokAccount.name || tiktokAccount.username || tiktokAccount.accountName,
        profileUrl: tiktokAccount.profileUrl || null,
        followers: userData.follower_count || 0,
        following: userData.following_count || 0,
        likes: userData.likes_count || 0,
        engagement: {
          likes: totalLikes,
          comments: totalComments,
          shares: totalShares,
        },
        viewsAverage: videos.length > 0 ? Math.round(totalViews / videos.length) : 0,
        postsCount: userData.video_count || 0,
      };
    } catch (error: any) {
      console.error('Error getting TikTok account stats:', error);
      
      // Provide more detailed error message
      if (error.response) {
        const tikTokError = error.response.data.error || {};
        throw new Error(`Failed to get TikTok account stats: ${tikTokError.message || error.message}`);
      }
      
      throw new Error(`Failed to get TikTok account stats: ${error.message}`);
    }
  }
};