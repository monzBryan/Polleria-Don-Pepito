import { Component, computed, inject, signal } from '@angular/core';
import { MetodoPago, Pedido } from '../../../core/models';
import { CatalogService } from '../../../core/services/catalog.service';
import { OrderService } from '../../../core/services/order.service';
import { ToastService } from '../../../core/services/toast.service';
import { formatDate } from '../../../core/utils/format';
import { IconComponent } from '../../../shared/components/icon.component';
import { SolesPipe } from '../../../shared/pipes/soles.pipe';

const PAGOS: Record<MetodoPago, string> = {
  efectivo: 'Efectivo',
  yape: 'Yape',
  plin: 'Plin',
  tarjeta: 'Tarjeta',
};

function isoDate(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

function daysAgo(days: number): string {
  const date = new Date();
  date.setDate(date.getDate() - days);
  return isoDate(date);
}

@Component({
  selector: 'app-admin-reports-page',
  standalone: true,
  imports: [IconComponent, SolesPipe],
  template: `
    <div class="admin-page">
      <header class="page-head">
        <div class="page-head__info">
          <span class="eyebrow">Análisis</span>
          <h1>Reportes</h1>
          <p>Ventas, métodos de pago y productos más pedidos por rango de fechas.</p>
        </div>
        <div class="page-head__actions">
          <button type="button" class="btn btn--outline btn--sm" (click)="exportar()" [disabled]="!pedidosFiltrados().length">
            <app-icon name="lucideDownload" size="14" />
            Exportar CSV
          </button>
        </div>
      </header>

      <div class="report-filter">
        <label class="field">
          <span class="field-label">Desde</span>
          <input class="input" type="date" [value]="desde()" (change)="desde.set($any($event.target).value)" />
        </label>
        <label class="field">
          <span class="field-label">Hasta</span>
          <input class="input" type="date" [value]="hasta()" (change)="hasta.set($any($event.target).value)" />
        </label>
        <div class="report-filter__presets">
          <button type="button" class="btn btn--ghost btn--sm" (click)="rango(7)">7 días</button>
          <button type="button" class="btn btn--ghost btn--sm" (click)="rango(30)">30 días</button>
          <button type="button" class="btn btn--ghost btn--sm" (click)="rango(90)">90 días</button>
        </div>
        <div class="report-filter__summary">
          <app-icon name="lucideCalendarRange" size="16" />
          <span>{{ fecha(desde()) }} — {{ fecha(hasta()) }}</span>
        </div>
      </div>

      <div class="report-kpis">
        <article>
          <span class="report-kpis__icon is-sales"><app-icon name="lucideWallet" size="19" /></span>
          <div>
            <small>Ventas netas</small>
            <strong>{{ ventas() | soles }}</strong>
            <span>{{ pedidosFiltrados().length }} pedidos</span>
          </div>
        </article>
        <article>
          <span class="report-kpis__icon is-ticket"><app-icon name="lucideReceipt" size="19" /></span>
          <div>
            <small>Ticket promedio</small>
            <strong>{{ ticket() | soles }}</strong>
            <span>Sin pedidos cancelados</span>
          </div>
        </article>
        <article>
          <span class="report-kpis__icon is-points"><app-icon name="lucideGift" size="19" /></span>
          <div>
            <small>Puntos otorgados</small>
            <strong>{{ puntos() }}</strong>
            <span>Acumulados en el periodo</span>
          </div>
        </article>
        <article>
          <span class="report-kpis__icon is-cancel"><app-icon name="lucideXCircle" size="19" /></span>
          <div>
            <small>Cancelados</small>
            <strong>{{ cancelados() }}</strong>
            <span>{{ tasaCancelacion() }}% del total</span>
          </div>
        </article>
      </div>

      <div class="report-grid">
        <section class="admin-panel">
          <div class="admin-panel__head">
            <div>
              <h2>Ventas por día</h2>
              <p>Monto total de pedidos no cancelados.</p>
            </div>
            <span class="badge-soft">{{ porDia().length }} días con ventas</span>
          </div>
          <div class="admin-panel__body">
            @if (barras().length) {
              <div class="bars">
                @for (dia of barras(); track dia.fecha) {
                  <div class="bar">
                    <span class="bar__value">{{ dia.total | soles }}</span>
                    <div class="bar__track">
                      <span [style.height.%]="dia.altura"></span>
                    </div>
                    <small>{{ dia.label }}</small>
                    <em>{{ dia.pedidos }} ped.</em>
                  </div>
                }
              </div>
            } @else {
              <div class="admin-empty">
                <app-icon name="lucideChartColumn" size="28" />
                <p>No hay ventas en este rango de fechas.</p>
              </div>
            }
          </div>
        </section>

        <section class="admin-panel">
          <div class="admin-panel__head">
            <div>
              <h2>Métodos de pago</h2>
              <p>Preferencia de los clientes en el periodo.</p>
            </div>
          </div>
          <div class="admin-panel__body">
            <div class="pay-list">
              @for (pago of pagos(); track pago.id) {
                <div class="pay-row">
                  <div class="pay-row__top">
                    <span>
                      <i [style.background]="pago.color"></i>
                      {{ pago.label }}
                    </span>
                    <strong>{{ pago.total | soles }}</strong>
                  </div>
                  <div class="pay-row__bar">
                    <span [style.width.%]="pago.porcentaje" [style.background]="pago.color"></span>
                  </div>
                  <small>{{ pago.pedidos }} pedidos · {{ pago.porcentaje }}%</small>
                </div>
              } @empty {
                <div class="admin-empty">
                  <app-icon name="lucideCreditCard" size="28" />
                  <p>Sin pagos registrados en el rango.</p>
                </div>
              }
            </div>
          </div>
        </section>
      </div>

      <div class="report-grid report-grid--bottom">
        <section class="admin-panel">
          <div class="admin-panel__head">
            <div>
              <h2>Ventas por categoría</h2>
              <p>Participación sobre el total vendido.</p>
            </div>
          </div>
          <div class="admin-panel__body">
            <div class="category-list">
              @for (categoria of categorias(); track categoria.nombre) {
                <div class="category-row">
                  <div>
                    <strong>{{ categoria.nombre }}</strong>
                    <small>{{ categoria.cantidad }} unidades</small>
                  </div>
                  <div class="category-row__bar">
                    <span [style.width.%]="categoria.porcentaje"></span>
                  </div>
                  <strong>{{ categoria.total | soles }}</strong>
                </div>
              } @empty {
                <div class="admin-empty">
                  <app-icon name="lucideChartPie" size="28" />
                  <p>Sin ventas por categoría en el rango.</p>
                </div>
              }
            </div>
          </div>
        </section>

        <section class="admin-panel">
          <div class="admin-panel__head">
            <div>
              <h2>Top productos</h2>
              <p>Los más pedidos en el periodo seleccionado.</p>
            </div>
          </div>
          <div class="admin-panel__body">
            <div class="top-list">
              @for (producto of topProductos(); track producto.nombre; let i = $index) {
                <div class="top-row">
                  <span class="top-row__rank">{{ i + 1 }}</span>
                  <div class="top-row__text">
                    <strong>{{ producto.nombre }}</strong>
                    <small>{{ producto.cantidad }} vendidos</small>
                  </div>
                  <strong>{{ producto.total | soles }}</strong>
                </div>
              } @empty {
                <div class="admin-empty">
                  <app-icon name="lucidePackage" size="28" />
                  <p>Sin productos vendidos en el rango.</p>
                </div>
              }
            </div>
          </div>
        </section>
      </div>
    </div>
  `,
  styles: [
    `
      :host {
        display: block;
      }

      .report-filter {
        display: flex;
        align-items: flex-end;
        gap: 10px;
        flex-wrap: wrap;
        padding: 14px 16px;
        border: 1px solid rgba(10, 10, 11, 0.08);
        border-radius: 14px;
        background: var(--white);
      }

      .report-filter .field {
        min-width: 150px;
      }

      .report-filter .input {
        min-height: 38px;
        font-size: 10.5px;
      }

      .report-filter__presets {
        display: flex;
        gap: 3px;
      }

      .report-filter__summary {
        display: flex;
        align-items: center;
        gap: 6px;
        margin-left: auto;
        padding: 9px 12px;
        border-radius: 8px;
        background: var(--cream-2);
        color: var(--muted);
        font-size: 9.5px;
      }

      .report-filter__summary app-icon {
        color: var(--red);
      }

      .report-kpis {
        display: grid;
        grid-template-columns: repeat(4, 1fr);
        gap: 12px;
      }

      .report-kpis article {
        display: flex;
        align-items: center;
        gap: 12px;
        padding: 16px;
        border: 1px solid rgba(10, 10, 11, 0.08);
        border-radius: 14px;
        background: var(--white);
      }

      .report-kpis__icon {
        display: grid;
        place-items: center;
        width: 40px;
        height: 40px;
        border-radius: 10px;
        flex: none;
      }

      .report-kpis__icon.is-sales {
        background: rgba(47, 143, 91, 0.1);
        color: #2f8f5b;
      }

      .report-kpis__icon.is-ticket {
        background: rgba(37, 99, 168, 0.1);
        color: #2563a8;
      }

      .report-kpis__icon.is-points {
        background: var(--gold-soft);
        color: var(--gold-dark);
      }

      .report-kpis__icon.is-cancel {
        background: rgba(200, 16, 46, 0.09);
        color: var(--red);
      }

      .report-kpis div {
        display: grid;
        gap: 1px;
      }

      .report-kpis small {
        color: var(--muted);
        font-size: 8.5px;
      }

      .report-kpis strong {
        font-family: var(--font-display);
        font-size: 21px;
        font-weight: 600;
        line-height: 1.1;
      }

      .report-kpis span {
        color: var(--muted);
        font-size: 8px;
      }

      .report-grid {
        display: grid;
        grid-template-columns: 1.45fr 0.55fr;
        gap: 14px;
      }

      .report-grid--bottom {
        grid-template-columns: 1fr 1fr;
      }

      .bars {
        display: flex;
        align-items: flex-end;
        gap: 6px;
        height: 230px;
        padding-top: 24px;
        overflow-x: auto;
      }

      .bar {
        display: flex;
        flex: 1;
        flex-direction: column;
        align-items: center;
        justify-content: flex-end;
        gap: 4px;
        min-width: 32px;
        height: 100%;
      }

      .bar__value {
        color: var(--muted);
        font-size: 7px;
        white-space: nowrap;
      }

      .bar__track {
        display: flex;
        align-items: flex-end;
        width: 100%;
        max-width: 34px;
        height: 150px;
        border-radius: 5px;
        background: var(--cream-2);
      }

      .bar__track span {
        width: 100%;
        min-height: 4px;
        border-radius: 5px;
        background: linear-gradient(var(--red), var(--red-dark));
        transition: height 400ms var(--ease-out);
      }

      .bar small {
        color: var(--ink-soft);
        font-size: 7.5px;
        white-space: nowrap;
      }

      .bar em {
        color: var(--muted-2);
        font-size: 7px;
        font-style: normal;
        white-space: nowrap;
      }

      .pay-list,
      .category-list,
      .top-list {
        display: grid;
        gap: 12px;
      }

      .pay-row__top {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 8px;
        margin-bottom: 5px;
      }

      .pay-row__top span {
        display: inline-flex;
        align-items: center;
        gap: 6px;
        color: var(--ink-soft);
        font-size: 10px;
      }

      .pay-row__top i {
        width: 7px;
        height: 7px;
        border-radius: 50%;
      }

      .pay-row__top strong {
        font-size: 10.5px;
      }

      .pay-row__bar {
        height: 6px;
        border-radius: var(--radius-pill);
        background: var(--cream-2);
        overflow: hidden;
      }

      .pay-row__bar span {
        display: block;
        height: 100%;
        border-radius: inherit;
      }

      .pay-row small {
        display: block;
        margin-top: 4px;
        color: var(--muted-2);
        font-size: 8px;
      }

      .category-row {
        display: grid;
        grid-template-columns: 1fr 0.7fr auto;
        align-items: center;
        gap: 12px;
      }

      .category-row > div:first-child {
        display: grid;
        gap: 1px;
        min-width: 0;
      }

      .category-row strong {
        font-size: 10px;
      }

      .category-row small {
        color: var(--muted);
        font-size: 8px;
      }

      .category-row__bar {
        height: 5px;
        border-radius: var(--radius-pill);
        background: var(--cream-2);
        overflow: hidden;
      }

      .category-row__bar span {
        display: block;
        height: 100%;
        border-radius: inherit;
        background: var(--gold-dark);
      }

      .top-row {
        display: flex;
        align-items: center;
        gap: 10px;
        padding-bottom: 9px;
        border-bottom: 1px solid var(--line);
      }

      .top-row:last-child {
        padding-bottom: 0;
        border-bottom: 0;
      }

      .top-row__rank {
        display: grid;
        place-items: center;
        flex: none;
        width: 24px;
        height: 24px;
        border-radius: 50%;
        background: var(--cream-2);
        color: var(--muted);
        font-family: var(--font-display);
        font-size: 11px;
        font-weight: 600;
      }

      .top-row:first-child .top-row__rank {
        background: var(--gold-soft);
        color: var(--gold-dark);
      }

      .top-row__text {
        display: grid;
        flex: 1;
        gap: 1px;
        min-width: 0;
      }

      .top-row__text strong {
        overflow: hidden;
        font-size: 10px;
        text-overflow: ellipsis;
        white-space: nowrap;
      }

      .top-row__text small {
        color: var(--muted);
        font-size: 8px;
      }

      .top-row > strong {
        font-size: 10px;
        white-space: nowrap;
      }

      @media (max-width: 1000px) {
        .report-kpis {
          grid-template-columns: 1fr 1fr;
        }

        .report-grid,
        .report-grid--bottom {
          grid-template-columns: 1fr;
        }
      }

      @media (max-width: 620px) {
        .report-filter__summary {
          width: 100%;
          margin-left: 0;
        }

        .report-kpis {
          grid-template-columns: 1fr;
        }

        .bars {
          height: 200px;
        }
      }
    `,
  ],
})
export class AdminReportsPageComponent {
  private readonly orders = inject(OrderService);
  private readonly catalog = inject(CatalogService);
  private readonly toast = inject(ToastService);

  readonly desde = signal(daysAgo(30));
  readonly hasta = signal(isoDate(new Date()));

  readonly pedidosFiltrados = computed(() =>
    this.orders
      .pedidos()
      .filter((pedido) => {
        const fecha = pedido.createdAt.slice(0, 10);
        return (
          pedido.estado !== 'cancelado' &&
          fecha >= this.desde() &&
          fecha <= this.hasta()
        );
      })
      .sort(
        (a, b) =>
          new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
      ),
  );

  readonly cancelados = computed(
    () =>
      this.orders.pedidos().filter((pedido) => {
        const fecha = pedido.createdAt.slice(0, 10);
        return (
          pedido.estado === 'cancelado' &&
          fecha >= this.desde() &&
          fecha <= this.hasta()
        );
      }).length,
  );

  readonly ventas = computed(() =>
    this.pedidosFiltrados().reduce((total, pedido) => total + pedido.total, 0),
  );

  readonly ticket = computed(() =>
    this.pedidosFiltrados().length
      ? this.ventas() / this.pedidosFiltrados().length
      : 0,
  );

  readonly puntos = computed(() =>
    this.pedidosFiltrados().reduce((total, pedido) => total + pedido.puntosGanados, 0),
  );

  readonly tasaCancelacion = computed(() => {
    const total = this.pedidosFiltrados().length + this.cancelados();
    return total ? Math.round((this.cancelados() / total) * 100) : 0;
  });

  readonly porDia = computed(() => {
    const map = new Map<string, { fecha: string; label: string; total: number; pedidos: number }>();
    for (const pedido of this.pedidosFiltrados()) {
      const fecha = pedido.createdAt.slice(0, 10);
      const actual = map.get(fecha) ?? {
        fecha,
        label: formatDate(new Date(`${fecha}T12:00:00`)).slice(0, 6),
        total: 0,
        pedidos: 0,
      };
      actual.total += pedido.total;
      actual.pedidos += 1;
      map.set(fecha, actual);
    }
    return [...map.values()].sort((a, b) => a.fecha.localeCompare(b.fecha));
  });

  readonly alturaMaxima = computed(() =>
    Math.max(1, ...this.porDia().map((dia) => dia.total)),
  );

  readonly barras = computed(() =>
    this.porDia().map((dia) => ({
      ...dia,
      altura: Math.max(4, Math.round((dia.total / this.alturaMaxima()) * 100)),
    })),
  );

  readonly pagos = computed(() => {
    const colores: Record<MetodoPago, string> = {
      efectivo: '#2f8f5b',
      yape: '#7b2cbf',
      plin: '#2563a8',
      tarjeta: '#c8102e',
    };
    const total = this.ventas();
    return (Object.keys(PAGOS) as MetodoPago[])
      .map((id) => {
        const pedidos = this.pedidosFiltrados().filter((pedido) => pedido.metodoPago === id);
        const monto = pedidos.reduce((acc, pedido) => acc + pedido.total, 0);
        return {
          id,
          label: PAGOS[id],
          color: colores[id],
          pedidos: pedidos.length,
          total: monto,
          porcentaje: total ? Math.round((monto / total) * 100) : 0,
        };
      })
      .filter((pago) => pago.pedidos > 0)
      .sort((a, b) => b.total - a.total);
  });

  readonly categorias = computed(() => {
    const map = new Map<string, { nombre: string; cantidad: number; total: number }>();
    for (const pedido of this.pedidosFiltrados()) {
      for (const item of pedido.items) {
        const producto = this.catalog.productos().find((p) => p.id === item.productoId);
        const nombre = producto?.categoriaNombre ?? 'Otros';
        const actual = map.get(nombre) ?? { nombre, cantidad: 0, total: 0 };
        actual.cantidad += item.cantidad;
        actual.total += item.precioUnitario * item.cantidad;
        map.set(nombre, actual);
      }
    }
    const total = [...map.values()].reduce((acc, item) => acc + item.total, 0);
    return [...map.values()]
      .map((item) => ({
        ...item,
        porcentaje: total ? Math.round((item.total / total) * 100) : 0,
      }))
      .sort((a, b) => b.total - a.total);
  });

  readonly topProductos = computed(() => {
    const map = new Map<string, { nombre: string; cantidad: number; total: number }>();
    for (const pedido of this.pedidosFiltrados()) {
      for (const item of pedido.items) {
        const actual = map.get(item.nombre) ?? {
          nombre: item.nombre,
          cantidad: 0,
          total: 0,
        };
        actual.cantidad += item.cantidad;
        actual.total += item.precioUnitario * item.cantidad;
        map.set(item.nombre, actual);
      }
    }
    return [...map.values()].sort((a, b) => b.cantidad - a.cantidad).slice(0, 8);
  });

  readonly porDiaConAltura = this.barras;

  rango(dias: number): void {
    this.desde.set(daysAgo(dias - 1));
    this.hasta.set(isoDate(new Date()));
  }

  fecha(valor: string): string {
    return formatDate(new Date(`${valor}T12:00:00`));
  }

  exportar(): void {
    const filas = [
      [
        'Código',
        'Fecha',
        'Cliente',
        'Entrega',
        'Pago',
        'Estado',
        'Subtotal',
        'Descuento',
        'Delivery',
        'Total',
        'Puntos',
      ],
      ...this.pedidosFiltrados().map((pedido) => [
        pedido.codigo,
        new Date(pedido.createdAt).toISOString(),
        pedido.clienteNombre,
        pedido.tipoEntrega,
        pedido.metodoPago,
        pedido.estado,
        pedido.subtotal.toFixed(2),
        pedido.descuentoPuntos.toFixed(2),
        pedido.costoDelivery.toFixed(2),
        pedido.total.toFixed(2),
        String(pedido.puntosGanados),
      ]),
    ];
    const contenido = filas
      .map((fila) =>
        fila
          .map((campo) => `"${String(campo).replace(/"/g, '""')}"`)
          .join(';'),
      )
      .join('\r\n');
    const blob = new Blob([`\uFEFF${contenido}`], {
      type: 'text/csv;charset=utf-8;',
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `don-pepito-ventas-${this.desde()}-${this.hasta()}.csv`;
    link.click();
    URL.revokeObjectURL(url);
    this.toast.success('El archivo CSV se descargó.', 'Reporte exportado');
  }
}
