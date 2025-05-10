// Simplified test server for the eWas application
import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import cookieParser from 'cookie-parser';

// Set up environment variables
process.env.DATABASE_URL = process.env.DATABASE_URL || 'mock-database-url';
process.env.SESSION_SECRET = process.env.SESSION_SECRET || 'local-test-session-secret';
process.env.OPENAI_API_KEY = process.env.OPENAI_API_KEY || 'sk-dummy';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const port = 5000;
const host = '127.0.0.1';

// Basic middleware
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser(process.env.SESSION_SECRET));

// Serve static files from the public directory
app.use(express.static(path.join(__dirname, 'public')));

// API routes for testing
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'eWas test server is running' });
});

// Mock auth endpoint - now with session cookie
app.post('/api/auth/login', (req, res) => {
  const { email, password } = req.body;
  console.log(`Mock login attempt: ${email}`);
  
  if (email && password) {
    // Set a session cookie
    res.cookie('session', 'mock-session-value', {
      httpOnly: true,
      secure: false, // For local testing
      maxAge: 24 * 60 * 60 * 1000, // 1 day
      sameSite: 'lax',
      signed: true
    });
    
    res.json({
      id: 1,
      email,
      username: email.split('@')[0],
      fullName: 'Test User',
      currentPlan: 'free',
      authSuccess: true
    });
  } else {
    res.status(401).json({ message: 'Invalid credentials' });
  }
});

// Mock user endpoint - now checks for session
app.get('/api/auth/user', (req, res) => {
  // Check for valid session
  const sessionCookie = req.signedCookies.session;
  
  if (sessionCookie) {
    res.json({
      id: 1,
      email: 'test@example.com',
      username: 'testuser',
      fullName: 'Test User',
      currentPlan: 'free'
    });
  } else {
    res.status(401).json({ message: 'Unauthorized' });
  }
});

// Add OAuth initialization endpoints
const oauthProviders = ['google', 'twitter', 'facebook', 'instagram'];

oauthProviders.forEach(provider => {
  app.get(`/api/auth/${provider}/authorize`, (req, res) => {
    console.log(`Initiating ${provider} OAuth flow`);
    
    // In a real app, this would redirect to the provider's auth page
    // For testing, we just redirect to our callback endpoint with mock params
    let mockParams = '';
    
    if (provider === 'twitter') {
      // Store oauth_token_secret in session for Twitter's OAuth 1.0a
      res.cookie('oauth_token_secret', 'mock_oauth_token_secret', {
        httpOnly: true,
        secure: false, // For local testing
        maxAge: 10 * 60 * 1000, // 10 minutes
        sameSite: 'lax',
        signed: true
      });
      
      mockParams = 'oauth_token=mock_oauth_token&oauth_verifier=mock_oauth_verifier';
    } else {
      // OAuth 2.0 flow for other providers
      mockParams = 'code=mock_auth_code';
    }
    
    res.redirect(`/api/auth/${provider}/callback?${mockParams}`);
  });
  
  app.get(`/api/auth/${provider}/callback`, (req, res) => {
    console.log(`Processing ${provider} OAuth callback`, req.query);
    
    // Verify parameters based on provider
    let isValid = false;
    
    if (provider === 'twitter') {
      // For Twitter, check for oauth_token and oauth_verifier
      isValid = req.query.oauth_token && req.query.oauth_verifier;
      
      // In a real app, we would also check the oauth_token_secret from session
      const tokenSecret = req.signedCookies.oauth_token_secret;
      console.log('Twitter token secret from cookie:', tokenSecret);
    } else {
      // For OAuth 2.0 providers, check for code
      isValid = req.query.code;
    }
    
    if (isValid) {
      // Set a session cookie
      res.cookie('session', `mock-${provider}-session`, {
        httpOnly: true,
        secure: false, // For local testing
        maxAge: 24 * 60 * 60 * 1000, // 1 day
        sameSite: 'lax',
        signed: true
      });
      
      // In a real app, this would redirect to the frontend
      // For testing, just return success JSON
      res.json({
        success: true,
        provider,
        message: `Successfully authenticated with ${provider}`,
        user: {
          id: 1,
          email: `${provider}user@example.com`,
          username: `${provider}_user`,
          fullName: `${provider.charAt(0).toUpperCase() + provider.slice(1)} Test User`,
          socialAccounts: [{
            platform: provider,
            username: `${provider}_test_account`,
            status: 'connected'
          }]
        }
      });
    } else {
      res.status(400).json({
        success: false,
        message: `Invalid ${provider} OAuth callback parameters`
      });
    }
  });
});

// Add more mock endpoints for testing
// Get social accounts endpoint
app.get('/api/social-accounts', (req, res) => {
  res.json([
    {
      id: 1,
      userId: 1,
      platform: 'twitter',
      accessToken: 'mock-token',
      accountName: 'Test Twitter Account',
      username: 'testtwitter',
      profileUrl: 'https://twitter.com/testtwitter',
      status: 'connected'
    },
    {
      id: 2,
      userId: 1,
      platform: 'facebook',
      accessToken: 'mock-token',
      accountName: 'Test Facebook Page',
      username: 'testfacebook',
      profileUrl: 'https://facebook.com/testfacebook',
      status: 'connected'
    }
  ]);
});

// Get posts endpoint
app.get('/api/posts', (req, res) => {
  res.json([
    {
      id: 1,
      userId: 1,
      content: 'This is a test post for Twitter and Facebook',
      platforms: ['twitter', 'facebook'],
      mediaUrls: [],
      status: 'published',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    },
    {
      id: 2,
      userId: 1,
      content: 'This is a scheduled post',
      platforms: ['twitter', 'instagram'],
      mediaUrls: [],
      status: 'scheduled',
      scheduledAt: new Date(Date.now() + 86400000).toISOString(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }
  ]);
});

// Get scheduled posts endpoint
app.get('/api/posts/scheduled', (req, res) => {
  res.json([
    {
      id: 2,
      userId: 1,
      content: 'This is a scheduled post',
      platforms: ['twitter', 'instagram'],
      mediaUrls: [],
      status: 'scheduled',
      scheduledAt: new Date(Date.now() + 86400000).toISOString(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }
  ]);
});

// Catch-all route - serve a test page
app.get('*', (req, res) => {
  res.send(`
    <!DOCTYPE html>
    <html>
    <head>
      <title>eWas Test Server</title>
      <style>
        body {
          font-family: Arial, sans-serif;
          max-width: 800px;
          margin: 0 auto;
          padding: 20px;
          line-height: 1.6;
          background-color: #f5f7fa;
        }
        .container {
          border: 1px solid #ddd;
          border-radius: 8px;
          padding: 20px;
          margin-top: 20px;
          background-color: #ffffff;
          box-shadow: 0 1px 3px rgba(0,0,0,0.1);
        }
        h1 {
          color: #333;
        }
        button {
          background-color: #4CAF50;
          color: white;
          padding: 10px 15px;
          border: none;
          border-radius: 4px;
          cursor: pointer;
          margin: 5px;
        }
        button:hover {
          background-color: #45a049;
        }
        pre {
          background-color: #f1f1f1;
          padding: 10px;
          border-radius: 4px;
          overflow: auto;
        }
        .response {
          min-height: 100px;
          background-color: #fff;
          border: 1px solid #ddd;
          padding: 10px;
          margin-top: 10px;
        }
        .tab {
          overflow: hidden;
          border: 1px solid #ccc;
          background-color: #f1f1f1;
          border-radius: 4px 4px 0 0;
        }
        .tab button {
          background-color: inherit;
          float: left;
          border: none;
          outline: none;
          cursor: pointer;
          padding: 10px 15px;
          transition: 0.3s;
          color: #333;
        }
        .tab button:hover {
          background-color: #ddd;
        }
        .tab button.active {
          background-color: #4CAF50;
          color: white;
        }
        .tabcontent {
          display: none;
          padding: 20px;
          border: 1px solid #ccc;
          border-top: none;
          border-radius: 0 0 4px 4px;
          animation: fadeEffect 1s;
        }
        @keyframes fadeEffect {
          from {opacity: 0;}
          to {opacity: 1;}
        }
      </style>
    </head>
    <body>
      <h1>eWas Test Server</h1>
      <p>This is a simplified test server for the eWas social media management platform.</p>
      
      <div class="tab">
        <button class="tablinks active" onclick="openTab(event, 'ApiTests')">API Tests</button>
        <button class="tablinks" onclick="openTab(event, 'SocialAccounts')">Social Accounts</button>
        <button class="tablinks" onclick="openTab(event, 'Posts')">Posts</button>
        <button class="tablinks" onclick="openTab(event, 'OAuth')">OAuth Tests</button>
      </div>
      
      <div id="ApiTests" class="tabcontent" style="display: block;">
        <h2>Basic API Tests</h2>
        <button onclick="testHealthEndpoint()">Test Health Endpoint</button>
        <button onclick="testLoginEndpoint()">Test Login Endpoint</button>
        <button onclick="testUserEndpoint()">Test User Endpoint</button>
        
        <h3>Response:</h3>
        <div class="response" id="response1"></div>
      </div>
      
      <div id="SocialAccounts" class="tabcontent">
        <h2>Social Accounts Tests</h2>
        <button onclick="testSocialAccountsEndpoint()">Get Social Accounts</button>
        
        <h3>Response:</h3>
        <div class="response" id="response2"></div>
      </div>
      
      <div id="Posts" class="tabcontent">
        <h2>Posts Tests</h2>
        <button onclick="testPostsEndpoint()">Get All Posts</button>
        <button onclick="testScheduledPostsEndpoint()">Get Scheduled Posts</button>
        
        <h3>Response:</h3>
        <div class="response" id="response3"></div>
      </div>
      
      <div id="OAuth" class="tabcontent">
        <h2>OAuth Flow Tests</h2>
        <p>Click the buttons below to test OAuth flows for different providers:</p>
        
        <button onclick="testOAuthFlow('google')">Test Google OAuth</button>
        <button onclick="testOAuthFlow('twitter')">Test Twitter OAuth</button>
        <button onclick="testOAuthFlow('facebook')">Test Facebook OAuth</button>
        <button onclick="testOAuthFlow('instagram')">Test Instagram OAuth</button>
        
        <h3>Response:</h3>
        <div class="response" id="response4"></div>
      </div>
      
      <script>
        function openTab(evt, tabName) {
          var i, tabcontent, tablinks;
          tabcontent = document.getElementsByClassName("tabcontent");
          for (i = 0; i < tabcontent.length; i++) {
            tabcontent[i].style.display = "none";
          }
          tablinks = document.getElementsByClassName("tablinks");
          for (i = 0; i < tablinks.length; i++) {
            tablinks[i].className = tablinks[i].className.replace(" active", "");
          }
          document.getElementById(tabName).style.display = "block";
          evt.currentTarget.className += " active";
        }
        
        async function testHealthEndpoint() {
          try {
            const response = await fetch('/api/health');
            const data = await response.json();
            document.getElementById('response1').innerHTML = '<pre>' + JSON.stringify(data, null, 2) + '</pre>';
          } catch (error) {
            document.getElementById('response1').innerHTML = '<pre>Error: ' + error.message + '</pre>';
          }
        }
        
        async function testLoginEndpoint() {
          try {
            const response = await fetch('/api/auth/login', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json'
              },
              body: JSON.stringify({
                email: 'test@example.com',
                password: 'password123'
              })
            });
            const data = await response.json();
            document.getElementById('response1').innerHTML = '<pre>' + JSON.stringify(data, null, 2) + '</pre>';
          } catch (error) {
            document.getElementById('response1').innerHTML = '<pre>Error: ' + error.message + '</pre>';
          }
        }
        
        async function testUserEndpoint() {
          try {
            const response = await fetch('/api/auth/user');
            const data = await response.json();
            document.getElementById('response1').innerHTML = '<pre>' + JSON.stringify(data, null, 2) + '</pre>';
          } catch (error) {
            document.getElementById('response1').innerHTML = '<pre>Error: ' + error.message + '</pre>';
          }
        }
        
        async function testSocialAccountsEndpoint() {
          try {
            const response = await fetch('/api/social-accounts');
            const data = await response.json();
            document.getElementById('response2').innerHTML = '<pre>' + JSON.stringify(data, null, 2) + '</pre>';
          } catch (error) {
            document.getElementById('response2').innerHTML = '<pre>Error: ' + error.message + '</pre>';
          }
        }
        
        async function testPostsEndpoint() {
          try {
            const response = await fetch('/api/posts');
            const data = await response.json();
            document.getElementById('response3').innerHTML = '<pre>' + JSON.stringify(data, null, 2) + '</pre>';
          } catch (error) {
            document.getElementById('response3').innerHTML = '<pre>Error: ' + error.message + '</pre>';
          }
        }
        
        async function testScheduledPostsEndpoint() {
          try {
            const response = await fetch('/api/posts/scheduled');
            const data = await response.json();
            document.getElementById('response3').innerHTML = '<pre>' + JSON.stringify(data, null, 2) + '</pre>';
          } catch (error) {
            document.getElementById('response3').innerHTML = '<pre>Error: ' + error.message + '</pre>';
          }
        }
        
        async function testOAuthFlow(provider) {
          try {
            document.getElementById('response4').innerHTML = '<p>Initiating ' + provider + ' OAuth flow...</p>';
            
            // In a real application, this would redirect to the provider's auth page
            // For testing purposes, we'll fetch the response directly
            const response = await fetch('/api/auth/' + provider + '/authorize');
            
            // This would normally redirect, but for testing, we'll process the callback manually
            const callbackResponse = await fetch('/api/auth/' + provider + '/callback?' + 
              (provider === 'twitter' ? 'oauth_token=mock_oauth_token&oauth_verifier=mock_oauth_verifier' : 'code=mock_auth_code'));
            
            const data = await callbackResponse.json();
            document.getElementById('response4').innerHTML = '<pre>' + JSON.stringify(data, null, 2) + '</pre>';
          } catch (error) {
            document.getElementById('response4').innerHTML = '<pre>Error: ' + error.message + '</pre>';
          }
        }
      </script>
    </body>
    </html>
  `);
});

// Start the server
app.listen(port, host, () => {
  console.log(`eWas test server running at http://${host}:${port}/`);
  console.log('Available test endpoints:');
  console.log('- GET /api/health');
  console.log('- POST /api/auth/login');
  console.log('- GET /api/auth/user');
  console.log('- GET /api/social-accounts');
  console.log('- GET /api/posts');
  console.log('- GET /api/posts/scheduled');
  console.log('- GET /api/auth/[provider]/authorize');
  console.log('- GET /api/auth/[provider]/callback');
}); 