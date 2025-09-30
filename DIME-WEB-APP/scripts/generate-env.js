#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

// Function to parse .env file
function parseEnvFile(filePath) {
  if (!fs.existsSync(filePath)) {
    return {};
  }
  
  const envContent = fs.readFileSync(filePath, 'utf8');
  const envVars = {};
  
  envContent.split('\n').forEach(line => {
    line = line.trim();
    if (line && !line.startsWith('#')) {
      const [key, ...valueParts] = line.split('=');
      if (key && valueParts.length > 0) {
        envVars[key.trim()] = valueParts.join('=').trim().replace(/^["']|["']$/g, '');
      }
    }
  });
  
  return envVars;
}

// Load environment variables from .env file if it exists
const envFilePath = path.join(__dirname, '../.env');
const envFileVars = parseEnvFile(envFilePath);

// Function to extract policy name from URL or return as-is if it's already a policy name
function extractPolicyName(userFlow) {
  if (!userFlow) return userFlow;
  
  // If it's a full URL, extract the policy name from the 'p=' parameter
  if (userFlow.startsWith('https://')) {
    try {
      const url = new URL(userFlow);
      const policyParam = url.searchParams.get('p');
      if (policyParam) {
        // Clean up any encoding issues or ellipsis characters
        let cleanPolicy = policyParam.replace(/â€¦/g, '').replace(/…/g, '').trim();
        
        // If the policy name seems truncated (ends with special chars), provide a default
        if (cleanPolicy === 'B2C_' || cleanPolicy.length < 5) {
          console.warn(`⚠️  Policy name '${cleanPolicy}' appears truncated. Using default 'B2C_1_signin'.`);
          console.warn('💡 Please update your .env file with the correct policy name.');
          return 'B2C_1_signin';
        }
        
        return cleanPolicy;
      }
      // If no 'p' parameter, try to extract from path
      const pathSegments = url.pathname.split('/');
      const lastSegment = pathSegments[pathSegments.length - 1];
      if (lastSegment && lastSegment.startsWith('B2C_')) {
        return lastSegment;
      }
    } catch (error) {
      console.warn(`⚠️  Error parsing URL: ${error.message}. Using default policy name.`);
      return 'B2C_1_signin';
    }
  }
  
  // Return as-is if it's already a policy name (starts with B2C_) or fallback
  return userFlow || 'B2C_1_signin';
}

// Read environment variables (prefer .env file, fallback to process.env)
const clientId = envFileVars.NG_APP_AZURE_CLIENT_ID || process.env.NG_APP_AZURE_CLIENT_ID;
const authorityDomain = envFileVars.NG_APP_AZURE_AUTHORITY_DOMAIN || process.env.NG_APP_AZURE_AUTHORITY_DOMAIN;
const tenantName = envFileVars.NG_APP_AZURE_TENANT_NAME || process.env.NG_APP_AZURE_TENANT_NAME;
const rawLoginUserFlow = envFileVars.NG_APP_AZURE_LOGIN_USER_FLOW || process.env.NG_APP_AZURE_LOGIN_USER_FLOW;
const loginUserFlow = extractPolicyName(rawLoginUserFlow);
const redirectUri = envFileVars.NG_APP_AZURE_REDIRECT_URI || process.env.NG_APP_AZURE_REDIRECT_URI;

// Check if all required environment variables are set
const requiredVars = [
  { name: 'NG_APP_AZURE_CLIENT_ID', value: clientId },
  { name: 'NG_APP_AZURE_AUTHORITY_DOMAIN', value: authorityDomain },
  { name: 'NG_APP_AZURE_TENANT_NAME', value: tenantName },
  { name: 'NG_APP_AZURE_LOGIN_USER_FLOW', value: loginUserFlow },
  { name: 'NG_APP_AZURE_REDIRECT_URI', value: redirectUri }
];

const missingVars = requiredVars.filter(v => !v.value);

// Check if .env file exists
const envFileExists = fs.existsSync(envFilePath);
console.log(`📁 Environment source: ${envFileExists ? '.env file' : 'system environment variables'}`);

// Debug: Show policy extraction if needed
if (rawLoginUserFlow && rawLoginUserFlow !== loginUserFlow) {
  console.log(`🔧 Extracted policy name: '${loginUserFlow}' from URL: '${rawLoginUserFlow.substring(0, 60)}...'`);
}

if (missingVars.length > 0) {
  console.warn('⚠️  Warning: The following environment variables are not set:');
  missingVars.forEach(v => console.warn(`   - ${v.name}`));
  console.warn('\nThe application will use undefined values for these variables.');
  
  if (!envFileExists) {
    console.warn('\n💡 Recommendation: Create a .env file in the project root with:');
    console.warn('NG_APP_AZURE_CLIENT_ID=your-client-id');
    console.warn('NG_APP_AZURE_AUTHORITY_DOMAIN=yourtenant.b2clogin.com');
    console.warn('NG_APP_AZURE_TENANT_NAME=yourtenant.onmicrosoft.com');
    console.warn('NG_APP_AZURE_LOGIN_USER_FLOW=B2C_1_signin  # Just the policy name, not a full URL');
    console.warn('NG_APP_AZURE_REDIRECT_URI=http://localhost:4200/auth-callback');
  } else {
    console.warn('\n💡 Check your .env file and make sure all variables are set.');
    console.warn('💡 Note: LOGIN_USER_FLOW should be just the policy name (e.g., B2C_1_signin), not a full URL.');
  }
  console.warn('\nAlternatively, use PowerShell environment variables:');
  console.warn('$env:NG_APP_AZURE_CLIENT_ID="your-value"\n');
} else {
  console.log('✅ All environment variables are set');
}

// Generate environment.ts content
const environmentContent = `// This file is auto-generated by scripts/generate-env.js
// Do not edit this file directly. It will be overwritten.
// Set environment variables and run 'npm run generate-env' to regenerate this file.

export const environment = {
  production: false,
  msal: {
    clientId: '${clientId || 'undefined'}',
    authority: 'https://${authorityDomain || 'undefined'}/${tenantName || 'undefined'}/${loginUserFlow || 'undefined'}',
    redirectUri: '${redirectUri || 'undefined'}',
    postLogoutRedirectUri: 'http://localhost:4200',
    knownAuthorities: ['${authorityDomain || 'undefined'}']
  }
};
`;

// Write the environment file
const envPath = path.join(__dirname, '../src/environment/environment.ts');
const envDir = path.dirname(envPath);

// Ensure directory exists
if (!fs.existsSync(envDir)) {
  fs.mkdirSync(envDir, { recursive: true });
}

// Write the file
fs.writeFileSync(envPath, environmentContent, 'utf8');

console.log(`📝 Generated environment.ts with current environment variables`);

if (missingVars.length === 0) {
  console.log('🚀 Ready to run ng serve!');
}
