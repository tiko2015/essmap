import { Component, inject } from '@angular/core';
import { MatListModule } from '@angular/material/list';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { HttpClient, HttpClientModule } from '@angular/common/http';
import { map } from 'rxjs/operators';

import { MatBottomSheetRef, MAT_BOTTOM_SHEET_DATA } from '@angular/material/bottom-sheet';
import { Entidad } from '../services/organization.service';

@Component({
  selector: 'app-bottom-sheet',
  standalone: true,
  imports: [MatListModule, MatCardModule, MatIconModule, MatButtonModule, HttpClientModule],
  templateUrl: './bottom-sheet.component.html',
  styleUrl: './bottom-sheet.component.scss'
})
export class BottomSheetComponent {
  entidad: Entidad | undefined = inject(MAT_BOTTOM_SHEET_DATA).entidad;
  http = inject(HttpClient);

  private _bottomSheetRef =
    inject<MatBottomSheetRef<BottomSheetComponent>>(MatBottomSheetRef);

  openLink(event: MouseEvent): void {
    //this._bottomSheetRef.dismiss();
    //event.preventDefault();

    // this.http.get(`https://essapp.coop/node/${this.entidad?.externalId}`, { responseType: 'text' }).pipe(
    //   map((response: any) => {
    //     const parser = new DOMParser();
    //     const htmlDoc = parser.parseFromString(response, 'text/html');
    //     const phoneElement = htmlDoc.querySelector('.views-field-field-telefono');
    //     const mailElement = htmlDoc.querySelector('.views-field-field-email');
    //     console.log('tel: ', phoneElement?.textContent);
    //     console.log('mail: ', mailElement?.textContent);
    //   })
    // ).subscribe();
  }

  link() {
    return `https://essapp.coop/node/${this.entidad?.externalId}`;
  }

  share() {
    const link = {
      title: this.entidad?.nombre,
      url: `./#${this.entidad?.nid}`,
      text: this.entidad?.nombre
    }
    if (navigator.share)
      navigator.share(link)
  }

  openGoogleMaps(destinationLat: string, destinationLng: string): void {

    const currentPosition = 'Current+Location';
    const destination = `${destinationLat},${destinationLng}`;
    const url = `https://www.google.com/maps/dir/${currentPosition}/${destination}`;

    window.open(url, '_blank');
  }
}
