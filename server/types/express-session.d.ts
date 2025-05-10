import 'express-session';

declare module 'express-session' {
  interface SessionData {
    userId?: number;
    twitterAuth?: {
      oauth_token_secret?: string;
      timestamp?: number;
      oauth_token?: string;
    };
    facebookAuth?: {
      state?: string;
    };
    snapchatAuth?: {
      state?: string;
    };
    linkedinAuth?: {
      state?: string;
    };
    passport?: {
      user?: number;
    };
    // Pending tokens for social media connection completion
    facebookPendingToken?: string;
    instagramPendingToken?: string;
    linkedinPendingToken?: string;
    snapchatPendingToken?: string;
    twitterPendingToken?: string;
    redirect_after_login?: string;
  }
}