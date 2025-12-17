import { Component, Input, Output, EventEmitter } from '@angular/core';
import { HamburgerMenuComponent } from '@features/shell/presentation/components/hamburger-menu/hamburger-menu.component';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [HamburgerMenuComponent],
  template: `
    <header class="map-header" role="banner">
      <div class="header-content">
        <div class="header-left">
          <app-hamburger-menu></app-hamburger-menu>
          <div class="logo-container">
            <img [src]="logoPath" alt="Logo de la empresa" class="company-logo" />
          </div>
        </div>
        <div class="user-info">
          <span class="welcome-text">Bienvenido, {{ userName }}</span>
          <button class="profile-icon-button" (click)="onProfile()" type="button" title="Ver perfil">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <circle cx="12" cy="12" r="11" stroke="currentColor" stroke-width="2"/>
              <circle cx="12" cy="9" r="3" fill="currentColor"/>
              <path d="M6 19.5C6 16.4624 8.46243 14 11.5 14H12.5C15.5376 14 18 16.4624 18 19.5" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
            </svg>
          </button>
        </div>
      </div>
    </header>
  `,
  styleUrl: './header.component.css'
})
export class HeaderComponent {
  @Input() logoPath: string = '/images/AC.MX_logo.png';
  @Input() userName: string = 'Usuario';
  @Output() profile = new EventEmitter<void>();

  protected onProfile(): void {
    this.profile.emit();
  }
}

