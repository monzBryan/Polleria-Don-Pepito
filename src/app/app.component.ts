import { Component, DOCUMENT, inject } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { environment } from '../environments/environment';

@Component({
  imports: [RouterOutlet],
  selector: 'app-root',
  styleUrl: './app.component.scss',
  templateUrl: './app.component.html',
})
export class App {
  private readonly document = inject(DOCUMENT);

  constructor() {
    this.syncCanonicalUrls();
  }

  /**
   * El dominio publico se configura por entorno (SITE_URL). Si difiere del
   * valor estatico de index.html, se ajustan canonical y Open Graph para que
   * el SEO apunte al despliegue real.
   */
  private syncCanonicalUrls(): void {
    const base = (environment.siteUrl || '').replace(/\/+$/, '');
    if (!base.startsWith('http')) return;

    const setMeta = (selector: string, attribute: 'href' | 'content', value: string) => {
      const element = this.document.head.querySelector(selector);
      element?.setAttribute(attribute, value);
    };

    const ogImage = `${base}/brand/og-image.jpg`;
    setMeta('link[rel="canonical"]', 'href', `${base}${this.document.location?.pathname ?? '/'}`);
    setMeta('meta[property="og:url"]', 'content', `${base}/`);
    setMeta('meta[property="og:image"]', 'content', ogImage);
  }
}
