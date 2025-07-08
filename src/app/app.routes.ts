import { Routes } from '@angular/router';
import { MapDrawerComponent } from './map-drawer/map.component';
import { DetailComponent } from './detail/detail.component';
import { SobreEssappComponent } from './sobre-essapp/sobre-essapp.component';
import { TerminosYCondicionesComponent } from './terminos-y-condiciones/terminos-y-condiciones.component';
import { PoliticaPrivacidadComponent } from './politica-privacidad/politica-privacidad.component';

export const routes: Routes = [
  { path: '', component: MapDrawerComponent, pathMatch: 'full' },
  { path: 'node/:nid', component: DetailComponent },
  { path: 'sobre-essapp', component: SobreEssappComponent, pathMatch: 'full' },
  { path: 'terminos-y-condiciones', component: TerminosYCondicionesComponent, pathMatch: 'full' },
  { path: 'politica-privacidad', component: PoliticaPrivacidadComponent, pathMatch: 'full' }
];
