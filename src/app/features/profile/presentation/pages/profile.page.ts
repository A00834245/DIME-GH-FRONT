import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { AuthService } from '@core/services/auth.service';
import { HeaderComponent } from '@layout/components/header/header.component';
import { BottomSheetComponent } from '@shared/components/bottom-sheet/bottom-sheet.component';

@Component({
  selector: 'app-profile-page',
  standalone: true,
  imports: [CommonModule, HeaderComponent, BottomSheetComponent],
  templateUrl: './profile.page.html',
  styleUrl: './profile.page.css'
})
export class ProfilePage implements OnInit {
  protected readonly userName = signal<string>('');
  protected readonly userEmail = signal<string>('');
  protected readonly userRole = signal<string>('');
  protected readonly userDepartment = signal<string>('');
  protected readonly showLogoutModal = signal<boolean>(false);

  constructor(
    private readonly authService: AuthService,
    private readonly router: Router
  ) {}

  ngOnInit(): void {
    this.loadUserInfo();
  }

  private loadUserInfo(): void {
    const claims: any | null = this.authService.getIdTokenClaims();
    if (claims) {
      const name = claims.name || `${claims.given_name || ''} ${claims.family_name || ''}`.trim();
      const email = claims.email || claims.preferred_username || 'No disponible';
      this.userName.set(name || 'Usuario');
      this.userEmail.set(email);
      // Defaults for now; can be mapped from roles and department claims in the future
      this.userRole.set('Usuario');
      this.userDepartment.set('No disponible');
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
    this.showLogoutModal.set(true);
  }

  protected confirmLogout(): void {
    this.showLogoutModal.set(false);
    this.authService.logout();
  }

  protected cancelLogout(): void {
    this.showLogoutModal.set(false);
  }

  protected goBack(): void {
    this.router.navigate(['/map']);
  }
}

