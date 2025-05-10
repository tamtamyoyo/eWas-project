import { storage } from '../storage';
import axios from 'axios';
import crypto from 'crypto';

// Check if the required environment variables are set
const FACEBOOK_APP_ID = process.env.FACEBOOK_APP_ID;
const FACEBOOK_APP_SECRET = process.env.FACEBOOK_APP_SECRET;

if (!FACEBOOK_APP_ID || !FACEBOOK_APP_SECRET) {
  console.warn('Facebook API credentials are missing. Facebook integration will not work properly.');
}

// Facebook Graph API Base URL
const GRAPH_API_BASE = 'https://graph.facebook.com/v18.0';

/**
 * Generate appsecret_proof for Facebook API calls
 * This is required for all server-side API calls to Facebook
 * @param accessToken - Facebook access token
 * @returns HMAC-SHA256 hash of access token using app secret
 */
function generateAppSecretProof(accessToken: string): string {
  return crypto
    .createHmac('sha256', FACEBOOK_APP_SECRET || '')
    .update(accessToken)
    .digest('hex');
}
// Get host dynamically for redirect URI - ALWAYS use app.ewasl.com for Facebook
export const getHost = (): string => {
  // Always use the production URL for Facebook OAuth
  // This is critical for OAuth security and prevents redirect errors
  return 'https://app.ewasl.com';
};

export const FacebookService = {
  /**
   * Generate OAuth URL for Facebook authorization
   * @returns Facebook OAuth URL
   */
  async generateAuthLink() {
    try {
      if (!FACEBOOK_APP_ID) {
        throw new Error('Facebook App ID is not configured');
      }

      const redirectUri = `${getHost()}/api/facebook/callback`;
      const state = 'state-' + Math.random().toString(36).substring(2, 15);
      
      console.log('Facebook OAuth Configuration:');
      console.log(`- App ID: ${FACEBOOK_APP_ID ? 'Valid (set)' : 'Missing'}`);
      console.log(`- App Secret: ${FACEBOOK_APP_SECRET ? 'Valid (set)' : 'Missing'}`);
      console.log(`- Redirect URI: ${redirectUri}`);
      console.log(`- Host URL: ${getHost()}`);
      
      // Generate the OAuth URL for Facebook
      const authUrl = `https://www.facebook.com/v18.0/dialog/oauth?` +
        `client_id=${FACEBOOK_APP_ID}` +
        `&redirect_uri=${encodeURIComponent(redirectUri)}` +
        `&state=${state}` +
        `&scope=email,pages_show_list,pages_read_engagement,pages_manage_posts,public_profile`;

      return {
        authUrl,
        state,
        redirectUri // Return the redirect URI for debugging
      };
    } catch (error: any) {
      console.error('Error generating Facebook auth link:', error);
      throw new Error(`Failed to generate Facebook authorization link: ${error.message}`);
    }
  },

  /**
   * Complete the OAuth flow with the callback data
   * @param userId - ID of the user connecting their Facebook account
   * @param code - Authorization code from callback
   * @returns Connected Facebook account details
   */
  async handleCallback(userId: number, code: string) {
    try {
      if (!FACEBOOK_APP_ID || !FACEBOOK_APP_SECRET) {
        throw new Error('Facebook API credentials are not configured');
      }

      console.log(`Handling Facebook callback for userId: ${userId}, code starts with: ${code.substring(0, 10)}...`);

      const redirectUri = `${getHost()}/api/facebook/callback`;
      
      console.log(`Using Facebook redirect URI: ${redirectUri}`);
      
      // Exchange the authorization code for an access token
      console.log('Getting Facebook access token...');
      const tokenResponse = await axios.get(`${GRAPH_API_BASE}/oauth/access_token`, {
        params: {
          client_id: FACEBOOK_APP_ID,
          client_secret: FACEBOOK_APP_SECRET,
          redirect_uri: redirectUri,
          code: code
        }
      }).catch(error => {
        console.error('Facebook token exchange error:', error.response?.data || error.message);
        throw new Error(`Facebook token exchange failed: ${error.response?.data?.error?.message || error.message}`);
      });
      
      if (!tokenResponse.data.access_token) {
        console.error('Facebook token response missing access_token:', tokenResponse.data);
        throw new Error('Failed to get access token from Facebook');
      }
      
      console.log('Successfully obtained Facebook access token');
      const accessToken = tokenResponse.data.access_token;
      
      // Generate appsecret_proof for API calls
      const appSecretProof = generateAppSecretProof(accessToken);
      
      // Get user details
      const userResponse = await axios.get(`${GRAPH_API_BASE}/me`, {
        params: {
          fields: 'id,name,email,picture',
          access_token: accessToken,
          appsecret_proof: appSecretProof
        }
      });
      
      if (!userResponse.data.id) {
        throw new Error('Failed to get user information from Facebook');
      }
      
      // Get pages the user has access to
      const pagesResponse = await axios.get(`${GRAPH_API_BASE}/me/accounts`, {
        params: {
          access_token: accessToken,
          appsecret_proof: appSecretProof
        }
      });
      
      // If the user has pages, use the first one for posting
      let pageId = userResponse.data.id;
      let pageName = userResponse.data.name;
      let pageAccessToken = accessToken;
      let pageUsername = '';
      let profileUrl = userResponse.data.picture?.data?.url || null;
      
      if (pagesResponse.data.data && pagesResponse.data.data.length > 0) {
        const page = pagesResponse.data.data[0];
        pageId = page.id;
        pageName = page.name;
        pageAccessToken = page.access_token;
        pageUsername = page.username || '';
        
        // Generate appsecret_proof for page token (which is different from the user token)
        const pageSecretProof = generateAppSecretProof(pageAccessToken);
        
        // Get page profile picture
        const pageDetailsResponse = await axios.get(`${GRAPH_API_BASE}/${pageId}`, {
          params: {
            fields: 'picture',
            access_token: pageAccessToken,
            appsecret_proof: pageSecretProof
          }
        });
        
        if (pageDetailsResponse.data.picture && pageDetailsResponse.data.picture.data) {
          profileUrl = pageDetailsResponse.data.picture.data.url;
        }
      }
      
      // Store the account in the database
      const facebookAccount = await storage.createSocialAccount({
        userId,
        platform: 'facebook',
        accountId: pageId,
        accountName: pageName,
        accessToken: pageAccessToken,
        refreshToken: '', // Facebook doesn't use refresh tokens in the same way
        username: pageUsername,
        profileUrl: profileUrl,
        name: pageName,
      });
      
      return facebookAccount;
    } catch (error: any) {
      console.error('Error handling Facebook callback:', error);
      
      // Provide more detailed error message
      if (error.response) {
        const fbError = error.response.data.error || {};
        throw new Error(`Facebook authorization failed: ${fbError.message || error.message}`);
      }
      
      throw new Error(`Failed to complete Facebook authorization: ${error.message}`);
    }
  },

  /**
   * Post content to Facebook Page
   * @param userId - User ID
   * @param content - Post content
   * @param mediaUrl - Optional media URL
   * @returns Posted content data
   */
  async postToFacebook(userId: number, content: string, mediaUrl?: string) {
    try {
      // Get the user's Facebook account
      const facebookAccount = await storage.getSocialAccountByPlatform(userId, 'facebook');
      
      if (!facebookAccount || !facebookAccount.accessToken) {
        throw new Error('Facebook account not connected or missing access token');
      }
      
      const pageId = facebookAccount.accountId;
      const accessToken = facebookAccount.accessToken;
      
      // Generate appsecret_proof for all API calls
      const appSecretProof = generateAppSecretProof(accessToken);
      
      let postData: any = { message: content };
      let endpoint = `${GRAPH_API_BASE}/${pageId}/feed`;
      
      // If media URL is provided, handle it differently based on type
      if (mediaUrl) {
        if (mediaUrl.match(/\.(jpeg|jpg|png|gif)$/i)) {
          // Image post
          postData = {
            caption: content,
            url: mediaUrl
          };
          endpoint = `${GRAPH_API_BASE}/${pageId}/photos`;
        } else if (mediaUrl.match(/\.(mp4|mov)$/i)) {
          // Video post
          postData = {
            description: content,
            file_url: mediaUrl
          };
          endpoint = `${GRAPH_API_BASE}/${pageId}/videos`;
        }
      }
      
      // Post to Facebook with appsecret_proof
      const response = await axios.post(endpoint, null, {
        params: {
          ...postData,
          access_token: accessToken,
          appsecret_proof: appSecretProof
        }
      });
      
      if (!response.data || !response.data.id) {
        throw new Error('Failed to post to Facebook');
      }
      
      // Get the post details
      const postId = response.data.id;
      const postDetailsResponse = await axios.get(`${GRAPH_API_BASE}/${postId}`, {
        params: {
          fields: 'id,message,created_time,permalink_url',
          access_token: accessToken,
          appsecret_proof: appSecretProof
        }
      });
      
      return {
        id: postDetailsResponse.data.id,
        message: postDetailsResponse.data.message,
        created_time: postDetailsResponse.data.created_time,
        permalink_url: postDetailsResponse.data.permalink_url,
      };
    } catch (error: any) {
      console.error('Error posting to Facebook:', error);
      
      // Provide more detailed error message
      if (error.response) {
        const fbError = error.response.data.error || {};
        throw new Error(`Failed to post to Facebook: ${fbError.message || error.message}`);
      }
      
      throw new Error(`Failed to post to Facebook: ${error.message}`);
    }
  },

  /**
   * Get basic Facebook account stats
   * @param userId - User ID
   * @returns Facebook account stats
   */
  async getAccountStats(userId: number) {
    try {
      // Get the user's Facebook account
      const facebookAccount = await storage.getSocialAccountByPlatform(userId, 'facebook');
      
      if (!facebookAccount || !facebookAccount.accessToken) {
        throw new Error('Facebook account not connected or missing access token');
      }
      
      const pageId = facebookAccount.accountId;
      const accessToken = facebookAccount.accessToken;
      
      // Generate appsecret_proof for API calls
      const appSecretProof = generateAppSecretProof(accessToken);
      
      // Get page insights
      const insightsResponse = await axios.get(`${GRAPH_API_BASE}/${pageId}/insights`, {
        params: {
          metric: 'page_fan_count,page_impressions,page_post_engagements,page_video_views',
          period: 'day',
          access_token: accessToken,
          appsecret_proof: appSecretProof
        }
      });
      
      // Extract metrics
      const insights = insightsResponse.data.data || [];
      const getMetricValue = (name: string) => {
        const metric = insights.find((m: any) => m.name === name);
        if (metric && metric.values && metric.values.length > 0) {
          return metric.values[0].value || 0;
        }
        return 0;
      };
      
      const followers = getMetricValue('page_fan_count');
      const impressions = getMetricValue('page_impressions');
      const engagements = getMetricValue('page_post_engagements');
      const videoViews = getMetricValue('page_video_views');
      
      // Get recent posts to calculate engagement
      const postsResponse = await axios.get(`${GRAPH_API_BASE}/${pageId}/posts`, {
        params: {
          fields: 'id,likes.summary(true),comments.summary(true),shares',
          limit: 10,
          access_token: accessToken,
          appsecret_proof: appSecretProof
        }
      });
      
      const posts = postsResponse.data.data || [];
      let totalLikes = 0;
      let totalComments = 0;
      let totalShares = 0;
      
      posts.forEach((post: any) => {
        if (post.likes && post.likes.summary) {
          totalLikes += post.likes.summary.total_count || 0;
        }
        if (post.comments && post.comments.summary) {
          totalComments += post.comments.summary.total_count || 0;
        }
        if (post.shares) {
          totalShares += post.shares.count || 0;
        }
      });
      
      return {
        id: facebookAccount.id,
        username: facebookAccount.username || facebookAccount.accountName,
        name: facebookAccount.name || facebookAccount.username || facebookAccount.accountName,
        profileUrl: facebookAccount.profileUrl || null,
        followers: followers,
        likes: totalLikes,
        engagement: {
          likes: totalLikes,
          comments: totalComments,
          shares: totalShares,
        },
        reachAverage: impressions,
        videoViews: videoViews,
        postsCount: posts.length,
      };
    } catch (error: any) {
      console.error('Error getting Facebook account stats:', error);
      
      // Provide more detailed error message
      if (error.response) {
        const fbError = error.response.data.error || {};
        throw new Error(`Failed to get Facebook account stats: ${fbError.message || error.message}`);
      }
      
      throw new Error(`Failed to get Facebook account stats: ${error.message}`);
    }
  }
};