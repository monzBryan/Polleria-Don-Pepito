import { Component, computed, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { CatalogService } from '../../core/services/catalog.service';
import { SiteConfigService } from '../../core/services/site-config.service';
import { IconComponent } from '../../shared/components/icon.component';
import { ImageFallbackDirective } from '../../shared/directives/image-fallback.directive';
import { ProductCardComponent } from '../../shared/components/product-card.component';
import { SolesPipe } from '../../shared/pipes/soles.pipe';

@Component({
  selector: 'app-promotions-page',
  standalone: true,
  imports: [
    RouterLink,
    ProductCardComponent,
    IconComponent,
    ImageFallbackDirective,
    SolesPipe,
  ],
  template: `
    <section class="promo-hero">
      <div class="container">
        <nav class="crumbs" aria-label="Ruta de navegación">
          <a routerLink="/">Inicio</a>
          <app-icon name="lucideChevronRight" size="13" />
          <span>Promociones</span>
        </nav>

        @if (combo(); as estrella) {
          <div class="promo-hero__grid">
            <div class="promo-hero__copy">
              <span class="eyebrow eyebrow--gold">
                <app-icon name="lucideBadgePercent" size="14" />
                Oferta de la semana
              </span>
              <h1 class="display display--xl">
                Más sabor,<br />
                <em>menos cuenta.</em>
              </h1>
              <p>
                Combos pensados para compartir sin pensarlo dos veces. Pollo
                recién salido de la brasa, guarniciones generosas y el precio
                que sí querías.
              </p>
              <div class="promo-hero__price">
                <strong>{{ estrella.precio | soles }}</strong>
                @if (estrella.precioAnterior) {
                  <s>{{ estrella.precioAnterior | soles }}</s>
                }
                @if (estrella.porcentajeDescuento) {
                  <span>-{{ estrella.porcentajeDescuento }}%</span>
                }
              </div>
              <div class="promo-hero__ctas">
                <a
                  routerLink="/carta"
                  [queryParams]="{ categoria: 'combos' }"
                  class="btn btn--primary btn--lg"
                >
                  Ver combos
                  <app-icon name="lucideArrowRight" size="18" />
                </a>
                <a [href]="waLink()" target="_blank" rel="noopener" class="btn btn--outline-light btn--lg">
                  <app-icon name="brandWhatsapp" size="18" />
                  Pedir por WhatsApp
                </a>
              </div>
            </div>

            <div class="promo-hero__media">
              <img [src]="estrella.imagenUrl" [alt]="estrella.nombre" appImageFallback />
              <div class="promo-hero__tag">
                <span>El más pedido</span>
                <strong>{{ estrella.nombre }}</strong>
                <small>{{ estrella.etiquetas[0] || 'Para compartir' }}</small>
              </div>
            </div>
          </div>
        }
      </div>
    </section>

    <section class="benefits">
      <div class="container benefits__grid">
        <article>
          <app-icon name="lucideTruck" size="22" />
          <div>
            <strong>Delivery gratis</strong>
            <span>En pedidos desde {{ config().freeDeliveryFrom | soles }}</span>
          </div>
        </article>
        <article>
          <app-icon name="lucideGift" size="22" />
          <div>
            <strong>Suma puntos</strong>
            <span>{{ configPuntos().puntosPorSol }} punto por cada sol</span>
          </div>
        </article>
        <article>
          <app-icon name="lucideFlame" size="22" />
          <div>
            <strong>Recién hecho</strong>
            <span>Tu pedido empieza cuando lo confirmas</span>
          </div>
        </article>
        <article>
          <app-icon name="lucideShoppingBag" size="22" />
          <div>
            <strong>Recojo sin cola</strong>
            <span>Listo en aproximadamente 20 minutos</span>
          </div>
        </article>
      </div>
    </section>

    <section class="section section--cream">
      <div class="container">
        <div class="section-head">
          <div>
            <span class="eyebrow">Combos y ofertas</span>
            <h2 class="section-title">Elige tu próximo favorito</h2>
          </div>
          <p class="section-head__note">
            Precios vigentes hasta agotar stock. Los combos no incluyen cambios
            de guarnición.
          </p>
        </div>

        <div class="product-grid">
          @for (producto of promociones(); track producto.id) {
            <app-product-card [producto]="producto" />
          } @empty {
            <div class="promo-empty">
              <app-icon name="lucideBadgePercent" size="34" />
              <h3>Estamos preparando nuevas ofertas</h3>
              <p>Mientras tanto, revisa toda la carta y arma tu combo ideal.</p>
              <a routerLink="/carta" class="btn btn--primary">Ver la carta</a>
            </div>
          }
        </div>
      </div>
    </section>

    <section class="section promo-strip">
      <div class="container promo-strip__inner">
        <div>
          <span class="eyebrow eyebrow--gold">Para grupos</span>
          <h2 class="display display--md">¿Reunión, cumpleaños o partido?</h2>
          <p>
            Arma tu pedido para 6, 8 o más personas y te ayudamos a calcular las
            porciones exactas. Escríbenos y lo resolvemos en minutos.
          </p>
        </div>
        <div class="promo-strip__actions">
          <a [href]="waLink()" target="_blank" rel="noopener" class="btn btn--gold btn--lg">
            <app-icon name="brandWhatsapp" size="18" />
            Cotizar por WhatsApp
          </a>
          <a routerLink="/carta" class="btn btn--outline-light btn--lg">
            Explorar la carta
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

      .promo-hero {
        padding: 28px 0 72px;
        background:
          radial-gradient(circle at 82% 18%, rgba(232, 181, 77, 0.16), transparent 34%),
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

      .promo-hero__grid {
        display: grid;
        grid-template-columns: 1.02fr 0.98fr;
        gap: clamp(32px, 5vw, 72px);
        align-items: center;
      }

      .promo-hero__copy h1 {
        margin: 18px 0 20px;
      }

      .promo-hero__copy h1 em {
        color: var(--gold);
        font-style: italic;
      }

      .promo-hero__copy > p {
        max-width: 48ch;
        margin: 0 0 26px;
        color: rgba(255, 248, 238, 0.72);
        font-size: 15.5px;
        line-height: 1.75;
      }

      .promo-hero__price {
        display: flex;
        align-items: baseline;
        gap: 12px;
        margin-bottom: 28px;
      }

      .promo-hero__price strong {
        color: var(--gold);
        font-family: var(--font-display);
        font-size: 38px;
        font-weight: 600;
      }

      .promo-hero__price s {
        color: rgba(255, 248, 238, 0.4);
        font-size: 16px;
      }

      .promo-hero__price span {
        padding: 5px 10px;
        border-radius: var(--radius-pill);
        background: var(--red);
        color: var(--white);
        font-size: 11px;
        font-weight: 900;
      }

      .promo-hero__ctas {
        display: flex;
        flex-wrap: wrap;
        gap: 12px;
      }

      .promo-hero__media {
        position: relative;
      }

      .promo-hero__media::before {
        content: '';
        position: absolute;
        inset: 18px -18px -18px 18px;
        border: 1px solid rgba(232, 181, 77, 0.35);
        border-radius: var(--radius-xl);
      }

      .promo-hero__media img {
        position: relative;
        width: 100%;
        aspect-ratio: 1 / 1.04;
        border-radius: var(--radius-xl);
        object-fit: cover;
        box-shadow: var(--shadow-lg);
      }

      .promo-hero__tag {
        position: absolute;
        right: -18px;
        bottom: 28px;
        display: grid;
        gap: 2px;
        padding: 16px 18px;
        border-radius: var(--radius-md);
        background: var(--cream);
        color: var(--ink);
        box-shadow: var(--shadow-md);
      }

      .promo-hero__tag span {
        color: var(--red);
        font-size: 9px;
        font-weight: 900;
        letter-spacing: 0.13em;
        text-transform: uppercase;
      }

      .promo-hero__tag strong {
        font-family: var(--font-display);
        font-size: 19px;
      }

      .promo-hero__tag small {
        color: var(--muted);
        font-size: 11px;
      }

      .benefits {
        border-bottom: 1px solid var(--line);
        background: var(--white);
      }

      .benefits__grid {
        display: grid;
        grid-template-columns: repeat(4, 1fr);
      }

      .benefits article {
        display: flex;
        align-items: center;
        gap: 13px;
        padding: 22px 20px;
        border-right: 1px solid var(--line);
        color: var(--red);
      }

      .benefits article:last-child {
        border-right: 0;
      }

      .benefits article div {
        display: grid;
        gap: 2px;
      }

      .benefits strong {
        color: var(--ink);
        font-size: 12.5px;
      }

      .benefits span {
        color: var(--muted);
        font-size: 10.5px;
      }

      .section-head__note {
        max-width: 37ch;
        color: var(--muted);
        font-size: 12px;
        line-height: 1.6;
      }

      .promo-empty {
        grid-column: 1 / -1;
        display: grid;
        place-items: center;
        gap: 10px;
        padding: 60px 24px;
        border: 1px dashed var(--line-strong);
        border-radius: var(--radius-lg);
        text-align: center;
        color: var(--muted);
      }

      .promo-empty h3 {
        margin: 0;
        color: var(--ink);
        font-family: var(--font-display);
        font-size: 24px;
      }

      .promo-empty p {
        margin: 0 0 8px;
        font-size: 13px;
      }

      .promo-strip {
        background:
          radial-gradient(circle at 12% 40%, rgba(200, 16, 46, 0.28), transparent 40%),
          var(--ink);
        color: var(--cream);
      }

      .promo-strip__inner {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 32px;
      }

      .promo-strip h2 {
        margin: 12px 0;
      }

      .promo-strip p {
        max-width: 52ch;
        margin: 0;
        color: rgba(255, 248, 238, 0.68);
        font-size: 14px;
        line-height: 1.7;
      }

      .promo-strip__actions {
        display: flex;
        flex-wrap: wrap;
        gap: 10px;
        flex: none;
      }

      @media (max-width: 900px) {
        .promo-hero__grid {
          grid-template-columns: 1fr;
        }

        .promo-hero__media {
          max-width: 540px;
        }

        .benefits__grid {
          grid-template-columns: repeat(2, 1fr);
        }

        .benefits article:nth-child(2) {
          border-right: 0;
        }

        .benefits article:nth-child(-n + 2) {
          border-bottom: 1px solid var(--line);
        }

        .promo-strip__inner {
          flex-direction: column;
          align-items: flex-start;
        }
      }

      @media (max-width: 560px) {
        .promo-hero {
          padding-bottom: 54px;
        }

        .promo-hero__ctas > * {
          width: 100%;
          justify-content: center;
        }

        .promo-hero__tag {
          right: 12px;
          bottom: 12px;
        }

        .benefits__grid {
          grid-template-columns: 1fr;
        }

        .benefits article {
          border-right: 0;
          border-bottom: 1px solid var(--line);
        }

        .benefits article:last-child {
          border-bottom: 0;
        }
      }
    `,
  ],
})
export class PromotionsPageComponent {
  private readonly catalog = inject(CatalogService);
  private readonly siteConfig = inject(SiteConfigService);

  readonly config = this.siteConfig.configWeb;
  readonly configPuntos = this.siteConfig.configPuntos;

  readonly combo = computed(
    () =>
      this.catalog.productosActivos().find((producto) => producto.codigo === 'COM-001') ??
      this.catalog.destacados()[0],
  );

  readonly promociones = computed(() =>
    this.catalog
      .productosActivos()
      .filter(
        (producto) =>
          producto.categoriaSlug === 'combos' ||
          (producto.precioAnterior ?? 0) > producto.precio,
      )
      .sort(
        (a, b) =>
          (b.porcentajeDescuento ?? 0) - (a.porcentajeDescuento ?? 0) ||
          b.ventas - a.ventas,
      ),
  );

  waLink(): string {
    return this.siteConfig.whatsappLink(
      'Hola Don Pepito, quiero consultar por los combos y promociones.',
    );
  }
}
