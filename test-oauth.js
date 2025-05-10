// Test script for eWas OAuth flows
import fetch from 'node-fetch';

// Base URL for our test server
const baseUrl = 'http://localhost:3000';

// Color formatting for console output
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m'
};

// Helper to print test results
const printResult = (testName, success, result, error = null) => {
  const status = success ? `${colors.green}PASS${colors.reset}` : `${colors.red}FAIL${colors.reset}`;
  console.log(`${colors.blue}[TEST]${colors.reset} ${testName}: ${status}`);
  
  if (success) {
    console.log(`${colors.cyan}Result:${colors.reset}`, JSON.stringify(result, null, 2));
  } else {
    console.log(`${colors.red}Error:${colors.reset}`, error?.message || error || 'Unknown error');
  }
  console.log('-'.repeat(80));
};

// Test session handling
async function testSessionHandling() {
  try {
    // First login to get a session
    const loginResponse = await fetch(`${baseUrl}/api/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        email: 'test@example.com',
        password: 'password123'
      })
    });
    
    // Check if the response has a set-cookie header
    const setCookieHeader = loginResponse.headers.get('set-cookie');
    
    if (!setCookieHeader) {
      throw new Error('No session cookie returned from login');
    }
    
    // Extract the session cookie
    const sessionCookie = setCookieHeader.split(';')[0];
    
    // Test access to protected endpoint with the session cookie
    const userResponse = await fetch(`${baseUrl}/api/auth/user`, {
      headers: {
        'Cookie': sessionCookie
      }
    });
    
    const userData = await userResponse.json();
    const success = userResponse.ok && userData.id && userData.email;
    
    printResult('Session Handling', success, {
      sessionCookieReceived: !!setCookieHeader,
      userData
    });
    
    return success;
  } catch (error) {
    printResult('Session Handling', false, null, error);
    return false;
  }
}

// Test OAuth for all providers
async function testAllOAuthFlows() {
  const providers = [
    'google',
    'twitter',
    'facebook',
    'instagram'
  ];
  
  let results = [];
  
  for (const provider of providers) {
    try {
      console.log(`${colors.yellow}Testing ${provider} OAuth flow${colors.reset}`);
      
      // Step 1: Call the authorize endpoint directly
      const authorizeResponse = await fetch(`${baseUrl}/api/auth/${provider}/authorize`, {
        redirect: 'manual'
      });
      
      console.log(`${provider} authorize status:`, authorizeResponse.status);
      const redirectUrl = authorizeResponse.headers.get('location');
      console.log(`${provider} redirect URL:`, redirectUrl);
      
      if (!redirectUrl) {
        throw new Error(`No redirect URL returned from ${provider} authorize endpoint`);
      }
      
      // Step 2: Follow the redirect manually to the callback endpoint
      // We use the full redirect URL since it already has the right query params
      const callbackResponse = await fetch(new URL(redirectUrl, baseUrl).toString(), {
        headers: {
          // Get any cookies from the first response
          'Cookie': authorizeResponse.headers.get('set-cookie') || ''
        }
      });
      
      // Expect JSON response with success data
      const callbackData = await callbackResponse.json();
      
      const success = callbackResponse.ok && callbackData.success === true;
      results.push({
        provider,
        success,
        data: callbackData
      });
      
      printResult(`${provider} OAuth Flow`, success, callbackData);
    } catch (error) {
      console.error(`Error testing ${provider} OAuth:`, error);
      results.push({
        provider,
        success: false,
        error: error.message
      });
      
      printResult(`${provider} OAuth Flow`, false, null, error);
    }
  }
  
  return results;
}

// Main function to run all tests
async function runAllTests() {
  console.log(`${colors.magenta}=== eWas OAuth Testing Tool ===${colors.reset}`);
  console.log(`${colors.yellow}Testing server at: ${baseUrl}${colors.reset}`);
  console.log('-'.repeat(80));
  
  let passed = 0;
  let failed = 0;
  
  // Test session handling
  (await testSessionHandling()) ? passed++ : failed++;
  
  // Test all OAuth flows
  const oauthResults = await testAllOAuthFlows();
  
  // Count OAuth results
  oauthResults.forEach(result => {
    result.success ? passed++ : failed++;
  });
  
  // Print summary
  console.log(`${colors.magenta}=== Test Summary ===${colors.reset}`);
  console.log(`${colors.green}Passed: ${passed}${colors.reset}`);
  console.log(`${colors.red}Failed: ${failed}${colors.reset}`);
  console.log(`${colors.yellow}Total: ${passed + failed}${colors.reset}`);
}

// Run the tests
runAllTests(); 