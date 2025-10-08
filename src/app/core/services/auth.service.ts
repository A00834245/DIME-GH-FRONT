import { Inject, Injectable, Optional } from '@angular/core';
import { Router } from '@angular/router';
import { MSAL_GUARD_CONFIG, MsalGuardConfiguration, MsalService } from '@azure/msal-angular';
import { RedirectRequest } from '@azure/msal-browser';
import { environment } from '@core/environments/environment';

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
        private router: Router
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
        if (this.msal) {
            this.msal.logoutRedirect();
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
}