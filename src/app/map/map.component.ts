import { Component, inject, ChangeDetectorRef } from '@angular/core';
import { RouterLink, RouterOutlet, Router, ActivatedRoute } from '@angular/router';
import { ViewportScroller, CommonModule } from "@angular/common";
import { FormsModule } from '@angular/forms';
import { LeafletModule } from '@asymmetrik/ngx-leaflet';
import { latLng, tileLayer, marker, Marker, icon, circle, Circle } from 'leaflet';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatChipsModule } from '@angular/material/chips';

import { OrganizationService, Channel } from '../services/organization.service';
import { ProvinceService } from '../services/province.service';
import { TipoService } from '../services/tipo.service';
import { Provincia } from '../services/listadoProvincias';
import { Entidad, Entidades } from '../services/listadoEntidades'
import { Tipo } from '../services/listadoTipos';
import { CardComponent } from '../card/card.component';
import { Observable } from 'rxjs';

@Component({
  selector: 'app-map',
  standalone: true,
  imports: [
    CommonModule,
    RouterOutlet,
    RouterLink,
    LeafletModule,
    FormsModule,
    CardComponent,
    MatIconModule,
    MatButtonModule,
    MatCardModule,
    MatChipsModule

  ],
  templateUrl: './map.component.html',
  styleUrl: './map.component.scss'
})
export class MapComponent {
  title = 'essapp';
  filters = {
    nombre: '',
    provincia: 'todos',
    tipo: 'todos',
    lat: -34.6037389,
    lng: -58.3815704,
  }
  nombre = '';
  organizationService = inject(OrganizationService);
  provinceService = inject(ProvinceService);
  tipoService = inject(TipoService);
  organizations: Entidades[] = [];
  filteredOrganizations: Entidades[] | [] = [];
  filterTotal = this.organizations.length;
  provincias: Provincia[] = this.provinceService.findAll();
  tipos: Tipo[] = this.tipoService.findAll();
  options = {
    layers: [
      tileLayer("https://wms.ign.gob.ar/geoserver/gwc/service/tms/1.0.0/capabaseargenmap@EPSG%3A3857@png/{z}/{x}/{y}.png", {
        tms: true,
        attribution: '<a href="http://www.ign.gob.ar/AreaServicios/Argenmap/IntroduccionV2" target="_blank">Instituto Geográfico Nacional</a>&nbsp;-&nbsp;<a href="http://www.osm.org/copyright" target="_blank">OpenStreetMap</a>'
      })
    ],
    zoom: 15,
    center: latLng(this.filters.lat, this.filters.lng),
    attributionControl: false,
    zoomControl: false,
    preferCanvas: true,
  };
  layers: any[] = [];
  anchor: string = '';
  router = inject(Router);
  viewportScroller = inject(ViewportScroller);
  cdr = inject(ChangeDetectorRef);
  reload = false;
  activatedRoute: ActivatedRoute = inject(ActivatedRoute);
  nid: string | null = null;
  listadoActivo: boolean = false;


  constructor() { }


  ngOnInit() {

    this.organizationService.getOrganizations().subscribe((data: any) => {
      this.organizations = data;

      this.nid = this.activatedRoute.snapshot.fragment;
      let anchor: Entidad | null = null;
      if (this.nid) {
        anchor = this.organizationService.findOne(data, this.nid);
        if (anchor) {
          this.options.center = latLng(parseFloat(anchor.latitud), parseFloat(anchor.longitud))
          this.filterOrganizations();
          this.markerOnClick(this.nid, true);
          return;
        }
      }

      this.getUserLocation();
    });
  }

  touch($event: any) {
    console.log($event)
  }

  getUserLocation() {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(position => {
        this.options.center = latLng(position.coords.latitude, position.coords.longitude);
        this.options.zoom = 15;
        this.filterOrganizations();
      });
    } else {
      this.filterOrganizations();
    }
  }

  setTipo(tipo: string) {
    this.filters.tipo = tipo;
    this.filterOrganizations();
  }

  filterOrganizations() {
    const data = this.organizations;
    this.reload = false;
    this.filters.lat = this.options.center.lat;
    this.filters.lng = this.options.center.lng;

    const layers = this.organizationService.findAll(data, this.filters);
    this.filteredOrganizations = layers.slice(0, 100);
    this.filterTotal = layers.length;


    this.layers = this.filteredOrganizations.map(
      (organization: Entidades) =>
        marker([parseFloat(organization.node.latitud), parseFloat(organization.node.longitud)], {
          title: organization.node.nid,
          icon: icon({
            iconSize: [25, 41],
            iconAnchor: [13, 41],
            iconUrl: `../assets/icon/icon_${organization.node.tipo}.png`,
            shadowUrl: 'leaflet/marker-shadow.png',
            popupAnchor: [0, -50]
          })
        })
          .on('click', (e) => this.markerOnClick(organization.node.nid))
          .bindPopup(organization.node.nombre)
    );


    // para identificar mi localización
    // if (navigator.geolocation) {
    //   this.layers.push(circle([ this.filters.lat, this.filters.lng ], { radius: 100 }));
    // }
  }

  reloadOnClick() {
    this.filterOrganizations();
    this.viewportScroller.scrollToPosition([0, 0]);
    this.router.navigateByUrl('/');
    this.anchor = '';
  }

  markerOnClick(organizationId: string, fromList: boolean = false): void {
    this.listadoActivo = true;
    this.anchor = organizationId;
    this.cdr.detectChanges();
    this.router.navigate([], { fragment: organizationId });

    if (fromList) {
      const popup = this.layers.find(layer => layer.options.title === organizationId);
      popup.openPopup();
      return;
    }
    setTimeout(() => {
      const element = document.getElementById(organizationId);
      if (element) {
        element.scrollIntoView({ behavior: 'smooth', block: 'start', inline: 'nearest' });
      }
    }, 500);

  }

  verListado(listadoActivo = this.listadoActivo): void {
    this.listadoActivo = listadoActivo ? false : true;
  }

  getProvincia(key: string) {
    return this.provinceService.findOne(key);
  }

  centerChange(): void {
    this.reload = true;
  }

  centerMap(event: any) {
    setTimeout(() => {
      this.options.center = latLng(event.lat, event.lng);
    }, 500);
    this.markerOnClick(event.id, true);
  }
}
