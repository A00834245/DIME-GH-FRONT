import { Injectable, signal, computed, NgZone, OnDestroy } from '@angular/core';

export interface UserLocation {
  lat: number;
  lng: number;
  accuracy: number;
  timestamp: number;
}

export type LocationPermissionStatus = 'unknown' | 'granted' | 'denied' | 'prompt';

export interface LocationServiceState {
  currentLocation: UserLocation | null;
  permissionStatus: LocationPermissionStatus;
  isTracking: boolean;
  lastError: string | null;
  isAppInForeground: boolean;
  isMapVisible: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class LocationService implements OnDestroy {
  // Internal state signals
  private readonly _currentLocation = signal<UserLocation | null>(null);
  private readonly _permissionStatus = signal<LocationPermissionStatus>('unknown');
  private readonly _isTracking = signal<boolean>(false);
  private readonly _lastError = signal<string | null>(null);
  private readonly _isAppInForeground = signal<boolean>(true);
  private readonly _isMapVisible = signal<boolean>(false);
  
  // Geolocation watch ID
  private watchId: number | null = null;
  
  // Visibility change handler reference for cleanup
  private visibilityChangeHandler: (() => void) | null = null;

  // Public readonly computed signals
  public readonly currentLocation = computed(() => this._currentLocation());
  public readonly permissionStatus = computed(() => this._permissionStatus());
  public readonly isTracking = computed(() => this._isTracking());
  public readonly lastError = computed(() => this._lastError());
  public readonly isAppInForeground = computed(() => this._isAppInForeground());
  public readonly isMapVisible = computed(() => this._isMapVisible());
  
  // Computed: Can check-in based on all conditions
  public readonly canAttemptCheckIn = computed(() => {
    return this._permissionStatus() === 'granted' &&
           this._isAppInForeground() &&
           this._isMapVisible() &&
           this._currentLocation() !== null;
  });

  // Full state for debugging
  public readonly state = computed<LocationServiceState>(() => ({
    currentLocation: this._currentLocation(),
    permissionStatus: this._permissionStatus(),
    isTracking: this._isTracking(),
    lastError: this._lastError(),
    isAppInForeground: this._isAppInForeground(),
    isMapVisible: this._isMapVisible()
  }));

  constructor(private ngZone: NgZone) {
    this.initializeVisibilityTracking();
    this.checkInitialPermission();
  }

  ngOnDestroy(): void {
    this.stopTracking();
    if (this.visibilityChangeHandler) {
      document.removeEventListener('visibilitychange', this.visibilityChangeHandler);
    }
  }

  /**
   * Initialize visibility change tracking for foreground/background detection
   */
  private initializeVisibilityTracking(): void {
    if (typeof document === 'undefined') return;
    
    this.visibilityChangeHandler = () => {
      this.ngZone.run(() => {
        const isVisible = document.visibilityState === 'visible';
        this._isAppInForeground.set(isVisible);
        console.log('[LocationService] App visibility changed:', isVisible ? 'foreground' : 'background');
        
        // Auto-pause tracking when in background to save battery
        if (!isVisible && this.watchId !== null) {
          console.log('[LocationService] Pausing location tracking (app in background)');
        }
      });
    };
    
    document.addEventListener('visibilitychange', this.visibilityChangeHandler);
  }

  /**
   * Check initial permission status
   */
  private async checkInitialPermission(): Promise<void> {
    if (!navigator.permissions) {
      console.log('[LocationService] Permissions API not available');
      return;
    }

    try {
      const result = await navigator.permissions.query({ name: 'geolocation' });
      this._permissionStatus.set(result.state as LocationPermissionStatus);
      
      // Listen for permission changes
      result.onchange = () => {
        this.ngZone.run(() => {
          this._permissionStatus.set(result.state as LocationPermissionStatus);
          console.log('[LocationService] Permission status changed:', result.state);
        });
      };
    } catch (error) {
      console.warn('[LocationService] Could not query permission status:', error);
    }
  }

  /**
   * Set map visibility state (called by map component)
   */
  setMapVisible(visible: boolean): void {
    this._isMapVisible.set(visible);
    console.log('[LocationService] Map visibility set to:', visible);
  }

  /**
   * Request location permission and start tracking
   */
  async requestPermissionAndStartTracking(): Promise<boolean> {
    if (!navigator.geolocation) {
      this._lastError.set('Geolocation not supported');
      this._permissionStatus.set('denied');
      return false;
    }

    try {
      // Request a single position to trigger permission prompt
      const position = await this.getCurrentPositionPromise();
      
      this._permissionStatus.set('granted');
      this.handlePositionUpdate(position);
      
      // Start continuous tracking
      this.startTracking();
      
      return true;
    } catch (error: any) {
      this.handleGeolocationError(error);
      return false;
    }
  }

  /**
   * Get current position as a promise
   */
  private getCurrentPositionPromise(): Promise<GeolocationPosition> {
    return new Promise((resolve, reject) => {
      navigator.geolocation.getCurrentPosition(
        resolve,
        reject,
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 0
        }
      );
    });
  }

  /**
   * Start continuous location tracking
   */
  startTracking(): void {
    if (this.watchId !== null) {
      console.log('[LocationService] Already tracking');
      return;
    }

    if (!navigator.geolocation) {
      this._lastError.set('Geolocation not supported');
      return;
    }

    console.log('[LocationService] Starting location tracking');
    this._isTracking.set(true);
    this._lastError.set(null);

    this.watchId = navigator.geolocation.watchPosition(
      (position) => this.ngZone.run(() => this.handlePositionUpdate(position)),
      (error) => this.ngZone.run(() => this.handleGeolocationError(error)),
      {
        enableHighAccuracy: true,
        timeout: 15000,
        maximumAge: 5000 // Accept cached positions up to 5 seconds old
      }
    );
  }

  /**
   * Stop location tracking
   */
  stopTracking(): void {
    if (this.watchId !== null) {
      navigator.geolocation.clearWatch(this.watchId);
      this.watchId = null;
      this._isTracking.set(false);
      console.log('[LocationService] Stopped location tracking');
    }
  }

  /**
   * Handle position update from geolocation API
   */
  private handlePositionUpdate(position: GeolocationPosition): void {
    const location: UserLocation = {
      lat: position.coords.latitude,
      lng: position.coords.longitude,
      accuracy: position.coords.accuracy,
      timestamp: position.timestamp
    };

    this._currentLocation.set(location);
    this._lastError.set(null);

    console.log('[LocationService] Position updated:', {
      lat: location.lat.toFixed(6),
      lng: location.lng.toFixed(6),
      accuracy: `${location.accuracy.toFixed(1)}m`
    });
  }

  /**
   * Handle geolocation errors
   */
  private handleGeolocationError(error: GeolocationPositionError): void {
    let errorMessage: string;
    
    switch (error.code) {
      case error.PERMISSION_DENIED:
        errorMessage = 'Permisos de ubicación denegados';
        this._permissionStatus.set('denied');
        break;
      case error.POSITION_UNAVAILABLE:
        errorMessage = 'Ubicación no disponible';
        break;
      case error.TIMEOUT:
        errorMessage = 'Tiempo de espera agotado';
        break;
      default:
        errorMessage = 'Error desconocido de ubicación';
    }

    this._lastError.set(errorMessage);
    console.error('[LocationService] Geolocation error:', errorMessage, error);
  }

  /**
   * Force a single location update
   */
  async refreshLocation(): Promise<UserLocation | null> {
    if (!navigator.geolocation) {
      this._lastError.set('Geolocation not supported');
      return null;
    }

    try {
      const position = await this.getCurrentPositionPromise();
      this.handlePositionUpdate(position);
      return this._currentLocation();
    } catch (error: any) {
      this.handleGeolocationError(error);
      return null;
    }
  }

  /**
   * Check if all conditions for check-in are met
   */
  getCheckInConditions(): {
    hasPermission: boolean;
    hasLocation: boolean;
    isInForeground: boolean;
    isMapVisible: boolean;
    allMet: boolean;
    missingConditions: string[];
  } {
    const hasPermission = this._permissionStatus() === 'granted';
    const hasLocation = this._currentLocation() !== null;
    const isInForeground = this._isAppInForeground();
    const isMapVisible = this._isMapVisible();
    
    const missingConditions: string[] = [];
    if (!hasPermission) missingConditions.push('Permisos de ubicación');
    if (!hasLocation) missingConditions.push('Ubicación disponible');
    if (!isInForeground) missingConditions.push('App en primer plano');
    if (!isMapVisible) missingConditions.push('Mapa visible');

    return {
      hasPermission,
      hasLocation,
      isInForeground,
      isMapVisible,
      allMet: hasPermission && hasLocation && isInForeground && isMapVisible,
      missingConditions
    };
  }
}

