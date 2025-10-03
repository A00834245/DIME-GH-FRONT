# Azure B2C Environment Setup Guide

## Required Environment Variables

You need to set these environment variables for MSAL authentication to work:

### Method 1: PowerShell (Recommended for development)

Open PowerShell and run these commands (replace with your actual values):

```powershell
$env:NG_APP_AZURE_CLIENT_ID="your-client-id-from-azure-portal"
$env:NG_APP_AZURE_AUTHORITY_DOMAIN="yourtenant.b2clogin.com"
$env:NG_APP_AZURE_TENANT_NAME="yourtenant.onmicrosoft.com"
$env:NG_APP_AZURE_LOGIN_USER_FLOW="B2C_1_signin"
$env:NG_APP_AZURE_REDIRECT_URI="http://localhost:4200/auth-callback"
```

### Method 2: Create .env file (Alternative)

Create a `.env` file in the project root with:

```bash
NG_APP_AZURE_CLIENT_ID=your-client-id-from-azure-portal
NG_APP_AZURE_AUTHORITY_DOMAIN=yourtenant.b2clogin.com
NG_APP_AZURE_TENANT_NAME=yourtenant.onmicrosoft.com
NG_APP_AZURE_LOGIN_USER_FLOW=B2C_1_signin
NG_APP_AZURE_REDIRECT_URI=http://localhost:4200/auth-callback
```

## How to Get These Values

### 1. Client ID
- Go to Azure Portal → Azure AD B2C → App registrations
- Find your app → Overview → Application (client) ID

### 2. Authority Domain
- Format: `yourtenant.b2clogin.com`
- Replace `yourtenant` with your actual tenant name

### 3. Tenant Name
- Format: `yourtenant.onmicrosoft.com`
- Replace `yourtenant` with your actual tenant name

### 4. User Flow
- Go to Azure Portal → Azure AD B2C → User flows
- Use the name of your sign-in user flow (e.g., `B2C_1_signin`)

### 5. Redirect URI
- Must be configured in Azure Portal → App registrations → Authentication
- Add `http://localhost:4200/auth-callback` as a redirect URI

## Example Values

```bash
NG_APP_AZURE_CLIENT_ID=12345678-1234-1234-1234-123456789012
NG_APP_AZURE_AUTHORITY_DOMAIN=arcacontinental.b2clogin.com
NG_APP_AZURE_TENANT_NAME=arcacontinental.onmicrosoft.com
NG_APP_AZURE_LOGIN_USER_FLOW=B2C_1_signin
NG_APP_AZURE_REDIRECT_URI=http://localhost:4200/auth-callback
```

## Testing the Setup

1. Set the environment variables using one of the methods above
2. Run `ng serve`
3. Open the browser to `http://localhost:4200`
4. Check the debug panel on the login page - all values should show as "✅ Set"
5. Click the "Iniciar sesión con Microsoft" button

## Troubleshooting

### Button doesn't work / Nothing happens
- Check the browser console for errors
- Verify all environment variables are set correctly
- Check the debug panel shows all values as "✅ Set"

### Can access /map without login
- Make sure all environment variables are properly set
- Check browser console for MSAL initialization errors
- Restart the dev server after setting environment variables

### Environment variables not loaded
- **PowerShell**: Make sure you're running `ng serve` from the same PowerShell session where you set the variables
- **.env file**: Install `dotenv` if needed and ensure the file is in the project root

## Remove Debug Panel

Once everything is working, remove the debug component:

1. Remove `<app-environment-debug></app-environment-debug>` from `login.page.html`
2. Remove `EnvironmentDebugComponent` from imports in `login.page.ts`
3. Delete the `src/app/debug` folder
