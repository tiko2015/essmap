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
}
