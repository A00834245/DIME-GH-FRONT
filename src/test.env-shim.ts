// Minimal Node.js-like process.env shim for Karma/Jasmine browser tests
// Ensures code using process.env does not crash in the browser.
// Only defines what we need for tests; values can be overridden via window.__TEST_ENV__ if desired.

declare global {
  interface Window {
    __TEST_ENV__?: Record<string, string>;
  }
}

// Provide a very small subset of process just for env access
// eslint-disable-next-line @typescript-eslint/no-explicit-any
(window as any).process = (window as any).process || {};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const proc: any = (window as any).process;
proc.env = proc.env || Object.assign({
  NG_APP_AZURE_CLIENT_ID: '',
  NG_APP_AZURE_AUTHORITY: 'login.microsoftonline.com',
  NG_APP_AZURE_TENANT_NAME: 'common',
  NG_APP_AZURE_REDIRECT_URI: 'http://localhost:9876',
  NG_APP_AZURE_AUTHORITY_DOMAIN: 'login.microsoftonline.com',
  NG_APP_GOOGLE_MAPS_API_KEY: '',
  NG_APP_GOOGLE_MAP_ID: '',
  NG_APP_GOOGLE_DATASET_ID: '',
  NG_APP_GOOGLE_STYLE_ID: '',
  NG_APP_GOOGLE_PROJECT_ID: ''
}, window.__TEST_ENV__ || {});

export {};


