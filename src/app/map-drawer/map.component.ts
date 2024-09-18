import { Component, inject, OnInit, NgZone } from '@angular/core';
import { RouterLink, RouterOutlet, Router, ActivatedRoute } from '@angular/router';
import { ViewportScroller, CommonModule } from "@angular/common";
import { FormsModule } from '@angular/forms';
import { LeafletModule } from '@asymmetrik/ngx-leaflet';
import { latLng, tileLayer, marker, icon, Map } from 'leaflet';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatChipsModule } from '@angular/material/chips';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatDividerModule } from '@angular/material/divider';
import { MatListModule } from '@angular/material/list';
import {
  MatBottomSheet,
  MatBottomSheetModule,
} from '@angular/material/bottom-sheet';
import { BottomSheetComponent } from '../bottom-sheet/bottom-sheet.component';

import { OrganizationService, EntidadesList, Entidad, Entidades } from '../services/organization.service';
import { ProvinceService, Provincia } from '../services/province.service';
import { TipoService } from '../services/tipo.service';
import { CardComponent } from '../card/card.component';

export interface Tipo {
  id: string;
  name: string;
}

export interface Filters {
  name: string;
  nombre: string;
  type: number | null;
  provincia: string;
  tipo: string;
  lat: number;
  lng: number;
  take: number;
}

@Component({
  selector: 'app-map-drawer',
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
    MatBottomSheetModule,
    MatCardModule,
    MatChipsModule,
    MatSidenavModule,
    MatDividerModule,
    MatListModule,
  ],
  templateUrl: './map.component.html',
  styleUrl: './map.component.scss'
})
export class MapDrawerComponent implements OnInit {
  title = 'essapp';
  filters: Filters = {
    name: '',
    nombre: '',
    type: null,
    provincia: 'todos',
    tipo: 'todos',
    lat: -34.6037389,
    lng: -58.3815704,
    take: 100,
  }
  nombre = '';
  organizationService = inject(OrganizationService);
  provinceService = inject(ProvinceService);
  tipoService = inject(TipoService);
  organizations: Entidades[] = [];
  filteredOrganizations: Entidades[] | [] = [];
  filterTotal = this.organizations.length;
  provincias: Provincia[] = this.provinceService.findAll();
  tipos: Tipo[] = [];
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
  reload = false;
  activatedRoute: ActivatedRoute = inject(ActivatedRoute);
  nid: string | null = null;
  listadoActivo: boolean = false;

  private _bottomSheet = inject(MatBottomSheet);
  private zone = inject(NgZone);

  openBottomSheet(organization: Entidad): void {
    this._bottomSheet.open(BottomSheetComponent, {
      data: {
        entidad: organization,
        provincia: this.getProvincia(organization.provincia)
      }
    });
  }

  constructor() { }


  ngOnInit() {

    this.nid = this.activatedRoute.snapshot.fragment;
    this.tipoService.findAll().subscribe(types => {
      this.tipos = types;
    }, error => {
      console.error(error);
    });

    if (this.nid) {
      this.organizationService.findOne(this.nid).subscribe(async (anchor: any) => {
        if (anchor) {
          this.options.center = latLng(anchor.latitud, anchor.longitud);
          await this.filterOrganizations();


          setTimeout(() => {
            if (this.nid) {
              this.markerOnClick(anchor, true);
            }
          }, 500);

          return;
        }
      });

    } else {
      this.getUserLocation();
      this.filterOrganizations();
    }

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
    this.filters.type = tipo !== 'todos' ? parseInt(tipo) : null;
    this.filterOrganizations();
  }

  filterOrganizations() {
    this.reload = false;
    this.filters.lat = this.options.center.lat;
    this.filters.lng = this.options.center.lng;

    this.organizationService.findAll(this.filters)
      .subscribe((data: EntidadesList) => {
        this.filteredOrganizations = data.items;
        this.filterTotal = data.totalItems;


        this.layers = this.filteredOrganizations.map(
          (organization: Entidades) =>
            marker([parseFloat(organization.node.latitud), parseFloat(organization.node.longitud)], {
              title: organization.node.nid,
              icon: icon({
                iconSize: [25, 41],
                iconAnchor: [13, 41],
                iconUrl: `../assets/icon/icon_${organization.node.tipo ? organization.node.tipo : 'cooperativas'}.png`,
                shadowUrl: 'leaflet/marker-shadow.png',
                popupAnchor: [0, -50]
              })
            })
              .on('click', (e) => this.markerOnClick(organization.node))
              .bindPopup(`${organization.node.nombre}`)
        );
      });



    // para identificar mi localización
    // if (navigator.geolocation) {
    //   this.layers.push(circle([ this.filters.lat, this.filters.lng ], { radius: 100 }));
    // }
  }

  reloadOnClick() {
    this.filterOrganizations();
    this.viewportScroller.scrollToPosition([0, 0]);
    this.anchor = '';
  }

  markerOnClick(organization: Entidad, fromList: boolean = false): void {
    this.anchor = organization.nid;
    this.router.navigate([], { fragment: organization.nid });
    this.zone.run(() => {
      this.openBottomSheet(organization);
    });
    if (fromList) {
      const popup = this.layers.find(layer => layer.options.title === organization.nid);
      popup.openPopup();
      return;
    }
    return;
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

  centerMap(entidad: Entidad) {
    this.verListado();
    setTimeout(() => {
      this.options.center = latLng(Number(entidad.latitud), Number(entidad.longitud));
    }, 500);
    setTimeout(() => {
      this.options.center = latLng(Number(entidad.latitud), Number(entidad.longitud));
      this.markerOnClick(entidad, true);
    }, 700);


  }
  onMapReady(map: Map): void {
    setTimeout(() => {
      map.invalidateSize();
    });
  }
}
