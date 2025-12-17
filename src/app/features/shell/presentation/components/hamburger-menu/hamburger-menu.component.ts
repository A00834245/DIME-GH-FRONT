import {
  Component,
  ElementRef,
  HostListener,
  OnDestroy,
  PLATFORM_ID,
  ViewChild,
  computed,
  effect,
  inject
} from '@angular/core';
import { NgFor, NgIf, NgSwitch, NgSwitchCase } from '@angular/common';
import { isPlatformBrowser } from '@angular/common';
import { MenuStateService } from '@features/shell/core/services/menu-state.service';
import { MenuNavigationService } from '@features/shell/core/services/menu-navigation.service';

@Component({
  selector: 'app-hamburger-menu',
  standalone: true,
  imports: [NgIf, NgFor, NgSwitch, NgSwitchCase],
  templateUrl: './hamburger-menu.component.html',
  styleUrl: './hamburger-menu.component.css'
})
export class HamburgerMenuComponent implements OnDestroy {
  @ViewChild('menuButton', { static: true }) menuButton?: ElementRef<HTMLButtonElement>;

  private readonly menuState = inject(MenuStateService);
  private readonly menuNavigation = inject(MenuNavigationService);
  private readonly platformId = inject(PLATFORM_ID);

  protected readonly isMenuOpen = this.menuState.isOpen;
  protected readonly menuError = this.menuState.errorMessage;
  protected readonly menuOptions = this.menuNavigation.options;
  protected readonly ariaExpanded = computed(() => `${this.isMenuOpen()}`);

  private readonly isBrowser = isPlatformBrowser(this.platformId);
  private readonly scrollLockEffect = this.createScrollLockEffect();

  ngOnDestroy(): void {
    this.scrollLockEffect?.destroy();
    if (this.isBrowser) {
      document.body.classList.remove('menu-open');
    }
  }

  protected toggleMenu(): void {
    this.menuState.toggleMenu();
    if (!this.menuState.isOpen()) {
      this.focusTrigger();
    }
  }

  protected openMenu(): void {
    this.menuState.openMenu();
  }

  protected closeMenu(): void {
    if (!this.isMenuOpen()) {
      return;
    }

    this.menuState.closeMenu();
    this.focusTrigger();
  }

  protected dismissError(): void {
    this.menuState.clearError();
  }

  async handleOptionSelected(optionId: string): Promise<void> {
    await this.menuNavigation.selectOption(optionId);
  }

  @HostListener('document:keydown.escape', ['$event'])
  onEscape(event: Event): void {
    if (!this.isMenuOpen()) {
      return;
    }

    event.preventDefault();
    event.stopPropagation();
    this.closeMenu();
  }

  private focusTrigger(): void {
    const button = this.menuButton?.nativeElement;
    if (this.isBrowser && button) {
      button.focus();
    }
  }

  private createScrollLockEffect() {
    if (!this.isBrowser) {
      return null;
    }

    return effect(() => {
      if (this.isMenuOpen()) {
        document.body.classList.add('menu-open');
      } else {
        document.body.classList.remove('menu-open');
      }
    });
  }
}

