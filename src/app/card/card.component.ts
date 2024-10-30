import { Component, Input, Output, EventEmitter, Inject } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { RouterLink } from '@angular/router';
import { Capacitor } from '@capacitor/core';
import { Share } from '@capacitor/share';
import { Entidad } from '../services/organization.service';

@Component({
  selector: 'app-card',
  standalone: true,
  imports: [MatButtonModule, MatCardModule, MatIconModule, RouterLink],
  templateUrl: './card.component.html',
  styleUrl: './card.component.scss'
})
export class CardComponent {
  @Input() entidad: Entidad | undefined;
  @Input() anchor: string = '';
  @Output() centerMap = new EventEmitter<object>();

  center() {
    if (!this.entidad) {
      return;
    }
    this.centerMap.emit(this.entidad);
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
      url: `${window.location.origin}/#${this.entidad?.nid}`, // URL completa para que funcione tanto en web como en Android
      text: this.entidad?.nombre
    };

    if (Capacitor.getPlatform() === 'web') {
      // Usar la Web Share API si está disponible en la web
      if (navigator.share) {
        navigator.share(link).catch(error => console.error('Error compartiendo en web:', error));
      } else {
        console.warn('Web Share API no está disponible en este navegador.');
      }
    } else {
      // Usar Capacitor Share en dispositivos móviles
      Share.share({
        title: link.title,
        text: link.text,
        url: link.url,
      }).catch(error => console.error('Error compartiendo en dispositivo:', error));
    }
  }
}
