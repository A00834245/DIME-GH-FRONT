import { DestroyRef, Injectable, signal } from '@angular/core';
import { NavigationEnd, Router } from '@angular/router';
import { EMPTY } from 'rxjs';
import { filter } from 'rxjs/operators';
import { AuthService } from '@core/services/auth.service';
import { MenuOption } from '@features/shell/domain/entities/menu-option.entity';
import { MenuStateService } from './menu-state.service';

@Injectable({ providedIn: 'root' })
export class MenuNavigationService {
  private readonly optionsSignal = signal<MenuOption[]>(this.buildBaseOptions());

  readonly options = this.optionsSignal.asReadonly();

  constructor(
    private readonly router: Router,
    private readonly authService: AuthService,
    private readonly menuState: MenuStateService,
    destroyRef: DestroyRef
  ) {
    this.markActiveOption(this.router.url ?? '');
    const sub = (this.router.events ?? EMPTY)
      .pipe(filter((event): event is NavigationEnd => event instanceof NavigationEnd))
      .subscribe((event) => {
        this.markActiveOption(event.urlAfterRedirects ?? event.url);
        this.menuState.clearError();
      });

    destroyRef.onDestroy(() => sub.unsubscribe());
  }

  async selectOption(optionId: string): Promise<void> {
    const option = this.optionsSignal().find((item) => item.id === optionId);
    if (!option) {
      this.menuState.setError('La opción seleccionada no está disponible.');
      return;
    }

    if (option.kind === 'route' && option.target) {
      await this.navigateTo(option);
      return;
    }

    if (option.kind === 'action' && option.id === 'logout') {
      this.executeLogout();
      return;
    }

    this.menuState.setError('Acción del menú no soportada.');
  }

  private async navigateTo(option: MenuOption): Promise<void> {
    try {
      const success = await this.executeNavigation(option.target!);
      if (!success) {
        this.menuState.setError('No se pudo navegar a la sección seleccionada.');
        return;
      }
      this.menuState.clearError();
      this.menuState.closeMenu();
    } catch (error) {
      console.error('[MenuNavigation] Navigation error', error);
      this.menuState.setError('Ocurrió un error al navegar.');
    }
  }

  private executeLogout(): void {
    try {
      this.menuState.clearError();
      this.menuState.closeMenu();
      this.authService.logout();
    } catch (error) {
      console.error('[MenuNavigation] Logout error', error);
      this.menuState.setError('No se pudo cerrar sesión. Intenta nuevamente.');
    }
  }

  private async executeNavigation(target: string): Promise<boolean> {
    const routerAny: any = this.router as any;
    if (typeof routerAny.navigateByUrl === 'function') {
      return await routerAny.navigateByUrl(target);
    }

    if (typeof routerAny.navigate === 'function') {
      return await routerAny.navigate([target]);
    }

    return false;
  }

  private markActiveOption(url: string): void {
    const cleanUrl = this.cleanUrl(url);
    this.optionsSignal.update((options) =>
      options.map((option) => ({
        ...option,
        isActive: option.kind === 'route' ? this.matchesRoute(cleanUrl, option.target) : false
      }))
    );
  }

  private matchesRoute(url: string, target?: string): boolean {
    if (!target) {
      return false;
    }

    if (target === '/') {
      return url === '/';
    }

    return url === target || url.startsWith(`${target}/`);
  }

  private cleanUrl(url: string): string {
    if (!url) {
      return '';
    }
    return url.split('?')[0]?.split('#')[0] ?? url;
  }

  private buildBaseOptions(): MenuOption[] {
    return [
      {
        id: 'map',
        label: 'Mapa',
        description: 'Visualiza las ubicaciones y visitas',
        icon: 'map',
        kind: 'route',
        target: '/map',
        isActive: false,
        ariaLabel: 'Ir al mapa'
      },
      {
        id: 'profile',
        label: 'Perfil',
        description: 'Configura tu información personal',
        icon: 'profile',
        kind: 'route',
        target: '/profile',
        isActive: false,
        ariaLabel: 'Ver perfil de usuario'
      },
      {
        id: 'logout',
        label: 'Cerrar Sesión',
        description: 'Salir de la aplicación de forma segura',
        icon: 'logout',
        kind: 'action',
        ariaLabel: 'Cerrar sesión'
      }
    ];
  }
}

