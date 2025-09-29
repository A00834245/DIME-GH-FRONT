import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { AuthService } from '../../../services/auth.service';
import { MsalService } from '@azure/msal-angular';

@Component({
  selector: 'app-map-page',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './map.page.html',
  styleUrl: './map.page.css'
})
export class MapPage implements OnInit {
  protected readonly logoPath = '/images/AC.MX_logo.png';
  protected readonly userName = signal<string>('');

  constructor(
    private readonly authService: AuthService,
    private readonly router: Router,
    private readonly msalService: MsalService
  ) {}

  ngOnInit(): void {
    this.loadUserInfo();
  }

  private loadUserInfo(): void {
    const accounts = this.msalService.instance.getAllAccounts();
    if (accounts.length > 0) {
      const account = accounts[0];
      this.userName.set(account.name || account.username || 'Usuario');
    }
  }

  protected logout(): void {
    this.authService.logout();
  }

  protected goToMap(): void {
    // This is where you'll integrate with your map functionality
    console.log('Navigating to map view...');
  }
}
