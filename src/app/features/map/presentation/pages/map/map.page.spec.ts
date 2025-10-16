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

  // ---------------------------
  // Browser init and map boot
  // ---------------------------
  it('ngAfterViewInit in browser should load script then initialize map', fakeAsync(() => {
    setClaims({ name: 'Alice' });
    TestBed.overrideProvider(PLATFORM_ID, { useValue: 'browser' });

    const fixture = TestBed.createComponent(MapPage);
    const component = fixture.componentInstance as any;

    spyOn(component, 'loadGoogleMapsScript').and.returnValue(Promise.resolve());
    const initSpy = spyOn(component, 'initializeMap').and.stub();

    fixture.detectChanges(); // triggers ngAfterViewInit
    tick();
    expect(initSpy).toHaveBeenCalled();
  }));

  it('loadGoogleMapsScript resolves when script onload fires', async () => {
    setClaims({ name: 'Alice' });
    const fixture = TestBed.createComponent(MapPage);
    const component = fixture.componentInstance as any;

    (window as any).google = undefined; // ensure path that appends script
    const appendSpy = spyOn(document.head, 'appendChild').and.callFake((el: any) => {
      setTimeout(() => el.onload && el.onload(new Event('load')));
      return el;
    });

    await expectAsync((component as any).loadGoogleMapsScript()).toBeResolved();
    expect(appendSpy).toHaveBeenCalled();
  });

  it('loadGoogleMapsScript rejects when script onerror fires', async () => {
    setClaims({ name: 'Alice' });
    const fixture = TestBed.createComponent(MapPage);
    const component = fixture.componentInstance as any;

    (window as any).google = undefined;
    spyOn(document.head, 'appendChild').and.callFake((el: any) => {
      setTimeout(() => el.onerror && el.onerror(new Event('error')));
      return el;
    });

    await expectAsync((component as any).loadGoogleMapsScript()).toBeRejected();
  });

  // --------------------------------
  // Map initialization and events
  // --------------------------------
  it('initializeMap happy path wires idle and tilesloaded listeners', async () => {
    setClaims({ name: 'Alice' });
    const fixture = TestBed.createComponent(MapPage);
    const component = fixture.componentInstance as any;

    // Stub google maps core
    (window as any).google = {
      maps: {
        importLibrary: async (lib: string) => {
          if (lib === 'maps') {
            return {
              Map: function (_el: any, _opts: any) {
                const mapObj: any = {
                  _listeners: new Map<string, Function[]>(),
                  controls: [ { push: jasmine.createSpy('push') } ],
                  addListener: function (evt: string, cb: Function) {
                    const arr: Function[] = this._listeners.get(evt) || [];
                    arr.push(cb);
                    this._listeners.set(evt, arr);
                    return {} as any;
                  },
                  fire: function (evt: string) {
                    const arr: Function[] = this._listeners.get(evt) || [];
                    arr.forEach((fn: Function) => fn());
                  },
                  getZoom: () => 10,
                  getCenter: () => ({ toString: () => '(0,0)' }),
                  getOptions: () => ({ restriction: { latLngBounds: { north: 26, south: 24, west: -101, east: -99 }}})
                };
                return mapObj;
              }
            } as any;
          }
          if (lib === 'geocoding') { return { Geocoder: function() {} } as any; }
          if (lib === 'places') { return { Autocomplete: function() {} } as any; }
          return {} as any;
        },
        event: {
          addListenerOnce: (_obj: any, _evt: string, cb: Function) => cb()
        },
        ControlPosition: { RIGHT_BOTTOM: 0 },
        Size: function (w: number, h: number) { return { width: w, height: h } as any; },
        Point: function (x: number, y: number) { return { x, y } as any; },
        Marker: function (_opts: any) { const o: any = { ..._opts }; o.addListener = (_e: string, _cb: any) => {}; return o; },
        InfoWindow: function (_opts: any) { return { open: () => {}, close: () => {}, addListener: (_e: string, _cb: any) => {} } as any; },
        GeocoderStatus: { OK: 'OK' }
      }
    };

    const locSpy = spyOn(component as any, 'getUserLocationAndCenter').and.stub();
    const btnSpy = spyOn(component as any, 'enableLocationButton').and.stub();
    const loadSpy = spyOn(component as any, 'loadDataFromBackend').and.stub();

    await (component as any).initializeMap();
    // idle listener should have called these
    expect(locSpy).toHaveBeenCalled();
    expect(btnSpy).toHaveBeenCalled();

    // tilesloaded should load backend
    (component as any).map.fire('tilesloaded');
    expect(loadSpy).toHaveBeenCalled();
  });

  it('initializeMap catches importLibrary errors without crashing', async () => {
    setClaims({ name: 'Alice' });
    const fixture = TestBed.createComponent(MapPage);
    const component = fixture.componentInstance as any;

    (window as any).google = { maps: { importLibrary: async () => { throw new Error('boom'); } } } as any;

    await (component as any).initializeMap();
    expect((component as any).map).toBeUndefined();
  });

  // ----------------
  // Dataset flow
  // ----------------
  it('loadDataFromBackend short-circuits when dataLoaded is true', () => {
    setClaims({ name: 'Alice' });
    const fixture = TestBed.createComponent(MapPage);
    const component = fixture.componentInstance as any;
    (component as any).dataLoaded = true;
    const markerLoaderSpy = spyOn(component as any, 'loadColoredMarkersFromBackend').and.stub();

    (component as any).loadDataFromBackend();
    expect(markerLoaderSpy).not.toHaveBeenCalled();
  });

  it('loadDataFromBackend calls loader and sets flag when not loaded', () => {
    setClaims({ name: 'Alice' });
    const fixture = TestBed.createComponent(MapPage);
    const component = fixture.componentInstance as any;
    (component as any).dataLoaded = false;
    const markerLoaderSpy = spyOn(component as any, 'loadColoredMarkersFromBackend').and.stub();

    (component as any).loadDataFromBackend();
    expect(markerLoaderSpy).toHaveBeenCalled();
    expect((component as any).dataLoaded).toBeTrue();
  });

  // ------------------------------
  // Markers and clustering
  // ------------------------------
  it('loadColoredMarkersFromBackend processes only Point features and sets clustering', async () => {
    setClaims({ name: 'Alice' });
    const fixture = TestBed.createComponent(MapPage);
    const component = fixture.componentInstance as any;

    // Stub google classes used by marker creation
    (window as any).google = {
      maps: {
        Size: function (w: number, h: number) { return { width: w, height: h } as any; },
        Point: function (x: number, y: number) { return { x, y } as any; },
        Marker: function (opts: any) { const o: any = { ...opts, _handlers: {} }; o.addListener = (e: string, cb: any) => { o._handlers[e] = cb; }; return o; },
        InfoWindow: function (_opts: any) { return { open: () => {}, close: () => {}, addListener: (_e: string, _cb: any) => {} } as any; },
        SymbolPath: { CIRCLE: 0 },
        GeocoderStatus: { OK: 'OK' }
      }
    };
    (component as any).map = {};

    // Dataset with mixed geometry types
    const geojson = {
      features: [
        { geometry: { type: 'Point', coordinates: [ -100.0, 25.0 ] }, properties: { Category: 'CEDI', Name: 'Alfa' } },
        { geometry: { type: 'Polygon', coordinates: [] }, properties: { Category: 'Cliente' } },
        { geometry: { type: 'Point', coordinates: [ -100.2, 25.2 ] }, properties: { category: 'Cliente', Name: 'Beta' } },
        { geometry: { type: 'LineString', coordinates: [] }, properties: {} }
      ]
    };

    // Spy dataset fetch
    datasetService.fetchDatasetFromBackend.and.returnValue(Promise.resolve(geojson));

    // Avoid real clusterer creation; just set a stub when called
    spyOn(component as any, 'setupMarkerClustering').and.callFake(function(this: any) {
      this.markerClusterer = { clearMarkers: () => {}, addMarkers: () => {} } as any;
    });

    await (component as any).loadColoredMarkersFromBackend();

    expect((component as any).allFeatures.length).toBe(2);
    expect((component as any).markers.length).toBe(2);
    expect((component as any).markersByCategory.get('CEDI')?.length).toBe(1);
    expect((component as any).markersByCategory.get('Cliente')?.length).toBe(1);
    expect((component as any).markerClusterer).not.toBeNull();
  });

  it('loadColoredMarkersFromBackend shows InfoWindow on dataset error and closes later', fakeAsync(() => {
    setClaims({ name: 'Alice' });
    const fixture = TestBed.createComponent(MapPage);
    const component = fixture.componentInstance as any;

    let opened = false;
    let closed = false;
    (window as any).google = {
      maps: {
        InfoWindow: function (_opts: any) { return { open: () => { opened = true; }, close: () => { closed = true; }, addListener: (_e: string, _cb: any) => {} } as any; }
      }
    } as any;
    (component as any).map = { getCenter: () => ({ lat: 0, lng: 0 }) };
    datasetService.fetchDatasetFromBackend.and.returnValue(Promise.reject(new Error('fail')));

    (component as any).loadColoredMarkersFromBackend();
    tick(); // settle promise rejection path
    expect(opened).toBeTrue();
    tick(15000);
    expect(closed).toBeTrue();
  }));

  // ---------------------------------------
  // Marker creation and info windows
  // ---------------------------------------
  it('createColoredMarkerFromFeature categorizes markers and click shows centered info', () => {
    setClaims({ name: 'Alice' });
    const fixture = TestBed.createComponent(MapPage);
    const component = fixture.componentInstance as any;

    (window as any).google = {
      maps: {
        Size: function (w: number, h: number) { return { width: w, height: h } as any; },
        Point: function (x: number, y: number) { return { x, y } as any; },
        Marker: function (_opts: any) { const o: any = { _handlers: {} }; o.addListener = (e: string, cb: any) => { o._handlers[e] = cb; }; return o; },
        SymbolPath: { CIRCLE: 0 }
      }
    };
    (component as any).map = {};

    const spy = spyOn(component as any, 'showMarkerInfoWindowCentered').and.stub();

    const features = [
      { geometry: { type: 'Point', coordinates: [ -100, 25 ] }, properties: { Category: 'Estacionamiento', Name: 'P1' } },
      { geometry: { type: 'Point', coordinates: [ -100, 25 ] }, properties: { Category: 'CEDI', Name: 'C1' } },
      { geometry: { type: 'Point', coordinates: [ -100, 25 ] }, properties: { Category: 'Cliente', Name: 'CL1' } },
      { geometry: { type: 'Point', coordinates: [ -100, 25 ] }, properties: { Name: 'Unknown' } },
    ];

    for (const f of features) { (component as any).createColoredMarkerFromFeature(f); }

    expect((component as any).markers.length).toBe(4);
    expect((component as any).markersByCategory.get('Estacionamiento')?.length).toBe(2);
    expect((component as any).markersByCategory.get('CEDI')?.length).toBe(1);
    expect((component as any).markersByCategory.get('Cliente')?.length).toBe(1);

    // Simulate click via stored handlers if present
    const markerAny = (component as any).markers[0] as any;
    if (markerAny && markerAny._handlers && markerAny._handlers['click']) {
      markerAny._handlers['click']();
      expect(spy).toHaveBeenCalled();
    }
  });

  it('showMarkerInfoWindowCentered pans first then opens detailed window with offset', fakeAsync(() => {
    setClaims({ name: 'Alice' });
    const fixture = TestBed.createComponent(MapPage);
    const component = fixture.componentInstance as any;

    const mapStub = {
      getBounds: () => ({
        getNorthEast: () => ({ lat: () => 26 }),
        getSouthWest: () => ({ lat: () => 24 })
      }),
      panTo: jasmine.createSpy('panTo')
    };
    (component as any).map = mapStub;

    spyOn(component as any, 'getAddressFromCoordinates').and.returnValue(Promise.resolve('Mock Address'));
    const detailedSpy = spyOn(component as any, 'createDetailedInfoWindow').and.stub();

    (component as any).showMarkerInfoWindowCentered({}, { lat: 10, lng: 10 }, null);
    // first pan should be to lat + 0.6 (since span=2, 30%)
    expect(mapStub.panTo).toHaveBeenCalledWith({ lat: 10.6, lng: 10 });
    tick(310);
    // info window position should be lat + 0.08 (4% of 2)
    const infoPos = (detailedSpy.calls.mostRecent().args[2]);
    expect(infoPos.lat).toBeCloseTo(10.08, 5);
  }));

  it('showMarkerInfoWindow forwards to createDetailedInfoWindow', async () => {
    setClaims({ name: 'Alice' });
    const fixture = TestBed.createComponent(MapPage);
    const component = fixture.componentInstance as any;
    spyOn(component as any, 'getAddressFromCoordinates').and.returnValue(Promise.resolve('Mock Address'));
    const detailedSpy = spyOn(component as any, 'createDetailedInfoWindow').and.stub();

    await (component as any).showMarkerInfoWindow({ Name: 'X' }, { lat: 1, lng: 2 });
    expect(detailedSpy).toHaveBeenCalled();
  });

  it('getAddressFromCoordinates returns formatted address on OK', async () => {
    setClaims({ name: 'Alice' });
    const fixture = TestBed.createComponent(MapPage);
    const component = fixture.componentInstance as any;
    (window as any).google = { maps: { GeocoderStatus: { OK: 'OK' } } } as any;
    (component as any).Geocoder = function () { return { geocode: (_opts: any, cb: Function) => cb([{ formatted_address: 'Addr' }], 'OK') } as any; } as any;

    const addr = await (component as any).getAddressFromCoordinates({ lat: 1, lng: 2 });
    expect(addr).toBe('Addr');
  });

  it('getAddressFromCoordinates returns fallback on non-OK', async () => {
    setClaims({ name: 'Alice' });
    const fixture = TestBed.createComponent(MapPage);
    const component = fixture.componentInstance as any;
    (window as any).google = { maps: { GeocoderStatus: { OK: 'OK' } } } as any;
    (component as any).Geocoder = function () { return { geocode: (_opts: any, cb: Function) => cb([], 'ZERO_RESULTS') } as any; } as any;

    const addr = await (component as any).getAddressFromCoordinates({ lat: 1, lng: 2 });
    expect(addr).toBe('Dirección no disponible');
  });

  // ---------------------
  // Rendering helpers
  // ---------------------
  it('getClusterRenderer.render returns google.maps.Marker with expected icon sizing', () => {
    setClaims({ name: 'Alice' });
    const fixture = TestBed.createComponent(MapPage);
    const component = fixture.componentInstance as any;

    (window as any).google = {
      maps: {
        Marker: function (opts: any) { return opts; },
        Size: function (w: number, h: number) { return { width: w, height: h } as any; },
        Point: function (x: number, y: number) { return { x, y } as any; }
      }
    };

    const renderer = (component as any).getClusterRenderer();
    const marker: any = renderer.render({ count: 5, position: { lat: 0, lng: 0 } }, null);
    expect(marker.icon.scaledSize.width).toBe(40);
    expect(marker.icon.scaledSize.height).toBe(40);
    expect(marker.icon.anchor.x).toBe(20);
    expect(marker.icon.anchor.y).toBe(20);
  });

  it('enableLocationButton adds control and recenters map on click', fakeAsync(() => {
    setClaims({ name: 'Alice' });
    const fixture = TestBed.createComponent(MapPage);
    const component = fixture.componentInstance as any;

    (window as any).google = { maps: { ControlPosition: { RIGHT_BOTTOM: 0 } } } as any;
    const pushed: any[] = [];
    const mapStub = {
      controls: [ { push: (el: any) => pushed.push(el) } ],
      setCenter: jasmine.createSpy('setCenter'),
      setZoom: jasmine.createSpy('setZoom')
    };
    (component as any).map = mapStub;
    (window as any).userLocation = { lat: 1, lng: 2 };

    (component as any).enableLocationButton();
    expect(pushed.length).toBe(1);
    const btn: HTMLButtonElement = pushed[0];
    // Before click, SVG path fill is #666 (default). After click it flashes to #4285F4 then reverts.
    const pathBefore = btn.querySelector('path')!;
    expect(pathBefore.getAttribute('fill')).toBe('#666');
    btn.click();
    expect(mapStub.setCenter).toHaveBeenCalledWith({ lat: 1, lng: 2 });
    expect(mapStub.setZoom).toHaveBeenCalledWith(14);
    const pathAfter = btn.querySelector('path')!;
    expect(pathAfter.getAttribute('fill')).toBe('#4285F4');
    tick(2000);
    expect(pathAfter.getAttribute('fill')).toBe('#666');
  }));

  // -----------------------------
  // Search and filters (edges)
  // -----------------------------
  it('performDatasetSearch returns empty when no features', () => {
    setClaims({ name: 'Alice' });
    const fixture = TestBed.createComponent(MapPage);
    const component = fixture.componentInstance as any;
    (component as any).allFeatures = [];
    (component as any).visibleCategories = new Set<string>(['CEDI', 'Cliente', 'Estacionamiento']);
    (component as any).performDatasetSearch('alpha');
    expect((component as any).searchResults.length).toBe(0);
  });

  it('performDatasetSearch matches on Description, Person Responsable, and Phone', () => {
    setClaims({ name: 'Alice' });
    const fixture = TestBed.createComponent(MapPage);
    const component = fixture.componentInstance as any;
    (component as any).visibleCategories = new Set<string>(['CEDI', 'Cliente', 'Estacionamiento']);
    (component as any).allFeatures = [
      { geometry: { type: 'Point', coordinates: [0,0] }, properties: { Category: 'CEDI', Description: 'Alpha storage' } },
      { geometry: { type: 'Point', coordinates: [0,0] }, properties: { category: 'Cliente', 'Person Responsable': 'Alpha Supervisor' } },
      { geometry: { type: 'Point', coordinates: [0,0] }, properties: { Category: 'Estacionamiento', phone: '555-ALPHA' } }
    ];
    (component as any).performDatasetSearch('alpha');
    expect((component as any).searchResults.length).toBe(3);
  });

  it('onSearchInput with empty string resets dropdown and state', () => {
    setClaims({ name: 'Alice' });
    const fixture = TestBed.createComponent(MapPage);
    const component = fixture.componentInstance as any;
    (component as any).searchResults = [{}, {}];
    (component as any).selectedSearchIndex = 1;
    (component as any).showSearchDropdown = true;
    (component as any).hideButtonsWhileSearching = true;
    (component as any).searchQuery = 'x';

    (component as any).onSearchInput({ target: { value: '   ' } });
    expect((component as any).searchResults.length).toBe(0);
    expect((component as any).selectedSearchIndex).toBe(-1);
    expect((component as any).showSearchDropdown).toBeFalse();
    expect((component as any).hideButtonsWhileSearching).toBeFalse();
    expect((component as any).searchQuery).toBe('');
  });
});


