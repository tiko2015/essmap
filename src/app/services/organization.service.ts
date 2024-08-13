import { Injectable } from '@angular/core';
import { Apollo } from 'apollo-angular';
import { GET_CHANNELS, GET_CHANNEL } from './graphql.operations';
import { Observable, map } from 'rxjs';

export interface Entidad {
  nid: string
  nombre: string
  latitud: string
  longitud: string
  tipo: string | null
  provincia: string
  descuentos: string
  ref_direccion: string
  direccion: string
  logo?: string
  subtitulo: string
  titulo_sede: string
  distance?: number
}
export interface Entidades {
  node: Entidad
}

export interface EntidadesList {
  totalItems: number
  items: Entidades[]
}
interface Filters {
  nombre: string
  name: string
  type: number | null
  take: number
  lat: number
  lng: number
}

interface Organization {
  code: string
  name: string
  description: string
  type: {
    id: string
    name: string
    code: string | null
  } | null
}

interface Point {
  type: "Point"
  coordinates: [number, number]
}

interface Channel {
  id: string
  fullName: string
  location: Point
  defaultAddress: string
  province: string
  streetLine1: string
  organization: Organization
}

@Injectable({
  providedIn: 'root'
})
export class OrganizationService {

  constructor(private apollo: Apollo) { }

  findOne(nid: string) {
    return this.apollo.watchQuery({
      query: GET_CHANNEL,
      variables: {
        id: nid
      }
    }).valueChanges.pipe(
      map(({ data, error }: any) => {
        const channel = data.organizationAddress;
        const entidad: Entidad = {
          nid: channel.id,
          nombre: channel.organization.name,
          latitud: channel.location.coordinates[1],
          longitud: channel.location.coordinates[0],
          tipo: channel.organization.type.code,
          provincia: channel.province,
          descuentos: '',
          ref_direccion: '',
          direccion: channel.streetLine1,
          logo: '',
          subtitulo: channel.organization.description,
          titulo_sede: channel.fullName,
        };
        return entidad;
      })
    );
  }

  getOrganizations(filters: Filters): Observable<EntidadesList> {
    console.log(filters.type)
    return this.apollo.watchQuery({
      query: GET_CHANNELS,
      variables: {
        latitude: filters.lat,
        longitude: filters.lng,
        take: filters.take,
        name: filters.nombre,
        type: filters.type
      }
    }).valueChanges.pipe(
      map(({ data, error }: any) => {
        let organizationAddresses = data.organizationAddressesByDistance.items;
        const entidades: Entidades[] = organizationAddresses.map((channel: Channel) => {
          return {
            node: {
              nid: channel.id,
              nombre: channel.organization.name,
              descripcion: channel.organization.description,
              telefono: '',
              email: '',
              latitud: channel.location.coordinates[1],
              longitud: channel.location.coordinates[0],
              tipo: channel.organization.type?.code,
              provincia: channel.province,
              descuentos: '',
              ref_direccion: '',
              direccion: channel.streetLine1,
              logo: '',
              subtitulo: channel.organization.description,
              titulo_sede: channel.fullName,
            }
          }
        });
        return { totalItems: data.organizationAddressesByDistance.totalItems, items: entidades };
      })
    );
  }

  findAll(filters: Filters) {
    return this.getOrganizations(filters);
  }
}
