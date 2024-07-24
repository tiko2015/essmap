import { Routes } from '@angular/router';
import { MapComponent } from './map/map.component';
import { DetailComponent } from './detail/detail.component';

export const routes: Routes = [
  { path: '', component: MapComponent, pathMatch: 'full' },
  { path: 'node/:nid', component: DetailComponent },
];
