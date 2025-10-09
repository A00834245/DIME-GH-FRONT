import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { Router } from '@angular/router';
import { LoginPage } from './login.page';
import { AuthService } from '@core/services/auth.service';

describe('LoginPage', () => {
  let authService: jasmine.SpyObj<AuthService>;
  let router: jasmine.SpyObj<Router>;

  beforeEach(async () => {
    authService = jasmine.createSpyObj<AuthService>('AuthService', ['login', 'isLoggedIn']);
    router = jasmine.createSpyObj<Router>('Router', ['navigate']);

    await TestBed.configureTestingModule({
      imports: [LoginPage],
      providers: [
        { provide: AuthService, useValue: authService },
        { provide: Router, useValue: router }
      ]
    }).compileComponents();
  });

  function createComponent(): ComponentFixture<LoginPage> {
    const fixture = TestBed.createComponent(LoginPage);
    fixture.detectChanges();
    return fixture;
  }

  it('should create', () => {
    authService.isLoggedIn.and.returnValue(false);
    const fixture = createComponent();
    const component = fixture.componentInstance;
    expect(component).toBeTruthy();
  });

  it('should redirect to /map on init if already logged in and render logged-in message', () => {
    authService.isLoggedIn.and.returnValue(true);
    const fixture = createComponent();

    expect(router.navigate).toHaveBeenCalledWith(['/map']);
    const loggedInMsg = fixture.debugElement.query(By.css('.logged-in-message'));
    const loginBtn = fixture.debugElement.query(By.css('.microsoft-login-button'));
    expect(loggedInMsg).not.toBeNull();
    expect(loginBtn).toBeNull();
  });

  it('should not redirect and should show login UI when not logged in', () => {
    authService.isLoggedIn.and.returnValue(false);
    const fixture = createComponent();

    expect(router.navigate).not.toHaveBeenCalled();
    const loginBtn = fixture.debugElement.query(By.css('.microsoft-login-button'));
    expect(loginBtn).not.toBeNull();
  });

  it('should trigger login and show loading state when clicking Microsoft login', () => {
    authService.isLoggedIn.and.returnValue(false);
    authService.login.and.stub();
    const fixture = createComponent();

    const buttonDe = fixture.debugElement.query(By.css('.microsoft-login-button'));
    const buttonEl: HTMLButtonElement = buttonDe.nativeElement;
    expect(buttonEl.disabled).toBeFalse();

    buttonDe.triggerEventHandler('click', null);
    fixture.detectChanges();

    expect(authService.login).toHaveBeenCalled();
    expect(buttonEl.disabled).toBeTrue();

    // Loading template should swap in; check for loading text or absence of original content
    const pageText = (fixture.nativeElement as HTMLElement).textContent ?? '';
    expect(pageText).toContain('Procesando');
  });

  it('should reset loading state if login throws synchronously', () => {
    authService.isLoggedIn.and.returnValue(false);
    authService.login.and.callFake(() => {
      throw new Error('Login failed');
    });
    const fixture = createComponent();

    const buttonDe = fixture.debugElement.query(By.css('.microsoft-login-button'));
    const buttonEl: HTMLButtonElement = buttonDe.nativeElement;

    buttonDe.triggerEventHandler('click', null);
    fixture.detectChanges();

    // After error is caught, isSubmitting should be false again
    expect(buttonEl.disabled).toBeFalse();
    const originalContent = fixture.debugElement.query(By.css('.button-content'));
    expect(originalContent).not.toBeNull();
  });

  it('should expose isLoggedIn getter that proxies AuthService.isLoggedIn', () => {
    authService.isLoggedIn.and.returnValue(true);
    const fixture = createComponent();
    const component = fixture.componentInstance as any;

    expect(component.isLoggedIn).toBeTrue();

    authService.isLoggedIn.and.returnValue(false);
    expect(component.isLoggedIn).toBeFalse();
  });

  it('should render the company logo using logoPath', () => {
    authService.isLoggedIn.and.returnValue(false);
    const fixture = createComponent();
    const imgEl: HTMLImageElement = fixture.debugElement.query(By.css('img.company-logo')).nativeElement;
    expect(imgEl.src).toContain('/images/AC.MX_logo.png');
  });
});


