import { Component, ElementRef, ViewChild, AfterViewInit, Inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { environment } from '../environments/environment';
import { DatasetService } from './services/dataset.service';
import { MarkerClusterer } from '@googlemaps/markerclusterer';

// Declare google as any to avoid TypeScript errors
declare var google: any;

@Component({
  selector: 'app-map',
  standalone: true,
  imports: [],
  template: `
    <div class="map-container">
      <div class="search-box">
        <input 
          #searchInput 
          type="text" 
          placeholder="Search places..." 
          class="search-input"
        />
      </div>
      
      <!-- Category Filter Boxes -->
      <div class="category-filters">
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
  `,
  styleUrl: './map.css'
})
export class MapComponent implements AfterViewInit {
  @ViewChild('mapElement', { static: true }) mapElement!: ElementRef;
  @ViewChild('searchInput', { static: true }) searchInput!: ElementRef;
  
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
  
  constructor(
    @Inject(PLATFORM_ID) private platformId: Object,
    private datasetService: DatasetService
  ) {}
  
  ngAfterViewInit(): void {
    // Only initialize map in browser environment
    if (isPlatformBrowser(this.platformId)) {
      this.loadGoogleMapsScript()
        .then(() => {
          this.initializeMap();
        })
        .catch((error) => {
          console.log('Failed to load Google Maps:', error);
        });
    }
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
      
      // Initialize the map with performance optimizations
      this.map = new Map(this.mapElement.nativeElement, {
        center: { lat: 25.6866, lng: -100.3161 }, // Monterrey, Mexico
        zoom: 10, // Good zoom level for viewing markers
        zoomControl: true,
        mapTypeControl: false,
        scaleControl: false,
        streetViewControl: false,
        rotateControl: false,
        fullscreenControl: true,
        gestureHandling: 'greedy',
        disableDefaultUI: false,
        restriction: {
          // Restrict to Mexico area to reduce map data
          latLngBounds: {
            north: 32.0,
            south: 14.5,
            west: -118.0,
            east: -86.7
          }
        }
      });
      
      console.log('Map initialized successfully');
      
    } catch (error) {
      console.error('Error importing Google Maps libraries:', error);
      return;
    }
    
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
    // Create autocomplete for search input
    this.autocomplete = new this.Autocomplete(this.searchInput.nativeElement);
    this.autocomplete.bindTo('bounds', this.map);

    // Listen for place selection
    this.autocomplete.addListener('place_changed', () => {
      const place = this.autocomplete.getPlace();
      
      if (!place.geometry || !place.geometry.location) {
        console.log('No location found for:', place.name);
        return;
      }

      // Center map on selected place
      this.map.setCenter(place.geometry.location);
      this.map.setZoom(15);
      
      console.log('Place found:', place.name);
    });
    
    console.log('Search functionality initialized with Places API');
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
      
    } catch (error) {
      console.error('Error loading markers from backend:', error);
      
      const errorInfoWindow = new google.maps.InfoWindow({
        content: `
          <div style="padding: 15px; color: #dc3545; background: #f8d7da; border-radius: 8px; border: 1px solid #f5c6cb;">
            <h3 style="margin-top: 0; color: #721c24;">❌ Backend Connection Failed</h3>
            <p style="margin-bottom: 8px;">Could not load markers from backend server.</p>
            <p style="margin-bottom: 8px;"><strong>Please ensure your backend server is running:</strong></p>
            <code style="background: #f5f5f5; padding: 4px 8px; border-radius: 4px; color: #333;">http://localhost:3000</code>
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
            size: new google.maps.Size(35, 43),          // Custom markers: 35x43 (custom pin shape)
            anchor: new google.maps.Point(17.5, 43)      // Bottom center of custom pin
          }
        : {
            size: new google.maps.Size(35, 35),          // Unknown: 35x35 (standard pin)
            anchor: new google.maps.Point(17.5, 32)      // Bottom center of standard pin
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
      
      // Add click listener for info window
      marker.addListener('click', () => {
        this.showMarkerInfoWindow(properties, { lat, lng });
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
   * Get cached SVG for marker based on category and color (35px)
   */
  private getCachedPinSVG(color: string, category?: string): string {
    const cacheKey = `${color}-${category || 'default'}`;
    
    if (!this.svgCache.has(cacheKey)) {
      let svg = '';
      
      // Custom parking marker with "P" design (pin shape)
      if (category === 'Estacionamiento') {
        svg = `
          <svg width="35" height="43" viewBox="0 0 35 43" xmlns="http://www.w3.org/2000/svg">
            <path fill-rule="evenodd" clip-rule="evenodd" d="M35 17.5C35 27.1652 20.125 42.875 17.5 42.875C14.875 42.875 0 27.1652 0 17.5C0 7.83477 7.83477 0 17.5 0C27.1652 0 35 7.83477 35 17.5ZM11.9 26.25H23.45V23.22H15.18V18.75H22.07V15.79H15.18V11.78H23.35V8.75H11.9V26.25Z" fill="${color}"/>
            <path d="M11.9 26.25H23.45V23.22H15.18V18.75H22.07V15.79H15.18V11.78H23.35V8.75H11.9V26.25Z" fill="white"/>
          </svg>
        `;
      } else if (category === 'CEDI') {
        // Custom CEDI marker with warehouse/distribution icon
        svg = `
          <svg width="35" height="43" viewBox="0 0 35 43" xmlns="http://www.w3.org/2000/svg">
            <path d="M35 17.5C35 27.1652 20.125 42.875 17.5 42.875C14.875 42.875 0 27.1652 0 17.5C0 7.83477 7.83477 0 17.5 0C27.1652 0 35 7.83477 35 17.5Z" fill="${color}"/>
            <path d="M14.1711 8.75L7.35668 12.0828L9.81032 14.4869L16.6247 11.1541L14.1711 8.75ZM20.3938 8.75L17.9402 11.1541L24.7546 14.4869L27.208 12.0828L20.3938 8.75ZM17.28 11.6883L16.8507 11.8875V17.8953L17.28 18.0943L17.7096 17.8953V11.8875L17.28 11.6883ZM9.83573 15.4047L7.2915 18.6402L13.4624 21.9732L16.6247 18.8115L9.83573 15.4047ZM24.7397 15.4047L17.9402 18.8115L21.1027 21.9732L27.2736 18.6402L24.7397 15.4047ZM16.8507 19.6953L13.5893 22.9568L10.1118 21.086V22.9751L16.8507 26.25V19.6953ZM17.7096 19.6953V26.25L24.4485 22.9751V21.086L20.971 22.9568L17.7096 19.6953Z" fill="white"/>
          </svg>
        `;
      } else if (category === 'Cliente') {
        // Custom Cliente marker with building/office icon
        svg = `
          <svg width="35" height="43" viewBox="0 0 35 43" xmlns="http://www.w3.org/2000/svg">
            <path d="M35 17.5C35 27.1652 20.125 42.875 17.5 42.875C14.875 42.875 0 27.1652 0 17.5C0 7.83477 7.83477 0 17.5 0C27.1652 0 35 7.83477 35 17.5Z" fill="${color}"/>
            <path fill-rule="evenodd" clip-rule="evenodd" d="M25.0948 8.75H10.6678L8.75 13.9513V15.5101C8.75 16.3188 9.0354 17.0444 9.486 17.5844V26.25H26.2583V17.5844C26.7089 17.0444 26.9943 16.3188 26.9943 15.5101V13.9513L25.0948 8.75ZM24.7333 18.4975C24.5527 18.5349 24.3644 18.5549 24.1708 18.5549C23.3296 18.5549 22.5672 18.1741 22.0417 17.5844C21.5162 18.1741 20.7538 18.5549 19.9125 18.5549C19.0713 18.5549 18.3089 18.1741 17.7833 17.5844C17.2578 18.1741 16.4954 18.5549 15.6542 18.5549C14.8129 18.5549 14.0505 18.1741 13.525 17.5844C12.9995 18.1741 12.2371 18.5549 11.3958 18.5549C11.202 18.5549 11.0138 18.5349 10.8333 18.4975V24.1598H14.8333V20.1141H20.1667V24.1598H24.7333V18.4975ZM19.4167 21.6685V24.1598H16.0833V21.6685H19.4167ZM25.4583 15.5101V14.7598L25.1273 13.3163L24.0206 10.2899H11.7044L10.5977 13.3163L10.2667 14.7598V15.5101C10.2667 16.3746 10.8798 17.0728 11.3958 17.0728C11.9118 17.0728 12.525 16.3746 12.525 15.5101V14.7598H14.0708V15.5101C14.0708 16.3746 14.684 17.0728 15.2 17.0728C15.716 17.0728 16.3292 16.3746 16.3292 15.5101V14.7598H17.875V15.5101C17.875 16.3746 18.4882 17.0728 19.0042 17.0728C19.5202 17.0728 20.1333 16.3746 20.1333 15.5101V14.7598H21.6792V15.5101C21.6792 16.3746 22.2923 17.0728 22.8083 17.0728C23.3243 17.0728 23.9375 16.3746 23.9375 15.5101Z" fill="white"/>
          </svg>
        `;
      } else {
        // Pin/droplet style for other categories (Unknown)
        svg = `
          <svg width="35" height="35" xmlns="http://www.w3.org/2000/svg">
            <path d="M17.5 3.5 C24.5 3.5, 30 9, 30 16 C30 23, 17.5 31.5, 17.5 31.5 S5 23, 5 16 C5 9, 10.5 3.5, 17.5 3.5 Z" 
                  fill="${color}" 
                  stroke="white" 
                  stroke-width="2"/>
            <circle cx="17.5" cy="16" r="5.5" 
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
    switch (category) {
      case 'Estacionamiento':
        return '#007FFF'; // Parking: Azure blue
      case 'Cliente':
        return '#ED1B24'; // Client: Red
      case 'CEDI':
        return '#FF8C00'; // CEDI: Dark orange
      default:
        return '#808080'; // Unknown: Gray
    }
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

      // Create new marker clusterer
      this.markerClusterer = new MarkerClusterer({
        map: this.map,
        markers: this.markers
      });

      console.log(`Marker clustering setup complete with ${this.markers.length} markers`);
    }
  }

  /**
   * Show info window for marker click
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
    
    // Create simple info window content
    const content = `
      <div style="max-width: 250px; font-family: Arial, sans-serif; line-height: 1.4;">
        <div style="background: ${color}; color: white; padding: 8px; margin: -8px -8px 8px -8px; border-radius: 4px;">
          <strong>${properties.Name || properties.name || 'Sin nombre'}</strong>
          <div style="font-size: 12px; opacity: 0.9;">${category}</div>
        </div>
        
        ${properties.Description ? `<p style="margin: 8px 0; font-size: 13px;">${properties.Description}</p>` : ''}
        
        ${(properties['Phone Number'] || properties.phone) ? `
          <div style="margin: 6px 0;">
            <strong>Teléfono:</strong> 
            <a href="tel:${properties['Phone Number'] || properties.phone}" style="color: ${color};">
              ${properties['Phone Number'] || properties.phone}
            </a>
          </div>
        ` : ''}
        
        ${properties['Person Responsable'] ? `
          <div style="margin: 6px 0;"><strong>Responsable:</strong> ${properties['Person Responsable']}</div>
        ` : ''}
        
        ${properties.Hours ? `
          <div style="margin: 6px 0;"><strong>Horarios:</strong> ${properties.Hours}</div>
        ` : ''}
        
        <div style="margin: 8px 0 0 0; padding: 6px; background: #f5f5f5; border-radius: 3px; font-size: 12px; color: #666;">
          📍 ${address}
        </div>
      </div>
    `;
    
    // Create and open the info window
    const infoWindow = new google.maps.InfoWindow({
      content: content,
      position: coordinates,
      maxWidth: 280
    });
    
    // Close any existing info window
    if (this.currentInfoWindow) {
      this.currentInfoWindow.close();
    }
    this.currentInfoWindow = infoWindow;
    
    // Clear reference when closed
    infoWindow.addListener('closeclick', () => {
      this.currentInfoWindow = null;
    });
    
    infoWindow.open(this.map);
  }
  
  /**
   * Count markers by category for filter display
   */
  private countMarkersByCategory(): void {
    this.categoryCounts.clear();
    
    for (const feature of this.allFeatures) {
      const category = feature.properties?.Category || feature.properties?.category || 'Estacionamiento';
      const count = this.categoryCounts.get(category) || 0;
      this.categoryCounts.set(category, count + 1);
    }
    
    console.log('Category counts:', Object.fromEntries(this.categoryCounts));
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
}
