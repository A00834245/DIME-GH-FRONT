import {
    IPublicClientApplication,
    PublicClientApplication,
    BrowserCacheLocation,
    InteractionType,
    LogLevel,
    AuthenticationResult,
} from '@azure/msal-browser';
import {
    MsalGuardConfiguration,
    MsalInterceptorConfiguration,
} from '@azure/msal-angular';
import {
    MsalGuardConfiguration,
    MsalInterceptorConfiguration
} from '../../environment/environment';

export function MSALInstanceFactory(): IPublicClientApplication {
    return new PublicClientApplication({
        auth: {
            clientId: environment.msal.clientId,
            authority: environment.msal.authority,
            redirectUri: environment.msal.redirectUri,
            postLogoutRedirectUri: environment.msal.postLogoutRedirectUri,
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

export function MSALGuardFactory(msalInstance: IPublicClientApplication): MsalGuardConfiguration {
    
}

