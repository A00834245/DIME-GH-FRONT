import {
    IPublicClientApplication,
    PublicClientApplication,
    BrowserCacheLocation,
    InteractionType,
    LogLevel,
} from '@azure/msal-browser';
import {
    MsalGuardConfiguration,
    MsalInterceptorConfiguration,
} from '@azure/msal-angular';
import { environment } from '@core/environments/environment';

export function MSALInstanceFactory(): IPublicClientApplication {
    console.log('MSAL Instance Factory called');
    console.log('Environment MSAL config:', environment.msal);
    
    const msalConfig = {
        auth: {
            clientId: environment.msal.clientId,
            authority: environment.msal.authority,
            redirectUri: environment.msal.redirectUri,
            postLogoutRedirectUri: environment.msal.postLogoutRedirectUri,
            knownAuthorities: environment.msal.knownAuthorities,
        },
        cache: {
            cacheLocation: BrowserCacheLocation.LocalStorage,
            storeAuthStateInCookie: false,
        },
        system: {
            loggerOptions: {
                logLevel: LogLevel.Info,
                loggerCallback: (level: LogLevel, message: string, containsPii: boolean) => {
                    console.log('[MSAL]', message);
                }
            }
        }
    };
    
    console.log('Creating MSAL instance with config:', msalConfig);
    return new PublicClientApplication(msalConfig);
}

export function MSALGuardConfigFactory(): MsalGuardConfiguration {
    console.log('MSAL Guard Config Factory called');
    const config: MsalGuardConfiguration = {
        interactionType: InteractionType.Redirect,
        authRequest: { 
            scopes: ['openid', 'profile', 'offline_access']
        },
        loginFailedRoute: '/login',
    };
    console.log('Guard config created:', config);
    return config;
}

export function MSALInterceptorConfigFactory(): MsalInterceptorConfiguration {
    const protectResourceMap = new Map<string, Array<string>>();
    // Add your API endpoints here when you have them
    // protectResourceMap.set('https://your-api.com', ['https://your-api.com/access']);
    
    return {
        interactionType: InteractionType.Redirect,
        protectedResourceMap: protectResourceMap,
    };
}

