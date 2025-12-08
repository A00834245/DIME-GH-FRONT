// Development environment configuration
// Uses process.env variables that are loaded from .env file locally
// and from CI/CD environment variables in pipelines
// @ngx-env/builder replaces process.env references at build time

export const environment = {
  production: false,
  // Temporary: enable to bypass MSAL during local development
  authBypass: true,
  msal: {
    clientId: import.meta.env['NG_APP_AZURE_CLIENT_ID'] || '',
    authority: `https://${import.meta.env['NG_APP_AZURE_AUTHORITY_DOMAIN']}/${import.meta.env['NG_APP_AZURE_TENANT_NAME']}`,
    redirectUri: import.meta.env['NG_APP_AZURE_REDIRECT_URI'] || 'http://localhost:4200',
    postLogoutRedirectUri: import.meta.env['NG_APP_AZURE_REDIRECT_URI'] || 'http://localhost:4200',
    knownAuthorities: [import.meta.env['NG_APP_AZURE_AUTHORITY_DOMAIN'] || '']
  },
  // Google Maps
  googleMapsApiKey: import.meta.env['NG_APP_GOOGLE_MAPS_API_KEY'] || '',
  googleMapId: import.meta.env['NG_APP_GOOGLE_MAP_ID'] || '',
  googleDatasetId: import.meta.env['NG_APP_GOOGLE_DATASET_ID'] || '',
  googleStyleId: import.meta.env['NG_APP_GOOGLE_STYLE_ID'] || '',
  googleProjectId: import.meta.env['NG_APP_GOOGLE_PROJECT_ID'] || ''
};
