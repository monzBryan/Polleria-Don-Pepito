import { Component, computed, effect, inject, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import {
  CrearPedidoInput,
  MetodoPago,
  TipoEntrega,
} from '../../core/models';
import { AuthService } from '../../core/services/auth.service';
import { CartService } from '../../core/services/cart.service';
import { OrderService } from '../../core/services/order.service';
import { PointsService } from '../../core/services/points.service';
import { SiteConfigService } from '../../core/services/site-config.service';
import { ToastService } from '../../core/services/toast.service';
import { METODOS_PAGO } from '../../core/utils/order-status';
import { normalizePhone } from '../../core/utils/format';
import { IconComponent } from '../../shared/components/icon.component';
import { ImageFallbackDirective } from '../../shared/directives/image-fallback.directive';
import { SolesPipe } from '../../shared/pipes/soles.pipe';

const DISTRITOS = [
  'Ica',
  'La Tinguiña',
  'Parcona',
  'San Juan Bautista',
  'Los Aquijes',
  'Tate',
];

@Component({
  selector: 'app-checkout-page',
  standalone: true,
  imports: [
    RouterLink,
    IconComponent,
    ImageFallbackDirective,
    SolesPipe,
  ],
  template: `
    <section class="checkout-hero">
      <div class="container">
        <nav class="crumbs" aria-label="Ruta de navegación">
          <a routerLink="/">Inicio</a>
          <app-icon name="lucideChevronRight" size="13" />
          <a routerLink="/carrito">Carrito</a>
          <app-icon name="lucideChevronRight" size="13" />
          <span>Checkout</span>
        </nav>
        <div class="checkout-hero__row">
          <div>
            <span class="eyebrow">Paso 2 de 3</span>
            <h1 class="display display--sm">Confirma tu pedido</h1>
          </div>
          <div class="checkout-steps">
            <span class="is-done"><app-icon name="lucideCheck" size="12" /> Carrito</span>
            <span class="is-active">Entrega y pago</span>
            <span>Listo</span>
          </div>
        </div>
      </div>
    </section>

    @if (cart.isEmpty()) {
      <section class="section">
        <div class="container checkout-empty">
          <span class="checkout-empty__icon">
            <app-icon name="lucideShoppingBag" size="32" />
          </span>
          <h2>Tu carrito está vacío</h2>
          <p>Agrega algo rico antes de continuar con el checkout.</p>
          <a routerLink="/carta" class="btn btn--primary">
            Ver la carta
            <app-icon name="lucideArrowRight" size="16" />
          </a>
        </div>
      </section>
    } @else {
      <section class="section checkout-body">
        <div class="container checkout-layout">
          <div class="checkout-main">
            @if (!auth.isLoggedIn()) {
              <div class="auth-gate">
                <span class="auth-gate__icon">
                  <app-icon name="lucideLockKeyhole" size="24" />
                </span>
                <div class="auth-gate__body">
                  <span class="eyebrow">Un paso más</span>
                  <h2>Inicia sesión para confirmar tu pedido</h2>
                  <p>
                    Así podemos guardar tu historial, sumar tus puntos y avisarte
                    cuando tu pedido esté en camino.
                  </p>
                  <div class="auth-gate__actions">
                    <a
                      routerLink="/login"
                      [queryParams]="{ redirect: '/checkout' }"
                      class="btn btn--primary"
                    >
                      Iniciar sesión
                      <app-icon name="lucideArrowRight" size="16" />
                    </a>
                    <a
                      routerLink="/register"
                      [queryParams]="{ redirect: '/checkout' }"
                      class="btn btn--outline"
                    >
                      Crear cuenta
                    </a>
                  </div>
                  <p class="auth-gate__demo">
                    <app-icon name="lucideInfo" size="13" />
                    Demo: cliente@demo.pe · demo1234
                  </p>
                </div>
              </div>
            }

            <div class="checkout-card" [class.is-locked]="!auth.isLoggedIn()">
              <div class="checkout-card__head">
                <span>01</span>
                <div>
                  <h2>Datos de contacto</h2>
                  <p>Te avisaremos por teléfono si necesitamos confirmar algo.</p>
                </div>
              </div>

              <div class="checkout-card__body">
                <div class="contact-summary">
                  <div class="contact-summary__avatar">
                    {{ inicial() }}
                  </div>
                  <div>
                    <strong>{{ auth.perfil()?.nombre ?? 'Tu cuenta' }}</strong>
                    <small>{{ auth.perfil()?.email ?? 'Inicia sesión para continuar' }}</small>
                  </div>
                  @if (auth.isLoggedIn()) {
                    <app-icon name="lucideBadgeCheck" size="18" />
                  }
                </div>

                <div class="form-grid">
                  <label class="field">
                    <span class="field-label">Teléfono de contacto</span>
                    <span class="input-wrap">
                      <app-icon name="lucidePhone" size="16" />
                      <input
                        class="input"
                        type="tel"
                        inputmode="numeric"
                        maxlength="9"
                        placeholder="987654321"
                        [value]="telefono()"
                        (input)="telefono.set($any($event.target).value)"
                      />
                    </span>
                    @if (telefono().length > 0 && !telefonoValido()) {
                      <span class="field-error">Ingresa un teléfono de 9 dígitos.</span>
                    } @else {
                      <span class="hint">Lo usaremos para coordinar la entrega.</span>
                    }
                  </label>

                  <label class="field">
                    <span class="field-label">Correo electrónico</span>
                    <span class="input-wrap">
                      <app-icon name="lucideMail" size="16" />
                      <input
                        class="input"
                        type="email"
                        [value]="auth.perfil()?.email ?? ''"
                        disabled
                      />
                    </span>
                    <span class="hint">El comprobante llegará a este correo.</span>
                  </label>
                </div>
              </div>
            </div>

            <div class="checkout-card" [class.is-locked]="!auth.isLoggedIn()">
              <div class="checkout-card__head">
                <span>02</span>
                <div>
                  <h2>¿Cómo lo quieres recibir?</h2>
                  <p>Elige delivery a domicilio o recoge en la pollería.</p>
                </div>
              </div>

              <div class="checkout-card__body">
                <div class="option-grid">
                  <button
                    type="button"
                    class="option"
                    [class.is-active]="tipoEntrega() === 'delivery'"
                    (click)="tipoEntrega.set('delivery')"
                  >
                    <span class="option__icon">
                      <app-icon name="lucideBike" size="22" />
                    </span>
                    <span class="option__body">
                      <strong>Delivery</strong>
                      <small>
                        {{ deliveryFee() === 0 ? 'Gratis' : (deliveryFee() | soles) }}
                        · 45 min aprox.
                      </small>
                    </span>
                    <span class="option__check">
                      <app-icon name="lucideCheck" size="12" />
                    </span>
                  </button>

                  <button
                    type="button"
                    class="option"
                    [class.is-active]="tipoEntrega() === 'recojo'"
                    (click)="tipoEntrega.set('recojo')"
                  >
                    <span class="option__icon">
                      <app-icon name="lucideStore" size="22" />
                    </span>
                    <span class="option__body">
                      <strong>Recojo en tienda</strong>
                      <small>Listo en 20 min aprox.</small>
                    </span>
                    <span class="option__check">
                      <app-icon name="lucideCheck" size="12" />
                    </span>
                  </button>
                </div>

                @if (tipoEntrega() === 'delivery') {
                  <div class="address">
                    <div class="form-grid form-grid--2">
                      <label class="field">
                        <span class="field-label">Dirección de entrega</span>
                        <span class="input-wrap">
                          <app-icon name="lucideMapPin" size="16" />
                          <input
                            class="input"
                            type="text"
                            placeholder="Av. Los Maestros 123, dpto. 201"
                            [value]="direccion()"
                            (input)="direccion.set($any($event.target).value)"
                          />
                        </span>
                      </label>

                      <label class="field">
                        <span class="field-label">Distrito</span>
                        <select
                          class="select"
                          [value]="distrito()"
                          (change)="distrito.set($any($event.target).value)"
                        >
                          @for (item of distritos; track item) {
                            <option [value]="item">{{ item }}</option>
                          }
                        </select>
                      </label>
                    </div>

                    <label class="field">
                      <span class="field-label">Referencia (opcional)</span>
                      <input
                        class="input"
                        type="text"
                        placeholder="Frente al parque, portón negro..."
                        [value]="referencia()"
                        (input)="referencia.set($any($event.target).value)"
                      />
                    </label>
                  </div>
                } @else {
                  <div class="pickup">
                    <span class="pickup__icon">
                      <app-icon name="lucideMapPin" size="19" />
                    </span>
                    <div>
                      <strong>Recoge tu pedido en</strong>
                      <p>{{ config().direccion }}</p>
                      <small>{{ config().horario }}</small>
                    </div>
                  </div>
                }
              </div>
            </div>

            <div class="checkout-card" [class.is-locked]="!auth.isLoggedIn()">
              <div class="checkout-card__head">
                <span>03</span>
                <div>
                  <h2>Método de pago</h2>
                  <p>Elige cómo prefieres pagar. No te cobraremos ahora.</p>
                </div>
              </div>

              <div class="checkout-card__body">
                <div class="pay-grid">
                  @for (metodo of metodos; track metodo.value) {
                    <button
                      type="button"
                      class="pay"
                      [class.is-active]="metodoPago() === metodo.value"
                      (click)="metodoPago.set(metodo.value)"
                    >
                      <span class="pay__icon">
                        <app-icon [name]="metodo.icono" size="19" />
                      </span>
                      <span class="pay__body">
                        <strong>{{ metodo.label }}</strong>
                        <small>{{ metodo.detalle }}</small>
                      </span>
                      <span class="pay__check">
                        <app-icon name="lucideCheck" size="12" />
                      </span>
                    </button>
                  }
                </div>

                @if (metodoPago() === 'yape' || metodoPago() === 'plin') {
                  <p class="pay-note">
                    <app-icon name="lucideInfo" size="14" />
                    Al confirmar, te mostraremos el número y el QR para completar
                    el pago. También puedes coordinar por WhatsApp.
                  </p>
                }
                @if (metodoPago() === 'tarjeta') {
                  <p class="pay-note">
                    <app-icon name="lucideInfo" size="14" />
                    El pago con tarjeta es una simulación en esta versión de
                    demostración.
                  </p>
                }
              </div>
            </div>

            <div class="checkout-card" [class.is-locked]="!auth.isLoggedIn()">
              <div class="checkout-card__head">
                <span>04</span>
                <div>
                  <h2>Puntos y notas</h2>
                  <p>Canjea tus puntos y cuéntanos si hay algo especial.</p>
                </div>
              </div>

              <div class="checkout-card__body">
                @if (maxPuntos() > 0) {
                  <div class="points-box">
                    <div class="points-box__head">
                      <div>
                        <span class="points-box__label">
                          <app-icon name="lucideGift" size="15" />
                          Canjear puntos
                        </span>
                        <p>
                          Tienes {{ saldoPuntos() }} puntos. Puedes usar hasta
                          {{ maxPuntos() }} en este pedido.
                        </p>
                      </div>
                      <button type="button" class="points-box__max" (click)="usarMaximo()">
                        Usar máximo
                      </button>
                    </div>

                    <input
                      class="range"
                      type="range"
                      min="0"
                      [max]="maxPuntos()"
                      [step]="bloqueCanje()"
                      [value]="puntosAplicados()"
                      (input)="setPuntos($any($event.target).value)"
                      aria-label="Puntos a canjear"
                    />

                    <div class="points-box__foot">
                      <span>
                        <strong>{{ puntosAplicados() }}</strong> puntos canjeados
                      </span>
                      <span>
                        Descuento:
                        <strong>{{ descuento() | soles }}</strong>
                      </span>
                    </div>
                  </div>
                } @else {
                  <p class="points-empty">
                    <app-icon name="lucideGift" size="15" />
                    @if (auth.isLoggedIn()) {
                      Aún no tienes puntos canjeables. Con este pedido ganarás
                      <strong>{{ puntosGanados() }}</strong>.
                    } @else {
                      Inicia sesión para acumular y canjear puntos en tus pedidos.
                    }
                  </p>
                }

                <label class="field notes">
                  <span class="field-label">Notas para el pedido (opcional)</span>
                  <textarea
                    class="textarea"
                    placeholder="Sin ají, papas extra crocantes, tocar el timbre al llegar..."
                    [value]="notas()"
                    (input)="notas.set($any($event.target).value)"
                  ></textarea>
                </label>
              </div>
            </div>
          </div>

          <aside class="checkout-summary">
            <div class="checkout-summary__card">
              <div class="checkout-summary__head">
                <h2>Tu pedido</h2>
                <a routerLink="/carrito">Editar</a>
              </div>

              <div class="checkout-items">
                @for (item of cart.items(); track item.producto.id) {
                  <div class="checkout-item">
                    <span class="checkout-item__qty">{{ item.cantidad }}x</span>
                    <img
                      [src]="item.producto.imagenUrl"
                      [alt]="item.producto.nombre"
                      appImageFallback
                    />
                    <div class="checkout-item__body">
                      <strong>{{ item.producto.nombre }}</strong>
                      @if (item.nota) {
                        <small>{{ item.nota }}</small>
                      }
                    </div>
                    <span class="checkout-item__price">
                      {{ item.producto.precio * item.cantidad | soles }}
                    </span>
                  </div>
                }
              </div>

              <div class="checkout-sums">
                <div>
                  <span>Subtotal</span>
                  <strong>{{ cart.subtotal() | soles }}</strong>
                </div>
                <div>
                  <span>Delivery</span>
                  <strong>
                    @if (tipoEntrega() === 'delivery') {
                      {{ deliveryFee() === 0 ? 'Gratis' : (deliveryFee() | soles) }}
                    } @else {
                      —
                    }
                  </strong>
                </div>
                @if (descuento() > 0) {
                  <div class="is-discount">
                    <span>Descuento por puntos</span>
                    <strong>-{{ descuento() | soles }}</strong>
                  </div>
                }
              </div>

              <div class="checkout-total">
                <span>Total</span>
                <strong>{{ total() | soles }}</strong>
              </div>

              <p class="checkout-earn">
                <app-icon name="lucideGift" size="14" />
                Ganarás <strong>{{ puntosGanados() }} puntos</strong> con este
                pedido.
              </p>

              @if (subtotalBajoMinimo()) {
                <p class="checkout-warning">
                  <app-icon name="lucideAlertTriangle" size="14" />
                  El pedido mínimo es {{ config().pedidoMinimo | soles }}. Agrega
                  un producto más para continuar.
                </p>
              }

              <label class="checkbox terms">
                <input
                  type="checkbox"
                  [checked]="terminos()"
                  (change)="terminos.set($any($event.target).checked)"
                />
                <span>
                  Acepto los
                  <a routerLink="/legal/terminos" target="_blank">términos y condiciones</a>
                  y la
                  <a routerLink="/legal/privacidad" target="_blank">política de privacidad</a>.
                </span>
              </label>

              <button
                type="button"
                class="btn btn--primary btn--block btn--lg"
                [disabled]="!puedeConfirmar()"
                (click)="confirmarPedido()"
              >
                @if (enviando()) {
                  <app-icon name="lucideLoaderCircle" size="18" class="spin" />
                  Confirmando...
                } @else {
                  Confirmar pedido
                  <app-icon name="lucideArrowRight" size="17" />
                }
              </button>

              <a routerLink="/carrito" class="checkout-back">
                <app-icon name="lucideArrowLeft" size="14" />
                Volver al carrito
              </a>

              <div class="checkout-trust">
                <span><app-icon name="lucideShieldCheck" size="14" /> Datos protegidos</span>
                <span><app-icon name="lucideClock" size="14" /> Preparación al momento</span>
              </div>
            </div>
          </aside>
        </div>
      </section>
    }
  `,
  styles: [
    `
      .checkout-hero {
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

      .checkout-hero__row {
        display: flex;
        align-items: flex-end;
        justify-content: space-between;
        gap: 20px;
      }

      .checkout-steps {
        display: flex;
        align-items: center;
        gap: 4px;
        padding: 4px;
        border: 1px solid var(--line);
        border-radius: var(--radius-pill);
        background: var(--white);
      }

      .checkout-steps span {
        display: inline-flex;
        align-items: center;
        gap: 4px;
        padding: 7px 11px;
        border-radius: var(--radius-pill);
        color: var(--muted-2);
        font-size: 9.5px;
        font-weight: 800;
      }

      .checkout-steps .is-done {
        color: var(--success);
      }

      .checkout-steps .is-active {
        background: var(--ink);
        color: var(--cream);
      }

      .checkout-body {
        padding-top: 18px;
      }

      .checkout-layout {
        display: grid;
        grid-template-columns: 1fr 380px;
        align-items: start;
        gap: 24px;
      }

      .checkout-main {
        display: flex;
        flex-direction: column;
        gap: 14px;
      }

      .auth-gate {
        display: flex;
        align-items: flex-start;
        gap: 15px;
        padding: 20px;
        border: 1px solid rgba(200, 16, 46, 0.18);
        border-radius: var(--radius-lg);
        background: linear-gradient(135deg, var(--white), var(--red-soft));
      }

      .auth-gate__icon {
        display: grid;
        place-items: center;
        flex: none;
        width: 48px;
        height: 48px;
        border-radius: 14px;
        background: var(--red);
        color: var(--white);
      }

      .auth-gate__body h2 {
        margin: 2px 0 5px;
        font-size: 22px;
      }

      .auth-gate__body p {
        max-width: 58ch;
        color: var(--muted);
        font-size: 12px;
        line-height: 1.6;
      }

      .auth-gate__actions {
        display: flex;
        flex-wrap: wrap;
        gap: 8px;
        margin-top: 13px;
      }

      .auth-gate__demo {
        display: flex;
        align-items: center;
        gap: 5px;
        margin-top: 10px;
        color: var(--muted-2) !important;
        font-size: 10px !important;
      }

      .checkout-card {
        border: 1px solid var(--line);
        border-radius: var(--radius-lg);
        background: var(--white);
        box-shadow: var(--shadow-sm);
        overflow: hidden;
        transition: opacity var(--transition);
      }

      .checkout-card.is-locked {
        opacity: 0.55;
        pointer-events: none;
      }

      .checkout-card__head {
        display: flex;
        align-items: flex-start;
        gap: 12px;
        padding: 18px 20px 14px;
        border-bottom: 1px solid var(--line);
        background: var(--cream);
      }

      .checkout-card__head > span {
        display: grid;
        place-items: center;
        flex: none;
        width: 30px;
        height: 30px;
        border-radius: 50%;
        background: var(--ink);
        color: var(--gold);
        font-family: var(--font-display);
        font-size: 11px;
        font-weight: 600;
      }

      .checkout-card__head h2 {
        font-family: var(--font-display);
        font-size: 20px;
        font-weight: 600;
      }

      .checkout-card__head p {
        margin-top: 2px;
        color: var(--muted);
        font-size: 10.5px;
      }

      .checkout-card__body {
        padding: 18px 20px 20px;
      }

      .contact-summary {
        display: flex;
        align-items: center;
        gap: 10px;
        margin-bottom: 16px;
        padding: 10px 12px;
        border-radius: 12px;
        background: var(--cream-2);
      }

      .contact-summary__avatar {
        display: grid;
        place-items: center;
        width: 36px;
        height: 36px;
        border-radius: 50%;
        background: var(--ink);
        color: var(--gold);
        font-family: var(--font-display);
        font-size: 14px;
        font-weight: 700;
      }

      .contact-summary > div:nth-child(2) {
        display: flex;
        flex: 1;
        flex-direction: column;
        min-width: 0;
      }

      .contact-summary strong {
        font-size: 12px;
        font-weight: 800;
      }

      .contact-summary small {
        overflow: hidden;
        text-overflow: ellipsis;
        color: var(--muted);
        font-size: 10px;
      }

      .contact-summary app-icon {
        color: var(--success);
      }

      .form-grid {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 14px;
      }

      .form-grid--2 {
        margin-bottom: 12px;
      }

      .input-wrap {
        position: relative;
        display: flex;
        align-items: center;
      }

      .input-wrap app-icon {
        position: absolute;
        left: 13px;
        z-index: 1;
        color: var(--muted-2);
        pointer-events: none;
      }

      .input-wrap .input {
        padding-left: 38px;
      }

      .option-grid {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 10px;
        margin-bottom: 14px;
      }

      .option {
        display: flex;
        align-items: center;
        gap: 11px;
        padding: 13px;
        border: 1px solid var(--line);
        border-radius: 14px;
        background: var(--white);
        text-align: left;
        transition: var(--transition);
      }

      .option:hover {
        border-color: var(--line-strong);
      }

      .option.is-active {
        border-color: var(--red);
        background: var(--red-soft);
      }

      .option__icon {
        display: grid;
        place-items: center;
        flex: none;
        width: 40px;
        height: 40px;
        border-radius: 11px;
        background: var(--cream-2);
        color: var(--ink);
      }

      .option.is-active .option__icon {
        background: var(--red);
        color: var(--white);
      }

      .option__body {
        display: flex;
        flex: 1;
        flex-direction: column;
        min-width: 0;
      }

      .option__body strong {
        font-size: 11.5px;
        font-weight: 800;
      }

      .option__body small {
        margin-top: 1px;
        color: var(--muted);
        font-size: 9.5px;
      }

      .option__check,
      .pay__check {
        display: grid;
        place-items: center;
        flex: none;
        width: 19px;
        height: 19px;
        border: 1px solid var(--line-strong);
        border-radius: 50%;
        color: transparent;
      }

      .option.is-active .option__check,
      .pay.is-active .pay__check {
        border-color: var(--red);
        background: var(--red);
        color: var(--white);
      }

      .pickup {
        display: flex;
        align-items: flex-start;
        gap: 11px;
        padding: 14px;
        border-radius: 12px;
        background: var(--cream-2);
      }

      .pickup__icon {
        display: grid;
        place-items: center;
        flex: none;
        width: 36px;
        height: 36px;
        border-radius: 50%;
        background: var(--white);
        color: var(--red);
      }

      .pickup strong {
        font-size: 11.5px;
        font-weight: 800;
      }

      .pickup p {
        margin: 2px 0;
        font-size: 11px;
        color: var(--ink-muted);
      }

      .pickup small {
        color: var(--muted);
        font-size: 9.5px;
      }

      .pay-grid {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 9px;
      }

      .pay {
        display: flex;
        align-items: center;
        gap: 10px;
        padding: 11px;
        border: 1px solid var(--line);
        border-radius: 13px;
        background: var(--white);
        text-align: left;
        transition: var(--transition);
      }

      .pay:hover {
        border-color: var(--line-strong);
      }

      .pay.is-active {
        border-color: var(--red);
        background: var(--red-soft);
      }

      .pay__icon {
        display: grid;
        place-items: center;
        flex: none;
        width: 36px;
        height: 36px;
        border-radius: 10px;
        background: var(--cream-2);
        color: var(--ink);
      }

      .pay.is-active .pay__icon {
        background: var(--red);
        color: var(--white);
      }

      .pay__body {
        display: flex;
        flex: 1;
        flex-direction: column;
        min-width: 0;
      }

      .pay__body strong {
        font-size: 11.5px;
        font-weight: 800;
      }

      .pay__body small {
        margin-top: 1px;
        color: var(--muted);
        font-size: 9px;
        line-height: 1.3;
      }

      .pay-note {
        display: flex;
        align-items: flex-start;
        gap: 6px;
        margin-top: 11px;
        padding: 9px 11px;
        border-radius: 9px;
        background: var(--info-soft);
        color: var(--info);
        font-size: 9.5px;
        line-height: 1.5;
      }

      .points-box {
        margin-bottom: 16px;
        padding: 14px;
        border: 1px solid var(--gold);
        border-radius: 14px;
        background: var(--gold-soft);
      }

      .points-box__head {
        display: flex;
        align-items: flex-start;
        justify-content: space-between;
        gap: 10px;
      }

      .points-box__label {
        display: inline-flex;
        align-items: center;
        gap: 5px;
        color: var(--gold-dark);
        font-size: 11px;
        font-weight: 900;
      }

      .points-box__head p {
        margin-top: 2px;
        color: var(--gold-dark);
        font-size: 9.5px;
        line-height: 1.4;
        opacity: 0.85;
      }

      .points-box__max {
        flex: none;
        padding: 5px 9px;
        border: 1px solid rgba(185, 130, 31, 0.4);
        border-radius: var(--radius-pill);
        background: rgba(255, 255, 255, 0.5);
        color: var(--gold-dark);
        font-size: 8.5px;
        font-weight: 900;
        cursor: pointer;
      }

      .range {
        width: 100%;
        margin: 14px 0 8px;
        accent-color: var(--red);
        cursor: pointer;
      }

      .points-box__foot {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 10px;
        color: var(--gold-dark);
        font-size: 9.5px;
      }

      .points-box__foot strong {
        font-size: 11px;
        font-weight: 900;
      }

      .points-empty {
        display: flex;
        align-items: flex-start;
        gap: 7px;
        margin-bottom: 16px;
        padding: 10px 12px;
        border-radius: 10px;
        background: var(--cream-2);
        color: var(--muted);
        font-size: 10px;
        line-height: 1.5;
      }

      .points-empty app-icon {
        flex: none;
        color: var(--gold-dark);
      }

      .points-empty strong {
        color: var(--ink);
      }

      .notes {
        margin-top: 2px;
      }

      .checkout-summary {
        position: sticky;
        top: calc(var(--header-h) + 18px);
      }

      .checkout-summary__card {
        padding: 20px;
        border: 1px solid var(--line);
        border-radius: var(--radius-lg);
        background: var(--white);
        box-shadow: var(--shadow);
      }

      .checkout-summary__head {
        display: flex;
        align-items: baseline;
        justify-content: space-between;
        margin-bottom: 12px;
      }

      .checkout-summary__head h2 {
        font-family: var(--font-display);
        font-size: 21px;
        font-weight: 600;
      }

      .checkout-summary__head a {
        color: var(--red);
        font-size: 10px;
        font-weight: 800;
        text-decoration: underline;
      }

      .checkout-items {
        display: flex;
        flex-direction: column;
        gap: 9px;
        max-height: 260px;
        overflow-y: auto;
        padding-right: 4px;
      }

      .checkout-item {
        display: flex;
        align-items: center;
        gap: 8px;
      }

      .checkout-item__qty {
        flex: none;
        min-width: 22px;
        color: var(--red);
        font-size: 10px;
        font-weight: 900;
      }

      .checkout-item img {
        width: 38px;
        height: 38px;
        border-radius: 8px;
        object-fit: cover;
        background: var(--cream-2);
      }

      .checkout-item__body {
        display: flex;
        flex: 1;
        flex-direction: column;
        min-width: 0;
      }

      .checkout-item__body strong {
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
        font-size: 10.5px;
        font-weight: 800;
      }

      .checkout-item__body small {
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
        color: var(--gold-dark);
        font-size: 8.5px;
      }

      .checkout-item__price {
        font-size: 10.5px;
        font-weight: 800;
        white-space: nowrap;
      }

      .checkout-sums {
        display: grid;
        gap: 6px;
        margin-top: 14px;
        padding-top: 14px;
        border-top: 1px solid var(--line);
      }

      .checkout-sums div {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 10px;
        color: var(--muted);
        font-size: 10.5px;
      }

      .checkout-sums strong {
        color: var(--ink);
        font-size: 11px;
        font-weight: 800;
      }

      .checkout-sums .is-discount,
      .checkout-sums .is-discount strong {
        color: var(--success);
      }

      .checkout-total {
        display: flex;
        align-items: baseline;
        justify-content: space-between;
        gap: 10px;
        margin-top: 10px;
        padding-top: 13px;
        border-top: 1px solid var(--line);
      }

      .checkout-total span {
        font-size: 11px;
        font-weight: 800;
      }

      .checkout-total strong {
        font-family: var(--font-display);
        font-size: 29px;
        font-weight: 600;
        letter-spacing: -0.03em;
      }

      .checkout-earn {
        display: flex;
        align-items: center;
        gap: 5px;
        margin: 9px 0 0;
        padding: 8px 10px;
        border-radius: 8px;
        background: var(--gold-soft);
        color: var(--gold-dark);
        font-size: 9.5px;
      }

      .checkout-warning {
        display: flex;
        align-items: flex-start;
        gap: 6px;
        margin-top: 9px;
        padding: 8px 10px;
        border-radius: 8px;
        background: var(--warning-soft);
        color: var(--warning);
        font-size: 9.5px;
        line-height: 1.4;
      }

      .terms {
        margin: 14px 0;
        font-size: 9.5px;
      }

      .terms a {
        color: var(--red);
        text-decoration: underline;
      }

      .checkout-back {
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 5px;
        margin-top: 11px;
        color: var(--muted);
        font-size: 10px;
        font-weight: 800;
      }

      .checkout-trust {
        display: flex;
        flex-wrap: wrap;
        gap: 8px 14px;
        margin-top: 14px;
        padding-top: 12px;
        border-top: 1px solid var(--line);
      }

      .checkout-trust span {
        display: inline-flex;
        align-items: center;
        gap: 4px;
        color: var(--muted-2);
        font-size: 8.5px;
        font-weight: 700;
      }

      .checkout-empty {
        display: flex;
        flex-direction: column;
        align-items: center;
        padding-block: 60px;
        text-align: center;
      }

      .checkout-empty__icon {
        display: grid;
        place-items: center;
        width: 80px;
        height: 80px;
        margin-bottom: 16px;
        border-radius: 50%;
        background: var(--cream-2);
        color: var(--red);
      }

      .checkout-empty h2 {
        font-size: 26px;
      }

      .checkout-empty p {
        margin: 6px 0 18px;
        color: var(--muted);
        font-size: 13px;
      }

      @media (max-width: 1024px) {
        .checkout-layout {
          grid-template-columns: 1fr;
        }
        .checkout-summary {
          position: static;
        }
      }

      @media (max-width: 760px) {
        .checkout-hero__row {
          flex-direction: column;
          align-items: flex-start;
        }
        .form-grid,
        .option-grid,
        .pay-grid {
          grid-template-columns: 1fr;
        }
        .checkout-card__head,
        .checkout-card__body {
          padding-inline: 16px;
        }
        .auth-gate {
          flex-direction: column;
        }
      }
    `,
  ],
})
export class CheckoutPageComponent {
  readonly auth = inject(AuthService);
  readonly cart = inject(CartService);
  private readonly orders = inject(OrderService);
  private readonly points = inject(PointsService);
  private readonly site = inject(SiteConfigService);
  private readonly toast = inject(ToastService);
  private readonly router = inject(Router);

  readonly metodos = METODOS_PAGO;
  readonly distritos = DISTRITOS;

  readonly tipoEntrega = signal<TipoEntrega>('delivery');
  readonly metodoPago = signal<MetodoPago>('efectivo');
  readonly telefono = signal(this.auth.perfil()?.telefono ?? '');
  readonly direccion = signal('');
  readonly referencia = signal('');
  readonly distrito = signal('Ica');
  readonly notas = signal('');
  readonly terminos = signal(false);
  readonly puntosUsados = signal(0);
  readonly enviando = signal(false);

  readonly config = computed(() => this.site.configWeb());
  readonly bloqueCanje = computed(() => this.points.config().bloqueCanje);
  readonly saldoPuntos = computed(() => this.auth.perfil()?.puntos ?? 0);
  readonly maxPuntos = computed(() =>
    this.points.maxPuntos(this.cart.subtotal(), this.saldoPuntos()),
  );
  readonly puntosAplicados = computed(() =>
    Math.min(this.points.normalizar(this.puntosUsados()), this.maxPuntos()),
  );
  readonly descuento = computed(() =>
    this.points.descuento(this.puntosAplicados()),
  );
  readonly deliveryFee = computed(() =>
    this.site.deliveryFee(this.cart.subtotal(), this.tipoEntrega()),
  );
  readonly total = computed(() =>
    Math.max(
      0,
      Number(
        (
          this.cart.subtotal() -
          this.descuento() +
          this.deliveryFee()
        ).toFixed(2),
      ),
    ),
  );
  readonly puntosGanados = computed(() =>
    this.points.ganados(this.cart.subtotal(), this.descuento()),
  );
  readonly telefonoValido = computed(
    () => normalizePhone(this.telefono()).length === 9,
  );
  readonly subtotalBajoMinimo = computed(
    () => this.cart.subtotal() < this.config().pedidoMinimo,
  );
  readonly inicial = computed(
    () => this.auth.perfil()?.nombre.trim().charAt(0).toUpperCase() ?? 'P',
  );
  readonly puedeConfirmar = computed(
    () =>
      this.auth.isLoggedIn() &&
      !this.enviando() &&
      !this.cart.isEmpty() &&
      this.telefonoValido() &&
      !this.subtotalBajoMinimo() &&
      this.terminos() &&
      (this.tipoEntrega() !== 'delivery' || this.direccion().trim().length > 3),
  );

  constructor() {
    effect(() => {
      const telefono = this.auth.perfil()?.telefono ?? '';
      if (telefono && !this.telefono()) {
        this.telefono.set(telefono);
      }
    });
  }

  setPuntos(value: string): void {
    this.puntosUsados.set(this.points.normalizar(Number(value)));
  }

  usarMaximo(): void {
    this.puntosUsados.set(this.maxPuntos());
  }

  async confirmarPedido(): Promise<void> {
    const perfil = this.auth.perfil();
    if (!perfil) {
      this.toast.warning('Inicia sesión para confirmar tu pedido.');
      await this.router.navigate(['/login'], {
        queryParams: { redirect: '/checkout' },
      });
      return;
    }
    if (this.cart.isEmpty()) {
      this.toast.warning('Tu carrito está vacío.');
      return;
    }
    if (!this.telefonoValido()) {
      this.toast.warning('Ingresa un teléfono de 9 dígitos.');
      return;
    }
    if (this.tipoEntrega() === 'delivery' && this.direccion().trim().length < 4) {
      this.toast.warning('Ingresa tu dirección de entrega.');
      return;
    }
    if (this.subtotalBajoMinimo()) {
      this.toast.warning(
        `El pedido mínimo es ${this.config().pedidoMinimo.toFixed(2)} soles.`,
      );
      return;
    }
    if (!this.terminos()) {
      this.toast.warning('Acepta los términos y condiciones para continuar.');
      return;
    }

    const input: CrearPedidoInput = {
      perfilId: perfil.id,
      clienteNombre: perfil.nombre,
      clienteEmail: perfil.email,
      clienteTelefono: normalizePhone(this.telefono()),
      tipoEntrega: this.tipoEntrega(),
      direccion:
        this.tipoEntrega() === 'delivery' ? this.direccion().trim() : undefined,
      referencia:
        this.tipoEntrega() === 'delivery' ? this.referencia().trim() : undefined,
      distrito:
        this.tipoEntrega() === 'delivery' ? this.distrito() : undefined,
      metodoPago: this.metodoPago(),
      notas: this.notas().trim(),
      items: this.cart.items().map((item) => ({
        productoId: item.producto.id,
        cantidad: item.cantidad,
        nota: item.nota,
      })),
      puntosUsados: this.puntosAplicados(),
    };

    this.enviando.set(true);
    try {
      const pedido = await this.orders.crearPedido(input);
      this.cart.clear();
      this.toast.success(
        `Pedido ${pedido.codigo} confirmado. Ya lo estamos preparando.`,
      );
      await this.router.navigate(['/pedido', pedido.codigo]);
    } catch (error) {
      this.toast.error(
        error instanceof Error ? error.message : 'No pudimos crear tu pedido.',
      );
    } finally {
      this.enviando.set(false);
    }
  }
}
