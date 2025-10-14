import { Component, EventEmitter, Input, Output, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-bottom-sheet',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="bottom-sheet-overlay" 
         *ngIf="isOpen" 
         (click)="onOverlayClick()">
      <div class="bottom-sheet-container" 
           (click)="$event.stopPropagation()">
        <!-- Handle bar -->
        <div class="bottom-sheet-handle"></div>
        
        <!-- Header -->
        <div class="bottom-sheet-header" *ngIf="title">
          <h3 class="bottom-sheet-title">{{ title }}</h3>
        </div>
        
        <!-- Content -->
        <div class="bottom-sheet-content">
          <p class="bottom-sheet-message" *ngIf="message">{{ message }}</p>
          <ng-content></ng-content>
        </div>
        
        <!-- Actions -->
        <div class="bottom-sheet-actions">
          <button 
            class="bottom-sheet-button cancel-button" 
            (click)="onCancel()"
            type="button">
            {{ cancelText }}
          </button>
          <button 
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
export class BottomSheetComponent {
  @Input() isOpen: boolean = false;
  @Input() title: string = '';
  @Input() message: string = '';
  @Input() confirmText: string = 'Confirmar';
  @Input() cancelText: string = 'Cancelar';
  
  @Output() confirm = new EventEmitter<void>();
  @Output() cancel = new EventEmitter<void>();
  @Output() close = new EventEmitter<void>();

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

  @HostListener('document:keydown.escape')
  onEscapeKey(): void {
    if (this.isOpen) {
      this.closeSheet();
    }
  }
}

