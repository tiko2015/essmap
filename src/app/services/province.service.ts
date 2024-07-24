import { Injectable } from '@angular/core';
import { listadoProvincias } from './listadoProvincias';

@Injectable({
  providedIn: 'root'
})

export class ProvinceService {

  constructor() {}
  findAll() {
    return listadoProvincias;
  }

  findOne(key: string): string | undefined {
    const provincia = listadoProvincias.find(provincia => provincia.key === key);
    return provincia ? provincia.name : undefined;
  }

}
