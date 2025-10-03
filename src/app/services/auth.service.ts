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
        console.log('AuthService constructor called');
        console.log('Guard config:', this.guardConfig);
        
        // Handle authentication state changes
        this.msal.handleRedirectObservable().subscribe({
            next: (result) => {
                console.log('Handle redirect result:', result);
                if (result && result.account) {
                    console.log('Authentication successful, navigating to map');
                    this.msal.instance.setActiveAccount(result.account);
                    this.router.navigate(['/map']);
                } else if (result) {
                    console.log('Redirect handled but no account found');
                }
            },
            error: (error) => {
                console.error('Authentication error:', error);
            }
        });
    }

    login() {
        console.log('Login method called');
        console.log('Current accounts:', this.msal.instance.getAllAccounts());
        
        try {
            const req: RedirectRequest | undefined = this.guardConfig.authRequest as RedirectRequest;
            console.log('Login request:', req);
            
            if (req) {
                console.log('Calling loginRedirect with request');
                return this.msal.loginRedirect({...req});
            } else {
                console.log('Calling loginRedirect without request');
                return this.msal.loginRedirect();
            }
        } catch (error) {
            console.error('Error in login method:', error);
            throw error;
        }
    }

    logout() {
        console.log('Logout method called');
        return this.msal.logoutRedirect();
    }

    isLoggedIn(): boolean {
        const accounts = this.msal.instance.getAllAccounts();
        const loggedIn = accounts.length > 0;
        console.log('isLoggedIn check:', loggedIn, 'accounts:', accounts);
        return loggedIn;
    }

    getCurrentUser() {
        const accounts = this.msal.instance.getAllAccounts();
        const user = accounts.length > 0 ? accounts[0] : null;
        console.log('getCurrentUser:', user);
        return user;
    }
}