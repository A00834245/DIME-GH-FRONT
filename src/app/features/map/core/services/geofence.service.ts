import { Injectable, signal, computed } from '@angular/core';

export interface GeofenceConfig {
  radiusMeters: number;
  minAccuracyMeters: number;
}

export interface GeofenceCheckResult {
  isWithinGeofence: boolean;
  distanceMeters: number;
  userAccuracy: number;
  storeId: string | null;
  storeLocation: { lat: number; lng: number } | null;
}

const DEFAULT_GEOFENCE_CONFIG: GeofenceConfig = {
  radiusMeters: 70, // Default 15 meters as per HU1 requirements
  minAccuracyMeters: 99 // Minimum acceptable GPS accuracy
};

@Injectable({
  providedIn: 'root'
})
export class GeofenceService {
  // Configurable geofence radius
  private readonly config = signal<GeofenceConfig>(DEFAULT_GEOFENCE_CONFIG);
  
  // Current geofence status
  private readonly _currentGeofenceStatus = signal<GeofenceCheckResult | null>(null);
  
  // Exposed as readonly
  public readonly currentGeofenceStatus = computed(() => this._currentGeofenceStatus());
  public readonly isWithinAnyGeofence = computed(() => this._currentGeofenceStatus()?.isWithinGeofence ?? false);
  public readonly currentDistanceMeters = computed(() => this._currentGeofenceStatus()?.distanceMeters ?? Infinity);
  
  /**
   * Configure geofence parameters
   */
  setConfig(config: Partial<GeofenceConfig>): void {
    this.config.update(current => ({
      ...current,
      ...config
    }));
    console.log('[GeofenceService] Config updated:', this.config());
  }

  /**
   * Get current configuration
   */
  getConfig(): GeofenceConfig {
    return this.config();
  }

  /**
   * Calculate distance between two geographic points using Haversine formula
   * Returns distance in meters
   * Time complexity: O(1)
   */
  calculateDistance(
    point1: { lat: number; lng: number },
    point2: { lat: number; lng: number }
  ): number {
    const R = 6371000; // Earth's radius in meters
    
    const lat1Rad = this.toRadians(point1.lat);
    const lat2Rad = this.toRadians(point2.lat);
    const deltaLat = this.toRadians(point2.lat - point1.lat);
    const deltaLng = this.toRadians(point2.lng - point1.lng);
    
    const a = Math.sin(deltaLat / 2) * Math.sin(deltaLat / 2) +
              Math.cos(lat1Rad) * Math.cos(lat2Rad) *
              Math.sin(deltaLng / 2) * Math.sin(deltaLng / 2);
    
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    
    return R * c;
  }

  /**
   * Check if user is within geofence of a specific store
   * Time complexity: O(1)
   */
  checkGeofence(
    userLocation: { lat: number; lng: number; accuracy?: number },
    storeLocation: { lat: number; lng: number },
    storeId: string
  ): GeofenceCheckResult {
    const config = this.config();
    const accuracy = userLocation.accuracy ?? config.minAccuracyMeters;
    
    const distance = this.calculateDistance(userLocation, storeLocation);
    
    // Consider accuracy: if accuracy is worse than the geofence radius,
    // user might be inside but we can't confirm
    const effectiveRadius = config.radiusMeters;
    const isWithinGeofence = distance <= effectiveRadius && accuracy <= config.minAccuracyMeters;
    
    const result: GeofenceCheckResult = {
      isWithinGeofence,
      distanceMeters: Math.round(distance * 100) / 100, // Round to 2 decimal places
      userAccuracy: accuracy,
      storeId,
      storeLocation
    };
    
    // Update current status
    this._currentGeofenceStatus.set(result);
    
    return result;
  }

  /**
   * Check geofence for multiple stores and return the closest one within range
   * Time complexity: O(n) where n is number of stores
   */
  checkGeofenceForMultipleStores(
    userLocation: { lat: number; lng: number; accuracy?: number },
    stores: Array<{ id: string; lat: number; lng: number }>
  ): GeofenceCheckResult | null {
    let closestResult: GeofenceCheckResult | null = null;
    let minDistance = Infinity;
    
    for (const store of stores) {
      const result = this.checkGeofence(
        userLocation,
        { lat: store.lat, lng: store.lng },
        store.id
      );
      
      if (result.distanceMeters < minDistance) {
        minDistance = result.distanceMeters;
        closestResult = result;
      }
    }
    
    // Update status with the closest store
    if (closestResult) {
      this._currentGeofenceStatus.set(closestResult);
    }
    
    return closestResult?.isWithinGeofence ? closestResult : null;
  }

  /**
   * Validate if location accuracy is acceptable for geofencing
   */
  isAccuracyAcceptable(accuracy: number): boolean {
    return accuracy <= this.config().minAccuracyMeters;
  }

  /**
   * Get a human-readable distance string
   */
  formatDistance(meters: number): string {
    if (meters < 1000) {
      return `${Math.round(meters)} m`;
    }
    return `${(meters / 1000).toFixed(1)} km`;
  }

  /**
   * Clear current geofence status
   */
  clearStatus(): void {
    this._currentGeofenceStatus.set(null);
  }

  private toRadians(degrees: number): number {
    return degrees * (Math.PI / 180);
  }
}

