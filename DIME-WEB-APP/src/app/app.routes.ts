import { Routes } from '@angular/router';
import { Component } from '@angular/core';
import { MapComponent } from './map';

// Empty component for root route
@Component({
  selector: 'app-empty',
  template: ''
})
export class EmptyComponent {}

export const routes: Routes = [
  { path: '', component: EmptyComponent },
  { path: 'map', component: MapComponent }
];
