export const environment = {
    production: false,
    msal: {
        clientId: process.env['NG_APP_AZURE_CLIENT_ID'] || '005b00f2-09f3-4165-96ee-071e9f61b002',
        authority: process.env['NG_APP_AZURE_AUTHORITY'] || 'https://your-tenant.b2clogin.com/your-tenant.onmicrosoft.com/B2C_1_signin',
        redirectUri: 'http://localhost:4200/auth-callback',
        postLogoutRedirectUri: 'http://localhost:4200',
        knownAuthorities: [process.env['NG_APP_AZURE_KNOWN_AUTHORITY'] || 'your-tenant.b2clogin.com']
    }
};