import { Injectable, signal, computed } from '@angular/core';

/**
 * Service to track unsaved changes across the application.
 * 
 * Usage:
 * 1. In a component with a form, call `registerForm('formId')` on init
 * 2. When form becomes dirty/modified, call `markAsDirty('formId')`
 * 3. When form is saved or reset, call `markAsPristine('formId')`
 * 4. On component destroy, call `unregisterForm('formId')`
 * 
 * To check for unsaved changes globally:
 * - Use `hasUnsavedChanges()` to get boolean
 * - Use `getUnsavedFormIds()` to get list of dirty form IDs
 */
@Injectable({
  providedIn: 'root'
})
export class UnsavedChangesService {
  // Map of form IDs to their dirty state
  private readonly formsState = signal<Map<string, boolean>>(new Map());
  
  // Computed signal to check if any form has unsaved changes
  public readonly hasUnsavedChanges = computed(() => {
    const state = this.formsState();
    return Array.from(state.values()).some(isDirty => isDirty);
  });

  /**
   * Register a form to be tracked for unsaved changes
   */
  registerForm(formId: string): void {
    const currentState = new Map(this.formsState());
    currentState.set(formId, false); // Start as pristine
    this.formsState.set(currentState);
    console.log(`[UnsavedChanges] Registered form: ${formId}`);
  }

  /**
   * Unregister a form (call on component destroy)
   */
  unregisterForm(formId: string): void {
    const currentState = new Map(this.formsState());
    currentState.delete(formId);
    this.formsState.set(currentState);
    console.log(`[UnsavedChanges] Unregistered form: ${formId}`);
  }

  /**
   * Mark a form as having unsaved changes
   */
  markAsDirty(formId: string): void {
    const currentState = new Map(this.formsState());
    if (currentState.has(formId)) {
      currentState.set(formId, true);
      this.formsState.set(currentState);
      console.log(`[UnsavedChanges] Form marked as dirty: ${formId}`);
    } else {
      console.warn(`[UnsavedChanges] Attempted to mark unknown form as dirty: ${formId}`);
    }
  }

  /**
   * Mark a form as pristine (no unsaved changes)
   */
  markAsPristine(formId: string): void {
    const currentState = new Map(this.formsState());
    if (currentState.has(formId)) {
      currentState.set(formId, false);
      this.formsState.set(currentState);
      console.log(`[UnsavedChanges] Form marked as pristine: ${formId}`);
    } else {
      console.warn(`[UnsavedChanges] Attempted to mark unknown form as pristine: ${formId}`);
    }
  }

  /**
   * Get list of form IDs that have unsaved changes
   */
  getUnsavedFormIds(): string[] {
    const state = this.formsState();
    return Array.from(state.entries())
      .filter(([_, isDirty]) => isDirty)
      .map(([formId, _]) => formId);
  }

  /**
   * Check if a specific form has unsaved changes
   */
  isFormDirty(formId: string): boolean {
    return this.formsState().get(formId) ?? false;
  }

  /**
   * Clear all unsaved changes (use carefully, e.g., after successful save-all)
   */
  clearAll(): void {
    const currentState = new Map(this.formsState());
    currentState.forEach((_, key) => currentState.set(key, false));
    this.formsState.set(currentState);
    console.log('[UnsavedChanges] Cleared all unsaved changes');
  }

  /**
   * Get total count of forms with unsaved changes
   */
  getUnsavedCount(): number {
    return this.getUnsavedFormIds().length;
  }
}

