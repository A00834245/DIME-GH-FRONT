import { inject } from '@angular/core';
import { Router, CanActivateFn } from '@angular/router';

/**
 * Bypass Guard for development when MSAL is disabled
 * Always allows navigation through - use only in development
 */
export const bypassGuard: CanActivateFn = () => {
    console.log('[BYPASS GUARD] Allowing access - MSAL is disabled for development');
    return true;
};

