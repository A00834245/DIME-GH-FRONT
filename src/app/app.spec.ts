import { provideZonelessChangeDetection } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { Subject } from 'rxjs';
import { MSAL_GUARD_CONFIG, MsalBroadcastService, MsalGuardConfiguration, MsalService } from '@azure/msal-angular';
import { EventMessage, InteractionStatus } from '@azure/msal-browser';
import { App } from './app';

describe('App', () => {
  beforeEach(async () => {
    const msalServiceStub: Partial<MsalService> = {
      instance: {
        getActiveAccount: jasmine.createSpy('getActiveAccount').and.returnValue(null),
        getAllAccounts: jasmine.createSpy('getAllAccounts').and.returnValue([]),
        setActiveAccount: jasmine.createSpy('setActiveAccount')
      } as any
    } as any;

    const inProgress$ = new Subject<InteractionStatus>();
    const msalSubject$ = new Subject<EventMessage>();

    await TestBed.configureTestingModule({
      imports: [App],
      providers: [
        provideZonelessChangeDetection(),
        provideRouter([]),
        { provide: MSAL_GUARD_CONFIG, useValue: {} as MsalGuardConfiguration },
        { provide: MsalService, useValue: msalServiceStub },
        { provide: MsalBroadcastService, useValue: { inProgress$, msalSubject$ } }
      ]
    }).compileComponents();
  });

  it('should create the app', () => {
    const fixture = TestBed.createComponent(App);
    const app = fixture.componentInstance;
    expect(app).toBeTruthy();
  });

  it('should render router outlet', () => {
    const fixture = TestBed.createComponent(App);
    fixture.detectChanges();
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector('router-outlet')).not.toBeNull();
  });
});
