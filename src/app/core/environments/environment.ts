// Development environment configuration
// Uses process.env variables that are loaded from .env file locally
// and from CI/CD environment variables in pipelines
// @ngx-env/builder replaces process.env references at build time

type MetaEnv = Record<string, string | undefined>;
const metaEnv: MetaEnv = (import.meta as ImportMeta & { env?: MetaEnv }).env ?? {};

const readEnv = (key: keyof MetaEnv, fallback = ''): string => metaEnv[key] ?? fallback;

export const environment = {
  production: false,
  // Temporary: enable to bypass MSAL during local development
  authBypass: true,
  // API Base URL - defaults to localhost for development
  apiBaseUrl: readEnv('NG_APP_API_BASE_URL', 'http://localhost:3000'),
  msal: {
    clientId: readEnv('NG_APP_AZURE_CLIENT_ID'),
    authority: `https://${readEnv('NG_APP_AZURE_AUTHORITY_DOMAIN')}/${readEnv('NG_APP_AZURE_TENANT_NAME')}`,
    redirectUri: readEnv('NG_APP_AZURE_REDIRECT_URI', 'http://localhost:4200'),
    postLogoutRedirectUri: readEnv('NG_APP_AZURE_REDIRECT_URI', 'http://localhost:4200'),
    knownAuthorities: [readEnv('NG_APP_AZURE_AUTHORITY_DOMAIN')]
  },
  // Google Maps
  googleMapsApiKey: readEnv('NG_APP_GOOGLE_MAPS_API_KEY'),
  googleMapId: readEnv('NG_APP_GOOGLE_MAP_ID'),
  googleDatasetId: readEnv('NG_APP_GOOGLE_DATASET_ID'),
  googleStyleId: readEnv('NG_APP_GOOGLE_STYLE_ID'),
  googleProjectId: readEnv('NG_APP_GOOGLE_PROJECT_ID')
};
