import { Injectable, computed, signal } from '@angular/core';
import { MenuState } from '@features/shell/domain/entities/menu-state.entity';

@Injectable({ providedIn: 'root' })
export class MenuStateService {
  private readonly stateSignal = signal<MenuState>(MenuState.create());

  readonly state = this.stateSignal.asReadonly();
  readonly isOpen = computed(() => this.stateSignal().isOpen);
  readonly errorMessage = computed(() => this.stateSignal().errorMessage);

  openMenu(): void {
    this.stateSignal.update((current) => current.open());
  }

  closeMenu(): void {
    this.stateSignal.update((current) => current.close());
  }

  toggleMenu(): void {
    this.stateSignal.update((current) => current.toggle());
  }

  setError(message: string): void {
    this.stateSignal.update((current) => current.withError(message));
  }

  clearError(): void {
    this.stateSignal.update((current) => current.clearError());
  }
}

