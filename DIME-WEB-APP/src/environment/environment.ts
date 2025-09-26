export const environment = {
    production: false,
    msal: {
        clientId: process.env['NG_APP_AZURE_CLIENT_ID'],
        tenantId: process.env['NG_APP_AZURE_TENANT_ID'],
        authority: process.env['NG_APP_AZURE_AUTHORITY'],
        redirectUri: 'http://localhost:4200',
        postLogoutRedirectUri: 'http://localhost:4200'
    }
};