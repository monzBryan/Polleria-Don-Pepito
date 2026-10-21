import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { AnnouncementBarComponent } from '../shared/components/announcement-bar.component';
import { NavbarComponent } from '../shared/components/navbar.component';
import { FooterComponent } from '../shared/components/footer.component';
import { CartDrawerComponent } from '../shared/components/cart-drawer.component';
import { ToastContainerComponent } from '../shared/components/toast-container.component';
import { WhatsappButtonComponent } from '../shared/components/whatsapp-button.component';

@Component({
  selector: 'app-public-layout',
  standalone: true,
  imports: [
    RouterOutlet,
    AnnouncementBarComponent,
    NavbarComponent,
    FooterComponent,
    CartDrawerComponent,
    ToastContainerComponent,
    WhatsappButtonComponent,
  ],
  template: `
    <app-announcement-bar />
    <app-navbar />
    <main class="site-main">
      <router-outlet />
    </main>
    <app-footer />
    <app-whatsapp-button />
    <app-cart-drawer />
    <app-toast-container />
  `,
  styles: [
    `
      :host {
        display: flex;
        flex-direction: column;
        min-height: 100vh;
      }

      .site-main {
        flex: 1;
      }
    `,
  ],
})
export class PublicLayoutComponent {}
