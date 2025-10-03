import { Routes } from '@angular/router';
import { MsalGuard } from '@azure/msal-angular';

export const routes: Routes = [
  { path: '', pathMatch: 'full', redirectTo: 'login' },
  {
    path: 'login',
    loadComponent: () => import('./presentation/pages/login/login.page').then(m => m.LoginPage)
  },
  {
    path: 'auth-callback',
    loadComponent: () => import('./presentation/pages/login/login.page').then(m => m.LoginPage)
  },
  {
    path: 'map',
    canActivate: [MsalGuard],
    loadComponent: () => import('./presentation/pages/map/map.page').then(m => m.MapPage)
  },
  { path: '**', redirectTo: 'login' }
];
