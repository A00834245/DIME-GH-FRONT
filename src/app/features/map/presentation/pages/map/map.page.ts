import { Component, ElementRef, ViewChild, AfterViewInit, OnInit, OnDestroy, Inject, PLATFORM_ID, signal, computed, NgZone } from '@angular/core';
import { isPlatformBrowser, NgIf, NgFor } from '@angular/common';
import { Router } from '@angular/router';
import { environment } from '@core/environments/environment';
import { DatasetService } from '@features/map/core/services/dataset.service';
import { AuthService } from '@core/services/auth.service';
import { MarkerClusterer } from '@googlemaps/markerclusterer';
import { HeaderComponent } from '@layouts/components/header/header.component';
import { SlidePanelComponent, StoreData, VisitData } from '@features/map/presentation/components/slide-panel/slide-panel.component';
import { PendingBannerComponent } from '@features/map/presentation/components/pending-banner/pending-banner.component';
import { CommentPopupComponent } from '@features/map/presentation/components/comment-popup/comment-popup.component';
import { NoCheckinWarningComponent } from '@features/map/presentation/components/no-checkin-warning/no-checkin-warning.component';
import { VisitService, Visit, PendingVisit } from '@features/map/core/services/visit.service';
import { LocationService } from '@features/map/core/services/location.service';
import { GeofenceService } from '@features/map/core/services/geofence.service';

// Declare google as any to avoid TypeScript errors
declare var google: any;

@Component({
  selector: 'app-map-page',
  standalone: true,
  imports: [
    NgIf, 
    NgFor, 
    HeaderComponent, 
    SlidePanelComponent, 
    PendingBannerComponent,
    CommentPopupComponent,
    NoCheckinWarningComponent
  ],
  template: `
    <!-- Authentication Header -->
    <app-header 
      [userName]="userName()" 
      (profile)="handleProfile()">
    </app-header>

    <!-- Map Container -->
    <div class="map-container">
      <div class="search-box">
        <input 
          #searchInput 
          type="text" 
          placeholder="Buscar" 
          class="search-input"
          (input)="onSearchInput($event)"
          (keydown)="onSearchKeydown($event)"
        />
        <div class="search-results" *ngIf="showSearchDropdown">
          <div 
            *ngFor="let result of searchResults; let i = index"
            class="search-result-item"
            [class.selected]="i === selectedSearchIndex"
            [attr.data-category]="result.properties?.Category || result.properties?.category || 'Sin categoría'"
            (click)="selectSearchResult(result)"
          >
            <div class="result-name">{{ result.properties.Name || result.properties.name || 'Sin nombre' }}</div>
            <div class="result-category">{{ result.properties.Category || result.properties.category || 'Sin categoría' }}</div>
            <div class="result-description" *ngIf="result.properties.Description">{{ result.properties.Description }}</div>
          </div>
          <div *ngIf="searchResults.length === 0 && searchQuery.length > 0" class="no-results-message">
            <div class="no-results-icon">🔍</div>
            <div class="no-results-text">No se encontraron resultados para "{{ searchQuery }}"</div>
            <div class="no-results-hint">Intenta con otro término de búsqueda</div>
          </div>
        </div>
      </div>
      
      <!-- Category Filter Buttons - Horizontal Layout -->
      <div class="category-filters" [class.hidden-while-searching]="hideButtonsWhileSearching">
        <div 
          class="filter-box parking" 
          [class.active]="visibleCategories.has('Estacionamiento')"
          (click)="toggleCategory('Estacionamiento')">
          <div class="filter-icon">
            <svg width="20" height="25" viewBox="0 0 20 25" xmlns="http://www.w3.org/2000/svg">
              <path d="M20 10C20 15.5237 11.4286 24.5 10 24.5C8.57143 24.5 0 15.5237 0 10C0 4.47715 4.47715 0 10 0C15.5228 0 20 4.47715 20 10Z" fill="#007FFF"/>
              <path fill-rule="evenodd" clip-rule="evenodd" d="M20 10C20 15.5237 11.4286 24.5 10 24.5C8.57143 24.5 0 15.5237 0 10C0 4.47715 4.47715 0 10 0C15.5228 0 20 4.47715 20 10ZM6.8 15H13.4V13.27H8.4V10.07H12.6V9.02H8.4V6.73H13.35V5H6.8V15Z" fill="#007FFF"/>
              <path d="M6.8 15H13.4V13.27H8.4V10.07H12.6V9.02H8.4V6.73H13.35V5H6.8V15Z" fill="white"/>
            </svg>
          </div>
          <span class="filter-label">Estacionamientos</span>
          <span class="filter-count">({{getCategoryCount('Estacionamiento')}})</span>
        </div>
        
        <div 
          class="filter-box cedi" 
          [class.active]="visibleCategories.has('CEDI')"
          (click)="toggleCategory('CEDI')">
          <div class="filter-icon">
            <svg width="20" height="25" viewBox="0 0 20 25" xmlns="http://www.w3.org/2000/svg">
              <path d="M20 10C20 15.5237 11.4286 24.5 10 24.5C8.57143 24.5 0 15.5237 0 10C0 4.47715 4.47715 0 10 0C15.5228 0 20 4.47715 20 10Z" fill="#FF8C00"/>
              <path d="M8.097 5L4.20381 6.904L5.57732 8.27886L9.47048 6.375L8.097 5ZM11.6823 5L10.309 6.375L14.2021 8.27886L15.5757 6.904L11.6823 5ZM9.88571 6.67617L9.6289 6.78214V10.2261L9.88571 10.3321L10.1426 10.2261V6.78214L9.88571 6.67617ZM5.59058 8.80268L4.165 10.6686L7.69166 12.5584L9.47047 10.7798L5.59058 8.80268ZM14.1808 8.2027L9.88571 10.7798L11.6646 12.5584L15.1912 10.6686L14.1808 8.80268ZM9.6289 11.2551L7.92396 13.2598L5.78039 12.0491V13.2761L9.6289 15V11.2551ZM10.1426 11.2551V15L13.9911 13.2761V12.0491L11.8476 13.2598L10.1426 11.2551Z" fill="white"/>
            </svg>
          </div>
          <span class="filter-label">CEDIs</span>
          <span class="filter-count">({{getCategoryCount('CEDI')}})</span>
        </div>
        
        <div 
          class="filter-box client" 
          [class.active]="visibleCategories.has('Cliente')"
          (click)="toggleCategory('Cliente')">
          <div class="filter-icon">
            <svg width="20" height="25" viewBox="0 0 20 25" xmlns="http://www.w3.org/2000/svg">
              <path d="M20 10C20 15.5237 11.4286 24.5 10 24.5C8.57143 24.5 0 15.5237 0 10C0 4.47715 4.47715 0 10 0C15.5228 0 20 4.47715 20 10Z" fill="#ED1B24"/>
              <path fill-rule="evenodd" clip-rule="evenodd" d="M14.3402 5H6.07235L5 7.97563V8.86293C5 9.27514 5.16027 9.60253 5.42062 9.79606V15H15.0361V9.79606C15.2965 9.60253 15.4567 9.27514 15.4567 8.86293V7.97563L14.3402 5ZM14.1361 10.4987C14.0301 10.5205 13.9205 10.5314 13.8083 10.5314C13.3315 10.5314 12.9095 10.2495 12.6458 9.79606C12.3821 10.2495 11.9601 10.5314 11.4833 10.5314C11.0065 10.5314 10.5845 10.2495 10.3208 9.79606C10.0571 10.2495 9.63511 10.5314 9.15833 10.5314C8.68155 10.5314 8.25953 10.2495 7.99583 9.79606C7.73214 10.2495 7.31012 10.5314 6.83333 10.5314C6.72115 10.5314 6.61151 10.5205 6.50556 10.4987V13.7456H8.47222V11.5457H11.5278V13.7456H14.1361V10.4987ZM11.0972 12.1913V13.7456H9.09722V12.1913H11.0972ZM14.7639 8.86293V8.41993L14.5758 7.58934L13.8689 5.82457H6.67639L5.96944 7.58934L5.78139 8.41993V8.86293C5.78139 9.35691 6.16684 9.75414 6.66667 9.75414C7.16649 9.75414 7.55194 9.35691 7.55194 8.86293V8.41993H8.43056V8.86293C8.43056 9.35691 8.81601 9.75414 9.31583 9.75414C9.81566 9.75414 10.2011 9.35691 10.2011 8.86293V8.41993H11.0797V8.86293C11.0797 9.35691 11.4652 9.75414 11.965 9.75414C12.4648 9.75414 12.8503 9.35691 12.8503 8.86293V8.41993H13.7289V8.86293C13.7289 9.35691 14.1143 9.75414 14.6142 9.75414C15.114 9.75414 15.4994 9.35691 15.4994 8.86293Z" fill="white"/>
            </svg>
          </div>
          <span class="filter-label">Clientes</span>
          <span class="filter-count">({{getCategoryCount('Cliente')}})</span>
        </div>
      </div>
      
      <div id="map" #mapElement class="map"></div>
    </div>

    <!-- Slide Panel for Store Details -->
    <app-slide-panel
      [isOpen]="isSlidePanelOpen()"
      [store]="selectedStore"
      [todayVisit]="selectedStoreVisit()"
      (closed)="onSlidePanelClosed()"
      (checkIn)="onCheckIn($event)"
      (leaveComment)="onLeaveComment($event)"
      (directionsRequested)="onDirectionsRequested($event)">
    </app-slide-panel>

    <!-- Pending Visits Banner -->
    <app-pending-banner
      [pendingVisits]="pendingVisitsSignal()"
      (visitSelected)="onPendingVisitSelected($event)"
      (viewAllClicked)="onViewAllPending()">
    </app-pending-banner>

    <!-- Comment Popup -->
    <app-comment-popup
      [isOpen]="isCommentPopupOpen"
      [storeId]="commentPopupStore?.id || ''"
      [storeName]="commentPopupStore?.name || ''"
      [visitId]="commentPopupVisitId"
      [isVerified]="isCommentVerified"
      [showNoVisitWarning]="false"
      (closed)="onCommentPopupClosed()"
      (commentSubmitted)="onCommentSubmitted($event)">
    </app-comment-popup>

    <!-- No Check-in Warning Popup -->
    <app-no-checkin-warning
      [isOpen]="isNoCheckinWarningOpen"
      [storeName]="noCheckinWarningStoreName"
      (cancel)="onNoCheckinWarningCancel()"
      (continueWithoutVerification)="onContinueWithoutVerification()"
      (closed)="onNoCheckinWarningClosed()">
    </app-no-checkin-warning>
  `,
  styleUrl: './map.page.css'
})
export class MapPage implements OnInit, AfterViewInit, OnDestroy {
  @ViewChild('mapElement', { static: true }) mapElement!: ElementRef;
  @ViewChild('searchInput', { static: true }) searchInput!: ElementRef;
  @ViewChild(SlidePanelComponent) slidePanelComponent?: SlidePanelComponent;
  @ViewChild(CommentPopupComponent) commentPopupComponent?: CommentPopupComponent;
  
  // Authentication properties
  protected readonly userName = signal<string>('');
  
  private map: any;
  private autocomplete: any;
  private currentInfoWindow: any;
  private markers: any[] = [];
  private Geocoder: any;
  private Autocomplete: any;
  private dataLoaded: boolean = false;
  private svgCache = new Map<string, string>();
  private markerClusterer: MarkerClusterer | null = null;
  private allFeatures: any[] = [];
  private markersByCategory = new Map<string, any[]>();
  public visibleCategories = new Set<string>(['Estacionamiento', 'CEDI', 'Cliente']);
  private categoryCounts = new Map<string, number>();
  
  // Search-related properties
  public searchResults: any[] = [];
  public selectedSearchIndex: number = -1;
  public searchQuery: string = '';
  public showSearchDropdown: boolean = false;
  public hideButtonsWhileSearching: boolean = false;
  private searchTimeout: any;
  
  // Slide Panel state - using signal for proper change detection
  public isSlidePanelOpen = signal<boolean>(false);
  public selectedStore: StoreData | null = null;
  private readonly _selectedStoreVisit = signal<VisitData | null>(null);
  public readonly selectedStoreVisit = computed(() => this._selectedStoreVisit());
  
  // Pending visits for banner
  public pendingVisitsSignal = signal<PendingVisit[]>([]);
  
  // Comment Popup state
  public isCommentPopupOpen: boolean = false;
  public commentPopupStore: StoreData | null = null;
  public commentPopupVisitId?: string;
  public isCommentVerified: boolean = false;
  
  // No Check-in Warning state
  public isNoCheckinWarningOpen: boolean = false;
  public noCheckinWarningStoreName: string = '';
  private pendingCommentStore: StoreData | null = null;
  
  constructor(
    @Inject(PLATFORM_ID) private platformId: Object,
    private datasetService: DatasetService,
    private authService: AuthService,
    private router: Router,
    private visitService: VisitService,
    private locationService: LocationService,
    private geofenceService: GeofenceService,
    private ngZone: NgZone
  ) {}
  
  ngOnInit(): void {
    // Initialize visit service
    this.initializeVisitService();
  }

  ngAfterViewInit(): void {
    // Load user info first
    this.loadUserInfo();
    
    // Only initialize map in browser environment
    if (isPlatformBrowser(this.platformId)) {
      this.loadGoogleMapsScript()
        .then(() => {
          this.initializeMap();
        })
        .catch((error) => {
          console.log('Failed to load Google Maps:', error);
        });
      
      // Add click-outside listener to close search dropdown
      document.addEventListener('click', (event) => {
        const searchBox = document.querySelector('.search-box');
        if (searchBox && !searchBox.contains(event.target as Node)) {
          this.showSearchDropdown = false;
          this.hideButtonsWhileSearching = false;
        }
      });
      
      // Request location permission and start tracking
      this.locationService.requestPermissionAndStartTracking();
      this.locationService.setMapVisible(true);
    }
  }

  ngOnDestroy(): void {
    this.locationService.setMapVisible(false);
    this.locationService.stopTracking();
  }

  private async initializeVisitService(): Promise<void> {
    try {
      await this.visitService.initialize();
      // Update pending visits signal from service
      this.pendingVisitsSignal.set(this.visitService.pendingVisits());
    } catch (error) {
      console.error('[MapPage] Failed to initialize visit service:', error);
    }
  }

  // ========================================
  // SLIDE PANEL HANDLERS
  // ========================================

  openSlidePanel(storeData: StoreData): void {
    // Run inside Angular zone to trigger change detection
    this.ngZone.run(() => {
      console.log('[MapPage] openSlidePanel called with:', storeData.name);
      this.selectedStore = storeData;
      
      // Get visit for this store
      const visit = this.visitService.getVisitForStoreSync(storeData.id);
      if (visit) {
        this._selectedStoreVisit.set({
          id: visit.id,
          storeId: visit.storeId,
          userId: visit.userId,
          visitDate: visit.visitDate,
          checkInTimestamp: visit.checkInTimestamp,
          commentStatus: visit.commentStatus
        });
      } else {
        this._selectedStoreVisit.set(null);
      }
      
      this.isSlidePanelOpen.set(true);
      console.log('[MapPage] isSlidePanelOpen set to:', this.isSlidePanelOpen());
      
      // Close any open info window
      if (this.currentInfoWindow) {
        this.currentInfoWindow.close();
        this.currentInfoWindow = null;
      }
    });
  }

  onSlidePanelClosed(): void {
    this.isSlidePanelOpen.set(false);
    this.selectedStore = null;
    this._selectedStoreVisit.set(null);
  }

  async onCheckIn(store: StoreData): Promise<void> {
    try {
      const result = await this.visitService.createOrReuseVisit(
        store.id,
        store.name,
        store.coordinates
      );
      
      // Update local state inside Angular zone to trigger change detection
      this.ngZone.run(() => {
        this._selectedStoreVisit.set({
          id: result.visit.id,
          storeId: result.visit.storeId,
          userId: result.visit.userId,
          visitDate: result.visit.visitDate,
          checkInTimestamp: result.visit.checkInTimestamp,
          commentStatus: result.visit.commentStatus
        });
      });
      
      // Refresh pending visits
      await this.visitService.fetchPendingVisits();
      this.pendingVisitsSignal.set(this.visitService.pendingVisits());
      
      // Update slide panel loading state
      this.slidePanelComponent?.setLoading(false);
      
      console.log(`[MapPage] Check-in successful for store ${store.name}`);
    } catch (error: any) {
      console.error('[MapPage] Check-in failed:', error.message || error);
      this.slidePanelComponent?.setLoading(false);
      // TODO: Show error notification to user
    }
  }

  onLeaveComment(data: { store: StoreData; visit: VisitData }): void {
    // Close slide panel and open comment popup
    this.isSlidePanelOpen.set(false);
    
    this.commentPopupStore = data.store;
    this.commentPopupVisitId = data.visit.id;
    this.isCommentVerified = true;
    this.isCommentPopupOpen = true;
  }

  onDirectionsRequested(store: StoreData): void {
    console.log(`[MapPage] Directions requested for store ${store.name}`);
  }

  // ========================================
  // PENDING BANNER HANDLERS
  // ========================================

  onPendingVisitSelected(pendingVisit: PendingVisit): void {
    // Find the store feature and open slide panel
    const feature = this.allFeatures.find(f => {
      const props = f.properties || {};
      // Match by store ID or name
      return props.id === pendingVisit.storeId || 
             props.Name === pendingVisit.storeName ||
             props.name === pendingVisit.storeName;
    });
    
    if (feature) {
      const storeData = this.featureToStoreData(feature);
      this.openSlidePanel(storeData);
      
      // Center map on the store
      const [lng, lat] = feature.geometry.coordinates;
      this.map.setCenter({ lat, lng });
      this.map.setZoom(16);
    }
  }

  onViewAllPending(): void {
    // Could navigate to a dedicated pending comments page
    // For now, just log
    console.log('[MapPage] View all pending clicked');
  }

  // ========================================
  // COMMENT POPUP HANDLERS
  // ========================================

  onCommentPopupClosed(): void {
    this.isCommentPopupOpen = false;
    this.commentPopupStore = null;
    this.commentPopupVisitId = undefined;
    this.isCommentVerified = false;
  }

  async onCommentSubmitted(data: { storeId: string; text: string; visitId?: string }): Promise<void> {
    try {
      const result = await this.visitService.createComment(
        data.storeId,
        data.text,
        data.visitId
      );
      
      // Refresh pending visits
      await this.visitService.fetchPendingVisits();
      this.pendingVisitsSignal.set(this.visitService.pendingVisits());
      
      this.commentPopupComponent?.finishSubmit(true);
      console.log(`[MapPage] Comment submitted, verified: ${result.verified}`);
    } catch (error: any) {
      console.error('[MapPage] Comment submission failed:', error);
      this.commentPopupComponent?.finishSubmit(false);
    }
  }

  // ========================================
  // NO CHECK-IN WARNING HANDLERS
  // ========================================

  showNoCheckinWarning(store: StoreData): void {
    this.pendingCommentStore = store;
    this.noCheckinWarningStoreName = store.name;
    this.isNoCheckinWarningOpen = true;
  }

  onNoCheckinWarningCancel(): void {
    this.isNoCheckinWarningOpen = false;
    this.pendingCommentStore = null;
  }

  onContinueWithoutVerification(): void {
    if (this.pendingCommentStore) {
      // Open comment popup without verification
      this.commentPopupStore = this.pendingCommentStore;
      this.commentPopupVisitId = undefined;
      this.isCommentVerified = false;
      this.isCommentPopupOpen = true;
    }
    
    this.isNoCheckinWarningOpen = false;
    this.pendingCommentStore = null;
  }

  onNoCheckinWarningClosed(): void {
    this.isNoCheckinWarningOpen = false;
    this.pendingCommentStore = null;
  }

  // ========================================
  // HELPER METHODS
  // ========================================

  private featureToStoreData(feature: any): StoreData {
    const props = feature.properties || {};
    const [lng, lat] = feature.geometry.coordinates;
    
    return {
      id: props.id || `${lat}-${lng}`,
      name: props.Name || props.name || 'Sin nombre',
      category: props.Category || props.category || 'Sin categoría',
      description: props.Description,
      phoneNumber: props['Phone Number'] || props.phone,
      personResponsible: props['Person Responsable'],
      hours: props.Hours,
      address: '', // Will be populated by reverse geocoding
      coordinates: { lat, lng }
    };
  }

  // Authentication methods
  private loadUserInfo(): void {
    const claims: any | null = this.authService.getIdTokenClaims();
    if (claims) {
      const name = claims.name || `${claims.given_name || ''} ${claims.family_name || ''}`.trim();
      this.userName.set(name || claims.preferred_username || 'Usuario');
    } else {
      this.userName.set('Usuario');
    }
  }

  protected handleProfile(): void {
    this.router.navigate(['/profile']);
  }

  protected handleLogout(): void {
    this.authService.logout();
  }

  private loadGoogleMapsScript(): Promise<void> {
    return new Promise((resolve, reject) => {
      // Check if we're in browser environment
      if (typeof window === 'undefined') {
        reject('Not in browser environment');
        return;
      }

      // Check if Google Maps is already loaded
      if ((window as any).google && (window as any).google.maps) {
        resolve();
        return;
      }

      // Create script element
      const script = document.createElement('script');
      script.src = `https://maps.googleapis.com/maps/api/js?key=${environment.googleMapsApiKey}&v=beta`;
      script.async = true;
      script.defer = true;

      script.onload = () => {
        console.log('Google Maps API loaded successfully');
        resolve();
      };

      script.onerror = (error) => {
        console.error('Error loading Google Maps API:', error);
        reject(error);
      };

      document.head.appendChild(script);
    });
  }

  private async initializeMap(): Promise<void> {
    console.log('Initializing Google Map...');
    
    try {
      // Import required libraries
      console.log('Importing Google Maps libraries...');
      const { Map } = await google.maps.importLibrary('maps') as any;
      const { Geocoder } = await google.maps.importLibrary('geocoding') as any;
      const { Autocomplete } = await google.maps.importLibrary('places') as any;
      
      console.log('Libraries imported successfully');
      
      // Store library references for later use
      this.Geocoder = Geocoder;
      this.Autocomplete = Autocomplete;
      
      // Initialize the map with Monterrey as default (will update to user location)
      this.map = new Map(this.mapElement.nativeElement, {
        mapId: environment.googleMapId, // Apply your custom cloud-based style
        center: { lat: 25.6866, lng: -100.3161 }, // Monterrey default
        zoom: 10,
        zoomControl: true,
        mapTypeControl: false,
        scaleControl: false,
        streetViewControl: false,
        rotateControl: false,
        fullscreenControl: false,
        gestureHandling: 'greedy',
        disableDefaultUI: false,
        // Note: styles array removed because mapId takes precedence
        restriction: {
          // Restrict to Mexico area to reduce map data
          latLngBounds: {
            north: 32.0,
            south: 14.5,
            west: -118.0,
            east: -86.7
          }
        },
        // Position all controls at bottom right
        zoomControlOptions: {
          position: google.maps.ControlPosition.RIGHT_BOTTOM
        }
      });
      
      // Wait for map to be ready before getting user location
      google.maps.event.addListenerOnce(this.map, 'idle', () => {
        console.log('Map is ready, getting user location...');
        this.getUserLocationAndCenter();
        
        // Enable the native location button
        this.enableLocationButton();
      });
      
      console.log('Map initialized successfully');
      
    } catch (error) {
      console.error('Error importing Google Maps libraries:', error);
      return;
    }
    
    // Note: Recenter button is now added after user location is obtained
    
    // Wait for map to be fully loaded
    this.map.addListener('tilesloaded', () => {
      console.log('Map tiles loaded - now loading markers from backend');
      console.log('Current zoom level:', this.map.getZoom());
      console.log('Current center:', this.map.getCenter()?.toString());
      
      // Load colored markers from backend (simplified approach)
      this.loadDataFromBackend();
    });
    
    // Initialize search functionality
    this.initializeSearch();
    
    console.log('Map initialized with backend data approach');
  }

  private initializeSearch(): void {
    console.log('Search functionality initialized for dataset search');
  }
  
  private loadDataFromBackend(): void {
    // Prevent multiple setups
    if (this.dataLoaded) {
      console.log('Backend data already loaded, skipping...');
      return;
    }
    
    console.log('Loading data directly from backend (no dataset layer needed)...');
    
    // Load colored markers from backend proxy - this is our main approach now
    this.loadColoredMarkersFromBackend();
    
    // Mark as setup to prevent duplicates
    this.dataLoaded = true;
  }

  /**
   * Load stable colored markers from backend data (NO WEBGL, NO DATASET!)
   */
  private async loadColoredMarkersFromBackend(): Promise<void> {
    console.log('Loading STABLE colored markers from backend data...');
    
    try {
      const geojson = await this.datasetService.fetchDatasetFromBackend();
      
      if (!geojson || !geojson.features) {
        console.error('Invalid data format - no features found');
        return;
      }
      
      console.log(`Creating ${geojson.features.length} optimized markers from backend...`);
      
      const pointFeatures = geojson.features.filter((f: any) => f.geometry?.type === 'Point');
      console.log(`Processing ${pointFeatures.length} markers with filtering support`);
      
      // Store all features for filtering
      this.allFeatures = pointFeatures;
      
      // Count markers by category
      this.countMarkersByCategory();
      
      // Create all markers initially
      for (const feature of pointFeatures) {
        this.createColoredMarkerFromFeature(feature);
      }
      
      console.log(`Successfully created ${this.markers.length} optimized pin markers! 🎯`);
      console.log('Features: SVG caching, marker clustering, category filtering!');
      
      // Setup marker clustering for better performance
      this.setupMarkerClustering();
      
    } catch (error: any) {
      console.error('Error loading markers from backend:', error);
      
      // Extract error details
      const errorMessage = error?.message || 'Unknown error';
      const errorStatus = error?.status || error?.statusCode || 'N/A';
      const backendUrl = environment.apiBaseUrl || 'Not configured';
      const datasetUrl = `${backendUrl}/api/dataset`;
      
      const errorInfoWindow = new google.maps.InfoWindow({
        content: `
          <div style="padding: 15px; color: #dc3545; background: #f8d7da; border-radius: 8px; border: 1px solid #f5c6cb;">
            <h3 style="margin-top: 0; color: #721c24;">❌ Backend Connection Failed</h3>
            <p style="margin-bottom: 8px;">Could not load markers from backend server.</p>
            <p style="margin-bottom: 4px;"><strong>Error:</strong> ${errorMessage}</p>
            <p style="margin-bottom: 4px;"><strong>Status:</strong> ${errorStatus}</p>
            <p style="margin-bottom: 4px;"><strong>Backend URL:</strong></p>
            <code style="background: #f5f5f5; padding: 4px 8px; border-radius: 4px; color: #333; display: block; margin-bottom: 8px;">${backendUrl}</code>
            <p style="margin-bottom: 4px;"><strong>Dataset Endpoint:</strong></p>
            <code style="background: #f5f5f5; padding: 4px 8px; border-radius: 4px; color: #333; display: block; margin-bottom: 8px;">${datasetUrl}</code>
            <button onclick="this.parentElement.parentElement.parentElement.style.display='none'" 
                    style="float: right; background: #dc3545; color: white; border: none; padding: 4px 8px; border-radius: 4px; cursor: pointer; margin-top: 8px;">Close</button>
          </div>
        `,
        position: this.map.getCenter()
      });
      
      errorInfoWindow.open(this.map);
      
      setTimeout(() => {
        errorInfoWindow.close();
      }, 15000);
    }
  }
  
  /**
   * Create pin/droplet shaped marker with SVG caching
   */
  private createColoredMarkerFromFeature(feature: any): void {
    try {
      const [lng, lat] = feature.geometry.coordinates;
      const properties = feature.properties || {};
      
      // Get category and color
      const category = properties.Category || properties.category || 'Estacionamiento';
      const color = this.getMarkerColor(category);
      
      // Get cached SVG with category-specific design
      const svgIcon = this.getCachedPinSVG(color, category);
      
      // Different dimensions and anchor points for different marker types
      const markerConfig = (category === 'Estacionamiento' || category === 'CEDI' || category === 'Cliente')
        ? {
            size: new google.maps.Size(30, 37),          // Custom markers: 30x37 (custom pin shape)
            anchor: new google.maps.Point(15, 37)        // Bottom center of custom pin
          }
        : {
            size: new google.maps.Size(30, 30),          // Unknown: 30x30 (standard pin)
            anchor: new google.maps.Point(15, 27)        // Bottom center of standard pin
          };
      
      // Create marker
      const marker = new google.maps.Marker({
        position: { lat, lng },
        map: this.map,
        title: properties.Name || properties.name || category,
        icon: {
          url: `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svgIcon)}`,
          scaledSize: markerConfig.size,
          anchor: markerConfig.anchor
        }
      });
      
      // Add click listener to open slide panel
      marker.addListener('click', async () => {
        // Close any existing info window
        if (this.currentInfoWindow) {
          this.currentInfoWindow.close();
          this.currentInfoWindow = null;
        }
        
        // Create store data with empty address first (to open panel immediately)
        const storeData: StoreData = {
          id: properties.id || `${lat}-${lng}`,
          name: properties.Name || properties.name || 'Sin nombre',
          category,
          description: properties.Description,
          phoneNumber: properties['Phone Number'] || properties.phone,
          personResponsible: properties['Person Responsable'],
          hours: properties.Hours,
          address: 'Cargando dirección...',
          coordinates: { lat, lng }
        };
        
        // Center map on marker with offset for slide panel
        const mapHasBounds = typeof this.map?.getBounds === 'function';
        const mapBounds = mapHasBounds ? this.map.getBounds() : null;
        if (mapBounds) {
          const latSpan = mapBounds.getNorthEast().lat() - mapBounds.getSouthWest().lat();
          const offsetLat = latSpan * 0.15;
          this.map.panTo({ lat: lat + offsetLat, lng });
        } else {
          this.map?.panTo?.({ lat, lng });
        }
        
        await this.showMarkerInfoWindowCentered(properties, { lat, lng }, marker);

        // Open slide panel immediately
        this.openSlidePanel(storeData);
        
        // Try to get address asynchronously (don't block panel)
        try {
          const address = await this.getAddressFromCoordinates({ lat, lng });
          // Update store data with address if panel is still open for this store
          this.ngZone.run(() => {
            if (this.selectedStore && this.selectedStore.id === storeData.id) {
              this.selectedStore = { ...this.selectedStore, address };
            }
          });
        } catch (error) {
          console.warn('[MapPage] Could not get address:', error);
          // Update with fallback address
          this.ngZone.run(() => {
            if (this.selectedStore && this.selectedStore.id === storeData.id) {
              this.selectedStore = { ...this.selectedStore, address: 'Dirección no disponible' };
            }
          });
        }
      });
      
      // Store marker reference and organize by category
      this.markers.push(marker);
      
      // Organize markers by category for filtering
      if (!this.markersByCategory.has(category)) {
        this.markersByCategory.set(category, []);
      }
      this.markersByCategory.get(category)!.push(marker);
      
    } catch (error) {
      console.error('Error creating marker:', error);
    }
  }
  
  /**
   * Get cached SVG for marker based on category and color (30px width)
   */
  private getCachedPinSVG(color: string, category?: string): string {
    const cacheKey = `${color}-${category || 'default'}`;
    
    if (!this.svgCache.has(cacheKey)) {
      let svg = '';
      
      // Custom parking marker with "P" design (pin shape)
      if (category === 'Estacionamiento') {
        svg = `
          <svg width="30" height="37" viewBox="0 0 30 37" xmlns="http://www.w3.org/2000/svg">
            <path fill-rule="evenodd" clip-rule="evenodd" d="M30 15C30 23.284 17.25 36.75 15 36.75C12.75 36.75 0 23.284 0 15C0 6.716 6.716 0 15 0C23.284 0 30 6.716 30 15ZM10.2 22.5H20.1V19.9H13V16.1H18.9V13.5H13V10.1H20V7.5H10.2V22.5Z" fill="${color}"/>
            <path d="M10.2 22.5H20.1V19.9H13V16.1H18.9V13.5H13V10.1H20V7.5H10.2V22.5Z" fill="white"/>
          </svg>
        `;
      } else if (category === 'CEDI') {
        // Custom CEDI marker with warehouse/distribution icon
        svg = `
          <svg width="30" height="37" viewBox="0 0 30 37" xmlns="http://www.w3.org/2000/svg">
            <path d="M30 15C30 23.284 17.25 36.75 15 36.75C12.75 36.75 0 23.284 0 15C0 6.716 6.716 0 15 0C23.284 0 30 6.716 30 15Z" fill="${color}"/>
            <path d="M12.15 7.5L6.3 10.35L8.4 12.45L14.25 9.75L12.15 7.5ZM17.4 7.5L15.3 9.75L21.15 12.45L23.25 10.35L17.4 7.5ZM14.8 10.05L14.55 10.15V15.3L14.8 15.4L15.05 15.3V10.15L14.8 10.05ZM8.4 12.75L6.25 15.15L11.7 17.55L14.25 15.15L8.4 12.75ZM20.9 12.75L14.8 15.15L17.35 17.55L22.8 15.15L20.9 12.75ZM14.55 16.05L12.05 18.45L9.1 17V18.45L14.55 21V16.05ZM15.05 16.05V21L20.5 18.45V17L17.55 18.45L15.05 16.05Z" fill="white"/>
          </svg>
        `;
      } else if (category === 'Cliente') {
        // Custom Cliente marker with building/office icon
        svg = `
          <svg width="30" height="37" viewBox="0 0 30 37" xmlns="http://www.w3.org/2000/svg">
            <path d="M30 15C30 23.284 17.25 36.75 15 36.75C12.75 36.75 0 23.284 0 15C0 6.716 6.716 0 15 0C23.284 0 30 6.716 30 15Z" fill="${color}"/>
            <path fill-rule="evenodd" clip-rule="evenodd" d="M21.5 7.5H9.1L7.5 11.95V13.25C7.5 13.9 7.75 14.45 8.1 14.8V22.5H22.5V14.8C22.85 14.45 23.1 13.9 23.1 13.25V11.95L21.5 7.5ZM21.2 15.85C21.05 15.88 20.9 15.9 20.75 15.9C20.35 15.9 19.95 15.7 19.65 15.35C19.35 15.7 18.95 15.9 18.55 15.9C18.15 15.9 17.75 15.7 17.45 15.35C17.15 15.7 16.75 15.9 16.35 15.9C15.95 15.9 15.55 15.7 15.25 15.35C14.95 15.7 14.55 15.9 14.15 15.9C14 15.9 13.85 15.88 13.7 15.85V20.7H16.5V17.1H17.5V20.7H21.2V15.85ZM16.6 18.5V20.7H14.4V18.5H16.6ZM21.8 13.25V12.7L21.55 11.5L20.6 8.8H10.05L9.1 11.5L8.85 12.7V13.25C8.85 13.95 9.35 14.45 9.85 14.45C10.35 14.45 10.85 13.95 10.85 13.25V12.7H12.35V13.25C12.35 13.95 12.85 14.45 13.35 14.45C13.85 14.45 14.35 13.95 14.35 13.25V12.7H15.35V13.25C15.35 13.95 15.85 14.45 16.35 14.45C16.85 14.45 17.35 13.95 17.35 13.25V12.7H18.35V13.25C18.35 13.95 18.85 14.45 19.35 14.45C19.85 14.45 20.35 13.95 20.35 13.25Z" fill="white"/>
          </svg>
        `;
      } else {
        // Pin/droplet style for other categories (Unknown)
        svg = `
          <svg width="30" height="30" xmlns="http://www.w3.org/2000/svg">
            <path d="M15 3 C21 3, 25.5 7.5, 25.5 13.5 C25.5 19.5, 15 27, 15 27 S4.5 19.5, 4.5 13.5 C4.5 7.5, 9 3, 15 3 Z" 
                  fill="${color}" 
                  stroke="white" 
                  stroke-width="2"/>
            <circle cx="15" cy="13.5" r="4.5" 
                    fill="rgba(255,255,255,0.3)" 
                    stroke="white" 
                    stroke-width="1"/>
          </svg>
        `;
      }
      
      this.svgCache.set(cacheKey, svg);
      const markerType = category === 'Estacionamiento' ? 'parking' : 
                         category === 'CEDI' ? 'CEDI warehouse' :
                         category === 'Cliente' ? 'client building' : 'pin';
      console.log(`Cached ${markerType} SVG for: ${category || 'default'} (${color})`);
    }
    
    return this.svgCache.get(cacheKey)!;
  }

  /**
   * Get marker color based on category
   */
  private getMarkerColor(category: string): string {
    switch (category?.toLowerCase()) {
      case 'estacionamiento':
        return '#007FFF'; // Blue for parking
      case 'cedi':
        return '#FF8C00'; // Orange for CEDI
      case 'cliente':
        return '#ED1B24'; // Red for client
      default:
        return '#007FFF'; // Default to blue
    }
  }

  /**
   * Get custom cluster renderer for consistent styling
   */
  private getClusterRenderer() {
    return {
      render: ({ count, position }: { count: number, position: any }, stats: any) => {
        // Custom cluster marker styling - gray with no glow
        const color = '#6b7280'; // Gray color
        const textColor = '#ffffff'; // White text
        
        // Create custom cluster marker
        const svg = `
          <svg width="40" height="40" viewBox="0 0 40 40" xmlns="http://www.w3.org/2000/svg">
            <circle cx="20" cy="20" r="20" fill="${color}"/>
            <text x="20" y="26" text-anchor="middle" fill="${textColor}" font-family="'Segoe UI', sans-serif" font-size="14" font-weight="600">${count}</text>
          </svg>
        `;
        
        return new google.maps.Marker({
          position,
          icon: {
            url: `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`,
            scaledSize: new google.maps.Size(40, 40),
            anchor: new google.maps.Point(20, 20)
          },
          label: {
            text: '',
            color: 'transparent'
          },
          zIndex: 1000 + count
        });
      }
    };
  }
  
  /**
   * Setup marker clustering for better performance
   */
  private setupMarkerClustering(): void {
    if (this.markers.length > 0) {
      // Clear existing clusterer if any
      if (this.markerClusterer) {
        this.markerClusterer.clearMarkers();
      }

      // Create new marker clusterer with custom gray styling
      this.markerClusterer = new MarkerClusterer({
        map: this.map,
        markers: this.markers,
        renderer: this.getClusterRenderer()
      });

      console.log(`Marker clustering setup complete with ${this.markers.length} markers`);
    }
  }

  /**
   * Enable Google Maps native location button
   */
  private enableLocationButton(): void {
    // Create a custom control for the location button
    const locationButton = document.createElement('button');
    locationButton.textContent = '';
    locationButton.classList.add('custom-map-control-button');
    locationButton.title = 'Centrar en mi ubicación';
    locationButton.type = 'button';
    locationButton.style.cssText = `
      background: #fff;
      border: 0;
      border-radius: 2px;
      box-shadow: 0 1px 4px -1px rgba(0,0,0,.3);
      margin: 10px 10px 0 0;
      padding: 0;
      cursor: pointer;
      overflow: hidden;
      width: 40px;
      height: 40px;
      display: flex;
      align-items: center;
      justify-content: center;
    `;
    
    // Add the icon
    locationButton.innerHTML = `
      <svg width="18" height="18" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path fill-rule="evenodd" clip-rule="evenodd" d="M9 0C9.55228 0 10 0.447715 10 1V2.10002C13.3923 2.55006 16 5.42276 16 9C16 12.5772 13.3923 15.4499 10 15.9V17C10 17.5523 9.55228 18 9 18C8.44772 18 8 17.5523 8 17V15.9C4.60771 15.4499 2 12.5772 2 9C2 5.42276 4.60771 2.55006 8 2.10002V1C8 0.447715 8.44772 0 9 0ZM9 4C6.23858 4 4 6.23858 4 9C4 11.7614 6.23858 14 9 14C11.7614 14 14 11.7614 14 9C14 6.23858 11.7614 4 9 4ZM9 7C10.1046 7 11 7.89543 11 9C11 10.1046 10.1046 11 9 11C7.89543 11 7 10.1046 7 9C7 7.89543 7.89543 7 9 7Z" fill="#666"/>
      </svg>
    `;
    
    // Add click handler
    locationButton.addEventListener('click', () => {
      const userLocation = (window as any).userLocation;
      if (userLocation) {
        this.map.setCenter(userLocation);
        this.map.setZoom(14);
        // Change icon color to indicate active state
        const svg = locationButton.querySelector('path');
        if (svg) {
          svg.setAttribute('fill', '#4285F4');
          setTimeout(() => {
            svg.setAttribute('fill', '#666');
          }, 2000);
        }
      } else {
        // Try to get location if not available
        this.getUserLocationAndCenter();
      }
    });
    
    // Add hover effects
    locationButton.addEventListener('mouseenter', () => {
      locationButton.style.backgroundColor = '#ebebeb';
    });
    
    locationButton.addEventListener('mouseleave', () => {
      locationButton.style.backgroundColor = '#fff';
    });
    
    // Add the control to the map at bottom right, above other controls
    this.map.controls[google.maps.ControlPosition.RIGHT_BOTTOM].push(locationButton);
  }
  
  /**
   * Get user location and center the map
   */
  private getUserLocationAndCenter(): void {
    if (!navigator.geolocation) {
      console.log('Geolocation not supported by browser');
      return;
    }

    console.log('Requesting user location for initial center...');
    
    // Use the fallback strategy which will handle centering and marker display
    this.requestUserLocationWithFallback();
  }
  
  /**
   * Add user location marker to the map
   */
  private addUserLocationMarker(location: {lat: number, lng: number}, accuracy: number): void {
    // Create a custom blue dot icon
    const userIcon = {
      path: google.maps.SymbolPath.CIRCLE,
      scale: 10,
      fillColor: '#4285F4',
      fillOpacity: 1,
      strokeColor: '#ffffff',
      strokeWeight: 3
    };
    
    // Add the user location marker
    const userMarker = new google.maps.Marker({
      position: location,
      map: this.map,
      title: 'Tu ubicación actual',
      icon: userIcon,
      zIndex: 2000,
      optimized: false
    });
    
    // Add accuracy circle
    const accuracyCircle = new google.maps.Circle({
      strokeColor: '#4285F4',
      strokeOpacity: 0.4,
      strokeWeight: 1,
      fillColor: '#4285F4',
      fillOpacity: 0.15,
      map: this.map,
      center: location,
      radius: accuracy || 50,
      clickable: false
    });
    
    // Add inner circle
    const innerCircle = new google.maps.Circle({
      strokeColor: '#4285F4',
      strokeOpacity: 0,
      strokeWeight: 0,
      fillColor: '#4285F4',
      fillOpacity: 0.25,
      map: this.map,
      center: location,
      radius: 20,
      clickable: false
    });
    
    console.log('User location marker added to map');
  }
  
  /**
   * Request user location with fallback strategy
   * Tries high accuracy first, then falls back to lower accuracy if needed
   */
  private requestUserLocationWithFallback(): void {
    if (!navigator.geolocation) {
      console.log('Geolocation not supported by this browser');
      return;
    }

    console.log('Requesting user location with fallback strategy...');
    
    // First attempt: High accuracy
    navigator.geolocation.getCurrentPosition(
      (position) => {
        this.handleUserLocationSuccess(position);
      },
      (error) => {
        console.warn('High accuracy location failed, trying with lower accuracy...', error.message);
        
        // Fallback: Lower accuracy, longer timeout, accept cached data
        navigator.geolocation.getCurrentPosition(
          (position) => {
            this.handleUserLocationSuccess(position);
          },
          (fallbackError) => {
            console.error('Geolocation failed after fallback:', fallbackError);
            this.handleUserLocationError(fallbackError);
            this.showUserLocationOnMap();
          },
          {
            enableHighAccuracy: false, // Less accurate but faster
            timeout: 20000, // 20 seconds
            maximumAge: 300000 // Accept cached positions up to 5 minutes old
          }
        );
      },
      {
        enableHighAccuracy: true,
        timeout: 15000, // 15 seconds
        maximumAge: 60000 // Accept cached positions up to 1 minute old
      }
    );
  }

  /**
   * Basic user location display used by legacy flows and tests
   */
  private showUserLocationOnMap(): void {
    if (!navigator.geolocation) {
      console.warn('Geolocation not supported by this browser');
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => this.handleUserLocationSuccess(position),
      (error) => this.handleUserLocationError(error),
      {
        enableHighAccuracy: false,
        timeout: 10000,
        maximumAge: 60000
      }
    );
  }

  /**
   * Handle successful user location retrieval
   */
  private handleUserLocationSuccess(position: GeolocationPosition): void {
    const userLocation = {
      lat: position.coords.latitude,
      lng: position.coords.longitude
    };
    
    console.log('User location obtained:', userLocation);
    console.log('Accuracy:', position.coords.accuracy, 'meters');
    
    // Always add the user location marker, regardless of bounds
    // Create a custom blue dot icon similar to Google Maps
    const userIcon = {
      path: google.maps.SymbolPath.CIRCLE,
      scale: 10,
      fillColor: '#4285F4',
      fillOpacity: 1,
      strokeColor: '#ffffff',
      strokeWeight: 3
    };
    
    // Add the user location marker
    const userMarker = new google.maps.Marker({
      position: userLocation,
      map: this.map,
      title: 'Tu ubicación actual',
      icon: userIcon,
      zIndex: 2000,
      optimized: false
    });
    
    // Add pulsing animation circle
    const pulsingCircle = new google.maps.Circle({
      strokeColor: '#4285F4',
      strokeOpacity: 0.4,
      strokeWeight: 1,
      fillColor: '#4285F4',
      fillOpacity: 0.15,
      map: this.map,
      center: userLocation,
      radius: position.coords.accuracy || 100,
      clickable: false
    });
    
    // Add a smaller inner circle for better visibility
    const innerCircle = new google.maps.Circle({
      strokeColor: '#4285F4',
      strokeOpacity: 0,
      strokeWeight: 0,
      fillColor: '#4285F4',
      fillOpacity: 0.25,
      map: this.map,
      center: userLocation,
      radius: 30,
      clickable: false
    });
    
    // Check if location is within Mexico bounds for centering decision
    const restriction = this.map.getOptions().restriction;
    const bounds = restriction?.latLngBounds;
    
    if (!bounds || 
        (userLocation.lat >= bounds.south && 
         userLocation.lat <= bounds.north && 
         userLocation.lng >= bounds.west && 
         userLocation.lng <= bounds.east)) {
      
      // Center map on user's location
      this.map.setCenter(userLocation);
      this.map.setZoom(14);
      console.log('Map centered on user location within bounds');
      
    } else {
      console.log('User location is outside Mexico bounds, but marker is still shown');
    }
    
    // Store user location for potential later use
    (window as any).userLocation = userLocation;
  }

  /**
   * Handle user location error
   */
  private handleUserLocationError(error: GeolocationPositionError): void {
    switch(error.code) {
      case error.PERMISSION_DENIED:
        console.warn('User denied geolocation request');
        break;
      case error.POSITION_UNAVAILABLE:
        console.warn('Location information unavailable');
        break;
      case error.TIMEOUT:
        console.warn('Location request timed out - GPS may be slow or unavailable');
        break;
      default:
        console.warn('Unknown geolocation error:', error.message);
    }
  }
  
  /**
   * Show info window for marker click with centered positioning
   */
  private async showMarkerInfoWindowCentered(properties: any, position: any, marker: any): Promise<void> {
    // Calculate offset to center the marker in the viewable area (accounting for UI elements)
    const mapBounds = this.map.getBounds();
    const latSpan = mapBounds.getNorthEast().lat() - mapBounds.getSouthWest().lat();
    
    // Offset to position marker higher on screen so info window appears above it with marker visible
    const offsetLat = latSpan * 0.3; // Move marker up 30% of viewport height
    
    const centeredPosition = {
      lat: position.lat + offsetLat,
      lng: position.lng
    };
    
    // Center map on offset position first
    this.map.panTo(centeredPosition);
    
    // Wait a moment for map animation, then show info window above the marker
    setTimeout(async () => {
      const address = await this.getAddressFromCoordinates(position);
      
      // Calculate position above the marker for the info window
      const mapBounds = this.map.getBounds();
      const latSpan = mapBounds.getNorthEast().lat() - mapBounds.getSouthWest().lat();
      const infoWindowOffset = latSpan * 0.04; // Higher offset above marker
      
      const infoWindowPosition = {
        lat: position.lat + infoWindowOffset,
        lng: position.lng
      };
      
      this.createDetailedInfoWindow(properties, address, infoWindowPosition);
    }, 300); // Wait for pan animation to complete
  }
  
  /**
   * Show info window for marker click (legacy method for search results)
   */
  private async showMarkerInfoWindow(properties: any, position: any): Promise<void> {
    // Get address from coordinates using reverse geocoding
    const address = await this.getAddressFromCoordinates(position);
    
    // Create detailed info window using existing method
    this.createDetailedInfoWindow(properties, address, position);
  }
  
  private async getAddressFromCoordinates(latLng: any): Promise<string> {
    return new Promise((resolve) => {
      const geocoder = new this.Geocoder();
      
      // Handle both Google Maps LatLng objects and plain coordinate objects
      const locationObj = {
        lat: typeof latLng.lat === 'function' ? latLng.lat() : latLng.lat,
        lng: typeof latLng.lng === 'function' ? latLng.lng() : latLng.lng
      };
      
      geocoder.geocode({ location: locationObj }, (results: any, status: any) => {
        if (status === google.maps.GeocoderStatus.OK && results && results.length > 0) {
          resolve(results[0].formatted_address);
        } else {
          resolve('Dirección no disponible');
        }
      });
    });
  }
  
  private createDetailedInfoWindow(properties: any, address: string, coordinates: any): void {
    // Get category and color
    const category = properties.Category || properties.category || 'Sin categoría';
    const color = this.getMarkerColor(category);
    
    // Get coordinates for directions
    const lat = typeof coordinates.lat === 'function' ? coordinates.lat() : coordinates.lat;
    const lng = typeof coordinates.lng === 'function' ? coordinates.lng() : coordinates.lng;
    
    // Create visually appealing info window content
    const isMobile = window.innerWidth <= 600;
    const content = `
      <style>
        .gm-style .gm-style-iw-c {
          padding: 0 !important;
          overflow: visible !important;
          max-width: none !important;
          box-shadow: none !important;
          background: transparent !important;
          border-radius: 0 !important;
        }
        .gm-style .gm-style-iw-d {
          overflow: visible !important;
          background: transparent !important;
        }
        .gm-style .gm-style-iw-t::after {
          display: none !important;
        }
        .gm-style .gm-style-iw-tc::after {
          display: none !important;
        }
        .gm-ui-hover-effect {
          display: none !important;
        }
        @media (max-width: 600px) {
          .custom-info-window {
            width: 100vw !important;
            max-width: 100vw !important;
            max-height: 75vh !important;
            position: fixed !important;
            bottom: 0 !important;
            left: 0 !important;
            right: 0 !important;
            margin: 0 !important;
            border-radius: 20px 20px 0 0 !important;
            box-shadow: 0 -4px 20px rgba(0,0,0,0.3) !important;
            display: flex !important;
            flex-direction: column !important;
            z-index: 10000 !important;
          }
          .info-window-header {
            position: sticky !important;
            top: 0 !important;
            z-index: 10001 !important;
            flex-shrink: 0 !important;
          }
          .info-window-content {
            flex: 1 !important;
            overflow-y: auto !important;
            -webkit-overflow-scrolling: touch !important;
            max-height: calc(75vh - 80px) !important;
          }
        }
        .swipe-indicator {
          width: 40px;
          height: 4px;
          background: rgba(255,255,255,0.5);
          border-radius: 2px;
          margin: 6px auto;
          transition: opacity 0.3s;
        }
        @media (min-width: 601px) {
          .swipe-indicator {
            display: none;
          }
        }
      </style>
      <div class="custom-info-window" id="info-window-${Date.now()}" style="position: relative; width: ${isMobile ? '100vw' : '250px'}; max-width: ${isMobile ? '100vw' : '280px'}; max-height: ${isMobile ? '75vh' : 'none'}; font-family: 'Segoe UI', sans-serif; margin: ${isMobile ? '0' : '-10px -10px -15px -10px'}; touch-action: pan-y; ${isMobile ? 'border-radius: 20px 20px 0 0; box-shadow: 0 -4px 20px rgba(0,0,0,0.3); display: flex; flex-direction: column;' : ''}">
        <div class="swipe-indicator"></div>
        <div class="info-window-header" style="background: linear-gradient(135deg, ${color} 0%, ${this.lightenColor(color, 20)} 100%); color: white; padding: ${isMobile ? '16px' : '12px'} ${isMobile ? '16px' : '14px'}; position: ${isMobile ? 'sticky' : 'relative'}; top: ${isMobile ? '0' : 'auto'}; border-radius: ${isMobile ? '20px 20px 0 0' : '12px 12px 0 0'}; touch-action: none; flex-shrink: 0; z-index: ${isMobile ? '10001' : 'auto'};">
          <button onclick="window.closeInfoWindow()" style="position: absolute; top: ${isMobile ? '8px' : '6px'}; right: ${isMobile ? '8px' : '6px'}; background: rgba(255,255,255,0.4); border: none; border-radius: 50%; width: ${isMobile ? '32px' : '24px'}; height: ${isMobile ? '32px' : '24px'}; cursor: pointer; display: flex; align-items: center; justify-content: center; transition: all 0.2s; z-index: 10; box-shadow: 0 2px 4px rgba(0,0,0,0.2);" 
                  onmouseover="this.style.background='rgba(255,255,255,0.6)';this.style.transform='scale(1.1)'" 
                  onmouseout="this.style.background='rgba(255,255,255,0.4)';this.style.transform='scale(1)'"
                  ontouchstart="this.style.background='rgba(255,255,255,0.6)';this.style.transform='scale(1.1)'"
                  ontouchend="this.style.background='rgba(255,255,255,0.4)';this.style.transform='scale(1)'">
            <span style="color: white; font-size: ${isMobile ? '20px' : '16px'}; font-weight: 300; line-height: 1;">&times;</span>
          </button>
          
          <div style="display: flex; align-items: center; gap: 8px; padding-right: 26px;">
            <div style="width: 24px; height: 24px; background: rgba(255,255,255,0.2); border-radius: 50%; display: flex; align-items: center; justify-content: center; flex-shrink: 0;">
              ${this.getCategoryIcon(category)}
            </div>
            <div style="min-width: 0;">
              <h3 style="margin: 0 0 1px 0; font-size: 14px; font-weight: 600; line-height: 1.2; overflow-wrap: break-word; word-break: break-word;">${properties.Name || properties.name || 'Sin nombre'}</h3>
              <div style="font-size: 10px; opacity: 0.95; font-weight: 400;">${category}</div>
            </div>
          </div>
        </div>
        
        <div class="info-window-content" style="padding: 10px 12px 12px; background: white; border-radius: 0 0 ${isMobile ? '20px 20px' : '12px 12px'}; box-shadow: ${isMobile ? 'none' : '0 4px 20px rgba(0,0,0,0.15)'}; ${isMobile ? 'overflow-y: auto; -webkit-overflow-scrolling: touch; flex: 1;' : ''}">
          ${properties.Description ? `
            <p style="margin: 0 0 10px 0; font-size: 11px; color: #333; line-height: 1.4; overflow-wrap: break-word;">${properties.Description}</p>
          ` : ''}
          
          <div style="display: flex; flex-direction: column; gap: 6px;">
            ${(properties['Phone Number'] || properties.phone) ? `
              <div style="display: flex; align-items: flex-start; gap: 6px;">
                <div style="width: 20px; height: 20px; background: ${this.lightenColor(color, 40)}; border-radius: 4px; display: flex; align-items: center; justify-content: center; flex-shrink: 0;">
                  <span style="font-size: 10px;">📞</span>
                </div>
                <div style="min-width: 0;">
                  <div style="font-size: 8px; color: #666; text-transform: uppercase; letter-spacing: 0.2px;">Teléfono</div>
                  <a href="tel:${properties['Phone Number'] || properties.phone}" style="color: ${color}; text-decoration: none; font-weight: 500; font-size: 11px; overflow-wrap: break-word; word-break: break-word; display: block;">
                    ${properties['Phone Number'] || properties.phone}
                  </a>
                </div>
              </div>
            ` : ''}
            
            ${properties['Person Responsable'] ? `
              <div style="display: flex; align-items: flex-start; gap: 6px;">
                <div style="width: 20px; height: 20px; background: ${this.lightenColor(color, 40)}; border-radius: 4px; display: flex; align-items: center; justify-content: center; flex-shrink: 0;">
                  <span style="font-size: 10px;">👤</span>
                </div>
                <div style="min-width: 0;">
                  <div style="font-size: 8px; color: #666; text-transform: uppercase; letter-spacing: 0.2px;">Responsable</div>
                  <div style="color: #333; font-weight: 500; font-size: 11px; overflow-wrap: break-word; word-break: break-word;">${properties['Person Responsable']}</div>
                </div>
              </div>
            ` : ''}
            
            ${properties.Hours ? `
              <div style="display: flex; align-items: flex-start; gap: 6px;">
                <div style="width: 20px; height: 20px; background: ${this.lightenColor(color, 40)}; border-radius: 4px; display: flex; align-items: center; justify-content: center; flex-shrink: 0;">
                  <span style="font-size: 10px;">🕐</span>
                </div>
                <div style="min-width: 0;">
                  <div style="font-size: 8px; color: #666; text-transform: uppercase; letter-spacing: 0.2px;">Horarios</div>
                  <div style="color: #333; font-weight: 500; font-size: 11px; overflow-wrap: break-word; word-break: break-word;">${properties.Hours}</div>
                </div>
              </div>
            ` : ''}
            
            <div style="margin-top: 4px; padding-top: 6px; border-top: 1px solid #e5e5e5;">
              <div style="display: flex; align-items: flex-start; gap: 6px;">
                <div style="width: 20px; height: 20px; background: #f0f0f0; border-radius: 4px; display: flex; align-items: center; justify-content: center; flex-shrink: 0;">
                  <span style="font-size: 10px;">📍</span>
                </div>
                <div style="min-width: 0;">
                  <div style="font-size: 8px; color: #666; text-transform: uppercase; letter-spacing: 0.2px;">Dirección</div>
                  <div style="color: #555; font-size: 10px; line-height: 1.3; overflow-wrap: break-word; word-break: break-word;">${address}</div>
                </div>
              </div>
            </div>
          </div>
          
          <!-- Directions Button -->
          <button onclick="window.openDirections(${lat}, ${lng})" 
                  style="display: block; width: 100%; margin-top: 12px; padding: 10px; background: ${color}; color: white; text-align: center; border: none; font-size: 13px; font-weight: 600; border-radius: 8px; transition: all 0.2s cubic-bezier(0.4, 0.0, 0.2, 1); cursor: pointer; box-shadow: 0 2px 8px rgba(0,0,0,0.1);"
                  onmouseover="this.style.background='${this.lightenColor(color, -10)}'; this.style.transform='translateY(-1px)'; this.style.boxShadow='0 4px 12px rgba(0,0,0,0.15)';" 
                  onmouseout="this.style.background='${color}'; this.style.transform='translateY(0)'; this.style.boxShadow='0 2px 8px rgba(0,0,0,0.1);'">
            <span style="margin-right: 6px;">🧭</span>
            Ver Direcciones
          </button>
        </div>
        ${!isMobile ? `<!-- Tail/Peak pointing down to marker -->
        <div style="position: absolute; bottom: -8px; left: 50%; transform: translateX(-50%); width: 0; height: 0; border-left: 8px solid transparent; border-right: 8px solid transparent; border-top: 8px solid white; filter: drop-shadow(0 2px 4px rgba(0,0,0,0.1));"></div>` : ''}
      </div>
    `;
    
    // Create and open the info window at the marker position
    const infoWindow = new google.maps.InfoWindow({
      content: content,
      position: isMobile ? undefined : coordinates, // On mobile, we'll position it manually
      maxWidth: isMobile ? window.innerWidth : 300,
      disableAutoPan: isMobile,
      pixelOffset: isMobile ? new google.maps.Size(0, 0) : new google.maps.Size(0, -30) // Offset to position above marker
    });
    
    // Close any existing info window
    if (this.currentInfoWindow) {
      this.currentInfoWindow.close();
    }
    this.currentInfoWindow = infoWindow;
    
    // Add close function to window object for the close button
    (window as any).closeInfoWindow = () => {
      if (this.currentInfoWindow) {
        this.currentInfoWindow.close();
      }
    };
    
    // Add directions function to window object
    (window as any).openDirections = (lat: number, lng: number) => {
      const url = `https://maps.google.com/maps?daddr=${lat},${lng}`;
      window.open(url, '_blank');
    };
    
    // Clear reference when closed
    infoWindow.addListener('closeclick', () => {
      this.currentInfoWindow = null;
    });
    
    infoWindow.open(this.map);
    
    // Add swipe-to-close functionality for mobile and position at bottom
    if (isMobile) {
      // Wait for the info window to be rendered in the DOM
      setTimeout(() => {
        // Find the info window container in the DOM
        const infoWindowContainer = document.querySelector('.gm-style-iw-d') as HTMLElement;
        const infoWindowElement = document.querySelector('.custom-info-window') as HTMLElement;
        
        if (infoWindowContainer && infoWindowElement) {
          // Position the info window at the bottom of the screen
          const infoWindowParent = infoWindowContainer.parentElement?.parentElement as HTMLElement;
          if (infoWindowParent) {
            infoWindowParent.style.position = 'fixed';
            infoWindowParent.style.bottom = '0';
            infoWindowParent.style.left = '0';
            infoWindowParent.style.right = '0';
            infoWindowParent.style.top = 'auto';
            infoWindowParent.style.transform = 'none';
            infoWindowParent.style.width = '100%';
            infoWindowParent.style.maxWidth = '100%';
            infoWindowParent.style.zIndex = '10000';
          }
          
          let touchStartY = 0;
          let touchStartX = 0;
          let isDragging = false;
          const targetElement = infoWindowParent || infoWindowElement;
          
          const handleTouchStart = (e: TouchEvent) => {
            // Only start drag from header or swipe indicator
            const target = e.target as HTMLElement;
            if (target.closest('.info-window-header') || target.closest('.swipe-indicator')) {
              touchStartY = e.touches[0].clientY;
              touchStartX = e.touches[0].clientX;
              isDragging = false;
            }
          };
          
          const handleTouchMove = (e: TouchEvent) => {
            if (!touchStartY || !touchStartX) return;
            
            const touchCurrentY = e.touches[0].clientY;
            const touchCurrentX = e.touches[0].clientX;
            const deltaY = touchCurrentY - touchStartY;
            const deltaX = touchCurrentX - touchStartX;
            
            // Check if this is a vertical swipe (more vertical than horizontal)
            if (Math.abs(deltaY) > Math.abs(deltaX) && Math.abs(deltaY) > 10) {
              isDragging = true;
              // Only allow downward swipes
              if (deltaY > 0) {
                // Apply visual feedback - move the window down
                if (infoWindowParent) {
                  infoWindowParent.style.transform = `translateY(${Math.min(deltaY, 200)}px)`;
                  infoWindowParent.style.opacity = `${Math.max(0.3, 1 - deltaY / 300)}`;
                }
                e.preventDefault();
              }
            }
          };
          
          const handleTouchEnd = (e: TouchEvent) => {
            if (!touchStartY) return;
            
            const touchEndY = e.changedTouches[0].clientY;
            const deltaY = touchEndY - touchStartY;
            
            // If swiped down more than 80px, close the window
            if (isDragging && deltaY > 80) {
              if (this.currentInfoWindow) {
                this.currentInfoWindow.close();
              }
            } else {
              // Reset position if swipe wasn't far enough
              if (infoWindowParent) {
                infoWindowParent.style.transform = '';
                infoWindowParent.style.opacity = '';
              }
            }
            
            touchStartY = 0;
            touchStartX = 0;
            isDragging = false;
          };
          
          // Add listeners to header and swipe indicator for drag
          const headerElement = infoWindowElement.querySelector('.info-window-header') as HTMLElement;
          const swipeIndicator = infoWindowElement.querySelector('.swipe-indicator') as HTMLElement;
          
          if (headerElement) {
            headerElement.addEventListener('touchstart', handleTouchStart, { passive: false });
            headerElement.addEventListener('touchmove', handleTouchMove, { passive: false });
            headerElement.addEventListener('touchend', handleTouchEnd, { passive: true });
          }
          
          if (swipeIndicator) {
            swipeIndicator.addEventListener('touchstart', handleTouchStart, { passive: false });
            swipeIndicator.addEventListener('touchmove', handleTouchMove, { passive: false });
            swipeIndicator.addEventListener('touchend', handleTouchEnd, { passive: true });
          }
        }
      }, 100);
    }
  }
  
  /**
   * Lighten a color by a percentage
   */
  private lightenColor(color: string, percent: number): string {
    const num = parseInt(color.replace("#", ""), 16);
    const amt = Math.round(2.55 * percent);
    const R = (num >> 16) + amt;
    const G = (num >> 8 & 0x00FF) + amt;
    const B = (num & 0x0000FF) + amt;
    return "#" + (0x1000000 + (R < 255 ? R < 1 ? 0 : R : 255) * 0x10000 +
      (G < 255 ? G < 1 ? 0 : G : 255) * 0x100 +
      (B < 255 ? B < 1 ? 0 : B : 255)).toString(16).slice(1);
  }
  
  /**
   * Get category icon for info window
   */
  private getCategoryIcon(category: string): string {
    switch (category) {
      case 'Estacionamiento':
        return '<span style="font-size: 20px; filter: brightness(0) invert(1);">🅿️</span>';
      case 'CEDI':
        return '<span style="font-size: 20px; filter: brightness(0) invert(1);">📦</span>';
      case 'Cliente':
        return '<span style="font-size: 20px; filter: brightness(0) invert(1);">🏢</span>';
      default:
        return '<span style="font-size: 20px; filter: brightness(0) invert(1);">📍</span>';
    }
  }
  
  /**
   * Count markers by category for filter display (always shows total dataset counts)
   */
  private countMarkersByCategory(): void {
    this.categoryCounts.clear();
    
    for (const feature of this.allFeatures) {
      const category = feature.properties?.Category || feature.properties?.category || 'Estacionamiento';
      const count = this.categoryCounts.get(category) || 0;
      this.categoryCounts.set(category, count + 1);
    }
    
    console.log('Total category counts (always visible):', Object.fromEntries(this.categoryCounts));
  }

  /**
   * Get count of markers for a specific category
   */
  public getCategoryCount(category: string): number {
    return this.categoryCounts.get(category) || 0;
  }

  /**
   * Toggle visibility of a specific category
   * Behavior:
   * - If all categories are active: First click shows only that category
   * - If some categories are active: Click toggles individual categories on/off
   * - If only one category active and it's clicked: Show all categories
   */
  public toggleCategory(category: string): void {
    const allCategories = ['Estacionamiento', 'CEDI', 'Cliente'];
    const allActive = this.visibleCategories.size === 3;
    
    if (allActive) {
      // Starting state: all active → show only clicked category
      this.visibleCategories.clear();
      this.visibleCategories.add(category);
      console.log(`First filter: showing only ${category}`);
    } else {
      // Filtered state: toggle individual categories
      if (this.visibleCategories.has(category)) {
        // If category is active, deactivate it
        this.visibleCategories.delete(category);
        console.log(`Deactivated: ${category}`);
        
        // If no categories left, show all
        if (this.visibleCategories.size === 0) {
          allCategories.forEach(cat => this.visibleCategories.add(cat));
          console.log('No categories active - showing all');
        }
      } else {
        // If category is inactive, activate it
        this.visibleCategories.add(category);
        console.log(`Activated: ${category}`);
      }
    }
    
    console.log('Active categories:', Array.from(this.visibleCategories));
    
    // Update marker visibility
    this.updateMarkerVisibility();
    
    // Adjust viewport to show visible markers
    this.adjustViewportToVisibleMarkers();
  }

  /**
   * Update marker visibility based on selected categories
   */
  private updateMarkerVisibility(): void {
    // Hide all markers first
    this.markersByCategory.forEach((markers, category) => {
      const isVisible = this.visibleCategories.has(category);
      
      markers.forEach(marker => {
        marker.setVisible(isVisible);
      });
    });
    
    // Update clusterer with visible markers only
    this.updateMarkerClustering();
    
    console.log('Visible categories:', Array.from(this.visibleCategories));
  }

  /**
   * Update marker clustering with only visible markers
   */
  private updateMarkerClustering(): void {
    if (this.markerClusterer) {
      this.markerClusterer.clearMarkers();
      
      // Get all visible markers
      const visibleMarkers: any[] = [];
      this.visibleCategories.forEach(category => {
        const markers = this.markersByCategory.get(category) || [];
        visibleMarkers.push(...markers);
      });
      
      // Add visible markers to clusterer
      this.markerClusterer.addMarkers(visibleMarkers);
      
      console.log(`Updated clustering with ${visibleMarkers.length} visible markers`);
    }
  }

  /**
   * Adjust map viewport to show all visible markers
   */
  private adjustViewportToVisibleMarkers(): void {
    if (this.visibleCategories.size === 0) {
      return; // No visible categories, don't adjust
    }
    
    const bounds = new google.maps.LatLngBounds();
    let hasMarkers = false;
    
    // Add all visible markers to bounds
    this.visibleCategories.forEach(category => {
      const markers = this.markersByCategory.get(category) || [];
      markers.forEach(marker => {
        bounds.extend(marker.getPosition());
        hasMarkers = true;
      });
    });
    
    if (hasMarkers) {
      // Fit map to show all visible markers
      this.map.fitBounds(bounds);
      
      // Add some padding and ensure reasonable zoom levels
      setTimeout(() => {
        const currentZoom = this.map.getZoom();
        if (currentZoom > 16) {
          this.map.setZoom(16); // Max zoom for better overview
        } else if (currentZoom < 10) {
          this.map.setZoom(10); // Min zoom for detail
        }
      }, 100);
      
      console.log(`Adjusted viewport for visible categories:`, Array.from(this.visibleCategories));
    }
  }
  
  /**
   * Handle search input - search through dataset features
   */
  public onSearchInput(event: any): void {
    const searchTerm = event.target.value.trim();
    this.searchQuery = searchTerm;
    
    // Clear previous timeout
    if (this.searchTimeout) {
      clearTimeout(this.searchTimeout);
    }
    
    // Reset selection index
    this.selectedSearchIndex = -1;
    
    if (!searchTerm) {
      this.searchResults = [];
      this.showSearchDropdown = false;
      this.hideButtonsWhileSearching = false;
      return;
    }
    
    // Show dropdown immediately when user starts typing
    this.showSearchDropdown = true;
    this.hideButtonsWhileSearching = true;
    
    // Minimal debounce time for instant response
    this.searchTimeout = setTimeout(() => {
      this.performDatasetSearch(searchTerm);
    }, 50); // Very fast response - 50ms
  }
  
  /**
   * Perform search through dataset features
   */
  private performDatasetSearch(searchTerm: string): void {
    if (!this.allFeatures || this.allFeatures.length === 0) {
      console.log('No features available for search');
      this.searchResults = [];
      return;
    }
    
    const lowerSearchTerm = searchTerm.toLowerCase();
    const results: any[] = [];
    let totalFeatures = 0;
    let visibleFeatures = 0;
    
    console.log(`Searching for: "${searchTerm}" in ${this.allFeatures.length} features`);
    console.log(`Visible categories:`, Array.from(this.visibleCategories));
    
    for (const feature of this.allFeatures) {
      totalFeatures++;
      const props = feature.properties || {};
      
      // Get category first to check if it's visible
      const featureCategory = props.Category || props.category || 'Estacionamiento';
      
      // Only search in visible categories
      if (!this.visibleCategories.has(featureCategory)) {
        continue;
      }
      
      visibleFeatures++;
      
      // Search in multiple fields with more flexible matching
      const name = (props.Name || props.name || '').toLowerCase();
      const category = featureCategory.toLowerCase();
      const description = (props.Description || '').toLowerCase();
      const responsible = (props['Person Responsable'] || '').toLowerCase();
      const phone = (props['Phone Number'] || props.phone || '').toLowerCase();
      
      // More flexible search - starts with, contains, or partial word match
      const searchFields = [name, category, description, responsible, phone];
      let matchFound = false;
      
      for (const field of searchFields) {
        if (field && (
          field.startsWith(lowerSearchTerm) ||           // Starts with
          field.includes(lowerSearchTerm) ||             // Contains
          field.split(' ').some((word: string) => word.startsWith(lowerSearchTerm)) // Word starts with
        )) {
          matchFound = true;
          break;
        }
      }
      
      if (matchFound) {
        results.push(feature);
      }
    }
    
    // Limit results to prevent UI clutter
    this.searchResults = results.slice(0, 8);
    
    console.log(`Search results: ${this.searchResults.length}/${results.length} (from ${visibleFeatures} visible features out of ${totalFeatures} total)`);
    
    // Log first few results for debugging
    if (this.searchResults.length > 0) {
      console.log('First result:', this.searchResults[0].properties?.Name || this.searchResults[0].properties?.name || 'No name');
    }
  }
  
  /**
   * Handle keyboard navigation in search results
   */
  public onSearchKeydown(event: KeyboardEvent): void {
    switch (event.key) {
      case 'ArrowDown':
        if (this.searchResults.length > 0) {
          event.preventDefault();
          this.selectedSearchIndex = Math.min(this.selectedSearchIndex + 1, this.searchResults.length - 1);
        }
        break;
        
      case 'ArrowUp':
        if (this.searchResults.length > 0) {
          event.preventDefault();
          this.selectedSearchIndex = Math.max(this.selectedSearchIndex - 1, -1);
        }
        break;
        
      case 'Enter':
        event.preventDefault();
        if (this.selectedSearchIndex >= 0 && this.selectedSearchIndex < this.searchResults.length) {
          this.selectSearchResult(this.searchResults[this.selectedSearchIndex]);
        }
        // Don't refresh search on Enter - just prevent default behavior
        break;
        
      case 'Escape':
        event.preventDefault();
        this.searchResults = [];
        this.selectedSearchIndex = -1;
        this.showSearchDropdown = false;
        this.hideButtonsWhileSearching = false;
        this.searchQuery = '';
        (event.target as HTMLInputElement).blur();
        break;
    }
  }
  
  /**
   * Select a search result - center map and show info
   */
  public selectSearchResult(feature: any): void {
    if (!feature || !feature.geometry) return;
    
    const [lng, lat] = feature.geometry.coordinates;
    const position = { lat, lng };
    const properties = feature.properties || {};
    
    // Center map on selected feature
    this.map.setCenter(position);
    this.map.setZoom(16);
    
    // Show info window for the selected feature
    this.showMarkerInfoWindow(properties, position);
    
    // Clear search results and input
    this.searchResults = [];
    this.selectedSearchIndex = -1;
    this.showSearchDropdown = false;
    this.hideButtonsWhileSearching = false;
    this.searchQuery = '';
    this.searchInput.nativeElement.value = '';
    
    console.log('Selected search result:', properties.Name || properties.name || 'Unnamed');
  }
}
