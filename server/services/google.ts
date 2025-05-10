import axios from 'axios';

// Type definitions
interface GoogleTokens {
  access_token: string;
  expires_in: number;
  refresh_token?: string;
  scope: string;
  id_token: string;
  token_type: string;
}

interface GoogleUserInfo {
  id: string;
  email: string;
  verified_email: boolean;
  name: string;
  given_name: string;
  family_name: string;
  picture: string;
  locale: string;
}

// Helper function to get the correct redirect URI based on environment
const getRedirectUri = () => {
  // Check environment
  const isProduction = process.env.NODE_ENV === 'production';
  
  // Use the configured redirect URI if available
  if (process.env.GOOGLE_REDIRECT_URI) {
    return process.env.GOOGLE_REDIRECT_URI;
  }
  
  // Otherwise use a default based on environment
  return isProduction 
    ? 'https://app.ewasl.com/oauth2callback'
    : 'http://localhost:5000/oauth2callback';
};

/**
 * Service for handling Google OAuth operations
 */
export const GoogleService = {
  /**
   * Generate OAuth URL for Google authorization
   * @returns Google OAuth URL
   */
  async generateAuthLink(): Promise<string> {
    if (!process.env.GOOGLE_CLIENT_ID) {
      throw new Error('Google OAuth credentials are not configured');
    }

    // Get correct redirect URI for the current environment
    const redirectUri = getRedirectUri();
    console.log('Using Google redirect URI:', redirectUri);
    
    console.log('Google OAuth configuration:', { 
      clientIdExists: !!process.env.GOOGLE_CLIENT_ID,
      redirectUri 
    });

    const rootUrl = 'https://accounts.google.com/o/oauth2/v2/auth';
    const options = {
      redirect_uri: redirectUri,
      client_id: process.env.GOOGLE_CLIENT_ID,
      access_type: 'offline',
      response_type: 'code',
      prompt: 'consent',
      scope: [
        'https://www.googleapis.com/auth/userinfo.profile',
        'https://www.googleapis.com/auth/userinfo.email'
      ].join(' ')
    };

    const queryParams = new URLSearchParams(options);
    return `${rootUrl}?${queryParams.toString()}`;
  },

  /**
   * Exchange auth code for tokens
   * @param code Auth code from Google callback
   * @returns Google tokens
   */
  async getTokens(code: string): Promise<GoogleTokens> {
    if (!process.env.GOOGLE_CLIENT_ID || !process.env.GOOGLE_CLIENT_SECRET) {
      throw new Error('Google OAuth credentials are not configured');
    }
    
    // Get correct redirect URI for the current environment
    const redirectUri = getRedirectUri();
    console.log('Using Google redirect URI for token exchange:', redirectUri);

    const url = 'https://oauth2.googleapis.com/token';
    const values = {
      code,
      client_id: process.env.GOOGLE_CLIENT_ID,
      client_secret: process.env.GOOGLE_CLIENT_SECRET,
      redirect_uri: redirectUri,
      grant_type: 'authorization_code'
    };

    try {
      const response = await axios.post<GoogleTokens>(url, values, {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded'
        }
      });
      return response.data;
    } catch (error: any) {
      console.error('Failed to get Google tokens:', error.response?.data || error.message);
      throw new Error('Failed to get Google tokens');
    }
  },

  /**
   * Get user information using access token
   * @param tokens Google tokens
   * @returns User information
   */
  async getUserInfo(accessToken: string): Promise<GoogleUserInfo> {
    try {
      const response = await axios.get<GoogleUserInfo>('https://www.googleapis.com/oauth2/v2/userinfo', {
        headers: {
          Authorization: `Bearer ${accessToken}`
        }
      });
      return response.data;
    } catch (error: any) {
      console.error('Failed to get Google user info:', error.response?.data || error.message);
      throw new Error('Failed to get Google user info');
    }
  },

  /**
   * Complete the OAuth flow with the callback code
   * @param code Authorization code from callback
   * @returns User information from Google
   */
  async handleCallback(code: string): Promise<{
    googleId: string;
    email: string;
    fullName: string;
    photoURL: string;
  }> {
    try {
      // Exchange code for tokens
      const tokens = await this.getTokens(code);
      
      // Get user info with access token
      const userInfo = await this.getUserInfo(tokens.access_token);
      
      return {
        googleId: userInfo.id,
        email: userInfo.email,
        fullName: userInfo.name,
        photoURL: userInfo.picture
      };
    } catch (error) {
      console.error('Google OAuth callback error:', error);
      throw error;
    }
  }
};