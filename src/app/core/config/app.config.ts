import { ApplicationConfig, provideBrowserGlobalErrorListeners, provideZonelessChangeDetection, importProvidersFrom, Provider } from '@angular/core';
import { provideRouter } from '@angular/router';
import { routes } from './app.routes';
import { provideClientHydration, withEventReplay } from '@angular/platform-browser';
import {
  provideHttpClient,
  withInterceptorsFromDi,
  HTTP_INTERCEPTORS,
} from '@angular/common/http';
import {
  MsalModule,
  MsalInterceptor,
  MsalService,
  MsalGuard,
  MsalBroadcastService,
  MSAL_INSTANCE,
  MSAL_GUARD_CONFIG,
  MSAL_INTERCEPTOR_CONFIG,
} from '@azure/msal-angular';
import {
  MSALInstanceFactory,
  MSALGuardConfigFactory,
  MSALInterceptorConfigFactory,
} from '@core/config/msal-config';
import { environment } from '@core/environments/environment';

/**
 * Returns MSAL providers only if MSAL is enabled in environment
 * Otherwise returns empty array to bypass authentication for development
 */
function getMsalProviders(): Provider[] {
  if (!environment.enableMsal) {
    console.log('[APP CONFIG] MSAL is disabled - using bypass mode for development');
    return [];
  }

  console.log('[APP CONFIG] MSAL is enabled - configuring authentication');
  return [
    // MSAL Configuration
    {
      provide: MSAL_INSTANCE, 
      useFactory: MSALInstanceFactory,
      deps: []
    },
    {
      provide: MSAL_GUARD_CONFIG, 
      useFactory: MSALGuardConfigFactory,
      deps: []
    },
    {
      provide: MSAL_INTERCEPTOR_CONFIG, 
      useFactory: MSALInterceptorConfigFactory,
      deps: []
    },
    {
      provide: HTTP_INTERCEPTORS, 
      useClass: MsalInterceptor, 
      multi: true
    },
    
    // MSAL Services
    MsalService,
    MsalGuard,
    MsalBroadcastService,
  ];
}

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideZonelessChangeDetection(),
    provideRouter(routes), 
    provideClientHydration(withEventReplay()),
    provideHttpClient(withInterceptorsFromDi()),
    
    // Conditionally include MSAL providers
    ...getMsalProviders(),
  ]
};
