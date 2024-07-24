import { Component, Input, Output, EventEmitter, Inject } from '@angular/core';
import {MatButtonModule} from '@angular/material/button';
import {MatCardModule} from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { Entidad } from '../services/listadoEntidades';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-card',
  standalone: true,
  imports: [MatButtonModule, MatCardModule, MatIconModule, RouterLink],
  templateUrl: './card.component.html',
  styleUrl: './card.component.scss'
})
export class CardComponent {
  @Input() entidad: Entidad | undefined;
  @Input() provincia: string | undefined = '';
  @Input() anchor: string = '';
  @Output() centerMap = new EventEmitter<object>();

  center() {
    if (!this.entidad) {
      return;
    }
    this.centerMap.emit({
      id: this.entidad.nid,
      lat: parseFloat(this.entidad.latitud),
      lng: parseFloat(this.entidad.longitud)
    });
  }

  link() {
    if (this.entidad?.tipo === 'chasqui') {
      return 'https://chasqui.qa.1961.com.ar/' + this.entidad?.nid;
    }
    return 'https://essapp.coop/node/' + this.entidad?.nid;
  }
  share() {
    const link = {
      title: this.entidad?.nombre,
      url: `./#${this.entidad?.nid}`,
      text: this.entidad?.nombre
    }
    if(navigator.share)
      navigator.share(link)
  }
}
