import { Component, OnInit, OnDestroy, Inject, Optional, signal, PLATFORM_ID } from '@angular/core';
import { RouterOutlet, Router } from '@angular/router';
import { isPlatformBrowser } from '@angular/common';
import { MsalService, MsalBroadcastService, MSAL_GUARD_CONFIG, MsalGuardConfiguration } from '@azure/msal-angular';
import { EventMessage, EventType, InteractionStatus, AuthenticationResult } from '@azure/msal-browser';
import { Subject } from 'rxjs';
import { filter, takeUntil } from 'rxjs/operators';
import { environment } from '@core/environments/environment';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App implements OnInit, OnDestroy {
  protected readonly title = signal('DIME-WEB-APP');
  isIframe = false;
  private readonly destroy$ = new Subject<void>();

  constructor(
    @Optional() @Inject(MSAL_GUARD_CONFIG) private msalGuardConfig: MsalGuardConfiguration | null,
    @Inject(PLATFORM_ID) private platformId: Object,
    @Optional() private authService: MsalService | null,
    @Optional() private msalBroadcastService: MsalBroadcastService | null,
    private router: Router,
  ) {}

  ngOnInit(): void {
    console.log('App component initializing...');
    
    // Only access window object if we're in the browser
    if (!isPlatformBrowser(this.platformId)) {
      return;
    }

    this.isIframe = window !== window.parent && !window.opener;

    // Skip MSAL setup if disabled
    if (!environment.enableMsal) {
      console.log('[APP] MSAL is disabled - skipping authentication setup');
      return;
    }

    // Verify MSAL services are available
    if (!this.msalBroadcastService || !this.authService) {
      console.warn('[APP] MSAL services not available');
      return;
    }

    // Notify when MSAL interactions are done
    this.msalBroadcastService.inProgress$
      .pipe(
        filter((status: InteractionStatus) => status === InteractionStatus.None),
        takeUntil(this.destroy$)
      )
      .subscribe(() => {
        console.log('MSAL interaction complete');
        this.checkAndSetActiveAccount();
      });

    // Listen for LOGIN_SUCCESS
    this.msalBroadcastService.msalSubject$
      .pipe(
        filter((msg: EventMessage) => msg.eventType === EventType.LOGIN_SUCCESS),
        takeUntil(this.destroy$)
      )
      .subscribe((msg: EventMessage) => {
        console.log('Login success event received');
        const result = msg.payload as AuthenticationResult;
        if (result?.account && this.authService && !this.authService.instance.getActiveAccount()) {
          this.authService.instance.setActiveAccount(result.account);
        }
      });

    // Listen for LOGIN_FAILURE (e.g., AADB2C99002 user not found)
    this.msalBroadcastService.msalSubject$
      .pipe(
        filter((msg: EventMessage) => msg.eventType === EventType.LOGIN_FAILURE),
        takeUntil(this.destroy$)
      )
      .subscribe((msg: EventMessage) => {
        const err: any = (msg as any).error;
        const code = (err?.errorCode || '').toString().toUpperCase();
        const message = (err?.errorMessage || '').toString();

        if (code.includes('AADB2C99002')) {
          this.showToast('That user is not registered. Please verify your email.');
          this.router.navigate(['/login']);
          return;
        }

        console.error('LOGIN_FAILURE:', code, message);
        this.showToast('We could not sign you in. Please contact support.');
        this.router.navigate(['/login']);
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  checkAndSetActiveAccount() {
    if (!this.authService) {
      return;
    }

    let activeAccount = this.authService.instance.getActiveAccount();

    if (!activeAccount && this.authService.instance.getAllAccounts().length > 0) {
      let accounts = this.authService.instance.getAllAccounts();
      this.authService.instance.setActiveAccount(accounts[0]);
    }
  }

  // Replace with a real toast service if available
  private showToast(message: string): void {
    console.log('[Toast]', message);
    alert(message);
  }
}
