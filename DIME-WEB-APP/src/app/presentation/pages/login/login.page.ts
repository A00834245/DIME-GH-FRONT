import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { AuthService } from '../../../services/auth.service';
import { EnvironmentDebugComponent } from '../../../debug/environment-debug.component';

@Component({
  selector: 'app-login-page',
  standalone: true,
  imports: [CommonModule, EnvironmentDebugComponent],
  templateUrl: './login.page.html',
  styleUrl: './login.page.css'
})
export class LoginPage implements OnInit {
  protected readonly isSubmitting = signal(false);
  protected readonly logoPath = '/images/AC.MX_logo.png';

  constructor(
    private readonly authService: AuthService,
    private readonly router: Router
  ) {}

  ngOnInit(): void {
    console.log('Login page ngOnInit');
    // If user is already logged in, redirect to map
    if (this.authService.isLoggedIn()) {
      console.log('User already logged in, redirecting to map');
      this.router.navigate(['/map']);
    } else {
      console.log('User not logged in, staying on login page');
    }
  }

  protected loginWithMicrosoft(): void {
    console.log('Login button clicked');
    this.isSubmitting.set(true);
    
    try {
      console.log('Calling authService.login()');
      this.authService.login();
    } catch (error) {
      console.error('Login failed:', error);
      this.isSubmitting.set(false);
    }
  }

  protected get isLoggedIn(): boolean {
    return this.authService.isLoggedIn();
  }
}


