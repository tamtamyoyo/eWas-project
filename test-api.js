// Test script for eWas API endpoints
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

// Test function for health endpoint
async function testHealthEndpoint() {
  try {
    const response = await fetch(`${baseUrl}/api/health`);
    const data = await response.json();
    const success = response.ok && data.status === 'ok';
    printResult('Health Endpoint', success, data);
    return success;
  } catch (error) {
    printResult('Health Endpoint', false, null, error);
    return false;
  }
}

// Test function for login endpoint
async function testLoginEndpoint() {
  try {
    const response = await fetch(`${baseUrl}/api/auth/login`, {
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
    const success = response.ok && data.authSuccess === true;
    printResult('Login Endpoint', success, data);
    return success;
  } catch (error) {
    printResult('Login Endpoint', false, null, error);
    return false;
  }
}

// Test function for user endpoint
async function testUserEndpoint() {
  try {
    const response = await fetch(`${baseUrl}/api/auth/user`);
    const data = await response.json();
    const success = response.ok && data.id && data.email;
    printResult('User Endpoint', success, data);
    return success;
  } catch (error) {
    printResult('User Endpoint', false, null, error);
    return false;
  }
}

// Test function for social accounts endpoint
async function testSocialAccountsEndpoint() {
  try {
    const response = await fetch(`${baseUrl}/api/social-accounts`);
    const data = await response.json();
    const success = response.ok && Array.isArray(data) && data.length > 0;
    printResult('Social Accounts Endpoint', success, data);
    return success;
  } catch (error) {
    printResult('Social Accounts Endpoint', false, null, error);
    return false;
  }
}

// Test function for posts endpoint
async function testPostsEndpoint() {
  try {
    const response = await fetch(`${baseUrl}/api/posts`);
    const data = await response.json();
    const success = response.ok && Array.isArray(data) && data.length > 0;
    printResult('Posts Endpoint', success, data);
    return success;
  } catch (error) {
    printResult('Posts Endpoint', false, null, error);
    return false;
  }
}

// Test function for scheduled posts endpoint
async function testScheduledPostsEndpoint() {
  try {
    const response = await fetch(`${baseUrl}/api/posts/scheduled`);
    const data = await response.json();
    const success = response.ok && Array.isArray(data) && data.length > 0;
    printResult('Scheduled Posts Endpoint', success, data);
    return success;
  } catch (error) {
    printResult('Scheduled Posts Endpoint', false, null, error);
    return false;
  }
}

// Main function to run all tests
async function runAllTests() {
  console.log(`${colors.magenta}=== eWas API Testing Tool ===${colors.reset}`);
  console.log(`${colors.yellow}Testing server at: ${baseUrl}${colors.reset}`);
  console.log('-'.repeat(80));
  
  let passed = 0;
  let failed = 0;
  
  // Run tests
  (await testHealthEndpoint()) ? passed++ : failed++;
  (await testLoginEndpoint()) ? passed++ : failed++;
  (await testUserEndpoint()) ? passed++ : failed++;
  (await testSocialAccountsEndpoint()) ? passed++ : failed++;
  (await testPostsEndpoint()) ? passed++ : failed++;
  (await testScheduledPostsEndpoint()) ? passed++ : failed++;
  
  // Print summary
  console.log(`${colors.magenta}=== Test Summary ===${colors.reset}`);
  console.log(`${colors.green}Passed: ${passed}${colors.reset}`);
  console.log(`${colors.red}Failed: ${failed}${colors.reset}`);
  console.log(`${colors.yellow}Total: ${passed + failed}${colors.reset}`);
}

// Run the tests
runAllTests(); 