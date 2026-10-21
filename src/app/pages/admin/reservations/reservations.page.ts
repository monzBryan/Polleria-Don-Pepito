import { Component, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import {
  AMBIENTES,
  AmbienteMesa,
  ESTADOS_RESERVA,
  EstadoReserva,
  Mesa,
  Reserva,
} from '../../../core/models';
import { SalonService } from '../../../core/services/salon.service';
import { ToastService } from '../../../core/services/toast.service';
import {
  formatDate,
  formatPhone as formatPhoneNumber,
  relativeDay,
} from '../../../core/utils/format';
import { IconComponent } from '../../../shared/components/icon.component';
import { ModalComponent } from '../../../shared/components/modal.component';

type FiltroFecha = 'proximas' | 'hoy' | 'todas';
type FiltroEstado = 'todas' | EstadoReserva;

function hoyISO(): string {
  const date = new Date();
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

@Component({
  selector: 'app-admin-reservations-page',
  standalone: true,
  imports: [RouterLink, IconComponent, ModalComponent],
  template: `
    <div class="admin-page">
      <header class="page-head">
        <div class="page-head__info">
          <span class="eyebrow">Salón</span>
          <h1>Reservas</h1>
          <p>Gestiona solicitudes, confirma mesas y registra la atención.</p>
        </div>
        <div class="page-head__actions">
          <a routerLink="/reservas" class="btn btn--outline btn--sm" target="_blank">
            <app-icon name="lucideExternalLink" size="14" />
            Ver formulario público
          </a>
        </div>
      </header>

      <div class="res-stats">
        <article>
          <span class="res-stats__icon is-pending"><app-icon name="lucideClock" size="18" /></span>
          <div><strong>{{ stats().pendientes }}</strong><small>Pendientes</small></div>
        </article>
        <article>
          <span class="res-stats__icon is-confirmed"><app-icon name="lucideCheck" size="18" /></span>
          <div><strong>{{ stats().confirmadas }}</strong><small>Confirmadas</small></div>
        </article>
        <article>
          <span class="res-stats__icon is-people"><app-icon name="lucideUsers" size="18" /></span>
          <div><strong>{{ stats().personas }}</strong><small>Personas hoy</small></div>
        </article>
        <article>
          <span class="res-stats__icon is-tables"><app-icon name="lucideArmchair" size="18" /></span>
          <div><strong>{{ stats().sinMesa }}</strong><small>Sin mesa asignada</small></div>
        </article>
      </div>

      <div class="admin-panel">
        <div class="admin-panel__head">
          <div>
            <h2>Agenda de reservas</h2>
            <p>Las reservas pendientes requieren confirmación por WhatsApp.</p>
          </div>
        </div>

        <div class="admin-panel__body">
          <div class="admin-toolbar">
            <div class="admin-tabs">
              <button type="button" [class.is-active]="filtroEstado() === 'todas'" (click)="filtroEstado.set('todas')">
                Todas
                <span class="admin-tabs__count">{{ salon.reservas().length }}</span>
              </button>
              @for (estado of estados; track estado) {
                <button
                  type="button"
                  [class.is-active]="filtroEstado() === estado"
                  (click)="filtroEstado.set(estado)"
                >
                  {{ estadoInfo(estado).label }}
                  <span class="admin-tabs__count">{{ contarEstado(estado) }}</span>
                </button>
              }
            </div>

            <select
              class="input select"
              [value]="filtroFecha()"
              (change)="filtroFecha.set($any($event.target).value)"
              aria-label="Filtrar por fecha"
            >
              <option value="proximas">Próximas</option>
              <option value="hoy">Hoy</option>
              <option value="todas">Todas las fechas</option>
            </select>

            <div class="admin-search">
              <app-icon name="lucideSearch" size="15" />
              <input
                class="input"
                type="search"
                [value]="busqueda()"
                (input)="busqueda.set($any($event.target).value)"
                placeholder="Cliente, código o teléfono..."
              />
            </div>
          </div>

          <div class="table-wrap">
            <table class="data-table">
              <thead>
                <tr>
                  <th>Cliente</th>
                  <th>Fecha y hora</th>
                  <th>Personas</th>
                  <th>Ambiente</th>
                  <th>Mesa</th>
                  <th>Estado</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                @for (reserva of reservas(); track reserva.id) {
                  <tr (click)="abrir(reserva)">
                    <td>
                      <div class="cell-user">
                        <span class="mini-avatar">{{ iniciales(reserva.clienteNombre) }}</span>
                        <div class="cell-user__text">
                          <strong>{{ reserva.clienteNombre }}</strong>
                          <small>{{ reserva.codigo }} · {{ formatPhone(reserva.clienteTelefono) }}</small>
                        </div>
                      </div>
                    </td>
                    <td>
                      <strong>{{ fecha(reserva.fecha) }}</strong>
                      <small>{{ reserva.hora }} · {{ relativa(reserva.fecha) }}</small>
                    </td>
                    <td>
                      <span class="people-pill">
                        <app-icon name="lucideUsers" size="12" />
                        {{ reserva.personas }}
                      </span>
                    </td>
                    <td>{{ ambienteLabel(reserva.ambiente) }}</td>
                    <td>
                      @if (mesaDe(reserva); as mesa) {
                        <strong>Mesa {{ mesa.numero }}</strong>
                        <small>{{ mesa.detalle }}</small>
                      } @else {
                        <span class="badge-soft">Sin asignar</span>
                      }
                    </td>
                    <td>
                      <span
                        class="res-status"
                        [style.color]="estadoInfo(reserva.estado).color"
                        [style.background]="estadoInfo(reserva.estado).color + '14'"
                      >
                        {{ estadoInfo(reserva.estado).label }}
                      </span>
                    </td>
                    <td>
                      <div class="cell-actions">
                        <button type="button" title="Ver detalle" (click)="abrir(reserva); $event.stopPropagation()">
                          <app-icon name="lucideEye" size="14" />
                        </button>
                      </div>
                    </td>
                  </tr>
                } @empty {
                  <tr>
                    <td colspan="7">
                      <div class="admin-empty">
                        <app-icon name="lucideCalendar" size="28" />
                        <p>No hay reservas con estos filtros.</p>
                      </div>
                    </td>
                  </tr>
                }
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>

    <app-modal
      [open]="seleccionada() !== null"
      eyebrow="Detalle de reserva"
      [title]="seleccionada()?.clienteNombre ?? 'Reserva'"
      size="lg"
      [footer]="true"
      (closed)="cerrar()"
    >
      @if (seleccionada(); as reserva) {
        <div class="detail">
          <div class="detail__top">
            <div class="detail__code">
              <small>Código</small>
              <strong>{{ reserva.codigo }}</strong>
            </div>
            <span
              class="res-status res-status--lg"
              [style.color]="estadoInfo(reserva.estado).color"
              [style.background]="estadoInfo(reserva.estado).color + '14'"
            >
              {{ estadoInfo(reserva.estado).label }}
            </span>
          </div>

          <div class="detail__grid">
            <div>
              <small>Fecha</small>
              <strong>{{ fecha(reserva.fecha) }}</strong>
              <span>{{ relativa(reserva.fecha) }}</span>
            </div>
            <div>
              <small>Hora</small>
              <strong>{{ reserva.hora }}</strong>
              <span>Atención hasta 22:30</span>
            </div>
            <div>
              <small>Personas</small>
              <strong>{{ reserva.personas }}</strong>
              <span>{{ reserva.personas === 1 ? 'Persona' : 'Personas' }}</span>
            </div>
            <div>
              <small>Ambiente</small>
              <strong>{{ ambienteLabel(reserva.ambiente) }}</strong>
              <span>{{ disponibilidad(reserva.ambiente) }} asientos libres</span>
            </div>
          </div>

          <div class="detail__contact">
            <div>
              <app-icon name="lucidePhone" size="16" />
              <div>
                <small>Teléfono</small>
                <a [href]="'tel:' + reserva.clienteTelefono">{{ formatPhone(reserva.clienteTelefono) }}</a>
              </div>
            </div>
            <a [href]="whatsapp(reserva)" target="_blank" rel="noopener" class="btn btn--ghost btn--sm">
              <app-icon name="brandWhatsapp" size="14" />
              WhatsApp
            </a>
          </div>

          @if (reserva.notas) {
            <div class="detail__note">
              <app-icon name="lucideMessageSquare" size="16" />
              <div>
                <small>Notas del cliente</small>
                <p>{{ reserva.notas }}</p>
              </div>
            </div>
          }

          <div class="detail__assign">
            <div>
              <app-icon name="lucideArmchair" size="16" />
              <div>
                <small>Mesa asignada</small>
                <strong>{{ mesaDe(reserva)?.numero ? 'Mesa ' + mesaDe(reserva)?.numero : 'Sin asignar' }}</strong>
              </div>
            </div>
            <select
              class="input select"
              [value]="mesaSeleccionada() ?? ''"
              (change)="cambiarMesa($any($event.target).value)"
            >
              <option value="">Sin asignar</option>
              @for (mesa of mesasDisponibles(reserva); track mesa.id) {
                <option [value]="mesa.id">
                  Mesa {{ mesa.numero }} · {{ mesa.capacidad }} personas
                </option>
              }
            </select>
          </div>

          <div class="detail__actions">
            @if (reserva.estado !== 'confirmada' && reserva.estado !== 'atendida' && reserva.estado !== 'cancelada') {
              <button type="button" class="btn btn--primary btn--sm" (click)="cambiarEstado(reserva, 'confirmada')">
                <app-icon name="lucideCheck" size="14" />
                Confirmar reserva
              </button>
            }
            @if (reserva.estado !== 'atendida' && reserva.estado !== 'cancelada') {
              <button type="button" class="btn btn--outline btn--sm" (click)="cambiarEstado(reserva, 'atendida')">
                <app-icon name="lucideUsers" size="14" />
                Marcar atendida
              </button>
            }
            @if (reserva.estado !== 'cancelada') {
              <button type="button" class="btn btn--ghost btn--sm is-danger" (click)="cambiarEstado(reserva, 'cancelada')">
                <app-icon name="lucideX" size="14" />
                Cancelar
              </button>
            }
          </div>
        </div>
      }

      <div modalFooter class="admin-form__actions">
        <button type="button" class="btn btn--ghost btn--sm" (click)="cerrar()">Cerrar</button>
      </div>
    </app-modal>
  `,
  styles: [
    `
      :host {
        display: block;
      }

      .res-stats {
        display: grid;
        grid-template-columns: repeat(4, 1fr);
        gap: 12px;
      }

      .res-stats article {
        display: flex;
        align-items: center;
        gap: 12px;
        padding: 16px;
        border: 1px solid rgba(10, 10, 11, 0.08);
        border-radius: 14px;
        background: var(--white);
      }

      .res-stats__icon {
        display: grid;
        place-items: center;
        width: 38px;
        height: 38px;
        border-radius: 10px;
      }

      .res-stats__icon.is-pending {
        background: rgba(184, 134, 11, 0.12);
        color: var(--gold-dark);
      }

      .res-stats__icon.is-confirmed {
        background: rgba(47, 143, 91, 0.1);
        color: #2f8f5b;
      }

      .res-stats__icon.is-people {
        background: rgba(200, 16, 46, 0.09);
        color: var(--red);
      }

      .res-stats__icon.is-tables {
        background: rgba(37, 99, 168, 0.1);
        color: #2563a8;
      }

      .res-stats div {
        display: grid;
        gap: 1px;
      }

      .res-stats strong {
        font-family: var(--font-display);
        font-size: 23px;
        font-weight: 600;
        line-height: 1;
      }

      .res-stats small {
        color: var(--muted);
        font-size: 9px;
      }

      .data-table tbody tr {
        cursor: pointer;
      }

      .cell-user__text {
        display: grid;
        gap: 1px;
      }

      .cell-user__text strong {
        font-size: 10.5px;
      }

      .people-pill {
        display: inline-flex;
        align-items: center;
        gap: 4px;
        padding: 4px 8px;
        border-radius: var(--radius-pill);
        background: var(--cream-2);
        color: var(--ink-soft);
        font-size: 9.5px;
        font-weight: 800;
      }

      .res-status {
        display: inline-flex;
        align-items: center;
        padding: 4px 9px;
        border-radius: var(--radius-pill);
        font-size: 8.5px;
        font-weight: 900;
        white-space: nowrap;
      }

      .res-status--lg {
        padding: 6px 12px;
        font-size: 9.5px;
      }

      .detail {
        display: grid;
        gap: 16px;
      }

      .detail__top {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 12px;
        padding-bottom: 14px;
        border-bottom: 1px solid var(--line);
      }

      .detail__code {
        display: grid;
        gap: 2px;
      }

      .detail__code small {
        color: var(--muted);
        font-size: 8.5px;
        font-weight: 800;
        letter-spacing: 0.1em;
        text-transform: uppercase;
      }

      .detail__code strong {
        color: var(--red);
        font-family: var(--font-display);
        font-size: 20px;
      }

      .detail__grid {
        display: grid;
        grid-template-columns: repeat(4, 1fr);
        gap: 10px;
      }

      .detail__grid > div {
        display: grid;
        gap: 2px;
        padding: 12px;
        border-radius: 10px;
        background: var(--cream-2);
      }

      .detail__grid small,
      .detail__contact small,
      .detail__note small,
      .detail__assign small {
        color: var(--muted);
        font-size: 8px;
        font-weight: 800;
        letter-spacing: 0.08em;
        text-transform: uppercase;
      }

      .detail__grid strong {
        font-size: 11.5px;
      }

      .detail__grid span {
        color: var(--muted);
        font-size: 8.5px;
      }

      .detail__contact,
      .detail__assign {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 12px;
        padding: 12px 14px;
        border: 1px solid var(--line);
        border-radius: 10px;
      }

      .detail__contact > div,
      .detail__assign > div {
        display: flex;
        align-items: center;
        gap: 9px;
        color: var(--red);
      }

      .detail__contact > div > div,
      .detail__assign > div > div {
        display: grid;
        gap: 1px;
      }

      .detail__contact a,
      .detail__assign strong {
        color: var(--ink);
        font-size: 11px;
      }

      .detail__assign .select {
        width: 250px;
        min-height: 38px;
        font-size: 10.5px;
      }

      .detail__note {
        display: flex;
        gap: 9px;
        padding: 12px 14px;
        border-radius: 10px;
        background: var(--gold-soft);
        color: var(--gold-dark);
      }

      .detail__note p {
        margin: 3px 0 0;
        color: var(--ink-soft);
        font-size: 10.5px;
        line-height: 1.55;
      }

      .detail__actions {
        display: flex;
        flex-wrap: wrap;
        gap: 7px;
        padding-top: 4px;
      }

      .btn.is-danger {
        color: var(--danger);
      }

      @media (max-width: 900px) {
        .res-stats {
          grid-template-columns: 1fr 1fr;
        }

        .detail__grid {
          grid-template-columns: 1fr 1fr;
        }
      }

      @media (max-width: 620px) {
        .detail__grid {
          grid-template-columns: 1fr;
        }

        .detail__assign {
          align-items: flex-start;
          flex-direction: column;
        }

        .detail__assign .select {
          width: 100%;
        }

        .detail__actions > * {
          flex: 1;
          justify-content: center;
        }
      }
    `,
  ],
})
export class AdminReservationsPageComponent {
  readonly salon = inject(SalonService);
  private readonly toast = inject(ToastService);

  readonly ambientes = AMBIENTES;
  readonly estados = Object.keys(ESTADOS_RESERVA) as EstadoReserva[];

  readonly filtroEstado = signal<FiltroEstado>('todas');
  readonly filtroFecha = signal<FiltroFecha>('proximas');
  readonly busqueda = signal('');
  readonly seleccionada = signal<Reserva | null>(null);
  readonly mesaSeleccionada = signal<number | null>(null);

  readonly stats = computed(() => {
    const reservas = this.salon.reservas();
    const hoy = hoyISO();
    return {
      pendientes: reservas.filter((reserva) => reserva.estado === 'pendiente').length,
      confirmadas: reservas.filter((reserva) => reserva.estado === 'confirmada').length,
      personas: reservas
        .filter((reserva) => reserva.fecha === hoy && reserva.estado !== 'cancelada')
        .reduce((total, reserva) => total + reserva.personas, 0),
      sinMesa: this.salon.reservasActivas().filter((reserva) => !reserva.mesaId).length,
    };
  });

  readonly reservas = computed(() => {
    const hoy = hoyISO();
    const texto = this.busqueda().trim().toLowerCase();
    return this.salon
      .reservas()
      .filter((reserva) => {
        if (this.filtroEstado() !== 'todas' && reserva.estado !== this.filtroEstado()) {
          return false;
        }
        if (this.filtroFecha() === 'hoy' && reserva.fecha !== hoy) {
          return false;
        }
        if (this.filtroFecha() === 'proximas' && reserva.fecha < hoy) {
          return false;
        }
        if (!texto) {
          return true;
        }
        return (
          reserva.clienteNombre.toLowerCase().includes(texto) ||
          reserva.codigo.toLowerCase().includes(texto) ||
          reserva.clienteTelefono.includes(texto)
        );
      })
      .sort((a, b) => `${a.fecha} ${a.hora}`.localeCompare(`${b.fecha} ${b.hora}`));
  });

  estadoInfo(estado: EstadoReserva) {
    return ESTADOS_RESERVA[estado];
  }

  ambienteLabel(ambiente: AmbienteMesa): string {
    return AMBIENTES.find((item) => item.id === ambiente)?.label ?? ambiente;
  }

  contarEstado(estado: EstadoReserva): number {
    return this.salon.reservas().filter((reserva) => reserva.estado === estado).length;
  }

  fecha(value: string): string {
    return formatDate(new Date(`${value}T12:00:00`));
  }

  relativa(value: string): string {
    return relativeDay(new Date(`${value}T12:00:00`));
  }

  formatPhone(value: string): string {
    return formatPhoneNumber(value);
  }

  iniciales(nombre: string): string {
    return nombre
      .split(' ')
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0])
      .join('')
      .toUpperCase();
  }

  mesaDe(reserva: Reserva): Mesa | undefined {
    return this.salon.mesas().find((mesa) => mesa.id === reserva.mesaId);
  }

  disponibilidad(ambiente: AmbienteMesa): number {
    return this.salon.disponibilidad(ambiente);
  }

  mesasDisponibles(reserva: Reserva): Mesa[] {
    const ocupadas = new Set(
      this.salon
        .reservasActivas()
        .filter((item) => item.id !== reserva.id && item.mesaId)
        .map((item) => item.mesaId),
    );
    return this.salon
      .mesasDeAmbiente(reserva.ambiente)
      .filter(
        (mesa) =>
          mesa.capacidad >= reserva.personas &&
          (mesa.id === reserva.mesaId ||
            ((mesa.estado === 'libre' || mesa.estado === 'reservada') &&
              !ocupadas.has(mesa.id))),
      );
  }

  abrir(reserva: Reserva): void {
    this.seleccionada.set(reserva);
    this.mesaSeleccionada.set(reserva.mesaId ?? null);
  }

  cerrar(): void {
    this.seleccionada.set(null);
    this.mesaSeleccionada.set(null);
  }

  cambiarEstado(reserva: Reserva, estado: EstadoReserva): void {
    try {
      const actualizada = this.salon.actualizarEstadoReserva(reserva.id, estado);
      this.seleccionada.set(actualizada);
      this.toast.success('La reserva se actualizó.', 'Reserva actualizada');
    } catch (error) {
      this.toast.error(error instanceof Error ? error.message : 'No pudimos actualizar la reserva.');
    }
  }

  cambiarMesa(value: string): void {
    const reserva = this.seleccionada();
    if (!reserva) return;
    try {
      const id = value ? Number(value) : null;
      const actualizada = this.salon.asignarMesa(reserva.id, id);
      this.seleccionada.set(actualizada);
      this.mesaSeleccionada.set(actualizada.mesaId ?? null);
      this.toast.success('La mesa se asignó a la reserva.', 'Mesa asignada');
    } catch (error) {
      this.toast.error(error instanceof Error ? error.message : 'No pudimos asignar la mesa.');
    }
  }

  whatsapp(reserva: Reserva): string {
    return `https://wa.me/51${reserva.clienteTelefono}?text=${encodeURIComponent(
      `Hola ${reserva.clienteNombre}, te escribimos de Don Pepito por tu reserva ${reserva.codigo}.`,
    )}`;
  }
}
