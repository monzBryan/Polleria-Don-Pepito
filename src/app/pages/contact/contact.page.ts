import { Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { SiteConfigService } from '../../core/services/site-config.service';
import { environment } from '../../../environments/environment';
import { IconComponent } from '../../shared/components/icon.component';
import { SolesPipe } from '../../shared/pipes/soles.pipe';

const ZONAS = [
  { nombre: 'Ica', tiempo: '25 – 35 min', minimo: 25 },
  { nombre: 'La Tinguiña', tiempo: '30 – 40 min', minimo: 30 },
  { nombre: 'Parcona', tiempo: '30 – 40 min', minimo: 30 },
  { nombre: 'San Juan Bautista', tiempo: '35 – 45 min', minimo: 35 },
  { nombre: 'Los Aquijes', tiempo: '40 – 50 min', minimo: 40 },
  { nombre: 'Tate', tiempo: '40 – 50 min', minimo: 40 },
];

@Component({
  selector: 'app-contact-page',
  standalone: true,
  imports: [RouterLink, IconComponent, SolesPipe],
  template: `
    <section class="contact-hero">
      <div class="container">
        <nav class="crumbs" aria-label="Ruta de navegación">
          <a routerLink="/">Inicio</a>
          <app-icon name="lucideChevronRight" size="13" />
          <span>Contacto</span>
        </nav>

        <div class="contact-hero__grid">
          <div>
            <span class="eyebrow eyebrow--gold">Estamos cerca</span>
            <h1 class="display display--xl">
              Hablemos de<br />
              <em>pollo y planes.</em>
            </h1>
            <p>
              Escríbenos para pedidos, reservas o consultas. Respondemos rápido,
              como debe ser. También puedes venir a visitarnos: la brasa está
              encendida todos los días.
            </p>
            <div class="contact-hero__actions">
              <a [href]="waLink()" target="_blank" rel="noopener" class="btn btn--primary btn--lg">
                <app-icon name="brandWhatsapp" size="18" />
                Escribir por WhatsApp
              </a>
              <a routerLink="/reservas" class="btn btn--outline-light btn--lg">
                <app-icon name="lucideCalendar" size="18" />
                Reservar mesa
              </a>
            </div>
          </div>

          <div class="contact-hero__card">
            <span class="contact-hero__status">
              <span></span>
              Abierto hoy
            </span>
            <h2>Don Pepito · Ica</h2>
            <p>{{ config().direccion }}</p>
            <div class="contact-hero__line">
              <app-icon name="lucideClock" size="17" />
              <span>{{ config().horario }}</span>
            </div>
            <div class="contact-hero__line">
              <app-icon name="lucidePhone" size="17" />
              <a [href]="'tel:' + config().whatsapp">{{ config().whatsapp }}</a>
            </div>
            <div class="contact-hero__line">
              <app-icon name="lucideMail" size="17" />
              <a [href]="'mailto:' + config().email">{{ config().email }}</a>
            </div>
            <a [href]="mapsUrl()" target="_blank" rel="noopener" class="btn btn--gold contact-hero__map-link">
              Ver en Google Maps
              <app-icon name="lucideExternalLink" size="15" />
            </a>
          </div>
        </div>
      </div>
    </section>

    <section class="contact-cards">
      <div class="container contact-cards__grid">
        <a [href]="mapsUrl()" target="_blank" rel="noopener" class="contact-card">
          <span><app-icon name="lucideMapPin" size="21" /></span>
          <div>
            <small>Visítanos</small>
            <strong>{{ config().direccion }}</strong>
            <p>Referencia: a dos cuadras de la Plaza de Armas.</p>
          </div>
          <app-icon name="lucideArrowUpRight" size="17" />
        </a>
        <a [href]="'tel:' + config().whatsapp" class="contact-card">
          <span><app-icon name="lucidePhone" size="21" /></span>
          <div>
            <small>Llámanos</small>
            <strong>{{ config().whatsapp }}</strong>
            <p>Pedidos, reservas y consultas de 12:00 a 23:00.</p>
          </div>
          <app-icon name="lucideArrowUpRight" size="17" />
        </a>
        <a [href]="'mailto:' + config().email" class="contact-card">
          <span><app-icon name="lucideMail" size="21" /></span>
          <div>
            <small>Escríbenos</small>
            <strong>{{ config().email }}</strong>
            <p>Eventos, catering y alianzas con empresas.</p>
          </div>
          <app-icon name="lucideArrowUpRight" size="17" />
        </a>
      </div>
    </section>

    <section class="section section--cream">
      <div class="container contact-grid">
        <div class="contact-map">
          <iframe
            src="https://www.openstreetmap.org/export/embed.html?bbox=-75.7440%2C-14.0735%2C-75.7330%2C-14.0675&amp;layer=mapnik&amp;marker=-14.07065%2C-75.73864"
            title="Ubicación de Pollería Don Pepito en Ica"
            loading="lazy"
            referrerpolicy="no-referrer-when-downgrade"
            allowfullscreen
          ></iframe>
          <div class="contact-map__floating">
            <strong>Estacionamiento disponible</strong>
            <span>Ingreso por la calle lateral, sin costo.</span>
          </div>
        </div>

        <div class="contact-side">
          <span class="eyebrow">Horario</span>
          <h2 class="section-title">Nos encontrarás aquí</h2>

          <ul class="hours">
            <li>
              <span>Lunes a jueves</span>
              <strong>12:00 – 23:00</strong>
            </li>
            <li>
              <span>Viernes y sábado</span>
              <strong>12:00 – 23:30</strong>
            </li>
            <li>
              <span>Domingo</span>
              <strong>12:00 – 22:30</strong>
            </li>
          </ul>

          <div class="contact-side__note">
            <app-icon name="lucideInfo" size="18" />
            <p>
              La cocina cierra 30 minutos antes del cierre del salón. Para
              delivery, revisa la disponibilidad en la carta.
            </p>
          </div>

          <div class="socials">
            <a [href]="config().instagram" target="_blank" rel="noopener" aria-label="Instagram">
              <app-icon name="brandInstagram" size="18" />
            </a>
            <a [href]="config().facebook" target="_blank" rel="noopener" aria-label="Facebook">
              <app-icon name="brandFacebook" size="18" />
            </a>
            <a [href]="waLink()" target="_blank" rel="noopener" aria-label="WhatsApp">
              <app-icon name="brandWhatsapp" size="18" />
            </a>
          </div>
        </div>
      </div>
    </section>

    <section class="section delivery">
      <div class="container">
        <div class="section-head">
          <div>
            <span class="eyebrow">Delivery</span>
            <h2 class="section-title">Llegamos a estos distritos</h2>
          </div>
          <p class="section-head__note">
            El costo se calcula en el checkout. Delivery gratis en pedidos desde
            {{ config().freeDeliveryFrom | soles }}.
          </p>
        </div>

        <div class="zones">
          @for (zona of zonas; track zona.nombre; let i = $index) {
            <article>
              <span class="zones__num">{{ (i + 1).toString().padStart(2, '0') }}</span>
              <div>
                <h3>{{ zona.nombre }}</h3>
                <p>Pedido mínimo referencial: S/ {{ zona.minimo }}</p>
              </div>
              <span class="zones__time">
                <app-icon name="lucideBike" size="14" />
                {{ zona.tiempo }}
              </span>
            </article>
          }
        </div>

        <div class="delivery__cta">
          <span>
            <app-icon name="lucideMessageCircle" size="19" />
            ¿Tu distrito no aparece? Escríbenos y lo coordinamos.
          </span>
          <a [href]="waLink()" target="_blank" rel="noopener" class="btn btn--primary">
            Consultar cobertura
          </a>
        </div>
      </div>
    </section>
  `,
  styles: [
    `
      :host {
        display: block;
      }

      .contact-hero {
        padding: 28px 0 70px;
        background:
          radial-gradient(circle at 84% 22%, rgba(232, 181, 77, 0.14), transparent 34%),
          var(--ink);
        color: var(--cream);
      }

      .crumbs {
        display: flex;
        align-items: center;
        gap: 7px;
        margin-bottom: 34px;
        color: rgba(255, 248, 238, 0.55);
        font-size: 11.5px;
      }

      .crumbs a {
        color: rgba(255, 248, 238, 0.75);
      }

      .contact-hero__grid {
        display: grid;
        grid-template-columns: 1.1fr 0.9fr;
        gap: clamp(34px, 6vw, 90px);
        align-items: center;
      }

      .contact-hero h1 {
        margin: 18px 0 22px;
      }

      .contact-hero h1 em {
        color: var(--gold);
        font-style: italic;
      }

      .contact-hero__grid > div > p {
        max-width: 48ch;
        color: rgba(255, 248, 238, 0.7);
        font-size: 15px;
        line-height: 1.8;
      }

      .contact-hero__actions {
        display: flex;
        flex-wrap: wrap;
        gap: 12px;
        margin-top: 28px;
      }

      .contact-hero__card {
        padding: 30px;
        border: 1px solid rgba(255, 248, 238, 0.16);
        border-radius: var(--radius-xl);
        background: rgba(255, 248, 238, 0.05);
        backdrop-filter: blur(8px);
      }

      .contact-hero__status {
        display: inline-flex;
        align-items: center;
        gap: 7px;
        margin-bottom: 14px;
        color: #7ED0A0;
        font-size: 9.5px;
        font-weight: 900;
        letter-spacing: 0.13em;
        text-transform: uppercase;
      }

      .contact-hero__status span {
        width: 7px;
        height: 7px;
        border-radius: 50%;
        background: #7ED0A0;
        box-shadow: 0 0 0 4px rgba(126, 208, 160, 0.14);
      }

      .contact-hero__card h2 {
        margin: 0 0 6px;
        font-family: var(--font-display);
        font-size: 30px;
        font-weight: 600;
      }

      .contact-hero__card > p {
        margin: 0 0 22px;
        color: rgba(255, 248, 238, 0.6);
        font-size: 12.5px;
      }

      .contact-hero__line {
        display: flex;
        align-items: center;
        gap: 10px;
        padding: 11px 0;
        border-top: 1px solid rgba(255, 248, 238, 0.12);
        color: rgba(255, 248, 238, 0.8);
        font-size: 12.5px;
      }

      .contact-hero__line app-icon {
        color: var(--gold);
      }

      .contact-hero__line a {
        color: inherit;
      }

      .contact-hero__map-link {
        width: 100%;
        justify-content: center;
        margin-top: 18px;
      }

      .contact-cards {
        padding: 0;
        background: var(--white);
        border-bottom: 1px solid var(--line);
      }

      .contact-cards__grid {
        display: grid;
        grid-template-columns: repeat(3, 1fr);
      }

      .contact-card {
        display: flex;
        align-items: flex-start;
        gap: 14px;
        padding: 28px 24px;
        border-right: 1px solid var(--line);
        color: var(--ink);
        transition: var(--transition);
      }

      .contact-card:last-child {
        border-right: 0;
      }

      .contact-card:hover {
        background: var(--cream);
      }

      .contact-card > span {
        display: grid;
        place-items: center;
        flex: none;
        width: 44px;
        height: 44px;
        border-radius: 50%;
        background: rgba(200, 16, 46, 0.08);
        color: var(--red);
      }

      .contact-card div {
        flex: 1;
      }

      .contact-card small {
        display: block;
        margin-bottom: 3px;
        color: var(--red);
        font-size: 8.5px;
        font-weight: 900;
        letter-spacing: 0.14em;
        text-transform: uppercase;
      }

      .contact-card strong {
        display: block;
        font-size: 12.5px;
      }

      .contact-card p {
        margin: 4px 0 0;
        color: var(--muted);
        font-size: 10.5px;
        line-height: 1.55;
      }

      .contact-grid {
        display: grid;
        grid-template-columns: 1.15fr 0.85fr;
        gap: clamp(28px, 5vw, 64px);
        align-items: center;
      }

      .contact-map {
        position: relative;
      }

      .contact-map iframe {
        width: 100%;
        height: 430px;
        border: 0;
        border-radius: var(--radius-xl);
        filter: grayscale(0.25) contrast(1.05);
      }

      .contact-map__floating {
        position: absolute;
        left: 18px;
        bottom: 18px;
        display: grid;
        gap: 2px;
        padding: 13px 16px;
        border-radius: var(--radius-md);
        background: var(--ink);
        color: var(--cream);
        box-shadow: var(--shadow-md);
      }

      .contact-map__floating strong {
        font-size: 11.5px;
      }

      .contact-map__floating span {
        color: rgba(255, 248, 238, 0.6);
        font-size: 9.5px;
      }

      .contact-side h2 {
        margin: 8px 0 18px;
      }

      .hours {
        margin: 0;
        padding: 0;
        list-style: none;
        border-top: 1px solid var(--line);
      }

      .hours li {
        display: flex;
        justify-content: space-between;
        gap: 14px;
        padding: 12px 0;
        border-bottom: 1px solid var(--line);
        font-size: 12px;
      }

      .hours span {
        color: var(--muted);
      }

      .hours strong {
        font-weight: 700;
      }

      .contact-side__note {
        display: flex;
        gap: 10px;
        margin-top: 18px;
        padding: 13px 15px;
        border-radius: var(--radius-md);
        background: rgba(200, 16, 46, 0.06);
        color: var(--red);
      }

      .contact-side__note p {
        margin: 0;
        color: var(--ink-soft);
        font-size: 10.5px;
        line-height: 1.6;
      }

      .socials {
        display: flex;
        gap: 8px;
        margin-top: 22px;
      }

      .socials a {
        display: grid;
        place-items: center;
        width: 40px;
        height: 40px;
        border: 1px solid var(--line);
        border-radius: 50%;
        color: var(--ink);
        transition: var(--transition);
      }

      .socials a:hover {
        border-color: var(--red);
        background: var(--red);
        color: var(--white);
      }

      .section-head__note {
        max-width: 38ch;
        color: var(--muted);
        font-size: 12px;
        line-height: 1.6;
      }

      .zones {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 1px;
        border: 1px solid var(--line);
        border-radius: var(--radius-lg);
        overflow: hidden;
        background: var(--line);
      }

      .zones article {
        display: flex;
        align-items: center;
        gap: 14px;
        padding: 20px 22px;
        background: var(--white);
      }

      .zones__num {
        color: var(--line-strong);
        font-family: var(--font-display);
        font-size: 20px;
        font-weight: 600;
      }

      .zones article div {
        flex: 1;
      }

      .zones h3 {
        margin: 0 0 2px;
        font-size: 12.5px;
      }

      .zones p {
        margin: 0;
        color: var(--muted);
        font-size: 9.5px;
      }

      .zones__time {
        display: inline-flex;
        align-items: center;
        gap: 5px;
        color: var(--red);
        font-size: 9.5px;
        font-weight: 800;
        white-space: nowrap;
      }

      .delivery__cta {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 18px;
        margin-top: 18px;
        padding: 18px 22px;
        border-radius: var(--radius-md);
        background: var(--cream);
      }

      .delivery__cta > span {
        display: flex;
        align-items: center;
        gap: 9px;
        color: var(--ink-soft);
        font-size: 12px;
      }

      .delivery__cta app-icon {
        color: var(--red);
      }

      @media (max-width: 960px) {
        .contact-hero__grid,
        .contact-grid {
          grid-template-columns: 1fr;
        }

        .contact-cards__grid {
          grid-template-columns: 1fr;
        }

        .contact-card {
          border-right: 0;
          border-bottom: 1px solid var(--line);
        }

        .contact-card:last-child {
          border-bottom: 0;
        }

        .zones {
          grid-template-columns: 1fr;
        }
      }

      @media (max-width: 600px) {
        .contact-hero__actions > * {
          width: 100%;
          justify-content: center;
        }

        .contact-hero__card {
          padding: 22px;
        }

        .contact-map iframe {
          height: 320px;
        }

        .delivery__cta {
          flex-direction: column;
          align-items: flex-start;
        }

        .delivery__cta .btn {
          width: 100%;
          justify-content: center;
        }
      }
    `,
  ],
})
export class ContactPageComponent {
  private readonly siteConfig = inject(SiteConfigService);

  readonly config = this.siteConfig.configWeb;
  readonly zonas = ZONAS;

  mapsUrl(): string {
    return this.config().googleMapsUrl || environment.contact.mapsUrl;
  }

  waLink(): string {
    return this.siteConfig.whatsappLink(
      'Hola Don Pepito, quisiera hacer una consulta.',
    );
  }
}
