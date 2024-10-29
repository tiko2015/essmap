import { Routes } from '@angular/router';
import { MapComponent } from './map/map.component';
import { MapDrawerComponent } from './map-drawer/map.component';
import { DetailComponent } from './detail/detail.component';
import { SobreEssappComponent } from './sobre-essapp/sobre-essapp.component';
import { TerminosYCondicionesComponent } from './terminos-y-condiciones/terminos-y-condiciones.component';

export const routes: Routes = [
  { path: '', component: MapDrawerComponent, pathMatch: 'full' },
  { path: 'old', component: MapComponent, pathMatch: 'full' },
  { path: 'node/:nid', component: DetailComponent },
  { path: 'sobre-essapp', component: SobreEssappComponent, pathMatch: 'full' },
  { path: 'terminos-y-condiciones', component: TerminosYCondicionesComponent, pathMatch: 'full' }
];
