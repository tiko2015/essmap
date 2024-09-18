import { Component, inject } from '@angular/core';
import { MatListModule } from '@angular/material/list';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';

import { MatBottomSheetRef, MAT_BOTTOM_SHEET_DATA } from '@angular/material/bottom-sheet';
import { Entidad } from '../services/organization.service';

@Component({
  selector: 'app-bottom-sheet',
  standalone: true,
  imports: [MatListModule, MatCardModule, MatIconModule, MatButtonModule],
  templateUrl: './bottom-sheet.component.html',
  styleUrl: './bottom-sheet.component.scss'
})
export class BottomSheetComponent {
  entidad: Entidad | undefined = inject(MAT_BOTTOM_SHEET_DATA).entidad;
  provincia: string | undefined = inject(MAT_BOTTOM_SHEET_DATA).provincia;
  private _bottomSheetRef =
    inject<MatBottomSheetRef<BottomSheetComponent>>(MatBottomSheetRef);

  openLink(event: MouseEvent): void {
    this._bottomSheetRef.dismiss();
    event.preventDefault();
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
}
