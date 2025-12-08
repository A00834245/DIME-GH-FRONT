import { CanActivateFn } from '@angular/router';

export const devBypassGuard: CanActivateFn = () => {
  console.warn('[DEV AUTH BYPASS] Route guard allowing navigation without MSAL.');
  return true;
};


