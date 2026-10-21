import { Component, computed, inject } from '@angular/core';
import { SiteConfigService } from '../../core/services/site-config.service';
import { IconComponent } from './icon.component';

@Component({
  selector: 'app-announcement-bar',
  standalone: true,
  imports: [IconComponent],
  template: `
    <div class="announcement">
      <div class="announcement__track">
        @for (copia of [0, 1]; track copia) {
          <div class="announcement__group" [attr.aria-hidden]="copia === 1">
            @for (item of items(); track item.text + $index) {
              <span class="announcement__item">
                <app-icon [name]="item.icon" size="14" />
                {{ item.text }}
              </span>
              <span class="announcement__dot" aria-hidden="true"></span>
            }
          </div>
        }
      </div>
    </div>
  `,
  styles: [
    `
      :host {
        display: block;
        overflow: hidden;
      }

      .announcement {
        overflow: hidden;
        background: var(--red);
        color: var(--cream);
      }

      .announcement__track {
        display: flex;
        align-items: center;
        width: max-content;
        padding: 7px 0;
        animation: marquee 32s linear infinite;
      }

      .announcement__group {
        display: flex;
        align-items: center;
        flex: none;
      }

      .announcement:hover .announcement__track {
        animation-play-state: paused;
      }

      .announcement__item {
        display: inline-flex;
        align-items: center;
        gap: 7px;
        padding: 0 22px;
        font-size: 10.5px;
        font-weight: 800;
        letter-spacing: 0.12em;
        text-transform: uppercase;
        white-space: nowrap;
      }

      .announcement__item app-icon {
        color: var(--gold);
      }

      .announcement__dot {
        width: 4px;
        height: 4px;
        border-radius: 50%;
        background: rgba(255, 248, 238, 0.4);
        flex: none;
      }

      @keyframes marquee {
        from {
          transform: translateX(0);
        }
        to {
          transform: translateX(-50%);
        }
      }

      @media (prefers-reduced-motion: reduce) {
        .announcement__track {
          animation: none;
        }
      }
    `,
  ],
})
export class AnnouncementBarComponent {
  private readonly site = inject(SiteConfigService);

  readonly items = computed(() => {
    const config = this.site.configWeb();
    return [
      {
        icon: 'lucideBike',
        text: `Delivery gratis desde S/ ${config.freeDeliveryFrom.toFixed(0)}`,
      },
      { icon: 'lucideGift', text: 'Gana puntos en cada pedido' },
      { icon: 'lucideFlame', text: 'Pollo a la brasa al carbón' },
      { icon: 'lucideClock', text: config.horario },
      { icon: 'lucideFlame', text: 'Leña de verdad, sabor de casa' },
      { icon: 'brandWhatsapp', text: 'Pide por WhatsApp' },
    ];
  });
}
