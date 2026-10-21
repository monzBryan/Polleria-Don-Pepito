import { Component, computed, inject, input, signal } from '@angular/core';
import { Producto } from '../../core/models';
import { CartService } from '../../core/services/cart.service';
import { ToastService } from '../../core/services/toast.service';
import { SolesPipe } from '../pipes/soles.pipe';
import { ImageFallbackDirective } from '../directives/image-fallback.directive';
import { IconComponent } from './icon.component';

@Component({
  selector: 'app-product-card',
  standalone: true,
  imports: [SolesPipe, ImageFallbackDirective, IconComponent],
  template: `
    <article class="product" [class.product--added]="agregado()">
      <div class="product__media">
        <img
          [src]="producto().imagenUrl"
          [alt]="producto().nombre"
          loading="lazy"
          appImageFallback
        />
        <div class="product__badges">
          @if (producto().esNuevo) {
            <span class="badge badge--gold">Nuevo</span>
          }
          @if (descuento() > 0) {
            <span class="badge badge--red">-{{ descuento() }}%</span>
          }
          @if (producto().destacado) {
            <span class="badge badge--ink">
              <app-icon name="lucideStar" size="11" />
              Top
            </span>
          }
        </div>
        <button
          type="button"
          class="product__add"
          [class.product__add--done]="agregado()"
          [disabled]="!producto().activo"
          [attr.aria-label]="'Agregar ' + producto().nombre + ' al carrito'"
          (click)="agregar()"
        >
          <app-icon [name]="agregado() ? 'lucideCheck' : 'lucidePlus'" size="19" />
        </button>
      </div>

      <div class="product__body">
        <div class="product__meta">
          <span class="product__category">{{ producto().categoriaNombre }}</span>
          @if (producto().nivelPicante > 0) {
            <span class="product__spice" [attr.title]="'Nivel de picante ' + producto().nivelPicante">
              @for (n of [1, 2, 3].slice(0, producto().nivelPicante); track n) {
                <app-icon name="lucideFlame" size="12" />
              }
            </span>
          }
        </div>

        <h3>{{ producto().nombre }}</h3>
        <p>{{ producto().descripcion }}</p>

        <div class="product__foot">
          <div class="product__price">
            <strong>{{ producto().precio | soles }}</strong>
            @if (producto().precioAnterior) {
              <s>{{ producto().precioAnterior | soles }}</s>
            }
          </div>
          <span class="product__time">
            <app-icon name="lucideClock" size="13" />
            {{ producto().tiempoPreparacion }} min
          </span>
        </div>
      </div>
    </article>
  `,
  styles: [
    `
      :host {
        display: block;
        height: 100%;
      }

      .product {
        display: flex;
        flex-direction: column;
        height: 100%;
        border: 1px solid var(--line);
        border-radius: var(--radius-lg);
        background: var(--white);
        overflow: hidden;
        transition: transform 320ms var(--ease), box-shadow 320ms var(--ease),
          border-color 320ms var(--ease);
      }

      .product:hover {
        transform: translateY(-5px);
        border-color: rgba(200, 16, 46, 0.2);
        box-shadow: var(--shadow);
      }

      .product__media {
        position: relative;
        aspect-ratio: 4 / 3;
        overflow: hidden;
        background: var(--cream-2);
      }

      .product__media img {
        width: 100%;
        height: 100%;
        object-fit: cover;
        transition: transform 700ms var(--ease-out);
      }

      .product:hover .product__media img {
        transform: scale(1.055);
      }

      .product__media::after {
        content: '';
        position: absolute;
        inset: 55% 0 0;
        background: linear-gradient(180deg, transparent, rgba(10, 10, 11, 0.22));
        pointer-events: none;
      }

      .product__badges {
        position: absolute;
        top: 12px;
        left: 12px;
        display: flex;
        flex-wrap: wrap;
        gap: 5px;
        z-index: 1;
      }

      .badge {
        display: inline-flex;
        align-items: center;
        gap: 3px;
        padding: 4px 8px;
        border-radius: var(--radius-pill);
        font-size: 9.5px;
        font-weight: 900;
        letter-spacing: 0.06em;
        text-transform: uppercase;
        backdrop-filter: blur(6px);
      }

      .badge--gold {
        background: var(--gold);
        color: var(--ink);
      }

      .badge--red {
        background: var(--red);
        color: var(--white);
      }

      .badge--ink {
        background: rgba(10, 10, 11, 0.78);
        color: var(--cream);
      }

      .product__add {
        position: absolute;
        right: 12px;
        bottom: 12px;
        z-index: 2;
        display: grid;
        place-items: center;
        width: 44px;
        height: 44px;
        border: 0;
        border-radius: 50%;
        background: var(--red);
        color: var(--white);
        cursor: pointer;
        box-shadow: var(--shadow-red);
        transition: transform 220ms var(--ease), background var(--transition);
      }

      .product__add:hover:not(:disabled) {
        transform: scale(1.08) rotate(90deg);
        background: var(--red-dark);
      }

      .product__add:disabled {
        background: var(--muted-2);
        box-shadow: none;
        cursor: not-allowed;
      }

      .product__add--done {
        background: var(--success);
        transform: scale(1.05);
      }

      .product__body {
        display: flex;
        flex: 1;
        flex-direction: column;
        padding: 15px 17px 17px;
      }

      .product__meta {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 8px;
        min-height: 16px;
      }

      .product__category {
        color: var(--red);
        font-size: 9.5px;
        font-weight: 900;
        letter-spacing: 0.14em;
        text-transform: uppercase;
      }

      .product__spice {
        display: inline-flex;
        gap: 1px;
        color: var(--red);
      }

      .product h3 {
        margin: 6px 0 5px;
        font-family: var(--font-display);
        font-size: 19px;
        font-weight: 600;
        line-height: 1.15;
        letter-spacing: -0.01em;
      }

      .product p {
        display: -webkit-box;
        -webkit-line-clamp: 2;
        -webkit-box-orient: vertical;
        overflow: hidden;
        margin: 0 0 14px;
        color: var(--muted);
        font-size: 11.5px;
        line-height: 1.5;
      }

      .product__foot {
        display: flex;
        align-items: flex-end;
        justify-content: space-between;
        gap: 10px;
        margin-top: auto;
      }

      .product__price {
        display: flex;
        align-items: baseline;
        gap: 6px;
      }

      .product__price strong {
        color: var(--ink);
        font-family: var(--font-display);
        font-size: 20px;
        font-weight: 700;
        letter-spacing: -0.02em;
      }

      .product__price s {
        color: var(--muted-2);
        font-size: 11px;
      }

      .product__time {
        display: inline-flex;
        align-items: center;
        gap: 4px;
        color: var(--muted-2);
        font-size: 10px;
        font-weight: 700;
        white-space: nowrap;
      }

      @media (max-width: 480px) {
        .product__body {
          padding: 13px 14px 15px;
        }
        .product h3 {
          font-size: 17px;
        }
        .product__price strong {
          font-size: 18px;
        }
      }
    `,
  ],
})
export class ProductCardComponent {
  readonly producto = input.required<Producto>();
  private readonly cart = inject(CartService);
  private readonly toast = inject(ToastService);
  readonly agregado = signal(false);

  readonly descuento = computed(() => {
    const producto = this.producto();
    if (producto.porcentajeDescuento) return producto.porcentajeDescuento;
    if (producto.precioAnterior && producto.precioAnterior > producto.precio) {
      return Math.round(
        ((producto.precioAnterior - producto.precio) / producto.precioAnterior) * 100,
      );
    }
    return 0;
  });

  agregar(): void {
    if (!this.producto().activo) return;
    this.cart.add(this.producto());
    this.agregado.set(true);
    this.toast.success(`${this.producto().nombre} se agregó a tu carrito.`);
    window.setTimeout(() => this.agregado.set(false), 1400);
  }
}
