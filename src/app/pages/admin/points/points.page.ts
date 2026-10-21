import { Component, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import {
  ConfigPuntos,
  Perfil,
  TipoTransaccion,
  TransaccionPuntos,
} from '../../../core/models';
import { AuthService } from '../../../core/services/auth.service';
import { DemoStoreService } from '../../../core/services/demo-store.service';
import { SiteConfigService } from '../../../core/services/site-config.service';
import { ToastService } from '../../../core/services/toast.service';
import { formatDate, formatTime, initials } from '../../../core/utils/format';
import { IconComponent } from '../../../shared/components/icon.component';
import { SolesPipe } from '../../../shared/pipes/soles.pipe';

type FiltroTipo = TipoTransaccion | 'todos';

interface MovimientoRow extends TransaccionPuntos {
  perfil?: Perfil;
}

const TIPO_INFO: Record<TipoTransaccion, { label: string; icon: string; tone: string }> = {
  bienvenida: { label: 'Bienvenida', icon: 'lucideSparkles', tone: 'gold' },
  ganado: { label: 'Ganado', icon: 'lucidePlus', tone: 'green' },
  canjeado: { label: 'Canjeado', icon: 'lucideGift', tone: 'red' },
  ajuste: { label: 'Ajuste', icon: 'lucideRefreshCw', tone: 'ink' },
};

@Component({
  selector: 'app-admin-points',
  standalone: true,
  imports: [RouterLink, IconComponent, SolesPipe],
  template: `
    <div class="admin-page">
      <div class="page-head">
        <div class="page-head__info">
          <span class="eyebrow">Fidelización</span>
          <h1>Programa de puntos</h1>
          <p>Configura las reglas y revisa todos los movimientos del club.</p>
        </div>
        <div class="page-head__actions">
          <a routerLink="/admin/clientes" class="btn btn--outline btn--sm">
            <app-icon name="lucideUsers" size="15" />
            Ajustar a un cliente
          </a>
          <a routerLink="/legal/puntos" class="btn btn--ghost btn--sm">
            <app-icon name="lucideExternalLink" size="15" />
            Ver reglas públicas
          </a>
        </div>
      </div>

      <div class="points-stats">
        <div>
          <span><app-icon name="lucideGift" size="18" /></span>
          <div><small>Puntos en circulación</small><strong>{{ saldoCirculante() }}</strong></div>
        </div>
        <div>
          <span class="is-green"><app-icon name="lucideTrendingUp" size="18" /></span>
          <div><small>Puntos emitidos</small><strong>+{{ emitidos() }}</strong></div>
        </div>
        <div>
          <span class="is-red"><app-icon name="lucideMinus" size="18" /></span>
          <div><small>Puntos canjeados</small><strong>{{ canjeados() }}</strong></div>
        </div>
      </div>

      <div class="points-layout">
        <section class="admin-panel">
          <div class="admin-panel__head">
            <div>
              <h2>Reglas del programa</h2>
              <p>Se aplican a todos los pedidos nuevos</p>
            </div>
            <span class="badge badge--gold">1 sol = 1 punto</span>
          </div>
          <div class="admin-panel__body">
            <form class="admin-form" (submit)="guardarConfig($event)">
              <div class="form-grid">
                <label class="field">
                  <span class="field-label">Puntos por sol</span>
                  <input
                    class="input"
                    type="number"
                    min="0"
                    step="0.1"
                    [value]="form().puntosPorSol"
                    (input)="setNumero('puntosPorSol', $any($event.target).value)"
                  />
                </label>
                <label class="field">
                  <span class="field-label">Bloque de canje</span>
                  <input
                    class="input"
                    type="number"
                    min="1"
                    step="1"
                    [value]="form().bloqueCanje"
                    (input)="setNumero('bloqueCanje', $any($event.target).value)"
                  />
                </label>
              </div>

              <div class="form-grid form-grid--three">
                <label class="field">
                  <span class="field-label">Valor del bloque (S/)</span>
                  <input
                    class="input"
                    type="number"
                    min="0"
                    step="0.1"
                    [value]="form().valorBloque"
                    (input)="setNumero('valorBloque', $any($event.target).value)"
                  />
                </label>
                <label class="field">
                  <span class="field-label">Tope de canje (%)</span>
                  <input
                    class="input"
                    type="number"
                    min="0"
                    max="100"
                    step="1"
                    [value]="form().topePorcentaje"
                    (input)="setNumero('topePorcentaje', $any($event.target).value)"
                  />
                </label>
                <label class="field">
                  <span class="field-label">Vigencia (días)</span>
                  <input
                    class="input"
                    type="number"
                    min="1"
                    step="1"
                    [value]="form().vencimientoDias"
                    (input)="setNumero('vencimientoDias', $any($event.target).value)"
                  />
                </label>
              </div>

              <div class="rules-preview">
                <div>
                  <span>Pedido de ejemplo</span>
                  <strong>S/ 100.00</strong>
                </div>
                <app-icon name="lucideArrowRight" size="16" />
                <div>
                  <span>Gana</span>
                  <strong>{{ puntosEjemplo() }} pts</strong>
                </div>
                <app-icon name="lucideArrowRight" size="16" />
                <div>
                  <span>Descuento máximo</span>
                  <strong>{{ canjeEjemplo() | soles }}</strong>
                </div>
              </div>

              <div class="admin-note">
                <app-icon name="lucideInfo" size="14" />
                <p>
                  El tope se calcula sobre el subtotal de productos, sin delivery.
                  Los cambios aplican a los pedidos que se creen desde ahora.
                </p>
              </div>

              <div class="admin-form__actions">
                <button type="button" class="btn btn--ghost btn--sm" (click)="restablecer()">
                  Restablecer
                </button>
                <button type="submit" class="btn btn--primary btn--sm" [disabled]="guardando()">
                  @if (guardando()) {
                    <app-icon name="lucideLoaderCircle" size="15" class="spin" />
                  } @else {
                    <app-icon name="lucideSave" size="15" />
                  }
                  Guardar reglas
                </button>
              </div>
            </form>
          </div>
        </section>

        <section class="admin-panel">
          <div class="admin-panel__head">
            <div>
              <h2>Resumen del club</h2>
              <p>Estado actual de la fidelización</p>
            </div>
          </div>
          <div class="admin-panel__body">
            <div class="club-summary">
              <div>
                <span class="club-summary__icon"><app-icon name="lucideUsers" size="18" /></span>
                <div>
                  <strong>{{ auth.perfiles().length }}</strong>
                  <small>miembros registrados</small>
                </div>
              </div>
              <div>
                <span class="club-summary__icon is-gold">
                  <app-icon name="lucideAward" size="18" />
                </span>
                <div>
                  <strong>{{ miembrosActivos() }}</strong>
                  <small>miembros con puntos acumulados</small>
                </div>
              </div>
              <div>
                <span class="club-summary__icon is-green">
                  <app-icon name="lucideWallet" size="18" />
                </span>
                <div>
                  <strong>{{ equivalenciaTotal() | soles }}</strong>
                  <small>valor potencial en descuentos</small>
                </div>
              </div>
            </div>

            <div class="club-tip">
              <app-icon name="lucideSparkles" size="17" />
              <div>
                <strong>Tip de fidelización</strong>
                <p>
                  Premia a tus clientes frecuentes con puntos extra en pedidos
                  grandes. Puedes hacerlo desde la ficha de cada cliente.
                </p>
                <a routerLink="/admin/clientes">
                  Ir a clientes
                  <app-icon name="lucideArrowRight" size="13" />
                </a>
              </div>
            </div>
          </div>
        </section>
      </div>

      <section class="admin-panel">
        <div class="admin-panel__head">
          <div>
            <h2>Historial de movimientos</h2>
            <p>{{ movimientos().length }} transacciones registradas</p>
          </div>
          <div class="admin-search">
            <app-icon name="lucideSearch" size="15" />
            <input
              class="input"
              type="search"
              placeholder="Buscar cliente o motivo"
              [value]="busqueda()"
              (input)="busqueda.set($any($event.target).value)"
            />
          </div>
        </div>

        <div class="tx-toolbar">
          <div class="admin-tabs">
            <button
              type="button"
              [class.is-active]="filtro() === 'todos'"
              (click)="filtro.set('todos')"
            >
              Todos
            </button>
            @for (tipo of tipos; track tipo) {
              <button
                type="button"
                [class.is-active]="filtro() === tipo"
                (click)="filtro.set(tipo)"
              >
                {{ tipoInfo[tipo].label }}
              </button>
            }
          </div>
        </div>

        <div class="table-wrap">
          @if (filtrados().length === 0) {
            <div class="admin-empty">
              <app-icon name="lucideGift" size="30" />
              <p>No hay movimientos con esos filtros.</p>
            </div>
          } @else {
            <table class="data-table">
              <thead>
                <tr>
                  <th>Cliente</th>
                  <th>Movimiento</th>
                  <th>Tipo</th>
                  <th>Fecha</th>
                  <th class="is-right">Puntos</th>
                </tr>
              </thead>
              <tbody>
                @for (movimiento of filtrados(); track movimiento.id) {
                  <tr>
                    <td>
                      <div class="cell-user">
                        <span class="mini-avatar">{{ inicial(movimiento.perfil?.nombre) }}</span>
                        <div>
                          <strong>{{ movimiento.perfil?.nombre ?? 'Cliente' }}</strong>
                          <small>{{ movimiento.perfil?.email ?? 'Sin correo' }}</small>
                        </div>
                      </div>
                    </td>
                    <td>
                      <strong>{{ movimiento.descripcion }}</strong>
                      @if (movimiento.pedidoId) {
                        <small>Pedido asociado</small>
                      }
                    </td>
                    <td>
                      <span
                        class="tx-type"
                        [class]="'tx-type tx-type--' + tipoInfo[movimiento.tipo].tone"
                      >
                        <app-icon [name]="tipoInfo[movimiento.tipo].icon" size="11" />
                        {{ tipoInfo[movimiento.tipo].label }}
                      </span>
                    </td>
                    <td>
                      <small>{{ formatDate(movimiento.createdAt) }}</small>
                      <small>{{ formatTime(movimiento.createdAt) }}</small>
                    </td>
                    <td class="is-right">
                      <strong
                        class="tx-points"
                        [class.is-negative]="movimiento.puntos < 0"
                      >
                        {{ movimiento.puntos > 0 ? '+' : '' }}{{ movimiento.puntos }}
                      </strong>
                    </td>
                  </tr>
                }
              </tbody>
            </table>
          }
        </div>
      </section>
    </div>
  `,
  styles: [
    `
      .points-stats {
        display: grid;
        grid-template-columns: repeat(3, 1fr);
        gap: 10px;
      }

      .points-stats > div {
        display: flex;
        align-items: center;
        gap: 10px;
        padding: 12px 14px;
        border: 1px solid rgba(10, 10, 11, 0.08);
        border-radius: 12px;
        background: var(--white);
      }

      .points-stats > div > span {
        display: grid;
        place-items: center;
        width: 34px;
        height: 34px;
        border-radius: 9px;
        background: var(--cream-2);
        color: var(--ink);
      }

      .points-stats > div > span.is-green {
        background: var(--success-soft);
        color: var(--success);
      }

      .points-stats > div > span.is-red {
        background: var(--red-soft);
        color: var(--red);
      }

      .points-stats small {
        display: block;
        color: var(--muted-2);
        font-size: 8px;
        font-weight: 900;
        letter-spacing: 0.08em;
        text-transform: uppercase;
      }

      .points-stats strong {
        font-family: var(--font-display);
        font-size: 20px;
        font-weight: 600;
        line-height: 1.1;
      }

      .points-layout {
        display: grid;
        grid-template-columns: 1.15fr 0.85fr;
        align-items: start;
        gap: 12px;
      }

      .rules-preview {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 6px;
        padding: 10px;
        border-radius: 9px;
        background: var(--ink);
        color: var(--cream);
      }

      .rules-preview > div {
        display: flex;
        flex-direction: column;
      }

      .rules-preview span {
        color: rgba(255, 248, 238, 0.45);
        font-size: 7.5px;
        font-weight: 800;
        text-transform: uppercase;
      }

      .rules-preview strong {
        color: var(--gold);
        font-family: var(--font-display);
        font-size: 15px;
        font-weight: 600;
      }

      .rules-preview > app-icon {
        color: rgba(255, 248, 238, 0.25);
      }

      .club-summary {
        display: grid;
        gap: 9px;
      }

      .club-summary > div {
        display: flex;
        align-items: center;
        gap: 9px;
        padding: 9px;
        border-radius: 9px;
        background: var(--cream-2);
      }

      .club-summary__icon {
        display: grid;
        place-items: center;
        width: 32px;
        height: 32px;
        border-radius: 9px;
        background: var(--white);
        color: var(--ink);
      }

      .club-summary__icon.is-gold {
        color: var(--gold-dark);
      }

      .club-summary__icon.is-green {
        color: var(--success);
      }

      .club-summary strong {
        display: block;
        font-family: var(--font-display);
        font-size: 17px;
        font-weight: 600;
        line-height: 1.1;
      }

      .club-summary small {
        color: var(--muted);
        font-size: 8px;
      }

      .club-tip {
        display: flex;
        gap: 9px;
        margin-top: 12px;
        padding: 11px;
        border-radius: 10px;
        background: var(--gold-soft);
        color: var(--gold-dark);
      }

      .club-tip app-icon {
        flex: none;
        margin-top: 1px;
      }

      .club-tip strong {
        display: block;
        font-size: 10px;
      }

      .club-tip p {
        margin: 2px 0 5px;
        color: #8a641f;
        font-size: 8.5px;
        line-height: 1.5;
      }

      .club-tip a {
        display: inline-flex;
        align-items: center;
        gap: 3px;
        font-size: 8.5px;
        font-weight: 900;
      }

      .admin-panel__head .admin-search {
        max-width: 240px;
      }

      .admin-panel__head .admin-search .input {
        min-height: 34px;
      }

      .tx-toolbar {
        padding: 0 16px 10px;
      }

      .tx-type {
        display: inline-flex;
        align-items: center;
        gap: 4px;
        padding: 3px 7px;
        border-radius: var(--radius-pill);
        font-size: 8px;
        font-weight: 900;
        white-space: nowrap;
      }

      .tx-type--green {
        background: var(--success-soft);
        color: var(--success);
      }

      .tx-type--red {
        background: var(--red-soft);
        color: var(--red);
      }

      .tx-type--gold {
        background: var(--gold-soft);
        color: var(--gold-dark);
      }

      .tx-type--ink {
        background: var(--cream-2);
        color: var(--ink);
      }

      .tx-points {
        color: var(--success);
        font-size: 11px;
        font-weight: 900;
      }

      .tx-points.is-negative {
        color: var(--danger);
      }

      @media (max-width: 900px) {
        .points-layout {
          grid-template-columns: 1fr;
        }
        .points-stats {
          grid-template-columns: 1fr;
        }
        .admin-panel__head {
          flex-direction: column;
        }
        .admin-panel__head .admin-search {
          width: 100%;
          max-width: none;
        }
      }
    `,
  ],
})
export class AdminPointsPageComponent {
  readonly auth = inject(AuthService);
  private readonly site = inject(SiteConfigService);
  private readonly demo = inject(DemoStoreService);
  private readonly toast = inject(ToastService);

  readonly tipos: TipoTransaccion[] = [
    'ganado',
    'canjeado',
    'ajuste',
    'bienvenida',
  ];
  readonly tipoInfo = TIPO_INFO;

  readonly form = signal<ConfigPuntos>({ ...this.site.configPuntos() });
  readonly busqueda = signal('');
  readonly filtro = signal<FiltroTipo>('todos');
  readonly guardando = signal(false);

  readonly movimientos = computed<MovimientoRow[]>(() => {
    const perfiles = new Map(this.auth.perfiles().map((perfil) => [perfil.id, perfil]));
    return this.demo
      .transaccionesOrdenadas()
      .map((transaccion) => ({
        ...transaccion,
        perfil: perfiles.get(transaccion.perfilId),
      }));
  });

  readonly saldoCirculante = computed(() =>
    this.auth.perfiles().reduce((total, perfil) => total + perfil.puntos, 0),
  );

  readonly emitidos = computed(() =>
    this.movimientos()
      .filter((movimiento) => movimiento.puntos > 0)
      .reduce((total, movimiento) => total + movimiento.puntos, 0),
  );

  readonly canjeados = computed(() =>
    Math.abs(
      this.movimientos()
        .filter((movimiento) => movimiento.puntos < 0)
        .reduce((total, movimiento) => total + movimiento.puntos, 0),
    ),
  );

  readonly equivalenciaTotal = computed(() =>
    Math.floor(this.saldoCirculante() / Math.max(1, this.form().bloqueCanje)) *
    this.form().valorBloque,
  );

  readonly miembrosActivos = computed(
    () => this.auth.perfiles().filter((perfil) => perfil.puntos > 0).length,
  );

  readonly puntosEjemplo = computed(() =>
    Math.floor(100 * this.form().puntosPorSol),
  );

  readonly canjeEjemplo = computed(() => {
    const config = this.form();
    const topeSoles = 100 * (config.topePorcentaje / 100);
    const bloques = Math.floor(topeSoles / Math.max(0.01, config.valorBloque));
    return Math.max(0, bloques * config.valorBloque);
  });

  readonly filtrados = computed(() => {
    const term = this.busqueda().trim().toLowerCase();
    const filtro = this.filtro();
    return this.movimientos().filter((movimiento) => {
      if (filtro !== 'todos' && movimiento.tipo !== filtro) return false;
      if (!term) return true;
      return `${movimiento.descripcion} ${movimiento.perfil?.nombre ?? ''} ${movimiento.perfil?.email ?? ''}`
        .toLowerCase()
        .includes(term);
    });
  });

  setNumero(
    campo: keyof ConfigPuntos,
    value: string,
  ): void {
    const numero = Number(value);
    this.form.update((config) => ({
      ...config,
      [campo]: Math.max(0, numero || 0),
    }));
  }

  restablecer(): void {
    this.form.set({ ...this.site.configPuntos() });
  }

  async guardarConfig(event?: Event): Promise<void> {
    event?.preventDefault();
    const config = this.form();
    if (config.bloqueCanje < 1) {
      this.toast.warning('El bloque de canje debe ser al menos 1.');
      return;
    }
    if (config.valorBloque <= 0) {
      this.toast.warning('El valor del bloque debe ser mayor que cero.');
      return;
    }
    if (config.topePorcentaje < 0 || config.topePorcentaje > 100) {
      this.toast.warning('El tope de canje debe estar entre 0 y 100 %.');
      return;
    }
    this.guardando.set(true);
    try {
      await this.site.guardarConfigPuntos(config);
      this.toast.success('Reglas de puntos actualizadas.');
    } catch (error) {
      this.toast.error(
        error instanceof Error ? error.message : 'No pudimos guardar las reglas.',
      );
    } finally {
      this.guardando.set(false);
    }
  }

  inicial(nombre?: string): string {
    return initials(nombre);
  }

  formatDate(value: string): string {
    return formatDate(value);
  }

  formatTime(value: string): string {
    return formatTime(value);
  }
}
