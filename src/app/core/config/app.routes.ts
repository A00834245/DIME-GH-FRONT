import { Routes } from '@angular/router';
import { MsalGuard } from '@azure/msal-angular';

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
    canActivate: [MsalGuard],
    loadChildren: () => import('@features/map/presentation/map.routes').then(m => m.MAP_ROUTES)
  },
  { path: '**', redirectTo: 'login' }
];
