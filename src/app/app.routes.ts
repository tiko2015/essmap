import { Routes } from '@angular/router';
import { MapComponent } from './map/map.component';
import { MapDrawerComponent } from './map-drawer/map.component';
import { DetailComponent } from './detail/detail.component';

export const routes: Routes = [
  { path: '', component: MapDrawerComponent, pathMatch: 'full' },
  { path: 'old', component: MapComponent, pathMatch: 'full' },
  { path: 'node/:nid', component: DetailComponent },
];
