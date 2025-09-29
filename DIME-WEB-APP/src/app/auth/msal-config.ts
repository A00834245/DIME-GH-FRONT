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
import { environment } from '../../environment/environment';

export function MSALInstanceFactory(): IPublicClientApplication {
    return new PublicClientApplication({
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
                logLevel: LogLevel.Warning,
                loggerCallback: (_level, message) => {
                    console.log(message);
                }
            }
        }
    });
}

export function MSALGuardConfigFactory(): MsalGuardConfiguration {
    return {
        interactionType: InteractionType.Redirect,
        authRequest: { 
            scopes: ['openid', 'profile', 'offline_access']
        },
        loginFailedRoute: '/login-failed',
    };
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

