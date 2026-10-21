import { Component, computed, inject } from '@angular/core';
import { SiteConfigService } from '../../core/services/site-config.service';
import { IconComponent } from './icon.component';

@Component({
  selector: 'app-whatsapp-button',
  standalone: true,
  imports: [IconComponent],
  template: `
    <a
      class="wa"
      [href]="link()"
      target="_blank"
      rel="noopener"
      aria-label="Pedir por WhatsApp"
    >
      <span class="wa__pulse" aria-hidden="true"></span>
      <app-icon name="brandWhatsapp" size="24" />
      <span class="wa__label">Pide por WhatsApp</span>
    </a>
  `,
  styles: [
    `
      :host {
        position: fixed;
        right: 20px;
        bottom: 20px;
        z-index: calc(var(--z-nav) + 1);
      }

      .wa {
        position: relative;
        display: flex;
        align-items: center;
        gap: 10px;
        height: 54px;
        padding: 0 19px 0 15px;
        border-radius: var(--radius-pill);
        background: #1f8f52;
        color: var(--white);
        box-shadow: 0 14px 32px rgba(31, 143, 82, 0.35);
        text-decoration: none;
        transition: var(--transition);
      }

      .wa:hover {
        background: #167544;
        transform: translateY(-3px);
        box-shadow: 0 20px 40px rgba(31, 143, 82, 0.42);
      }

      .wa__label {
        font-size: 12.5px;
        font-weight: 800;
        white-space: nowrap;
      }

      .wa__pulse {
        position: absolute;
        inset: 0;
        border-radius: inherit;
        border: 2px solid rgba(31, 143, 82, 0.55);
        animation: pulse 2.6s ease-out infinite;
      }

      @keyframes pulse {
        0% {
          transform: scale(1);
          opacity: 0.7;
        }
        75%,
        100% {
          transform: scale(1.18);
          opacity: 0;
        }
      }

      @media (max-width: 640px) {
        :host {
          right: 14px;
          bottom: 14px;
        }
        .wa {
          width: 52px;
          height: 52px;
          padding: 0;
          justify-content: center;
        }
        .wa__label {
          display: none;
        }
      }

      @media (prefers-reduced-motion: reduce) {
        .wa__pulse {
          animation: none;
        }
      }
    `,
  ],
})
export class WhatsappButtonComponent {
  private readonly site = inject(SiteConfigService);
  readonly link = computed(() =>
    this.site.whatsappLink('Hola Don Pepito, quiero hacer un pedido.'),
  );
}
