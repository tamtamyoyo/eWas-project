# eWas.com Social Media Integration Platform - Deployment Guide

This guide provides detailed instructions for deploying the eWas.com social media integration platform to a production environment. Follow these steps in order to ensure a successful deployment.

## Prerequisites

- Node.js 18.x or higher
- PostgreSQL database (or Supabase account)
- Domain name with SSL certificate
- Accounts on social media platforms for API access
- Stripe account for payment processing
- SendGrid account for email delivery

## 1. Environment Setup

### 1.1 Create Environment Files

Run the setup script to generate environment files with your configuration:

```bash
node setup.js
```

For a production deployment, modify `.env.production` with your production values:

- Change `APP_URL` to your production domain
- Update all OAuth redirect URLs to use your production domain
- Set `NODE_ENV=production`

### 1.2 Register OAuth Applications

Register your application with each social media platform and configure the OAuth credentials:

- **Facebook**: https://developers.facebook.com/apps/
  - Create a Facebook App
  - Add Facebook Login product
  - Configure Valid OAuth Redirect URIs: `https://yourdomain.com/api/facebook/callback`

- **Google**: https://console.cloud.google.com/apis/credentials
  - Create OAuth 2.0 Client ID
  - Configure Authorized redirect URIs: `https://yourdomain.com/oauth2callback`

- **Twitter**: https://developer.twitter.com/en/portal/dashboard
  - Create Twitter App
  - Configure Callback URL: `https://yourdomain.com/auth/twitter/callback`

- **Instagram**: (via Facebook)
  - Add Instagram Basic Display to your Facebook App
  - Configure Valid OAuth Redirect URIs: `https://yourdomain.com/api/instagram/callback`

- **LinkedIn**: https://www.linkedin.com/developers/apps/
  - Create LinkedIn App
  - Configure OAuth 2.0 Redirect URLs: `https://yourdomain.com/api/linkedin/callback`

## 2. Database Setup

### 2.1 Supabase Setup

1. Create a new Supabase project at https://app.supabase.io/
2. Get your Supabase URL and API keys from the project settings
3. Run the schema migration script to set up the database structure:

```bash
node create-supabase-schema.js
```

4. Enable the Auth service in Supabase and configure the following:
   - Email authentication
   - OAuth providers (Google, Facebook, Twitter, etc.)
   - Redirect URLs for each provider

### 2.2 Data Migration (Optional)

If you're migrating from another database, run the migration script:

```bash
npm run db:migrate-to-supabase
```

## 3. Third-Party Services Configuration

### 3.1 Stripe Integration

1. Create a Stripe account and get your API keys
2. Create your products and pricing plans in the Stripe dashboard
3. Set up webhook endpoints:
   - Endpoint URL: `https://yourdomain.com/api/stripe-webhook`
   - Events to listen for: `checkout.session.completed`, `customer.subscription.updated`, `customer.subscription.deleted`

### 3.2 SendGrid Setup

1. Create a SendGrid account and get your API key
2. Create email templates for:
   - User registration
   - Password reset
   - Team invitations

## 4. Building and Deploying

### 4.1 Building the Application

```bash
# Install dependencies
npm install

# Build client and server
npm run build
```

### 4.2 Deployment Options

#### Option 1: Traditional Hosting

1. Upload the built files to your server
2. Install dependencies: `npm install --production`
3. Start the server: `npm start`

#### Option 2: Docker Deployment

1. Build the Docker image:
```bash
docker build -t ewas-platform .
```

2. Run the container:
```bash
docker run -p 3000:3000 --env-file .env.production ewas-platform
```

#### Option 3: Platform-as-a-Service (Heroku, Railway, etc.)

1. Connect your repository to the PaaS provider
2. Configure environment variables in the platform's dashboard
3. Deploy the application

## 5. Post-Deployment Tasks

### 5.1 SSL Configuration

Ensure your domain has a valid SSL certificate. Most PaaS providers handle this automatically, but if you're using traditional hosting, you'll need to configure SSL with Let's Encrypt or your hosting provider.

### 5.2 Verify OAuth Flows

Test each social media login flow to ensure they're working correctly:

1. Login with Google
2. Login with Facebook
3. Login with Twitter
4. Login with Instagram
5. Login with LinkedIn

### 5.3 Verify Payment Processing

Test the subscription flow:

1. Create a test customer
2. Subscribe to a plan using Stripe's test cards
3. Verify the webhook is processed correctly

### 5.4 Set Up Monitoring

Configure monitoring and error tracking:

1. Set up application logging
2. Configure error alerts
3. Set up performance monitoring

## 6. Security Checklist

Before going live, ensure the following security measures are in place:

- [ ] All sensitive API keys are stored in environment variables
- [ ] HTTPS is enforced for all connections
- [ ] CSRF protection is enabled
- [ ] Content Security Policy headers are configured
- [ ] Rate limiting is enabled for authentication endpoints
- [ ] Data validation is implemented for all inputs
- [ ] Row-level security is configured in Supabase

## 7. Backup and Recovery

Set up regular database backups:

1. Configure automatic Supabase backups
2. Set up a backup retention policy
3. Test the backup restoration process

## 8. Scaling Considerations

If you expect high traffic, consider the following optimizations:

- Implement caching for frequently accessed data
- Configure database connection pooling
- Set up a CDN for static assets
- Consider serverless functions for specific endpoints
- Implement horizontal scaling for the backend

## Troubleshooting

If you encounter issues during deployment, check the following:

1. **OAuth Integration Issues**:
   - Verify redirect URIs match exactly in both your application and provider dashboards
   - Check that necessary scopes are requested
   - Ensure your application is approved and in production mode

2. **Database Connection Issues**:
   - Verify database credentials
   - Check network access to database
   - Ensure RLS policies aren't blocking access

3. **API Integration Issues**:
   - Verify API keys are correctly set
   - Check API request logs for errors
   - Ensure you're not hitting rate limits

## Support

If you need additional help, contact support at support@ewas.com or create an issue in the GitHub repository. 