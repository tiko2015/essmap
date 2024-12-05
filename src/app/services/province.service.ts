import { Injectable } from '@angular/core';

export interface Province {
  id: string;
  name: string;
}

@Injectable({
  providedIn: 'root'
})

export class ProvinceService {

  constructor() { }
  findAll(): Province[] {
    return listadoProvincias;
  }

  findOne(id: string): string | undefined {
    const provincia = listadoProvincias.find(provincia => provincia.id === id);
    return provincia ? provincia.name : undefined;
  }

}

const listadoProvincias: Province[] = [
  { id: 'K', name: 'Catamarca' },
  { id: 'H', name: 'Chaco' },
  { id: 'U', name: 'Chubut' },
  { id: 'C', name: 'Ciudad Autónoma de Buenos Aires' },
  { id: 'X', name: 'Córdoba' },
  { id: 'W', name: 'Corrientes' },
  { id: 'E', name: 'Entre Ríos' },
  { id: 'P', name: 'Formosa' },
  { id: 'Y', name: 'Jujuy' },
  { id: 'L', name: 'La Pampa' },
  { id: 'F', name: 'La Rioja' },
  { id: 'M', name: 'Mendoza' },
  { id: 'N', name: 'Misiones' },
  { id: 'Q', name: 'Neuquén' },
  { id: 'B', name: 'Pcia. de Buenos Aires' },
  { id: 'R', name: 'Río Negro' },
  { id: 'A', name: 'Salta' },
  { id: 'J', name: 'San Juan' },
  { id: 'D', name: 'San Luis' },
  { id: 'Z', name: 'Santa Cruz' },
  { id: 'S', name: 'Santa Fe' },
  { id: 'G', name: 'Santiago del Estero' },
  { id: 'V', name: 'Tierra del Fuego' },
  { id: 'T', name: 'Tucumán' }
];