import { Component, AfterViewInit, ElementRef, ViewChild, Inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { environment } from '../environments/environment';

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
  private advancedMarkers: any[] = [];
  private AdvancedMarkerElement: any;
  private Geocoder: any;
  private Autocomplete: any;
  private datasetLayer: any;
  private datasetLayerSetup: boolean = false;
  
  constructor(@Inject(PLATFORM_ID) private platformId: Object) {}
  
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

      // Create script element - we'll import libraries dynamically
      // Using v=beta for latest features
      const script = document.createElement('script');
      script.src = `https://maps.googleapis.com/maps/api/js?key=${environment.googleMapsApiKey}&v=beta`;
      script.async = true;
      script.defer = true;

      script.onload = () => {
        console.log('Google Maps API loaded successfully');
        console.log('Checking API availability:');
        console.log('google.maps available:', !!google.maps);
        console.log('google.maps.marker available:', !!google.maps.marker);
        console.log('google.maps.marker.AdvancedMarkerElement available:', !!google.maps.marker?.AdvancedMarkerElement);
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
    console.log('Initializing Google Map with modern library imports...');
    
    try {
      // Import required libraries
      console.log('Importing Google Maps libraries...');
      const { Map } = await google.maps.importLibrary('maps') as any;
      const { AdvancedMarkerElement } = await google.maps.importLibrary('marker') as any;
      const { Geocoder } = await google.maps.importLibrary('geocoding') as any;
      const { Autocomplete } = await google.maps.importLibrary('places') as any;
      
      console.log('Libraries imported successfully');
      console.log('AdvancedMarkerElement available:', !!AdvancedMarkerElement);
      
      // Store library references for later use
      this.AdvancedMarkerElement = AdvancedMarkerElement;
      this.Geocoder = Geocoder;
      this.Autocomplete = Autocomplete;
      
      // Initialize the map with custom Map ID
      this.map = new Map(this.mapElement.nativeElement, {
        center: { lat: 25.6866, lng: -100.3161 }, // Monterrey, Mexico
        zoom: 10, // Slightly zoomed out to see more area
        mapId: environment.googleMapId, // Your custom Map ID with dataset
        zoomControl: true,
        mapTypeControl: false,
        scaleControl: false,
        streetViewControl: false,
        rotateControl: false,
        fullscreenControl: true
      });
      
      console.log('Map initialized successfully');
      
    } catch (error) {
      console.error('Error importing Google Maps libraries:', error);
      return;
    }
    
    // Wait for map to be fully loaded
    this.map.addListener('tilesloaded', () => {
      console.log('Map tiles loaded - now loading dataset feature layer');
      console.log('Map ID being used:', this.map.getMapId());
      console.log('Current zoom level:', this.map.getZoom());
      console.log('Current center:', this.map.getCenter()?.toString());
      
      // Load the dataset feature layer
      this.loadDatasetFeatureLayer();
    });
    
    // Add zoom change listener to help debug visibility
    this.map.addListener('zoom_changed', () => {
      console.log('Zoom changed to:', this.map.getZoom());
    });
    
    // Add general map click listener for debugging
    this.map.addListener('click', (event: any) => {
      console.log('=== GENERAL MAP CLICK ===');
      console.log('Map clicked at:', event.latLng.toString());
      console.log('Click event:', event);
      console.log('=== END GENERAL MAP CLICK ===');
    });
    
    // Initialize search functionality
    this.initializeSearch();
    
    console.log('Map initialized with Map ID for data-driven styling');
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
  
  private loadDatasetFeatureLayer(): void {
    // Prevent multiple setups
    if (this.datasetLayerSetup) {
      console.log('Dataset layer already setup, skipping...');
      return;
    }
    
    try {
      console.log('Loading dataset feature layer...');
      
      // Your dataset ID from environment
      const datasetId = environment.googleDatasetId;
      
      // Get the dataset feature layer
      console.log('Attempting to get dataset feature layer for ID:', datasetId);
      const datasetLayer = this.map.getDatasetFeatureLayer(datasetId);
      console.log('Dataset layer result:', datasetLayer);
      console.log('Dataset layer type:', typeof datasetLayer);
      
      if (datasetLayer) {
        console.log('Dataset feature layer found, applying style...');
        
        // Instead of styling, we'll create AdvancedMarkerElements for each feature
        console.log('Setting up AdvancedMarkerElement approach with custom SVG markers...');
        
        // Apply category-based styling to dataset features
        datasetLayer.style = (params: any) => {
          const feature = params.feature;
          if (!feature) {
            return {
              strokeColor: '#810FCB',
              strokeOpacity: 1.0,
              strokeWeight: 2,
              fillColor: '#810FCB',
              fillOpacity: 0.7,
            };
          }
          
          // Get category from feature
          let category = 'Estacionamiento';
          try {
            if (feature.getProperty) {
              category = feature.getProperty('Category') || 'Estacionamiento';
            }
          } catch (e) {
            // Use default
          }
          
          try {
            if (feature.datasetAttributes && feature.datasetAttributes.Category) {
              category = feature.datasetAttributes.Category;
            }
          } catch (e) {
            // Use default
          }
          
          // Get category colors
          const categoryInfo = this.getCategoryInfo(category);
          
          return {
            strokeColor: categoryInfo.primaryColor,
            strokeOpacity: 1.0,
            strokeWeight: 2,
            fillColor: categoryInfo.primaryColor,
            fillOpacity: 0.7,
          };
        };
        
        // All markers now use simple colored styling
        
        // Keep the click listener for info windows only
        datasetLayer.addListener('click', (event: any) => {
          console.log('Dataset feature clicked - showing info window');
          this.handleDatasetFeatureClick(event);
        });
        
        console.log('Dataset feature layer setup complete');
        console.log('Dataset ID:', datasetId);
        console.log(`Style ID: ${environment.googleStyleId}`);
        
        // Mark as setup to prevent duplicates
        this.datasetLayerSetup = true;
      } else {
        console.error('Dataset feature layer not found for ID:', datasetId);
        console.error('Please verify that:');
        console.error('1. Dataset is properly imported in Google Cloud Console');
        console.error(`2. Dataset is associated with Map ID: ${environment.googleMapId}`);
        console.error('3. Dataset has the correct permissions');
      }
    } catch (error) {
      console.error('Error loading dataset feature layer:', error);
      console.error('This might be because:');
      console.error('- Dataset is not properly configured');
      console.error('- Map ID does not have access to the dataset');
      console.error('- API version does not support dataset feature layers');
    }
  }
  private async handleDatasetFeatureClick(event: any): Promise<void> {
    console.log('=== DATASET FEATURE CLICK DEBUG ===');
    console.log('Full event object:', event);
    console.log('Event type:', typeof event);
    console.log('Event keys:', Object.keys(event));
    console.log('Has features?', event.features ? 'YES' : 'NO');
    console.log('Features array:', event.features);
    console.log('Features length:', event.features?.length);
    
    if (event.features && event.features.length > 0) {
      console.log('First feature:', event.features[0]);
      console.log('First feature keys:', Object.keys(event.features[0] || {}));
      console.log('Feature properties:', event.features[0]?.properties);
      console.log('Feature geometry:', event.features[0]?.geometry);
    }
    
    console.log('Event latLng:', event.latLng);
    console.log('Event position:', event.latLng?.toString());
    console.log('=== END CLICK DEBUG ===');
    
    // Extract feature properties from the GeoJSON
    let feature = null;
    let properties = null;
    
    // Try to find a feature with properties
    if (event.features && event.features.length > 0) {
      for (let i = 0; i < event.features.length; i++) {
        const currentFeature = event.features[i];
        console.log(`=== FEATURE ${i} ANALYSIS ===`);
        console.log('Full feature object:', currentFeature);
        console.log('Feature type:', typeof currentFeature);
        console.log('Feature keys:', Object.keys(currentFeature || {}));
        console.log('Feature properties:', currentFeature?.properties);
        
        // Try different ways to access properties
        console.log('Direct properties:', currentFeature?.properties);
        console.log('getProperty method available?', typeof currentFeature?.getProperty === 'function');
        console.log('datasetAttributes available?', currentFeature?.datasetAttributes ? 'YES' : 'NO');
        console.log('datasetAttributes content:', currentFeature?.datasetAttributes);
        
        // Check for Google Maps Dataset attributes (most likely scenario)
        if (currentFeature?.datasetAttributes && Object.keys(currentFeature.datasetAttributes).length > 0) {
          console.log('Using datasetAttributes for properties:');
          console.log('Dataset attributes:', currentFeature.datasetAttributes);
          
          feature = currentFeature;
          properties = currentFeature.datasetAttributes;
          console.log(`Using feature ${i} with dataset attributes:`, properties);
          break;
        }
        // Try getProperty method (alternative approach)
        else if (typeof currentFeature?.getProperty === 'function') {
          console.log('Using getProperty method to access data:');
          
          const possibleProps = ['Category', 'Name', 'Description', 'Hours', 'Phone Number', 'Person Responsable', 'category', 'name', 'description'];
          const extractedProps: any = {};
          
          possibleProps.forEach(prop => {
            try {
              const value = currentFeature.getProperty(prop);
              if (value !== null && value !== undefined) {
                extractedProps[prop] = value;
                console.log(`Found property '${prop}':`, value);
              }
            } catch (e) {
              console.log(`Could not get property '${prop}':`, e);
            }
          });
          
          if (Object.keys(extractedProps).length > 0) {
            feature = currentFeature;
            properties = extractedProps;
            console.log(`Using feature ${i} with extracted properties:`, properties);
            break;
          }
        }
        // Standard GeoJSON properties (fallback)
        else if (currentFeature && currentFeature.properties && Object.keys(currentFeature.properties).length > 0) {
          // Standard GeoJSON properties
          feature = currentFeature;
          properties = currentFeature.properties;
          console.log(`Using feature ${i} with standard properties:`, properties);
          break;
        }
        
        console.log(`=== END FEATURE ${i} ANALYSIS ===`);
      }
    }
    
    if (!feature || !properties) {
      console.error('No feature with valid properties found in click event');
      console.error('Available features:', event.features);
      
      // Show a fallback info window with available information
      const fallbackInfoWindow = new google.maps.InfoWindow({
        content: `
          <div style="padding: 15px; max-width: 250px; font-family: Arial, sans-serif;">
            <h3 style="margin: 0 0 10px 0; color: #333;">Location Information</h3>
            <p><strong>Position:</strong> ${event.latLng?.toString() || 'Unknown'}</p>
            <p><strong>Features Found:</strong> ${event.features?.length || 0}</p>
            <p style="color: #666; font-size: 14px;">No detailed properties available for this location.</p>
          </div>
        `,
        position: event.latLng
      });
      
      // Close any existing info window
      if (this.currentInfoWindow) {
        this.currentInfoWindow.close();
      }
      this.currentInfoWindow = fallbackInfoWindow;
      fallbackInfoWindow.open(this.map);
      return;
    }
    
    console.log('Feature properties found, proceeding with detailed window...');
    console.log('Properties to display:', properties);
    
    const coordinates = event.latLng;
    
    // Get address from coordinates using reverse geocoding
    const address = await this.getAddressFromCoordinates(coordinates);
    
    // Create detailed info window
    this.createDetailedInfoWindow(properties, address, coordinates);
  }
  
  private async getAddressFromCoordinates(latLng: any): Promise<string> {
    return new Promise((resolve) => {
      console.log('=== REVERSE GEOCODING DEBUG ===');
      console.log('Input latLng:', latLng);
      console.log('LatLng toString:', latLng.toString());
      console.log('Lat:', latLng.lat(), 'Lng:', latLng.lng());
      
      const geocoder = new this.Geocoder();
      
      // Create location object with explicit lat/lng values
      const locationObj = {
        lat: latLng.lat(),
        lng: latLng.lng()
      };
      
      console.log('Geocoding location object:', locationObj);
      
      geocoder.geocode({ location: locationObj }, (results: any, status: any) => {
        console.log('Geocoder status:', status);
        console.log('Geocoder results:', results);
        
        if (status === google.maps.GeocoderStatus.OK && results && results.length > 0) {
          const address = results[0].formatted_address;
          console.log('Reverse geocoding successful:', address);
          console.log('=== END REVERSE GEOCODING DEBUG ===');
          resolve(address);
        } else {
          console.warn('Reverse geocoding failed with status:', status);
          console.warn('Available statuses:', {
            OK: google.maps.GeocoderStatus.OK,
            ERROR: google.maps.GeocoderStatus.ERROR,
            INVALID_REQUEST: google.maps.GeocoderStatus.INVALID_REQUEST,
            OVER_QUERY_LIMIT: google.maps.GeocoderStatus.OVER_QUERY_LIMIT,
            REQUEST_DENIED: google.maps.GeocoderStatus.REQUEST_DENIED,
            UNKNOWN_ERROR: google.maps.GeocoderStatus.UNKNOWN_ERROR,
            ZERO_RESULTS: google.maps.GeocoderStatus.ZERO_RESULTS
          });
          console.log('=== END REVERSE GEOCODING DEBUG ===');
          resolve('Dirección no disponible');
        }
      });
    });
  }
  
  private createDetailedInfoWindow(properties: any, address: string, coordinates: any): void {
    // Get category-specific styling
    const categoryInfo = this.getCategoryInfo(properties.Category);
    
    // Create the detailed info window content
    const content = `
      <div style="
        max-width: 280px;
        padding: 0;
        font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
        line-height: 1.3;
        color: #333;
      ">
        <!-- Header with category and name -->
        <div style="
          background: linear-gradient(135deg, ${categoryInfo.primaryColor}, ${categoryInfo.secondaryColor});
          color: white;
          padding: 10px;
          margin: -10px -10px 10px -10px;
          border-radius: 6px 6px 0 0;
          position: relative;
        ">
          <div style="display: flex; align-items: center; gap: 8px;">
            <span style="
              background: rgba(255,255,255,0.2);
              padding: 4px 8px;
              border-radius: 15px;
              font-size: 11px;
              font-weight: bold;
              text-transform: uppercase;
              letter-spacing: 0.5px;
            ">${categoryInfo.icon} ${properties.Category || 'Sin categoría'}</span>
          </div>
          <h3 style="
            margin: 6px 0 0 0;
            font-size: 16px;
            font-weight: 600;
            text-shadow: 0 1px 2px rgba(0,0,0,0.1);
          ">${properties.Name || properties.name || 'Sin nombre'}</h3>
        </div>
        
        <!-- Content sections -->
        <div style="padding: 0 4px;">
          <!-- Description -->
          ${properties.Description ? `
            <div style="margin-bottom: 8px;">
              <div style="
                display: flex;
                align-items: center;
                gap: 6px;
                margin-bottom: 4px;
                font-weight: 600;
                color: #555;
                font-size: 13px;
              ">
                <span style="color: ${categoryInfo.primaryColor};">📋</span>
                Descripción
              </div>
              <p style="
                margin: 0;
                padding: 6px 8px;
                background: #f8f9fa;
                border-radius: 4px;
                font-size: 13px;
                color: #666;
                border-left: 3px solid ${categoryInfo.primaryColor};
              ">${properties.Description}</p>
            </div>
          ` : ''}
          
          <!-- Contact Information -->
          <div style="margin-bottom: 8px;">
            <div style="
              display: flex;
              align-items: center;
              gap: 6px;
              margin-bottom: 6px;
              font-weight: 600;
              color: #555;
              font-size: 13px;
            ">
              <span style="color: ${categoryInfo.primaryColor};">📞</span>
              Contacto
            </div>
            
            ${(properties['Phone Number'] || properties['phone'] || properties['Phone']) ? `
              <div style="
                margin-bottom: 4px;
                padding: 5px 8px;
                background: #f8f9fa;
                border-radius: 4px;
                display: flex;
                justify-content: space-between;
                align-items: center;
              ">
                <span style="color: #666; font-size: 12px;">Teléfono:</span>
                <a href="tel:${properties['Phone Number'] || properties['phone'] || properties['Phone']}" style="
                  color: ${categoryInfo.primaryColor};
                  text-decoration: none;
                  font-weight: 600;
                  font-size: 12px;
                ">${properties['Phone Number'] || properties['phone'] || properties['Phone']}</a>
              </div>
            ` : ''}
            
            ${properties['Person Responsable'] ? `
              <div style="
                margin-bottom: 4px;
                padding: 5px 8px;
                background: #f8f9fa;
                border-radius: 4px;
                display: flex;
                justify-content: space-between;
                align-items: center;
              ">
                <span style="color: #666; font-size: 12px;">Responsable:</span>
                <span style="font-weight: 600; font-size: 12px; color: #333;">${properties['Person Responsable']}</span>
              </div>
            ` : ''}
          </div>
          
          <!-- Hours -->
          ${properties.Hours ? `
            <div style="margin-bottom: 8px;">
              <div style="
                display: flex;
                align-items: center;
                gap: 6px;
                margin-bottom: 4px;
                font-weight: 600;
                color: #555;
                font-size: 13px;
              ">
                <span style="color: ${categoryInfo.primaryColor};">🕒</span>
                Horarios
              </div>
              <div style="
                padding: 5px 8px;
                background: #f8f9fa;
                border-radius: 4px;
                font-size: 12px;
                color: #666;
                font-weight: 600;
              ">${properties.Hours}</div>
            </div>
          ` : ''}
          
          <!-- Address -->
          <div style="margin-bottom: 5px;">
            <div style="
              display: flex;
              align-items: center;
              gap: 6px;
              margin-bottom: 4px;
              font-weight: 600;
              color: #555;
              font-size: 13px;
            ">
              <span style="color: ${categoryInfo.primaryColor};">📍</span>
              Dirección
            </div>
            <div style="
              padding: 5px 8px;
              background: #f8f9fa;
              border-radius: 4px;
              font-size: 12px;
              color: #666;
              border-left: 3px solid ${categoryInfo.primaryColor};
            ">${address}</div>
          </div>
        </div>
      </div>
    `;
    
    // Create and open the info window
    const infoWindow = new google.maps.InfoWindow({
      content: content,
      position: coordinates,
      maxWidth: 300,
      pixelOffset: new google.maps.Size(0, -30) // Slight offset to position better
    });
    
    // Store reference to close any existing info window
    if (this.currentInfoWindow) {
      this.currentInfoWindow.close();
    }
    this.currentInfoWindow = infoWindow;
    
    // Add close event listener
    infoWindow.addListener('closeclick', () => {
      console.log('Info window closed by user');
      this.currentInfoWindow = null;
    });
    
    infoWindow.open(this.map);
    
    console.log('Detailed info window opened for:', properties.Name || 'Unknown location');
    console.log('Info window content length:', content.length);
  }
  
  private getMarkerIcon(category: string): string {
    const baseUrl = 'assets/markers/';
    switch (category) {
      case 'Estacionamiento':
        return `${baseUrl}estacionamiento_marker.svg`;
      case 'Cliente':
        return `${baseUrl}cliente_marker.svg`;
      case 'CEDI':
        return `${baseUrl}cedi_marker.svg`;
      default:
        return `${baseUrl}estacionamiento_marker.svg`; // Default fallback
    }
  }
  
  
  private getCategoryInfo(category: string): { primaryColor: string, secondaryColor: string, icon: string } {
    switch (category) {
      case 'Estacionamiento':
        return {
          primaryColor: '#2196F3',
          secondaryColor: '#1976D2',
          icon: '🅿️'
        };
      case 'Cliente':
        return {
          primaryColor: '#4CAF50',
          secondaryColor: '#388E3C',
          icon: '🏢'
        };
      case 'CEDI':
        return {
          primaryColor: '#FF9800',
          secondaryColor: '#F57C00',
          icon: '🏭'
        };
      default:
        return {
          primaryColor: '#9C27B0',
          secondaryColor: '#7B1FA2',
          icon: '📍'
        };
    }
  }
  
  private createTestMarker(): void {
    console.log('=== CREATING TEST MARKER ===');
    
    // Test if AdvancedMarkerElement is available
    if (!this.AdvancedMarkerElement) {
      console.error('AdvancedMarkerElement is not available!');
      console.log('Library reference:', this.AdvancedMarkerElement);
      return;
    }
    
    console.log('AdvancedMarkerElement is available - creating test marker');
    
    try {
      // Create test marker image
      const testImg = document.createElement('img');
      testImg.src = 'assets/markers/estacionamiento_marker.svg';
      testImg.style.width = '32px';
      testImg.style.height = '32px';
      testImg.alt = 'Test marker';
      
      console.log('Test image created:', testImg);
      console.log('Test image src:', testImg.src);
      
      // Test image loading
      testImg.onload = () => {
        console.log('Test SVG loaded successfully');
      };
      testImg.onerror = (e) => {
        console.error('Test SVG failed to load:', e);
      };
      
      // Create AdvancedMarkerElement using stored reference
      const testMarker = new this.AdvancedMarkerElement({
        map: this.map,
        position: { lat: 25.6866, lng: -100.3161 }, // Center of Monterrey
        content: testImg,
        title: 'Test SVG Marker'
      });
      
      console.log('Test AdvancedMarkerElement created successfully:', testMarker);
      
    } catch (e) {
      console.error('Error creating test marker:', e);
    }
    
    console.log('=== END TEST MARKER ===');
  }
}
