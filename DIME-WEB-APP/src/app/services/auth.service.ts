import { Inject, Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { MSAL_GUARD_CONFIG, MsalGuardConfiguration, MsalService } from '@azure/msal-angular';
import { RedirectRequest } from '@azure/msal-browser';

@Injectable({ providedIn: 'root' })
export class AuthService {
    constructor(
        @Inject(MSAL_GUARD_CONFIG) private guardConfig: MsalGuardConfiguration,
        private msal: MsalService,
        private router: Router
    ) {
        // Handle authentication state changes
        this.msal.handleRedirectObservable().subscribe({
            next: (result) => {
                if (result && result.account) {
                    // Successful authentication, navigate to map
                    this.router.navigate(['/map']);
                }
            },
            error: (error) => {
                console.error('Authentication error:', error);
            }
        });
    }

    login() {
        const req: RedirectRequest | undefined = this.guardConfig.authRequest as RedirectRequest;
        return req ? this.msal.loginRedirect({...req}) : this.msal.loginRedirect();
    }

    logout() {
        return this.msal.logoutRedirect();
    }

    isLoggedIn(): boolean {
        return this.msal.instance.getAllAccounts().length > 0;
    }

    getCurrentUser() {
        const accounts = this.msal.instance.getAllAccounts();
        return accounts.length > 0 ? accounts[0] : null;
    }
}