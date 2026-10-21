import {
  Component,
  computed,
  ElementRef,
  HostListener,
  inject,
  signal,
  viewChild,
} from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { EstadoPedido, Pedido } from '../../../core/models';
import { OrderService } from '../../../core/services/order.service';
import { ToastService } from '../../../core/services/toast.service';
import { formatDate, formatTime, initials } from '../../../core/utils/format';
import { ESTADOS_PEDIDO } from '../../../core/utils/order-status';
import { IconComponent } from '../../../shared/components/icon.component';
import { ModalComponent } from '../../../shared/components/modal.component';
import { StatusBadgeComponent } from '../../../shared/components/status-badge.component';
import { SolesPipe } from '../../../shared/pipes/soles.pipe';

type FiltroEstado = EstadoPedido | 'todos';

const SIGUIENTE: Record<EstadoPedido, EstadoPedido | null> = {
  pendiente: 'confirmado',
  confirmado: 'en_preparacion',
  en_preparacion: 'listo',
  en_camino: 'entregado',
  listo: 'entregado',
  entregado: null,
  cancelado: null,
};

const METODO_PAGO: Record<string, string> = {
  efectivo: 'Efectivo',
  yape: 'Yape',
  plin: 'Plin',
  tarjeta: 'Tarjeta',
};

const TIPO_ENTREGA: Record<string, string> = {
  delivery: 'Delivery',
  recojo: 'Recojo en local',
};

const ATAJO_FILTROS: FiltroEstado[] = [
  'todos',
  ...(Object.keys(ESTADOS_PEDIDO) as EstadoPedido[]),
];

const ETIQUETAS_EDITABLES = ['input', 'textarea', 'select'];

const DOBLE_ESPACIO_MS = 400;

export function filtroPorTecla(key: string): FiltroEstado | null {
  const indice = Number(key) - 1;
  return Number.isInteger(indice) && indice >= 0 && indice < ATAJO_FILTROS.length
    ? ATAJO_FILTROS[indice]
    : null;
}

export function esDobleEspacio(anterior: number, ahora: number): boolean {
  return anterior > 0 && ahora - anterior <= DOBLE_ESPACIO_MS;
}

@Component({
  selector: 'app-admin-orders',
  standalone: true,
  imports: [IconComponent, ModalComponent, StatusBadgeComponent, SolesPipe],
  template: `
    <div class="admin-page">
      <div class="page-head">
        <div class="page-head__info">
          <span class="eyebrow">Operación</span>
          <h1>Pedidos</h1>
          <p>Gestiona la preparación, el reparto y el cierre de cada pedido.</p>
        </div>
        <div class="page-head__actions">
          <span class="badge badge--warning">
            <app-icon name="lucideClock" size="12" />
            {{ pendientes() }} por atender
          </span>
          <span class="badge badge--outline">{{ pedidos().length }} en total</span>
        </div>
      </div>

      <section class="admin-panel">
        <div class="orders-toolbar">
          <div class="admin-tabs">
            <button
              type="button"
              [class.is-active]="filtro() === 'todos'"
              (click)="filtro.set('todos')"
            >
              Todos
              <span class="admin-tabs__count">{{ pedidos().length }}</span>
            </button>
            @for (item of estados; track item.estado) {
              <button
                type="button"
                [class.is-active]="filtro() === item.estado"
                (click)="filtro.set(item.estado)"
              >
                {{ item.label }}
                @if (conteo(item.estado) > 0) {
                  <span class="admin-tabs__count">{{ conteo(item.estado) }}</span>
                }
              </button>
            }
          </div>

          <div class="admin-toolbar orders-toolbar__search">
            <div class="admin-search">
              <app-icon name="lucideSearch" size="15" />
              <input
                #buscador
                class="input"
                type="search"
                placeholder="Buscar código, cliente o teléfono"
                [value]="busqueda()"
                (input)="busqueda.set($any($event.target).value)"
              />
            </div>
            <select
              class="input"
              [value]="entrega()"
              (change)="entrega.set($any($event.target).value)"
              aria-label="Tipo de entrega"
            >
              <option value="todos">Toda entrega</option>
              <option value="delivery">Delivery</option>
              <option value="recojo">Recojo</option>
            </select>
          </div>
        </div>

        <div class="table-wrap">
          @if (filtrados().length === 0) {
            <div class="admin-empty">
              <app-icon name="lucidePackageSearch" size="30" />
              <p>No encontramos pedidos con esos filtros.</p>
            </div>
          } @else {
            <table class="data-table orders-table">
              <thead>
                <tr>
                  <th>Pedido</th>
                  <th>Cliente</th>
                  <th>Entrega</th>
                  <th>Ítems</th>
                  <th>Total</th>
                  <th>Estado</th>
                  <th class="is-right">Acciones</th>
                </tr>
              </thead>
              <tbody>
                @for (pedido of filtrados(); track pedido.id) {
                  <tr [class.is-highlight]="seleccionado()?.id === pedido.id">
                    <td>
                      <button type="button" class="order-code" (click)="abrir(pedido)">
                        {{ pedido.codigo }}
                      </button>
                      <small>{{ formatDate(pedido.createdAt) }} · {{ formatTime(pedido.createdAt) }}</small>
                    </td>
                    <td>
                      <div class="cell-user">
                        <span class="mini-avatar">{{ inicial(pedido.clienteNombre) }}</span>
                        <div>
                          <strong>{{ pedido.clienteNombre }}</strong>
                          <small>{{ pedido.clienteTelefono || 'Sin teléfono' }}</small>
                        </div>
                      </div>
                    </td>
                    <td>
                      <span class="badge-soft">
                        <app-icon
                          [name]="pedido.tipoEntrega === 'delivery' ? 'lucideBike' : 'lucideStore'"
                          size="11"
                        />
                        {{ tipoEntrega(pedido) }}
                      </span>
                    </td>
                    <td>{{ totalItems(pedido) }}</td>
                    <td><strong>{{ pedido.total | soles }}</strong></td>
                    <td><app-status-badge [estado]="pedido.estado" size="sm" /></td>
                    <td>
                      <div class="cell-actions">
                        <button
                          type="button"
                          aria-label="Ver detalle"
                          title="Ver detalle"
                          (click)="abrir(pedido)"
                        >
                          <app-icon name="lucideEye" size="14" />
                        </button>
                        @if (siguiente(pedido); as next) {
                          <button
                            type="button"
                            class="advance-btn"
                            [disabled]="procesando()"
                            [attr.aria-label]="'Avanzar a ' + estadoLabel(next)"
                            [title]="'Avanzar a ' + estadoLabel(next)"
                            (click)="avanzar(pedido)"
                          >
                            <app-icon name="lucideChevronRight" size="15" />
                          </button>
                        }
                      </div>
                    </td>
                  </tr>
                }
              </tbody>
            </table>
          }
        </div>
      </section>
    </div>

    <app-modal
      [open]="seleccionado() !== null"
      eyebrow="Detalle del pedido"
      [title]="seleccionado()?.codigo ?? 'Pedido'"
      size="lg"
      (closed)="cerrar()"
    >
      @if (seleccionado(); as pedido) {
        <div class="order-detail">
          <div class="order-detail__top">
            <div class="order-detail__status">
              <app-status-badge [estado]="pedido.estado" />
              <span>{{ formatDate(pedido.createdAt) }} · {{ formatTime(pedido.createdAt) }}</span>
            </div>
            <span class="order-detail__total">{{ pedido.total | soles }}</span>
          </div>

          <div class="detail-grid">
            <div class="detail-block">
              <span class="detail-block__label">Cliente</span>
              <strong>{{ pedido.clienteNombre }}</strong>
              <p>{{ pedido.clienteTelefono || 'Sin teléfono' }}</p>
              <p>{{ pedido.clienteEmail || 'Sin correo' }}</p>
            </div>
            <div class="detail-block">
              <span class="detail-block__label">{{ tipoEntrega(pedido) }}</span>
              @if (pedido.tipoEntrega === 'delivery') {
                <strong>{{ pedido.direccion }}</strong>
                <p>{{ pedido.distrito }}{{ pedido.referencia ? ' · ' + pedido.referencia : '' }}</p>
              } @else {
                <strong>Recojo en el local</strong>
                <p>El cliente recoge su pedido en caja.</p>
              }
              <p>Pago: {{ metodoPago(pedido) }}</p>
            </div>
          </div>

          <div class="detail-items">
            <h3>Productos</h3>
            @for (item of pedido.items; track item.productoId + '-' + $index) {
              <div class="detail-item">
                <span class="detail-item__qty">{{ item.cantidad }}x</span>
                <div class="detail-item__body">
                  <strong>{{ item.nombre }}</strong>
                  @if (item.nota) {
                    <small>Nota: {{ item.nota }}</small>
                  }
                </div>
                <span>{{ item.precioUnitario * item.cantidad | soles }}</span>
              </div>
            }
          </div>

          @if (pedido.notas) {
            <div class="detail-note">
              <app-icon name="lucideMessageCircle" size="15" />
              <p>{{ pedido.notas }}</p>
            </div>
          }

          <div class="detail-totals">
            <div><span>Subtotal</span><strong>{{ pedido.subtotal | soles }}</strong></div>
            @if (pedido.descuentoPuntos > 0) {
              <div class="is-discount">
                <span>Descuento por puntos</span>
                <strong>-{{ pedido.descuentoPuntos | soles }}</strong>
              </div>
            }
            <div><span>Delivery</span><strong>{{ pedido.costoDelivery | soles }}</strong></div>
            <div class="is-total"><span>Total</span><strong>{{ pedido.total | soles }}</strong></div>
          </div>

          <div class="detail-points">
            <span><app-icon name="lucideGift" size="13" /> Puntos usados: {{ pedido.puntosUsados }}</span>
            <span><app-icon name="lucideSparkles" size="13" /> Puntos ganados: {{ pedido.puntosGanados }}</span>
          </div>

          @if (confirmandoCancelacion()) {
            <div class="cancel-confirm">
              <div>
                <strong>¿Cancelar este pedido?</strong>
                <p>Se devolverán los puntos usados y se revertirán los ganados. Esta acción no se puede deshacer.</p>
              </div>
              <div class="cancel-confirm__actions">
                <button type="button" class="btn btn--ghost btn--sm" (click)="confirmandoCancelacion.set(false)">
                  Volver
                </button>
                <button type="button" class="btn btn--danger btn--sm" [disabled]="procesando()" (click)="cancelar(pedido)">
                  Sí, cancelar
                </button>
              </div>
            </div>
          } @else {
            <div class="detail-actions">
              @if (siguiente(pedido); as next) {
                <button
                  type="button"
                  class="btn btn--primary"
                  [disabled]="procesando()"
                  (click)="avanzar(pedido)"
                >
                  @if (procesando()) {
                    <app-icon name="lucideLoaderCircle" size="15" class="spin" />
                  } @else {
                    <app-icon name="lucideArrowRight" size="15" />
                  }
                  Avanzar a {{ estadoLabel(next) }}
                </button>
              } @else {
                <span class="badge badge--green">
                  <app-icon name="lucideCheckCircle2" size="12" />
                  Pedido finalizado
                </span>
              }
              @if (pedido.estado !== 'cancelado' && pedido.estado !== 'entregado') {
                <button
                  type="button"
                  class="btn btn--outline"
                  [disabled]="procesando()"
                  (click)="confirmandoCancelacion.set(true)"
                >
                  Cancelar pedido
                </button>
              }
              <button type="button" class="btn btn--ghost" (click)="cerrar()">Cerrar</button>
            </div>
          }
        </div>
      }
    </app-modal>
  `,
  styles: [
    `
      .orders-toolbar {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 12px;
        padding: 13px 16px;
        border-bottom: 1px solid var(--line);
      }

      .orders-toolbar__search {
        margin-bottom: 0;
        flex: none;
      }

      .orders-toolbar__search .admin-search {
        min-width: 220px;
      }

      .orders-toolbar__search select {
        min-width: 115px;
      }

      .orders-table td {
        padding-block: 9px;
      }

      .orders-table tr.is-highlight {
        background: var(--gold-soft);
      }

      .order-code {
        display: block;
        padding: 0;
        border: 0;
        background: transparent;
        color: var(--ink);
        font-family: var(--font-body);
        font-size: 10.5px;
        font-weight: 900;
        letter-spacing: 0.02em;
        cursor: pointer;
      }

      .order-code:hover {
        color: var(--red);
      }

      .advance-btn {
        border-color: var(--red) !important;
        color: var(--red) !important;
      }

      .advance-btn:hover {
        background: var(--red) !important;
        color: var(--white) !important;
      }

      .order-detail {
        display: grid;
        gap: 14px;
      }

      .order-detail__top {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 12px;
        padding-bottom: 12px;
        border-bottom: 1px solid var(--line);
      }

      .order-detail__status {
        display: flex;
        align-items: center;
        gap: 8px;
        flex-wrap: wrap;
      }

      .order-detail__status > span {
        color: var(--muted);
        font-size: 9px;
      }

      .order-detail__total {
        font-family: var(--font-display);
        font-size: 25px;
        font-weight: 600;
        letter-spacing: -0.03em;
      }

      .detail-grid {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 10px;
      }

      .detail-block {
        padding: 11px;
        border-radius: 10px;
        background: var(--cream-2);
      }

      .detail-block__label {
        display: block;
        margin-bottom: 3px;
        color: var(--red);
        font-size: 8px;
        font-weight: 900;
        letter-spacing: 0.09em;
        text-transform: uppercase;
      }

      .detail-block strong {
        display: block;
        font-size: 11px;
        font-weight: 800;
      }

      .detail-block p {
        color: var(--muted);
        font-size: 9px;
        line-height: 1.5;
      }

      .detail-items h3 {
        margin-bottom: 5px;
        font-family: var(--font-display);
        font-size: 16px;
        font-weight: 600;
      }

      .detail-item {
        display: flex;
        align-items: flex-start;
        gap: 8px;
        padding: 7px 0;
        border-bottom: 1px solid var(--line);
        font-size: 10px;
      }

      .detail-item:last-child {
        border-bottom: 0;
      }

      .detail-item__qty {
        flex: none;
        min-width: 20px;
        color: var(--red);
        font-weight: 900;
      }

      .detail-item__body {
        flex: 1;
      }

      .detail-item__body strong {
        font-weight: 800;
      }

      .detail-item__body small {
        display: block;
        color: var(--gold-dark);
        font-size: 8.5px;
      }

      .detail-item > span:last-child {
        font-weight: 800;
        white-space: nowrap;
      }

      .detail-note {
        display: flex;
        gap: 7px;
        padding: 9px 10px;
        border-radius: 9px;
        background: var(--gold-soft);
        color: var(--gold-dark);
      }

      .detail-note app-icon {
        flex: none;
        margin-top: 1px;
      }

      .detail-note p {
        font-size: 9.5px;
        line-height: 1.5;
      }

      .detail-totals {
        display: grid;
        gap: 5px;
        padding: 11px;
        border: 1px solid var(--line);
        border-radius: 10px;
      }

      .detail-totals > div {
        display: flex;
        align-items: center;
        justify-content: space-between;
        color: var(--muted);
        font-size: 9.5px;
      }

      .detail-totals strong {
        color: var(--ink);
        font-weight: 800;
      }

      .detail-totals .is-discount,
      .detail-totals .is-discount strong {
        color: var(--success);
      }

      .detail-totals .is-total {
        padding-top: 6px;
        border-top: 1px solid var(--line);
        color: var(--ink);
        font-size: 12px;
        font-weight: 900;
      }

      .detail-totals .is-total strong {
        font-family: var(--font-display);
        font-size: 20px;
        font-weight: 600;
      }

      .detail-points {
        display: flex;
        flex-wrap: wrap;
        gap: 8px 14px;
        color: var(--muted);
        font-size: 8.5px;
        font-weight: 700;
      }

      .detail-points span {
        display: inline-flex;
        align-items: center;
        gap: 4px;
      }

      .detail-actions {
        display: flex;
        align-items: center;
        justify-content: flex-end;
        flex-wrap: wrap;
        gap: 7px;
        padding-top: 4px;
      }

      .cancel-confirm {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 12px;
        padding: 11px;
        border: 1px solid rgba(180, 35, 24, 0.2);
        border-radius: 10px;
        background: var(--danger-soft);
      }

      .cancel-confirm strong {
        color: var(--danger);
        font-size: 10px;
      }

      .cancel-confirm p {
        color: var(--muted);
        font-size: 8.5px;
        line-height: 1.5;
      }

      .cancel-confirm__actions {
        display: flex;
        gap: 5px;
        flex: none;
      }

      @media (max-width: 900px) {
        .orders-toolbar {
          flex-direction: column;
          align-items: stretch;
        }
        .orders-toolbar__search .admin-search {
          min-width: 0;
        }
        .orders-toolbar__search {
          flex-wrap: wrap;
        }
      }

      @media (max-width: 600px) {
        .detail-grid {
          grid-template-columns: 1fr;
        }
        .order-detail__top {
          flex-direction: column;
          align-items: flex-start;
        }
        .detail-actions {
          flex-direction: column;
          align-items: stretch;
        }
        .cancel-confirm {
          flex-direction: column;
          align-items: flex-start;
        }
      }
    `,
  ],
})
export class AdminOrdersPageComponent {
  private readonly orders = inject(OrderService);
  private readonly toast = inject(ToastService);
  private readonly route = inject(ActivatedRoute);
  private readonly buscador = viewChild<ElementRef<HTMLInputElement>>('buscador');

  readonly pedidos = this.orders.pedidos;
  readonly filtro = signal<FiltroEstado>('todos');
  readonly busqueda = signal('');
  readonly entrega = signal('todos');
  readonly seleccionado = signal<Pedido | null>(null);
  readonly procesando = signal(false);
  readonly confirmandoCancelacion = signal(false);

  private ultimoEspacio = 0;

  readonly estados = (
    Object.keys(ESTADOS_PEDIDO) as EstadoPedido[]
  ).map((estado) => ({
    estado,
    label: ESTADOS_PEDIDO[estado].label,
  }));

  readonly filtrados = computed(() => {
    const term = this.busqueda().trim().toLowerCase();
    const estado = this.filtro();
    const entrega = this.entrega();
    return this.pedidos().filter((pedido) => {
      if (estado !== 'todos' && pedido.estado !== estado) return false;
      if (entrega !== 'todos' && pedido.tipoEntrega !== entrega) return false;
      if (!term) return true;
      return `${pedido.codigo} ${pedido.clienteNombre} ${pedido.clienteTelefono} ${pedido.clienteEmail}`
        .toLowerCase()
        .includes(term);
    });
  });

  readonly pendientes = computed(
    () =>
      this.pedidos().filter(
        (pedido) =>
          pedido.estado === 'pendiente' || pedido.estado === 'confirmado',
      ).length,
  );

  constructor() {
    this.route.queryParamMap.subscribe((params) => {
      const codigo = params.get('codigo');
      if (!codigo) return;
      const pedido = this.pedidos().find(
        (item) => item.codigo.toLowerCase() === codigo.toLowerCase(),
      );
      if (pedido) this.abrir(pedido);
    });
  }

  conteo(estado: EstadoPedido): number {
    return this.pedidos().filter((pedido) => pedido.estado === estado).length;
  }

  @HostListener('document:keydown', ['$event'])
  alPresionarTecla(event: KeyboardEvent): void {
    if (event.ctrlKey || event.altKey || event.metaKey) return;
    if (this.seleccionado() !== null) return;

    const objetivo = event.target;
    if (
      objetivo instanceof HTMLElement &&
      ETIQUETAS_EDITABLES.includes(objetivo.tagName.toLowerCase())
    ) {
      return;
    }

    if (event.key === ' ') {
      event.preventDefault();
      const ahora = Date.now();
      if (esDobleEspacio(this.ultimoEspacio, ahora)) {
        this.ultimoEspacio = 0;
        this.enfocarBusqueda();
        return;
      }
      this.ultimoEspacio = ahora;
      return;
    }

    this.ultimoEspacio = 0;
    const filtro = filtroPorTecla(event.key);
    if (filtro) this.filtro.set(filtro);
  }

  private enfocarBusqueda(): void {
    const campo = this.buscador();
    if (!campo) return;
    campo.nativeElement.focus();
    campo.nativeElement.select();
  }

  totalItems(pedido: Pedido): number {
    return pedido.items.reduce((total, item) => total + item.cantidad, 0);
  }

  tipoEntrega(pedido: Pedido): string {
    return TIPO_ENTREGA[pedido.tipoEntrega] ?? pedido.tipoEntrega;
  }

  metodoPago(pedido: Pedido): string {
    return METODO_PAGO[pedido.metodoPago] ?? pedido.metodoPago;
  }

  estadoLabel(estado: EstadoPedido): string {
    return ESTADOS_PEDIDO[estado].label;
  }

  siguiente(pedido: Pedido): EstadoPedido | null {
    if (pedido.estado === 'en_preparacion') {
      return pedido.tipoEntrega === 'delivery' ? 'en_camino' : 'listo';
    }
    return SIGUIENTE[pedido.estado];
  }

  inicial(nombre: string): string {
    return initials(nombre);
  }

  formatDate(value: string): string {
    return formatDate(value);
  }

  formatTime(value: string): string {
    return formatTime(value);
  }

  abrir(pedido: Pedido): void {
    this.seleccionado.set(pedido);
    this.confirmandoCancelacion.set(false);
  }

  cerrar(): void {
    this.seleccionado.set(null);
    this.confirmandoCancelacion.set(false);
  }

  async avanzar(pedido: Pedido): Promise<void> {
    const next = this.siguiente(pedido);
    if (!next) return;
    await this.cambiarEstado(pedido, next, `Pedido actualizado a ${this.estadoLabel(next)}.`);
  }

  async cancelar(pedido: Pedido): Promise<void> {
    await this.cambiarEstado(pedido, 'cancelado', 'El pedido fue cancelado.');
  }

  private async cambiarEstado(
    pedido: Pedido,
    estado: EstadoPedido,
    mensaje: string,
  ): Promise<void> {
    this.procesando.set(true);
    try {
      const actualizado = await this.orders.actualizarEstado(pedido.id, estado);
      if (actualizado) {
        this.seleccionado.set(actualizado);
      } else {
        this.seleccionado.update((actual) =>
          actual ? { ...actual, estado } : actual,
        );
      }
      this.confirmandoCancelacion.set(false);
      this.toast.success(mensaje);
    } catch (error) {
      this.toast.error(
        error instanceof Error ? error.message : 'No pudimos actualizar el pedido.',
      );
    } finally {
      this.procesando.set(false);
    }
  }
}
