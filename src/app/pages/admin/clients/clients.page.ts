import { Component, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { UsuarioAdminRow } from '../../../core/models';
import { AuthService } from '../../../core/services/auth.service';
import { DashboardService } from '../../../core/services/dashboard.service';
import { ToastService } from '../../../core/services/toast.service';
import { formatDate, initials } from '../../../core/utils/format';
import { IconComponent } from '../../../shared/components/icon.component';
import { ModalComponent } from '../../../shared/components/modal.component';
import { SolesPipe } from '../../../shared/pipes/soles.pipe';

@Component({
  selector: 'app-admin-clients',
  standalone: true,
  imports: [RouterLink, IconComponent, ModalComponent, SolesPipe],
  template: `
    <div class="admin-page">
      <div class="page-head">
        <div class="page-head__info">
          <span class="eyebrow">Comunidad</span>
          <h1>Clientes</h1>
          <p>Conoce a quienes piden en Don Pepito y gestiona sus puntos.</p>
        </div>
        <div class="page-head__actions">
          <span class="badge badge--outline">{{ usuarios().length }} registrados</span>
          <a routerLink="/admin/puntos" class="btn btn--outline btn--sm">
            <app-icon name="lucideGift" size="15" />
            Ver puntos
          </a>
        </div>
      </div>

      <div class="client-stats">
        <div>
          <span><app-icon name="lucideUsers" size="18" /></span>
          <div><small>Clientes</small><strong>{{ usuarios().length }}</strong></div>
        </div>
        <div>
          <span class="is-gold"><app-icon name="lucideGift" size="18" /></span>
          <div><small>Puntos en circulación</small><strong>{{ puntosTotales() }}</strong></div>
        </div>
        <div>
          <span class="is-green"><app-icon name="lucideDollarSign" size="18" /></span>
          <div><small>Consumo acumulado</small><strong>{{ consumoTotal() | soles }}</strong></div>
        </div>
      </div>

      <section class="admin-panel">
        <div class="clients-toolbar">
          <div class="admin-search">
            <app-icon name="lucideSearch" size="15" />
            <input
              class="input"
              type="search"
              placeholder="Buscar por nombre, correo o teléfono"
              [value]="busqueda()"
              (input)="busqueda.set($any($event.target).value)"
            />
          </div>
          <div class="admin-tabs">
            @for (item of filtros; track item.id) {
              <button
                type="button"
                [class.is-active]="filtro() === item.id"
                (click)="filtro.set(item.id)"
              >
                {{ item.label }}
              </button>
            }
          </div>
        </div>

        <div class="table-wrap">
          @if (filtrados().length === 0) {
            <div class="admin-empty">
              <app-icon name="lucideUsers" size="30" />
              <p>No encontramos clientes con esos filtros.</p>
            </div>
          } @else {
            <table class="data-table clients-table">
              <thead>
                <tr>
                  <th>Cliente</th>
                  <th>Contacto</th>
                  <th class="is-center">Pedidos</th>
                  <th>Consumo</th>
                  <th>Puntos</th>
                  <th>Miembro desde</th>
                  <th class="is-right">Acciones</th>
                </tr>
              </thead>
              <tbody>
                @for (cliente of filtrados(); track cliente.id) {
                  <tr>
                    <td>
                      <div class="cell-user">
                        <span class="mini-avatar">{{ inicial(cliente.nombre) }}</span>
                        <div>
                          <strong>{{ cliente.nombre }}</strong>
                          <small>
                            @if (cliente.rol === 'admin') {
                              <span class="role-tag">Admin</span>
                            } @else {
                              Cliente
                            }
                          </small>
                        </div>
                      </div>
                    </td>
                    <td>
                      <strong>{{ cliente.email }}</strong>
                      <small>{{ cliente.telefono || 'Sin teléfono' }}</small>
                    </td>
                    <td class="is-center">{{ cliente.pedidos }}</td>
                    <td><strong>{{ cliente.totalGastado | soles }}</strong></td>
                    <td><span class="points-pill">{{ cliente.puntos }} pts</span></td>
                    <td><small>{{ formatDate(cliente.createdAt) }}</small></td>
                    <td>
                      <div class="cell-actions">
                        <button
                          type="button"
                          aria-label="Ajustar puntos"
                          title="Ajustar puntos"
                          (click)="abrirPuntos(cliente)"
                        >
                          <app-icon name="lucideGift" size="14" />
                        </button>
                        <button
                          type="button"
                          aria-label="Ver pedidos"
                          title="Ver pedidos"
                          (click)="abrirPedidos(cliente)"
                        >
                          <app-icon name="lucideClipboardList" size="14" />
                        </button>
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
      [open]="clientePuntos() !== null"
      eyebrow="Programa de puntos"
      [title]="clientePuntos()?.nombre ?? 'Ajustar puntos'"
      size="sm"
      (closed)="clientePuntos.set(null)"
    >
      @if (clientePuntos(); as cliente) {
        <div class="adjust-summary">
          <div>
            <small>Saldo actual</small>
            <strong>{{ cliente.puntos }} pts</strong>
          </div>
          <div>
            <small>Miembro desde</small>
            <strong>{{ formatDate(cliente.createdAt) }}</strong>
          </div>
        </div>

        <form class="admin-form" (submit)="ajustar($event)">
          <div class="form-grid">
            <label class="field">
              <span class="field-label">Puntos a sumar o restar *</span>
              <input
                class="input"
                type="number"
                step="1"
                [value]="puntos()"
                (input)="setPuntos($any($event.target).value)"
                placeholder="Ej. 100 o -50"
              />
            </label>
            <label class="field">
              <span class="field-label">Motivo *</span>
              <input
                class="input"
                type="text"
                [value]="motivo()"
                (input)="motivo.set($any($event.target).value)"
                placeholder="Ej. Compensación por demora"
              />
            </label>
          </div>

          <div class="adjust-presets">
            <button type="button" (click)="puntos.set(50)">+50</button>
            <button type="button" (click)="puntos.set(100)">+100</button>
            <button type="button" (click)="puntos.set(-50)">-50</button>
            <button type="button" (click)="puntos.set(-100)">-100</button>
          </div>

          <div class="admin-note">
            <app-icon name="lucideInfo" size="14" />
            <p>
              El ajuste se registra en el historial del cliente. No se puede dejar
              un saldo negativo.
            </p>
          </div>

          <div class="admin-form__actions">
            <button type="button" class="btn btn--ghost btn--sm" (click)="clientePuntos.set(null)">
              Cancelar
            </button>
            <button type="submit" class="btn btn--primary btn--sm" [disabled]="procesando()">
              @if (procesando()) {
                <app-icon name="lucideLoaderCircle" size="15" class="spin" />
              } @else {
                <app-icon name="lucideSave" size="15" />
              }
              Aplicar ajuste
            </button>
          </div>
        </form>
      }
    </app-modal>
  `,
  styles: [
    `
      .client-stats {
        display: grid;
        grid-template-columns: repeat(3, 1fr);
        gap: 10px;
      }

      .client-stats > div {
        display: flex;
        align-items: center;
        gap: 10px;
        padding: 12px 14px;
        border: 1px solid rgba(10, 10, 11, 0.08);
        border-radius: 12px;
        background: var(--white);
      }

      .client-stats > div > span {
        display: grid;
        place-items: center;
        width: 34px;
        height: 34px;
        border-radius: 9px;
        background: var(--cream-2);
        color: var(--ink);
      }

      .client-stats > div > span.is-gold {
        background: var(--gold-soft);
        color: var(--gold-dark);
      }

      .client-stats > div > span.is-green {
        background: var(--success-soft);
        color: var(--success);
      }

      .client-stats small {
        display: block;
        color: var(--muted-2);
        font-size: 8px;
        font-weight: 900;
        letter-spacing: 0.08em;
        text-transform: uppercase;
      }

      .client-stats strong {
        font-family: var(--font-display);
        font-size: 20px;
        font-weight: 600;
        line-height: 1.1;
      }

      .clients-toolbar {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 10px;
        flex-wrap: wrap;
        padding: 13px 16px;
        border-bottom: 1px solid var(--line);
      }

      .clients-toolbar .admin-search {
        max-width: 330px;
      }

      .clients-table td {
        padding-block: 9px;
      }

      .role-tag {
        display: inline-block;
        padding: 1px 5px;
        border-radius: 4px;
        background: var(--gold-soft);
        color: var(--gold-dark);
        font-size: 7.5px;
        font-weight: 900;
        text-transform: uppercase;
      }

      .adjust-summary {
        display: flex;
        gap: 10px;
        margin-bottom: 12px;
      }

      .adjust-summary > div {
        flex: 1;
        padding: 9px 10px;
        border-radius: 9px;
        background: var(--cream-2);
      }

      .adjust-summary small {
        display: block;
        color: var(--muted-2);
        font-size: 8px;
        font-weight: 900;
        text-transform: uppercase;
      }

      .adjust-summary strong {
        font-family: var(--font-display);
        font-size: 18px;
        font-weight: 600;
      }

      .adjust-presets {
        display: flex;
        gap: 5px;
        flex-wrap: wrap;
      }

      .adjust-presets button {
        padding: 5px 9px;
        border: 1px solid var(--line);
        border-radius: 7px;
        background: var(--white);
        color: var(--muted);
        font-size: 9px;
        font-weight: 800;
        cursor: pointer;
        transition: var(--transition);
      }

      .adjust-presets button:hover {
        border-color: var(--ink);
        color: var(--ink);
      }

      @media (max-width: 700px) {
        .client-stats {
          grid-template-columns: 1fr;
        }
        .clients-toolbar {
          flex-direction: column;
          align-items: stretch;
        }
        .clients-toolbar .admin-search {
          max-width: none;
        }
      }
    `,
  ],
})
export class AdminClientsPageComponent {
  private readonly dashboard = inject(DashboardService);
  private readonly auth = inject(AuthService);
  private readonly toast = inject(ToastService);

  readonly usuarios = this.dashboard.usuarios;
  readonly busqueda = signal('');
  readonly filtro = signal<'todos' | 'clientes' | 'admin'>('todos');
  readonly clientePuntos = signal<UsuarioAdminRow | null>(null);
  readonly puntos = signal(0);
  readonly motivo = signal('');
  readonly procesando = signal(false);

  readonly filtros = [
    { id: 'todos', label: 'Todos' },
    { id: 'clientes', label: 'Clientes' },
    { id: 'admin', label: 'Administradores' },
  ] as const;

  readonly filtrados = computed(() => {
    const term = this.busqueda().trim().toLowerCase();
    const filtro = this.filtro();
    return this.usuarios().filter((cliente) => {
      if (filtro === 'clientes' && cliente.rol !== 'cliente') return false;
      if (filtro === 'admin' && cliente.rol !== 'admin') return false;
      if (!term) return true;
      return `${cliente.nombre} ${cliente.email} ${cliente.telefono}`
        .toLowerCase()
        .includes(term);
    });
  });

  readonly puntosTotales = computed(() =>
    this.usuarios().reduce((total, cliente) => total + cliente.puntos, 0),
  );

  readonly consumoTotal = computed(() =>
    this.usuarios().reduce((total, cliente) => total + cliente.totalGastado, 0),
  );

  inicial(nombre: string): string {
    return initials(nombre);
  }

  formatDate(value: string): string {
    return formatDate(value);
  }

  setPuntos(value: string): void {
    this.puntos.set(Math.trunc(Number(value) || 0));
  }

  abrirPuntos(cliente: UsuarioAdminRow): void {
    this.clientePuntos.set(cliente);
    this.puntos.set(0);
    this.motivo.set('');
  }

  abrirPedidos(cliente: UsuarioAdminRow): void {
    this.toast.info(`Filtra los pedidos de ${cliente.nombre} desde la sección Pedidos.`);
  }

  async ajustar(event?: Event): Promise<void> {
    event?.preventDefault();
    const cliente = this.clientePuntos();
    if (!cliente) return;
    const cantidad = Math.trunc(this.puntos());
    if (!Number.isFinite(cantidad) || cantidad === 0) {
      this.toast.warning('Ingresa una cantidad distinta de cero.');
      return;
    }
    if (cliente.puntos + cantidad < 0) {
      this.toast.warning('El ajuste dejaría el saldo en negativo.');
      return;
    }
    if (this.motivo().trim().length < 3) {
      this.toast.warning('Ingresa el motivo del ajuste.');
      return;
    }

    this.procesando.set(true);
    try {
      await this.auth.ajustarPuntos(cliente.id, cantidad, this.motivo());
      this.toast.success('Puntos ajustados correctamente.');
      this.clientePuntos.set(null);
    } catch (error) {
      this.toast.error(
        error instanceof Error ? error.message : 'No pudimos ajustar los puntos.',
      );
    } finally {
      this.procesando.set(false);
    }
  }
}
