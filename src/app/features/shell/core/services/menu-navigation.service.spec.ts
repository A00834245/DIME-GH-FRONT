import { TestBed, fakeAsync, flushMicrotasks } from '@angular/core/testing';
import { Subject } from 'rxjs';
import { NavigationEnd, Router } from '@angular/router';
import { MenuNavigationService } from './menu-navigation.service';
import { AuthService } from '@core/services/auth.service';
import { MenuStateService } from './menu-state.service';

class RouterStub {
  url = '/map';
  private readonly eventsSubject = new Subject<NavigationEnd>();
  readonly events = this.eventsSubject.asObservable();
  navigateByUrl = jasmine.createSpy('navigateByUrl').and.returnValue(Promise.resolve(true));

  emitNavigation(url: string): void {
    this.url = url;
    this.eventsSubject.next(new NavigationEnd(1, url, url));
  }
}

describe('MenuNavigationService', () => {
  let service: MenuNavigationService;
  let router: RouterStub;
  let authService: jasmine.SpyObj<AuthService>;
  let menuState: jasmine.SpyObj<MenuStateService>;

  beforeEach(() => {
    router = new RouterStub();
    authService = jasmine.createSpyObj<AuthService>('AuthService', ['logout']);
    menuState = jasmine.createSpyObj<MenuStateService>('MenuStateService', [
      'closeMenu',
      'clearError',
      'setError'
    ]);

    TestBed.configureTestingModule({
      providers: [
        MenuNavigationService,
        { provide: Router, useValue: router },
        { provide: AuthService, useValue: authService },
        { provide: MenuStateService, useValue: menuState }
      ]
    });

    service = TestBed.inject(MenuNavigationService);
  });

  it('should highlight active option after navigation event', () => {
    router.emitNavigation('/profile');
    const options = service.options();
    const profileOption = options.find((opt) => opt.id === 'profile');
    expect(profileOption?.isActive).toBeTrue();
  });

  it('should navigate to route options', fakeAsync(() => {
    router.navigateByUrl.and.returnValue(Promise.resolve(true));
    service.selectOption('map');
    flushMicrotasks();

    expect(router.navigateByUrl).toHaveBeenCalledWith('/map');
    expect(menuState.clearError).toHaveBeenCalled();
    expect(menuState.closeMenu).toHaveBeenCalled();
  }));

  it('should surface errors when option is missing', async () => {
    await service.selectOption('unknown');
    expect(menuState.setError).toHaveBeenCalledWith(
      'La opción seleccionada no está disponible.'
    );
  });

  it('should surface navigation failures', fakeAsync(() => {
    router.navigateByUrl.and.returnValue(Promise.resolve(false));
    service.selectOption('profile');
    flushMicrotasks();

    expect(menuState.setError).toHaveBeenCalledWith(
      'No se pudo navegar a la sección seleccionada.'
    );
    expect(menuState.closeMenu).not.toHaveBeenCalled();
  }));

  it('should call logout action', fakeAsync(() => {
    service.selectOption('logout');
    flushMicrotasks();
    expect(authService.logout).toHaveBeenCalled();
    expect(menuState.closeMenu).toHaveBeenCalled();
  }));
});

