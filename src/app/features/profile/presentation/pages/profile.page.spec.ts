import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { Router } from '@angular/router';
import { ProfilePage } from './profile.page';
import { AuthService } from '@core/services/auth.service';
import { UnsavedChangesService } from '@core/services/unsaved-changes.service';

describe('ProfilePage', () => {
  let authService: jasmine.SpyObj<AuthService>;
  let unsavedService: { hasUnsavedChanges: jasmine.Spy<() => boolean> };
  let router: jasmine.SpyObj<Router>;

  beforeEach(async () => {
    authService = jasmine.createSpyObj<AuthService>('AuthService', [
      'getIdTokenClaims',
      'logout'
    ]);

    // Default to no unsaved changes; individual tests will override as needed
    unsavedService = {
      hasUnsavedChanges: jasmine.createSpy('hasUnsavedChanges').and.returnValue(false)
    } as any;

    router = jasmine.createSpyObj<Router>('Router', ['navigate']);

    await TestBed.configureTestingModule({
      imports: [ProfilePage],
      providers: [
        { provide: AuthService, useValue: authService },
        { provide: UnsavedChangesService, useValue: unsavedService },
        { provide: Router, useValue: router }
      ]
    }).compileComponents();
  });

  function createComponent(): ComponentFixture<ProfilePage> {
    const fixture = TestBed.createComponent(ProfilePage);
    fixture.detectChanges();
    return fixture;
  }

  function setClaims(claims: any | null): void {
    authService.getIdTokenClaims.and.returnValue(claims);
  }

  it('should create', () => {
    setClaims({ name: 'Test User', email: 'test@example.com' });
    const fixture = createComponent();
    const component = fixture.componentInstance;
    expect(component).toBeTruthy();
  });

  it('should render user info from id token claims (name/email) and defaults for role/department', () => {
    const name = 'Development User';
    const email = 'dev.user@example.com';
    setClaims({ name, email });

    const fixture = createComponent();
    const compiled = fixture.nativeElement as HTMLElement;

    // Header welcome text should include user name
    const welcomeText = compiled.querySelector('.welcome-text')?.textContent ?? '';
    expect(welcomeText).toContain(`Bienvenido, ${name}`);

    // Info items are ordered: Nombre, Correo Electrónico, Rol, Departamento
    const values = Array.from(compiled.querySelectorAll('.info-item .info-value')).map(el => (el.textContent || '').trim());
    expect(values[0]).toBe(name);
    expect(values[1]).toBe(email);
    expect(values[2]).toBe('Usuario');
    expect(values[3]).toBe('No disponible');
  });

  it('should compute name from given_name/family_name and email from preferred_username when fields missing', () => {
    setClaims({ given_name: 'John', family_name: 'Doe', preferred_username: 'jdoe@contoso.com' });

    const fixture = createComponent();
    const compiled = fixture.nativeElement as HTMLElement;

    const values = Array.from(compiled.querySelectorAll('.info-item .info-value')).map(el => (el.textContent || '').trim());
    expect(values[0]).toBe('John Doe');
    expect(values[1]).toBe('jdoe@contoso.com');
  });

  it('should fall back to default values when claims are null', () => {
    setClaims(null);

    const fixture = createComponent();
    const compiled = fixture.nativeElement as HTMLElement;

    const values = Array.from(compiled.querySelectorAll('.info-item .info-value')).map(el => (el.textContent || '').trim());
    expect(values[0]).toBe('Usuario');
    expect(values[1]).toBe('No disponible');
    expect(values[2]).toBe('Usuario');
    expect(values[3]).toBe('No disponible');
  });

  it('should navigate back to /map when clicking the back button', () => {
    setClaims({ name: 'User', email: 'user@ex.com' });
    const fixture = createComponent();

    const backBtnDe = fixture.debugElement.query(By.css('.back-button'));
    backBtnDe.triggerEventHandler('click', null);

    expect(router.navigate).toHaveBeenCalledWith(['/map']);
  });

  it('should open logout modal with default title/message when no unsaved changes', () => {
    setClaims({ name: 'User', email: 'user@ex.com' });
    unsavedService.hasUnsavedChanges.and.returnValue(false);
    const fixture = createComponent();

    const logoutBtnDe = fixture.debugElement.query(By.css('.logout-button'));
    logoutBtnDe.triggerEventHandler('click', null);
    fixture.detectChanges();

    const titleEl = fixture.nativeElement.querySelector('.bottom-sheet-title') as HTMLElement;
    const messageEl = fixture.nativeElement.querySelector('.bottom-sheet-message') as HTMLElement;
    expect(titleEl.textContent?.trim()).toBe('Cerrar Sesión');
    expect(messageEl.textContent?.trim()).toBe('¿Estás seguro de que deseas cerrar sesión?');
  });

  it('should open logout modal with unsaved-changes title/message when there are unsaved changes', () => {
    setClaims({ name: 'User', email: 'user@ex.com' });
    unsavedService.hasUnsavedChanges.and.returnValue(true);
    const fixture = createComponent();

    const logoutBtnDe = fixture.debugElement.query(By.css('.logout-button'));
    logoutBtnDe.triggerEventHandler('click', null);
    fixture.detectChanges();

    const titleEl = fixture.nativeElement.querySelector('.bottom-sheet-title') as HTMLElement;
    const messageEl = fixture.nativeElement.querySelector('.bottom-sheet-message') as HTMLElement;
    expect(titleEl.textContent?.trim()).toBe('Cambios sin Guardar');
    expect(messageEl.textContent?.trim()).toBe('Tienes cambios sin guardar. Si cierras sesión ahora, se perderán todos los cambios no guardados. ¿Estás seguro de que deseas continuar?');
  });

  it('should call logout on confirm and close the modal', () => {
    setClaims({ name: 'User', email: 'user@ex.com' });
    unsavedService.hasUnsavedChanges.and.returnValue(false);
    const fixture = createComponent();

    // Open modal
    fixture.debugElement.query(By.css('.logout-button')).triggerEventHandler('click', null);
    fixture.detectChanges();

    // Confirm
    const confirmBtnDe = fixture.debugElement.query(By.css('.confirm-button'));
    confirmBtnDe.triggerEventHandler('click', null);
    fixture.detectChanges();

    expect(authService.logout).toHaveBeenCalled();
    // Overlay should be gone after close
    const overlay = fixture.nativeElement.querySelector('.bottom-sheet-overlay');
    expect(overlay).toBeNull();
  });

  it('should close the modal without logging out when clicking cancel', () => {
    setClaims({ name: 'User', email: 'user@ex.com' });
    unsavedService.hasUnsavedChanges.and.returnValue(true);
    const fixture = createComponent();

    // Open modal
    fixture.debugElement.query(By.css('.logout-button')).triggerEventHandler('click', null);
    fixture.detectChanges();

    // Cancel
    const cancelBtnDe = fixture.debugElement.query(By.css('.cancel-button'));
    cancelBtnDe.triggerEventHandler('click', null);
    fixture.detectChanges();

    expect(authService.logout).not.toHaveBeenCalled();
    const overlay = fixture.nativeElement.querySelector('.bottom-sheet-overlay');
    expect(overlay).toBeNull();
  });

  it('should close the modal when clicking the overlay', () => {
    setClaims({ name: 'User', email: 'user@ex.com' });
    const fixture = createComponent();

    // Open modal
    fixture.debugElement.query(By.css('.logout-button')).triggerEventHandler('click', null);
    fixture.detectChanges();

    // Click overlay (outside container)
    const overlayDe = fixture.debugElement.query(By.css('.bottom-sheet-overlay'));
    overlayDe.triggerEventHandler('click', new MouseEvent('click'));
    fixture.detectChanges();

    const overlay = fixture.nativeElement.querySelector('.bottom-sheet-overlay');
    expect(overlay).toBeNull();
  });

  it('should invoke handleProfile when clicking the header profile icon', () => {
    setClaims({ name: 'User', email: 'user@ex.com' });
    const fixture = createComponent();
    const component = fixture.componentInstance as any;
    const spy = spyOn(component, 'handleProfile').and.callThrough();

    const profileBtnDe = fixture.debugElement.query(By.css('.profile-icon-button'));
    profileBtnDe.triggerEventHandler('click', null);

    expect(spy).toHaveBeenCalled();
  });

  it('should render the company logo using default logoPath', () => {
    setClaims({ name: 'User', email: 'user@ex.com' });
    const fixture = createComponent();
    const imgEl: HTMLImageElement = fixture.debugElement.query(By.css('img.company-logo')).nativeElement;
    expect(imgEl.src).toContain('/images/AC.MX_logo.png');
  });
});


