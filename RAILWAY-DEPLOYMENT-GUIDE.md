# eWas.com Deployment Guide for Railway

This guide explains how to properly deploy the eWas.com application on Railway with the correct environment variables configuration.

## Prerequisites

1. A [Railway account](https://railway.app/)
2. Access to the project's GitHub repository
3. API keys for the external services you plan to use (Supabase, social platforms, etc.)

## Deployment Steps

### 1. Set Up a New Project in Railway

1. Log in to your Railway account
2. Click "New Project"
3. Select "Deploy from GitHub repo"
4. Connect your GitHub account if not already connected
5. Select the eWas.com repository

### 2. Configure Environment Variables

For the application to work correctly, you need to set up the following **required** environment variables in Railway:

#### Core Required Variables

| Variable Name | Description | Example |
|---------------|-------------|---------|
| `NODE_ENV` | Environment mode | `production` |
| `SESSION_SECRET` | Secret for session encryption | `long-random-string` |
| `DATABASE_URL` | PostgreSQL connection string | `postgresql://user:pass@host:port/db` |
| `SUPABASE_URL` | Your Supabase project URL | `https://your-project.supabase.co` |
| `SUPABASE_ANON_KEY` | Supabase anonymous key | `your-anon-key` |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase service role key | `your-service-role-key` |

#### Optional But Recommended Variables

| Variable Name | Description | Default Value |
|---------------|-------------|--------------|
| `PORT` | Server port | `3000` |
| `HOST` | Server hostname | `0.0.0.0` |
| `API_URL` | URL for API endpoints | `https://your-app.up.railway.app/api` |
| `CLIENT_URL` | URL for client | `https://your-app.up.railway.app` |
| `CORS_ORIGIN` | CORS origins allowed | `*` |

### 3. Setting Up Social Media Integration

For each social media platform you want to integrate with, configure the corresponding variables:

#### Twitter/X

```
TWITTER_API_KEY=your-twitter-api-key
TWITTER_API_SECRET=your-twitter-api-secret
TWITTER_CALLBACK_URL=https://your-app.up.railway.app/auth/twitter/callback
```

#### Facebook

```
FACEBOOK_APP_ID=your-facebook-app-id
FACEBOOK_APP_SECRET=your-facebook-app-secret
FACEBOOK_CALLBACK_URL=https://your-app.up.railway.app/auth/facebook/callback
```

#### Instagram

```
INSTAGRAM_CLIENT_ID=your-instagram-client-id
INSTAGRAM_CLIENT_SECRET=your-instagram-client-secret
INSTAGRAM_CALLBACK_URL=https://your-app.up.railway.app/auth/instagram/callback
```

#### LinkedIn

```
LINKEDIN_CLIENT_ID=your-linkedin-client-id
LINKEDIN_CLIENT_SECRET=your-linkedin-client-secret
LINKEDIN_CALLBACK_URL=https://your-app.up.railway.app/auth/linkedin/callback
```

#### Snapchat

```
SNAPCHAT_CLIENT_ID=your-snapchat-client-id
SNAPCHAT_CLIENT_SECRET=your-snapchat-client-secret
SNAPCHAT_CALLBACK_URL=https://your-app.up.railway.app/auth/snapchat/callback
```

#### TikTok

```
TIKTOK_CLIENT_KEY=your-tiktok-client-key
TIKTOK_CLIENT_SECRET=your-tiktok-client-secret
TIKTOK_CALLBACK_URL=https://your-app.up.railway.app/auth/tiktok/callback
```

#### YouTube

```
YOUTUBE_API_KEY=your-youtube-api-key
YOUTUBE_CLIENT_ID=your-youtube-client-id
YOUTUBE_CLIENT_SECRET=your-youtube-client-secret
YOUTUBE_CALLBACK_URL=https://your-app.up.railway.app/auth/youtube/callback
```

### 4. Other Optional Services

#### Email (SendGrid)

```
SENDGRID_API_KEY=your-sendgrid-api-key
EMAIL_FROM=your-sender-email@example.com
```

#### Payment Processing (Stripe)

```
STRIPE_SECRET_KEY=your-stripe-secret-key
STRIPE_PUBLISHABLE_KEY=your-stripe-publishable-key
STRIPE_WEBHOOK_SECRET=your-stripe-webhook-secret
```

#### AI Features

```
OPENAI_API_KEY=your-openai-api-key
ANTHROPIC_API_KEY=your-anthropic-api-key
```

### 5. Client-Side Environment Variables

Railway will automatically handle client-side environment variables as long as they start with `VITE_`.
Make sure to set the following:

```
VITE_API_URL=https://your-app.up.railway.app/api
VITE_CLIENT_URL=https://your-app.up.railway.app
VITE_SUPABASE_URL=your-supabase-url
VITE_SUPABASE_ANON_KEY=your-supabase-anon-key
VITE_STRIPE_PUBLIC_KEY=your-stripe-publishable-key
```

## Checking Deployment Status

1. Once deployed, you can check the application health endpoint at: `https://your-app.up.railway.app/api/health`
2. If there are issues, check the Railway logs for any error messages
3. Verify that all required environment variables are correctly set

## Troubleshooting

### Application starts but features don't work

Check the logs for warnings about missing environment variables. The application will start even with missing configurations but certain features will be disabled.

### Database connection errors

Verify your `DATABASE_URL` is correctly formatted and that the database server is accessible from Railway.

### Social media integration not working

Confirm that you've set up the correct callback URLs in each social media platform's developer portal. These must match exactly what you've set in the environment variables.

### Stripe payments failing

Ensure you're using the correct API keys for the environment (test keys for testing, live keys for production).

## Additional Resources

- [Railway Documentation](https://docs.railway.app/)
- [Supabase Documentation](https://supabase.io/docs)
- For more help, reach out to the development team 