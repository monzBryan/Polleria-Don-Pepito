import {
  Component,
  computed,
  inject,
  signal,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { CatalogService } from '../../core/services/catalog.service';
import { Producto } from '../../core/models';
import { ProductCardComponent } from '../../shared/components/product-card.component';
import { EmptyStateComponent } from '../../shared/components/empty-state.component';
import { IconComponent } from '../../shared/components/icon.component';

type OrdenCarta = 'populares' | 'precio_asc' | 'precio_desc' | 'nuevos';

@Component({
  selector: 'app-menu-page',
  standalone: true,
  imports: [
    RouterLink,
    ProductCardComponent,
    EmptyStateComponent,
    IconComponent,
  ],
  template: `
    <section class="menu-hero">
      <div class="container menu-hero__inner">
        <nav class="crumbs" aria-label="Ruta de navegación">
          <a routerLink="/">Inicio</a>
          <app-icon name="lucideChevronRight" size="13" />
          <span>La carta</span>
        </nav>

        <div class="menu-hero__grid">
          <div>
            <span class="eyebrow">Hecho al carbón, todos los días</span>
            <h1 class="display display--sm">Nuestra carta</h1>
          </div>
          <p class="menu-hero__lead">
            Pollos, combos, parrillas y criollos. Elige tu antojo, nosotros lo
            preparamos al momento y lo llevamos hasta tu mesa.
          </p>
        </div>

        <div class="menu-search">
          <app-icon name="lucideSearch" size="20" />
          <input
            type="search"
            placeholder="Busca tu plato favorito..."
            aria-label="Buscar en la carta"
            [value]="busqueda()"
            (input)="escribir($event)"
          />
          @if (busqueda()) {
            <button
              type="button"
              class="menu-search__clear"
              aria-label="Limpiar búsqueda"
              (click)="limpiarBusqueda()"
            >
              <app-icon name="lucideX" size="16" />
            </button>
          }
        </div>
      </div>
    </section>

    <div class="filters">
      <div class="container filters__inner">
        <div class="filters__chips">
          <button
            type="button"
            class="chip"
            [class.is-active]="categoriaActiva() === 'todos'"
            (click)="setCategoria('todos')"
          >
            <app-icon name="lucideUtensils" size="14" />
            Todo
          </button>
          @for (categoria of categorias(); track categoria.id) {
            <button
              type="button"
              class="chip"
              [class.is-active]="categoriaActiva() === categoria.slug"
              (click)="setCategoria(categoria.slug)"
            >
              <app-icon [name]="categoria.icono" size="14" />
              {{ categoria.nombre }}
              <span class="filters__count">{{ categoria.total }}</span>
            </button>
          }
        </div>

        <label class="filters__sort">
          <span>Ordenar</span>
          <select
            class="select"
            [value]="orden()"
            (change)="cambiarOrden($event)"
            aria-label="Ordenar productos"
          >
            <option value="populares">Más pedidos</option>
            <option value="nuevos">Novedades</option>
            <option value="precio_asc">Menor precio</option>
            <option value="precio_desc">Mayor precio</option>
          </select>
        </label>
      </div>
    </div>

    <section class="section menu-list">
      <div class="container">
        <div class="menu-list__head">
          <p>
            <strong>{{ productos().length }}</strong>
            {{ productos().length === 1 ? 'plato encontrado' : 'platos encontrados' }}
            @if (categoriaActiva() !== 'todos') {
              en <span>{{ nombreCategoriaActiva() }}</span>
            }
          </p>
          @if (hayFiltros()) {
            <button type="button" class="menu-list__reset" (click)="limpiarTodo()">
              Limpiar filtros
              <app-icon name="lucideX" size="14" />
            </button>
          }
        </div>

        @if (productos().length > 0) {
          <div class="menu-grid">
            @for (producto of productos(); track producto.id) {
              <app-product-card [producto]="producto" />
            }
          </div>
        } @else {
          <app-empty-state
            icon="lucideSearchX"
            title="No encontramos ese antojo"
            message="Prueba con otra palabra o revisa todas nuestras categorías. Seguro algo rico te espera."
            actionLabel="Ver toda la carta"
            (action)="limpiarTodo()"
          />
        }
      </div>
    </section>

    <section class="menu-help">
      <div class="container menu-help__inner">
        <div>
          <span class="eyebrow">¿No sabes qué pedir?</span>
          <h2 class="section-title">Déjate guiar por el favorito de la casa.</h2>
          <p>
            El combo familiar es el más pedido: pollo entero, papas, ensalada,
            chicha morada y salsas para compartir.
          </p>
        </div>
        <a routerLink="/carta" [queryParams]="{ categoria: 'combos' }" class="btn btn--gold">
          Ver combos
          <app-icon name="lucideArrowRight" size="16" />
        </a>
      </div>
    </section>
  `,
  styles: [
    `
      .menu-hero {
        position: relative;
        padding: clamp(36px, 5vw, 62px) 0 clamp(30px, 4vw, 46px);
        background:
          radial-gradient(circle at 90% 0%, rgba(232, 181, 77, 0.18), transparent 34%),
          radial-gradient(circle at 6% 100%, rgba(200, 16, 46, 0.08), transparent 30%),
          var(--cream);
        overflow: hidden;
      }

      .menu-hero::after {
        content: 'CARTA';
        position: absolute;
        right: -20px;
        bottom: -46px;
        color: rgba(10, 10, 11, 0.035);
        font-family: var(--font-display);
        font-size: clamp(100px, 18vw, 220px);
        font-weight: 600;
        letter-spacing: -0.06em;
        line-height: 1;
        pointer-events: none;
      }

      .crumbs {
        position: relative;
        z-index: 1;
        display: flex;
        align-items: center;
        gap: 6px;
        margin-bottom: 22px;
        color: var(--muted-2);
        font-size: 11px;
        font-weight: 700;
      }

      .crumbs a:hover {
        color: var(--red);
      }

      .crumbs span {
        color: var(--ink);
      }

      .menu-hero__grid {
        position: relative;
        z-index: 1;
        display: grid;
        grid-template-columns: 1fr 0.9fr;
        align-items: end;
        gap: 30px;
      }

      .menu-hero__lead {
        max-width: 44ch;
        padding-bottom: 6px;
        color: var(--muted);
        font-size: 13.5px;
        line-height: 1.7;
      }

      .menu-search {
        position: relative;
        z-index: 1;
        display: flex;
        align-items: center;
        gap: 11px;
        width: min(560px, 100%);
        height: 56px;
        margin-top: 28px;
        padding: 0 18px;
        border: 1px solid var(--line-strong);
        border-radius: var(--radius-pill);
        background: var(--white);
        color: var(--muted);
        box-shadow: var(--shadow-sm);
      }

      .menu-search:focus-within {
        border-color: var(--red);
        box-shadow: 0 0 0 4px rgba(200, 16, 46, 0.08);
      }

      .menu-search input {
        flex: 1;
        min-width: 0;
        border: 0;
        outline: 0;
        background: transparent;
        color: var(--ink);
        font-size: 14px;
        font-weight: 600;
      }

      .menu-search__clear {
        display: grid;
        place-items: center;
        width: 28px;
        height: 28px;
        border: 0;
        border-radius: 50%;
        background: var(--cream-2);
        color: var(--muted);
        cursor: pointer;
      }

      .filters {
        position: sticky;
        top: var(--header-h);
        z-index: 30;
        border-block: 1px solid var(--line);
        background: rgba(255, 248, 238, 0.94);
        backdrop-filter: blur(14px);
      }

      .filters__inner {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 16px;
        padding-block: 12px;
      }

      .filters__chips {
        display: flex;
        gap: 7px;
        overflow-x: auto;
        scrollbar-width: none;
      }

      .filters__chips::-webkit-scrollbar {
        display: none;
      }

      .filters__chips .chip {
        flex: none;
      }

      .filters__count {
        display: grid;
        place-items: center;
        min-width: 17px;
        height: 17px;
        padding: 0 4px;
        border-radius: var(--radius-pill);
        background: rgba(10, 10, 11, 0.07);
        font-size: 8.5px;
        font-weight: 900;
      }

      .filters__chips .chip.is-active .filters__count {
        background: rgba(255, 255, 255, 0.18);
      }

      .filters__sort {
        display: flex;
        align-items: center;
        gap: 8px;
        flex: none;
      }

      .filters__sort span {
        color: var(--muted-2);
        font-size: 9px;
        font-weight: 900;
        letter-spacing: 0.1em;
        text-transform: uppercase;
      }

      .filters__sort .select {
        width: auto;
        min-height: 38px;
        padding: 0 30px 0 12px;
        border-radius: var(--radius-pill);
        font-size: 11px;
        font-weight: 700;
      }

      .menu-list {
        padding-top: clamp(30px, 4vw, 48px);
      }

      .menu-list__head {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 14px;
        margin-bottom: 22px;
      }

      .menu-list__head p {
        color: var(--muted);
        font-size: 12px;
      }

      .menu-list__head strong {
        color: var(--ink);
        font-size: 15px;
      }

      .menu-list__head p span {
        color: var(--red);
        font-weight: 800;
      }

      .menu-list__reset {
        display: inline-flex;
        align-items: center;
        gap: 5px;
        border: 0;
        background: transparent;
        color: var(--red);
        font-size: 11px;
        font-weight: 800;
        cursor: pointer;
      }

      .menu-grid {
        display: grid;
        grid-template-columns: repeat(3, minmax(0, 1fr));
        gap: 18px;
      }

      .menu-help {
        padding: 0 0 clamp(48px, 6vw, 76px);
      }

      .menu-help__inner {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 26px;
        padding: clamp(28px, 4vw, 44px);
        border-radius: var(--radius-lg);
        background:
          radial-gradient(circle at 88% 10%, rgba(232, 181, 77, 0.22), transparent 34%),
          var(--ink);
        color: var(--cream);
      }

      .menu-help__inner h2 {
        max-width: 24ch;
        font-size: clamp(24px, 3.4vw, 34px);
      }

      .menu-help__inner p {
        max-width: 58ch;
        margin-top: 10px;
        color: rgba(255, 248, 238, 0.58);
        font-size: 12.5px;
        line-height: 1.65;
      }

      @media (max-width: 1024px) {
        .menu-grid {
          grid-template-columns: repeat(2, minmax(0, 1fr));
        }
      }

      @media (max-width: 760px) {
        .menu-hero__grid {
          grid-template-columns: 1fr;
          gap: 14px;
        }
        .filters__inner {
          flex-direction: column;
          align-items: stretch;
        }
        .filters__sort {
          justify-content: space-between;
        }
        .menu-help__inner {
          flex-direction: column;
          align-items: flex-start;
        }
      }

      @media (max-width: 560px) {
        .menu-grid {
          grid-template-columns: 1fr;
        }
        .menu-list__head {
          flex-direction: column;
          align-items: flex-start;
        }
      }
    `,
  ],
})
export class MenuPageComponent {
  private readonly catalog = inject(CatalogService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);

  readonly categoriaActiva = signal(
    this.route.snapshot.queryParamMap.get('categoria') ?? 'todos',
  );
  readonly busqueda = signal(this.route.snapshot.queryParamMap.get('q') ?? '');
  readonly orden = signal<OrdenCarta>('populares');

  readonly categorias = computed(() =>
    this.catalog.categoriasActivas().map((categoria) => ({
      ...categoria,
      total: this.catalog
        .productosActivos()
        .filter((producto) => producto.categoriaId === categoria.id).length,
    })),
  );

  readonly productos = computed<Producto[]>(() => {
    const categoria = this.categoriaActiva();
    const term = this.busqueda().trim().toLowerCase();
    let lista = this.catalog.productosActivos();

    if (categoria !== 'todos') {
      lista = lista.filter((producto) => producto.categoriaSlug === categoria);
    }
    if (term) {
      lista = lista.filter((producto) =>
        `${producto.nombre} ${producto.descripcion} ${producto.categoriaNombre}`
          .toLowerCase()
          .includes(term),
      );
    }

    const orden = this.orden();
    if (orden === 'precio_asc') {
      lista = [...lista].sort((a, b) => a.precio - b.precio);
    } else if (orden === 'precio_desc') {
      lista = [...lista].sort((a, b) => b.precio - a.precio);
    } else if (orden === 'nuevos') {
      lista = [...lista].sort((a, b) => Number(b.esNuevo) - Number(a.esNuevo));
    } else {
      lista = [...lista].sort((a, b) => b.ventas - a.ventas);
    }

    return lista;
  });

  readonly nombreCategoriaActiva = computed(
    () =>
      this.categorias().find(
        (categoria) => categoria.slug === this.categoriaActiva(),
      )?.nombre ?? '',
  );

  readonly hayFiltros = computed(
    () =>
      this.categoriaActiva() !== 'todos' ||
      this.busqueda().trim().length > 0,
  );

  constructor() {
    this.route.queryParamMap
      .pipe(takeUntilDestroyed())
      .subscribe((params) => {
        const q = params.get('q') ?? '';
        const categoria = params.get('categoria') ?? 'todos';
        if (q !== this.busqueda()) this.busqueda.set(q);
        if (categoria !== this.categoriaActiva()) this.categoriaActiva.set(categoria);
      });
  }

  escribir(event: Event): void {
    const input = event.target as HTMLInputElement;
    this.busqueda.set(input.value);
  }

  limpiarBusqueda(): void {
    this.busqueda.set('');
    void this.router.navigate([], {
      relativeTo: this.route,
      queryParams: { q: null },
      queryParamsHandling: 'merge',
      replaceUrl: true,
    });
  }

  setCategoria(slug: string): void {
    this.categoriaActiva.set(slug);
    void this.router.navigate([], {
      relativeTo: this.route,
      queryParams: { categoria: slug === 'todos' ? null : slug },
      queryParamsHandling: 'merge',
      replaceUrl: true,
    });
  }

  cambiarOrden(event: Event): void {
    const value = (event.target as HTMLSelectElement).value as OrdenCarta;
    this.orden.set(value);
  }

  limpiarTodo(): void {
    this.busqueda.set('');
    this.categoriaActiva.set('todos');
    void this.router.navigate([], {
      relativeTo: this.route,
      queryParams: { q: null, categoria: null },
      replaceUrl: true,
    });
  }
}
