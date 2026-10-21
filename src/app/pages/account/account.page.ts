import { Component, computed, effect, inject, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { Pedido, TipoTransaccion } from '../../core/models';
import { AuthService } from '../../core/services/auth.service';
import { CartService } from '../../core/services/cart.service';
import { CatalogService } from '../../core/services/catalog.service';
import { DemoStoreService } from '../../core/services/demo-store.service';
import { OrderService } from '../../core/services/order.service';
import { PointsService } from '../../core/services/points.service';
import { ToastService } from '../../core/services/toast.service';
import { formatDate, formatTime, normalizePhone, relativeDay } from '../../core/utils/format';
import { EmptyStateComponent } from '../../shared/components/empty-state.component';
import { IconComponent } from '../../shared/components/icon.component';
import { StatusBadgeComponent } from '../../shared/components/status-badge.component';
import { SolesPipe } from '../../shared/pipes/soles.pipe';

type TabCuenta = 'resumen' | 'pedidos' | 'puntos' | 'perfil';

const TIPO_TRANSACCION: Record<TipoTransaccion, { label: string; icon: string }> = {
  bienvenida: { label: 'Bono de bienvenida', icon: 'lucideSparkles' },
  ganado: { label: 'Puntos ganados', icon: 'lucidePlus' },
  canjeado: { label: 'Puntos canjeados', icon: 'lucideGift' },
  ajuste: { label: 'Ajuste de puntos', icon: 'lucideRefreshCw' },
};

@Component({
  selector: 'app-account-page',
  standalone: true,
  imports: [
    RouterLink,
    EmptyStateComponent,
    IconComponent,
    StatusBadgeComponent,
    SolesPipe,
  ],
  template: `
    @if (auth.perfil(); as perfil) {
      <section class="account-hero">
        <div class="container account-hero__grid">
          <div class="account-profile">
            <span class="account-profile__avatar">{{ inicial() }}</span>
            <div class="account-profile__info">
              <span class="eyebrow">Mi cuenta</span>
              <h1>{{ perfil.nombre }}</h1>
              <p>{{ perfil.email }} · Miembro desde {{ formatDate(perfil.createdAt) }}</p>
              <div class="account-profile__badges">
                <span class="badge badge--gold">
                  <app-icon name="lucideAward" size="12" />
                  Club Don Pepito
                </span>
                @if (perfil.rol === 'admin') {
                  <span class="badge badge--dark">
                    <app-icon name="lucideShieldCheck" size="12" />
                    Administrador
                  </span>
                }
              </div>
            </div>
          </div>

          <div class="account-points">
            <div>
              <small>Puntos disponibles</small>
              <strong>{{ perfil.puntos }}</strong>
            </div>
            <p>1 punto por cada S/ 1 · 100 puntos = S/ 1 de descuento.</p>
          </div>
        </div>
      </section>

      <div class="account-tabs">
        <div class="container account-tabs__inner">
          @for (tab of tabs; track tab.id) {
            <button
              type="button"
              [class.is-active]="activo() === tab.id"
              (click)="activo.set(tab.id)"
            >
              <app-icon [name]="tab.icon" size="15" />
              {{ tab.label }}
            </button>
          }
          @if (perfil.rol === 'admin') {
            <a routerLink="/admin" class="account-tabs__admin">
              <app-icon name="lucideLayoutDashboard" size="15" />
              Panel admin
            </a>
          }
        </div>
      </div>

      <section class="section account-body">
        <div class="container">
          @switch (activo()) {
            @case ('resumen') {
              <div class="stat-grid">
                <div class="stat">
                  <span class="stat__icon"><app-icon name="lucideShoppingBag" size="19" /></span>
                  <div><small>Pedidos realizados</small><strong>{{ pedidos().length }}</strong></div>
                </div>
                <div class="stat">
                  <span class="stat__icon stat__icon--gold">
                    <app-icon name="lucideWallet" size="19" />
                  </span>
                  <div><small>Total gastado</small><strong>{{ totalGastado() | soles }}</strong></div>
                </div>
                <div class="stat">
                  <span class="stat__icon stat__icon--red">
                    <app-icon name="lucideGift" size="19" />
                  </span>
                  <div><small>Puntos disponibles</small><strong>{{ perfil.puntos }}</strong></div>
                </div>
                <div class="stat">
                  <span class="stat__icon stat__icon--green">
                    <app-icon name="lucideTrendingUp" size="19" />
                  </span>
                  <div>
                    <small>Equivalen a</small>
                    <strong>{{ pointsService.equivalencia(perfil.puntos) | soles }}</strong>
                  </div>
                </div>
              </div>

              <div class="account-columns">
                <div class="panel">
                  <div class="panel__head">
                    <div>
                      <span class="eyebrow">Historial</span>
                      <h2>Últimos pedidos</h2>
                    </div>
                    @if (pedidos().length > 3) {
                      <button type="button" class="panel__link" (click)="activo.set('pedidos')">
                        Ver todos
                        <app-icon name="lucideArrowRight" size="14" />
                      </button>
                    }
                  </div>

                  @if (pedidos().length === 0) {
                    <app-empty-state
                      icon="lucideShoppingBag"
                      title="Aún no tienes pedidos"
                      message="Cuando hagas tu primer pedido, aparecerá aquí con su estado en tiempo real."
                      actionLabel="Ver la carta"
                      (action)="irALaCarta()"
                    />
                  } @else {
                    <div class="order-list">
                      @for (pedido of ultimosPedidos(); track pedido.id) {
                        <article class="order-row">
                          <span class="order-row__icon">
                            <app-icon
                              [name]="pedido.tipoEntrega === 'delivery' ? 'lucideBike' : 'lucideStore'"
                              size="17"
                            />
                          </span>
                          <div class="order-row__body">
                            <div>
                              <strong>{{ pedido.codigo }}</strong>
                              <app-status-badge [estado]="pedido.estado" size="sm" />
                            </div>
                            <small>
                              {{ relativeDay(pedido.createdAt) }} ·
                              {{ pedido.items.length }} ítems · {{ pedido.total | soles }}
                            </small>
                          </div>
                          <a [routerLink]="['/pedido', pedido.codigo]" class="order-row__link">
                            Ver
                            <app-icon name="lucideChevronRight" size="14" />
                          </a>
                        </article>
                      }
                    </div>
                  }
                </div>

                <div class="panel panel--dark">
                  <span class="eyebrow eyebrow--gold">Club Don Pepito</span>
                  <h2>Tus puntos, tu recompensa.</h2>
                  <p class="panel__lead">
                    Cada S/ 1 suma un punto. Cada 100 puntos son S/ 1 de descuento.
                    Así de simple.
                  </p>
                  <div class="club-mini">
                    <div>
                      <small>Saldo actual</small>
                      <strong>{{ perfil.puntos }} pts</strong>
                    </div>
                    <div>
                      <small>Equivalen a</small>
                      <strong>{{ pointsService.equivalencia(perfil.puntos) | soles }}</strong>
                    </div>
                  </div>
                  <button type="button" class="btn btn--gold btn--block" (click)="activo.set('puntos')">
                    Ver mis puntos
                    <app-icon name="lucideArrowRight" size="16" />
                  </button>
                </div>
              </div>
            }

            @case ('pedidos') {
              <div class="panel">
                <div class="panel__head">
                  <div>
                    <span class="eyebrow">Historial completo</span>
                    <h2>Mis pedidos</h2>
                  </div>
                  <a routerLink="/carta" class="btn btn--outline btn--sm">
                    Hacer un pedido
                    <app-icon name="lucideArrowRight" size="14" />
                  </a>
                </div>

                @if (pedidos().length === 0) {
                  <app-empty-state
                    icon="lucideShoppingBag"
                    title="Aún no tienes pedidos"
                    message="Tu historial aparecerá aquí en cuanto confirmes tu primer pedido."
                    actionLabel="Ver la carta"
                    (action)="irALaCarta()"
                  />
                } @else {
                  <div class="orders-full">
                    @for (pedido of pedidos(); track pedido.id) {
                      <article class="order-card">
                        <div class="order-card__head">
                          <div>
                            <span class="order-card__code">{{ pedido.codigo }}</span>
                            <app-status-badge [estado]="pedido.estado" size="sm" />
                          </div>
                          <span class="order-card__date">
                            <app-icon name="lucideCalendar" size="13" />
                            {{ formatDate(pedido.createdAt) }} · {{ formatTime(pedido.createdAt) }}
                          </span>
                        </div>

                        <div class="order-card__items">
                          @for (item of pedido.items.slice(0, 4); track item.productoId + '-' + $index) {
                            <span>{{ item.cantidad }}x {{ item.nombre }}</span>
                          }
                          @if (pedido.items.length > 4) {
                            <span>+{{ pedido.items.length - 4 }} más</span>
                          }
                        </div>

                        <div class="order-card__foot">
                          <div class="order-card__total">
                            <small>Total</small>
                            <strong>{{ pedido.total | soles }}</strong>
                          </div>
                          <div class="order-card__actions">
                            <a [routerLink]="['/pedido', pedido.codigo]" class="btn btn--dark btn--sm">
                              Seguir pedido
                              <app-icon name="lucideArrowRight" size="14" />
                            </a>
                            <button type="button" class="btn btn--ghost btn--sm" (click)="volverAPedir(pedido)">
                              <app-icon name="lucideRotateCcw" size="14" />
                              Repetir
                            </button>
                          </div>
                        </div>
                      </article>
                    }
                  </div>
                }
              </div>
            }

            @case ('puntos') {
              <div class="points-layout">
                <div class="panel points-balance">
                  <span class="eyebrow">Mi saldo</span>
                  <div class="points-balance__number">
                    <strong>{{ perfil.puntos }}</strong>
                    <span>puntos</span>
                  </div>
                  <p>
                    Equivalen a
                    <strong>{{ pointsService.equivalencia(perfil.puntos) | soles }}</strong>
                    de descuento.
                  </p>

                  <a routerLink="/carta" class="btn btn--gold btn--block">
                    Usar mis puntos
                    <app-icon name="lucideArrowRight" size="16" />
                  </a>
                </div>

                <div class="panel">
                  <div class="panel__head">
                    <div>
                      <span class="eyebrow">Movimientos</span>
                      <h2>Historial de puntos</h2>
                    </div>
                  </div>

                  @if (transacciones().length === 0) {
                    <app-empty-state
                      icon="lucideGift"
                      title="Sin movimientos todavía"
                      message="Tus puntos ganados y canjeados aparecerán aquí."
                    />
                  } @else {
                    <div class="tx-list">
                      @for (tx of transacciones(); track tx.id) {
                        <div class="tx">
                          <span class="tx__icon" [class.tx__icon--negative]="tx.puntos < 0">
                            <app-icon [name]="tipoInfo[tx.tipo].icon" size="15" />
                          </span>
                          <div class="tx__body">
                            <strong>{{ tx.descripcion }}</strong>
                            <small>{{ tipoInfo[tx.tipo].label }} · {{ formatDate(tx.createdAt) }}</small>
                          </div>
                          <span class="tx__points" [class.is-negative]="tx.puntos < 0">
                            {{ tx.puntos > 0 ? '+' : '' }}{{ tx.puntos }}
                          </span>
                        </div>
                      }
                    </div>
                  }
                </div>
              </div>
            }

            @case ('perfil') {
              <div class="profile-layout">
                <div class="panel">
                  <div class="panel__head">
                    <div>
                      <span class="eyebrow">Datos personales</span>
                      <h2>Mi perfil</h2>
                    </div>
                  </div>

                  <form class="profile-form" (submit)="guardarPerfil($event)">
                    <div class="form-grid">
                      <label class="field">
                        <span class="field-label">Nombre completo</span>
                        <span class="input-wrap">
                          <app-icon name="lucideUser" size="16" />
                          <input
                            class="input"
                            type="text"
                            [value]="nombre()"
                            (input)="nombre.set($any($event.target).value)"
                          />
                        </span>
                      </label>

                      <label class="field">
                        <span class="field-label">Teléfono</span>
                        <span class="input-wrap">
                          <app-icon name="lucidePhone" size="16" />
                          <input
                            class="input"
                            type="tel"
                            maxlength="9"
                            [value]="telefono()"
                            (input)="telefono.set($any($event.target).value)"
                          />
                        </span>
                      </label>
                    </div>

                    <label class="field">
                      <span class="field-label">Correo electrónico</span>
                      <span class="input-wrap">
                        <app-icon name="lucideMail" size="16" />
                        <input class="input" type="email" [value]="perfil.email" disabled />
                      </span>
                      <span class="hint">El correo no se puede cambiar desde aquí.</span>
                    </label>

                    <button type="submit" class="btn btn--primary" [disabled]="guardando()">
                      @if (guardando()) {
                        <app-icon name="lucideLoaderCircle" size="16" class="spin" />
                        Guardando...
                      } @else {
                        <app-icon name="lucideSave" size="16" />
                        Guardar cambios
                      }
                    </button>
                  </form>
                </div>

                <div class="profile-side">
                  <div class="panel">
                    <h2>Mi cuenta</h2>
                    <div class="profile-meta">
                      <div>
                        <small>Rol</small>
                        <strong class="profile-meta__role">
                          {{ perfil.rol === 'admin' ? 'Administrador' : 'Cliente' }}
                        </strong>
                      </div>
                      <div>
                        <small>Miembro desde</small>
                        <strong>{{ formatDate(perfil.createdAt) }}</strong>
                      </div>
                      <div>
                        <small>Puntos</small>
                        <strong>{{ perfil.puntos }}</strong>
                      </div>
                    </div>
                  </div>

                  <div class="panel panel--danger">
                    <h2>Sesión</h2>
                    <p>
                      Cierra sesión en este dispositivo. Tu carrito y tus puntos
                      seguirán guardados en tu cuenta.
                    </p>
                    <button type="button" class="btn btn--danger btn--block" (click)="cerrarSesion()">
                      <app-icon name="lucideLogOut" size="16" />
                      Cerrar sesión
                    </button>
                  </div>
                </div>
              </div>
            }
          }
        </div>
      </section>
    }
  `,
  styles: [
    `
      .account-hero {
        padding: clamp(30px, 4vw, 46px) 0 26px;
        background:
          radial-gradient(circle at 90% 0%, rgba(232, 181, 77, 0.16), transparent 30%),
          var(--cream);
      }

      .account-hero__grid {
        display: grid;
        grid-template-columns: 1fr 340px;
        align-items: center;
        gap: 24px;
      }

      .account-profile {
        display: flex;
        align-items: center;
        gap: 16px;
      }

      .account-profile__avatar {
        display: grid;
        place-items: center;
        flex: none;
        width: 84px;
        height: 84px;
        border-radius: 50%;
        background: var(--ink);
        color: var(--gold);
        font-family: var(--font-display);
        font-size: 33px;
        font-weight: 600;
        box-shadow: var(--shadow);
      }

      .account-profile__info h1 {
        margin: 2px 0 3px;
        font-family: var(--font-display);
        font-size: clamp(2rem, 3.4vw, 2.8rem);
        font-weight: 600;
        letter-spacing: -0.04em;
      }

      .account-profile__info > p {
        color: var(--muted);
        font-size: 11px;
      }

      .account-profile__badges {
        display: flex;
        flex-wrap: wrap;
        gap: 5px;
        margin-top: 9px;
      }

      .account-points {
        padding: 18px 20px;
        border-radius: var(--radius-lg);
        background: var(--ink);
        color: var(--cream);
        box-shadow: var(--shadow);
      }

      .account-points > div:first-child {
        display: flex;
        align-items: baseline;
        justify-content: space-between;
        gap: 10px;
      }

      .account-points small {
        color: rgba(255, 248, 238, 0.5);
        font-size: 8.5px;
        font-weight: 900;
        letter-spacing: 0.1em;
        text-transform: uppercase;
      }

      .account-points strong {
        color: var(--gold);
        font-family: var(--font-display);
        font-size: 34px;
        font-weight: 600;
        line-height: 1;
      }

      .account-points__bar {
        height: 5px;
        margin: 12px 0 7px;
        border-radius: var(--radius-pill);
        background: rgba(255, 248, 238, 0.14);
        overflow: hidden;
      }

      .account-points__bar span {
        display: block;
        height: 100%;
        border-radius: inherit;
        background: var(--gold);
      }

      .account-points p {
        color: rgba(255, 248, 238, 0.5);
        font-size: 9px;
      }

      .account-tabs {
        position: sticky;
        top: var(--header-h);
        z-index: 30;
        border-block: 1px solid var(--line);
        background: rgba(255, 248, 238, 0.95);
        backdrop-filter: blur(14px);
      }

      .account-tabs__inner {
        display: flex;
        gap: 4px;
        padding-block: 10px;
        overflow-x: auto;
        scrollbar-width: none;
      }

      .account-tabs__inner::-webkit-scrollbar {
        display: none;
      }

      .account-tabs button,
      .account-tabs__admin {
        display: inline-flex;
        align-items: center;
        gap: 6px;
        flex: none;
        padding: 8px 13px;
        border: 0;
        border-radius: var(--radius-pill);
        background: transparent;
        color: var(--muted);
        font-size: 11.5px;
        font-weight: 800;
        cursor: pointer;
        transition: var(--transition);
      }

      .account-tabs button:hover,
      .account-tabs__admin:hover {
        background: var(--cream-2);
        color: var(--ink);
      }

      .account-tabs button.is-active {
        background: var(--ink);
        color: var(--cream);
      }

      .account-tabs__admin {
        margin-left: auto;
        color: var(--gold-dark);
      }

      .account-body {
        padding-top: 24px;
      }

      .stat-grid {
        display: grid;
        grid-template-columns: repeat(4, 1fr);
        gap: 12px;
        margin-bottom: 16px;
      }

      .stat {
        display: flex;
        align-items: center;
        gap: 11px;
        padding: 16px;
        border: 1px solid var(--line);
        border-radius: var(--radius);
        background: var(--white);
        box-shadow: var(--shadow-sm);
      }

      .stat__icon {
        display: grid;
        place-items: center;
        flex: none;
        width: 38px;
        height: 38px;
        border-radius: 11px;
        background: var(--cream-2);
        color: var(--ink);
      }

      .stat__icon--gold {
        background: var(--gold-soft);
        color: var(--gold-dark);
      }

      .stat__icon--red {
        background: var(--red-soft);
        color: var(--red);
      }

      .stat__icon--green {
        background: var(--success-soft);
        color: var(--success);
      }

      .stat div {
        display: flex;
        flex-direction: column;
        min-width: 0;
      }

      .stat small {
        color: var(--muted-2);
        font-size: 8.5px;
        font-weight: 800;
        letter-spacing: 0.06em;
        text-transform: uppercase;
      }

      .stat strong {
        font-family: var(--font-display);
        font-size: 22px;
        font-weight: 600;
        line-height: 1.1;
      }

      .account-columns {
        display: grid;
        grid-template-columns: 1fr 350px;
        align-items: start;
        gap: 16px;
      }

      .panel {
        padding: 20px;
        border: 1px solid var(--line);
        border-radius: var(--radius-lg);
        background: var(--white);
        box-shadow: var(--shadow-sm);
      }

      .panel--dark {
        background:
          radial-gradient(circle at 88% 8%, rgba(232, 181, 77, 0.2), transparent 34%),
          var(--ink);
        color: var(--cream);
        border-color: transparent;
      }

      .panel--danger {
        border-color: rgba(180, 35, 24, 0.16);
        background: #fffaf9;
      }

      .panel__head {
        display: flex;
        align-items: flex-start;
        justify-content: space-between;
        gap: 14px;
        margin-bottom: 16px;
      }

      .panel__head h2,
      .panel > h2 {
        font-family: var(--font-display);
        font-size: 21px;
        font-weight: 600;
      }

      .panel__link {
        display: inline-flex;
        align-items: center;
        gap: 4px;
        border: 0;
        background: transparent;
        color: var(--red);
        font-size: 10px;
        font-weight: 800;
        cursor: pointer;
      }

      .panel--dark .panel__lead {
        margin: 8px 0 16px;
        color: rgba(255, 248, 238, 0.55);
        font-size: 11px;
        line-height: 1.6;
      }

      .order-list {
        display: flex;
        flex-direction: column;
      }

      .order-row {
        display: flex;
        align-items: center;
        gap: 10px;
        padding: 11px 0;
        border-bottom: 1px solid var(--line);
      }

      .order-row:last-child {
        padding-bottom: 0;
        border-bottom: 0;
      }

      .order-row__icon {
        display: grid;
        place-items: center;
        flex: none;
        width: 36px;
        height: 36px;
        border-radius: 10px;
        background: var(--cream-2);
        color: var(--ink);
      }

      .order-row__body {
        flex: 1;
        min-width: 0;
      }

      .order-row__body > div {
        display: flex;
        align-items: center;
        gap: 7px;
      }

      .order-row__body strong {
        font-size: 11px;
        font-weight: 900;
        letter-spacing: 0.02em;
      }

      .order-row__body small {
        display: block;
        margin-top: 2px;
        color: var(--muted);
        font-size: 9.5px;
      }

      .order-row__link {
        display: inline-flex;
        align-items: center;
        gap: 2px;
        flex: none;
        color: var(--red);
        font-size: 9.5px;
        font-weight: 800;
      }

      .club-mini {
        display: flex;
        justify-content: space-between;
        gap: 12px;
        padding: 12px 0;
        border-block: 1px solid rgba(255, 248, 238, 0.12);
      }

      .club-mini div {
        display: flex;
        flex-direction: column;
      }

      .club-mini small {
        color: rgba(255, 248, 238, 0.42);
        font-size: 8px;
        font-weight: 800;
        letter-spacing: 0.08em;
        text-transform: uppercase;
      }

      .club-mini strong {
        color: var(--gold);
        font-family: var(--font-display);
        font-size: 20px;
        font-weight: 600;
      }

      .club-mini__bar {
        height: 4px;
        margin: 12px 0 16px;
        border-radius: var(--radius-pill);
        background: rgba(255, 248, 238, 0.14);
        overflow: hidden;
      }

      .club-mini__bar span {
        display: block;
        height: 100%;
        border-radius: inherit;
        background: var(--gold);
      }

      .orders-full {
        display: grid;
        gap: 10px;
      }

      .order-card {
        padding: 15px;
        border: 1px solid var(--line);
        border-radius: 14px;
        background: var(--white);
      }

      .order-card__head {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 12px;
        padding-bottom: 10px;
        border-bottom: 1px solid var(--line);
      }

      .order-card__head > div {
        display: flex;
        align-items: center;
        gap: 8px;
      }

      .order-card__code {
        font-size: 10.5px;
        font-weight: 900;
        letter-spacing: 0.05em;
      }

      .order-card__date {
        display: inline-flex;
        align-items: center;
        gap: 4px;
        color: var(--muted-2);
        font-size: 9px;
        font-weight: 700;
      }

      .order-card__items {
        display: flex;
        flex-wrap: wrap;
        gap: 5px 10px;
        padding: 10px 0;
        color: var(--muted);
        font-size: 9.5px;
      }

      .order-card__foot {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 12px;
      }

      .order-card__total {
        display: flex;
        align-items: baseline;
        gap: 5px;
      }

      .order-card__total small {
        color: var(--muted-2);
        font-size: 8.5px;
        font-weight: 800;
        text-transform: uppercase;
      }

      .order-card__total strong {
        font-family: var(--font-display);
        font-size: 19px;
        font-weight: 600;
      }

      .order-card__actions {
        display: flex;
        gap: 6px;
      }

      .points-layout {
        display: grid;
        grid-template-columns: 330px 1fr;
        align-items: start;
        gap: 16px;
      }

      .points-balance__number {
        display: flex;
        align-items: baseline;
        gap: 7px;
        margin: 8px 0 2px;
      }

      .points-balance__number strong {
        font-family: var(--font-display);
        font-size: 56px;
        font-weight: 600;
        line-height: 1;
        letter-spacing: -0.05em;
      }

      .points-balance__number span {
        color: var(--muted-2);
        font-size: 10px;
        font-weight: 800;
        letter-spacing: 0.08em;
        text-transform: uppercase;
      }

      .points-balance > p {
        color: var(--muted);
        font-size: 10.5px;
      }

      .points-balance > p strong {
        color: var(--ink);
      }

      .points-balance__level {
        margin: 18px 0;
        padding: 13px;
        border-radius: 12px;
        background: var(--cream-2);
      }

      .points-balance__level > div:first-child {
        display: flex;
        align-items: baseline;
        justify-content: space-between;
        gap: 8px;
      }

      .points-balance__level span {
        font-size: 10px;
        font-weight: 900;
      }

      .points-balance__level small {
        color: var(--muted);
        font-size: 8.5px;
      }

      .points-balance__bar {
        height: 5px;
        margin-top: 8px;
        border-radius: var(--radius-pill);
        background: var(--white);
        overflow: hidden;
      }

      .points-balance__bar span {
        display: block;
        height: 100%;
        border-radius: inherit;
        background: var(--red);
      }

      .tx-list {
        display: flex;
        flex-direction: column;
      }

      .tx {
        display: flex;
        align-items: center;
        gap: 10px;
        padding: 10px 0;
        border-bottom: 1px solid var(--line);
      }

      .tx:last-child {
        border-bottom: 0;
      }

      .tx__icon {
        display: grid;
        place-items: center;
        flex: none;
        width: 33px;
        height: 33px;
        border-radius: 50%;
        background: var(--success-soft);
        color: var(--success);
      }

      .tx__icon--negative {
        background: var(--gold-soft);
        color: var(--gold-dark);
      }

      .tx__body {
        display: flex;
        flex: 1;
        flex-direction: column;
        min-width: 0;
      }

      .tx__body strong {
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
        font-size: 10.5px;
        font-weight: 800;
      }

      .tx__body small {
        color: var(--muted);
        font-size: 8.5px;
      }

      .tx__points {
        color: var(--success);
        font-size: 12px;
        font-weight: 900;
        white-space: nowrap;
      }

      .tx__points.is-negative {
        color: var(--gold-dark);
      }

      .profile-layout {
        display: grid;
        grid-template-columns: 1fr 330px;
        align-items: start;
        gap: 16px;
      }

      .profile-form {
        display: grid;
        gap: 13px;
      }

      .form-grid {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 12px;
      }

      .input-wrap {
        position: relative;
        display: flex;
        align-items: center;
      }

      .input-wrap > app-icon {
        position: absolute;
        left: 13px;
        z-index: 1;
        color: var(--muted-2);
        pointer-events: none;
      }

      .input-wrap .input {
        padding-left: 38px;
      }

      .profile-form > button {
        justify-self: start;
        margin-top: 3px;
      }

      .profile-side {
        display: flex;
        flex-direction: column;
        gap: 14px;
      }

      .profile-meta {
        display: grid;
        gap: 11px;
        margin-top: 13px;
      }

      .profile-meta div {
        display: flex;
        align-items: baseline;
        justify-content: space-between;
        gap: 10px;
        padding-bottom: 9px;
        border-bottom: 1px solid var(--line);
      }

      .profile-meta div:last-child {
        padding-bottom: 0;
        border-bottom: 0;
      }

      .profile-meta small {
        color: var(--muted-2);
        font-size: 9px;
        font-weight: 800;
        letter-spacing: 0.06em;
        text-transform: uppercase;
      }

      .profile-meta strong {
        font-size: 10.5px;
        font-weight: 800;
      }

      .profile-meta__role {
        color: var(--red);
      }

      .panel--danger > p {
        margin: 7px 0 13px;
        color: var(--muted);
        font-size: 10px;
        line-height: 1.55;
      }

      @media (max-width: 1024px) {
        .account-hero__grid {
          grid-template-columns: 1fr;
        }
        .account-columns,
        .points-layout,
        .profile-layout {
          grid-template-columns: 1fr;
        }
        .stat-grid {
          grid-template-columns: repeat(2, 1fr);
        }
        .account-tabs__admin {
          margin-left: 0;
        }
      }

      @media (max-width: 640px) {
        .account-profile {
          flex-direction: column;
          align-items: flex-start;
        }
        .account-profile__avatar {
          width: 68px;
          height: 68px;
          font-size: 27px;
        }
        .stat-grid {
          grid-template-columns: 1fr 1fr;
        }
        .stat {
          padding: 12px;
        }
        .stat strong {
          font-size: 18px;
        }
        .form-grid {
          grid-template-columns: 1fr;
        }
        .order-card__head,
        .order-card__foot {
          flex-direction: column;
          align-items: flex-start;
        }
      }
    `,
  ],
})
export class AccountPageComponent {
  readonly auth = inject(AuthService);
  readonly pointsService = inject(PointsService);
  private readonly orders = inject(OrderService);
  private readonly catalog = inject(CatalogService);
  private readonly cart = inject(CartService);
  private readonly demo = inject(DemoStoreService);
  private readonly router = inject(Router);
  private readonly toast = inject(ToastService);

  readonly activo = signal<TabCuenta>('resumen');
  readonly guardando = signal(false);
  readonly nombre = signal('');
  readonly telefono = signal('');
  readonly tipoInfo = TIPO_TRANSACCION;

  readonly tabs = [
    { id: 'resumen', label: 'Resumen', icon: 'lucideLayoutDashboard' },
    { id: 'pedidos', label: 'Mis pedidos', icon: 'lucideShoppingBag' },
    { id: 'puntos', label: 'Mis puntos', icon: 'lucideGift' },
    { id: 'perfil', label: 'Mi perfil', icon: 'lucideSettings' },
  ] as const;

  readonly inicial = computed(
    () => this.auth.perfil()?.nombre.trim().charAt(0).toUpperCase() ?? 'P',
  );

  readonly pedidos = computed(() => {
    const perfil = this.auth.perfil();
    return perfil ? this.orders.pedidosDePerfil(perfil.id) : [];
  });

  readonly ultimosPedidos = computed(() => this.pedidos().slice(0, 3));

  readonly totalGastado = computed(() =>
    this.pedidos()
      .filter((pedido) => pedido.estado !== 'cancelado')
      .reduce((total, pedido) => total + pedido.total, 0),
  );



  readonly transacciones = computed(() => {
    const perfil = this.auth.perfil();
    if (!perfil) return [];
    return this.auth.demoMode ? this.demo.transaccionesDePerfil(perfil.id) : [];
  });

  constructor() {
    effect(() => {
      const perfil = this.auth.perfil();
      if (perfil) {
        this.nombre.set(perfil.nombre);
        this.telefono.set(perfil.telefono);
      }
    });
  }

  formatDate(value: string): string {
    return formatDate(value);
  }

  formatTime(value: string): string {
    return formatTime(value);
  }

  relativeDay(value: string): string {
    return relativeDay(value);
  }

  async guardarPerfil(event?: Event): Promise<void> {
    event?.preventDefault();
    const nombre = this.nombre().trim();
    const telefono = normalizePhone(this.telefono());
    if (nombre.length < 2) {
      this.toast.warning('Ingresa tu nombre completo.');
      return;
    }
    if (telefono.length !== 9) {
      this.toast.warning('Ingresa un teléfono de 9 dígitos.');
      return;
    }
    this.guardando.set(true);
    try {
      await this.auth.actualizarPerfil(nombre, telefono);
      this.toast.success('Actualizamos tus datos.');
    } catch (error) {
      this.toast.error(
        error instanceof Error ? error.message : 'No pudimos guardar tus datos.',
      );
    } finally {
      this.guardando.set(false);
    }
  }

  irALaCarta(): void {
    void this.router.navigate(['/carta']);
  }

  volverAPedir(pedido: Pedido): void {
    let agregados = 0;
    for (const item of pedido.items) {
      const producto = this.catalog.productos().find((p) => p.id === item.productoId);
      if (!producto) continue;
      this.cart.add(producto, item.cantidad, item.nota);
      agregados += 1;
    }
    if (agregados === 0) {
      this.toast.error('Los productos de este pedido ya no están disponibles.');
      return;
    }
    this.toast.success(`${agregados} productos agregados al carrito.`);
    void this.router.navigate(['/carrito']);
  }

  async cerrarSesion(): Promise<void> {
    await this.auth.logout();
    this.toast.info('Cerraste sesión correctamente.');
    await this.router.navigate(['/']);
  }
}
