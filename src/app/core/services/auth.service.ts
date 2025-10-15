import { Inject, Injectable, Optional } from '@angular/core';
import { Router } from '@angular/router';
import { MSAL_GUARD_CONFIG, MsalGuardConfiguration, MsalService } from '@azure/msal-angular';
import { RedirectRequest } from '@azure/msal-browser';
import { environment } from '@core/environments/environment';
import { LoggingService } from './logging.service';

@Injectable({ providedIn: 'root' })
export class AuthService {
    private mockUser = {
        username: 'dev-user@localhost',
        name: 'Development User',
        localAccountId: 'mock-dev-user'
    };

    constructor(
        @Optional() @Inject(MSAL_GUARD_CONFIG) private guardConfig: MsalGuardConfiguration | null,
        @Optional() private msal: MsalService | null,
        private router: Router,
        private logging: LoggingService
    ) {
        if (!environment.enableMsal) {
            console.log('[AUTH] MSAL is disabled - using bypass mode for development');
            return;
        }

        console.log('[AUTH] MSAL enabled - AuthService constructor called');
        console.log('[AUTH] Guard config:', this.guardConfig);
        
        if (this.msal) {
            // Handle authentication state changes
            this.msal.handleRedirectObservable().subscribe({
                next: (result) => {
                    console.log('[AUTH] Handle redirect result:', result);
                    if (result && result.account) {
                        console.log('[AUTH] Authentication successful, navigating to map');
                        this.msal!.instance.setActiveAccount(result.account);
                        this.router.navigate(['/map']);
                    } else if (result) {
                        console.log('[AUTH] Redirect handled but no account found');
                    }
                },
                error: (error) => {
                    console.error('[AUTH] Authentication error:', error);
                }
            });
        }
    }

    login(): void {
        if (!environment.enableMsal) {
            console.log('[AUTH] Mock login - bypassing authentication');
            this.router.navigate(['/map']);
            return;
        }

        console.log('[AUTH] Login method called');
        
        if (!this.msal || !this.guardConfig) {
            console.error('[AUTH] MSAL not available');
            return;
        }

        console.log('[AUTH] Current accounts:', this.msal.instance.getAllAccounts());
        
        try {
            const req: RedirectRequest | undefined = this.guardConfig.authRequest as RedirectRequest;
            console.log('[AUTH] Login request:', req);
            
            if (req) {
                console.log('[AUTH] Calling loginRedirect with request');
                this.msal.loginRedirect({...req});
            } else {
                console.log('[AUTH] Calling loginRedirect without request');
                this.msal.loginRedirect();
            }
        } catch (error) {
            console.error('[AUTH] Error in login method:', error);
            throw error;
        }
    }

    logout(): void {
        if (!environment.enableMsal) {
            console.log('[AUTH] Mock logout');
            this.router.navigate(['/login']);
            return;
        }

        console.log('[AUTH] Logout method called');
        this.logging.logEvent('LOGOUT_INITIATED');
        // Best-effort pre-clean of client storage before redirecting to AAD logout
        this.deepClientCleanup().catch(err => console.warn('[AUTH] Pre-clean failed:', err));

        if (this.msal) {
            try {
                const instance = this.msal.instance;
                const active = instance.getActiveAccount();
                const accounts = instance.getAllAccounts();
                const account = active || (accounts.length > 0 ? accounts[0] : undefined);
                this.msal.logoutRedirect({
                    account,
                    postLogoutRedirectUri: environment.msal.postLogoutRedirectUri
                });
            } catch (error) {
                console.error('[AUTH] Error during logoutRedirect:', error);
                this.logging.logError('LOGOUT_REDIRECT_ERROR', error);
                // Fallback: perform local logout if redirect fails
                this.localLogout('logoutRedirect failed');
            }
        } else {
            // Fallback if MSAL service is not available
            this.localLogout('MSAL service unavailable');
        }
    }

    isLoggedIn(): boolean {
        if (!environment.enableMsal) {
            console.log('[AUTH] Mock isLoggedIn - always returning true');
            return true;
        }

        if (!this.msal) {
            console.log('[AUTH] MSAL not available, returning false');
            return false;
        }

        const accounts = this.msal.instance.getAllAccounts();
        const loggedIn = accounts.length > 0;
        console.log('[AUTH] isLoggedIn check:', loggedIn, 'accounts:', accounts);
        return loggedIn;
    }

    getCurrentUser() {
        if (!environment.enableMsal) {
            console.log('[AUTH] Mock getCurrentUser - returning mock user');
            return this.mockUser;
        }

        if (!this.msal) {
            console.log('[AUTH] MSAL not available, returning null');
            return null;
        }

        const accounts = this.msal.instance.getAllAccounts();
        const user = accounts.length > 0 ? accounts[0] : null;
        console.log('[AUTH] getCurrentUser:', user);
        return user;
    }

    /**
     * Returns the idTokenClaims from the active account (or first available),
     * which is the canonical source for user identity claims (name, email, roles, etc.).
     */
    getIdTokenClaims(): any | null {
        if (!environment.enableMsal) {
            // Provide mock claims in bypass mode for consistent UI behavior
            return {
                name: this.mockUser.name,
                preferred_username: this.mockUser.username,
                oid: this.mockUser.localAccountId,
            };
        }

        if (!this.msal) {
            console.log('[AUTH] MSAL not available, returning null claims');
            return null;
        }

        const active = this.msal.instance.getActiveAccount();
        if (active?.idTokenClaims) {
            return active.idTokenClaims as any;
        }

        const accounts = this.msal.instance.getAllAccounts();
        if (accounts.length > 0) {
            return (accounts[0].idTokenClaims || null) as any;
        }

        return null;
    }

    private async deepClientCleanup(): Promise<void> {
        // Overwrite and remove sessionStorage
        try {
            const keys = Object.keys(sessionStorage);
            for (const key of keys) {
                try {
                    const value = sessionStorage.getItem(key) || '';
                    if (value) {
                        const overwrite = '0'.repeat(Math.min(value.length, 2048));
                        sessionStorage.setItem(key, overwrite);
                    }
                } catch {}
                try { sessionStorage.removeItem(key); } catch {}
            }
            try { sessionStorage.clear(); } catch {}
        } catch {}

        // Overwrite and remove localStorage
        try {
            const keys = Object.keys(localStorage);
            for (const key of keys) {
                try {
                    const value = localStorage.getItem(key) || '';
                    if (value) {
                        const overwrite = '0'.repeat(Math.min(value.length, 2048));
                        localStorage.setItem(key, overwrite);
                    }
                } catch {}
                try { localStorage.removeItem(key); } catch {}
            }
            try { localStorage.clear(); } catch {}
        } catch {}

        // Best-effort cookie clear
        try {
            document.cookie.split(';').forEach(c => {
                const [name] = c.split('=');
                const trimmed = (name || '').trim();
                if (!trimmed) { return; }
                document.cookie = `${trimmed}=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/`;
            });
        } catch {}

        // Cache Storage
        if ('caches' in window) {
            try {
                const keys = await caches.keys();
                await Promise.all(keys.map(k => caches.delete(k)));
            } catch {}
        }

        // IndexedDB
        if ('indexedDB' in window) {
            try {
                const anyIDB: any = indexedDB as any;
                if (anyIDB.databases) {
                    const dbs = await anyIDB.databases();
                    await Promise.all((dbs || []).map((db: any) => db?.name && new Promise<void>(resolve => {
                        const req = indexedDB.deleteDatabase(db.name);
                        req.onsuccess = req.onerror = req.onblocked = () => resolve();
                    })));
                }
            } catch {}
        }

        // Post-cleaning verification: log any leftovers of sensitive keys/resources
        try {
            const sensitive = ['msal', 'token', 'auth', 'azure', 'idtoken', 'accesstoken', 'refreshtoken'];

            const lsLeft = (() => {
                try { return Object.keys(localStorage).filter(k => sensitive.some(s => k.toLowerCase().includes(s))); } catch { return []; }
            })();
            const ssLeft = (() => {
                try { return Object.keys(sessionStorage).filter(k => sensitive.some(s => k.toLowerCase().includes(s))); } catch { return []; }
            })();
            const cookiesLeft = (() => {
                try {
                    const names = document.cookie.split(';').map(c => (c.split('=')[0] || '').trim()).filter(Boolean);
                    return names.filter(n => sensitive.some(s => n.toLowerCase().includes(s)));
                } catch { return []; }
            })();

            let cachesLeft: string[] = [];
            if ('caches' in window) {
                try { cachesLeft = await caches.keys(); } catch {}
            }

            let dbsLeft: string[] = [];
            if ('indexedDB' in window) {
                try {
                    const anyIDB: any = indexedDB as any;
                    if (anyIDB.databases) {
                        const dbs = await anyIDB.databases();
                        dbsLeft = (dbs || []).map((d: any) => d?.name).filter(Boolean) as string[];
                    }
                } catch {}
            }

            if ((lsLeft && lsLeft.length) || (ssLeft && ssLeft.length) || (cookiesLeft && cookiesLeft.length) || (cachesLeft && cachesLeft.length) || (dbsLeft && dbsLeft.length)) {
                console.warn('[AUTH] Post-cleaning verification found leftovers', { lsLeft, ssLeft, cookiesLeft, cachesLeft, dbsLeft });
            } else {
                console.log('[AUTH] Post-cleaning verification passed');
            }
        } catch {}
    }

    private async localLogout(reason?: string): Promise<void> {
        try {
            console.warn('[AUTH] Performing local logout', reason || '');
            this.logging.logEvent('LOCAL_LOGOUT', { reason });
            await this.deepClientCleanup();
        } catch (e) {
            console.warn('[AUTH] Local cleanup encountered an error:', e);
            this.logging.logError('LOCAL_LOGOUT_CLEANUP_ERROR', e);
        }
        this.router.navigate(['/login']);
    }
}