import { Component, computed, inject, signal } from '@angular/core';
import { UsuarioAdminRow } from '../../../core/models';
import { AuthService } from '../../../core/services/auth.service';
import { DashboardService } from '../../../core/services/dashboard.service';
import { ToastService } from '../../../core/services/toast.service';
import { formatDate, initials } from '../../../core/utils/format';
import { IconComponent } from '../../../shared/components/icon.component';
import { ModalComponent } from '../../../shared/components/modal.component';

@Component({
  selector: 'app-admin-users',
  standalone: true,
  imports: [IconComponent, ModalComponent],
  template: `
    <div class="admin-page">
      <div class="page-head">
        <div class="page-head__info">
          <span class="eyebrow">Accesos</span>
          <h1>Usuarios y roles</h1>
          <p>Controla quién puede administrar el panel y quién solo puede pedir.</p>
        </div>
        <div class="page-head__actions">
          <span class="badge badge--green">
            <app-icon name="lucideShieldCheck" size="12" />
            {{ admins() }} administradores
          </span>
        </div>
      </div>

      <div class="user-stats">
        <div>
          <span><app-icon name="lucideUsers" size="18" /></span>
          <div><small>Usuarios</small><strong>{{ usuarios().length }}</strong></div>
        </div>
        <div>
          <span class="is-gold"><app-icon name="lucideShieldCheck" size="18" /></span>
          <div><small>Administradores</small><strong>{{ admins() }}</strong></div>
        </div>
        <div>
          <span class="is-green"><app-icon name="lucideUser" size="18" /></span>
          <div><small>Clientes</small><strong>{{ clientes() }}</strong></div>
        </div>
      </div>

      <section class="admin-panel">
        <div class="users-toolbar">
          <div class="admin-search">
            <app-icon name="lucideSearch" size="15" />
            <input
              class="input"
              type="search"
              placeholder="Buscar usuario"
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
              <p>No encontramos usuarios con esos filtros.</p>
            </div>
          } @else {
            <table class="data-table">
              <thead>
                <tr>
                  <th>Usuario</th>
                  <th>Contacto</th>
                  <th>Rol actual</th>
                  <th class="is-center">Pedidos</th>
                  <th>Miembro desde</th>
                  <th class="is-right">Cambiar rol</th>
                </tr>
              </thead>
              <tbody>
                @for (usuario of filtrados(); track usuario.id) {
                  <tr>
                    <td>
                      <div class="cell-user">
                        <span class="mini-avatar">{{ inicial(usuario.nombre) }}</span>
                        <div>
                          <strong>
                            {{ usuario.nombre }}
                            @if (usuario.id === auth.perfil()?.id) {
                              <span class="you-tag">Tú</span>
                            }
                          </strong>
                          <small>{{ usuario.email }}</small>
                        </div>
                      </div>
                    </td>
                    <td><small>{{ usuario.telefono || 'Sin teléfono' }}</small></td>
                    <td>
                      @if (usuario.rol === 'admin') {
                        <span class="role-badge role-badge--admin">
                          <app-icon name="lucideShieldCheck" size="11" />
                          Administrador
                        </span>
                      } @else {
                        <span class="role-badge">
                          <app-icon name="lucideUser" size="11" />
                          Cliente
                        </span>
                      }
                    </td>
                    <td class="is-center">{{ usuario.pedidos }}</td>
                    <td><small>{{ formatDate(usuario.createdAt) }}</small></td>
                    <td>
                      <div class="cell-actions">
                        <button
                          type="button"
                          [disabled]="usuario.id === auth.perfil()?.id"
                          [attr.aria-label]="usuario.rol === 'admin' ? 'Quitar admin' : 'Hacer admin'"
                          [title]="
                            usuario.id === auth.perfil()?.id
                              ? 'No puedes cambiar tu propio rol'
                              : usuario.rol === 'admin'
                                ? 'Quitar rol de administrador'
                                : 'Dar acceso de administrador'
                          "
                          (click)="confirmar.set(usuario)"
                        >
                          <app-icon name="lucideShieldCheck" size="14" />
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
      [open]="confirmar() !== null"
      eyebrow="Cambio de rol"
      [title]="confirmar()?.rol === 'admin' ? 'Quitar acceso admin' : 'Dar acceso admin'"
      size="sm"
      (closed)="confirmar.set(null)"
    >
      @if (confirmar(); as usuario) {
        <div class="role-confirm">
          <span
            class="role-confirm__icon"
            [class.is-danger]="usuario.rol === 'admin'"
          >
            <app-icon name="lucideShieldCheck" size="24" />
          </span>
          <p>
            @if (usuario.rol === 'admin') {
              <strong>{{ usuario.nombre }}</strong> dejará de tener acceso al panel de
              administración. Su cuenta de cliente seguirá activa.
            } @else {
              <strong>{{ usuario.nombre }}</strong> podrá acceder al panel, gestionar
              pedidos, productos y configuración.
            }
          </p>
        </div>

        <div class="admin-note">
          <app-icon name="lucideAlertTriangle" size="14" />
          <p>
            Los administradores tienen acceso completo a la operación. Asigna este rol
            solo a personas de confianza.
          </p>
        </div>

        <div class="admin-form__actions">
          <button type="button" class="btn btn--ghost btn--sm" (click)="confirmar.set(null)">
            Cancelar
          </button>
          <button
            type="button"
            class="btn btn--sm"
            [class.btn--danger]="usuario.rol === 'admin'"
            [class.btn--primary]="usuario.rol !== 'admin'"
            [disabled]="procesando()"
            (click)="cambiar(usuario)"
          >
            @if (procesando()) {
              <app-icon name="lucideLoaderCircle" size="15" class="spin" />
            } @else {
              <app-icon name="lucideCheck" size="15" />
            }
            {{ usuario.rol === 'admin' ? 'Quitar admin' : 'Hacer admin' }}
          </button>
        </div>
      }
    </app-modal>
  `,
  styles: [
    `
      .user-stats {
        display: grid;
        grid-template-columns: repeat(3, 1fr);
        gap: 10px;
      }

      .user-stats > div {
        display: flex;
        align-items: center;
        gap: 10px;
        padding: 12px 14px;
        border: 1px solid rgba(10, 10, 11, 0.08);
        border-radius: 12px;
        background: var(--white);
      }

      .user-stats > div > span {
        display: grid;
        place-items: center;
        width: 34px;
        height: 34px;
        border-radius: 9px;
        background: var(--cream-2);
        color: var(--ink);
      }

      .user-stats > div > span.is-gold {
        background: var(--gold-soft);
        color: var(--gold-dark);
      }

      .user-stats > div > span.is-green {
        background: var(--success-soft);
        color: var(--success);
      }

      .user-stats small {
        display: block;
        color: var(--muted-2);
        font-size: 8px;
        font-weight: 900;
        letter-spacing: 0.08em;
        text-transform: uppercase;
      }

      .user-stats strong {
        font-family: var(--font-display);
        font-size: 20px;
        font-weight: 600;
        line-height: 1.1;
      }

      .users-toolbar {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 10px;
        flex-wrap: wrap;
        padding: 13px 16px;
        border-bottom: 1px solid var(--line);
      }

      .users-toolbar .admin-search {
        max-width: 300px;
      }

      .you-tag {
        display: inline-block;
        margin-left: 4px;
        padding: 1px 5px;
        border-radius: 4px;
        background: var(--red-soft);
        color: var(--red);
        font-size: 7px;
        font-weight: 900;
        text-transform: uppercase;
        vertical-align: middle;
      }

      .role-badge {
        display: inline-flex;
        align-items: center;
        gap: 4px;
        padding: 3px 7px;
        border-radius: var(--radius-pill);
        background: var(--cream-2);
        color: var(--muted);
        font-size: 8px;
        font-weight: 900;
        white-space: nowrap;
      }

      .role-badge--admin {
        background: var(--gold-soft);
        color: var(--gold-dark);
      }

      .role-confirm {
        display: flex;
        gap: 11px;
        margin-bottom: 12px;
      }

      .role-confirm__icon {
        display: grid;
        place-items: center;
        flex: none;
        width: 46px;
        height: 46px;
        border-radius: 50%;
        background: var(--gold-soft);
        color: var(--gold-dark);
      }

      .role-confirm__icon.is-danger {
        background: var(--danger-soft);
        color: var(--danger);
      }

      .role-confirm p {
        color: var(--muted);
        font-size: 10.5px;
        line-height: 1.65;
      }

      .role-confirm strong {
        color: var(--ink);
      }

      @media (max-width: 640px) {
        .user-stats {
          grid-template-columns: 1fr;
        }
        .users-toolbar {
          flex-direction: column;
          align-items: stretch;
        }
        .users-toolbar .admin-search {
          max-width: none;
        }
      }
    `,
  ],
})
export class AdminUsersPageComponent {
  readonly auth = inject(AuthService);
  private readonly dashboard = inject(DashboardService);
  private readonly toast = inject(ToastService);

  readonly usuarios = this.dashboard.usuarios;
  readonly busqueda = signal('');
  readonly filtro = signal<'todos' | 'admin' | 'cliente'>('todos');
  readonly confirmar = signal<UsuarioAdminRow | null>(null);
  readonly procesando = signal(false);

  readonly filtros = [
    { id: 'todos', label: 'Todos' },
    { id: 'admin', label: 'Administradores' },
    { id: 'cliente', label: 'Clientes' },
  ] as const;

  readonly admins = computed(
    () => this.usuarios().filter((usuario) => usuario.rol === 'admin').length,
  );

  readonly clientes = computed(
    () => this.usuarios().filter((usuario) => usuario.rol === 'cliente').length,
  );

  readonly filtrados = computed(() => {
    const term = this.busqueda().trim().toLowerCase();
    const filtro = this.filtro();
    return this.usuarios().filter((usuario) => {
      if (filtro !== 'todos' && usuario.rol !== filtro) return false;
      if (!term) return true;
      return `${usuario.nombre} ${usuario.email} ${usuario.telefono}`
        .toLowerCase()
        .includes(term);
    });
  });

  inicial(nombre: string): string {
    return initials(nombre);
  }

  formatDate(value: string): string {
    return formatDate(value);
  }

  async cambiar(usuario: UsuarioAdminRow): Promise<void> {
    this.procesando.set(true);
    try {
      const nuevoRol = usuario.rol === 'admin' ? 'cliente' : 'admin';
      await this.auth.cambiarRol(usuario.id, nuevoRol);
      this.confirmar.set(null);
      this.toast.success(
        nuevoRol === 'admin'
          ? 'Acceso de administrador otorgado.'
          : 'Acceso de administrador retirado.',
      );
    } catch (error) {
      this.toast.error(
        error instanceof Error ? error.message : 'No pudimos cambiar el rol.',
      );
    } finally {
      this.procesando.set(false);
    }
  }
}
