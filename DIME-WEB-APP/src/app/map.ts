import { Component, AfterViewInit, ElementRef, ViewChild } from '@angular/core';
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
  
  ngAfterViewInit(): void {
    // Load Google Maps script and initialize map
    this.loadGoogleMapsScript()
      .then(() => {
        this.initializeMap();
      })
      .catch((error) => {
        console.log('Failed to load Google Maps:', error);
        // This is expected in SSR environment, map will load on client side
      });
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

      // Create script element with Places library
      const script = document.createElement('script');
      script.src = `https://maps.googleapis.com/maps/api/js?key=${environment.googleMapsApiKey}&libraries=places`;
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

  private initializeMap(): void {
    console.log('Initializing Google Map');
    
    const mapOptions = {
      center: { lat: 25.6866, lng: -100.3161 }, // Monterrey, Mexico
      zoom: 12,
      mapTypeId: 'roadmap',
      // Enable all Google Maps built-in controls
      zoomControl: true,
      mapTypeControl: true,
      scaleControl: true,
      streetViewControl: true,
      rotateControl: true,
      fullscreenControl: true,
      // Enable built-in search functionality
      clickableIcons: true,
      gestureHandling: 'auto'
    };

    // Initialize the map
    this.map = new google.maps.Map(this.mapElement.nativeElement, mapOptions);
    
    // Add Arca Continental marker
    this.addArcaContinentalMarker();
    
    // Initialize search functionality
    this.initializeSearch();
    
    console.log('Map initialized with search functionality');
  }

  private addArcaContinentalMarker(): void {
    // Arca Continental coordinates (approximate)
    const arcaLocation = { lat: 25.6615, lng: -100.2950 };
    
    const marker = new google.maps.Marker({
      position: arcaLocation,
      map: this.map,
      title: 'Arca Continental S.A.B. de C.V.',
      icon: {
        url: 'https://maps.google.com/mapfiles/ms/icons/red-dot.png'
      }
    });

    // Add info window with company details
    const infoWindow = new google.maps.InfoWindow({
      content: `
        <div style="padding: 10px; max-width: 250px;">
          <h3 style="margin: 0 0 5px 0; color: #333;">Arca Continental S.A.B. de C.V.</h3>
          <p style="margin: 0; color: #666; font-size: 14px;">
            Avenida San Jerónimo<br>
            San Jeronimo, Monterrey<br>
            Nuevo León, Mexico
          </p>
        </div>
      `
    });

    // Open info window when marker is clicked
    marker.addListener('click', () => {
      infoWindow.open(this.map, marker);
    });
    
    console.log('Arca Continental marker added');
  }

  private initializeSearch(): void {
    // Create autocomplete for search input
    this.autocomplete = new google.maps.places.Autocomplete(this.searchInput.nativeElement);
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
      
      // Add marker for searched place
      new google.maps.Marker({
        position: place.geometry.location,
        map: this.map,
        title: place.name || 'Selected Place'
      });
      
      console.log('Place found:', place.name);
    });
  }
}
