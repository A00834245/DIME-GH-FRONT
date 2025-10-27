// Define the type of the environment variables.
declare interface Env {
  readonly NODE_ENV: string;
  
  // Azure AD B2C Configuration
  readonly NG_APP_AZURE_CLIENT_ID: string;
  readonly NG_APP_AZURE_AUTHORITY_DOMAIN: string;
  readonly NG_APP_AZURE_TENANT_NAME: string;
  readonly NG_APP_AZURE_LOGIN_USER_FLOW: string;
  readonly NG_APP_AZURE_REDIRECT_URI: string;
  
  // Google Maps Configuration
  readonly NG_APP_GOOGLE_MAPS_API_KEY: string;
  readonly NG_APP_GOOGLE_MAP_ID: string;
  readonly NG_APP_GOOGLE_DATASET_ID: string;
  readonly NG_APP_GOOGLE_STYLE_ID: string;
  readonly NG_APP_GOOGLE_PROJECT_ID: string;
  
  [key: string]: any;
}

// Choose how to access the environment variables.
// Remove the unused options.

// 1. Use import.meta.env.YOUR_ENV_VAR in your code. (conventional)
declare interface ImportMeta {
  readonly env: Env;
}

// 2. Use _NGX_ENV_.YOUR_ENV_VAR in your code. (customizable)
// You can modify the name of the variable in angular.json.
// ngxEnv: {
//  define: '_NGX_ENV_',
// }
declare const _NGX_ENV_: Env;

// 3. Use process.env.YOUR_ENV_VAR in your code. (deprecated)
declare namespace NodeJS {
  export interface ProcessEnv extends Env {}
}
