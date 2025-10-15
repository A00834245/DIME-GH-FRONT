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

  it('should count markers by category and return counts', () => {
    setClaims({ name: 'Alice' });
    const fixture = createComponent();
    const component = fixture.componentInstance as any;

    component.allFeatures = [
      { properties: { Category: 'CEDI' } },
      { properties: { category: 'Cliente' } },
      { properties: { Name: 'No Category' } },
    ];

    (component as any).countMarkersByCategory();

    expect(component.getCategoryCount('CEDI')).toBe(1);
    expect(component.getCategoryCount('Cliente')).toBe(1);
    // Default maps to 'Estacionamiento' when missing
    expect(component.getCategoryCount('Estacionamiento')).toBe(1);
  });

  it('should not crash updateMarkerClustering when clusterer is null', () => {
    setClaims({ name: 'Alice' });
    const fixture = createComponent();
    const component = fixture.componentInstance as any;

    component.visibleCategories = new Set<string>(['CEDI']);
    component.markersByCategory = new Map<string, any[]>([['CEDI', [{}, {}] as any]]);

    component.markerClusterer = null;
    expect(() => (component as any).updateMarkerClustering()).not.toThrow();
  });

  it('should set all markers to invisible when no visible categories', () => {
    setClaims({ name: 'Alice' });
    const fixture = createComponent();
    const component = fixture.componentInstance as any;

    const m1 = { setVisible: jasmine.createSpy('setVisible') };
    const m2 = { setVisible: jasmine.createSpy('setVisible') };
    component.markersByCategory = new Map<string, any[]>([
      ['CEDI', [m1 as any]],
      ['Cliente', [m2 as any]]
    ]);
    component.visibleCategories = new Set<string>();

    // Stub clusterer to observe empty addMarkers
    component.markerClusterer = {
      clearMarkers: jasmine.createSpy('clearMarkers'),
      addMarkers: jasmine.createSpy('addMarkers')
    };

    (component as any).updateMarkerVisibility();
    expect(m1.setVisible).toHaveBeenCalledWith(false);
    expect(m2.setVisible).toHaveBeenCalledWith(false);
    expect(component.markerClusterer.clearMarkers).toHaveBeenCalled();
    const addArg = component.markerClusterer.addMarkers.calls.mostRecent().args[0] as any[];
    expect(addArg.length).toBe(0);
  });

  it('should not adjust viewport when no markers are visible', () => {
    setClaims({ name: 'Alice' });
    const fixture = createComponent();
    const component = fixture.componentInstance as any;

    stubGoogleAndMapForBounds(component, { zoom: 12 });
    component.visibleCategories = new Set<string>(['CEDI']);
    component.markersByCategory = new Map<string, any[]>([['CEDI', []]]);

    (component as any).adjustViewportToVisibleMarkers();
    expect(component.map.fitBounds).not.toHaveBeenCalled();
    expect(component.map.setZoom).not.toHaveBeenCalled();
  });

  it('should set zoom to minimum 10 when current zoom is lower', fakeAsync(() => {
    setClaims({ name: 'Alice' });
    const fixture = createComponent();
    const component = fixture.componentInstance as any;

    // getZoom returns 8 (< 10)
    (window as any).google = {
      maps: {
        LatLngBounds: function () {
          return { extend: jasmine.createSpy('extend') };
        }
      }
    };
    component.map = {
      fitBounds: jasmine.createSpy('fitBounds'),
      getZoom: jasmine.createSpy('getZoom').and.returnValue(8),
      setZoom: jasmine.createSpy('setZoom')
    };
    const marker = { getPosition: () => ({ lat: 1, lng: 1 }) } as any;
    component.visibleCategories = new Set<string>(['CEDI']);
    component.markersByCategory = new Map<string, any[]>([['CEDI', [marker]]]);

    (component as any).adjustViewportToVisibleMarkers();
    tick(120);
    expect(component.map.fitBounds).toHaveBeenCalled();
    expect(component.map.setZoom).toHaveBeenCalledWith(10);
  }));

  it('getUserLocationAndCenter should fall back to showUserLocationOnMap on error', () => {
    setClaims({ name: 'Alice' });
    const fixture = createComponent();
    const component = fixture.componentInstance as any;

    // Stub geolocation to error via property spy
    const geoStub = {
      getCurrentPosition: (_success: any, error: any) => error(new Error('denied'))
    } as any;
    spyOnProperty(window.navigator, 'geolocation', 'get').and.returnValue(geoStub);

    const fallbackSpy = spyOn<any>(component, 'showUserLocationOnMap').and.stub();
    (component as any).getUserLocationAndCenter();
    expect(fallbackSpy).toHaveBeenCalled();
  });

  it('showUserLocationOnMap should center and zoom when within bounds', () => {
    setClaims({ name: 'Alice' });
    const fixture = createComponent();
    const component = fixture.componentInstance as any;

    // Stub Google Maps constructors and constants
    (window as any).google = {
      maps: {
        SymbolPath: { CIRCLE: 0 },
        Marker: function () { return {}; },
        Circle: function () { return {}; },
      }
    };

    // Stub map with options and methods
    component.map = {
      setCenter: jasmine.createSpy('setCenter'),
      setZoom: jasmine.createSpy('setZoom'),
      getOptions: () => ({
        restriction: {
          latLngBounds: { north: 26, south: 24, west: -101, east: -99 }
        }
      })
    };

    // Stub geolocation success via property spy
    const geoStub = {
      getCurrentPosition: (success: any) => success({ coords: { latitude: 25, longitude: -100, accuracy: 50 } })
    } as any;
    spyOnProperty(window.navigator, 'geolocation', 'get').and.returnValue(geoStub);

    (component as any).showUserLocationOnMap();
    expect(component.map.setCenter).toHaveBeenCalled();
    expect(component.map.setZoom).toHaveBeenCalledWith(14);
  });

  it('lightenColor should return valid hex and lighten shades', () => {
    setClaims({ name: 'Alice' });
    const fixture = createComponent();
    const component = fixture.componentInstance as any;

    expect((component as any).lightenColor('#000000', 20)).toBe('#333333');
    const c = (component as any).lightenColor('#4285F4', 20);
    expect(c.startsWith('#')).toBeTrue();
    expect(c.length).toBe(7);
  });

  it('getCategoryIcon should return the correct icon markup', () => {
    setClaims({ name: 'Alice' });
    const fixture = createComponent();
    const component = fixture.componentInstance as any;

    expect(((component as any).getCategoryIcon('Estacionamiento') as string)).toContain('🅿️');
    expect(((component as any).getCategoryIcon('CEDI') as string)).toContain('📦');
    expect(((component as any).getCategoryIcon('Cliente') as string)).toContain('🏢');
    expect(((component as any).getCategoryIcon('Otro') as string)).toContain('📍');
  });
});


