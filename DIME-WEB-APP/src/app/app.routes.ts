import { Routes } from '@angular/router';

export const routes: Routes = [
  { path: '', pathMatch: 'full', redirectTo: 'login' },
  {
    path: 'login',
    loadComponent: () => import('./presentation/pages/login/login.page').then(m => m.LoginPage)
  },
  { path: '**', redirectTo: 'login' }
];
