import { Injectable } from '@angular/core';
import { listadoEntidades, Entidades, Entidad } from './listadoEntidades'
import { Apollo } from 'apollo-angular';
import { GET_CHANNELS } from './graphql.operations';
import { Observable, map } from 'rxjs';

interface Filters {
  nombre: string
  provincia: string
  tipo: string
  lat: number
  lng: number
}

export interface Channel {
  name: string
  token: string
  lat: number
  lng: number
}

@Injectable({
  providedIn: 'root'
})
export class OrganizationService {

  constructor(private apollo: Apollo) {}

  findOne(entidades: Entidades[], nid: string) {
    const entidad = entidades.find(entidad => entidad.node.nid === nid);
    return entidad ? entidad.node : null;
  }

  getOrganizations(): Observable<Entidades[]> {
    return this.apollo.watchQuery({
      query: GET_CHANNELS
    }).valueChanges.pipe(
      map(({data, error} : any) => {
        let channels = data.channels.filter(
          (channel: any) => channel.customFields.geolocationStore!== null &&
          channel.customFields.geolocationStore.includes('coordinates')
        );
        const entidades: Entidades[] = channels.map((channel: any) => {
          return {
            node: {
              nid: channel.token,
              nombre: channel.code,
              descripcion: channel.customFields.description,
              telefono: '',
              email: '',
              latitud: JSON.parse(channel.customFields.geolocationStore).features[0].geometry.coordinates[1],
              longitud: JSON.parse(channel.customFields.geolocationStore).features[0].geometry.coordinates[0],
              tipo: 'chasqui',
              provincia: channel.customFields.zoneStore,
              descuentos: '',
              ref_direccion: '',
              direccion: '',
              logo: channel.customFields.imgLogo ? 'https://chasqui.qa.1961.com.ar' + channel.customFields.imgLogo?.preview : '',
              subtitulo: channel.customFields.storeEnabled ? 'Abierto' : 'Cerrado',
              titulo_sede: '',
            }
          }
        });
        return [...listadoEntidades, ...entidades];
      })
    );
  }

  findAll(entidades: Entidades[], filters: Filters) {
    if(filters.nombre !== '') {
      entidades = entidades.filter(organization =>
        organization.node.nombre.toLowerCase().includes(filters.nombre.toLowerCase())
      );
    }
    if(filters.provincia !== 'todos') {
      entidades = entidades.filter(organization =>
        organization.node.provincia === filters.provincia
      );
    }
    if(filters.tipo !== 'todos') {
      entidades = entidades.filter(organization =>
        organization.node.tipo === filters.tipo
      );
    }
    return this.getOrderByDistance(entidades, filters.lat, filters.lng);
  }

  getOrderByDistance(uniqueNodes: Entidades[], lat: number, lng: number) {
    for ( let i = 0; i < uniqueNodes.length; i++) {
      uniqueNodes[i].node.distance = this.calculateDistance(
        parseFloat(uniqueNodes[i].node.latitud),
        parseFloat(uniqueNodes[i].node.longitud),
        lat,lng,"K");
    }
    uniqueNodes.sort(function(a: any, b: any) {
      return a.node.distance - b.node.distance;
    });

    return uniqueNodes;
  }

  calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number, unit: string) {
    var radlat1 = Math.PI * lat1/180
    var radlat2 = Math.PI * lat2/180
    var radlon1 = Math.PI * lon1/180
    var radlon2 = Math.PI * lon2/180
    var theta = lon1-lon2
    var radtheta = Math.PI * theta/180
    var dist = Math.sin(radlat1) * Math.sin(radlat2) + Math.cos(radlat1) * Math.cos(radlat2) * Math.cos(radtheta);
    dist = Math.acos(dist)
    dist = dist * 180/Math.PI
    dist = dist * 60 * 1.1515
    if (unit=="K") { dist = dist * 1.609344 }
    if (unit=="N") { dist = dist * 0.8684 }
    return dist
  }
}
