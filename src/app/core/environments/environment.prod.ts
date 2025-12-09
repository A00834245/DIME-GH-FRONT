// Production environment configuration
// All values must be set via CI/CD environment variables
// @ngx-env/builder replaces process.env references at build time

export const environment = {
  production: true,
  // Must remain false in production builds
  authBypass: false,
  // API Base URL - should be set via environment variable
  apiBaseUrl: import.meta.env['NG_APP_API_BASE_URL'] || 'https://dime-gh-vercel-back.vercel.app',
  msal: {
    clientId: import.meta.env['NG_APP_AZURE_CLIENT_ID'] || '',
    authority: `https://${import.meta.env['NG_APP_AZURE_AUTHORITY_DOMAIN']}/${import.meta.env['NG_APP_AZURE_TENANT_NAME']}/${import.meta.env['NG_APP_AZURE_LOGIN_USER_FLOW']}`,
    redirectUri: import.meta.env['NG_APP_AZURE_REDIRECT_URI'] || '',
    postLogoutRedirectUri: import.meta.env['NG_APP_AZURE_REDIRECT_URI'] || '',
    knownAuthorities: [import.meta.env['NG_APP_AZURE_AUTHORITY_DOMAIN'] || '']
  },
  // Google Maps
  googleMapsApiKey: import.meta.env['NG_APP_GOOGLE_MAPS_API_KEY'] || '',
  googleMapId: import.meta.env['NG_APP_GOOGLE_MAP_ID'] || '',
  googleDatasetId: import.meta.env['NG_APP_GOOGLE_DATASET_ID'] || '',
  googleStyleId: import.meta.env['NG_APP_GOOGLE_STYLE_ID'] || '',
  googleProjectId: import.meta.env['NG_APP_GOOGLE_PROJECT_ID'] || ''
};
