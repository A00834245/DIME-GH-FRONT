import { Component, EventEmitter, Input, Output, HostListener, OnChanges, SimpleChanges, ElementRef, ViewChild, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-bottom-sheet',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="bottom-sheet-overlay" 
         *ngIf="isOpen" 
         (click)="onOverlayClick()"
         role="dialog"
         aria-modal="true"
         [attr.aria-labelledby]="title ? 'bottom-sheet-title' : null"
         [attr.aria-describedby]="message ? 'bottom-sheet-message' : null">
      <div class="bottom-sheet-container" 
           (click)="$event.stopPropagation()"
           #container>
        <!-- Handle bar -->
        <div class="bottom-sheet-handle" aria-hidden="true"></div>
        
        <!-- Header -->
        <div class="bottom-sheet-header" *ngIf="title">
          <h3 class="bottom-sheet-title" id="bottom-sheet-title">{{ title }}</h3>
        </div>
        
        <!-- Content -->
        <div class="bottom-sheet-content">
          <p class="bottom-sheet-message" id="bottom-sheet-message" *ngIf="message">{{ message }}</p>
          <ng-content></ng-content>
        </div>
        
        <!-- Actions -->
        <div class="bottom-sheet-actions">
          <button 
            #cancelButton
            class="bottom-sheet-button cancel-button" 
            (click)="onCancel()"
            type="button">
            {{ cancelText }}
          </button>
          <button 
            #confirmButton
            class="bottom-sheet-button confirm-button" 
            (click)="onConfirm()"
            type="button">
            {{ confirmText }}
          </button>
        </div>
      </div>
    </div>
  `,
  styleUrl: './bottom-sheet.component.css'
})
export class BottomSheetComponent implements OnChanges, AfterViewInit {
  @Input() isOpen: boolean = false;
  @Input() title: string = '';
  @Input() message: string = '';
  @Input() confirmText: string = 'Confirmar';
  @Input() cancelText: string = 'Cancelar';
  
  @Output() confirm = new EventEmitter<void>();
  @Output() cancel = new EventEmitter<void>();
  @Output() close = new EventEmitter<void>();

  @ViewChild('container') containerRef?: ElementRef<HTMLDivElement>;
  @ViewChild('cancelButton') cancelButtonRef?: ElementRef<HTMLButtonElement>;
  @ViewChild('confirmButton') confirmButtonRef?: ElementRef<HTMLButtonElement>;

  private previousActiveElement: HTMLElement | null = null;
  private focusableElements: HTMLElement[] = [];

  ngAfterViewInit(): void {
    // Initial setup if already open
    if (this.isOpen) {
      this.setupFocusTrap();
    }
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['isOpen']) {
      if (changes['isOpen'].currentValue) {
        // Modal opened
        this.onModalOpen();
      } else if (!changes['isOpen'].firstChange) {
        // Modal closed (not on first init)
        this.onModalClose();
      }
    }
  }

  private onModalOpen(): void {
    // Store the currently focused element to restore later
    this.previousActiveElement = document.activeElement as HTMLElement;
    
    // Disable body scroll
    document.body.style.overflow = 'hidden';
    
    // Setup focus trap after a short delay to ensure DOM is ready
    setTimeout(() => {
      this.setupFocusTrap();
    }, 100);
  }

  private onModalClose(): void {
    // Restore body scroll
    document.body.style.overflow = '';
    
    // Restore focus to the element that opened the modal
    if (this.previousActiveElement && this.previousActiveElement.focus) {
      this.previousActiveElement.focus();
    }
    this.previousActiveElement = null;
    this.focusableElements = [];
  }

  private setupFocusTrap(): void {
    if (!this.containerRef) {
      return;
    }

    // Get all focusable elements within the modal
    const container = this.containerRef.nativeElement;
    const focusableSelectors = [
      'button:not([disabled])',
      'a[href]',
      'input:not([disabled])',
      'select:not([disabled])',
      'textarea:not([disabled])',
      '[tabindex]:not([tabindex="-1"])'
    ].join(', ');

    this.focusableElements = Array.from(
      container.querySelectorAll<HTMLElement>(focusableSelectors)
    );

    // Set initial focus on the cancel button (safer default than confirm)
    if (this.cancelButtonRef?.nativeElement) {
      this.cancelButtonRef.nativeElement.focus();
    } else if (this.focusableElements.length > 0) {
      this.focusableElements[0].focus();
    }
  }

  @HostListener('document:keydown', ['$event'])
  onKeyDown(event: KeyboardEvent): void {
    if (!this.isOpen) {
      return;
    }

    // Handle Escape key
    if (event.key === 'Escape') {
      event.preventDefault();
      this.closeSheet();
      return;
    }

    // Handle Tab key for focus trap
    if (event.key === 'Tab') {
      this.handleTabKey(event);
    }
  }

  private handleTabKey(event: KeyboardEvent): void {
    if (this.focusableElements.length === 0) {
      event.preventDefault();
      return;
    }

    const firstElement = this.focusableElements[0];
    const lastElement = this.focusableElements[this.focusableElements.length - 1];
    const activeElement = document.activeElement;

    if (event.shiftKey) {
      // Shift + Tab: moving backwards
      if (activeElement === firstElement) {
        event.preventDefault();
        lastElement.focus();
      }
    } else {
      // Tab: moving forwards
      if (activeElement === lastElement) {
        event.preventDefault();
        firstElement.focus();
      }
    }
  }

  onConfirm(): void {
    this.confirm.emit();
    this.closeSheet();
  }

  onCancel(): void {
    this.cancel.emit();
    this.closeSheet();
  }

  onOverlayClick(): void {
    this.closeSheet();
  }

  private closeSheet(): void {
    this.isOpen = false;
    this.close.emit();
  }
}

