import { Component, computed, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { SiteConfigService } from '../../core/services/site-config.service';
import { IconComponent } from './icon.component';
import { LogoComponent } from './logo.component';

@Component({
  selector: 'app-footer',
  standalone: true,
  imports: [RouterLink, IconComponent, LogoComponent],
  template: `
    <footer class="footer">
      <div class="container footer__grid">
        <div class="footer__brand">
          <app-logo variant="cream" size="lg" />
          <p>
            Pollo a la brasa con alma iqueña. Recetas de familia, leña de verdad y
            el sabor que reúne a los tuyos.
          </p>
          <div class="footer__social">
            <a
              [href]="config().instagram"
              target="_blank"
              rel="noopener"
              aria-label="Instagram de Don Pepito"
            >
              <app-icon name="brandInstagram" size="18" />
            </a>
            <a
              [href]="config().facebook"
              target="_blank"
              rel="noopener"
              aria-label="Facebook de Don Pepito"
            >
              <app-icon name="brandFacebook" size="18" />
            </a>
            <a
              [href]="waLink()"
              target="_blank"
              rel="noopener"
              aria-label="WhatsApp de Don Pepito"
            >
              <app-icon name="brandWhatsapp" size="18" />
            </a>
          </div>
        </div>

        <div class="footer__col">
          <h3>Explora</h3>
          <a routerLink="/carta">La carta</a>
          <a routerLink="/promociones">Promociones</a>
          <a routerLink="/" fragment="nosotros">Nuestra historia</a>
          <a routerLink="/" fragment="contacto">Visítanos</a>
          <a routerLink="/cuenta">Mis pedidos</a>
        </div>

        <div class="footer__col">
          <h3>Contacto</h3>
          <p>
            <app-icon name="lucideMapPin" size="15" />
            {{ config().direccion }}
          </p>
          <p>
            <app-icon name="lucideClock" size="15" />
            {{ config().horario }}
          </p>
          <a [href]="'tel:' + config().whatsapp.replace(/[^0-9+]/g, '')">
            <app-icon name="lucidePhone" size="15" />
            {{ config().whatsapp }}
          </a>
          <a [href]="'mailto:' + config().email">
            <app-icon name="lucideMail" size="15" />
            {{ config().email }}
          </a>
        </div>

        <div class="footer__col footer__col--legal">
          <h3>Legales</h3>
          <a routerLink="/legal/terminos">Términos y condiciones</a>
          <a routerLink="/legal/privacidad">Política de privacidad</a>
          <a routerLink="/legal/libro-reclamaciones">Libro de reclamaciones</a>
          <a routerLink="/legal/puntos">Reglamento de puntos</a>
        </div>
      </div>

      <div class="container footer__bottom">
        <p>© {{ anio }} Pollería Don Pepito. Todos los derechos reservados.</p>
        <p class="footer__made">
          Hecho con cariño en Ica, Perú
          <app-icon name="lucideHeart" size="13" />
        </p>
        <div class="footer__pay">
          <span>Yape</span>
          <span>Plin</span>
          <span>Efectivo</span>
          <span>Tarjeta</span>
        </div>
      </div>
    </footer>
  `,
  styles: [
    `
      :host {
        display: block;
      }

      .footer {
        position: relative;
        margin-top: 80px;
        padding: 68px 0 22px;
        background: var(--ink);
        color: var(--cream);
        overflow: hidden;
      }

      .footer::before {
        content: '';
        position: absolute;
        inset: 0 0 auto;
        height: 1px;
        background: linear-gradient(90deg, transparent, var(--gold), transparent);
        opacity: 0.6;
      }

      .footer::after {
        content: '';
        position: absolute;
        top: -180px;
        right: -120px;
        width: 420px;
        height: 420px;
        border-radius: 50%;
        background: radial-gradient(circle, rgba(200, 16, 46, 0.3), transparent 65%);
        pointer-events: none;
      }

      .footer__grid {
        position: relative;
        display: grid;
        grid-template-columns: 1.5fr 0.8fr 1fr 1fr;
        gap: 42px;
      }

      .footer__brand p {
        max-width: 310px;
        margin: 16px 0 20px;
        color: rgba(255, 248, 238, 0.6);
        font-size: 13px;
        line-height: 1.7;
      }

      .footer__social {
        display: flex;
        gap: 8px;
      }

      .footer__social a {
        display: grid;
        place-items: center;
        width: 38px;
        height: 38px;
        border: 1px solid rgba(255, 248, 238, 0.14);
        border-radius: 50%;
        color: var(--cream);
        transition: var(--transition);
      }

      .footer__social a:hover {
        border-color: var(--gold);
        background: var(--gold);
        color: var(--ink);
        transform: translateY(-2px);
      }

      .footer__col {
        display: flex;
        flex-direction: column;
        align-items: flex-start;
        gap: 9px;
      }

      .footer__col h3 {
        margin: 4px 0 8px;
        color: var(--gold);
        font-size: 10.5px;
        font-weight: 800;
        letter-spacing: 0.16em;
        text-transform: uppercase;
      }

      .footer__col a,
      .footer__col p {
        display: inline-flex;
        align-items: flex-start;
        gap: 8px;
        margin: 0;
        color: rgba(255, 248, 238, 0.66);
        font-size: 12.5px;
        line-height: 1.5;
        text-decoration: none;
        transition: var(--transition);
      }

      .footer__col a:hover {
        color: var(--gold);
      }

      .footer__col app-icon {
        margin-top: 2px;
        color: var(--gold);
      }

      .footer__col--legal a {
        color: rgba(255, 248, 238, 0.5);
        font-size: 12px;
      }

      .footer__bottom {
        position: relative;
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 16px;
        margin-top: 48px;
        padding-top: 20px;
        border-top: 1px solid rgba(255, 248, 238, 0.1);
      }

      .footer__bottom p {
        margin: 0;
        color: rgba(255, 248, 238, 0.42);
        font-size: 11px;
      }

      .footer__made {
        display: inline-flex;
        align-items: center;
        gap: 5px;
      }

      .footer__made app-icon {
        color: var(--red);
      }

      .footer__pay {
        display: flex;
        gap: 6px;
      }

      .footer__pay span {
        padding: 4px 9px;
        border: 1px solid rgba(255, 248, 238, 0.14);
        border-radius: var(--radius-pill);
        color: rgba(255, 248, 238, 0.55);
        font-size: 9.5px;
        font-weight: 700;
        letter-spacing: 0.03em;
      }

      @media (max-width: 960px) {
        .footer {
          margin-top: 64px;
          padding-top: 52px;
        }
        .footer__grid {
          grid-template-columns: 1fr 1fr;
          gap: 34px;
        }
        .footer__brand {
          grid-column: 1 / -1;
        }
      }

      @media (max-width: 640px) {
        .footer__grid {
          grid-template-columns: 1fr;
          gap: 28px;
        }
        .footer__bottom {
          flex-direction: column;
          align-items: flex-start;
          gap: 12px;
        }
      }
    `,
  ],
})
export class FooterComponent {
  private readonly site = inject(SiteConfigService);
  readonly config = computed(() => this.site.configWeb());
  readonly waLink = computed(() =>
    this.site.whatsappLink('Hola Don Pepito, quiero hacer un pedido.'),
  );
  readonly anio = new Date().getFullYear();
}
