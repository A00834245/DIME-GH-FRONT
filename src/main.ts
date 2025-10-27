import { bootstrapApplication } from '@angular/platform-browser';
import { appConfig } from '@core/config/app.config';
import { App } from './app/app';

// Initialize MSAL before bootstrapping the app
console.log('Starting application with MSAL...');

bootstrapApplication(App, appConfig)
  .catch((err) => {
    console.error('Application bootstrap failed:', err);
  });
