import { Routes } from '@angular/router';
import { MsalGuard } from '@azure/msal-angular';
import { bypassGuard } from '@core/guards/bypass.guard';
import { environment } from '@core/environments/environment';

// Use MsalGuard in production, bypass guard in development (when MSAL is disabled)
const authGuard = environment.enableMsal ? [MsalGuard] : [bypassGuard];

export const routes: Routes = [
  { path: '', pathMatch: 'full', redirectTo: 'login' },
  {
    path: 'login',
    loadChildren: () => import('@features/login/presentation/login.routes').then(m => m.LOGIN_ROUTES)
  },
  {
    path: 'auth-callback',
    loadChildren: () => import('@features/login/presentation/login.routes').then(m => m.LOGIN_ROUTES)
  },
  {
    path: 'map',
    canActivate: authGuard,
    loadChildren: () => import('@features/map/presentation/map.routes').then(m => m.MAP_ROUTES)
  },
  { path: '**', redirectTo: 'login' }
];
