import { Component, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { CategoriaProducto, Producto } from '../../../core/models';
import { CatalogService } from '../../../core/services/catalog.service';
import { ToastService } from '../../../core/services/toast.service';
import { IconComponent } from '../../../shared/components/icon.component';
import { ModalComponent } from '../../../shared/components/modal.component';
import { ImageFallbackDirective } from '../../../shared/directives/image-fallback.directive';
import { SolesPipe } from '../../../shared/pipes/soles.pipe';

type EstadoFiltro = 'todos' | 'activos' | 'inactivos';

function productoVacio(categoria?: CategoriaProducto): Producto {
  return {
    id: 0,
    codigo: '',
    categoriaId: categoria?.id ?? 0,
    categoriaSlug: categoria?.slug ?? '',
    categoriaNombre: categoria?.nombre ?? '',
    nombre: '',
    descripcion: '',
    precio: 0,
    imagenUrl: '',
    activo: true,
    destacado: false,
    esNuevo: true,
    nivelPicante: 0,
    tiempoPreparacion: 15,
    ventas: 0,
    etiquetas: [],
  };
}

@Component({
  selector: 'app-admin-products',
  standalone: true,
  imports: [
    RouterLink,
    IconComponent,
    ModalComponent,
    ImageFallbackDirective,
    SolesPipe,
  ],
  template: `
    <div class="admin-page">
      <div class="page-head">
        <div class="page-head__info">
          <span class="eyebrow">Catálogo</span>
          <h1>Productos</h1>
          <p>Crea, edita y controla la disponibilidad de tu carta.</p>
        </div>
        <div class="page-head__actions">
          <a routerLink="/carta" class="btn btn--outline btn--sm">
            <app-icon name="lucideExternalLink" size="15" />
            Ver carta
          </a>
          <button type="button" class="btn btn--primary btn--sm" (click)="nuevo()">
            <app-icon name="lucidePlus" size="15" />
            Nuevo producto
          </button>
        </div>
      </div>

      <div class="product-stats">
        <div>
          <span class="product-stats__icon"><app-icon name="lucidePackage" size="18" /></span>
          <div><small>Total</small><strong>{{ productos().length }}</strong></div>
        </div>
        <div>
          <span class="product-stats__icon product-stats__icon--green">
            <app-icon name="lucideCheckCircle2" size="18" />
          </span>
          <div><small>Activos</small><strong>{{ activos() }}</strong></div>
        </div>
        <div>
          <span class="product-stats__icon product-stats__icon--gold">
            <app-icon name="lucideStar" size="18" />
          </span>
          <div><small>Destacados</small><strong>{{ destacados() }}</strong></div>
        </div>
      </div>

      <section class="admin-panel">
        <div class="products-toolbar">
          <div class="admin-search">
            <app-icon name="lucideSearch" size="15" />
            <input
              class="input"
              type="search"
              placeholder="Buscar producto"
              [value]="busqueda()"
              (input)="busqueda.set($any($event.target).value)"
            />
          </div>
          <select
            class="input"
            [value]="categoriaFiltro()"
            (change)="categoriaFiltro.set($any($event.target).value)"
            aria-label="Filtrar por categoría"
          >
            <option value="todas">Todas las categorías</option>
            @for (categoria of categorias(); track categoria.id) {
              <option [value]="categoria.id">{{ categoria.nombre }}</option>
            }
          </select>
          <div class="admin-tabs">
            @for (item of filtros; track item.id) {
              <button
                type="button"
                [class.is-active]="estadoFiltro() === item.id"
                (click)="estadoFiltro.set(item.id)"
              >
                {{ item.label }}
              </button>
            }
          </div>
        </div>

        <div class="table-wrap">
          @if (filtrados().length === 0) {
            <div class="admin-empty">
              <app-icon name="lucidePackageSearch" size="30" />
              <p>No encontramos productos con esos filtros.</p>
            </div>
          } @else {
            <table class="data-table">
              <thead>
                <tr>
                  <th>Producto</th>
                  <th>Categoría</th>
                  <th>Precio</th>
                  <th class="is-center">Destacado</th>
                  <th class="is-center">Estado</th>
                  <th class="is-right">Acciones</th>
                </tr>
              </thead>
              <tbody>
                @for (producto of filtrados(); track producto.id) {
                  <tr>
                    <td>
                      <div class="cell-product">
                        <img
                          [src]="producto.imagenUrl"
                          [alt]="producto.nombre"
                          appImageFallback="/img/fallback-food.svg"
                        />
                        <div class="cell-product__text">
                          <strong>{{ producto.nombre }}</strong>
                          <small>{{ producto.codigo || 'Sin código' }} · {{ producto.tiempoPreparacion }} min</small>
                        </div>
                      </div>
                    </td>
                    <td>
                      <span class="badge-soft">{{ producto.categoriaNombre || 'Sin categoría' }}</span>
                    </td>
                    <td>
                      <strong>{{ producto.precio | soles }}</strong>
                      @if (producto.precioAnterior) {
                        <small class="old-price">{{ producto.precioAnterior | soles }}</small>
                      }
                    </td>
                    <td class="is-center">
                      <button
                        type="button"
                        class="star-btn"
                        [class.is-on]="producto.destacado"
                        [attr.aria-label]="producto.destacado ? 'Quitar de destacados' : 'Marcar como destacado'"
                        (click)="toggleDestacado(producto)"
                      >
                        <app-icon name="lucideStar" size="15" />
                      </button>
                    </td>
                    <td class="is-center">
                      <label class="admin-toggle" [attr.aria-label]="producto.activo ? 'Desactivar' : 'Activar'">
                        <input
                          type="checkbox"
                          [checked]="producto.activo"
                          (change)="toggleActivo(producto)"
                        />
                        <span></span>
                      </label>
                    </td>
                    <td>
                      <div class="cell-actions">
                        <button
                          type="button"
                          aria-label="Editar producto"
                          title="Editar"
                          (click)="editar(producto)"
                        >
                          <app-icon name="lucidePencil" size="14" />
                        </button>
                        <button
                          type="button"
                          class="is-danger"
                          aria-label="Eliminar producto"
                          title="Eliminar"
                          (click)="confirmarEliminar.set(producto)"
                        >
                          <app-icon name="lucideTrash2" size="14" />
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
      [open]="formOpen()"
      [eyebrow]="form().id > 0 ? 'Editar producto' : 'Nuevo producto'"
      [title]="form().id > 0 ? form().nombre : 'Agregar a la carta'"
      size="lg"
      (closed)="cerrarForm()"
    >
      <form class="admin-form" (submit)="guardar($event)">
        <div class="form-grid">
          <label class="field">
            <span class="field-label">Nombre del producto *</span>
            <input
              class="input"
              type="text"
              [value]="form().nombre"
              (input)="setCampo('nombre', $any($event.target).value)"
              placeholder="Ej. Pollo a la brasa 1/4"
            />
          </label>
          <label class="field">
            <span class="field-label">Código interno</span>
            <input
              class="input"
              type="text"
              [value]="form().codigo"
              (input)="setCampo('codigo', $any($event.target).value)"
              placeholder="Ej. PAB-001"
            />
          </label>
        </div>

        <label class="field">
          <span class="field-label">Descripción</span>
          <textarea
            class="textarea"
            rows="2"
            [value]="form().descripcion"
            (input)="setCampo('descripcion', $any($event.target).value)"
            placeholder="Ingredientes, acompañamientos o detalle del producto"
          ></textarea>
        </label>

        <div class="form-grid form-grid--three">
          <label class="field">
            <span class="field-label">Categoría *</span>
            <select
              class="input"
              [value]="form().categoriaId"
              (change)="setCategoria($any($event.target).value)"
            >
              @for (categoria of categorias(); track categoria.id) {
                <option [value]="categoria.id">{{ categoria.nombre }}</option>
              }
            </select>
          </label>
          <label class="field">
            <span class="field-label">Precio (S/) *</span>
            <input
              class="input"
              type="number"
              min="0"
              step="0.1"
              [value]="form().precio"
              (input)="setNumero('precio', $any($event.target).value)"
            />
          </label>
          <label class="field">
            <span class="field-label">Precio anterior (S/)</span>
            <input
              class="input"
              type="number"
              min="0"
              step="0.1"
              [value]="form().precioAnterior ?? ''"
              (input)="setNumero('precioAnterior', $any($event.target).value)"
            />
          </label>
        </div>

        <div class="form-grid">
          <label class="field">
            <span class="field-label">URL de imagen</span>
            <input
              class="input"
              type="url"
              [value]="form().imagenUrl"
              (input)="setCampo('imagenUrl', $any($event.target).value)"
              placeholder="https://..."
            />
          </label>
          <label class="field">
            <span class="field-label">Tiempo de preparación (min)</span>
            <input
              class="input"
              type="number"
              min="0"
              max="180"
              [value]="form().tiempoPreparacion"
              (input)="setNumero('tiempoPreparacion', $any($event.target).value)"
            />
          </label>
        </div>

        @if (form().imagenUrl) {
          <div class="image-preview">
            <img
              [src]="form().imagenUrl"
              [alt]="form().nombre || 'Vista previa'"
              appImageFallback="/img/fallback-food.svg"
            />
            <div>
              <strong>Vista previa</strong>
              <p>Así se verá en la carta y en el carrito.</p>
            </div>
          </div>
        }

        <div class="form-grid form-grid--three">
          <label class="field">
            <span class="field-label">Nivel de picante (0-3)</span>
            <select
              class="input"
              [value]="form().nivelPicante"
              (change)="setNumero('nivelPicante', $any($event.target).value)"
            >
              <option [value]="0">Sin picante</option>
              <option [value]="1">Suave</option>
              <option [value]="2">Medio</option>
              <option [value]="3">Picante</option>
            </select>
          </label>
          <label class="admin-form__check">
            <input
              type="checkbox"
              [checked]="form().destacado"
              (change)="setBoolean('destacado', $any($event.target).checked)"
            />
            Destacado en inicio
          </label>
          <label class="admin-form__check">
            <input
              type="checkbox"
              [checked]="form().esNuevo"
              (change)="setBoolean('esNuevo', $any($event.target).checked)"
            />
            Marcar como nuevo
          </label>
        </div>

        <label class="admin-form__check">
          <input
            type="checkbox"
            [checked]="form().activo"
            (change)="setBoolean('activo', $any($event.target).checked)"
          />
          Disponible para pedidos
        </label>

        <div class="admin-note">
          <app-icon name="lucideInfo" size="14" />
          <p>
            Los cambios se aplican de inmediato en la carta. Si desactivas un producto,
            dejará de mostrarse a los clientes, pero conservará su historial de ventas.
          </p>
        </div>

        <div class="admin-form__actions">
          <button type="button" class="btn btn--ghost btn--sm" (click)="cerrarForm()">
            Cancelar
          </button>
          <button type="submit" class="btn btn--primary btn--sm" [disabled]="guardando()">
            @if (guardando()) {
              <app-icon name="lucideLoaderCircle" size="15" class="spin" />
              Guardando...
            } @else {
              <app-icon name="lucideSave" size="15" />
              Guardar producto
            }
          </button>
        </div>
      </form>
    </app-modal>

    <app-modal
      [open]="confirmarEliminar() !== null"
      eyebrow="Eliminar producto"
      title="¿Quitar de la carta?"
      size="sm"
      (closed)="confirmarEliminar.set(null)"
    >
      @if (confirmarEliminar(); as producto) {
        <p class="confirm-text">
          <strong>{{ producto.nombre }}</strong> dejará de estar disponible para nuevos
          pedidos. Su historial se conservará.
        </p>
        <div class="admin-form__actions">
          <button type="button" class="btn btn--ghost btn--sm" (click)="confirmarEliminar.set(null)">
            Cancelar
          </button>
          <button type="button" class="btn btn--danger btn--sm" (click)="eliminar(producto)">
            Sí, quitar
          </button>
        </div>
      }
    </app-modal>
  `,
  styles: [
    `
      .product-stats {
        display: grid;
        grid-template-columns: repeat(3, 1fr);
        gap: 10px;
      }

      .product-stats > div {
        display: flex;
        align-items: center;
        gap: 10px;
        padding: 12px 14px;
        border: 1px solid rgba(10, 10, 11, 0.08);
        border-radius: 12px;
        background: var(--white);
      }

      .product-stats__icon {
        display: grid;
        place-items: center;
        width: 34px;
        height: 34px;
        border-radius: 9px;
        background: var(--cream-2);
        color: var(--ink);
      }

      .product-stats__icon--green {
        background: var(--success-soft);
        color: var(--success);
      }

      .product-stats__icon--gold {
        background: var(--gold-soft);
        color: var(--gold-dark);
      }

      .product-stats small {
        display: block;
        color: var(--muted-2);
        font-size: 8px;
        font-weight: 900;
        letter-spacing: 0.08em;
        text-transform: uppercase;
      }

      .product-stats strong {
        font-family: var(--font-display);
        font-size: 20px;
        font-weight: 600;
        line-height: 1.1;
      }

      .products-toolbar {
        display: flex;
        align-items: center;
        gap: 8px;
        flex-wrap: wrap;
        padding: 13px 16px;
        border-bottom: 1px solid var(--line);
      }

      .products-toolbar .admin-search {
        max-width: 280px;
      }

      .products-toolbar select {
        width: auto;
        min-height: 40px;
        font-size: 10.5px;
        font-weight: 700;
      }

      .products-toolbar .admin-tabs {
        margin-left: auto;
      }

      .old-price {
        text-decoration: line-through;
      }

      .star-btn {
        display: inline-grid;
        place-items: center;
        width: 28px;
        height: 28px;
        border: 0;
        border-radius: 7px;
        background: transparent;
        color: var(--line-strong);
        cursor: pointer;
        transition: var(--transition);
      }

      .star-btn:hover,
      .star-btn.is-on {
        background: var(--gold-soft);
        color: var(--gold-dark);
      }

      .star-btn.is-on app-icon {
        fill: currentColor;
      }

      .image-preview {
        display: flex;
        align-items: center;
        gap: 10px;
        padding: 9px;
        border: 1px dashed var(--line-strong);
        border-radius: 10px;
      }

      .image-preview img {
        width: 58px;
        height: 58px;
        border-radius: 8px;
        object-fit: cover;
        background: var(--cream-2);
      }

      .image-preview strong {
        display: block;
        font-size: 10px;
      }

      .image-preview p {
        color: var(--muted);
        font-size: 8.5px;
      }

      .confirm-text {
        color: var(--muted);
        font-size: 11px;
        line-height: 1.65;
      }

      .confirm-text strong {
        color: var(--ink);
      }

      @media (max-width: 900px) {
        .products-toolbar .admin-tabs {
          width: 100%;
          margin-left: 0;
        }
        .product-stats {
          grid-template-columns: 1fr 1fr 1fr;
        }
      }

      @media (max-width: 560px) {
        .product-stats {
          grid-template-columns: 1fr;
        }
        .products-toolbar .admin-search {
          max-width: none;
          width: 100%;
        }
      }
    `,
  ],
})
export class AdminProductsPageComponent {
  private readonly catalog = inject(CatalogService);
  private readonly toast = inject(ToastService);

  readonly productos = this.catalog.productos;
  readonly categorias = this.catalog.categorias;

  readonly busqueda = signal('');
  readonly categoriaFiltro = signal('todas');
  readonly estadoFiltro = signal<EstadoFiltro>('todos');
  readonly formOpen = signal(false);
  readonly form = signal<Producto>(productoVacio());
  readonly guardando = signal(false);
  readonly confirmarEliminar = signal<Producto | null>(null);

  readonly filtros = [
    { id: 'todos', label: 'Todos' },
    { id: 'activos', label: 'Activos' },
    { id: 'inactivos', label: 'Inactivos' },
  ] as const;

  readonly activos = computed(
    () => this.productos().filter((producto) => producto.activo).length,
  );

  readonly destacados = computed(
    () => this.productos().filter((producto) => producto.destacado).length,
  );

  readonly filtrados = computed(() => {
    const term = this.busqueda().trim().toLowerCase();
    const categoria = this.categoriaFiltro();
    const estado = this.estadoFiltro();
    return this.productos().filter((producto) => {
      if (categoria !== 'todas' && producto.categoriaId !== Number(categoria)) return false;
      if (estado === 'activos' && !producto.activo) return false;
      if (estado === 'inactivos' && producto.activo) return false;
      if (!term) return true;
      return `${producto.nombre} ${producto.descripcion} ${producto.codigo}`
        .toLowerCase()
        .includes(term);
    });
  });

  nuevo(): void {
    this.form.set(productoVacio(this.categorias()[0]));
    this.formOpen.set(true);
  }

  editar(producto: Producto): void {
    this.form.set({ ...producto });
    this.formOpen.set(true);
  }

  cerrarForm(): void {
    this.formOpen.set(false);
  }

  setCampo(
    campo: 'nombre' | 'codigo' | 'descripcion' | 'imagenUrl',
    value: string,
  ): void {
    this.form.update((producto) => ({ ...producto, [campo]: value }));
  }

  setNumero(
    campo: 'precio' | 'precioAnterior' | 'nivelPicante' | 'tiempoPreparacion',
    value: string,
  ): void {
    const numero = Number(value);
    this.form.update((producto) => ({
      ...producto,
      [campo]:
        campo === 'precioAnterior'
          ? numero > 0
            ? numero
            : undefined
          : Math.max(0, numero || 0),
    }));
  }

  setCategoria(value: string): void {
    const categoria = this.categorias().find((item) => item.id === Number(value));
    if (!categoria) return;
    this.form.update((producto) => ({
      ...producto,
      categoriaId: categoria.id,
      categoriaSlug: categoria.slug,
      categoriaNombre: categoria.nombre,
    }));
  }

  setBoolean(
    campo: 'activo' | 'destacado' | 'esNuevo',
    value: boolean,
  ): void {
    this.form.update((producto) => ({ ...producto, [campo]: value }));
  }

  async guardar(event?: Event): Promise<void> {
    event?.preventDefault();
    const form = this.form();
    if (form.nombre.trim().length < 2) {
      this.toast.warning('Ingresa el nombre del producto.');
      return;
    }
    if (!form.categoriaId) {
      this.toast.warning('Selecciona una categoría.');
      return;
    }
    if (form.precio <= 0) {
      this.toast.warning('El precio debe ser mayor que cero.');
      return;
    }

    const categoria = this.categorias().find((item) => item.id === form.categoriaId);
    const precioAnterior =
      form.precioAnterior && form.precioAnterior > form.precio
        ? form.precioAnterior
        : undefined;
    const producto: Producto = {
      ...form,
      nombre: form.nombre.trim(),
      codigo: form.codigo.trim(),
      descripcion: form.descripcion.trim(),
      imagenUrl: form.imagenUrl.trim(),
      categoriaSlug: categoria?.slug ?? form.categoriaSlug,
      categoriaNombre: categoria?.nombre ?? form.categoriaNombre,
      precioAnterior,
      porcentajeDescuento: precioAnterior
        ? Math.round(((precioAnterior - form.precio) / precioAnterior) * 100)
        : undefined,
    };

    this.guardando.set(true);
    try {
      await this.catalog.guardarProducto(producto);
      this.toast.success(
        form.id > 0 ? 'Producto actualizado.' : 'Producto agregado a la carta.',
      );
      this.formOpen.set(false);
    } catch (error) {
      this.toast.error(
        error instanceof Error ? error.message : 'No pudimos guardar el producto.',
      );
    } finally {
      this.guardando.set(false);
    }
  }

  async toggleActivo(producto: Producto): Promise<void> {
    try {
      await this.catalog.guardarProducto({ ...producto, activo: !producto.activo });
      this.toast.success(
        producto.activo ? 'Producto desactivado.' : 'Producto activado.',
      );
    } catch (error) {
      this.toast.error(
        error instanceof Error ? error.message : 'No pudimos actualizar el producto.',
      );
    }
  }

  async toggleDestacado(producto: Producto): Promise<void> {
    try {
      await this.catalog.guardarProducto({
        ...producto,
        destacado: !producto.destacado,
      });
      this.toast.success(
        producto.destacado ? 'Quitado de destacados.' : 'Producto destacado.',
      );
    } catch (error) {
      this.toast.error(
        error instanceof Error ? error.message : 'No pudimos actualizar el producto.',
      );
    }
  }

  async eliminar(producto: Producto): Promise<void> {
    try {
      await this.catalog.eliminarProducto(producto.id);
      this.confirmarEliminar.set(null);
      this.toast.success('Producto retirado de la carta.');
    } catch (error) {
      this.toast.error(
        error instanceof Error ? error.message : 'No pudimos eliminar el producto.',
      );
    }
  }
}
