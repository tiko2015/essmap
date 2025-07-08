import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatListModule } from '@angular/material/list';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatMenuModule } from '@angular/material/menu';
import { RouterOutlet, RouterLink } from '@angular/router';
import { SplashScreen } from '@capacitor/splash-screen';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, RouterOutlet, RouterLink, MatListModule, MatSidenavModule, MatIconModule, MatButtonModule, MatMenuModule],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss',
})
export class AppComponent {
  constructor() {
    this.showSplash();
  }

  menuLinks = [
    { label: 'Inicio', path: '/', external: false, icon: 'home' },
    { label: 'Sobre ESSApp', path: '/sobre-essapp', external: false, icon: 'location_on' },
    { label: 'Conocé la agenda', path: 'https://essapp.coop/agenda', external: true, icon: 'calendar_month' },
    { label: 'Informate sobre la ESS', path: 'https://essapp.coop/noticias', external: true, icon: 'info' },
    { label: 'Sumá tu organización', path: 'https://essapp.coop/sum%C3%A1-tu-proyecto', external: true, icon: 'edit_square' },
    { label: 'Términos y condiciones', path: '/terminos-y-condiciones', external: false, icon: 'assignment' },
    { label: 'Política de privacidad', path: '/politica-privacidad', external: false, icon: 'assignment' },
    { label: 'Seguinos en Facebook', path: 'https://www.facebook.com/ESSAppCOOP', external: true, icon: 'facebook' },
    { label: 'Seguinos en Instagram', path: 'https://www.instagram.com/essappcoop/', external: true, icon: 'instagram' },
    { label: 'Escribínos', path: 'mailto:info@essapp.coop', external: true, icon: 'mail' },
  ];

  async showSplash() {
    await SplashScreen.show({
      showDuration: 2000,
      autoHide: true,
    });
  }

}
