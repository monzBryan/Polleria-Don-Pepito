import { Component, computed, inject, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { CartService } from '../../core/services/cart.service';
import { PointsService } from '../../core/services/points.service';
import { SiteConfigService } from '../../core/services/site-config.service';
import { ToastService } from '../../core/services/toast.service';
import { EmptyStateComponent } from '../../shared/components/empty-state.component';
import { IconComponent } from '../../shared/components/icon.component';
import { ImageFallbackDirective } from '../../shared/directives/image-fallback.directive';
import { ModalComponent } from '../../shared/components/modal.component';
import { QuantityStepperComponent } from '../../shared/components/quantity-stepper.component';
import { SolesPipe } from '../../shared/pipes/soles.pipe';

@Component({
  selector: 'app-cart-page',
  standalone: true,
  imports: [
    RouterLink,
    EmptyStateComponent,
    IconComponent,
    ImageFallbackDirective,
    ModalComponent,
    QuantityStepperComponent,
    SolesPipe,
  ],
  template: `
    <section class="cart-hero">
      <div class="container">
        <nav class="crumbs" aria-label="Ruta de navegación">
          <a routerLink="/">Inicio</a>
          <app-icon name="lucideChevronRight" size="13" />
          <a routerLink="/carta">Carta</a>
          <app-icon name="lucideChevronRight" size="13" />
          <span>Carrito</span>
        </nav>
        <div class="cart-hero__row">
          <div>
            <span class="eyebrow">Paso 1 de 3</span>
            <h1 class="display display--sm">Tu carrito</h1>
          </div>
          @if (!cart.isEmpty()) {
            <button type="button" class="cart-hero__clear" (click)="confirmar.set(true)">
              <app-icon name="lucideTrash2" size="15" />
              Vaciar carrito
            </button>
          }
        </div>
      </div>
    </section>

    @if (cart.isEmpty()) {
      <section class="section cart-empty">
        <div class="container">
          <app-empty-state
            icon="lucideShoppingBag"
            title="Tu carrito está vacío"
            message="El pollo está en el horno y tú aún no has elegido. Entra a la carta y arma tu pedido perfecto."
            actionLabel="Ver la carta"
            (action)="irALaCarta()"
          />
        </div>
      </section>
    } @else {
      <section class="section cart-body">
        <div class="container cart-layout">
          <div class="cart-items">
            @for (item of cart.items(); track item.producto.id) {
              <article class="cart-row">
                <div class="cart-row__media">
                  <img
                    [src]="item.producto.imagenUrl"
                    [alt]="item.producto.nombre"
                    appImageFallback
                  />
                </div>

                <div class="cart-row__body">
                  <div class="cart-row__top">
                    <div>
                      <span class="cart-row__category">
                        {{ item.producto.categoriaNombre }}
                      </span>
                      <h2>{{ item.producto.nombre }}</h2>
                    </div>
                    <button
                      type="button"
                      class="cart-row__remove"
                      [attr.aria-label]="'Quitar ' + item.producto.nombre"
                      (click)="quitar(item.producto.id, item.producto.nombre)"
                    >
                      <app-icon name="lucideTrash2" size="16" />
                    </button>
                  </div>

                  <p class="cart-row__desc">{{ item.producto.descripcion }}</p>

                  <div class="cart-row__note">
                    <app-icon name="lucideMessageSquare" size="14" />
                    <input
                      type="text"
                      placeholder="Nota para la cocina: sin ají, bien dorado..."
                      [value]="item.nota ?? ''"
                      (change)="cambiarNota(item.producto.id, $event)"
                      [attr.aria-label]="'Nota para ' + item.producto.nombre"
                    />
                  </div>

                  <div class="cart-row__foot">
                    <app-quantity-stepper
                      [value]="item.cantidad"
                      [label]="item.producto.nombre"
                      (valueChange)="cart.setCantidad(item.producto.id, $event)"
                    />
                    <div class="cart-row__price">
                      <small>{{ item.producto.precio | soles }} c/u</small>
                      <strong>
                        {{ item.producto.precio * item.cantidad | soles }}
                      </strong>
                    </div>
                  </div>
                </div>
              </article>
            }

            <div class="cart-extra">
              <app-icon name="lucideSparkles" size="18" />
              <p>
                ¿Se te antoja algo más? Suma una chicha morada o una porción de
                papas para completar el pedido.
              </p>
              <a routerLink="/carta" [queryParams]="{ categoria: 'bebidas' }">
                Agregar bebidas
                <app-icon name="lucideArrowRight" size="14" />
              </a>
            </div>
          </div>

          <aside class="summary">
            <div class="summary__card">
              <h2>Resumen del pedido</h2>

              <div class="summary__line">
                <span>Subtotal ({{ cart.count() }} artículos)</span>
                <strong>{{ cart.subtotal() | soles }}</strong>
              </div>
              <div class="summary__line">
                <span>Delivery</span>
                <strong class="summary__muted">Se calcula al pagar</strong>
              </div>
              <div class="summary__line summary__line--points">
                <span>
                  <app-icon name="lucideGift" size="14" />
                  Puntos que ganarás
                </span>
                <strong class="summary__gold">+{{ puntosGanados() }} pts</strong>
              </div>

              <div class="summary__total">
                <span>Total estimado</span>
                <strong>{{ cart.subtotal() | soles }}</strong>
              </div>

              @if (auth.isLoggedIn()) {
                <p class="summary__balance">
                  Tienes <strong>{{ auth.perfil()?.puntos ?? 0 }} puntos</strong>.
                  Podrás canjearlos en el siguiente paso.
                </p>
              } @else {
                <p class="summary__balance">
                  <app-icon name="lucideGift" size="13" />
                  <a routerLink="/login" [queryParams]="{ redirect: '/checkout' }">
                    Inicia sesión
                  </a>
                  y suma {{ puntosGanados() }} puntos con este pedido.
                </p>
              }

              <button type="button" class="btn btn--primary btn--block btn--lg" (click)="irAlCheckout()">
                Ir al checkout
                <app-icon name="lucideArrowRight" size="17" />
              </button>
              <a routerLink="/carta" class="summary__continue">
                Seguir comprando
              </a>

              <div class="summary__trust">
                <span><app-icon name="lucideShieldCheck" size="15" /> Pago seguro</span>
                <span><app-icon name="lucideBike" size="15" /> Delivery propio</span>
                <span><app-icon name="lucideFlame" size="15" /> Recién hecho</span>
              </div>
            </div>

            <div class="summary__hint">
              <app-icon name="lucideInfo" size="15" />
              <p>
                Delivery gratis desde {{ config().freeDeliveryFrom | soles }}.
                El pedido mínimo es {{ config().pedidoMinimo | soles }}.
              </p>
            </div>
          </aside>
        </div>
      </section>
    }

    <app-modal
      [open]="confirmar()"
      title="¿Vaciar tu carrito?"
      eyebrow="Un momento"
      size="sm"
      [footer]="true"
      (closed)="confirmar.set(false)"
    >
      <p class="confirm-text">
        Se quitarán todos los productos. Esta acción no se puede deshacer.
      </p>
      <div modalFooter class="confirm-actions">
        <button type="button" class="btn btn--ghost" (click)="confirmar.set(false)">
          Cancelar
        </button>
        <button type="button" class="btn btn--danger" (click)="vaciar()">
          Sí, vaciar
        </button>
      </div>
    </app-modal>
  `,
  styles: [
    `
      .cart-hero {
        padding: clamp(30px, 4vw, 48px) 0 22px;
        background: var(--cream);
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

      .cart-hero__row {
        display: flex;
        align-items: flex-end;
        justify-content: space-between;
        gap: 18px;
      }

      .cart-hero__clear {
        display: inline-flex;
        align-items: center;
        gap: 6px;
        padding: 8px 12px;
        border: 1px solid var(--line);
        border-radius: var(--radius-pill);
        background: var(--white);
        color: var(--muted);
        font-size: 11px;
        font-weight: 800;
        cursor: pointer;
        transition: var(--transition);
      }

      .cart-hero__clear:hover {
        border-color: var(--danger);
        color: var(--danger);
      }

      .cart-body {
        padding-top: 18px;
      }

      .cart-empty {
        padding-top: 20px;
      }

      .cart-layout {
        display: grid;
        grid-template-columns: 1fr 370px;
        align-items: start;
        gap: 28px;
      }

      .cart-items {
        display: flex;
        flex-direction: column;
        gap: 12px;
      }

      .cart-row {
        display: grid;
        grid-template-columns: 150px 1fr;
        gap: 18px;
        padding: 16px;
        border: 1px solid var(--line);
        border-radius: var(--radius-lg);
        background: var(--white);
        box-shadow: var(--shadow-sm);
      }

      .cart-row__media {
        width: 150px;
        height: 160px;
        border-radius: 16px;
        overflow: hidden;
        background: var(--cream-2);
      }

      .cart-row__media img {
        width: 100%;
        height: 100%;
        object-fit: cover;
      }

      .cart-row__body {
        display: flex;
        flex-direction: column;
        min-width: 0;
        padding: 4px 0;
      }

      .cart-row__top {
        display: flex;
        align-items: flex-start;
        justify-content: space-between;
        gap: 10px;
      }

      .cart-row__category {
        color: var(--red);
        font-size: 8.5px;
        font-weight: 900;
        letter-spacing: 0.14em;
        text-transform: uppercase;
      }

      .cart-row h2 {
        margin-top: 3px;
        font-family: var(--font-display);
        font-size: 21px;
        font-weight: 600;
      }

      .cart-row__remove {
        display: grid;
        place-items: center;
        flex: none;
        width: 32px;
        height: 32px;
        border: 1px solid var(--line);
        border-radius: 50%;
        background: transparent;
        color: var(--muted-2);
        cursor: pointer;
        transition: var(--transition);
      }

      .cart-row__remove:hover {
        border-color: var(--danger);
        background: var(--danger-soft);
        color: var(--danger);
      }

      .cart-row__desc {
        display: -webkit-box;
        -webkit-line-clamp: 2;
        -webkit-box-orient: vertical;
        overflow: hidden;
        margin-top: 5px;
        color: var(--muted);
        font-size: 11.5px;
        line-height: 1.5;
      }

      .cart-row__note {
        display: flex;
        align-items: center;
        gap: 7px;
        margin-top: 10px;
        padding: 0 10px;
        height: 36px;
        border: 1px dashed var(--line-strong);
        border-radius: 9px;
        color: var(--muted-2);
      }

      .cart-row__note input {
        flex: 1;
        min-width: 0;
        border: 0;
        outline: 0;
        background: transparent;
        color: var(--ink);
        font-size: 11px;
      }

      .cart-row__foot {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 10px;
        margin-top: auto;
        padding-top: 12px;
      }

      .cart-row__price {
        display: flex;
        align-items: baseline;
        gap: 7px;
      }

      .cart-row__price small {
        color: var(--muted-2);
        font-size: 9.5px;
      }

      .cart-row__price strong {
        font-family: var(--font-display);
        font-size: 21px;
        font-weight: 700;
      }

      .cart-extra {
        display: flex;
        align-items: center;
        gap: 11px;
        padding: 15px 17px;
        border: 1px dashed var(--line-strong);
        border-radius: var(--radius);
        background: rgba(255, 255, 255, 0.55);
        color: var(--muted);
      }

      .cart-extra > app-icon {
        flex: none;
        color: var(--gold-dark);
      }

      .cart-extra p {
        flex: 1;
        font-size: 11px;
        line-height: 1.5;
      }

      .cart-extra a {
        display: inline-flex;
        align-items: center;
        gap: 4px;
        flex: none;
        color: var(--red);
        font-size: 10.5px;
        font-weight: 800;
      }

      .summary {
        position: sticky;
        top: calc(var(--header-h) + 18px);
        display: flex;
        flex-direction: column;
        gap: 12px;
      }

      .summary__card {
        padding: 24px 22px;
        border: 1px solid var(--line);
        border-radius: var(--radius-lg);
        background: var(--white);
        box-shadow: var(--shadow);
      }

      .summary__card h2 {
        margin-bottom: 18px;
        font-family: var(--font-display);
        font-size: 22px;
        font-weight: 600;
      }

      .summary__line {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 12px;
        padding: 8px 0;
        color: var(--muted);
        font-size: 12px;
      }

      .summary__line strong {
        color: var(--ink);
        font-size: 12.5px;
        font-weight: 800;
      }

      .summary__muted {
        color: var(--muted-2) !important;
        font-size: 10.5px !important;
        font-weight: 700 !important;
      }

      .summary__line--points span {
        display: inline-flex;
        align-items: center;
        gap: 5px;
      }

      .summary__line--points app-icon {
        color: var(--gold-dark);
      }

      .summary__gold {
        color: var(--gold-dark) !important;
      }

      .summary__total {
        display: flex;
        align-items: baseline;
        justify-content: space-between;
        gap: 10px;
        margin-top: 10px;
        padding-top: 16px;
        border-top: 1px solid var(--line);
      }

      .summary__total span {
        font-size: 12px;
        font-weight: 800;
      }

      .summary__total strong {
        font-family: var(--font-display);
        font-size: 30px;
        font-weight: 600;
        letter-spacing: -0.03em;
      }

      .summary__balance {
        display: flex;
        align-items: center;
        gap: 4px;
        margin: 10px 0 16px;
        padding: 9px 11px;
        border-radius: 9px;
        background: var(--gold-soft);
        color: var(--gold-dark);
        font-size: 10px;
        line-height: 1.4;
      }

      .summary__balance a {
        text-decoration: underline;
        font-weight: 800;
      }

      .summary__continue {
        display: block;
        margin-top: 12px;
        color: var(--muted);
        font-size: 11px;
        font-weight: 800;
        text-align: center;
        text-decoration: underline;
      }

      .summary__trust {
        display: grid;
        gap: 7px;
        margin-top: 18px;
        padding-top: 14px;
        border-top: 1px solid var(--line);
      }

      .summary__trust span {
        display: inline-flex;
        align-items: center;
        gap: 6px;
        color: var(--muted);
        font-size: 9.5px;
        font-weight: 700;
      }

      .summary__trust app-icon {
        color: var(--success);
      }

      .summary__hint {
        display: flex;
        align-items: flex-start;
        gap: 7px;
        padding: 12px 14px;
        border-radius: 12px;
        background: var(--cream-2);
        color: var(--muted);
      }

      .summary__hint app-icon {
        flex: none;
        margin-top: 1px;
        color: var(--gold-dark);
      }

      .summary__hint p {
        font-size: 9.5px;
        line-height: 1.5;
      }

      .confirm-text {
        color: var(--muted);
        font-size: 13px;
        line-height: 1.6;
      }

      .confirm-actions {
        display: flex;
        gap: 8px;
      }

      @media (max-width: 960px) {
        .cart-layout {
          grid-template-columns: 1fr;
        }
        .summary {
          position: static;
        }
      }

      @media (max-width: 640px) {
        .cart-row {
          grid-template-columns: 100px 1fr;
          gap: 13px;
          padding: 12px;
        }
        .cart-row__media {
          width: 100px;
          height: 130px;
        }
        .cart-row h2 {
          font-size: 17px;
        }
        .cart-extra {
          flex-wrap: wrap;
        }
        .cart-extra p {
          flex-basis: calc(100% - 30px);
        }
        .cart-hero__row {
          flex-direction: column;
          align-items: flex-start;
        }
      }
    `,
  ],
})
export class CartPageComponent {
  readonly cart = inject(CartService);
  readonly auth = inject(AuthService);
  private readonly points = inject(PointsService);
  private readonly site = inject(SiteConfigService);
  private readonly router = inject(Router);
  private readonly toast = inject(ToastService);

  readonly confirmar = signal(false);
  readonly config = computed(() => this.site.configWeb());
  readonly puntosGanados = computed(() =>
    this.points.ganados(this.cart.subtotal(), 0),
  );

  cambiarNota(productoId: number, event: Event): void {
    const input = event.target as HTMLInputElement;
    this.cart.setNota(productoId, input.value);
  }

  quitar(productoId: number, nombre: string): void {
    this.cart.remove(productoId);
    this.toast.info(`${nombre} se quitó del carrito.`);
  }

  vaciar(): void {
    this.cart.clear();
    this.confirmar.set(false);
    this.toast.info('Tu carrito quedó vacío.');
  }

  irALaCarta(): void {
    void this.router.navigate(['/carta']);
  }

  irAlCheckout(): void {
    void this.router.navigate(['/checkout']);
  }
}
