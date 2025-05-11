#!/bin/bash

# Railway deployment helper script
echo "🚂 eWas.com Railway Deployment Helper 🚂"
echo "=======================================\n"

# Check if the Railway CLI is installed
if ! command -v railway &> /dev/null; then
    echo "Railway CLI not found. Installing..."
    npm i -g @railway/cli
    if [ $? -ne 0 ]; then
        echo "❌ Failed to install Railway CLI. Please install it manually with: npm i -g @railway/cli"
        exit 1
    fi
fi

# Check login status
railway whoami &> /dev/null
if [ $? -ne 0 ]; then
    echo "⚠️ You need to login to Railway first."
    railway login
    if [ $? -ne 0 ]; then
        echo "❌ Failed to login to Railway."
        exit 1
    fi
fi

echo "✅ Logged in to Railway"

# Check if environment file exists
if [ ! -f ".env.railway" ]; then
    echo "⚠️ No .env.railway file found. Creating a template..."
    cat > .env.railway.example << EOL
NODE_ENV=production
PORT=3000
HOST=0.0.0.0
DATABASE_URL=postgresql://postgres:yourpassword@db.ymhkgyfgpddifplpsnyt.supabase.co:5432/postgres
SUPABASE_URL=https://ymhkgyfgpddifplpsnyt.supabase.co
SUPABASE_ANON_KEY=your-anon-key-here
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key-here
SESSION_SECRET=random-session-secret-value
VITE_SUPABASE_URL=https://ymhkgyfgpddifplpsnyt.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here
EOL
    echo "📝 Created .env.railway.example. Fill in your values and rename it to .env.railway"
    exit 1
fi

# List existing projects
echo "\n📋 Your Railway projects:"
railway projects

# Prompt for project ID or creation
echo "\n🤔 Do you want to deploy to an existing project or create a new one? (existing/new):"
read project_choice

if [ "$project_choice" = "new" ]; then
    echo "📝 Enter a name for your new project:"
    read project_name
    railway project create "$project_name"
    railway link
else
    echo "📝 Enter your project ID to link (from the list above):"
    read project_id
    railway link "$project_id"
fi

# Link successful
echo "✅ Linked to Railway project"

# Upload environment variables
echo "\n📤 Uploading environment variables from .env.railway..."
railway variables set -f .env.railway

# Time for deployment
echo "\n🚀 Ready to deploy? (yes/no):"
read deploy_choice

if [ "$deploy_choice" = "yes" ]; then
    echo "\n🚀 Deploying to Railway..."
    railway up
    echo "\n✅ Deployment initiated! Check status on Railway dashboard."
    echo "🌐 Your app will be available at the domain shown in Railway dashboard once deployment completes."
else
    echo "\n🔍 OK, you can deploy later with 'railway up' command."
fi

echo "\n🎉 Done!" 