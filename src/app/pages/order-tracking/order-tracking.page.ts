import {
  Component,
  computed,
  inject,
  signal,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import {
  ESTADOS_PEDIDO,
  timelineFor,
} from '../../core/utils/order-status';
import { formatDate, formatTime } from '../../core/utils/format';
import { EstadoPedido, Pedido } from '../../core/models';
import { AuthService } from '../../core/services/auth.service';
import { CartService } from '../../core/services/cart.service';
import { CatalogService } from '../../core/services/catalog.service';
import { OrderService } from '../../core/services/order.service';
import { SiteConfigService } from '../../core/services/site-config.service';
import { ToastService } from '../../core/services/toast.service';
import { EmptyStateComponent } from '../../shared/components/empty-state.component';
import { IconComponent } from '../../shared/components/icon.component';
import { ImageFallbackDirective } from '../../shared/directives/image-fallback.directive';
import { SolesPipe } from '../../shared/pipes/soles.pipe';
import { StatusBadgeComponent } from '../../shared/components/status-badge.component';

@Component({
  selector: 'app-order-tracking-page',
  standalone: true,
  imports: [
    RouterLink,
    EmptyStateComponent,
    IconComponent,
    ImageFallbackDirective,
    SolesPipe,
    StatusBadgeComponent,
  ],
  template: `
    @if (cargando()) {
      <section class="section tracking-loading">
        <div class="container">
          <span class="skeleton tracking-loading__hero"></span>
          <div class="tracking-loading__grid">
            <span class="skeleton"></span>
            <span class="skeleton"></span>
          </div>
        </div>
      </section>
    } @else if (!pedido()) {
      <section class="section">
        <div class="container">
          <app-empty-state
            icon="lucidePackageSearch"
            title="No encontramos ese pedido"
            message="Revisa el código de seguimiento o entra a tu cuenta para ver tus pedidos recientes."
            actionLabel="Ir a mi cuenta"
            (action)="irACuenta()"
          />
        </div>
      </section>
    } @else {
      @let p = pedido()!;

      <section class="tracking-hero">
        <div class="container">
          <nav class="crumbs" aria-label="Ruta de navegación">
            <a routerLink="/">Inicio</a>
            <app-icon name="lucideChevronRight" size="13" />
            <a routerLink="/cuenta">Mis pedidos</a>
            <app-icon name="lucideChevronRight" size="13" />
            <span>{{ p.codigo }}</span>
          </nav>

          <div class="tracking-hero__grid">
            <div>
              <span class="eyebrow">Seguimiento del pedido</span>
              <h1 class="display display--sm">{{ tituloEstado() }}</h1>
              <div class="tracking-meta">
                <app-status-badge [estado]="p.estado" />
                <span class="tracking-meta__code">{{ p.codigo }}</span>
                <span>{{ formatDate(p.createdAt) }} · {{ formatTime(p.createdAt) }}</span>
              </div>
            </div>

            <div class="eta-card">
              <span class="eta-card__icon">
                <app-icon
                  [name]="p.tipoEntrega === 'delivery' ? 'lucideBike' : 'lucideStore'"
                  size="22"
                />
              </span>
              <div>
                <small>
                  {{ p.tipoEntrega === 'delivery' ? 'Entrega estimada' : 'Listo para recoger' }}
                </small>
                @if (p.estado === 'entregado') {
                  <strong>Pedido entregado</strong>
                } @else if (p.estado === 'cancelado') {
                  <strong>Pedido cancelado</strong>
                } @else {
                  <strong>
                    {{ p.fEntregaEstimada ? formatTime(p.fEntregaEstimada) : '45 min aprox.' }}
                  </strong>
                }
              </div>
              <span class="eta-card__pulse" aria-hidden="true"></span>
            </div>
          </div>
        </div>
      </section>

      <section class="section tracking-body">
        <div class="container tracking-layout">
          <div class="tracking-main">
            <div class="tracking-card">
              <div class="tracking-card__head">
                <div>
                  <span class="eyebrow">En tiempo real</span>
                  <h2>Estado de tu pedido</h2>
                </div>
                <button type="button" class="tracking-refresh" (click)="actualizar()">
                  <app-icon name="lucideRefreshCw" size="14" />
                  Actualizar
                </button>
              </div>

              @if (p.estado === 'cancelado') {
                <div class="cancelled">
                  <span><app-icon name="lucideXCircle" size="22" /></span>
                  <div>
                    <strong>Este pedido fue cancelado</strong>
                    <p>
                      Si tienes dudas, escríbenos por WhatsApp y te ayudamos a
                      resolverlo.
                    </p>
                  </div>
                </div>
              } @else {
                <ol class="timeline">
                  @for (estado of timeline(); track estado; let i = $index) {
                    <li
                      class="timeline__step"
                      [class.is-done]="paso(estado) === 'done'"
                      [class.is-active]="paso(estado) === 'active'"
                    >
                      <div class="timeline__marker">
                        <app-icon [name]="info(estado).icono" size="18" />
                      </div>
                      <div class="timeline__text">
                        <strong>{{ info(estado).label }}</strong>
                        <p>{{ info(estado).descripcion }}</p>
                      </div>
                      @if (paso(estado) === 'active') {
                        <span class="timeline__now">Ahora</span>
                      }
                      @if (i < timeline().length - 1) {
                        <span class="timeline__line"></span>
                      }
                    </li>
                  }
                </ol>
              }
            </div>

            <div class="tracking-card">
              <div class="tracking-card__head">
                <div>
                  <span class="eyebrow">Tu selección</span>
                  <h2>Productos del pedido</h2>
                </div>
                <span class="tracking-card__count">{{ p.items.length }} ítems</span>
              </div>

              <div class="tracking-items">
                @for (item of p.items; track item.productoId + '-' + $index) {
                  <div class="tracking-item">
                    <img
                      [src]="item.imagenUrl"
                      [alt]="item.nombre"
                      appImageFallback
                    />
                    <div class="tracking-item__body">
                      <strong>{{ item.cantidad }}x {{ item.nombre }}</strong>
                      <small>{{ item.precioUnitario | soles }} c/u</small>
                      @if (item.nota) {
                        <em>{{ item.nota }}</em>
                      }
                    </div>
                    <span>{{ item.precioUnitario * item.cantidad | soles }}</span>
                  </div>
                }
              </div>
            </div>

            <div class="tracking-actions">
              <button type="button" class="btn btn--primary" (click)="volverAPedir()">
                <app-icon name="lucideRotateCcw" size="16" />
                Volver a pedir
              </button>
              <a [href]="waLink()" target="_blank" rel="noopener" class="btn btn--outline">
                <app-icon name="brandWhatsapp" size="16" />
                Consultar por WhatsApp
              </a>
              <a routerLink="/carta" class="btn btn--ghost">
                Seguir explorando
              </a>
            </div>
          </div>

          <aside class="tracking-side">
            <div class="tracking-card tracking-card--summary">
              <h2>Resumen</h2>

              <div class="tracking-sum">
                <span>Subtotal</span>
                <strong>{{ p.subtotal | soles }}</strong>
              </div>
              @if (p.descuentoPuntos > 0) {
                <div class="tracking-sum is-discount">
                  <span>Descuento por puntos</span>
                  <strong>-{{ p.descuentoPuntos | soles }}</strong>
                </div>
              }
              <div class="tracking-sum">
                <span>Delivery</span>
                <strong>{{ p.costoDelivery > 0 ? (p.costoDelivery | soles) : 'Gratis' }}</strong>
              </div>
              <div class="tracking-total">
                <span>Total</span>
                <strong>{{ p.total | soles }}</strong>
              </div>

              <div class="tracking-points">
                <app-icon name="lucideGift" size="15" />
                <span>
                  @if (p.puntosUsados > 0) {
                    Usaste {{ p.puntosUsados }} puntos.
                  }
                  Ganaste <strong>{{ p.puntosGanados }} puntos</strong>.
                </span>
              </div>
            </div>

            <div class="tracking-card">
              <h2>{{ p.tipoEntrega === 'delivery' ? 'Entrega' : 'Recojo' }}</h2>

              <div class="tracking-info">
                <div>
                  <app-icon
                    [name]="p.tipoEntrega === 'delivery' ? 'lucideMapPin' : 'lucideStore'"
                    size="16"
                  />
                  <div>
                    <small>
                      {{ p.tipoEntrega === 'delivery' ? 'Dirección' : 'Punto de recojo' }}
                    </small>
                    <strong>
                      {{
                        p.tipoEntrega === 'delivery'
                          ? (p.direccion || 'Dirección registrada')
                          : config().direccion
                      }}
                    </strong>
                    @if (p.referencia) {
                      <em>{{ p.referencia }}</em>
                    }
                    @if (p.distrito) {
                      <em>{{ p.distrito }}</em>
                    }
                  </div>
                </div>

                <div>
                  <app-icon name="lucidePhone" size="16" />
                  <div>
                    <small>Teléfono</small>
                    <strong>{{ p.clienteTelefono }}</strong>
                  </div>
                </div>

                <div>
                  <app-icon name="lucideCreditCard" size="16" />
                  <div>
                    <small>Método de pago</small>
                    <strong class="tracking-info__capitalize">{{ p.metodoPago }}</strong>
                  </div>
                </div>

                @if (p.notas) {
                  <div>
                    <app-icon name="lucideMessageSquare" size="16" />
                    <div>
                      <small>Notas</small>
                      <strong>{{ p.notas }}</strong>
                    </div>
                  </div>
                }
              </div>
            </div>

            <div class="tracking-help">
              <app-icon name="lucideCircleHelp" size="18" />
              <div>
                <strong>¿Necesitas ayuda?</strong>
                <p>Escríbenos y te respondemos al toque.</p>
                <a [href]="waLink()" target="_blank" rel="noopener">
                  Hablar con Don Pepito
                  <app-icon name="lucideArrowRight" size="13" />
                </a>
              </div>
            </div>
          </aside>
        </div>
      </section>
    }
  `,
  styles: [
    `
      .tracking-loading {
        padding-top: 50px;
      }

      .tracking-loading__hero {
        display: block;
        height: 190px;
        margin-bottom: 18px;
        border-radius: var(--radius-lg);
      }

      .tracking-loading__grid {
        display: grid;
        grid-template-columns: 1fr 360px;
        gap: 18px;
      }

      .tracking-loading__grid span {
        height: 380px;
        border-radius: var(--radius-lg);
      }

      .tracking-hero {
        padding: clamp(30px, 4vw, 50px) 0 24px;
        background:
          radial-gradient(circle at 90% 0%, rgba(232, 181, 77, 0.14), transparent 32%),
          var(--cream);
      }

      .crumbs {
        display: flex;
        align-items: center;
        gap: 6px;
        margin-bottom: 20px;
        color: var(--muted-2);
        font-size: 11px;
        font-weight: 700;
      }

      .crumbs span {
        color: var(--ink);
      }

      .tracking-hero__grid {
        display: flex;
        align-items: flex-end;
        justify-content: space-between;
        gap: 26px;
      }

      .tracking-meta {
        display: flex;
        flex-wrap: wrap;
        align-items: center;
        gap: 9px;
        margin-top: 13px;
        color: var(--muted);
        font-size: 11px;
        font-weight: 600;
      }

      .tracking-meta__code {
        padding: 4px 9px;
        border-radius: 6px;
        background: var(--white);
        border: 1px solid var(--line);
        color: var(--ink);
        font-family: var(--font-body);
        font-size: 10px;
        font-weight: 900;
        letter-spacing: 0.06em;
      }

      .eta-card {
        position: relative;
        display: flex;
        align-items: center;
        gap: 12px;
        min-width: 280px;
        padding: 16px 18px;
        border-radius: 18px;
        background: var(--ink);
        color: var(--cream);
        box-shadow: var(--shadow);
        overflow: hidden;
      }

      .eta-card__icon {
        display: grid;
        place-items: center;
        flex: none;
        width: 44px;
        height: 44px;
        border-radius: 50%;
        background: rgba(232, 181, 77, 0.16);
        color: var(--gold);
      }

      .eta-card div {
        display: flex;
        flex-direction: column;
        position: relative;
        z-index: 1;
      }

      .eta-card small {
        color: rgba(255, 248, 238, 0.5);
        font-size: 8.5px;
        font-weight: 900;
        letter-spacing: 0.12em;
        text-transform: uppercase;
      }

      .eta-card strong {
        font-family: var(--font-display);
        font-size: 20px;
        font-weight: 600;
      }

      .eta-card__pulse {
        position: absolute;
        right: -20px;
        bottom: -30px;
        width: 100px;
        height: 100px;
        border-radius: 50%;
        background: radial-gradient(circle, rgba(232, 181, 77, 0.3), transparent 65%);
      }

      .tracking-body {
        padding-top: 18px;
      }

      .tracking-layout {
        display: grid;
        grid-template-columns: 1fr 370px;
        align-items: start;
        gap: 20px;
      }

      .tracking-main {
        display: flex;
        flex-direction: column;
        gap: 14px;
      }

      .tracking-card {
        padding: 20px;
        border: 1px solid var(--line);
        border-radius: var(--radius-lg);
        background: var(--white);
        box-shadow: var(--shadow-sm);
      }

      .tracking-card__head {
        display: flex;
        align-items: flex-start;
        justify-content: space-between;
        gap: 14px;
        margin-bottom: 18px;
      }

      .tracking-card__head h2,
      .tracking-card--summary h2,
      .tracking-side > .tracking-card > h2 {
        font-family: var(--font-display);
        font-size: 21px;
        font-weight: 600;
      }

      .tracking-refresh {
        display: inline-flex;
        align-items: center;
        gap: 5px;
        padding: 6px 10px;
        border: 1px solid var(--line);
        border-radius: var(--radius-pill);
        background: var(--white);
        color: var(--muted);
        font-size: 9.5px;
        font-weight: 800;
        cursor: pointer;
        transition: var(--transition);
      }

      .tracking-refresh:hover {
        border-color: var(--red);
        color: var(--red);
      }

      .tracking-card__count {
        color: var(--muted-2);
        font-size: 9.5px;
        font-weight: 800;
      }

      .timeline {
        display: grid;
        grid-template-columns: repeat(5, 1fr);
        gap: 0;
        margin-top: 10px;
      }

      .timeline__step {
        position: relative;
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 9px;
        text-align: center;
      }

      .timeline__marker {
        position: relative;
        z-index: 1;
        display: grid;
        place-items: center;
        width: 42px;
        height: 42px;
        border: 1px solid var(--line);
        border-radius: 50%;
        background: var(--white);
        color: var(--muted-2);
        transition: var(--transition);
      }

      .timeline__step.is-done .timeline__marker {
        border-color: var(--success);
        background: var(--success-soft);
        color: var(--success);
      }

      .timeline__step.is-active .timeline__marker {
        border-color: var(--red);
        background: var(--red);
        color: var(--white);
        box-shadow: 0 0 0 6px var(--red-soft);
      }

      .timeline__text {
        padding: 0 4px;
      }

      .timeline__text strong {
        display: block;
        font-size: 10.5px;
        font-weight: 900;
      }

      .timeline__step:not(.is-done):not(.is-active) .timeline__text strong {
        color: var(--muted-2);
      }

      .timeline__text p {
        display: none;
        max-width: 17ch;
        margin: 3px auto 0;
        color: var(--muted);
        font-size: 8.5px;
        line-height: 1.35;
      }

      .timeline__step.is-active .timeline__text p {
        display: block;
      }

      .timeline__now {
        padding: 2px 7px;
        border-radius: var(--radius-pill);
        background: var(--red-soft);
        color: var(--red);
        font-size: 7.5px;
        font-weight: 900;
        letter-spacing: 0.1em;
        text-transform: uppercase;
      }

      .timeline__line {
        position: absolute;
        top: 21px;
        left: calc(50% + 24px);
        width: calc(100% - 48px);
        height: 2px;
        background: var(--cream-3);
        z-index: 0;
      }

      .timeline__step.is-done .timeline__line {
        background: var(--success);
        opacity: 0.45;
      }

      .cancelled {
        display: flex;
        align-items: flex-start;
        gap: 12px;
        padding: 16px;
        border-radius: 12px;
        background: var(--danger-soft);
      }

      .cancelled > span {
        display: grid;
        place-items: center;
        flex: none;
        width: 42px;
        height: 42px;
        border-radius: 50%;
        background: var(--white);
        color: var(--danger);
      }

      .cancelled strong {
        display: block;
        font-size: 13px;
        font-weight: 900;
      }

      .cancelled p {
        margin-top: 3px;
        color: var(--danger);
        font-size: 10.5px;
        line-height: 1.5;
        opacity: 0.8;
      }

      .tracking-items {
        display: flex;
        flex-direction: column;
        gap: 11px;
      }

      .tracking-item {
        display: flex;
        align-items: center;
        gap: 11px;
        padding-bottom: 11px;
        border-bottom: 1px solid var(--line);
      }

      .tracking-item:last-child {
        padding-bottom: 0;
        border-bottom: 0;
      }

      .tracking-item img {
        width: 48px;
        height: 48px;
        border-radius: 10px;
        object-fit: cover;
        background: var(--cream-2);
      }

      .tracking-item__body {
        display: flex;
        flex: 1;
        flex-direction: column;
        min-width: 0;
      }

      .tracking-item__body strong {
        font-size: 11.5px;
        font-weight: 800;
      }

      .tracking-item__body small {
        color: var(--muted);
        font-size: 9.5px;
      }

      .tracking-item__body em {
        margin-top: 2px;
        color: var(--gold-dark);
        font-size: 9px;
        font-style: normal;
        font-weight: 700;
      }

      .tracking-item > span {
        font-size: 11.5px;
        font-weight: 800;
        white-space: nowrap;
      }

      .tracking-actions {
        display: flex;
        flex-wrap: wrap;
        gap: 8px;
      }

      .tracking-side {
        position: sticky;
        top: calc(var(--header-h) + 18px);
        display: flex;
        flex-direction: column;
        gap: 14px;
      }

      .tracking-card--summary > h2 {
        margin-bottom: 14px;
      }

      .tracking-sum {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 10px;
        padding: 5px 0;
        color: var(--muted);
        font-size: 10.5px;
      }

      .tracking-sum strong {
        color: var(--ink);
        font-size: 11px;
        font-weight: 800;
      }

      .tracking-sum.is-discount,
      .tracking-sum.is-discount strong {
        color: var(--success);
      }

      .tracking-total {
        display: flex;
        align-items: baseline;
        justify-content: space-between;
        gap: 10px;
        margin-top: 8px;
        padding-top: 11px;
        border-top: 1px solid var(--line);
      }

      .tracking-total span {
        font-size: 11px;
        font-weight: 800;
      }

      .tracking-total strong {
        font-family: var(--font-display);
        font-size: 27px;
        font-weight: 600;
      }

      .tracking-points {
        display: flex;
        align-items: flex-start;
        gap: 6px;
        margin-top: 12px;
        padding: 9px 10px;
        border-radius: 8px;
        background: var(--gold-soft);
        color: var(--gold-dark);
        font-size: 9.5px;
        line-height: 1.45;
      }

      .tracking-points app-icon {
        flex: none;
        margin-top: 1px;
      }

      .tracking-side > .tracking-card > h2 {
        margin-bottom: 14px;
      }

      .tracking-info {
        display: grid;
        gap: 13px;
      }

      .tracking-info > div {
        display: flex;
        align-items: flex-start;
        gap: 9px;
      }

      .tracking-info > div > app-icon {
        flex: none;
        margin-top: 2px;
        color: var(--red);
      }

      .tracking-info > div > div {
        display: flex;
        flex-direction: column;
        min-width: 0;
      }

      .tracking-info small {
        color: var(--muted-2);
        font-size: 8px;
        font-weight: 900;
        letter-spacing: 0.1em;
        text-transform: uppercase;
      }

      .tracking-info strong {
        font-size: 11px;
        font-weight: 800;
        line-height: 1.4;
      }

      .tracking-info em {
        color: var(--muted);
        font-size: 9.5px;
        font-style: normal;
      }

      .tracking-info__capitalize {
        text-transform: capitalize;
      }

      .tracking-help {
        display: flex;
        align-items: flex-start;
        gap: 10px;
        padding: 16px;
        border-radius: var(--radius);
        background: var(--ink);
        color: var(--cream);
      }

      .tracking-help > app-icon {
        flex: none;
        color: var(--gold);
      }

      .tracking-help strong {
        display: block;
        font-family: var(--font-display);
        font-size: 16px;
        font-weight: 600;
      }

      .tracking-help p {
        margin: 2px 0 8px;
        color: rgba(255, 248, 238, 0.55);
        font-size: 9.5px;
      }

      .tracking-help a {
        display: inline-flex;
        align-items: center;
        gap: 4px;
        color: var(--gold);
        font-size: 9.5px;
        font-weight: 800;
      }

      @media (max-width: 960px) {
        .tracking-layout {
          grid-template-columns: 1fr;
        }
        .tracking-side {
          position: static;
        }
        .tracking-hero__grid {
          flex-direction: column;
          align-items: flex-start;
        }
        .eta-card {
          width: 100%;
        }
      }

      @media (max-width: 640px) {
        .timeline {
          grid-template-columns: 1fr;
          gap: 4px;
        }
        .timeline__step {
          flex-direction: row;
          align-items: flex-start;
          gap: 11px;
          padding: 7px 0;
          text-align: left;
        }
        .timeline__text p {
          display: block;
          max-width: none;
        }
        .timeline__line {
          top: 48px;
          left: 20px;
          width: 2px;
          height: calc(100% - 34px);
        }
        .timeline__now {
          margin-left: auto;
        }
        .tracking-card {
          padding: 16px;
        }
      }
    `,
  ],
})
export class OrderTrackingPageComponent {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly orders = inject(OrderService);
  private readonly catalog = inject(CatalogService);
  private readonly cart = inject(CartService);
  private readonly site = inject(SiteConfigService);
  private readonly toast = inject(ToastService);
  readonly auth = inject(AuthService);

  readonly pedido = signal<Pedido | null>(null);
  readonly cargando = signal(true);
  readonly config = computed(() => this.site.configWeb());

  readonly timeline = computed(() =>
    this.pedido() ? timelineFor(this.pedido()!.tipoEntrega) : [],
  );

  readonly tituloEstado = computed(() => {
    const estado = this.pedido()?.estado;
    const titulos: Record<string, string> = {
      pendiente: 'Recibimos tu pedido.',
      confirmado: 'Tu pedido está confirmado.',
      en_preparacion: 'Lo estamos preparando.',
      en_camino: 'Tu pedido va en camino.',
      listo: 'Tu pedido está listo.',
      entregado: '¡Buen provecho!',
      cancelado: 'Este pedido fue cancelado.',
    };
    return estado ? titulos[estado] : 'Seguimos tu pedido.';
  });

  readonly waLink = computed(() =>
    this.site.whatsappLink(
      `Hola Don Pepito, quiero consultar por mi pedido ${this.pedido()?.codigo ?? ''}.`,
    ),
  );

  constructor() {
    this.route.paramMap
      .pipe(takeUntilDestroyed())
      .subscribe((params) => {
        void this.cargar(params.get('codigo') ?? '');
      });
  }

  async cargar(codigo: string): Promise<void> {
    if (!codigo) {
      this.cargando.set(false);
      return;
    }
    this.cargando.set(true);
    try {
      const pedido = await this.orders.obtenerPorCodigo(codigo);
      if (pedido && this.auth.perfil() && pedido.perfilId !== this.auth.perfil()?.id) {
        this.pedido.set(null);
      } else {
        this.pedido.set(pedido);
      }
    } finally {
      this.cargando.set(false);
    }
  }

  actualizar(): void {
    const codigo = this.pedido()?.codigo ?? '';
    void this.cargar(codigo);
    this.toast.info('Actualizamos el estado de tu pedido.');
  }

  info(estado: EstadoPedido) {
    return ESTADOS_PEDIDO[estado];
  }

  paso(estado: EstadoPedido): 'done' | 'active' | 'pending' {
    const actual = this.pedido()?.estado;
    if (!actual || actual === 'cancelado') return 'pending';
    const indiceActual = this.timeline().indexOf(actual);
    const indicePaso = this.timeline().indexOf(estado);
    if (indicePaso < indiceActual) return 'done';
    if (indicePaso === indiceActual) return 'active';
    return 'pending';
  }

  formatDate(value: string): string {
    return formatDate(value);
  }

  formatTime(value: string): string {
    return formatTime(value);
  }

  async volverAPedir(): Promise<void> {
    const pedido = this.pedido();
    if (!pedido) return;
    let agregados = 0;
    for (const item of pedido.items) {
      const producto = this.catalog
        .productosActivos()
        .find((entry) => entry.id === item.productoId);
      if (producto) {
        this.cart.add(producto, item.cantidad, item.nota ?? '');
        agregados++;
      }
    }
    if (agregados === 0) {
      this.toast.warning('Los productos de este pedido ya no están disponibles.');
      return;
    }
    this.toast.success('Agregamos los productos disponibles a tu carrito.');
    await this.router.navigate(['/carrito']);
  }

  irACuenta(): void {
    void this.router.navigate(['/cuenta']);
  }
}
