import {
  Component,
  computed,
  inject,
  signal,
} from '@angular/core';
import {
  NavigationEnd,
  Router,
  RouterLink,
  RouterLinkActive,
  RouterOutlet,
} from '@angular/router';
import { filter } from 'rxjs';
import { AuthService } from '../core/services/auth.service';
import { OrderService } from '../core/services/order.service';
import { ToastService } from '../core/services/toast.service';
import { IconComponent } from '../shared/components/icon.component';
import { LogoComponent } from '../shared/components/logo.component';
import { ToastContainerComponent } from '../shared/components/toast-container.component';

const TITULOS: Record<string, string> = {
  '/admin': 'Resumen general',
  '/admin/pedidos': 'Pedidos',
  '/admin/productos': 'Productos',
  '/admin/categorias': 'Categorías',
  '/admin/clientes': 'Clientes',
  '/admin/puntos': 'Programa de puntos',
  '/admin/usuarios': 'Usuarios y roles',
  '/admin/mesas': 'Mesas y salón',
  '/admin/reservas': 'Reservas',
  '/admin/reportes': 'Reportes',
  '/admin/configuracion': 'Configuración',
};

@Component({
  selector: 'app-admin-layout',
  standalone: true,
  imports: [
    RouterOutlet,
    RouterLink,
    RouterLinkActive,
    IconComponent,
    LogoComponent,
    ToastContainerComponent,
  ],
  template: `
    <div class="admin">
      @if (menuOpen()) {
        <div class="admin__overlay" (click)="menuOpen.set(false)"></div>
      }

      <aside class="sidebar" [class.sidebar--open]="menuOpen()">
        <div class="sidebar__brand">
          <app-logo variant="cream" size="sm" link="/admin" />
          <button
            type="button"
            class="sidebar__close"
            aria-label="Cerrar menú"
            (click)="menuOpen.set(false)"
          >
            <app-icon name="lucideX" size="18" />
          </button>
        </div>
        <p class="sidebar__tag">Panel de administración</p>

        <nav class="sidebar__nav">
          <span class="sidebar__group">Operación</span>
          <a
            routerLink="/admin"
            routerLinkActive="is-active"
            [routerLinkActiveOptions]="{ exact: true }"
            (click)="menuOpen.set(false)"
          >
            <app-icon name="lucideLayoutDashboard" size="17" />
            Dashboard
          </a>
          <a
            routerLink="/admin/pedidos"
            routerLinkActive="is-active"
            (click)="menuOpen.set(false)"
          >
            <app-icon name="lucideClipboardList" size="17" />
            Pedidos
            @if (pendientes() > 0) {
              <span class="sidebar__badge">{{ pendientes() }}</span>
            }
          </a>

          <span class="sidebar__group">Catálogo</span>
          <a
            routerLink="/admin/productos"
            routerLinkActive="is-active"
            (click)="menuOpen.set(false)"
          >
            <app-icon name="lucideUtensilsCrossed" size="17" />
            Productos
          </a>
          <a
            routerLink="/admin/categorias"
            routerLinkActive="is-active"
            (click)="menuOpen.set(false)"
          >
            <app-icon name="lucideTags" size="17" />
            Categorías
          </a>

          <span class="sidebar__group">Salón</span>
          <a
            routerLink="/admin/mesas"
            routerLinkActive="is-active"
            (click)="menuOpen.set(false)"
          >
            <app-icon name="lucideArmchair" size="17" />
            Mesas
          </a>
          <a
            routerLink="/admin/reservas"
            routerLinkActive="is-active"
            (click)="menuOpen.set(false)"
          >
            <app-icon name="lucideCalendar" size="17" />
            Reservas
          </a>

          <span class="sidebar__group">Clientes</span>
          <a
            routerLink="/admin/clientes"
            routerLinkActive="is-active"
            (click)="menuOpen.set(false)"
          >
            <app-icon name="lucideUsers" size="17" />
            Clientes
          </a>
          <a
            routerLink="/admin/puntos"
            routerLinkActive="is-active"
            (click)="menuOpen.set(false)"
          >
            <app-icon name="lucideGift" size="17" />
            Puntos
          </a>
          <a
            routerLink="/admin/usuarios"
            routerLinkActive="is-active"
            (click)="menuOpen.set(false)"
          >
            <app-icon name="lucideShieldCheck" size="17" />
            Usuarios y roles
          </a>

          <span class="sidebar__group">Análisis</span>
          <a
            routerLink="/admin/reportes"
            routerLinkActive="is-active"
            (click)="menuOpen.set(false)"
          >
            <app-icon name="lucideTrendingUp" size="17" />
            Reportes
          </a>
          <a
            routerLink="/admin/configuracion"
            routerLinkActive="is-active"
            (click)="menuOpen.set(false)"
          >
            <app-icon name="lucideSettings" size="17" />
            Configuración
          </a>
        </nav>

        <div class="sidebar__foot">
          <a routerLink="/" class="sidebar__site">
            <app-icon name="lucideExternalLink" size="16" />
            Ver el sitio
          </a>
          <button type="button" class="sidebar__logout" (click)="cerrarSesion()">
            <app-icon name="lucideLogOut" size="16" />
            Cerrar sesión
          </button>
        </div>
      </aside>

      <div class="admin__content">
        <header class="topbar">
          <button
            type="button"
            class="topbar__burger"
            aria-label="Abrir menú"
            (click)="menuOpen.set(true)"
          >
            <app-icon name="lucideMenu" size="21" />
          </button>
          <div class="topbar__title">
            <span>Don Pepito · Admin</span>
            <strong>{{ titulo() }}</strong>
          </div>
          <div class="topbar__user">
            <span class="topbar__avatar">{{ inicial() }}</span>
            <span class="topbar__user-text">
              <strong>{{ auth.perfil()?.nombre }}</strong>
              <small>Administrador</small>
            </span>
          </div>
        </header>

        <main class="admin__main">
          <router-outlet />
        </main>
      </div>
    </div>
    <app-toast-container />
  `,
  styles: [
    `
      :host {
        display: block;
        min-height: 100vh;
        background: #f4f0e9;
      }

      .admin {
        display: flex;
        min-height: 100vh;
      }

      .admin__overlay {
        position: fixed;
        inset: 0;
        z-index: 70;
        background: rgba(10, 10, 11, 0.5);
        backdrop-filter: blur(3px);
      }

      .sidebar {
        position: fixed;
        inset: 0 auto 0 0;
        z-index: 80;
        display: flex;
        flex-direction: column;
        width: 252px;
        padding: 20px 14px 16px;
        background: var(--ink);
        color: var(--cream);
        overflow-y: auto;
      }

      .sidebar__brand {
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding: 0 8px 12px;
      }

      .sidebar__close {
        display: none;
        place-items: center;
        width: 32px;
        height: 32px;
        border: 0;
        border-radius: 50%;
        background: rgba(255, 255, 255, 0.08);
        color: var(--cream);
        cursor: pointer;
      }

      .sidebar__tag {
        margin: 0 8px 18px;
        padding-top: 12px;
        border-top: 1px solid rgba(255, 248, 238, 0.12);
        color: rgba(255, 248, 238, 0.4);
        font-size: 9px;
        font-weight: 800;
        letter-spacing: 0.16em;
        text-transform: uppercase;
      }

      .sidebar__nav {
        display: flex;
        flex-direction: column;
        gap: 2px;
      }

      .sidebar__group {
        margin: 16px 10px 5px;
        color: rgba(255, 248, 238, 0.32);
        font-size: 8.5px;
        font-weight: 900;
        letter-spacing: 0.16em;
        text-transform: uppercase;
      }

      .sidebar__nav a {
        display: flex;
        align-items: center;
        gap: 10px;
        padding: 9px 11px;
        border-radius: 10px;
        color: rgba(255, 248, 238, 0.66);
        font-size: 12.5px;
        font-weight: 700;
        text-decoration: none;
        transition: var(--transition);
      }

      .sidebar__nav a:hover {
        background: rgba(255, 255, 255, 0.06);
        color: var(--cream);
      }

      .sidebar__nav a.is-active {
        background: var(--red);
        color: var(--white);
        box-shadow: 0 8px 18px rgba(200, 16, 46, 0.3);
      }

      .sidebar__badge {
        display: grid;
        place-items: center;
        min-width: 18px;
        height: 18px;
        margin-left: auto;
        padding: 0 5px;
        border-radius: var(--radius-pill);
        background: var(--gold);
        color: var(--ink);
        font-size: 9px;
        font-weight: 900;
      }

      .sidebar__nav a.is-active .sidebar__badge {
        background: var(--white);
        color: var(--red);
      }

      .sidebar__foot {
        display: flex;
        flex-direction: column;
        gap: 4px;
        margin-top: auto;
        padding-top: 16px;
        border-top: 1px solid rgba(255, 248, 238, 0.12);
      }

      .sidebar__site,
      .sidebar__logout {
        display: flex;
        align-items: center;
        gap: 9px;
        padding: 9px 11px;
        border: 0;
        border-radius: 10px;
        background: transparent;
        color: rgba(255, 248, 238, 0.55);
        font-family: var(--font-body);
        font-size: 12px;
        font-weight: 700;
        text-align: left;
        text-decoration: none;
        cursor: pointer;
        transition: var(--transition);
      }

      .sidebar__site:hover,
      .sidebar__logout:hover {
        background: rgba(255, 255, 255, 0.06);
        color: var(--cream);
      }

      .sidebar__logout:hover {
        color: #ff8a8a;
      }

      .admin__content {
        display: flex;
        flex: 1;
        flex-direction: column;
        min-width: 0;
        margin-left: 252px;
      }

      .topbar {
        position: sticky;
        top: 0;
        z-index: 40;
        display: flex;
        align-items: center;
        gap: 16px;
        min-height: 66px;
        padding: 0 28px;
        background: rgba(244, 240, 233, 0.9);
        border-bottom: 1px solid rgba(10, 10, 11, 0.08);
        backdrop-filter: blur(14px);
      }

      .topbar__burger {
        display: none;
        place-items: center;
        width: 38px;
        height: 38px;
        border: 1px solid var(--line);
        border-radius: 10px;
        background: var(--white);
        color: var(--ink);
        cursor: pointer;
      }

      .topbar__title {
        display: flex;
        flex-direction: column;
        line-height: 1.2;
      }

      .topbar__title span {
        color: var(--muted-2);
        font-size: 9.5px;
        font-weight: 800;
        letter-spacing: 0.12em;
        text-transform: uppercase;
      }

      .topbar__title strong {
        font-family: var(--font-display);
        font-size: 20px;
        font-weight: 600;
        letter-spacing: -0.02em;
      }

      .topbar__user {
        display: flex;
        align-items: center;
        gap: 9px;
        margin-left: auto;
      }

      .topbar__avatar {
        display: grid;
        place-items: center;
        width: 36px;
        height: 36px;
        border-radius: 50%;
        background: var(--ink);
        color: var(--gold);
        font-family: var(--font-display);
        font-size: 15px;
        font-weight: 700;
      }

      .topbar__user-text {
        display: flex;
        flex-direction: column;
        line-height: 1.2;
      }

      .topbar__user-text strong {
        font-size: 12px;
        font-weight: 800;
      }

      .topbar__user-text small {
        color: var(--muted-2);
        font-size: 9.5px;
        font-weight: 700;
        letter-spacing: 0.06em;
        text-transform: uppercase;
      }

      .admin__main {
        flex: 1;
        padding: 26px 28px 48px;
      }

      @media (max-width: 1024px) {
        .sidebar {
          transform: translateX(-100%);
          transition: transform 300ms var(--ease-out);
        }
        .sidebar--open {
          transform: translateX(0);
        }
        .sidebar__close {
          display: grid;
        }
        .admin__content {
          margin-left: 0;
        }
        .topbar__burger {
          display: grid;
        }
      }

      @media (max-width: 640px) {
        .topbar {
          padding: 0 16px;
        }
        .topbar__user-text {
          display: none;
        }
        .admin__main {
          padding: 18px 14px 40px;
        }
      }
    `,
  ],
})
export class AdminLayoutComponent {
  readonly auth = inject(AuthService);
  private readonly orders = inject(OrderService);
  private readonly toast = inject(ToastService);
  private readonly router = inject(Router);

  readonly menuOpen = signal(false);
  private readonly currentUrl = signal(this.router.url);

  readonly titulo = computed(
    () => TITULOS[this.currentUrl()] ?? 'Panel de administración',
  );

  readonly inicial = computed(
    () => this.auth.perfil()?.nombre.trim().charAt(0).toUpperCase() ?? 'A',
  );

  readonly pendientes = computed(
    () =>
      this.orders
        .pedidos()
        .filter(
          (pedido) =>
            pedido.estado === 'pendiente' || pedido.estado === 'confirmado',
        ).length,
  );

  constructor() {
    this.router.events
      .pipe(filter((event) => event instanceof NavigationEnd))
      .subscribe((event) => {
        this.currentUrl.set((event as NavigationEnd).urlAfterRedirects);
      });
  }

  async cerrarSesion(): Promise<void> {
    await this.auth.logout();
    this.toast.info('Cerraste sesión correctamente.');
    await this.router.navigate(['/login']);
  }
}
