import { 
  Component, 
  Input, 
  Output, 
  EventEmitter, 
  computed, 
  signal,
  OnInit,
  OnDestroy
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { PendingVisit, VisitService } from '@features/map/core/services/visit.service';

@Component({
  selector: 'app-pending-banner',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div 
      class="pending-banner"
      *ngIf="isVisible()"
      [class.expanded]="isExpanded"
      [class.minimized]="!isExpanded"
      role="region"
      aria-label="Comentarios pendientes"
      [@bannerAnimation]>
      
      <!-- Minimized view -->
      <div class="banner-minimized" *ngIf="!isExpanded" (click)="expand()">
        <div class="banner-icon pulse">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10z" stroke="currentColor" stroke-width="2"/>
            <path d="M12 6v6l4 2" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
          </svg>
        </div>
        <span class="banner-text">
          {{ pendingCount() }} {{ pendingCount() === 1 ? 'comentario pendiente' : 'comentarios pendientes' }}
        </span>
        <button class="expand-button" aria-label="Ver detalles">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M18 15l-6-6-6 6" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
        </button>
      </div>

      <!-- Expanded view -->
      <div class="banner-expanded" *ngIf="isExpanded">
        <div class="banner-header">
          <div class="header-content">
            <div class="header-icon">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10z" stroke="currentColor" stroke-width="2"/>
                <path d="M12 6v6l4 2" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
              </svg>
            </div>
            <div>
              <h3 class="banner-title">Comentarios Pendientes</h3>
              <p class="banner-subtitle">
                Tienes {{ pendingCount() }} {{ pendingCount() === 1 ? 'visita sin comentario' : 'visitas sin comentarios' }}
              </p>
            </div>
          </div>
          <button class="collapse-button" (click)="collapse()" aria-label="Minimizar">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M6 9l6 6 6-6" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
          </button>
        </div>

        <div class="pending-list">
          <div 
            class="pending-item"
            *ngFor="let visit of pendingVisits()"
            (click)="onItemClick(visit)"
            role="button"
            tabindex="0"
            (keydown.enter)="onItemClick(visit)"
            (keydown.space)="onItemClick(visit)">
            <div class="item-icon">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z" stroke="currentColor" stroke-width="2"/>
                <circle cx="12" cy="10" r="3" stroke="currentColor" stroke-width="2"/>
              </svg>
            </div>
            <div class="item-content">
              <span class="item-name">{{ visit.storeName }}</span>
              <span class="item-time">Check-in: {{ formatTime(visit.checkInTimestamp) }}</span>
            </div>
            <div class="item-arrow">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M9 18l6-6-6-6" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
              </svg>
            </div>
          </div>
        </div>

        <button class="view-all-button" (click)="onViewAll()">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
            <path d="M9 12l2 2 4-4" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
          Completar todos los comentarios
        </button>
      </div>
    </div>
  `,
  styles: [`
    .pending-banner {
      position: fixed;
      bottom: 0;
      left: 0;
      right: 0;
      z-index: 900;
      animation: slideUp 0.3s ease-out;
    }

    @keyframes slideUp {
      from {
        transform: translateY(100%);
        opacity: 0;
      }
      to {
        transform: translateY(0);
        opacity: 1;
      }
    }

    /* Minimized state */
    .banner-minimized {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 14px 20px;
      background: linear-gradient(135deg, #fbbf24 0%, #f59e0b 100%);
      color: #78350f;
      cursor: pointer;
      transition: all 0.2s;
    }

    .banner-minimized:hover {
      background: linear-gradient(135deg, #fcd34d 0%, #fbbf24 100%);
    }

    .banner-icon {
      width: 36px;
      height: 36px;
      background: rgba(255, 255, 255, 0.9);
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      color: #f59e0b;
    }

    .banner-icon.pulse {
      animation: pulse 2s ease-in-out infinite;
    }

    @keyframes pulse {
      0%, 100% {
        box-shadow: 0 0 0 0 rgba(255, 255, 255, 0.4);
      }
      50% {
        box-shadow: 0 0 0 8px rgba(255, 255, 255, 0);
      }
    }

    .banner-text {
      flex: 1;
      font-weight: 600;
      font-size: 0.9375rem;
    }

    .expand-button {
      background: rgba(255, 255, 255, 0.2);
      border: none;
      border-radius: 50%;
      width: 32px;
      height: 32px;
      display: flex;
      align-items: center;
      justify-content: center;
      color: inherit;
      cursor: pointer;
      transition: all 0.2s;
    }

    .expand-button:hover {
      background: rgba(255, 255, 255, 0.3);
    }

    /* Expanded state */
    .banner-expanded {
      background: white;
      border-radius: 20px 20px 0 0;
      box-shadow: 0 -4px 20px rgba(0, 0, 0, 0.15);
      max-height: 60vh;
      overflow: hidden;
      display: flex;
      flex-direction: column;
    }

    .banner-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 20px;
      background: linear-gradient(135deg, #fbbf24 0%, #f59e0b 100%);
      color: white;
    }

    .header-content {
      display: flex;
      align-items: center;
      gap: 14px;
    }

    .header-icon {
      width: 44px;
      height: 44px;
      background: rgba(255, 255, 255, 0.2);
      border-radius: 12px;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .banner-title {
      margin: 0;
      font-size: 1.125rem;
      font-weight: 700;
    }

    .banner-subtitle {
      margin: 4px 0 0;
      font-size: 0.875rem;
      opacity: 0.9;
    }

    .collapse-button {
      background: rgba(255, 255, 255, 0.2);
      border: none;
      border-radius: 50%;
      width: 36px;
      height: 36px;
      display: flex;
      align-items: center;
      justify-content: center;
      color: white;
      cursor: pointer;
      transition: all 0.2s;
    }

    .collapse-button:hover {
      background: rgba(255, 255, 255, 0.3);
    }

    /* Pending list */
    .pending-list {
      flex: 1;
      overflow-y: auto;
      padding: 8px 0;
      max-height: 200px;
    }

    .pending-item {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 14px 20px;
      cursor: pointer;
      transition: background 0.2s;
    }

    .pending-item:hover {
      background: #f9fafb;
    }

    .pending-item:focus {
      outline: none;
      background: #f3f4f6;
    }

    .item-icon {
      width: 36px;
      height: 36px;
      background: #fef3c7;
      border-radius: 8px;
      display: flex;
      align-items: center;
      justify-content: center;
      color: #d97706;
    }

    .item-content {
      flex: 1;
      min-width: 0;
    }

    .item-name {
      display: block;
      font-weight: 600;
      color: #1f2937;
      font-size: 0.9375rem;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    .item-time {
      display: block;
      font-size: 0.8125rem;
      color: #6b7280;
      margin-top: 2px;
    }

    .item-arrow {
      color: #9ca3af;
    }

    /* View all button */
    .view-all-button {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 10px;
      margin: 16px 20px 20px;
      padding: 14px;
      background: linear-gradient(135deg, #fbbf24 0%, #f59e0b 100%);
      color: white;
      border: none;
      border-radius: 12px;
      font-size: 0.9375rem;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.2s;
    }

    .view-all-button:hover {
      transform: translateY(-2px);
      box-shadow: 0 4px 12px rgba(245, 158, 11, 0.4);
    }

    /* Responsive */
    @media (max-width: 480px) {
      .banner-header {
        padding: 16px;
      }

      .header-icon {
        width: 40px;
        height: 40px;
      }

      .banner-title {
        font-size: 1rem;
      }

      .pending-list {
        max-height: 150px;
      }

      .pending-item {
        padding: 12px 16px;
      }
    }

    /* Dark mode */
    @media (prefers-color-scheme: dark) {
      .banner-expanded {
        background: #1f2937;
      }

      .pending-item:hover {
        background: #374151;
      }

      .pending-item:focus {
        background: #4b5563;
      }

      .item-name {
        color: #f3f4f6;
      }

      .item-time {
        color: #9ca3af;
      }
    }
  `]
})
export class PendingBannerComponent implements OnInit, OnDestroy {
  @Input() pendingVisits = signal<PendingVisit[]>([]);
  
  @Output() visitSelected = new EventEmitter<PendingVisit>();
  @Output() viewAllClicked = new EventEmitter<void>();

  isExpanded = false;
  
  private refreshInterval: number | null = null;

  readonly pendingCount = computed(() => this.pendingVisits().length);
  readonly isVisible = computed(() => this.pendingCount() > 0);

  constructor(private visitService: VisitService) {}

  ngOnInit(): void {
    // Refresh pending visits every minute
    this.refreshInterval = window.setInterval(() => {
      this.visitService.fetchPendingVisits();
    }, 60000);
  }

  ngOnDestroy(): void {
    if (this.refreshInterval) {
      clearInterval(this.refreshInterval);
    }
  }

  expand(): void {
    this.isExpanded = true;
  }

  collapse(): void {
    this.isExpanded = false;
  }

  onItemClick(visit: PendingVisit): void {
    this.visitSelected.emit(visit);
    this.isExpanded = false;
  }

  onViewAll(): void {
    this.viewAllClicked.emit();
    this.isExpanded = false;
  }

  formatTime(timestamp: string): string {
    const date = new Date(timestamp);
    return date.toLocaleTimeString('es-MX', { 
      hour: '2-digit', 
      minute: '2-digit',
      hour12: true 
    });
  }
}

