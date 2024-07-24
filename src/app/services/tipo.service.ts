import { Injectable } from '@angular/core';
import { listadoTipos } from './listadoTipos'

@Injectable({
  providedIn: 'root'
})
export class TipoService {

  constructor() { }

  findAll() {
    return listadoTipos;
  }

  findOne(key: string): string | undefined {
    const tipo = listadoTipos.find(tipo => tipo.key === key);
    return tipo ? tipo.name : undefined;
  }

}
