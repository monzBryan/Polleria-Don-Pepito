import {
  Component,
  computed,
  HostListener,
  inject,
  signal,
} from '@angular/core';
import { Router, RouterLink, RouterLinkActive } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { CartService } from '../../core/services/cart.service';
import { CatalogService } from '../../core/services/catalog.service';
import { SiteConfigService } from '../../core/services/site-config.service';
import { UiService } from '../../core/services/ui.service';
import { Producto } from '../../core/models';
import { SolesPipe } from '../pipes/soles.pipe';
import { ImageFallbackDirective } from '../directives/image-fallback.directive';
import { IconComponent } from './icon.component';
import { LogoComponent } from './logo.component';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [
    RouterLink,
    RouterLinkActive,
    SolesPipe,
    ImageFallbackDirective,
    IconComponent,
    LogoComponent,
  ],
  template: `
    <header class="nav" [class.nav--scrolled]="scrolled()">
      <div class="container nav__inner">
        <app-logo size="md" />

        <nav class="nav__links" aria-label="Navegación principal">
          <a
            routerLink="/"
            routerLinkActive="is-active"
            [routerLinkActiveOptions]="{ exact: true }"
          >
            Inicio
          </a>
          <a routerLink="/carta" routerLinkActive="is-active">Carta</a>
          <a routerLink="/promociones" routerLinkActive="is-active">Promociones</a>
          <a routerLink="/" fragment="nosotros">Nosotros</a>
          <a routerLink="/" fragment="contacto">Contacto</a>
        </nav>

        <div class="nav__actions">
          <button
            type="button"
            class="nav__icon"
            [class.is-active]="ui.searchOpen()"
            aria-label="Buscar en la carta"
            (click)="ui.toggleSearch()"
          >
            <app-icon name="lucideSearch" size="19" />
          </button>

          @if (auth.isAdmin()) {
            <a routerLink="/admin" class="nav__admin">
              <app-icon name="lucideLayoutDashboard" size="15" />
              <span>Panel</span>
            </a>
          }

          @if (auth.isLoggedIn()) {
            <a routerLink="/cuenta" class="nav__account">
              <span class="nav__avatar">{{ inicial() }}</span>
              <span class="nav__account-text">
                <small>Hola,</small>
                <strong>{{ primerNombre() }}</strong>
              </span>
            </a>
          } @else {
            <a routerLink="/login" class="nav__login">
              <app-icon name="lucideUser" size="17" />
              <span>Ingresar</span>
            </a>
          }

          <button
            type="button"
            class="nav__cart"
            aria-label="Abrir carrito"
            (click)="ui.openCart()"
          >
            <app-icon name="lucideShoppingBag" size="19" />
            <span class="nav__cart-label">Carrito</span>
            @if (cart.count() > 0) {
              <span class="nav__badge">{{ cart.count() }}</span>
            }
          </button>

          <button
            type="button"
            class="nav__burger"
            aria-label="Abrir menú"
            [attr.aria-expanded]="ui.mobileMenuOpen()"
            (click)="ui.toggleMobileMenu()"
          >
            <app-icon
              [name]="ui.mobileMenuOpen() ? 'lucideX' : 'lucideMenu'"
              size="22"
            />
          </button>
        </div>
      </div>

      @if (ui.searchOpen()) {
        <div class="search">
          <div class="container search__inner">
            <div class="search__box">
              <app-icon name="lucideSearch" size="21" />
              <input
                type="search"
                placeholder="Busca pollo, combos, parrillas, bebidas..."
                aria-label="Buscar productos"
                [value]="searchTerm()"
                (input)="escribir($event)"
              />
              <button
                type="button"
                class="search__close"
                aria-label="Cerrar búsqueda"
                (click)="cerrarBusqueda()"
              >
                <app-icon name="lucideX" size="18" />
              </button>
            </div>

            @if (searchTerm().trim().length >= 2) {
              @if (resultados().length > 0) {
                <div class="search__results">
                  @for (producto of resultados(); track producto.id) {
                    <button
                      type="button"
                      class="search-result"
                      (click)="verProducto(producto)"
                    >
                      <img
                        [src]="producto.imagenUrl"
                        [alt]="producto.nombre"
                        appImageFallback
                      />
                      <span class="search-result__body">
                        <strong>{{ producto.nombre }}</strong>
                        <small>{{ producto.categoriaNombre }}</small>
                      </span>
                      <span class="search-result__price">
                        {{ producto.precio | soles }}
                      </span>
                      <app-icon name="lucideArrowUpRight" size="16" />
                    </button>
                  }
                </div>
                <button type="button" class="search__all" (click)="verTodos()">
                  Ver todos los resultados
                  <app-icon name="lucideArrowRight" size="16" />
                </button>
              } @else {
                <p class="search__empty">
                  No encontramos productos para “{{ searchTerm() }}”. Prueba con otro
                  término.
                </p>
              }
            } @else {
              <div class="search__chips">
                <span>Explora:</span>
                @for (categoria of catalog.categoriasActivas().slice(0, 6); track categoria.id) {
                  <button type="button" (click)="verCategoria(categoria.slug)">
                    {{ categoria.nombre }}
                  </button>
                }
              </div>
            }
          </div>
        </div>
      }
    </header>

    @if (ui.mobileMenuOpen()) {
      <div class="mobile-overlay" (click)="ui.closeMobileMenu()"></div>
      <aside class="mobile-menu" aria-label="Menú móvil">
        <div class="mobile-menu__head">
          <app-logo size="sm" />
          <button
            type="button"
            class="nav__icon"
            aria-label="Cerrar menú"
            (click)="ui.closeMobileMenu()"
          >
            <app-icon name="lucideX" size="21" />
          </button>
        </div>

        <nav class="mobile-menu__links">
          <a routerLink="/" (click)="ui.closeMobileMenu()">
            <app-icon name="lucideHouse" size="18" />
            Inicio
          </a>
          <a routerLink="/carta" (click)="ui.closeMobileMenu()">
            <app-icon name="lucideUtensilsCrossed" size="18" />
            La carta
          </a>
          <a routerLink="/promociones" (click)="ui.closeMobileMenu()">
            <app-icon name="lucideBadgePercent" size="18" />
            Promociones
          </a>
          <a routerLink="/" fragment="nosotros" (click)="ui.closeMobileMenu()">
            <app-icon name="lucideHeartHandshake" size="18" />
            Nosotros
          </a>
          <a routerLink="/" fragment="contacto" (click)="ui.closeMobileMenu()">
            <app-icon name="lucideMapPin" size="18" />
            Contacto
          </a>
        </nav>

        <div class="mobile-menu__account">
          @if (auth.isLoggedIn()) {
            <a routerLink="/cuenta" (click)="ui.closeMobileMenu()">
              <span class="nav__avatar">{{ inicial() }}</span>
              <span>
                <small>Mi cuenta</small>
                <strong>{{ auth.perfil()?.nombre }}</strong>
              </span>
              <app-icon name="lucideChevronRight" size="17" />
            </a>
            @if (auth.isAdmin()) {
              <a routerLink="/admin" (click)="ui.closeMobileMenu()">
                <app-icon name="lucideLayoutDashboard" size="17" />
                Panel de administración
              </a>
            }
          } @else {
            <a routerLink="/login" (click)="ui.closeMobileMenu()">
              <app-icon name="lucideLogIn" size="17" />
              Iniciar sesión
            </a>
            <a routerLink="/register" (click)="ui.closeMobileMenu()">
              <app-icon name="lucideUserPlus" size="17" />
              Crear cuenta
            </a>
          }
        </div>

        <a
          class="mobile-menu__wa"
          [href]="waLink()"
          target="_blank"
          rel="noopener"
        >
          <app-icon name="brandWhatsapp" size="18" />
          Pedir por WhatsApp
        </a>
      </aside>
    }
  `,
  styles: [
    `
      :host {
        position: sticky;
        top: 0;
        z-index: var(--z-nav);
        display: block;
      }

      .nav {
        background: rgba(255, 248, 238, 0.94);
        border-bottom: 1px solid transparent;
        backdrop-filter: blur(16px);
        transition: border-color var(--transition), box-shadow var(--transition),
          background var(--transition);
      }

      .nav--scrolled {
        border-bottom-color: var(--line);
        box-shadow: 0 10px 30px rgba(10, 10, 11, 0.06);
        background: rgba(255, 253, 249, 0.97);
      }

      .nav__inner {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 20px;
        min-height: var(--header-h);
      }

      .nav__links {
        display: flex;
        align-items: center;
        gap: 4px;
      }

      .nav__links a {
        position: relative;
        padding: 10px 12px;
        border-radius: var(--radius-pill);
        color: var(--ink-muted);
        font-size: 13px;
        font-weight: 700;
        text-decoration: none;
        transition: var(--transition);
      }

      .nav__links a:hover {
        color: var(--red);
        background: var(--red-soft);
      }

      .nav__links a.is-active {
        color: var(--red);
      }

      .nav__links a.is-active::after {
        content: '';
        position: absolute;
        inset: auto 12px 2px;
        height: 2px;
        border-radius: 2px;
        background: var(--red);
      }

      .nav__actions {
        display: flex;
        align-items: center;
        gap: 6px;
      }

      .nav__icon,
      .nav__burger {
        display: grid;
        place-items: center;
        width: 38px;
        height: 38px;
        border: 0;
        border-radius: 50%;
        background: transparent;
        color: var(--ink);
        cursor: pointer;
        transition: var(--transition);
      }

      .nav__icon:hover,
      .nav__icon.is-active,
      .nav__burger:hover {
        background: var(--cream-2);
        color: var(--red);
      }

      .nav__admin,
      .nav__login {
        display: inline-flex;
        align-items: center;
        gap: 6px;
        height: 36px;
        padding: 0 13px;
        border-radius: var(--radius-pill);
        color: var(--ink);
        font-size: 12.5px;
        font-weight: 800;
        text-decoration: none;
        transition: var(--transition);
      }

      .nav__admin {
        background: var(--gold-soft);
        color: var(--gold-dark);
      }

      .nav__admin:hover {
        background: var(--gold);
        color: var(--ink);
      }

      .nav__login:hover {
        background: var(--cream-2);
        color: var(--red);
      }

      .nav__account {
        display: inline-flex;
        align-items: center;
        gap: 8px;
        padding: 4px 10px 4px 4px;
        border-radius: var(--radius-pill);
        text-decoration: none;
        color: var(--ink);
        transition: var(--transition);
      }

      .nav__account:hover {
        background: var(--cream-2);
      }

      .nav__avatar {
        display: grid;
        place-items: center;
        width: 32px;
        height: 32px;
        border-radius: 50%;
        background: var(--ink);
        color: var(--gold);
        font-family: var(--font-display);
        font-size: 14px;
        font-weight: 700;
      }

      .nav__account-text {
        display: flex;
        flex-direction: column;
        line-height: 1.05;
      }

      .nav__account-text small {
        font-size: 9.5px;
        color: var(--muted-2);
        font-weight: 700;
        letter-spacing: 0.06em;
        text-transform: uppercase;
      }

      .nav__account-text strong {
        font-size: 12.5px;
        font-weight: 800;
      }

      .nav__cart {
        position: relative;
        display: inline-flex;
        align-items: center;
        gap: 8px;
        height: 40px;
        padding: 0 15px;
        border: 0;
        border-radius: var(--radius-pill);
        background: var(--ink);
        color: var(--cream);
        font-size: 12.5px;
        font-weight: 800;
        cursor: pointer;
        transition: var(--transition);
      }

      .nav__cart:hover {
        background: var(--red);
        box-shadow: var(--shadow-red);
        transform: translateY(-1px);
      }

      .nav__badge {
        display: grid;
        place-items: center;
        min-width: 19px;
        height: 19px;
        padding: 0 5px;
        border-radius: var(--radius-pill);
        background: var(--gold);
        color: var(--ink);
        font-size: 10px;
        font-weight: 900;
      }

      .nav__burger {
        display: none;
      }

      .search {
        position: absolute;
        inset: 100% 0 auto;
        background: var(--white);
        border-bottom: 1px solid var(--line);
        box-shadow: var(--shadow);
        animation: search-in 260ms var(--ease-out) both;
      }

      .search__inner {
        padding-top: 22px;
        padding-bottom: 24px;
      }

      .search__box {
        display: flex;
        align-items: center;
        gap: 12px;
        padding: 0 18px;
        height: 58px;
        border: 1px solid var(--line-strong);
        border-radius: var(--radius-pill);
        background: var(--cream);
        color: var(--muted);
      }

      .search__box:focus-within {
        border-color: var(--red);
        box-shadow: 0 0 0 3px var(--red-soft);
      }

      .search__box input {
        flex: 1;
        min-width: 0;
        border: 0;
        outline: 0;
        background: transparent;
        color: var(--ink);
        font-family: var(--font-body);
        font-size: 15px;
        font-weight: 600;
      }

      .search__box input::placeholder {
        color: var(--muted-2);
        font-weight: 500;
      }

      .search__close {
        display: grid;
        place-items: center;
        width: 30px;
        height: 30px;
        border: 0;
        border-radius: 50%;
        background: var(--cream-2);
        color: var(--muted);
        cursor: pointer;
      }

      .search__results {
        display: grid;
        grid-template-columns: repeat(2, minmax(0, 1fr));
        gap: 8px;
        margin-top: 14px;
      }

      .search-result {
        display: grid;
        grid-template-columns: 46px 1fr auto auto;
        align-items: center;
        gap: 12px;
        padding: 8px 12px 8px 8px;
        border: 1px solid var(--line);
        border-radius: 14px;
        background: var(--white);
        text-align: left;
        cursor: pointer;
        transition: var(--transition);
      }

      .search-result:hover {
        border-color: var(--red);
        background: var(--red-soft);
      }

      .search-result img {
        width: 46px;
        height: 46px;
        border-radius: 10px;
        object-fit: cover;
        background: var(--cream-2);
      }

      .search-result__body {
        display: flex;
        flex-direction: column;
        min-width: 0;
      }

      .search-result__body strong {
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
        font-size: 12.5px;
        font-weight: 800;
      }

      .search-result__body small {
        margin-top: 2px;
        color: var(--muted);
        font-size: 10.5px;
        font-weight: 600;
      }

      .search-result__price {
        font-size: 12px;
        font-weight: 800;
        white-space: nowrap;
      }

      .search__all {
        display: inline-flex;
        align-items: center;
        gap: 6px;
        margin-top: 14px;
        border: 0;
        background: transparent;
        color: var(--red);
        font-size: 12px;
        font-weight: 800;
        cursor: pointer;
      }

      .search__empty {
        margin: 16px 0 0;
        color: var(--muted);
        font-size: 13px;
      }

      .search__chips {
        display: flex;
        flex-wrap: wrap;
        align-items: center;
        gap: 8px;
        margin-top: 16px;
      }

      .search__chips span {
        color: var(--muted-2);
        font-size: 11px;
        font-weight: 800;
        letter-spacing: 0.08em;
        text-transform: uppercase;
      }

      .search__chips button {
        padding: 7px 12px;
        border: 1px solid var(--line);
        border-radius: var(--radius-pill);
        background: var(--white);
        color: var(--ink);
        font-size: 11.5px;
        font-weight: 700;
        cursor: pointer;
        transition: var(--transition);
      }

      .search__chips button:hover {
        border-color: var(--red);
        background: var(--red-soft);
        color: var(--red);
      }

      .mobile-overlay {
        position: fixed;
        inset: 0;
        z-index: calc(var(--z-nav) - 1);
        background: rgba(10, 10, 11, 0.48);
        backdrop-filter: blur(3px);
        animation: fade-in 200ms ease both;
      }

      .mobile-menu {
        position: fixed;
        inset: 0 0 0 auto;
        z-index: var(--z-nav);
        display: flex;
        flex-direction: column;
        width: min(360px, 92vw);
        padding: 18px;
        background: var(--cream);
        box-shadow: var(--shadow-lg);
        overflow-y: auto;
        animation: menu-in 300ms var(--ease-out) both;
      }

      .mobile-menu__head {
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding-bottom: 16px;
        border-bottom: 1px solid var(--line);
      }

      .mobile-menu__links {
        display: flex;
        flex-direction: column;
        padding: 12px 0;
      }

      .mobile-menu__links a {
        display: flex;
        align-items: center;
        gap: 12px;
        padding: 13px 8px;
        border-radius: 10px;
        color: var(--ink);
        font-size: 14px;
        font-weight: 700;
        text-decoration: none;
      }

      .mobile-menu__links a:hover {
        background: var(--cream-2);
        color: var(--red);
      }

      .mobile-menu__account {
        display: flex;
        flex-direction: column;
        gap: 4px;
        padding: 14px 0;
        border-top: 1px solid var(--line);
      }

      .mobile-menu__account a {
        display: flex;
        align-items: center;
        gap: 10px;
        padding: 10px 8px;
        border-radius: 10px;
        color: var(--ink);
        font-size: 12.5px;
        font-weight: 700;
        text-decoration: none;
      }

      .mobile-menu__account a:hover {
        background: var(--cream-2);
      }

      .mobile-menu__account a > span:not(.nav__avatar) {
        display: flex;
        flex-direction: column;
        flex: 1;
        min-width: 0;
      }

      .mobile-menu__account small {
        color: var(--muted-2);
        font-size: 9.5px;
        text-transform: uppercase;
        letter-spacing: 0.08em;
      }

      .mobile-menu__account strong {
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
        font-size: 12.5px;
      }

      .mobile-menu__wa {
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 9px;
        margin-top: auto;
        padding: 14px;
        border-radius: var(--radius-pill);
        background: #1f7a4d;
        color: var(--white);
        font-size: 13px;
        font-weight: 800;
        text-decoration: none;
      }

      @keyframes search-in {
        from {
          opacity: 0;
          transform: translateY(-8px);
        }
        to {
          opacity: 1;
          transform: translateY(0);
        }
      }

      @keyframes menu-in {
        from {
          transform: translateX(100%);
        }
        to {
          transform: translateX(0);
        }
      }

      @keyframes fade-in {
        from {
          opacity: 0;
        }
        to {
          opacity: 1;
        }
      }

      @media (max-width: 1024px) {
        .nav__links {
          display: none;
        }
        .nav__burger {
          display: grid;
        }
        .nav__account-text,
        .nav__cart-label {
          display: none;
        }
        .nav__cart {
          width: 40px;
          padding: 0;
          justify-content: center;
        }
        .nav__badge {
          position: absolute;
          top: -5px;
          right: -5px;
        }
      }

      @media (max-width: 640px) {
        .nav__inner {
          min-height: 66px;
          gap: 10px;
        }
        .nav__login span,
        .nav__admin span {
          display: none;
        }
        .nav__login,
        .nav__admin {
          width: 36px;
          padding: 0;
          justify-content: center;
        }
        .search__results {
          grid-template-columns: 1fr;
        }
        .search__inner {
          padding-top: 16px;
          padding-bottom: 18px;
        }
      }
    `,
  ],
})
export class NavbarComponent {
  readonly auth = inject(AuthService);
  readonly cart = inject(CartService);
  readonly catalog = inject(CatalogService);
  readonly ui = inject(UiService);
  private readonly site = inject(SiteConfigService);
  private readonly router = inject(Router);

  readonly scrolled = signal(false);
  readonly searchTerm = signal('');

  readonly resultados = computed(() => {
    const term = this.searchTerm().trim();
    return term.length >= 2 ? this.catalog.buscar(term).slice(0, 5) : [];
  });

  readonly inicial = computed(() => {
    const nombre = this.auth.perfil()?.nombre ?? '';
    return nombre.trim().charAt(0).toUpperCase() || 'P';
  });

  readonly primerNombre = computed(() => {
    const nombre = this.auth.perfil()?.nombre ?? '';
    return nombre.trim().split(/\s+/)[0] || 'Mi cuenta';
  });

  readonly waLink = computed(() =>
    this.site.whatsappLink('Hola Don Pepito, quiero hacer un pedido.'),
  );

  @HostListener('window:scroll')
  onScroll(): void {
    this.scrolled.set(window.scrollY > 8);
  }

  escribir(event: Event): void {
    const input = event.target as HTMLInputElement;
    this.searchTerm.set(input.value);
  }

  verProducto(producto: Producto): void {
    this.ui.closeSearch();
    this.searchTerm.set('');
    void this.router.navigate(['/carta'], {
      queryParams: { q: producto.nombre },
    });
  }

  verTodos(): void {
    const term = this.searchTerm().trim();
    this.ui.closeSearch();
    this.searchTerm.set('');
    void this.router.navigate(['/carta'], {
      queryParams: term ? { q: term } : {},
    });
  }

  verCategoria(slug: string): void {
    this.ui.closeSearch();
    this.searchTerm.set('');
    void this.router.navigate(['/carta'], {
      queryParams: { categoria: slug },
    });
  }

  cerrarBusqueda(): void {
    this.ui.closeSearch();
    this.searchTerm.set('');
  }
}
