import { Component, computed, inject } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { CartService } from '../../core/services/cart.service';
import { SiteConfigService } from '../../core/services/site-config.service';
import { UiService } from '../../core/services/ui.service';
import { SolesPipe } from '../pipes/soles.pipe';
import { ImageFallbackDirective } from '../directives/image-fallback.directive';
import { IconComponent } from './icon.component';
import { QuantityStepperComponent } from './quantity-stepper.component';

@Component({
  selector: 'app-cart-drawer',
  standalone: true,
  imports: [
    RouterLink,
    SolesPipe,
    ImageFallbackDirective,
    IconComponent,
    QuantityStepperComponent,
  ],
  template: `
    @if (ui.cartOpen()) {
      <div class="cart-overlay" (click)="ui.closeCart()"></div>
      <aside class="cart" role="dialog" aria-modal="true" aria-label="Tu carrito">
        <header class="cart__head">
          <div>
            <span class="eyebrow">Tu pedido</span>
            <h2>Carrito <em>({{ cart.count() }})</em></h2>
          </div>
          <button
            type="button"
            class="icon-btn"
            aria-label="Cerrar carrito"
            (click)="ui.closeCart()"
          >
            <app-icon name="lucideX" size="20" />
          </button>
        </header>

        @if (cart.isEmpty()) {
          <div class="cart__empty">
            <span class="cart__empty-icon">
              <app-icon name="lucideShoppingBag" size="34" />
            </span>
            <h3>Tu carrito está vacío</h3>
            <p>Agrega tu combo favorito y nosotros nos encargamos del resto.</p>
            <button type="button" class="btn btn--primary" (click)="irALaCarta()">
              Ver la carta
              <app-icon name="lucideArrowRight" size="17" />
            </button>
          </div>
        } @else {
          <div class="cart__items">
            @for (item of cart.items(); track item.producto.id) {
              <article class="cart-item">
                <div class="cart-item__media">
                  <img
                    [src]="item.producto.imagenUrl"
                    [alt]="item.producto.nombre"
                    appImageFallback
                  />
                </div>
                <div class="cart-item__body">
                  <div class="cart-item__top">
                    <a
                      [routerLink]="['/carta']"
                      class="cart-item__name"
                      (click)="ui.closeCart()"
                    >
                      {{ item.producto.nombre }}
                    </a>
                    <button
                      type="button"
                      class="cart-item__remove"
                      [attr.aria-label]="'Quitar ' + item.producto.nombre"
                      (click)="cart.remove(item.producto.id)"
                    >
                      <app-icon name="lucideTrash2" size="15" />
                    </button>
                  </div>
                  <p class="cart-item__price">{{ item.producto.precio | soles }} c/u</p>
                  @if (item.nota) {
                    <p class="cart-item__note">{{ item.nota }}</p>
                  }
                  <div class="cart-item__controls">
                    <app-quantity-stepper
                      [value]="item.cantidad"
                      [label]="item.producto.nombre"
                      size="sm"
                      (valueChange)="cart.setCantidad(item.producto.id, $event)"
                    />
                    <strong>
                      {{ item.producto.precio * item.cantidad | soles }}
                    </strong>
                  </div>
                </div>
              </article>
            }
          </div>

          <footer class="cart__foot">
            <div class="cart__row">
              <span>Subtotal</span>
              <strong>{{ cart.subtotal() | soles }}</strong>
            </div>
            <p class="cart__hint">
              <app-icon [name]="deliveryIcon()" size="15" />
              {{ deliveryHint() }}
            </p>
            <button type="button" class="btn btn--primary btn--block" (click)="checkout()">
              Continuar pedido
              <app-icon name="lucideArrowRight" size="17" />
            </button>
            <button type="button" class="btn btn--ghost btn--block" (click)="seguirComprando()">
              Seguir comprando
            </button>
          </footer>
        }
      </aside>
    }
  `,
  styles: [
    `
      :host {
        position: relative;
        z-index: var(--z-modal);
      }

      .cart-overlay {
        position: fixed;
        inset: 0;
        background: rgba(10, 10, 11, 0.5);
        backdrop-filter: blur(3px);
        animation: fade-in 220ms ease both;
      }

      .cart {
        position: fixed;
        inset: 0 0 0 auto;
        display: flex;
        flex-direction: column;
        width: min(440px, 100vw);
        background: var(--cream);
        box-shadow: var(--shadow-lg);
        animation: cart-in 360ms var(--ease-out) both;
      }

      .cart__head {
        display: flex;
        align-items: flex-start;
        justify-content: space-between;
        gap: 16px;
        padding: 22px 22px 18px;
        border-bottom: 1px solid var(--line);
        background: rgba(255, 248, 238, 0.9);
        backdrop-filter: blur(10px);
      }

      .eyebrow {
        display: block;
        font-size: 10.5px;
        font-weight: 800;
        letter-spacing: 0.16em;
        text-transform: uppercase;
        color: var(--red);
      }

      .cart__head h2 {
        margin: 4px 0 0;
        font-family: var(--font-display);
        font-size: 26px;
        font-weight: 600;
        letter-spacing: -0.02em;
      }

      .cart__head h2 em {
        font-style: normal;
        color: var(--muted-2);
        font-size: 17px;
      }

      .icon-btn {
        display: grid;
        place-items: center;
        width: 38px;
        height: 38px;
        border: 1px solid var(--line);
        border-radius: 50%;
        background: var(--white);
        color: var(--ink);
        cursor: pointer;
        transition: var(--transition);
      }

      .icon-btn:hover {
        border-color: var(--red);
        color: var(--red);
        transform: rotate(90deg);
      }

      .cart__empty {
        display: flex;
        flex: 1;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        padding: 40px 28px;
        text-align: center;
      }

      .cart__empty-icon {
        display: grid;
        place-items: center;
        width: 82px;
        height: 82px;
        margin-bottom: 18px;
        border-radius: 50%;
        background: var(--cream-2);
        color: var(--red);
      }

      .cart__empty h3 {
        margin: 0;
        font-family: var(--font-display);
        font-size: 24px;
        font-weight: 600;
      }

      .cart__empty p {
        margin: 8px 0 22px;
        max-width: 260px;
        color: var(--muted);
        font-size: 13.5px;
        line-height: 1.55;
      }

      .cart__items {
        flex: 1;
        overflow-y: auto;
        padding: 8px 22px;
      }

      .cart-item {
        display: grid;
        grid-template-columns: 72px 1fr;
        gap: 13px;
        padding: 16px 0;
        border-bottom: 1px solid var(--line);
      }

      .cart-item__media {
        width: 72px;
        height: 72px;
        border-radius: 14px;
        overflow: hidden;
        background: var(--cream-2);
      }

      .cart-item__media img {
        width: 100%;
        height: 100%;
        object-fit: cover;
      }

      .cart-item__body {
        min-width: 0;
      }

      .cart-item__top {
        display: flex;
        align-items: flex-start;
        justify-content: space-between;
        gap: 8px;
      }

      .cart-item__name {
        font-size: 13.5px;
        font-weight: 800;
        line-height: 1.3;
        color: var(--ink);
        text-decoration: none;
      }

      .cart-item__name:hover {
        color: var(--red);
      }

      .cart-item__remove {
        flex: none;
        display: grid;
        place-items: center;
        width: 26px;
        height: 26px;
        border: 0;
        border-radius: 50%;
        background: transparent;
        color: var(--muted-2);
        cursor: pointer;
        transition: var(--transition);
      }

      .cart-item__remove:hover {
        background: var(--danger-soft);
        color: var(--danger);
      }

      .cart-item__price {
        margin: 2px 0 0;
        font-size: 12px;
        color: var(--muted);
      }

      .cart-item__note {
        margin: 5px 0 0;
        padding: 4px 8px;
        display: inline-block;
        border-radius: 6px;
        background: var(--gold-soft);
        color: var(--gold-dark);
        font-size: 11px;
        font-weight: 700;
      }

      .cart-item__controls {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 10px;
        margin-top: 10px;
      }

      .cart-item__controls strong {
        font-size: 13.5px;
        font-weight: 800;
      }

      .cart__foot {
        padding: 18px 22px 22px;
        border-top: 1px solid var(--line);
        background: var(--white);
      }

      .cart__row {
        display: flex;
        align-items: baseline;
        justify-content: space-between;
        margin-bottom: 6px;
      }

      .cart__row span {
        font-size: 13px;
        color: var(--muted);
      }

      .cart__row strong {
        font-family: var(--font-display);
        font-size: 24px;
        font-weight: 600;
      }

      .cart__hint {
        display: flex;
        align-items: center;
        gap: 7px;
        margin: 0 0 14px;
        color: var(--muted);
        font-size: 11.5px;
        line-height: 1.4;
      }

      .cart__hint app-icon {
        color: var(--gold-dark);
      }

      .cart__foot .btn + .btn {
        margin-top: 8px;
      }

      @keyframes cart-in {
        from {
          transform: translateX(100%);
        }
        to {
          transform: translateX(0);
        }
      }

      @keyframes fade-in {
        from {
          opacity: 0;
        }
        to {
          opacity: 1;
        }
      }

      @media (max-width: 640px) {
        .cart {
          width: 100vw;
        }
        .cart__head {
          padding: 18px 18px 14px;
        }
        .cart__items {
          padding: 4px 18px;
        }
        .cart__foot {
          padding: 16px 18px 20px;
        }
      }
    `,
  ],
})
export class CartDrawerComponent {
  readonly ui = inject(UiService);
  readonly cart = inject(CartService);
  private readonly site = inject(SiteConfigService);
  private readonly router = inject(Router);

  readonly deliveryHint = computed(() => {
    const config = this.site.configWeb();
    const subtotal = this.cart.subtotal();
    if (subtotal <= 0) {
      return `Delivery S/ ${config.deliveryFee.toFixed(2)} · gratis desde S/ ${config.freeDeliveryFrom.toFixed(2)}`;
    }
    const falta = config.freeDeliveryFrom - subtotal;
    if (falta <= 0) {
      return '¡Felicitaciones! Tu delivery es gratis.';
    }
    return `Te faltan S/ ${falta.toFixed(2)} para delivery gratis.`;
  });

  readonly deliveryIcon = computed(() =>
    this.cart.subtotal() >= this.site.configWeb().freeDeliveryFrom
      ? 'lucideBadgeCheck'
      : 'lucideBike',
  );

  irALaCarta(): void {
    this.ui.closeCart();
    void this.router.navigate(['/carta']);
  }

  seguirComprando(): void {
    this.ui.closeCart();
    if (this.cart.isEmpty()) {
      void this.router.navigate(['/carta']);
    }
  }

  checkout(): void {
    this.ui.closeCart();
    void this.router.navigate(['/checkout']);
  }
}
