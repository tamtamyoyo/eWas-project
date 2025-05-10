# Social Media Integration Troubleshooting Guide

This guide helps you fix common issues with social media platform connections in the eWasl app.

## Prerequisites

1. Make sure your app domain is set to `app.ewasl.com` in all platform developer dashboards
2. Ensure all required environment variables are properly set
3. Check that redirect URIs match exactly what's configured in your app

## Facebook Integration

### Common Issues

1. **404 Page Not Found after callback**
   - **Problem**: The Facebook redirect URI is set incorrectly or doesn't match your routes
   - **Solution**: 
     - Ensure the redirect URI in Facebook Developer Dashboard is set to `https://app.ewasl.com/api/facebook/callback`
     - Check that this matches what's in your code (FacebookService.generateAuthLink)

2. **URL Blocked Error**
   - **Problem**: Facebook is blocking the redirect URL
   - **Solution**:
     - Add your domain to App Domains in Basic Settings: `app.ewasl.com`
     - Add the full callback URL to Valid OAuth Redirect URIs
     - Make sure Client OAuth Login is enabled

### Required Configuration

1. **Facebook App Settings**
   - Products > Facebook Login > Settings:
     - Valid OAuth Redirect URIs: `https://app.ewasl.com/api/facebook/callback`
     - Client OAuth Login: Enabled
     - Web OAuth Login: Enabled
   
   - Basic Settings:
     - App Domains: `app.ewasl.com`
     - Site URL: `https://app.ewasl.com`

2. **Required Permissions**
   - public_profile
   - email
   - pages_show_list
   - pages_read_engagement
   - pages_manage_posts

## Instagram Integration

### Common Issues

1. **Invalid Platform App Error**
   - **Problem**: Instagram doesn't recognize your app as valid
   - **Solution**:
     - Make sure you've added Instagram Basic Display to your Facebook app
     - Ensure your Instagram Business Account is properly linked to your Facebook Page
     - Verify the Instagram App ID and App Secret match your Facebook App credentials

2. **Invalid Callback URL**
   - **Problem**: The callback URL doesn't match what's configured or is invalid
   - **Solution**:
     - Set the Instagram callback URL to `https://app.ewasl.com/api/instagram/callback`
     - Verify this matches exactly in your code (InstagramService.generateAuthLink)

### Required Configuration

1. **Instagram Basic Display**
   - Client OAuth Settings:
     - Valid OAuth Redirect URIs: `https://app.ewasl.com/api/instagram/callback`
   
   - Instagram App Settings:
     - Make sure the Instagram App ID is your Facebook App ID
     - Make sure the Instagram App Secret is your Facebook App Secret

2. **Required Permissions**
   - user_profile
   - user_media
   - instagram_basic
   - instagram_content_publish
   - instagram_manage_insights

3. **Instagram Webhooks**
   - Callback URL: `https://app.ewasl.com/instagram/webhook`
   - Verify Token: `eWaslToken123`

## Twitter Integration

### Configuration Requirements

1. **Twitter Developer Account Setup**
   - Ensure you have a Twitter Developer Account with API v2 access
   - Create a Twitter app with OAuth 1.0a enabled
   - Set the callback URL in the Twitter developer portal to exactly match the one used in your application

2. **Environment Variables**
   - `TWITTER_API_KEY`: Your Twitter API key (starts with "")
   - `TWITTER_API_SECRET`: Your Twitter API secret 
   - `TWITTER_CALLBACK_URL`: Must be set to `https://app.ewasl.com/twitter-callback` (NOT auth/twitter/callback)

### Common Issues

1. **Authentication Error**
   - **Problem**: Twitter API returns "Could not authenticate you"
   - **Solution**:
     - Regenerate your Twitter API key and secret in the developer portal
     - Update these in your environment variables
     - Make sure your app has Read and Write permission levels

2. **Invalid Callback URL**
   - **Problem**: Twitter rejects the authentication because of an invalid callback URL
   - **Solution**:
     - Make sure the callback URL in the Twitter developer portal exactly matches `https://app.ewasl.com/twitter-callback`
     - Ensure TWITTER_CALLBACK_URL environment variable matches this value

3. **Missing OAuth Parameters**
   - **Problem**: OAuth flow not completing properly
   - **Solution**:
     - Check that your application is storing the oauth_token_secret during the initial request
     - Verify that both oauth_token and oauth_verifier are being sent back in the callback

### Required Configuration

1. **Twitter Developer Portal**
   - Authentication settings:
     - OAuth 2.0 Type: Web App
     - App permissions: Read and Write
     - Callback URI: `https://app.ewasl.com/auth/twitter/callback`
     - Website URL: `https://app.ewasl.com`

2. **Environment Variables**
   - `TWITTER_API_KEY`: Your Twitter API key
   - `TWITTER_API_SECRET`: Your Twitter API secret
   - `TWITTER_CALLBACK_URL`: https://app.ewasl.com/auth/twitter/callback

## LinkedIn Integration

### Common Issues

1. **Something Went Wrong**
   - **Problem**: LinkedIn callback URL or credentials mismatch
   - **Solution**:
     - Make sure the LinkedIn redirect URI is set to `https://app.ewasl.com/api/linkedin/callback`
     - Verify your LinkedIn client ID and secret are correct
     - Check that the scopes requested match what's approved in your app

### Required Configuration

1. **LinkedIn Developer Portal**
   - Auth tab:
     - Redirect URLs: `https://app.ewasl.com/api/linkedin/callback`
     - OAuth 2.0 scopes: r_liteprofile, w_member_social
     - Note: The r_emailaddress scope has been removed as it caused authorization issues

2. **Environment Variables**
   - `LINKEDIN_CLIENT_ID`: Your LinkedIn Client ID
   - `LINKEDIN_CLIENT_SECRET`: Your LinkedIn Client Secret

## General Troubleshooting Tips

1. **Always check the logs** - Look for specific error messages that might indicate what's wrong
2. **Verify environment variables** - Make sure all required credentials are set
3. **Check redirect URIs** - These must match exactly between your code and platform settings
4. **Use the correct API versions** - Each platform may require specific API versions
5. **Reset connections** - If all else fails, try deleting the connection from your database and reconnecting

## Required Environment Variables

```
# Facebook & Instagram
FACEBOOK_APP_ID=your_facebook_app_id
FACEBOOK_APP_SECRET=your_facebook_app_secret
INSTAGRAM_APP_ID=your_facebook_app_id
INSTAGRAM_APP_SECRET=your_facebook_app_secret

# Twitter
TWITTER_API_KEY=your_twitter_api_key
TWITTER_API_SECRET=your_twitter_api_secret
TWITTER_CALLBACK_URL=https://app.ewasl.com/auth/twitter/callback

# LinkedIn
LINKEDIN_CLIENT_ID=your_linkedin_client_id
LINKEDIN_CLIENT_SECRET=your_linkedin_client_secret

# HOST URL
HOST=https://app.ewasl.com
```

## Example Code for Testing Connections

You can add console logs to debug connection issues:

```typescript
// Add to Facebook callback endpoint
console.log("Facebook callback received:", {
  code: code ? "EXISTS" : "MISSING",
  user: user ? user.id : "MISSING"
});

// Add to Twitter callback endpoint
console.log("Twitter callback received:", { 
  oauth_token: oauth_token ? "EXISTS" : "MISSING", 
  oauth_verifier: oauth_verifier ? "EXISTS" : "MISSING",
  oauth_token_secret: oauth_token_secret ? "EXISTS" : "MISSING"
});
```