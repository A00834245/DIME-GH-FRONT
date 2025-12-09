import { 
  Component, 
  Input, 
  Output, 
  EventEmitter, 
  ViewChild,
  ElementRef,
  OnChanges,
  SimpleChanges,
  signal,
  computed
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

export interface CommentData {
  storeId: string;
  storeName: string;
  visitId?: string;
  isVerified: boolean;
}

@Component({
  selector: 'app-comment-popup',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div 
      class="comment-overlay" 
      *ngIf="isOpen"
      (click)="onOverlayClick()"
      role="dialog"
      aria-modal="true"
      aria-labelledby="comment-dialog-title">
      
      <div 
        class="comment-container"
        [class.closing]="isClosing"
        (click)="$event.stopPropagation()"
        #container>
        
        <!-- Handle bar -->
        <div class="drag-handle" aria-hidden="true">
          <div class="handle-bar"></div>
        </div>

        <!-- Header -->
        <div class="popup-header">
          <h2 id="comment-dialog-title" class="popup-title">
            {{ isVerified ? 'Comentario Verificado' : 'Dejar Comentario' }}
          </h2>
          <button 
            class="close-button"
            (click)="close()"
            aria-label="Cerrar"
            type="button">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M18 6L6 18M6 6l12 12" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
          </button>
        </div>

        <!-- Store info -->
        <div class="store-info">
          <div class="store-icon">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z" stroke="currentColor" stroke-width="2"/>
              <circle cx="12" cy="10" r="3" stroke="currentColor" stroke-width="2"/>
            </svg>
          </div>
          <span class="store-name">{{ storeName }}</span>
          <span 
            class="verified-badge" 
            *ngIf="isVerified"
            title="Este comentario será verificado con tu visita de hoy">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
            Visita Verificada
          </span>
        </div>

        <!-- Warning for unverified comments -->
        <div class="warning-box" *ngIf="!isVerified && showNoVisitWarning">
          <div class="warning-icon">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
          </div>
          <div class="warning-content">
            <p class="warning-title">No has realizado check-in en esta tienda hoy</p>
            <p class="warning-text">Tu comentario se publicará sin la nota "Visita Verificada"</p>
          </div>
        </div>

        <!-- Comment textarea -->
        <div class="comment-input-container">
          <label for="comment-input" class="input-label">Tu comentario</label>
          <textarea
            #commentInput
            id="comment-input"
            class="comment-textarea"
            [(ngModel)]="commentText"
            placeholder="Escribe tu comentario sobre esta tienda..."
            maxlength="1000"
            rows="5"
            (input)="onInput()">
          </textarea>
          <div class="char-counter" [class.near-limit]="charCount() > 900">
            {{ charCount() }}/1000
          </div>
        </div>

        <!-- Actions -->
        <div class="popup-actions">
          <button 
            class="action-button cancel-button"
            (click)="close()"
            type="button">
            Cancelar
          </button>
          <button 
            class="action-button submit-button"
            [class.verified]="isVerified"
            [disabled]="!canSubmit() || isSubmitting()"
            (click)="submitComment()"
            type="button">
            <span *ngIf="isSubmitting()" class="button-spinner"></span>
            <span *ngIf="!isSubmitting()">
              {{ isVerified ? 'Publicar Comentario Verificado' : 'Publicar Comentario' }}
            </span>
          </button>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .comment-overlay {
      position: fixed;
      inset: 0;
      background: rgba(0, 0, 0, 0.5);
      z-index: 1100;
      display: flex;
      align-items: flex-end;
      justify-content: center;
      animation: fadeIn 0.2s ease-out;
    }

    @keyframes fadeIn {
      from { opacity: 0; }
      to { opacity: 1; }
    }

    .comment-container {
      position: relative;
      width: 100%;
      max-width: 500px;
      max-height: 90vh;
      background: #ffffff;
      border-radius: 24px 24px 0 0;
      box-shadow: 0 -8px 32px rgba(0, 0, 0, 0.2);
      display: flex;
      flex-direction: column;
      animation: slideUp 0.3s cubic-bezier(0.32, 0.72, 0, 1);
    }

    .comment-container.closing {
      animation: slideDown 0.3s cubic-bezier(0.32, 0.72, 0, 1) forwards;
    }

    @keyframes slideUp {
      from { transform: translateY(100%); opacity: 0; }
      to { transform: translateY(0); opacity: 1; }
    }

    @keyframes slideDown {
      from { transform: translateY(0); opacity: 1; }
      to { transform: translateY(100%); opacity: 0; }
    }

    .drag-handle {
      display: flex;
      justify-content: center;
      padding: 12px 0 8px;
    }

    .handle-bar {
      width: 40px;
      height: 4px;
      background: #d1d5db;
      border-radius: 2px;
    }

    .popup-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 0 20px 16px;
      border-bottom: 1px solid #e5e7eb;
    }

    .popup-title {
      margin: 0;
      font-size: 1.25rem;
      font-weight: 700;
      color: #1f2937;
    }

    .close-button {
      background: #f3f4f6;
      border: none;
      border-radius: 50%;
      width: 36px;
      height: 36px;
      display: flex;
      align-items: center;
      justify-content: center;
      color: #6b7280;
      cursor: pointer;
      transition: all 0.2s;
    }

    .close-button:hover {
      background: #e5e7eb;
      color: #374151;
    }

    .store-info {
      display: flex;
      align-items: center;
      gap: 10px;
      padding: 16px 20px;
      background: #f9fafb;
    }

    .store-icon {
      width: 32px;
      height: 32px;
      background: white;
      border-radius: 8px;
      display: flex;
      align-items: center;
      justify-content: center;
      color: #6b7280;
      box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
    }

    .store-name {
      flex: 1;
      font-weight: 600;
      color: #1f2937;
      font-size: 0.9375rem;
    }

    .verified-badge {
      display: flex;
      align-items: center;
      gap: 4px;
      padding: 4px 10px;
      background: linear-gradient(135deg, #22c55e 0%, #16a34a 100%);
      color: white;
      font-size: 0.75rem;
      font-weight: 600;
      border-radius: 100px;
    }

    .warning-box {
      display: flex;
      gap: 12px;
      margin: 16px 20px;
      padding: 14px 16px;
      background: #fef3c7;
      border-radius: 12px;
      border: 1px solid #fcd34d;
    }

    .warning-icon {
      color: #d97706;
      flex-shrink: 0;
    }

    .warning-content {
      flex: 1;
    }

    .warning-title {
      margin: 0 0 4px;
      font-size: 0.875rem;
      font-weight: 600;
      color: #92400e;
    }

    .warning-text {
      margin: 0;
      font-size: 0.8125rem;
      color: #a16207;
    }

    .comment-input-container {
      padding: 16px 20px;
      flex: 1;
    }

    .input-label {
      display: block;
      font-size: 0.875rem;
      font-weight: 600;
      color: #374151;
      margin-bottom: 8px;
    }

    .comment-textarea {
      width: 100%;
      min-height: 120px;
      padding: 14px 16px;
      border: 2px solid #e5e7eb;
      border-radius: 12px;
      font-size: 0.9375rem;
      font-family: inherit;
      line-height: 1.5;
      resize: none;
      transition: all 0.2s;
      box-sizing: border-box;
    }

    .comment-textarea:focus {
      outline: none;
      border-color: #3b82f6;
      box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
    }

    .comment-textarea::placeholder {
      color: #9ca3af;
    }

    .char-counter {
      text-align: right;
      font-size: 0.75rem;
      color: #9ca3af;
      margin-top: 6px;
    }

    .char-counter.near-limit {
      color: #f59e0b;
    }

    .popup-actions {
      display: flex;
      gap: 12px;
      padding: 16px 20px 24px;
      background: #f9fafb;
      border-top: 1px solid #e5e7eb;
    }

    .action-button {
      flex: 1;
      padding: 14px 20px;
      border: none;
      border-radius: 12px;
      font-size: 0.9375rem;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.2s;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 8px;
    }

    .cancel-button {
      background: white;
      color: #6b7280;
      border: 2px solid #e5e7eb;
    }

    .cancel-button:hover {
      background: #f9fafb;
      border-color: #d1d5db;
    }

    .submit-button {
      background: #3b82f6;
      color: white;
    }

    .submit-button:hover:not(:disabled) {
      background: #2563eb;
    }

    .submit-button.verified {
      background: linear-gradient(135deg, #22c55e 0%, #16a34a 100%);
    }

    .submit-button.verified:hover:not(:disabled) {
      background: linear-gradient(135deg, #16a34a 0%, #15803d 100%);
    }

    .submit-button:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }

    .button-spinner {
      width: 18px;
      height: 18px;
      border: 2px solid rgba(255, 255, 255, 0.3);
      border-top-color: white;
      border-radius: 50%;
      animation: spin 0.8s linear infinite;
    }

    @keyframes spin {
      to { transform: rotate(360deg); }
    }

    /* Responsive */
    @media (max-width: 480px) {
      .comment-container {
        border-radius: 20px 20px 0 0;
      }

      .popup-header {
        padding: 0 16px 14px;
      }

      .popup-title {
        font-size: 1.125rem;
      }

      .store-info,
      .comment-input-container,
      .popup-actions {
        padding-left: 16px;
        padding-right: 16px;
      }

      .popup-actions {
        flex-direction: column;
      }

      .action-button {
        width: 100%;
      }
    }

    /* Dark mode */
    @media (prefers-color-scheme: dark) {
      .comment-container {
        background: #1f2937;
      }

      .popup-title {
        color: #f3f4f6;
      }

      .popup-header {
        border-color: #374151;
      }

      .store-info {
        background: #111827;
      }

      .store-name {
        color: #f3f4f6;
      }

      .store-icon {
        background: #374151;
        color: #9ca3af;
      }

      .input-label {
        color: #e5e7eb;
      }

      .comment-textarea {
        background: #374151;
        border-color: #4b5563;
        color: #f3f4f6;
      }

      .comment-textarea:focus {
        border-color: #3b82f6;
      }

      .popup-actions {
        background: #111827;
        border-color: #374151;
      }

      .cancel-button {
        background: #374151;
        border-color: #4b5563;
        color: #e5e7eb;
      }
    }
  `]
})
export class CommentPopupComponent implements OnChanges {
  @Input() isOpen: boolean = false;
  @Input() storeId: string = '';
  @Input() storeName: string = '';
  @Input() visitId?: string;
  @Input() isVerified: boolean = false;
  @Input() showNoVisitWarning: boolean = false;

  @Output() closed = new EventEmitter<void>();
  @Output() commentSubmitted = new EventEmitter<{
    storeId: string;
    text: string;
    visitId?: string;
  }>();

  @ViewChild('commentInput') commentInputRef?: ElementRef<HTMLTextAreaElement>;

  isClosing: boolean = false;
  
  // Use signal for commentText so computed() can react to changes
  private readonly _commentText = signal<string>('');
  private readonly _isSubmitting = signal<boolean>(false);
  
  // Getter/setter for ngModel binding
  get commentText(): string {
    return this._commentText();
  }
  set commentText(value: string) {
    this._commentText.set(value);
  }
  
  readonly isSubmitting = computed(() => this._isSubmitting());
  readonly charCount = computed(() => this._commentText().length);
  readonly canSubmit = computed(() => 
    this._commentText().trim().length > 0 && !this._isSubmitting()
  );

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['isOpen']) {
      if (changes['isOpen'].currentValue) {
        this.onOpen();
      }
    }
  }

  private onOpen(): void {
    this._commentText.set('');
    this.isClosing = false;
    document.body.style.overflow = 'hidden';
    
    // Focus textarea after animation
    setTimeout(() => {
      this.commentInputRef?.nativeElement.focus();
    }, 300);
  }

  close(): void {
    this.isClosing = true;
    setTimeout(() => {
      this.isOpen = false;
      this.isClosing = false;
      document.body.style.overflow = '';
      this.closed.emit();
    }, 300);
  }

  onOverlayClick(): void {
    this.close();
  }

  onInput(): void {
    // Trigger change detection for character counter
  }

  submitComment(): void {
    if (!this.canSubmit()) return;

    this._isSubmitting.set(true);
    
    this.commentSubmitted.emit({
      storeId: this.storeId,
      text: this._commentText().trim(),
      visitId: this.visitId
    });
  }

  // Called by parent after API response
  finishSubmit(success: boolean): void {
    this._isSubmitting.set(false);
    if (success) {
      this.close();
    }
  }
}

