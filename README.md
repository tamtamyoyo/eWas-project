# eWas.com Social Media Integration Platform

A comprehensive social media management platform that allows users to connect, post, and schedule content to various social media platforms from a single interface.

## 🌟 Features

- **Multi-Platform Integration**: Connect to multiple social media platforms (Twitter, Facebook, Instagram, LinkedIn, YouTube, TikTok, etc.)
- **Content Scheduling**: Schedule posts for optimal times
- **Analytics Dashboard**: Track engagement and performance
- **Team Collaboration**: Invite team members and manage permissions
- **AI-Powered Content Suggestions**: Get content ideas tailored to your audience
- **Media Management**: Organize and store media files
- **Subscription Plans**: Free and premium tiers with different feature sets

## 🔧 Tech Stack

- **Frontend**: React, TypeScript, TailwindCSS, Shadcn UI
- **Backend**: Node.js, Express
- **Database**: Supabase (PostgreSQL)
- **Authentication**: Supabase Auth with social logins
- **Payments**: Stripe
- **Email**: SendGrid
- **Analytics**: Custom analytics + platform APIs
- **Deployment**: Docker + any cloud provider

## 📋 Prerequisites

- Node.js 18 or later
- Supabase account
- Accounts on social media platforms for API access
- Stripe account (for payment processing)
- SendGrid account (for emails)

## 🚀 Getting Started

### 1. Clone the repository

```bash
git clone https://github.com/yourusername/ewas-project.git
cd ewas-project
```

### 2. Install dependencies

```bash
npm install
```

### 3. Configure environment

Run the setup script to create and configure the necessary environment files:

```bash
node setup.js
```

This script will guide you through setting up:
- Supabase configuration
- OAuth credentials for social platforms
- Stripe API keys
- SendGrid API keys
- Other required environment variables

### 4. Set up Supabase

Run the Supabase setup script to create the necessary database tables and configurations:

```bash
node setup-supabase.js
```

This script will guide you through:
- Creating a Supabase project
- Setting up database schema
- Configuring Row Level Security
- Setting up authentication
- Initializing with seed data (optional)

### 5. Start the development server

```bash
npm run dev
```

The application will be available at http://localhost:3000.

## 🔒 Authentication

The application supports multiple authentication methods:

- Email/Password
- Google
- Facebook
- Twitter
- Instagram
- LinkedIn

To configure these providers, you need to:

1. Register applications on each platform's developer portal
2. Configure redirect URIs
3. Add client IDs and secrets to your environment variables
4. Configure the providers in Supabase Auth settings

## 🧩 Social Media Integrations

### Supported Platforms

| Platform | Features | API Documentation |
|----------|----------|-------------------|
| Twitter | Post text, images, videos | [Twitter API](https://developer.twitter.com/en/docs) |
| Facebook | Post text, images, videos, stories | [Facebook Graph API](https://developers.facebook.com/docs/graph-api/) |
| Instagram | Post images, videos, stories | [Instagram Graph API](https://developers.facebook.com/docs/instagram-api/) |
| LinkedIn | Post text, images, articles | [LinkedIn API](https://docs.microsoft.com/en-us/linkedin/marketing/) |
| YouTube | Post videos | [YouTube API](https://developers.google.com/youtube/v3) |
| TikTok | Post videos | [TikTok API](https://developers.tiktok.com/) |

### Integration Setup

Each platform requires specific setup steps in their developer portals:

1. Create an application in the platform's developer portal
2. Configure OAuth redirect URIs
3. Request necessary permissions/scopes
4. Add the credentials to your environment variables

## 💳 Payment Processing

The application uses Stripe for payment processing and subscription management.

### Setting up Stripe

1. Create a Stripe account
2. Create products and pricing plans in the Stripe dashboard
3. Add Stripe API keys to your environment variables
4. Configure webhook endpoints

## 📧 Email Notifications

The application uses SendGrid for sending email notifications for:

- User registration
- Password reset
- Team invitations
- Post scheduling confirmations

### Setting up SendGrid

1. Create a SendGrid account
2. Create email templates
3. Add SendGrid API key to your environment variables

## 🐳 Deployment

The project includes Docker configuration for easy deployment:

### Using Docker

```bash
# Build the Docker image
docker build -t ewas-platform .

# Run the container
docker run -p 3000:3000 --env-file .env.production ewas-platform
```

### Using Docker Compose

```bash
docker-compose up -d
```

## 📝 API Documentation

The API documentation is available at `/api/docs` when running the application.

Key endpoints include:

- `/api/auth/*` - Authentication endpoints
- `/api/social-accounts` - Manage connected social accounts
- `/api/posts` - Create and manage posts
- `/api/subscription` - Manage subscription plans
- `/api/team-members` - Manage team members

## 🧪 Testing

```bash
# Run tests
npm test

# Run specific test file
npm test -- --testPathPattern=auth.test.js
```

## 🔄 CI/CD

The project includes GitHub Actions workflows for continuous integration and deployment.

## 📈 Monitoring

Production deployments should include:

- Error tracking (Sentry recommended)
- Performance monitoring
- Usage analytics

## 👥 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 📞 Support

For support, email support@ewas.com or create an issue in the GitHub repository. 