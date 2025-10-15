import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { Router } from '@angular/router';
import { PLATFORM_ID } from '@angular/core';
import { MapPage } from './map.page';
import { AuthService } from '@core/services/auth.service';
import { DatasetService } from '@features/map/core/services/dataset.service';

describe('MapPage', () => {
  let authService: jasmine.SpyObj<AuthService>;
  let datasetService: jasmine.SpyObj<DatasetService>;
  let router: jasmine.SpyObj<Router>;

  beforeEach(async () => {
    authService = jasmine.createSpyObj<AuthService>('AuthService', [
      'getIdTokenClaims',
      'logout'
    ]);

    datasetService = jasmine.createSpyObj<DatasetService>('DatasetService', [
      'fetchDatasetFromBackend',
      'fetchDataset'
    ]);

    router = jasmine.createSpyObj<Router>('Router', ['navigate']);

    await TestBed.configureTestingModule({
      imports: [MapPage],
      providers: [
        { provide: PLATFORM_ID, useValue: 'server' }, // Skip browser-only map init
        { provide: AuthService, useValue: authService },
        { provide: DatasetService, useValue: datasetService },
        { provide: Router, useValue: router }
      ]
    }).compileComponents();
  });

  function createComponent(): ComponentFixture<MapPage> {
    const fixture = TestBed.createComponent(MapPage);
    fixture.detectChanges();
    return fixture;
  }

  function setClaims(claims: any | null): void {
    authService.getIdTokenClaims.and.returnValue(claims);
  }

  function stubGoogleAndMapForBounds(component: any, options?: { zoom?: number }): void {
    // Minimal google maps stubs
    (window as any).google = {
      maps: {
        LatLngBounds: function () {
          return {
            extend: jasmine.createSpy('extend')
          };
        }
      }
    };

    component.map = {
      setCenter: jasmine.createSpy('setCenter'),
      fitBounds: jasmine.createSpy('fitBounds'),
      getZoom: jasmine.createSpy('getZoom').and.returnValue(options?.zoom ?? 17),
      setZoom: jasmine.createSpy('setZoom')
    };

    component.markerClusterer = {
      clearMarkers: jasmine.createSpy('clearMarkers'),
      addMarkers: jasmine.createSpy('addMarkers')
    };
  }

  it('should create', () => {
    setClaims({ name: 'Map Tester' });
    const fixture = createComponent();
    const component = fixture.componentInstance;
    expect(component).toBeTruthy();
  });

  it('should load user info into header welcome text', () => {
    setClaims({ name: 'Alice', email: 'alice@example.com' });
    const fixture = createComponent();
    const compiled = fixture.nativeElement as HTMLElement;
    const welcome = compiled.querySelector('.welcome-text')?.textContent ?? '';
    expect(welcome).toContain('Bienvenido, Alice');
  });

  it('should compute user name from given_name/family_name when name missing', () => {
    setClaims({ given_name: 'John', family_name: 'Doe', preferred_username: 'jd@example.com' });
    const fixture = createComponent();
    const compiled = fixture.nativeElement as HTMLElement;
    const welcome = compiled.querySelector('.welcome-text')?.textContent ?? '';
    expect(welcome).toContain('Bienvenido, John Doe');
  });

  it('should default user name to "Usuario" when no claims', () => {
    setClaims(null);
    const fixture = createComponent();
    const compiled = fixture.nativeElement as HTMLElement;
    const welcome = compiled.querySelector('.welcome-text')?.textContent ?? '';
    expect(welcome).toContain('Bienvenido, Usuario');
  });

  it('should navigate to /profile when clicking header profile icon', () => {
    setClaims({ name: 'Alice' });
    const fixture = createComponent();
    const profileBtnDe = fixture.debugElement.query(By.css('.profile-icon-button'));
    profileBtnDe.triggerEventHandler('click', null);
    expect(router.navigate).toHaveBeenCalledWith(['/profile']);
  });

  it('should call logout when handleLogout is invoked', () => {
    setClaims({ name: 'Alice' });
    const fixture = createComponent();
    const component = fixture.componentInstance as any;
    component.handleLogout();
    expect(authService.logout).toHaveBeenCalled();
  });

  it('should toggle categories from all -> single and update marker visibility and clustering', fakeAsync(() => {
    setClaims({ name: 'Alice' });
    const fixture = createComponent();
    const component = fixture.componentInstance as any;

    // Prepare markers by category
    const cediMarker1 = { setVisible: jasmine.createSpy('setVisible'), getPosition: () => ({ lat: 1, lng: 1 }) };
    const cediMarker2 = { setVisible: jasmine.createSpy('setVisible'), getPosition: () => ({ lat: 2, lng: 2 }) };
    const clienteMarker = { setVisible: jasmine.createSpy('setVisible'), getPosition: () => ({ lat: 3, lng: 3 }) };

    component.markersByCategory = new Map<string, any[]>([
      ['CEDI', [cediMarker1, cediMarker2]],
      ['Cliente', [clienteMarker]]
    ]);

    stubGoogleAndMapForBounds(component, { zoom: 17 });

    // All categories active initially -> clicking CEDI shows only CEDI
    component.toggleCategory('CEDI');

    expect(component.visibleCategories.size).toBe(1);
    expect(component.visibleCategories.has('CEDI')).toBeTrue();

    // CEDI markers visible, Cliente hidden
    expect(cediMarker1.setVisible).toHaveBeenCalledWith(true);
    expect(cediMarker2.setVisible).toHaveBeenCalledWith(true);
    expect(clienteMarker.setVisible).toHaveBeenCalledWith(false);

    // Cluster should receive only visible markers
    expect(component.markerClusterer.clearMarkers).toHaveBeenCalled();
    expect(component.markerClusterer.addMarkers).toHaveBeenCalled();
    const addArg = component.markerClusterer.addMarkers.calls.mostRecent().args[0] as any[];
    expect(addArg.length).toBe(2);

    // Viewport adjustments: fitBounds called, then zoom constrained (from 17 -> 16)
    expect(component.map.fitBounds).toHaveBeenCalled();
    tick(120);
    expect(component.map.setZoom).toHaveBeenCalledWith(16);
  }));

  it('should show all categories again when the last active one is toggled off', () => {
    setClaims({ name: 'Alice' });
    const fixture = createComponent();
    const component = fixture.componentInstance as any;

    // Setup state: only CEDI active
    component.visibleCategories = new Set<string>(['CEDI']);
    component.markersByCategory = new Map<string, any[]>([
      ['CEDI', []],
      ['Cliente', []],
      ['Estacionamiento', []]
    ]);
    stubGoogleAndMapForBounds(component, { zoom: 12 });

    component.toggleCategory('CEDI');
    expect(component.visibleCategories.size).toBe(3);
    expect(component.visibleCategories.has('CEDI')).toBeTrue();
    expect(component.visibleCategories.has('Cliente')).toBeTrue();
    expect(component.visibleCategories.has('Estacionamiento')).toBeTrue();
  });

  it('should perform search, navigate results with keyboard, and select a result', fakeAsync(() => {
    setClaims({ name: 'Alice' });
    const fixture = createComponent();
    const component = fixture.componentInstance as any;

    // Prepare features and visible categories
    component.allFeatures = [
      { geometry: { type: 'Point', coordinates: [ -100.0, 25.0 ] }, properties: { Name: 'Alfa CEDI', Category: 'CEDI' } },
      { geometry: { type: 'Point', coordinates: [ -100.1, 25.1 ] }, properties: { Name: 'Bravo Cliente', Category: 'Cliente' } },
      { geometry: { type: 'Point', coordinates: [ -100.2, 25.2 ] }, properties: { Name: 'Parking Lot', Category: 'Estacionamiento' } }
    ];
    component.visibleCategories = new Set<string>(['CEDI', 'Cliente', 'Estacionamiento']);

    // Search input
    const inputDe = fixture.debugElement.query(By.css('input.search-input'));
    const inputEl: HTMLInputElement = inputDe.nativeElement;

    // Type 'Alfa'
    inputEl.value = 'Alfa';
    component.onSearchInput({ target: inputEl });
    expect(component.showSearchDropdown).toBeTrue();
    expect(component.hideButtonsWhileSearching).toBeTrue();

    // Debounce
    tick(60);
    fixture.detectChanges();

    expect(component.searchResults.length).toBe(1);

    // Navigate with ArrowDown
    component.onSearchKeydown({ key: 'ArrowDown', preventDefault: () => {} } as any);
    expect(component.selectedSearchIndex).toBe(0);

    // Stub map and spy on info window call
    stubGoogleAndMapForBounds(component, { zoom: 12 });
    const infoSpy = spyOn<any>(component, 'showMarkerInfoWindow').and.stub();

    // Press Enter to select
    const enterEvent = { key: 'Enter', preventDefault: () => {}, target: inputEl } as any;
    component.onSearchKeydown(enterEvent);
    fixture.detectChanges();

    expect(component.map.setCenter).toHaveBeenCalled();
    expect(component.map.setZoom).toHaveBeenCalledWith(16);
    expect(infoSpy).toHaveBeenCalled();

    // After selection, state should be cleared
    expect(component.searchResults.length).toBe(0);
    expect(component.selectedSearchIndex).toBe(-1);
    expect(component.showSearchDropdown).toBeFalse();
    expect(component.hideButtonsWhileSearching).toBeFalse();
    expect(component.searchQuery).toBe('');
    expect(inputEl.value).toBe('');
  }));

  it('should handle Escape to clear search and blur the input', () => {
    setClaims({ name: 'Alice' });
    const fixture = createComponent();
    const component = fixture.componentInstance as any;

    // Seed some state
    component.searchResults = [{}, {}];
    component.selectedSearchIndex = 1;
    component.showSearchDropdown = true;
    component.hideButtonsWhileSearching = true;
    component.searchQuery = 'Alfa';

    const inputDe = fixture.debugElement.query(By.css('input.search-input'));
    const inputEl: HTMLInputElement = inputDe.nativeElement;
    spyOn(inputEl, 'blur');

    component.onSearchKeydown({ key: 'Escape', preventDefault: () => {}, target: inputEl } as any);

    expect(component.searchResults.length).toBe(0);
    expect(component.selectedSearchIndex).toBe(-1);
    expect(component.showSearchDropdown).toBeFalse();
    expect(component.hideButtonsWhileSearching).toBeFalse();
    expect(component.searchQuery).toBe('');
    expect(inputEl.blur).toHaveBeenCalled();
  });

  it('should return correct colors for categories', () => {
    setClaims({ name: 'Alice' });
    const fixture = createComponent();
    const component = fixture.componentInstance as any;

    const getColor = (c: string) => (component as any).getMarkerColor(c);
    expect(getColor('Estacionamiento')).toBe('#007FFF');
    expect(getColor('cedi')).toBe('#FF8C00');
    expect(getColor('Cliente')).toBe('#ED1B24');
    expect(getColor('Unknown')).toBe('#007FFF');
  });
});


