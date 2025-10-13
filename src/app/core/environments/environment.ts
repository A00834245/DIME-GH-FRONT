// Development environment configuration
// Uses process.env variables that are loaded from .env file locally
// and from CI/CD environment variables in pipelines
// @ngx-env/builder replaces process.env references at build time

export const environment = {
  production: false,
  // Set to false to bypass MSAL authentication during development
  enableMsal: false,
  msal: {
    clientId: process.env['NG_APP_AZURE_CLIENT_ID'] || '',
    // authority: `https://${process.env['NG_APP_AZURE_AUTHORITY_DOMAIN']}/${process.env['NG_APP_AZURE_TENANT_NAME']}/${process.env['NG_APP_AZURE_LOGIN_USER_FLOW']}`,
    authority: 'https://login.microsoftonline.com/0b542b3a-1d71-47b8-a4c4-542cb8ff5591',
    redirectUri: process.env['NG_APP_AZURE_REDIRECT_URI'] || 'http://localhost:4200',
    postLogoutRedirectUri: process.env['NG_APP_AZURE_REDIRECT_URI'] || 'http://localhost:4200',
    knownAuthorities: [process.env['NG_APP_AZURE_AUTHORITY_DOMAIN'] || '']
  },
  // Google Maps
  googleMapsApiKey: process.env['NG_APP_GOOGLE_MAPS_API_KEY'] || '',
  googleMapId: process.env['NG_APP_GOOGLE_MAP_ID'] || '',
  googleDatasetId: process.env['NG_APP_GOOGLE_DATASET_ID'] || '',
  googleStyleId: process.env['NG_APP_GOOGLE_STYLE_ID'] || '',
  googleProjectId: process.env['NG_APP_GOOGLE_PROJECT_ID'] || ''
};
