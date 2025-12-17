// Production environment configuration
// All values must be set via CI/CD environment variables
// @ngx-env/builder replaces process.env references at build time

type MetaEnv = Record<string, string | undefined>;
const metaEnv: MetaEnv = (import.meta as ImportMeta & { env?: MetaEnv }).env ?? {};

const readEnv = (key: keyof MetaEnv, fallback = ''): string => metaEnv[key] ?? fallback;

export const environment = {
  production: true,
  // Must remain false in production builds
  authBypass: false,
  // API Base URL - should be set via environment variable
  apiBaseUrl: readEnv('NG_APP_API_BASE_URL', 'https://dime-gh-vercel-back.vercel.app'),
  msal: {
    clientId: readEnv('NG_APP_AZURE_CLIENT_ID'),
    authority: `https://${readEnv('NG_APP_AZURE_AUTHORITY_DOMAIN')}/${readEnv('NG_APP_AZURE_TENANT_NAME')}/${readEnv('NG_APP_AZURE_LOGIN_USER_FLOW')}`,
    redirectUri: readEnv('NG_APP_AZURE_REDIRECT_URI'),
    postLogoutRedirectUri: readEnv('NG_APP_AZURE_REDIRECT_URI'),
    knownAuthorities: [readEnv('NG_APP_AZURE_AUTHORITY_DOMAIN')]
  },
  // Google Maps
  googleMapsApiKey: readEnv('NG_APP_GOOGLE_MAPS_API_KEY'),
  googleMapId: readEnv('NG_APP_GOOGLE_MAP_ID'),
  googleDatasetId: readEnv('NG_APP_GOOGLE_DATASET_ID'),
  googleStyleId: readEnv('NG_APP_GOOGLE_STYLE_ID'),
  googleProjectId: readEnv('NG_APP_GOOGLE_PROJECT_ID')
};
