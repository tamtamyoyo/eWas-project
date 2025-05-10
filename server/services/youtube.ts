import { storage } from '../storage';
import axios from 'axios';

// Check if the required environment variables are set
const YOUTUBE_CLIENT_ID = process.env.YOUTUBE_CLIENT_ID;
const YOUTUBE_CLIENT_SECRET = process.env.YOUTUBE_CLIENT_SECRET;

if (!YOUTUBE_CLIENT_ID || !YOUTUBE_CLIENT_SECRET) {
  console.warn('YouTube API credentials are missing. YouTube integration will not work properly.');
}

// YouTube/Google API Base URLs
const OAUTH_API_BASE = 'https://accounts.google.com/o/oauth2';
const TOKEN_API_BASE = 'https://oauth2.googleapis.com/token';
const YOUTUBE_API_BASE = 'https://www.googleapis.com/youtube/v3';

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

export const YouTubeService = {
  /**
   * Generate OAuth URL for YouTube authorization
   * @returns YouTube OAuth URL
   */
  async generateAuthLink() {
    try {
      if (!YOUTUBE_CLIENT_ID) {
        throw new Error('YouTube Client ID is not configured');
      }

      const redirectUri = `${getHost()}/api/youtube/callback`;
      const state = 'state-' + Math.random().toString(36).substring(2, 15);
      
      console.log('YouTube OAuth Configuration:');
      console.log(`- Client ID: ${YOUTUBE_CLIENT_ID ? 'Valid (set)' : 'Missing'}`);
      console.log(`- Client Secret: ${YOUTUBE_CLIENT_SECRET ? 'Valid (set)' : 'Missing'}`);
      console.log(`- Redirect URI: ${redirectUri}`);
      console.log(`- Host URL: ${getHost()}`);
      
      // Generate the OAuth URL for YouTube (Google)
      const authUrl = `${OAUTH_API_BASE}/auth` +
        `?client_id=${YOUTUBE_CLIENT_ID}` +
        `&redirect_uri=${encodeURIComponent(redirectUri)}` +
        `&response_type=code` +
        `&state=${state}` +
        `&scope=${encodeURIComponent('https://www.googleapis.com/auth/youtube https://www.googleapis.com/auth/youtube.upload https://www.googleapis.com/auth/youtube.readonly')}` +
        `&access_type=offline` +
        `&prompt=consent`;

      return {
        authUrl,
        state,
        redirectUri // Return the redirect URI for debugging
      };
    } catch (error: any) {
      console.error('Error generating YouTube auth link:', error);
      throw new Error(`Failed to generate YouTube authorization link: ${error.message}`);
    }
  },

  /**
   * Complete the OAuth flow with the callback data
   * @param userId - ID of the user connecting their YouTube account
   * @param code - Authorization code from callback
   * @returns Connected YouTube account details
   */
  async handleCallback(userId: number, code: string) {
    try {
      if (!YOUTUBE_CLIENT_ID || !YOUTUBE_CLIENT_SECRET) {
        throw new Error('YouTube API credentials are not configured');
      }

      console.log(`Handling YouTube callback for userId: ${userId}, code starts with: ${code.substring(0, 10)}...`);

      const redirectUri = `${getHost()}/api/youtube/callback`;
      
      console.log(`Using YouTube redirect URI: ${redirectUri}`);
      
      // Exchange the authorization code for an access token
      console.log('Getting YouTube access token...');
      const tokenResponse = await axios.post(TOKEN_API_BASE, {
        code,
        client_id: YOUTUBE_CLIENT_ID,
        client_secret: YOUTUBE_CLIENT_SECRET,
        redirect_uri: redirectUri,
        grant_type: 'authorization_code'
      }).catch(error => {
        console.error('YouTube token exchange error:', error.response?.data || error.message);
        throw new Error(`YouTube token exchange failed: ${error.response?.data?.error_description || error.message}`);
      });
      
      if (!tokenResponse.data.access_token) {
        console.error('YouTube token response missing access_token:', tokenResponse.data);
        throw new Error('Failed to get access token from YouTube');
      }
      
      console.log('Successfully obtained YouTube access token');
      const accessToken = tokenResponse.data.access_token;
      const refreshToken = tokenResponse.data.refresh_token || '';
      const expiresIn = tokenResponse.data.expires_in || 3600; // Default 1 hour if not provided
      
      // Get the channel details
      const channelResponse = await axios.get(`${YOUTUBE_API_BASE}/channels`, {
        params: {
          part: 'snippet,statistics',
          mine: true
        },
        headers: {
          Authorization: `Bearer ${accessToken}`
        }
      });
      
      if (!channelResponse.data.items || channelResponse.data.items.length === 0) {
        throw new Error('Failed to get channel information from YouTube');
      }
      
      const channel = channelResponse.data.items[0];
      const channelId = channel.id;
      const snippet = channel.snippet || {};
      const statistics = channel.statistics || {};
      
      // Store the account in the database
      const youtubeAccount = await storage.createSocialAccount({
        userId,
        platform: 'youtube',
        accountId: channelId,
        accountName: snippet.title || 'YouTube Channel',
        accessToken: accessToken,
        refreshToken: refreshToken,
        username: snippet.customUrl || channelId,
        profileUrl: snippet.thumbnails?.default?.url || null,
        name: snippet.title || '',
        tokenExpiry: new Date(Date.now() + expiresIn * 1000)
      });
      
      return youtubeAccount;
    } catch (error: any) {
      console.error('Error handling YouTube callback:', error);
      
      // Provide more detailed error message
      if (error.response) {
        const ytError = error.response.data.error || {};
        throw new Error(`YouTube authorization failed: ${ytError.message || error.message}`);
      }
      
      throw new Error(`Failed to complete YouTube authorization: ${error.message}`);
    }
  },

  /**
   * Post content to YouTube
   * @param userId - User ID
   * @param content - Post content (video title and description)
   * @param mediaUrl - Video URL (required for YouTube)
   * @returns Posted content data
   */
  async postToYouTube(userId: number, content: string, mediaUrl: string) {
    try {
      // Get the user's YouTube account
      const youtubeAccount = await storage.getSocialAccountByPlatform(userId, 'youtube');
      
      if (!youtubeAccount || !youtubeAccount.accessToken) {
        throw new Error('YouTube account not connected or missing access token');
      }
      
      const accessToken = youtubeAccount.accessToken;
      
      // YouTube requires a video file for posting
      if (!mediaUrl) {
        throw new Error('YouTube requires a video file for posting');
      }
      
      // Check if the mediaUrl is a video file
      if (!mediaUrl.match(/\.(mp4|mov|avi|wmv|flv|mkv)$/i)) {
        throw new Error('YouTube only supports video uploads');
      }
      
      // Extract title and description from content
      // In a real app, these would be separate fields
      const title = content.split('\n')[0] || 'New Video';
      const description = content.split('\n').slice(1).join('\n') || '';
      
      // YouTube video upload is a multi-step process:
      // 1. Initiate an upload
      // 2. Upload the video
      // 3. Set video metadata
      
      // This is a simplified version that would need to be expanded
      // with actual file handling for a production implementation
      
      // In a real implementation, we would now:
      // 1. Download the video from mediaUrl
      // 2. Upload it to YouTube using the resumable upload API
      // 3. Set the video metadata
      
      // This is a placeholder for the actual implementation
      return {
        id: 'youtube-video-id', // This would be the actual video ID in a real implementation
        title: title,
        description: description,
        created_time: new Date().toISOString(),
        permalink_url: `https://www.youtube.com/watch?v=youtube-video-id`,
      };
    } catch (error: any) {
      console.error('Error posting to YouTube:', error);
      
      // Provide more detailed error message
      if (error.response) {
        const ytError = error.response.data.error || {};
        throw new Error(`Failed to post to YouTube: ${ytError.message || error.message}`);
      }
      
      throw new Error(`Failed to post to YouTube: ${error.message}`);
    }
  },

  /**
   * Get basic YouTube account stats
   * @param userId - User ID
   * @returns YouTube account stats
   */
  async getAccountStats(userId: number) {
    try {
      // Get the user's YouTube account
      const youtubeAccount = await storage.getSocialAccountByPlatform(userId, 'youtube');
      
      if (!youtubeAccount || !youtubeAccount.accessToken) {
        throw new Error('YouTube account not connected or missing access token');
      }
      
      const accessToken = youtubeAccount.accessToken;
      const channelId = youtubeAccount.accountId;
      
      // Check if token is expired and needs refresh
      const now = new Date();
      const tokenExpiry = youtubeAccount.tokenExpiry ? new Date(youtubeAccount.tokenExpiry) : null;
      
      let currentAccessToken = accessToken;
      
      if (tokenExpiry && tokenExpiry < now && youtubeAccount.refreshToken) {
        // Refresh the token
        try {
          const refreshResponse = await axios.post(TOKEN_API_BASE, {
            client_id: YOUTUBE_CLIENT_ID,
            client_secret: YOUTUBE_CLIENT_SECRET,
            refresh_token: youtubeAccount.refreshToken,
            grant_type: 'refresh_token'
          });
          
          if (refreshResponse.data.access_token) {
            // Update the access token in the database
            await storage.updateSocialAccount(
              youtubeAccount.id,
              { 
                accessToken: refreshResponse.data.access_token,
                tokenExpiry: new Date(Date.now() + (refreshResponse.data.expires_in || 3600) * 1000)
              }
            );
            
            // Use the new access token
            currentAccessToken = refreshResponse.data.access_token;
          }
        } catch (refreshError) {
          console.error('Error refreshing YouTube token:', refreshError);
          // Continue with the expired token and hope for the best
        }
      }
      
      // Get channel stats
      const channelResponse = await axios.get(`${YOUTUBE_API_BASE}/channels`, {
        params: {
          part: 'statistics,snippet',
          id: channelId
        },
        headers: {
          Authorization: `Bearer ${currentAccessToken}`
        }
      });
      
      if (!channelResponse.data.items || channelResponse.data.items.length === 0) {
        throw new Error('Failed to get channel information from YouTube');
      }
      
      const channel = channelResponse.data.items[0];
      const statistics = channel.statistics || {};
      const snippet = channel.snippet || {};
      
      // Get recent videos
      const videosResponse = await axios.get(`${YOUTUBE_API_BASE}/search`, {
        params: {
          part: 'id',
          channelId: channelId,
          maxResults: 10,
          order: 'date',
          type: 'video'
        },
        headers: {
          Authorization: `Bearer ${currentAccessToken}`
        }
      });
      
      const videoIds = (videosResponse.data.items || [])
        .map((item: any) => item.id.videoId)
        .join(',');
      
      let totalLikes = 0;
      let totalComments = 0;
      let totalViews = 0;
      let videoCount = 0;
      
      if (videoIds) {
        // Get video details
        const videoDetailsResponse = await axios.get(`${YOUTUBE_API_BASE}/videos`, {
          params: {
            part: 'statistics',
            id: videoIds
          },
          headers: {
            Authorization: `Bearer ${currentAccessToken}`
          }
        });
        
        const videos = videoDetailsResponse.data.items || [];
        videoCount = videos.length;
        
        videos.forEach((video: any) => {
          const videoStats = video.statistics || {};
          totalLikes += Number(videoStats.likeCount || 0);
          totalComments += Number(videoStats.commentCount || 0);
          totalViews += Number(videoStats.viewCount || 0);
        });
      }
      
      return {
        id: youtubeAccount.id,
        username: youtubeAccount.username || youtubeAccount.accountName,
        name: youtubeAccount.name || youtubeAccount.username || youtubeAccount.accountName,
        profileUrl: youtubeAccount.profileUrl || snippet.thumbnails?.default?.url || null,
        subscribers: Number(statistics.subscriberCount || 0),
        engagement: {
          likes: totalLikes,
          comments: totalComments,
          shares: 0, // YouTube API doesn't provide share count
        },
        views: Number(statistics.viewCount || 0),
        recentViews: totalViews,
        postsCount: Number(statistics.videoCount || 0),
        viewsAverage: videoCount > 0 ? Math.round(totalViews / videoCount) : 0,
      };
    } catch (error: any) {
      console.error('Error getting YouTube account stats:', error);
      
      // Provide more detailed error message
      if (error.response) {
        const ytError = error.response.data.error || {};
        throw new Error(`Failed to get YouTube account stats: ${ytError.message || error.message}`);
      }
      
      throw new Error(`Failed to get YouTube account stats: ${error.message}`);
    }
  }
};