# Deploying to Railway via GitHub

This guide explains how to deploy the eWas.com application to Railway using GitHub integration.

## Prerequisites

1. GitHub account with this repository cloned or forked
2. Railway account (https://railway.app)
3. Railway CLI token

## Setup Steps

### 1. Generate a Railway Token

1. Install the Railway CLI: `npm install -g @railway/cli`
2. Login to Railway: `railway login`
3. Generate a token: `railway login --browserless`
4. Copy the token for the next step

### 2. Add the Railway Token to GitHub Secrets

1. Go to your GitHub repository
2. Navigate to Settings > Secrets and variables > Actions
3. Click "New repository secret"
4. Name: `RAILWAY_TOKEN`
5. Value: (paste your Railway token)
6. Click "Add secret"

### 3. Configure Environment Variables in Railway

1. Login to Railway dashboard
2. Select your project
3. Go to the "Variables" tab
4. Add all the necessary environment variables from the `.env.railway` file
5. Ensure all required environment variables are set:
   - `NODE_ENV=production`
   - `PORT=3000`
   - `HOST=0.0.0.0`
   - `DATABASE_URL` (Supabase PostgreSQL URL)
   - `SUPABASE_URL`
   - `SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY`
   - `SESSION_SECRET`
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
   - `API_URL`
   - `CLIENT_URL`

### 4. Run GitHub Workflow

1. Go to the "Actions" tab in your GitHub repository
2. Select the "Deploy to Railway" workflow
3. Click "Run workflow"
4. Select the branch (usually "main")
5. Click "Run workflow" button

### 5. Check Deployment Status

1. Go to Railway dashboard
2. Select your project
3. Go to the "Deployments" tab
4. Check the latest deployment status
5. Once deployed, your app will be available at the domain shown in the Railway dashboard

## Troubleshooting

### Deployment Fails

1. Check GitHub Actions logs for errors
2. Verify all environment variables are correctly set in Railway
3. Ensure the Railway token is valid and has the necessary permissions
4. Check if your Supabase project is active and accessible

### App Starts But Features Don't Work

Check for warnings in the logs about missing environment variables. Some features may be disabled if certain environment variables are not set, such as:

- Social media integration (Twitter, Facebook, Instagram, etc.)
- OpenAI API integration

## Continuous Deployment

With this setup, any push to the main branch will automatically trigger a deployment to Railway. 