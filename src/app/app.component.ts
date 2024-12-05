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
    { label: 'Inicio', path: '/', external: false },
    { label: 'Sobre ESSApp', path: '/sobre-essapp', external: false },
    { label: 'Conocé la agenda', path: 'https://essapp.coop/agenda', external: true },
    { label: 'Informate sobre la Economía Social y Solidaria', path: 'https://essapp.coop/noticias', external: true },
    { label: 'Sumá tu organización', path: 'https://essapp.coop/sum%C3%A1-tu-proyecto', external: true },
    { label: 'Términos y condiciones', path: '/terminos-y-condiciones', external: false },
    { label: 'Seguinos en Facebook', path: 'https://www.facebook.com/mapaESSApp/', external: true },
    { label: 'Seguinos en X', path: 'https://x.com/mapaESSApp/', external: true },
    { label: 'Escribínos', path: 'mailto:info@essapp.coop', external: true },
  ];

  async showSplash() {
    await SplashScreen.show({
      showDuration: 2000,
      autoHide: true,
    });
  }

}
