import { 
  Component, 
  Input, 
  Output, 
  EventEmitter,
  HostListener 
} from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-no-checkin-warning',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div 
      class="warning-overlay" 
      *ngIf="isOpen"
      (click)="onOverlayClick()"
      role="alertdialog"
      aria-modal="true"
      aria-labelledby="warning-title"
      aria-describedby="warning-description">
      
      <div 
        class="warning-dialog"
        [class.closing]="isClosing"
        (click)="$event.stopPropagation()">
        
        <!-- Warning icon -->
        <div class="warning-icon-container">
          <div class="warning-icon">
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" 
                    stroke="currentColor" 
                    stroke-width="2" 
                    stroke-linecap="round" 
                    stroke-linejoin="round"/>
            </svg>
          </div>
        </div>

        <!-- Content -->
        <div class="warning-content">
          <h2 id="warning-title" class="warning-title">Sin Check-in en esta tienda</h2>
          <p id="warning-description" class="warning-message">
            No has realizado check-in en <strong>{{ storeName }}</strong> hoy.
          </p>
          <p class="warning-detail">
            Tu comentario se publicará <strong>sin</strong> la nota "Visita Verificada".
          </p>
        </div>

        <!-- Info box -->
        <div class="info-box">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="2"/>
            <path d="M12 16v-4M12 8h.01" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
          </svg>
          <span>Los comentarios verificados ayudan a confirmar información actualizada de la tienda.</span>
        </div>

        <!-- Actions -->
        <div class="warning-actions">
          <button 
            class="action-button cancel-button"
            (click)="onCancel()"
            type="button">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M6 18L18 6M6 6l12 12" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
            Cancelar
          </button>
          <button 
            class="action-button continue-button"
            (click)="onContinue()"
            type="button">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" 
                    stroke="currentColor" 
                    stroke-width="2" 
                    stroke-linecap="round" 
                    stroke-linejoin="round"/>
            </svg>
            Continuar sin verificación
          </button>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .warning-overlay {
      position: fixed;
      inset: 0;
      background: rgba(0, 0, 0, 0.6);
      z-index: 1200;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 20px;
      animation: fadeIn 0.2s ease-out;
    }

    @keyframes fadeIn {
      from { opacity: 0; }
      to { opacity: 1; }
    }

    .warning-dialog {
      width: 100%;
      max-width: 400px;
      background: white;
      border-radius: 20px;
      padding: 24px;
      box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
      animation: scaleIn 0.25s cubic-bezier(0.34, 1.56, 0.64, 1);
    }

    .warning-dialog.closing {
      animation: scaleOut 0.2s ease-in forwards;
    }

    @keyframes scaleIn {
      from {
        transform: scale(0.9);
        opacity: 0;
      }
      to {
        transform: scale(1);
        opacity: 1;
      }
    }

    @keyframes scaleOut {
      from {
        transform: scale(1);
        opacity: 1;
      }
      to {
        transform: scale(0.9);
        opacity: 0;
      }
    }

    .warning-icon-container {
      display: flex;
      justify-content: center;
      margin-bottom: 20px;
    }

    .warning-icon {
      width: 64px;
      height: 64px;
      background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%);
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      color: #d97706;
    }

    .warning-content {
      text-align: center;
      margin-bottom: 20px;
    }

    .warning-title {
      margin: 0 0 12px;
      font-size: 1.25rem;
      font-weight: 700;
      color: #1f2937;
    }

    .warning-message {
      margin: 0 0 8px;
      font-size: 0.9375rem;
      color: #4b5563;
      line-height: 1.5;
    }

    .warning-detail {
      margin: 0;
      font-size: 0.9375rem;
      color: #4b5563;
      line-height: 1.5;
    }

    .info-box {
      display: flex;
      align-items: flex-start;
      gap: 10px;
      padding: 14px 16px;
      background: #f3f4f6;
      border-radius: 12px;
      margin-bottom: 24px;
      font-size: 0.8125rem;
      color: #6b7280;
      line-height: 1.5;
    }

    .info-box svg {
      flex-shrink: 0;
      margin-top: 2px;
    }

    .warning-actions {
      display: flex;
      flex-direction: column;
      gap: 12px;
    }

    .action-button {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 10px;
      width: 100%;
      padding: 14px 20px;
      border: none;
      border-radius: 12px;
      font-size: 0.9375rem;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.2s;
    }

    .cancel-button {
      background: white;
      color: #6b7280;
      border: 2px solid #e5e7eb;
      order: 2;
    }

    .cancel-button:hover {
      background: #f9fafb;
      border-color: #d1d5db;
    }

    .continue-button {
      background: linear-gradient(135deg, #fbbf24 0%, #f59e0b 100%);
      color: #78350f;
      order: 1;
    }

    .continue-button:hover {
      transform: translateY(-2px);
      box-shadow: 0 4px 12px rgba(251, 191, 36, 0.4);
    }

    .continue-button:active {
      transform: translateY(0);
    }

    /* Responsive */
    @media (max-width: 480px) {
      .warning-dialog {
        padding: 20px;
        border-radius: 16px;
      }

      .warning-icon {
        width: 56px;
        height: 56px;
      }

      .warning-icon svg {
        width: 28px;
        height: 28px;
      }

      .warning-title {
        font-size: 1.125rem;
      }

      .warning-message,
      .warning-detail {
        font-size: 0.875rem;
      }
    }

    /* Dark mode */
    @media (prefers-color-scheme: dark) {
      .warning-dialog {
        background: #1f2937;
      }

      .warning-title {
        color: #f3f4f6;
      }

      .warning-message,
      .warning-detail {
        color: #d1d5db;
      }

      .info-box {
        background: #374151;
        color: #9ca3af;
      }

      .cancel-button {
        background: #374151;
        border-color: #4b5563;
        color: #e5e7eb;
      }

      .cancel-button:hover {
        background: #4b5563;
      }
    }

    /* Reduced motion */
    @media (prefers-reduced-motion: reduce) {
      .warning-overlay,
      .warning-dialog,
      .warning-dialog.closing {
        animation: none;
      }

      .continue-button:hover {
        transform: none;
      }
    }
  `]
})
export class NoCheckinWarningComponent {
  @Input() isOpen: boolean = false;
  @Input() storeName: string = '';
  
  @Output() cancel = new EventEmitter<void>();
  @Output() continueWithoutVerification = new EventEmitter<void>();
  @Output() closed = new EventEmitter<void>();

  isClosing: boolean = false;

  @HostListener('document:keydown.escape')
  onEscapeKey(): void {
    if (this.isOpen) {
      this.onCancel();
    }
  }

  onOverlayClick(): void {
    this.onCancel();
  }

  onCancel(): void {
    this.isClosing = true;
    setTimeout(() => {
      this.isOpen = false;
      this.isClosing = false;
      this.cancel.emit();
      this.closed.emit();
    }, 200);
  }

  onContinue(): void {
    this.isClosing = true;
    setTimeout(() => {
      this.isOpen = false;
      this.isClosing = false;
      this.continueWithoutVerification.emit();
      this.closed.emit();
    }, 200);
  }
}

