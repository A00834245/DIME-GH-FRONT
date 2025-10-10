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
import { environment } from '../environments/environment';

export function MSALInstanceFactory(): IPublicClientApplication {
    console.log('MSAL Instance Factory called');
    console.log('Environment MSAL config:', environment.msal);
    
    const NETWORK_TIMEOUT_MS = 30_000;

    const networkClient = {
        sendGetRequestAsync: async (url: string, options?: any) => {
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), NETWORK_TIMEOUT_MS);
            try {
                const response = await fetch(url, {
                    method: 'GET',
                    headers: options?.headers || {},
                    signal: controller.signal,
                });
                const text = await response.text();
                let body: any = text;
                try { body = JSON.parse(text); } catch {}
                const headers: Record<string, string> = {};
                response.headers.forEach((value, key) => headers[key] = value);
                return { headers, body, status: response.status } as any;
            } catch (error) {
                console.error('[MSAL][GET] Network error:', error);
                throw error;
            } finally {
                clearTimeout(timeoutId);
            }
        },
        sendPostRequestAsync: async (url: string, options?: any) => {
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), NETWORK_TIMEOUT_MS);
            try {
                const response = await fetch(url, {
                    method: 'POST',
                    headers: options?.headers || {},
                    body: options?.body || undefined,
                    signal: controller.signal,
                });
                const text = await response.text();
                let body: any = text;
                try { body = JSON.parse(text); } catch {}
                const headers: Record<string, string> = {};
                response.headers.forEach((value, key) => headers[key] = value);
                return { headers, body, status: response.status } as any;
            } catch (error) {
                console.error('[MSAL][POST] Network error:', error);
                throw error;
            } finally {
                clearTimeout(timeoutId);
            }
        }
    };

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
            networkClient,
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
    // Add API endpoints here if needed
    // protectResourceMap.set('https://your-api.com', ['https://your-api.com/access']);
    
    return {
        interactionType: InteractionType.Redirect,
        protectedResourceMap: protectResourceMap,
    };
}

