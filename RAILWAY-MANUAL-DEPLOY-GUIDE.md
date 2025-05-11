# Manual Railway Deployment Guide for eWas.com

This guide provides a simple step-by-step process to deploy eWas.com on Railway without using the CLI.

## Step 1: Create .env.railway File

Create a `.env.railway` file with these **required** variables:

```
NODE_ENV=production
PORT=3000
HOST=0.0.0.0
DATABASE_URL=postgresql://username:password@host:port/database
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
SESSION_SECRET=random-secret-string
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
```

## Step 2: Create a New Railway Project

1. Go to [Railway.app](https://railway.app/) and log in
2. Click "New Project" 
3. Select "Deploy from GitHub repo"
4. Connect and select your eWas.com GitHub repository

## Step 3: Configure Environment Variables

1. In your project dashboard, click on the "Variables" tab
2. Click "New Variable" > "Import from .env"
3. Upload your `.env.railway` file

## Step 4: Verify Deployment

1. Wait for the deployment to complete (check "Deployments" tab)
2. Once deployed, find your application URL from the "Deployments" tab
3. Visit `your-app-url/api/health` to verify the application is running

## Step 5: Troubleshooting

If your deployment fails, check:

1. Logs tab in Railway dashboard for error messages
2. Verify all environment variables are correctly set
3. Make sure your Supabase project is active and properly configured

## Additional Notes

- For production use, create a properly secured Supabase project
- If using the Docker deployment, make sure your Docker image builds successfully
- Ensure your DATABASE_URL correctly points to a valid PostgreSQL database

---
If you encounter specific errors, check the DEPLOYMENT-ERRORS.md file for solutions. 