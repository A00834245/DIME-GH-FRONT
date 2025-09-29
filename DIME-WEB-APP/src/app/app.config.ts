import { ApplicationConfig, provideBrowserGlobalErrorListeners, provideZonelessChangeDetection, importProvidersFrom } from '@angular/core';
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
} from './auth/msal-config';


export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideZonelessChangeDetection(),
    provideRouter(routes), 
    provideClientHydration(withEventReplay()),
    provideHttpClient(withInterceptorsFromDi()),
    importProvidersFrom(MsalModule),
    {provide: MSAL_INSTANCE, useFactory: MSALInstanceFactory},
    {provide: MSAL_GUARD_CONFIG, useFactory: MSALGuardConfigFactory},
    {provide: MSAL_INTERCEPTOR_CONFIG, useFactory: MSALInterceptorConfigFactory},
    {provide: HTTP_INTERCEPTORS, useClass: MsalInterceptor, multi: true},
    MsalService,
    MsalGuard,
    MsalBroadcastService,
  ]
};
