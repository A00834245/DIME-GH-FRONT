import { Routes } from '@angular/router';
import { MapComponent } from './map';
import { HomeComponent } from './home';

export const routes: Routes = [
  { path: '', component: HomeComponent },
  { path: 'map', component: MapComponent }
];
