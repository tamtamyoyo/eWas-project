# Facebook and Instagram Integration Setup Guide for eWasl

This guide provides step-by-step instructions for setting up and troubleshooting Facebook and Instagram integrations for the eWasl application.

## Facebook Integration Setup

### 1. Facebook Developer Dashboard Configuration

1. Go to your [Facebook Developer Dashboard](https://developers.facebook.com/apps)
2. Select your eWasl app (ID: 1366325774493759)
3. Go to Settings > Basic
   - Add `app.ewasl.com` to the "App Domains" field
   - If you want to test with your development URL, add: `fef338dc-e049-44e4-a807-4f4800367452-00-2nzpmkm3jlqvg.riker.replit.co`
   - Make sure your Privacy Policy URL is set (required for all apps)
   - Save changes

4. Go to Products > Facebook Login > Settings
   - Make sure "Client OAuth Login" is ON
   - Make sure "Web OAuth Login" is ON
   - Add both production and development callback URLs to "Valid OAuth Redirect URIs":
     ```
     https://app.ewasl.com/api/facebook/callback
     https://app.ewasl.com/auth/facebook/callback
     https://fef338dc-e049-44e4-a807-4f4800367452-00-2nzpmkm3jlqvg.riker.replit.co/api/facebook/callback
     https://fef338dc-e049-44e4-a807-4f4800367452-00-2nzpmkm3jlqvg.riker.replit.co/auth/facebook/callback
     ```
   - Save changes

5. Go to App Review > Permissions and Features
   - Request all required permissions:
     - public_profile
     - email
     - pages_show_list
     - pages_read_engagement
     - pages_manage_posts
   - Provide detailed use cases for each permission when submitting for review

### 2. Adding Facebook Pages Access

To use the Facebook integration for posting on business pages:

1. Go to Products > Facebook Login > Settings
2. Add these additional permissions:
   - pages_read_engagement
   - pages_manage_posts
   - pages_show_list
3. Go through App Review to get approval for these permissions
4. Connect your Facebook account through the eWasl application
5. Grant access to the Facebook Pages you want to manage

## Instagram Integration Setup

### 1. Basic Instagram API Setup

1. Go to your Facebook Developer Dashboard
2. Select your eWasl app
3. Go to Products > Instagram > Basic Display
   - Add Instagram to your app if not already added
   - Configure the Instagram App:
     - Set "Instagram App ID" and "Instagram App Secret" (these should match your Facebook App ID/Secret)
     - Add the Redirect URI: `https://app.ewasl.com/api/instagram/callback`
     - Also add development URL if testing: `https://fef338dc-e049-44e4-a807-4f4800367452-00-2nzpmkm3jlqvg.riker.replit.co/api/instagram/callback`
     - Add "Data Deletion Request URL" (optional): `https://app.ewasl.com/api/instagram/data-deletion`
   - Save changes

### 2. Instagram Graph API Setup (for Business Accounts)

1. Go to Products > Instagram > Graph API
   - You need a Facebook Page connected to an Instagram Business account
   - Add all required permissions:
     - instagram_basic
     - instagram_content_publish
     - instagram_manage_insights
   - Go through App Review for these permissions

### 3. Instagram Webhooks (for Real-time Updates)

1. Go to Products > Instagram > Webhooks
   - Set the Callback URL to: `https://app.ewasl.com/instagram/webhook`
   - Set the Verify Token to: `eWaslToken123`
   - Subscribe to fields:
     - comments
     - live_comments
     - message_reactions
     - messages
     - messaging_handover
     - messaging_optins
     - messaging_postbacks
     - messaging_referral
     - messaging_seen
     - standby
   - Verify and save

## Common Issues and Troubleshooting

### Facebook "URL Blocked" Error

If you see "URL Blocked - This redirect failed because the redirect URI is not whitelisted in the app's Client OAuth Settings", follow these steps:

1. Verify the callback URL in your code exactly matches what's in Facebook Developer settings
2. Add the domain to "App Domains" in Basic Settings
3. Add the full callback URL to "Valid OAuth Redirect URIs"
4. Check for any trailing slashes or http/https mismatches
5. Make sure Client OAuth Login is enabled

### Instagram "Invalid platform app" Error

This error typically occurs when:

1. Your Instagram app isn't properly connected to your Facebook app
2. The callback URL doesn't match what's configured in the app
3. You don't have a business account connected

To fix:
1. Ensure you've added Instagram Basic Display to your Facebook app
2. Verify the Redirect URI matches exactly
3. Connect a business Instagram account to a Facebook Page
4. Make sure you've requested the correct permissions

### Facebook Page Post Permission Issues

To post to Facebook Pages, you need:

1. A Page access token (not just a user access token)
2. The following permissions:
   - pages_read_engagement
   - pages_manage_posts
3. The user must be an admin or editor of the Page
4. The Page must be connected to your app

## All eWasl Social Media Redirect URLs

For reference, here are all the callback URLs used by eWasl:

### Facebook
- `https://app.ewasl.com/api/facebook/callback`
- `https://app.ewasl.com/auth/facebook/callback`

### Instagram
- OAuth: `https://app.ewasl.com/api/instagram/callback`
- Webhook: `https://app.ewasl.com/instagram/webhook`

### Twitter
- `https://app.ewasl.com/auth/twitter/callback`

### LinkedIn
- `https://app.ewasl.com/api/linkedin/callback`

## Next Steps After Configuration

Once you've configured all platforms:

1. Connect your social media accounts through the eWasl application
2. Test posting content to each platform
3. Verify analytics data is being received correctly
4. Set up webhooks to receive real-time updates