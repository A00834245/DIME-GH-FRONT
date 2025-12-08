import { Routes } from '@angular/router';
import { MsalGuard } from '@azure/msal-angular';
import { environment } from '@core/environments/environment';
import { devBypassGuard } from '@core/guards/dev-bypass.guard';

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
    canActivate: [environment.authBypass ? devBypassGuard : MsalGuard],
    loadChildren: () => import('@features/map/presentation/map.routes').then(m => m.MAP_ROUTES)
  },
  {
    path: 'profile',
    canActivate: [environment.authBypass ? devBypassGuard : MsalGuard],
    loadChildren: () => import('@features/profile/presentation/profile.routes').then(m => m.PROFILE_ROUTES)
  },
  { path: '**', redirectTo: 'login' }
];
