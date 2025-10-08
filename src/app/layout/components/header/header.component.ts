import { Component, Input, Output, EventEmitter } from '@angular/core';
import { NgIf } from '@angular/common';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [NgIf],
  template: `
    <header class="map-header">
      <div class="header-content">
        <div class="logo-container">
          <img [src]="logoPath" alt="Logo de la empresa" class="company-logo" />
        </div>
        <div class="user-info">
          <span class="welcome-text">Bienvenido, {{ userName }}</span>
          <button class="logout-button" (click)="onLogout()" type="button">
            Cerrar Sesión
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
  @Output() logout = new EventEmitter<void>();

  protected onLogout(): void {
    this.logout.emit();
  }
}

