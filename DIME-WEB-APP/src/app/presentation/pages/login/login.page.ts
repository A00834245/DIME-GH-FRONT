import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { AuthService } from '../../../services/auth.service';

@Component({
  selector: 'app-login-page',
  standalone: true,
  imports: [CommonModule],
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
    // If user is already logged in, redirect to map
    if (this.authService.isLoggedIn()) {
      this.router.navigate(['/map']);
    }
  }

  protected loginWithMicrosoft(): void {
    this.isSubmitting.set(true);
    try {
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


