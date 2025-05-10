# eWasl Social Media Platform Integrations

This document outlines the configuration details for all social media platforms integrated with eWasl.

## Twitter

### Configuration

- **Callback URL**: `https://app.ewasl.com/auth/twitter/callback`
- **API Version**: v2
- **Required Permissions**: Read/Write

### Environment Variables

- `TWITTER_API_KEY`: Twitter API key (Consumer Key)
- `TWITTER_API_SECRET`: Twitter API secret (Consumer Secret)
- `TWITTER_CALLBACK_URL`: Twitter callback URL

## Instagram

### Configuration

- **Webhook URL**: `https://app.ewasl.com/instagram/webhook`
- **Webhook Verify Token**: `eWaslToken123`
- **Callback URL**: `https://app.ewasl.com/api/instagram/callback`
- **Required Permissions**: 
  - user_profile
  - user_media
  - instagram_basic
  - instagram_content_publish
  - instagram_manage_insights

### Environment Variables

- `INSTAGRAM_APP_ID`: Instagram App ID
- `INSTAGRAM_APP_SECRET`: Instagram App Secret

## LinkedIn

### Configuration

- **Callback URL**: Set in the environment variable
- **Required Scopes**:
  - r_liteprofile
  - r_emailaddress
  - w_member_social

### Environment Variables

- `LINKEDIN_CLIENT_ID`: LinkedIn Client ID
- `LINKEDIN_CLIENT_SECRET`: LinkedIn Client Secret
- `LINKEDIN_REDIRECT_URI`: LinkedIn Redirect URI

## Facebook

### Configuration

- **Callback URLs**: 
  - `https://app.ewasl.com/api/facebook/callback`
  - `https://app.ewasl.com/auth/facebook/callback`
- **App Domains**:
  - `app.ewasl.com`
- **Required Permissions**:
  - public_profile
  - email
  - pages_show_list
  - pages_read_engagement
  - pages_manage_posts

### Facebook Developer Console Configuration

1. Go to your [Facebook Developer Dashboard](https://developers.facebook.com/apps)
2. Select your eWasl app (ID: 1366325774493759)
3. Go to Settings > Basic
   - Add `app.ewasl.com` to the "App Domains" field
   - Make sure your privacy policy URL is set
   - Save changes

4. Go to Products > Facebook Login > Settings
   - Enable "Client OAuth Login"
   - Enable "Web OAuth Login"
   - Enable "Login with the JavaScript SDK"
   - Add both callback URLs to "Valid OAuth Redirect URIs":
     ```
     https://app.ewasl.com/api/facebook/callback
     https://app.ewasl.com/auth/facebook/callback
     ```
   - Save changes

5. Go to App Review > Permissions and Features
   - Request all required permissions (public_profile, email, pages_show_list, etc.)

### Environment Variables

- `FACEBOOK_APP_ID`: Facebook App ID
- `FACEBOOK_APP_SECRET`: Facebook App Secret

## Testing Production Integrations

For each platform, you should test the following flows in production:

1. **Authentication Flow**: Connect a new account
2. **Posting Flow**: Create a post on the platform
3. **Stats Retrieval**: View account statistics
4. **Webhook Reception**: Verify webhooks are received correctly

## Troubleshooting Common Issues

### Authentication Failures

- Check if the callback URL matches exactly what's configured in the platform's developer dashboard
- Ensure all required environment variables are set
- Verify that the app permissions/scopes match what's configured

### Posting Failures

- Verify that the access token hasn't expired
- Check for platform-specific limitations on content type or size
- Ensure proper media formats are being used

### Stats Retrieval Issues

- Check if the API rate limits have been exceeded
- Verify that the connected account has proper permissions
- Ensure the access token is valid and has the right scopes

## Resources

- [Twitter API Documentation](https://developer.twitter.com/en/docs)
- [Instagram Graph API Documentation](https://developers.facebook.com/docs/instagram-api/)
- [LinkedIn API Documentation](https://docs.microsoft.com/en-us/linkedin/)
- [Facebook Graph API Documentation](https://developers.facebook.com/docs/graph-api/)
