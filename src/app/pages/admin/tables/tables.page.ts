import { Component, computed, inject, signal } from '@angular/core';
import {
  AMBIENTES,
  AmbienteMesa,
  ESTADOS_MESA,
  EstadoMesa,
  Mesa,
  TIPOS_MESA,
  TipoMesa,
} from '../../../core/models';
import { SalonService } from '../../../core/services/salon.service';
import { ToastService } from '../../../core/services/toast.service';
import { IconComponent } from '../../../shared/components/icon.component';
import { ModalComponent } from '../../../shared/components/modal.component';

type FiltroEstado = 'todas' | EstadoMesa;

@Component({
  selector: 'app-admin-tables-page',
  standalone: true,
  imports: [IconComponent, ModalComponent],
  template: `
    <div class="admin-page">
      <header class="page-head">
        <div class="page-head__info">
          <span class="eyebrow">Salón</span>
          <h1>Mesas</h1>
          <p>Mapa de mesas por ambiente y estado de atención.</p>
        </div>
        <div class="page-head__actions">
          <button type="button" class="btn btn--primary btn--sm" (click)="nuevaMesa()">
            <app-icon name="lucidePlus" size="15" />
            Nueva mesa
          </button>
        </div>
      </header>

      <div class="table-stats">
        <article>
          <span class="table-stats__icon is-libre"><app-icon name="lucideArmchair" size="18" /></span>
          <div><strong>{{ stats().libres }}</strong><small>Mesas libres</small></div>
        </article>
        <article>
          <span class="table-stats__icon is-ocupada"><app-icon name="lucideUsers" size="18" /></span>
          <div><strong>{{ stats().ocupadas }}</strong><small>Ocupadas ahora</small></div>
        </article>
        <article>
          <span class="table-stats__icon is-reservada"><app-icon name="lucideCalendar" size="18" /></span>
          <div><strong>{{ stats().reservadas }}</strong><small>Reservadas</small></div>
        </article>
        <article>
          <span class="table-stats__icon is-cobrar"><app-icon name="lucideBanknote" size="18" /></span>
          <div><strong>{{ stats().porCobrar }}</strong><small>Por cobrar</small></div>
        </article>
      </div>

      <div class="admin-toolbar">
        <div class="admin-tabs">
          <button type="button" [class.is-active]="filtro() === 'todas'" (click)="filtro.set('todas')">
            Todas
            <span class="admin-tabs__count">{{ salon.mesasActivas().length }}</span>
          </button>
          @for (estado of estados; track estado) {
            <button
              type="button"
              [class.is-active]="filtro() === estado"
              (click)="filtro.set(estado)"
            >
              {{ estadoInfo(estado).label }}
              <span class="admin-tabs__count">{{ contarEstado(estado) }}</span>
            </button>
          }
        </div>
        <select
          class="input select"
          [value]="ambienteFiltro()"
          (change)="ambienteFiltro.set($any($event.target).value)"
          aria-label="Filtrar por ambiente"
        >
          <option value="todos">Todos los ambientes</option>
          @for (ambiente of ambientes; track ambiente.id) {
            <option [value]="ambiente.id">{{ ambiente.label }}</option>
          }
        </select>
      </div>

      @for (grupo of grupos(); track grupo.id) {
        <section class="ambiente-block">
          <header class="ambiente-block__head">
            <div>
              <span class="ambiente-block__icon"><app-icon [name]="grupo.icono" size="18" /></span>
              <h2>{{ grupo.label }}</h2>
              <span class="badge-soft">{{ grupo.mesas.length }} mesas</span>
            </div>
            <span class="ambiente-block__cap">
              {{ grupo.capacidad }} asientos · {{ grupo.libres }} libres
            </span>
          </header>

          <div class="tables-grid">
            @for (mesa of grupo.mesas; track mesa.id) {
              <button
                type="button"
                class="mesa-card"
                [class.is-off]="!mesa.activo"
                [style.--mesa-color]="estadoInfo(mesa.estado).color"
                (click)="editar(mesa)"
              >
                <span class="mesa-card__state">{{ estadoInfo(mesa.estado).label }}</span>
                <strong>{{ mesa.numero }}</strong>
                <span class="mesa-card__capacity">
                  <app-icon name="lucideUsers" size="13" />
                  {{ mesa.capacidad }}
                </span>
                <small>{{ tipoInfo(mesa.tipo).label }}</small>
                <span class="mesa-card__detail">{{ mesa.detalle || 'Sin detalle' }}</span>
              </button>
            } @empty {
              <div class="admin-empty">
                <app-icon name="lucideArmchair" size="26" />
                <p>No hay mesas con este filtro.</p>
              </div>
            }
          </div>
        </section>
      } @empty {
        <div class="admin-panel">
          <div class="admin-empty">
            <app-icon name="lucideArmchair" size="30" />
            <p>No hay mesas con este filtro.</p>
          </div>
        </div>
      }

      <div class="legend">
        @for (estado of estados; track estado) {
          <span>
            <i [style.background]="estadoInfo(estado).color"></i>
            {{ estadoInfo(estado).label }}
          </span>
        }
      </div>
    </div>

    <app-modal
      [open]="editorAbierto()"
      [eyebrow]="editando() ? 'Editar mesa' : 'Nueva mesa'"
      [title]="editando() ? 'Mesa ' + numero() : 'Agregar mesa'"
      (closed)="cerrarEditor()"
      [footer]="true"
    >
      <div class="admin-form">
        <div class="form-grid form-grid--three">
          <label class="field">
            <span class="field-label">Número *</span>
            <input
              class="input"
              type="text"
              [value]="numero()"
              (input)="numero.set($any($event.target).value)"
              placeholder="Ej. 07"
              maxlength="5"
            />
          </label>
          <label class="field">
            <span class="field-label">Capacidad *</span>
            <input
              class="input"
              type="number"
              min="1"
              max="20"
              [value]="capacidad()"
              (input)="capacidad.set(+$any($event.target).value)"
            />
          </label>
          <label class="field">
            <span class="field-label">Estado</span>
            <select
              class="select"
              [value]="estado()"
              (change)="estado.set($any($event.target).value)"
            >
              @for (item of estados; track item) {
                <option [value]="item">{{ estadoInfo(item).label }}</option>
              }
            </select>
          </label>
        </div>

        <div class="form-grid">
          <label class="field">
            <span class="field-label">Ambiente</span>
            <select
              class="select"
              [value]="ambiente()"
              (change)="ambiente.set($any($event.target).value)"
            >
              @for (item of ambientes; track item.id) {
                <option [value]="item.id">{{ item.label }}</option>
              }
            </select>
          </label>
          <label class="field">
            <span class="field-label">Tipo de mesa</span>
            <select
              class="select"
              [value]="tipo()"
              (change)="tipo.set($any($event.target).value)"
            >
              @for (item of tipos; track item) {
                <option [value]="item">{{ tipoInfo(item).label }}</option>
              }
            </select>
          </label>
        </div>

        <label class="field">
          <span class="field-label">Detalle o ubicación</span>
          <input
            class="input"
            type="text"
            [value]="detalle()"
            (input)="detalle.set($any($event.target).value)"
            placeholder="Junto a la ventana, bajo la pérgola..."
            maxlength="100"
          />
        </label>

        <div class="admin-note">
          <app-icon name="lucideInfo" size="16" />
          <span>
            Las mesas fuera de servicio no pueden asignarse a reservas ni
            marcarse como ocupadas.
          </span>
        </div>
      </div>

      <div modalFooter class="admin-form__actions">
        @if (editando()) {
          <button
            type="button"
            class="btn btn--ghost btn--sm is-danger"
            (click)="pedirEliminar()"
          >
            <app-icon name="lucideTrash2" size="14" />
            Eliminar
          </button>
        }
        <button type="button" class="btn btn--ghost btn--sm" (click)="cerrarEditor()">
          Cancelar
        </button>
        <button type="button" class="btn btn--primary btn--sm" (click)="guardar()">
          <app-icon name="lucideSave" size="14" />
          Guardar mesa
        </button>
      </div>
    </app-modal>

    <app-modal
      [open]="confirmarEliminar() !== null"
      eyebrow="Eliminar mesa"
      title="¿Retirar esta mesa?"
      size="sm"
      [footer]="true"
      (closed)="confirmarEliminar.set(null)"
    >
      @if (confirmarEliminar(); as mesa) {
        <p class="confirm-text">
          La mesa <strong>{{ mesa.numero }}</strong> quedará fuera de servicio.
          Si tiene reservas activas, primero reasígnalas.
        </p>
      }
      <div modalFooter class="admin-form__actions">
        <button type="button" class="btn btn--ghost btn--sm" (click)="confirmarEliminar.set(null)">
          Cancelar
        </button>
        <button type="button" class="btn btn--danger btn--sm" (click)="eliminar()">
          Sí, eliminar
        </button>
      </div>
    </app-modal>
  `,
  styles: [
    `
      :host {
        display: block;
      }

      .table-stats {
        display: grid;
        grid-template-columns: repeat(4, 1fr);
        gap: 12px;
      }

      .table-stats article {
        display: flex;
        align-items: center;
        gap: 12px;
        padding: 16px;
        border: 1px solid rgba(10, 10, 11, 0.08);
        border-radius: 14px;
        background: var(--white);
      }

      .table-stats__icon {
        display: grid;
        place-items: center;
        width: 38px;
        height: 38px;
        border-radius: 10px;
      }

      .table-stats__icon.is-libre {
        background: rgba(47, 143, 91, 0.1);
        color: #2f8f5b;
      }

      .table-stats__icon.is-ocupada {
        background: rgba(200, 16, 46, 0.09);
        color: var(--red);
      }

      .table-stats__icon.is-reservada {
        background: rgba(184, 134, 11, 0.12);
        color: var(--gold-dark);
      }

      .table-stats__icon.is-cobrar {
        background: rgba(37, 99, 168, 0.1);
        color: #2563a8;
      }

      .table-stats div {
        display: grid;
        gap: 1px;
      }

      .table-stats strong {
        font-family: var(--font-display);
        font-size: 23px;
        font-weight: 600;
        line-height: 1;
      }

      .table-stats small {
        color: var(--muted);
        font-size: 9px;
      }

      .admin-toolbar {
        margin-bottom: 0;
      }

      .ambiente-block {
        display: grid;
        gap: 12px;
      }

      .ambiente-block__head {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 12px;
      }

      .ambiente-block__head > div {
        display: flex;
        align-items: center;
        gap: 8px;
      }

      .ambiente-block__icon {
        display: grid;
        place-items: center;
        width: 34px;
        height: 34px;
        border-radius: 9px;
        background: var(--ink);
        color: var(--gold);
      }

      .ambiente-block__head h2 {
        margin: 0;
        font-family: var(--font-display);
        font-size: 19px;
        font-weight: 600;
      }

      .ambiente-block__cap {
        color: var(--muted);
        font-size: 9.5px;
      }

      .tables-grid {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
        gap: 10px;
      }

      .mesa-card {
        position: relative;
        display: grid;
        justify-items: start;
        gap: 2px;
        min-height: 128px;
        padding: 14px;
        border: 1px solid rgba(10, 10, 11, 0.09);
        border-top: 3px solid var(--mesa-color);
        border-radius: 12px;
        background: var(--white);
        color: var(--ink);
        text-align: left;
        cursor: pointer;
        transition: var(--transition);
      }

      .mesa-card:hover {
        transform: translateY(-2px);
        box-shadow: 0 10px 22px rgba(10, 10, 11, 0.08);
      }

      .mesa-card.is-off {
        opacity: 0.58;
      }

      .mesa-card__state {
        justify-self: end;
        color: var(--mesa-color);
        font-size: 8px;
        font-weight: 900;
        letter-spacing: 0.06em;
        text-transform: uppercase;
      }

      .mesa-card > strong {
        font-family: var(--font-display);
        font-size: 27px;
        font-weight: 600;
        line-height: 1;
      }

      .mesa-card__capacity {
        display: inline-flex;
        align-items: center;
        gap: 3px;
        color: var(--muted);
        font-size: 9px;
      }

      .mesa-card small {
        color: var(--muted-2);
        font-size: 8.5px;
      }

      .mesa-card__detail {
        overflow: hidden;
        max-width: 100%;
        margin-top: 5px;
        color: var(--muted);
        font-size: 8.5px;
        text-overflow: ellipsis;
        white-space: nowrap;
      }

      .legend {
        display: flex;
        flex-wrap: wrap;
        gap: 14px;
        color: var(--muted);
        font-size: 9px;
      }

      .legend span {
        display: inline-flex;
        align-items: center;
        gap: 5px;
      }

      .legend i {
        width: 8px;
        height: 8px;
        border-radius: 50%;
      }

      .confirm-text {
        color: var(--muted);
        font-size: 12px;
        line-height: 1.65;
      }

      .confirm-text strong {
        color: var(--ink);
      }

      .btn.is-danger {
        color: var(--danger);
      }

      @media (max-width: 900px) {
        .table-stats {
          grid-template-columns: 1fr 1fr;
        }
      }

      @media (max-width: 620px) {
        .tables-grid {
          grid-template-columns: 1fr 1fr;
        }

        .ambiente-block__head {
          align-items: flex-start;
          flex-direction: column;
        }
      }
    `,
  ],
})
export class AdminTablesPageComponent {
  readonly salon = inject(SalonService);
  private readonly toast = inject(ToastService);

  readonly ambientes = AMBIENTES;
  readonly tipos = Object.keys(TIPOS_MESA) as TipoMesa[];
  readonly estados = Object.keys(ESTADOS_MESA) as EstadoMesa[];

  readonly filtro = signal<FiltroEstado>('todas');
  readonly ambienteFiltro = signal<'todos' | AmbienteMesa>('todos');
  readonly editorAbierto = signal(false);
  readonly editando = signal<Mesa | null>(null);
  readonly confirmarEliminar = signal<Mesa | null>(null);

  readonly numero = signal('');
  readonly capacidad = signal(4);
  readonly ambiente = signal<AmbienteMesa>('salon');
  readonly tipo = signal<TipoMesa>('estandar');
  readonly detalle = signal('');
  readonly estado = signal<EstadoMesa>('libre');

  readonly stats = computed(() => {
    const mesas = this.salon.mesasActivas();
    return {
      libres: mesas.filter((mesa) => mesa.estado === 'libre').length,
      ocupadas: mesas.filter((mesa) => mesa.estado === 'ocupada').length,
      reservadas: mesas.filter((mesa) => mesa.estado === 'reservada').length,
      porCobrar: mesas.filter((mesa) => mesa.estado === 'por_cobrar').length,
    };
  });

  readonly grupos = computed(() =>
    this.ambientes
      .filter(
        (ambiente) =>
          this.ambienteFiltro() === 'todos' || ambiente.id === this.ambienteFiltro(),
      )
      .map((ambiente) => {
        const mesas = this.salon
          .mesasDeAmbiente(ambiente.id)
          .filter((mesa) => this.filtro() === 'todas' || mesa.estado === this.filtro());
        return {
          ...ambiente,
          mesas,
          capacidad: mesas.reduce((total, mesa) => total + mesa.capacidad, 0),
          libres: mesas.filter((mesa) => mesa.estado === 'libre').length,
        };
      })
      .filter((grupo) => grupo.mesas.length > 0),
  );

  estadoInfo(estado: EstadoMesa) {
    return ESTADOS_MESA[estado];
  }

  tipoInfo(tipo: TipoMesa) {
    return TIPOS_MESA[tipo];
  }

  contarEstado(estado: EstadoMesa): number {
    return this.salon.mesasActivas().filter((mesa) => mesa.estado === estado).length;
  }

  nuevaMesa(): void {
    this.editando.set(null);
    this.numero.set('');
    this.capacidad.set(4);
    this.ambiente.set('salon');
    this.tipo.set('estandar');
    this.detalle.set('');
    this.estado.set('libre');
    this.editorAbierto.set(true);
  }

  editar(mesa: Mesa): void {
    this.editando.set(mesa);
    this.numero.set(mesa.numero);
    this.capacidad.set(mesa.capacidad);
    this.ambiente.set(mesa.ambiente);
    this.tipo.set(mesa.tipo);
    this.detalle.set(mesa.detalle);
    this.estado.set(mesa.estado);
    this.editorAbierto.set(true);
  }

  cerrarEditor(): void {
    this.editorAbierto.set(false);
    this.editando.set(null);
  }

  guardar(): void {
    try {
      const actual = this.editando();
      const mesa: Mesa = {
        id: actual?.id ?? 0,
        numero: this.numero().trim(),
        capacidad: this.capacidad(),
        ambiente: this.ambiente(),
        tipo: this.tipo(),
        detalle: this.detalle().trim(),
        estado: this.estado(),
        activo: actual?.activo ?? true,
      };
      this.salon.guardarMesa(mesa);
      this.toast.success('La mesa se guardó correctamente.', 'Mesa guardada');
      this.cerrarEditor();
    } catch (error) {
      this.toast.error(error instanceof Error ? error.message : 'No pudimos guardar la mesa.');
    }
  }

  pedirEliminar(): void {
    const mesa = this.editando();
    if (!mesa) return;
    this.confirmarEliminar.set(mesa);
  }

  eliminar(): void {
    const mesa = this.confirmarEliminar();
    if (!mesa) return;
    try {
      this.salon.eliminarMesa(mesa.id);
      this.confirmarEliminar.set(null);
      this.cerrarEditor();
      this.toast.success('La mesa quedó fuera de servicio.', 'Mesa eliminada');
    } catch (error) {
      this.toast.error(error instanceof Error ? error.message : 'No pudimos eliminar la mesa.');
    }
  }
}
