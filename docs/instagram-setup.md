# Instagram API Integration for eWasl

This document outlines the steps needed to fully set up and configure the Instagram Business API integration for the eWasl platform.

## Webhook Configuration

The eWasl application is already configured to handle Instagram webhooks at the following endpoint:

```
https://app.ewasl.com/instagram/webhook
```

The verification token used is: `eWaslToken123`

### Steps to Configure in Facebook Developer Dashboard

1. Go to your [Facebook Developer Dashboard](https://developers.facebook.com/)
2. Select your app for eWasl
3. Navigate to "API Setup with Instagram Business login"
4. Set the following values:
   - Callback URL: `https://app.ewasl.com/instagram/webhook`
   - Verify Token: `eWaslToken123`
5. Click "Verify and Save"

### Testing the Webhook

Use the Graph API Explorer or run the following curl command to test your webhook:

```bash
curl -X POST "https://graph.facebook.com/v14.0/{YOUR_APP_ID}/subscriptions" \
  -d "object=page" \
  -d "callback_url=https://app.ewasl.com/instagram/webhook" \
  -d "fields=instagram_business_account" \
  -d "verify_token=eWaslToken123" \
  -d "access_token={YOUR_ACCESS_TOKEN}"
```

Replace `{YOUR_APP_ID}` and `{YOUR_ACCESS_TOKEN}` with your actual values.

## Instagram Authorization Flow

The eWasl application implements the Instagram OAuth flow with the following endpoints:

- Auth initialization: `/api/instagram/auth`
- Auth callback: `/api/instagram/callback`

The redirect URI is configured as:

```
https://app.ewasl.com/api/instagram/callback
```

### Required App Settings

Make sure your Instagram app has the following settings:

1. **Valid OAuth Redirect URIs**: Add `https://app.ewasl.com/api/instagram/callback`
2. **Deauthorize Callback URL**: Add `https://app.ewasl.com/instagram/deauthorize` (optional)
3. **Data Deletion Request URL**: Add `https://app.ewasl.com/instagram/data-deletion` (optional)

## Instagram API Usage

The eWasl platform uses the Instagram API for the following features:

1. Posting content to Instagram
2. Retrieving account statistics
3. Receiving webhook events for engagement updates

### Required Permissions

The application requires the following Instagram permissions:

- `user_profile`: To access basic profile information
- `user_media`: To access media from the user's account
- `instagram_basic`: For basic Instagram API features
- `instagram_content_publish`: For publishing content to Instagram
- `instagram_manage_insights`: For accessing account insights and statistics

## Troubleshooting

If you encounter issues with the Instagram integration:

1. Check that all redirect URIs are correctly configured
2. Verify that the webhook is properly set up and verified
3. Ensure all required permissions are granted
4. Check the application logs for detailed error messages

## Resources

- [Instagram Graph API Documentation](https://developers.facebook.com/docs/instagram-api/)
- [Instagram Business API Webhooks Guide](https://developers.facebook.com/docs/graph-api/webhooks/getting-started)
