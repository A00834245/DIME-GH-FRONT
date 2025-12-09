import { 
  Component, 
  Input, 
  Output, 
  EventEmitter, 
  computed, 
  signal, 
  OnChanges, 
  SimpleChanges,
  OnInit,
  OnDestroy,
  ElementRef,
  ViewChild,
  HostListener,
  NgZone
} from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { GeofenceService, GeofenceCheckResult } from '@features/map/core/services/geofence.service';
import { LocationService } from '@features/map/core/services/location.service';
import { VisitService, VisitComment } from '@features/map/core/services/visit.service';

export interface StoreData {
  id: string;
  name: string;
  category: string;
  description?: string;
  phoneNumber?: string;
  personResponsible?: string;
  hours?: string;
  address: string;
  coordinates: {
    lat: number;
    lng: number;
  };
}

export interface VisitData {
  id: string;
  storeId: string;
  userId: string;
  visitDate: string;
  checkInTimestamp: string;
  commentStatus: 'pending' | 'completed';
}

export type CheckInButtonState = 
  | 'disabled'      // Grey - conditions not met
  | 'enabled'       // Green - ready to check-in
  | 'checked-in'    // Yellow - already checked in today
  | 'loading';      // Loading state during API call

@Component({
  selector: 'app-slide-panel',
  standalone: true,
  imports: [CommonModule, DatePipe],
  template: `
    <div 
      class="slide-panel-overlay" 
      *ngIf="isOpen"
      (click)="onOverlayClick()"
      role="dialog"
      aria-modal="true"
      [attr.aria-labelledby]="'store-title'">
      
      <div 
        class="slide-panel-container"
        [class.closing]="isClosing"
        (click)="$event.stopPropagation()"
        #panelContainer>
        
        <!-- Drag handle -->
        <div 
          class="drag-handle"
          (touchstart)="onDragStart($event)"
          (touchmove)="onDragMove($event)"
          (touchend)="onDragEnd($event)"
          aria-hidden="true">
          <div class="handle-bar"></div>
        </div>
        
        <!-- Close button -->
        <button 
          class="close-button"
          (click)="close()"
          aria-label="Cerrar panel"
          type="button">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M18 6L6 18M6 6L18 18" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
        </button>

        <!-- Header with category color -->
        <div 
          class="panel-header"
          [style.background]="getCategoryGradient()">
          <div class="category-icon">
            <span [innerHTML]="getCategoryIconSvg()"></span>
          </div>
          <div class="header-content">
            <h2 id="store-title" class="store-name">{{ store?.name || 'Sin nombre' }}</h2>
            <span class="store-category">{{ store?.category || 'Sin categoría' }}</span>
          </div>
        </div>

        <!-- Content area -->
        <div class="panel-content">
          <!-- Description -->
          <p class="store-description" *ngIf="store?.description">
            {{ store?.description }}
          </p>

          <!-- Details grid -->
          <div class="details-grid">
            <!-- Phone -->
            <div class="detail-item" *ngIf="store?.phoneNumber">
              <div class="detail-icon">📞</div>
              <div class="detail-content">
                <span class="detail-label">Teléfono</span>
                <a [href]="'tel:' + store?.phoneNumber" class="detail-value phone-link">
                  {{ store?.phoneNumber }}
                </a>
              </div>
            </div>

            <!-- Responsible person -->
            <div class="detail-item" *ngIf="store?.personResponsible">
              <div class="detail-icon">👤</div>
              <div class="detail-content">
                <span class="detail-label">Responsable</span>
                <span class="detail-value">{{ store?.personResponsible }}</span>
              </div>
            </div>

            <!-- Hours -->
            <div class="detail-item" *ngIf="store?.hours">
              <div class="detail-icon">🕐</div>
              <div class="detail-content">
                <span class="detail-label">Horarios</span>
                <span class="detail-value">{{ store?.hours }}</span>
              </div>
            </div>

            <!-- Address -->
            <div class="detail-item">
              <div class="detail-icon">📍</div>
              <div class="detail-content">
                <span class="detail-label">Dirección</span>
                <span class="detail-value">{{ store?.address || 'Dirección no disponible' }}</span>
              </div>
            </div>
          </div>

          <!-- Distance indicator (solo para Cliente) -->
          <div class="distance-indicator" *ngIf="isClienteCategory() && currentDistance() !== null">
            <div class="distance-icon" [class.in-range]="isInGeofence()">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <circle cx="12" cy="12" r="3" stroke="currentColor" stroke-width="2"/>
                <path d="M12 2v3m0 14v3M2 12h3m14 0h3" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
              </svg>
            </div>
            <span class="distance-text">
              <span *ngIf="isInGeofence()">Estás dentro del área de check-in</span>
              <span *ngIf="!isInGeofence()">A {{ formattedDistance() }} de la tienda</span>
            </span>
          </div>

          <!-- Check-in status message (solo para Cliente) -->
          <div class="checkin-status" *ngIf="isClienteCategory() && !canCheckIn() && !hasVisitToday()">
            <div class="status-message" [class.warning]="!locationConditions().allMet">
              <svg *ngIf="!locationConditions().allMet" width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M12 9v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
              </svg>
              <span *ngIf="!locationConditions().hasPermission">Activa los permisos de ubicación</span>
              <span *ngIf="locationConditions().hasPermission && !locationConditions().hasLocation">Obteniendo ubicación...</span>
              <span *ngIf="locationConditions().hasLocation && !isInGeofence()">Acércate a la tienda para hacer check-in</span>
            </div>
          </div>

          <!-- Comments section (solo para Cliente) -->
          <div class="comments-section" *ngIf="isClienteCategory()">
            <div class="comments-header">
              <div class="comments-title-row">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                </svg>
                <span class="comments-title">Comentarios</span>
                <span class="comments-count" *ngIf="storeComments().length > 0">({{ storeComments().length }})</span>
              </div>
            </div>
            
            <div class="comments-list" *ngIf="storeComments().length > 0">
              <div class="comment-item" *ngFor="let comment of storeComments()">
                <div class="comment-header">
                  <span class="comment-date">{{ comment.commentDate | date:'d MMM yyyy, h:mm a' }}</span>
                  <span class="comment-badge" [class.verified]="comment.verified" [class.unverified]="!comment.verified">
                    <svg *ngIf="comment.verified" width="12" height="12" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M20 6L9 17l-5-5" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/>
                    </svg>
                    {{ comment.verified ? 'Verificado' : 'Sin verificar' }}
                  </span>
                </div>
                <p class="comment-text">{{ comment.text }}</p>
              </div>
            </div>
            
            <div class="no-comments" *ngIf="storeComments().length === 0 && !isLoadingComments()">
              <div class="no-comments-icon">💬</div>
              <span class="no-comments-text">No hay comentarios para este cliente</span>
            </div>
            
            <div class="loading-comments" *ngIf="isLoadingComments()">
              <span class="loading-spinner"></span>
              <span>Cargando comentarios...</span>
            </div>
          </div>
        </div>

        <!-- Action buttons -->
        <div class="panel-actions">
          <!-- Check-in button (solo para Cliente) -->
          <button 
            *ngIf="isClienteCategory()"
            class="action-button checkin-button"
            [class.enabled]="buttonState() === 'enabled'"
            [class.checked-in]="buttonState() === 'checked-in'"
            [class.disabled]="buttonState() === 'disabled'"
            [class.loading]="buttonState() === 'loading'"
            [disabled]="buttonState() === 'disabled' || buttonState() === 'loading'"
            (click)="onCheckInClick()"
            type="button">
            
            <!-- Loading spinner -->
            <span *ngIf="buttonState() === 'loading'" class="button-spinner"></span>
            
            <!-- Button content based on state -->
            <ng-container [ngSwitch]="buttonState()">
              <ng-container *ngSwitchCase="'enabled'">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M20 6L9 17l-5-5" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                </svg>
                <span>Hacer Check-in</span>
              </ng-container>
              
              <ng-container *ngSwitchCase="'checked-in'">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                </svg>
                <span>Dejar comentario verificado</span>
              </ng-container>
              
              <ng-container *ngSwitchCase="'disabled'">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M12 2C6.477 2 2 6.477 2 12s4.477 10 10 10 10-4.477 10-10S17.523 2 12 2z" stroke="currentColor" stroke-width="2"/>
                  <path d="M12 8v4m0 4h.01" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
                </svg>
                <span>Check-in no disponible</span>
              </ng-container>
              
              <ng-container *ngSwitchCase="'loading'">
                <span>Registrando visita...</span>
              </ng-container>
            </ng-container>
          </button>

          <!-- Directions button -->
          <button 
            class="action-button directions-button"
            (click)="openDirections()"
            type="button">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
            <span>Ver Direcciones</span>
          </button>
        </div>
      </div>
    </div>
  `,
  styleUrl: './slide-panel.component.css'
})
export class SlidePanelComponent implements OnChanges, OnInit, OnDestroy {
  @Input() isOpen: boolean = false;
  @Input() store: StoreData | null = null;
  @Input() todayVisit: VisitData | null = null;
  
  @Output() closed = new EventEmitter<void>();
  @Output() checkIn = new EventEmitter<StoreData>();
  @Output() leaveComment = new EventEmitter<{ store: StoreData; visit: VisitData }>();
  @Output() directionsRequested = new EventEmitter<StoreData>();

  @ViewChild('panelContainer') panelContainer?: ElementRef<HTMLDivElement>;

  // Animation state
  isClosing = false;
  
  // Drag handling
  private dragStartY = 0;
  private currentDragY = 0;
  private isDragging = false;

  // Geofence state
  private readonly _geofenceResult = signal<GeofenceCheckResult | null>(null);
  
  // Internal signal for todayVisit to make computed() reactive
  private readonly _todayVisit = signal<VisitData | null>(null);
  
  // Computed values
  readonly currentDistance = computed(() => {
    const result = this._geofenceResult();
    return result?.distanceMeters ?? null;
  });
  
  readonly formattedDistance = computed(() => {
    const dist = this.currentDistance();
    if (dist === null) return '';
    return this.geofenceService.formatDistance(dist);
  });
  
  readonly isInGeofence = computed(() => {
    return this._geofenceResult()?.isWithinGeofence ?? false;
  });

  readonly locationConditions = computed(() => {
    return this.locationService.getCheckInConditions();
  });

  readonly canCheckIn = computed(() => {
    const conditions = this.locationConditions();
    return conditions.allMet && this.isInGeofence();
  });

  readonly hasVisitToday = computed(() => {
    return this._todayVisit() !== null;
  });

  readonly buttonState = computed<CheckInButtonState>(() => {
    if (this._isLoading()) return 'loading';
    if (this.hasVisitToday()) return 'checked-in';
    if (this.canCheckIn()) return 'enabled';
    return 'disabled';
  });

  private readonly _isLoading = signal<boolean>(false);
  private locationUpdateInterval: number | null = null;

  // Comments state
  private readonly _storeComments = signal<VisitComment[]>([]);
  private readonly _isLoadingComments = signal<boolean>(false);
  readonly storeComments = computed(() => this._storeComments());
  readonly isLoadingComments = computed(() => this._isLoadingComments());

  // Check if current store is a "Cliente" category
  isClienteCategory(): boolean {
    return this.store?.category?.toLowerCase() === 'cliente';
  }

  constructor(
    private geofenceService: GeofenceService,
    private locationService: LocationService,
    private visitService: VisitService,
    private ngZone: NgZone
  ) {}

  ngOnInit(): void {
    // Start location tracking if not already started
    if (this.locationService.permissionStatus() === 'granted') {
      this.locationService.startTracking();
    }
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['isOpen']) {
      if (changes['isOpen'].currentValue) {
        this.onPanelOpen();
      } else if (!changes['isOpen'].firstChange) {
        this.onPanelClose();
      }
    }

    if (changes['store'] && this.store) {
      this.updateGeofenceCheck();
      // Load comments if it's a Cliente
      if (this.isClienteCategory()) {
        this.loadStoreComments();
      } else {
        this._storeComments.set([]);
      }
    }

    // Update internal signal when todayVisit input changes
    // This makes the computed() reactive to input changes
    if (changes['todayVisit']) {
      this._todayVisit.set(changes['todayVisit'].currentValue);
      
      // If visit was just added, clear loading state
      if (changes['todayVisit'].currentValue && !changes['todayVisit'].previousValue) {
        this._isLoading.set(false);
        // Refresh comments after check-in
        if (this.store && this.isClienteCategory()) {
          this.loadStoreComments();
        }
      }
    }
  }

  ngOnDestroy(): void {
    this.clearLocationInterval();
  }

  private onPanelOpen(): void {
    document.body.style.overflow = 'hidden';
    this.isClosing = false;
    
    // Start periodic geofence checking
    this.startGeofenceChecking();
    
    // Ensure location tracking is active
    this.locationService.setMapVisible(true);
  }

  private onPanelClose(): void {
    document.body.style.overflow = '';
    this.clearLocationInterval();
  }

  private startGeofenceChecking(): void {
    this.updateGeofenceCheck();
    
    // Run interval outside Angular zone to prevent excessive change detection
    // Only trigger change detection when actually updating the geofence result
    this.ngZone.runOutsideAngular(() => {
      this.locationUpdateInterval = window.setInterval(() => {
        this.ngZone.run(() => {
          this.updateGeofenceCheck();
        });
      }, 2000);
    });
  }

  private clearLocationInterval(): void {
    if (this.locationUpdateInterval !== null) {
      clearInterval(this.locationUpdateInterval);
      this.locationUpdateInterval = null;
    }
  }

  private updateGeofenceCheck(): void {
    const userLocation = this.locationService.currentLocation();
    if (!userLocation || !this.store) return;

    const result = this.geofenceService.checkGeofence(
      userLocation,
      this.store.coordinates,
      this.store.id
    );

    this._geofenceResult.set(result);
  }

  private async loadStoreComments(): Promise<void> {
    if (!this.store) return;

    this._isLoadingComments.set(true);
    try {
      const comments = await this.visitService.getCommentsForStore(this.store.id, 10);
      this.ngZone.run(() => {
        this._storeComments.set(comments);
      });
    } catch (error) {
      console.error('[SlidePanel] Error loading comments:', error);
      this._storeComments.set([]);
    } finally {
      this.ngZone.run(() => {
        this._isLoadingComments.set(false);
      });
    }
  }

  // Public method to refresh comments (can be called from parent)
  refreshComments(): void {
    if (this.store && this.isClienteCategory()) {
      this.loadStoreComments();
    }
  }

  close(): void {
    this.isClosing = true;
    setTimeout(() => {
      this.isOpen = false;
      this.isClosing = false;
      this.closed.emit();
    }, 300);
  }

  onOverlayClick(): void {
    this.close();
  }

  onCheckInClick(): void {
    if (this.buttonState() === 'loading') return;

    const currentVisit = this._todayVisit();
    if (this.buttonState() === 'checked-in' && this.store && currentVisit) {
      // Navigate to leave comment
      this.leaveComment.emit({ store: this.store, visit: currentVisit });
      return;
    }

    if (this.buttonState() === 'enabled' && this.store) {
      this._isLoading.set(true);
      this.checkIn.emit(this.store);
      
      // Loading will be cleared by parent component after API response
    }
  }

  // Called by parent after check-in API response
  setLoading(loading: boolean): void {
    this._isLoading.set(loading);
  }

  openDirections(): void {
    if (this.store) {
      const { lat, lng } = this.store.coordinates;
      const url = `https://maps.google.com/maps?daddr=${lat},${lng}`;
      window.open(url, '_blank');
      this.directionsRequested.emit(this.store);
    }
  }

  // Drag handlers for swipe-to-close
  onDragStart(event: TouchEvent): void {
    this.isDragging = true;
    this.dragStartY = event.touches[0].clientY;
    this.currentDragY = 0;
  }

  onDragMove(event: TouchEvent): void {
    if (!this.isDragging) return;
    
    const currentY = event.touches[0].clientY;
    this.currentDragY = currentY - this.dragStartY;
    
    // Only allow dragging down
    if (this.currentDragY > 0 && this.panelContainer) {
      this.panelContainer.nativeElement.style.transform = `translateY(${this.currentDragY}px)`;
    }
  }

  onDragEnd(event: TouchEvent): void {
    this.isDragging = false;
    
    if (this.panelContainer) {
      this.panelContainer.nativeElement.style.transform = '';
    }
    
    // Close if dragged more than 100px
    if (this.currentDragY > 100) {
      this.close();
    }
    
    this.currentDragY = 0;
  }

  @HostListener('document:keydown.escape')
  onEscapeKey(): void {
    if (this.isOpen) {
      this.close();
    }
  }

  // Helper methods for styling
  getCategoryColor(): string {
    switch (this.store?.category?.toLowerCase()) {
      case 'estacionamiento':
        return '#007FFF';
      case 'cedi':
        return '#FF8C00';
      case 'cliente':
        return '#ED1B24';
      default:
        return '#6b7280';
    }
  }

  getCategoryGradient(): string {
    const color = this.getCategoryColor();
    return `linear-gradient(135deg, ${color} 0%, ${this.lightenColor(color, 20)} 100%)`;
  }

  getCategoryIconSvg(): string {
    switch (this.store?.category?.toLowerCase()) {
      case 'estacionamiento':
        return `<svg width="28" height="28" viewBox="0 0 20 25" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path fill-rule="evenodd" clip-rule="evenodd" d="M20 10C20 15.5237 11.4286 24.5 10 24.5C8.57143 24.5 0 15.5237 0 10C0 4.47715 4.47715 0 10 0C15.5228 0 20 4.47715 20 10ZM6.8 15H13.4V13.27H8.4V10.07H12.6V9.02H8.4V6.73H13.35V5H6.8V15Z" fill="white"/>
        </svg>`;
      case 'cedi':
        return `<svg width="28" height="28" viewBox="0 0 20 25" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M20 10C20 15.5237 11.4286 24.5 10 24.5C8.57143 24.5 0 15.5237 0 10C0 4.47715 4.47715 0 10 0C15.5228 0 20 4.47715 20 10Z" fill="white" fill-opacity="0.2"/>
          <path d="M8.097 5L4.20381 6.904L5.57732 8.27886L9.47048 6.375L8.097 5ZM11.6823 5L10.309 6.375L14.2021 8.27886L15.5757 6.904L11.6823 5ZM9.88571 6.67617L9.6289 6.78214V10.2261L9.88571 10.3321L10.1426 10.2261V6.78214L9.88571 6.67617ZM5.59058 8.80268L4.165 10.6686L7.69166 12.5584L9.47047 10.7798L5.59058 8.80268ZM14.1808 8.2027L9.88571 10.7798L11.6646 12.5584L15.1912 10.6686L14.1808 8.80268ZM9.6289 11.2551L7.92396 13.2598L5.78039 12.0491V13.2761L9.6289 15V11.2551ZM10.1426 11.2551V15L13.9911 13.2761V12.0491L11.8476 13.2598L10.1426 11.2551Z" fill="white"/>
        </svg>`;
      case 'cliente':
        return `<svg width="28" height="28" viewBox="0 0 20 25" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M20 10C20 15.5237 11.4286 24.5 10 24.5C8.57143 24.5 0 15.5237 0 10C0 4.47715 4.47715 0 10 0C15.5228 0 20 4.47715 20 10Z" fill="white" fill-opacity="0.2"/>
          <path fill-rule="evenodd" clip-rule="evenodd" d="M14.3402 5H6.07235L5 7.97563V8.86293C5 9.27514 5.16027 9.60253 5.42062 9.79606V15H15.0361V9.79606C15.2965 9.60253 15.4567 9.27514 15.4567 8.86293V7.97563L14.3402 5Z" fill="white"/>
        </svg>`;
      default:
        return `<svg width="28" height="28" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z" fill="white"/>
        </svg>`;
    }
  }

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
}

