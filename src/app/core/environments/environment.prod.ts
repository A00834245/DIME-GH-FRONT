// Production environment configuration
// All values must be set via CI/CD environment variables
// @ngx-env/builder replaces process.env references at build time

export const environment = {
  production: true,
  // MSAL is always enabled in production
  enableMsal: true,
  msal: {
    clientId: process.env['NG_APP_AZURE_CLIENT_ID'] || '',
    authority: `https://${process.env['NG_APP_AZURE_AUTHORITY_DOMAIN']}/${process.env['NG_APP_AZURE_TENANT_NAME']}/${process.env['NG_APP_AZURE_LOGIN_USER_FLOW']}`,
    redirectUri: process.env['NG_APP_AZURE_REDIRECT_URI'] || '',
    postLogoutRedirectUri: process.env['NG_APP_AZURE_REDIRECT_URI'] || '',
    knownAuthorities: [process.env['NG_APP_AZURE_AUTHORITY_DOMAIN'] || '']
  },
  // Google Maps
  googleMapsApiKey: process.env['NG_APP_GOOGLE_MAPS_API_KEY'] || '',
  googleMapId: process.env['NG_APP_GOOGLE_MAP_ID'] || '',
  googleDatasetId: process.env['NG_APP_GOOGLE_DATASET_ID'] || '',
  googleStyleId: process.env['NG_APP_GOOGLE_STYLE_ID'] || '',
  googleProjectId: process.env['NG_APP_GOOGLE_PROJECT_ID'] || ''
};
