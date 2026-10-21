import { Component, computed, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { DashboardService } from '../../../core/services/dashboard.service';
import { formatTime, soles } from '../../../core/utils/format';
import { IconComponent } from '../../../shared/components/icon.component';
import { StatusBadgeComponent } from '../../../shared/components/status-badge.component';
import { ImageFallbackDirective } from '../../../shared/directives/image-fallback.directive';
import { SolesPipe } from '../../../shared/pipes/soles.pipe';

interface Kpi {
  label: string;
  value: string;
  detail: string;
  icon: string;
  tone: 'red' | 'gold' | 'green' | 'ink';
}

@Component({
  selector: 'app-admin-dashboard',
  standalone: true,
  imports: [
    RouterLink,
    IconComponent,
    StatusBadgeComponent,
    ImageFallbackDirective,
    SolesPipe,
  ],
  template: `
    <div class="admin-page">
      <div class="page-head">
        <div class="page-head__info">
          <span class="eyebrow">Panel de operación</span>
          <h1>Hola, {{ nombre() }}</h1>
          <p>{{ fechaLarga() }} · Este es el pulso de Don Pepito hoy.</p>
        </div>
        <div class="page-head__actions">
          <a routerLink="/" class="btn btn--outline btn--sm">
            <app-icon name="lucideExternalLink" size="15" />
            Ver sitio
          </a>
          <a routerLink="/admin/pedidos" class="btn btn--dark btn--sm">
            <app-icon name="lucideClipboardList" size="15" />
            Gestionar pedidos
          </a>
        </div>
      </div>

      <div class="kpi-grid">
        @for (kpi of kpis(); track kpi.label) {
          <article class="kpi" [class]="'kpi kpi--' + kpi.tone">
            <span class="kpi__icon"><app-icon [name]="kpi.icon" size="19" /></span>
            <div class="kpi__body">
              <small>{{ kpi.label }}</small>
              <strong>{{ kpi.value }}</strong>
              <span>{{ kpi.detail }}</span>
            </div>
          </article>
        }
      </div>

      <div class="dash-grid">
        <section class="admin-panel chart-panel">
          <div class="admin-panel__head">
            <div>
              <h2>Ventas de la semana</h2>
              <p>Ingresos de los últimos 7 días</p>
            </div>
            <span class="badge badge--green">
              <app-icon name="lucideTrendingUp" size="12" />
              {{ totalSemana() | soles }}
            </span>
          </div>
          <div class="admin-panel__body">
            <div class="chart">
              @for (venta of data().ventasSemana; track venta.fecha) {
                <div class="chart__col">
                  <span class="chart__value">{{ venta.total | soles }}</span>
                  <div class="chart__track">
                    <div
                      class="chart__bar"
                      [class.chart__bar--today]="$last"
                      [style.height.%]="barPercent(venta.total)"
                    ></div>
                  </div>
                  <span class="chart__label">{{ venta.label }}</span>
                  <span class="chart__orders">{{ venta.pedidos }} ped.</span>
                </div>
              }
            </div>
          </div>
        </section>

        <section class="admin-panel">
          <div class="admin-panel__head">
            <div>
              <h2>Estado de pedidos</h2>
              <p>Distribución del total registrado</p>
            </div>
            <span class="badge badge--outline">{{ totalPedidos() }} pedidos</span>
          </div>
          <div class="admin-panel__body">
            <div class="status-list">
              @for (estado of data().estados; track estado.estado) {
                @if (estado.cantidad > 0) {
                  <div class="status-row">
                    <div class="status-row__top">
                      <span class="status-row__dot" [style.background]="estado.color"></span>
                      <span>{{ estado.label }}</span>
                      <strong>{{ estado.cantidad }}</strong>
                    </div>
                    <div class="status-row__track">
                      <span
                        [style.width.%]="porcentajeEstado(estado.cantidad)"
                        [style.background]="estado.color"
                      ></span>
                    </div>
                  </div>
                }
              }
              @if (totalPedidos() === 0) {
                <div class="admin-empty">
                  <app-icon name="lucideClipboardList" size="26" />
                  <p>Aún no hay pedidos registrados.</p>
                </div>
              }
            </div>
          </div>
        </section>
      </div>

      <div class="dash-grid dash-grid--bottom">
        <section class="admin-panel">
          <div class="admin-panel__head">
            <div>
              <h2>Más vendidos</h2>
              <p>Top 5 por cantidad de unidades</p>
            </div>
            <a routerLink="/admin/productos" class="panel-link">
              Ver catálogo
              <app-icon name="lucideArrowRight" size="13" />
            </a>
          </div>
          <div class="admin-panel__body">
            @if (data().topProductos.length === 0) {
              <div class="admin-empty">
                <app-icon name="lucideUtensilsCrossed" size="26" />
                <p>Los productos más vendidos aparecerán aquí.</p>
              </div>
            } @else {
              <div class="top-list">
                @for (producto of data().topProductos; track producto.nombre; let index = $index) {
                  <div class="top-item">
                    <span class="top-item__rank">{{ index + 1 }}</span>
                    <img
                      [src]="producto.imagenUrl"
                      [alt]="producto.nombre"
                      appImageFallback="/img/fallback-food.svg"
                    />
                    <div class="top-item__body">
                      <strong>{{ producto.nombre }}</strong>
                      <small>{{ producto.cantidad }} unidades vendidas</small>
                    </div>
                    <span class="top-item__total">{{ producto.total | soles }}</span>
                  </div>
                }
              </div>
            }
          </div>
        </section>

        <section class="admin-panel">
          <div class="admin-panel__head">
            <div>
              <h2>Pedidos recientes</h2>
              <p>Últimos movimientos de la operación</p>
            </div>
            <a routerLink="/admin/pedidos" class="panel-link">
              Ver todos
              <app-icon name="lucideArrowRight" size="13" />
            </a>
          </div>
          <div class="admin-panel__body table-wrap">
            @if (data().ultimosPedidos.length === 0) {
              <div class="admin-empty">
                <app-icon name="lucideShoppingBag" size="26" />
                <p>Cuando llegue un pedido, lo verás aquí.</p>
              </div>
            } @else {
              <table class="data-table">
                <thead>
                  <tr>
                    <th>Pedido</th>
                    <th>Entrega</th>
                    <th>Total</th>
                    <th>Estado</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  @for (pedido of data().ultimosPedidos.slice(0, 5); track pedido.id) {
                    <tr>
                      <td>
                        <strong>{{ pedido.codigo }}</strong>
                        <small>{{ pedido.clienteNombre }} · {{ formatTime(pedido.createdAt) }}</small>
                      </td>
                      <td>
                        <span class="badge-soft">
                          <app-icon
                            [name]="pedido.tipoEntrega === 'delivery' ? 'lucideBike' : 'lucideStore'"
                            size="11"
                          />
                          {{ pedido.tipoEntrega === 'delivery' ? 'Delivery' : 'Recojo' }}
                        </span>
                      </td>
                      <td><strong>{{ pedido.total | soles }}</strong></td>
                      <td><app-status-badge [estado]="pedido.estado" size="sm" /></td>
                      <td class="is-right">
                        <a
                          [routerLink]="['/admin/pedidos']"
                          [queryParams]="{ codigo: pedido.codigo }"
                          class="row-link"
                          aria-label="Abrir pedido"
                        >
                          <app-icon name="lucideChevronRight" size="15" />
                        </a>
                      </td>
                    </tr>
                  }
                </tbody>
              </table>
            }
          </div>
        </section>
      </div>
    </div>
  `,
  styles: [
    `
      .kpi-grid {
        display: grid;
        grid-template-columns: repeat(4, 1fr);
        gap: 12px;
      }

      .kpi {
        display: flex;
        align-items: flex-start;
        gap: 11px;
        padding: 15px;
        border: 1px solid rgba(10, 10, 11, 0.08);
        border-radius: 14px;
        background: var(--white);
        box-shadow: 0 8px 22px rgba(10, 10, 11, 0.045);
      }

      .kpi__icon {
        display: grid;
        place-items: center;
        flex: none;
        width: 39px;
        height: 39px;
        border-radius: 11px;
        background: var(--cream-2);
        color: var(--ink);
      }

      .kpi--red .kpi__icon {
        background: var(--red-soft);
        color: var(--red);
      }

      .kpi--gold .kpi__icon {
        background: var(--gold-soft);
        color: var(--gold-dark);
      }

      .kpi--green .kpi__icon {
        background: var(--success-soft);
        color: var(--success);
      }

      .kpi__body {
        display: flex;
        flex-direction: column;
        min-width: 0;
      }

      .kpi__body small {
        color: var(--muted-2);
        font-size: 8px;
        font-weight: 900;
        letter-spacing: 0.09em;
        text-transform: uppercase;
      }

      .kpi__body strong {
        font-family: var(--font-display);
        font-size: 26px;
        font-weight: 600;
        line-height: 1.1;
        letter-spacing: -0.035em;
      }

      .kpi__body span {
        color: var(--muted);
        font-size: 8.5px;
      }

      .dash-grid {
        display: grid;
        grid-template-columns: 1.35fr 0.65fr;
        align-items: stretch;
        gap: 12px;
      }

      .dash-grid--bottom {
        grid-template-columns: 0.9fr 1.1fr;
      }

      .panel-link {
        display: inline-flex;
        align-items: center;
        gap: 3px;
        color: var(--red);
        font-size: 9px;
        font-weight: 800;
      }

      .chart {
        display: grid;
        grid-template-columns: repeat(7, 1fr);
        align-items: end;
        gap: 8px;
        height: 218px;
        padding-top: 20px;
      }

      .chart__col {
        display: flex;
        flex-direction: column;
        align-items: center;
        height: 100%;
        min-width: 0;
      }

      .chart__value {
        color: var(--muted-2);
        font-size: 7.5px;
        font-weight: 800;
        white-space: nowrap;
      }

      .chart__track {
        display: flex;
        align-items: flex-end;
        width: 100%;
        max-width: 42px;
        flex: 1;
        margin: 6px 0 7px;
        border-radius: 7px 7px 3px 3px;
        background: #f8f3eb;
        overflow: hidden;
      }

      .chart__bar {
        width: 100%;
        min-height: 4px;
        border-radius: 7px 7px 3px 3px;
        background: var(--ink);
        transition: height 500ms var(--ease-out);
      }

      .chart__bar--today {
        background: var(--red);
        box-shadow: 0 0 0 3px rgba(200, 16, 46, 0.08);
      }

      .chart__label {
        font-size: 9px;
        font-weight: 900;
        text-transform: uppercase;
      }

      .chart__orders {
        color: var(--muted-2);
        font-size: 7.5px;
      }

      .status-list {
        display: flex;
        flex-direction: column;
        gap: 10px;
      }

      .status-row__top {
        display: flex;
        align-items: center;
        gap: 6px;
        margin-bottom: 4px;
        color: var(--muted);
        font-size: 9.5px;
        font-weight: 700;
      }

      .status-row__top strong {
        margin-left: auto;
        color: var(--ink);
        font-size: 10px;
        font-weight: 900;
      }

      .status-row__dot {
        width: 6px;
        height: 6px;
        border-radius: 50%;
      }

      .status-row__track {
        height: 4px;
        border-radius: var(--radius-pill);
        background: var(--cream-2);
        overflow: hidden;
      }

      .status-row__track span {
        display: block;
        height: 100%;
        border-radius: inherit;
      }

      .top-list {
        display: flex;
        flex-direction: column;
      }

      .top-item {
        display: flex;
        align-items: center;
        gap: 9px;
        padding: 8px 0;
        border-bottom: 1px solid var(--line);
      }

      .top-item:last-child {
        border-bottom: 0;
      }

      .top-item__rank {
        width: 16px;
        color: var(--muted-2);
        font-family: var(--font-display);
        font-size: 14px;
        font-weight: 600;
        text-align: center;
      }

      .top-item img {
        width: 34px;
        height: 34px;
        border-radius: 8px;
        object-fit: cover;
        background: var(--cream-2);
      }

      .top-item__body {
        display: flex;
        flex: 1;
        flex-direction: column;
        min-width: 0;
      }

      .top-item__body strong {
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
        font-size: 10px;
        font-weight: 800;
      }

      .top-item__body small {
        color: var(--muted);
        font-size: 8px;
      }

      .top-item__total {
        color: var(--ink);
        font-size: 10px;
        font-weight: 900;
        white-space: nowrap;
      }

      .row-link {
        display: inline-grid;
        place-items: center;
        width: 26px;
        height: 26px;
        border-radius: 7px;
        color: var(--muted);
        transition: var(--transition);
      }

      .row-link:hover {
        background: var(--cream-2);
        color: var(--ink);
      }

      @media (max-width: 1100px) {
        .kpi-grid {
          grid-template-columns: repeat(2, 1fr);
        }
        .dash-grid,
        .dash-grid--bottom {
          grid-template-columns: 1fr;
        }
      }

      @media (max-width: 560px) {
        .kpi-grid {
          grid-template-columns: 1fr;
        }
        .kpi__body strong {
          font-size: 23px;
        }
      }
    `,
  ],
})
export class AdminDashboardPageComponent {
  private readonly dashboard = inject(DashboardService);
  private readonly auth = inject(AuthService);

  readonly data = this.dashboard.data;

  readonly nombre = computed(
    () => this.auth.perfil()?.nombre.split(' ')[0] ?? 'equipo',
  );

  readonly fechaLarga = computed(() =>
    new Intl.DateTimeFormat('es-PE', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
    }).format(new Date()),
  );

  readonly totalSemana = computed(() =>
    this.data().ventasSemana.reduce((total, dia) => total + dia.total, 0),
  );

  readonly totalPedidos = computed(() =>
    this.data().estados.reduce((total, estado) => total + estado.cantidad, 0),
  );

  readonly kpis = computed<Kpi[]>(() => {
    const data = this.data();
    return [
      {
        label: 'Ventas de hoy',
        value: soles(data.ventasHoy),
        detail: `${data.pedidosHoy} pedidos confirmados`,
        icon: 'lucideWallet',
        tone: 'red',
      },
      {
        label: 'Pedidos de hoy',
        value: String(data.pedidosHoy),
        detail: 'Delivery y recojo',
        icon: 'lucideShoppingBag',
        tone: 'ink',
      },
      {
        label: 'Ticket promedio',
        value: soles(data.ticketPromedio),
        detail: 'Por pedido del día',
        icon: 'lucideTrendingUp',
        tone: 'green',
      },
      {
        label: 'Puntos emitidos',
        value: String(data.puntosEmitidos),
        detail: 'Acumulados hoy',
        icon: 'lucideGift',
        tone: 'gold',
      },
    ];
  });

  private readonly maxVenta = computed(() =>
    Math.max(1, ...this.data().ventasSemana.map((dia) => dia.total)),
  );

  barPercent(total: number): number {
    return total <= 0 ? 4 : Math.max(4, Math.round((total / this.maxVenta()) * 100));
  }

  porcentajeEstado(cantidad: number): number {
    const total = this.totalPedidos();
    return total === 0 ? 0 : Math.round((cantidad / total) * 100);
  }

  formatTime(value: string): string {
    return formatTime(value);
  }
}
