import { Observable, Subject, of } from 'rxjs';
import { catchError, tap, takeUntil } from 'rxjs/operators';
import { Component, inject, OnInit, NgZone } from '@angular/core';
import { RouterLink, RouterOutlet, Router, ActivatedRoute } from '@angular/router';
import { ViewportScroller, CommonModule } from "@angular/common";
import { FormsModule } from '@angular/forms';
import { LeafletModule } from '@asymmetrik/ngx-leaflet';
import { LatLngBounds, Marker } from 'leaflet';
import { latLng, tileLayer, marker, icon, Map, circleMarker, circle } from 'leaflet';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatChipsModule } from '@angular/material/chips';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatDividerModule } from '@angular/material/divider';
import { MatListModule } from '@angular/material/list';
import { MatSelectModule } from '@angular/material/select';

import {
  MatBottomSheet,
  MatBottomSheetModule,
} from '@angular/material/bottom-sheet';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar } from '@angular/material/snack-bar';

import { Capacitor } from '@capacitor/core';
import { Geolocation } from '@capacitor/geolocation';
import { BottomSheetComponent } from '../bottom-sheet/bottom-sheet.component';

import { OrganizationService, EntidadesList, Entidad, Entidades } from '../services/organization.service';
import { TipoService } from '../services/tipo.service';
import { CardComponent } from '../card/card.component';
import { Province, ProvinceService } from '../services/province.service';

export interface Tipo {
  id: string;
  name: string;
}

export interface Filters {
  name: string;
  nombre: string;
  type: number | null;
  province: string | null;
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
    MatProgressSpinnerModule,
    MatSelectModule,
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
    province: null,
    lat: -34.6037389,
    lng: -58.3815704,
    take: 200,
  }
  nombre = '';
  organizationService = inject(OrganizationService);
  tipoService = inject(TipoService);
  provinceService = inject(ProvinceService);
  organizations: Entidades[] = [];
  filteredOrganizations: Entidades[] | [] = [];
  filteredOrganizations$: Observable<EntidadesList> = of({ items: [], totalItems: 0 });
  filterTotal = this.organizations.length;
  tipos: Tipo[] = [];
  provincias: Province[] = [];
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
  };
  layers: any[] = [];
  popMarker: Marker | null = null;
  anchor: string = '';
  router = inject(Router);
  viewportScroller = inject(ViewportScroller);
  reload = false;
  activatedRoute: ActivatedRoute = inject(ActivatedRoute);
  nid: string | null = null;
  listadoActivo: boolean = false;
  isLoading = true;

  private _bottomSheet = inject(MatBottomSheet);
  private zone = inject(NgZone);
  private _snackBar = inject(MatSnackBar);
  private destroy$ = new Subject<void>();

  private readonly typeColors: { [key: string]: { color: string, fillColor: string } } = {
    'cooperativas': { color: '#42b466', fillColor: '#42b466' },
    'ferias': { color: '#a92090', fillColor: '#a92090' },
    'medios': { color: '#f47d30', fillColor: '#f47d30' },
    'universidades': { color: '#489dd1', fillColor: '#489dd1' }
  };

  onFilterChange(fitBounds: boolean = true): void {
    this.filterOrganizations$(fitBounds)
      .pipe(takeUntil(this.destroy$))
      .subscribe();
  }


  openBottomSheet(organization: Entidad): void {
    this._bottomSheet.open(BottomSheetComponent, {
      data: {
        entidad: organization,
      }
    });
  }

  constructor() { }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }


  ngOnInit() {
    this.nid = this.activatedRoute.snapshot.fragment;

    this.tipoService.findAll().subscribe(
      types => {
        this.tipos = types;
      },
      error => {
        console.error(error);
      }
    );

    this.provincias = this.provinceService.findAll();

    if (this.nid) {
      // Si `nid` está definido, obtenemos la organización y centramos el mapa en ella
      this.organizationService.findOne(this.nid).subscribe(async (anchor: any) => {
        if (anchor) {
          this.options.center = latLng(anchor.latitud, anchor.longitud);
          this.filterOrganizations$()
            .pipe(
              takeUntil(this.destroy$),
              tap(() => this.markerOnClick(anchor, true))
            )
            .subscribe();
        }
      });
    } else {
      // Si `nid` no está definido, obtenemos la ubicación del usuario
      this.getUserLocation();
    }
  }

  async getUserLocation() {
    if (Capacitor.getPlatform() === 'web') {
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          async position => {
            this.options.center = latLng(position.coords.latitude, position.coords.longitude);
            this.options.zoom = 15;
            this.filterOrganizations$()
              .pipe(takeUntil(this.destroy$))
              .subscribe();

          },
          error => {
            console.error('Error obteniendo la ubicación en la web:', error);
            this.filterOrganizations$()
              .pipe(takeUntil(this.destroy$))
              .subscribe();

          }
        );
      } else {
        console.warn('Geolocalización no soportada en este navegador.');
        this.filterOrganizations$()
          .pipe(takeUntil(this.destroy$))
          .subscribe();

      }
    } else {
      try {
        const position = await Geolocation.getCurrentPosition();
        this.options.center = latLng(position.coords.latitude, position.coords.longitude);
        this.options.zoom = 15;
        this.filterOrganizations$()
          .pipe(takeUntil(this.destroy$))
          .subscribe();

      } catch (error) {
        console.error('Error obteniendo la ubicación en el dispositivo:', error);
        this._snackBar.open('Error obteniendo la ubicación en el dispositivo', 'Cerrar', {
          duration: 3000,  // La notificación se mostrará por 3 segundos
          verticalPosition: 'top'  // Opcional: Posición en la parte superior de la pantalla
        });
        this.filterOrganizations$()
          .pipe(takeUntil(this.destroy$))
          .subscribe();

      }
    }
  }

  filterOrganizations$(fitBounds: boolean = true): Observable<EntidadesList> {
    this.reload = false;
    this.isLoading = true;
    this.filters.lat = this.options.center.lat;
    this.filters.lng = this.options.center.lng;

    return this.organizationService.findAll(this.filters).pipe(
      tap((data: EntidadesList) => {
        this.filteredOrganizations = data.items;
        this.filterTotal = data.totalItems;

        this.layers = this.filteredOrganizations.map(
          (organization: Entidades) => {
            const colors = this.typeColors[organization.node.tipo] || {
              color: '#42b466',
              fillColor: '#3388ff'
            };
            return circleMarker(
              [parseFloat(organization.node.latitud), parseFloat(organization.node.longitud)],
              {
                radius: 5,
                color: colors.color,
                fillColor: colors.fillColor,
                fillOpacity: 0.5,
                weight: 1,
                opacity: 1,
              }
            ).on('click', () => this.markerOnClick(organization.node));
          }
        );

        if (navigator.geolocation) {
          this.layers.push(circle([this.filters.lat, this.filters.lng], { radius: 5 }));
        }

        const coordinates = this.extractCoordinates(data.items);
        if (coordinates.length > 0 && fitBounds) {
          const bounds = this.calculateBounds(coordinates);
          this.options.center = latLng(bounds.getCenter());
          setTimeout(() => {
            this.layers[0]?._map?.fitBounds(bounds, { padding: [20, 20] });
          }, 300);
        }

        this.isLoading = false;
      }),
      catchError(error => {
        this.isLoading = false;
        console.error('Error al obtener las organizaciones', error);
        this._snackBar.open('Error al obtener las organizaciones', 'Cerrar', {
          duration: 3000,
          verticalPosition: 'top'
        });
        return of({ items: [], totalItems: 0 }); // fallback
      })
    );
  }


  reloadOnClick() {
    this.filters.nombre = '';
    this.filters.type = null;
    this.filters.province = null;
    this.viewportScroller.scrollToPosition([0, 0]);
    this.anchor = '';
    this.filterOrganizations$(false)
      .pipe(takeUntil(this.destroy$))
      .subscribe();

  }

  markerOnClick(organization: Entidad, fromList: boolean = false): void {
    this.anchor = organization.nid;
    this.router.navigate([], { fragment: organization.nid });

    if (this.popMarker) {
      this.popMarker.remove();
    }
    this.popMarker = marker([parseFloat(organization.latitud), parseFloat(organization.longitud)], {
      title: organization.nid,
      icon: icon({
        iconSize: [25, 41],
        iconAnchor: [13, 41],
        iconUrl: `../assets/icon/icon_${organization.tipo ? organization.tipo : 'cooperativas'}.png`,
        shadowUrl: 'leaflet/marker-shadow.png',
        popupAnchor: [0, -50]
      })
    }).on('click', () => this.markerOnClick(organization));
    this.layers.push(this.popMarker);

    this.zone.run(() => {
      this.openBottomSheet(organization);
    });
    if (fromList && this.layers.length > 0) {
      const popup = this.layers.find(layer => layer.options.title === organization.nid);
      popup.openPopup();
      return;
    }
    return;
  }

  verListado(listadoActivo = this.listadoActivo): void {
    this.listadoActivo = listadoActivo ? false : true;
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

  private calculateBounds(coords: [number, number][]): LatLngBounds {
    const bounds = new LatLngBounds(coords);
    return bounds;
  }

  private extractCoordinates(entidades: Entidades[]): [number, number][] {
    return entidades
      .map(entidad => {
        const lat = parseFloat(entidad.node.latitud);
        const lng = parseFloat(entidad.node.longitud);
        return isNaN(lat) || isNaN(lng) ? null : [lat, lng];
      })
      .filter(coord => coord !== null) as [number, number][];
  }

}
