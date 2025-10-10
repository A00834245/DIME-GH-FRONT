import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { AuthService } from '@core/services/auth.service';
import { HeaderComponent } from '@layout/components/header/header.component';

@Component({
  selector: 'app-profile-page',
  standalone: true,
  imports: [CommonModule, HeaderComponent],
  templateUrl: './profile.page.html',
  styleUrl: './profile.page.css'
})
export class ProfilePage implements OnInit {
  protected readonly userName = signal<string>('');
  protected readonly userEmail = signal<string>('');
  protected readonly userRole = signal<string>('');
  protected readonly userDepartment = signal<string>('');

  constructor(
    private readonly authService: AuthService,
    private readonly router: Router
  ) {}

  ngOnInit(): void {
    this.loadUserInfo();
  }

  private loadUserInfo(): void {
    const user = this.authService.getCurrentUser();
    if (user) {
      this.userName.set(user.name || user.username || 'Usuario');
      this.userEmail.set(user.username || 'No disponible');
      // You can add more user properties as needed
      this.userRole.set('Usuario'); // Replace with actual role if available
      this.userDepartment.set('No disponible'); // Replace with actual department if available
    } else {
      this.userName.set('Usuario');
      this.userEmail.set('No disponible');
      this.userRole.set('Usuario');
      this.userDepartment.set('No disponible');
    }
  }

  protected handleProfile(): void {
    // Already on profile page, do nothing or refresh
    console.log('Already on profile page');
  }

  protected handleLogout(): void {
    this.authService.logout();
  }

  protected goBack(): void {
    this.router.navigate(['/map']);
  }
}

