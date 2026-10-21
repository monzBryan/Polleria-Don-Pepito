import { Component, computed, inject, signal } from '@angular/core';
import { CategoriaProducto } from '../../../core/models';
import { CatalogService } from '../../../core/services/catalog.service';
import { ToastService } from '../../../core/services/toast.service';
import { slugify } from '../../../core/utils/format';
import { IconComponent } from '../../../shared/components/icon.component';
import { ModalComponent } from '../../../shared/components/modal.component';
import { ImageFallbackDirective } from '../../../shared/directives/image-fallback.directive';

function categoriaVacia(orden: number): CategoriaProducto {
  return {
    id: 0,
    slug: '',
    nombre: '',
    descripcion: '',
    imagenUrl: '',
    icono: 'lucideUtensilsCrossed',
    orden,
    activo: true,
  };
}

const ICONOS = [
  { value: 'lucideDrumstick', label: 'Pollo' },
  { value: 'lucideBeef', label: 'Carnes' },
  { value: 'lucideSoup', label: 'Sopas' },
  { value: 'lucideSalad', label: 'Ensaladas' },
  { value: 'lucideCupSoda', label: 'Bebidas' },
  { value: 'lucideIceCreamBowl', label: 'Postres' },
  { value: 'lucideCoffee', label: 'Café' },
  { value: 'lucideUtensilsCrossed', label: 'General' },
] as const;

@Component({
  selector: 'app-admin-categories',
  standalone: true,
  imports: [IconComponent, ModalComponent, ImageFallbackDirective],
  template: `
    <div class="admin-page">
      <div class="page-head">
        <div class="page-head__info">
          <span class="eyebrow">Catálogo</span>
          <h1>Categorías</h1>
          <p>Organiza la carta en secciones claras para tus clientes.</p>
        </div>
        <div class="page-head__actions">
          <span class="badge badge--outline">{{ categorias().length }} secciones</span>
          <button type="button" class="btn btn--primary btn--sm" (click)="nueva()">
            <app-icon name="lucidePlus" size="15" />
            Nueva categoría
          </button>
        </div>
      </div>

      <div class="category-stats">
        <div>
          <span><app-icon name="lucideTags" size="18" /></span>
          <div><small>Total</small><strong>{{ categorias().length }}</strong></div>
        </div>
        <div>
          <span class="is-green"><app-icon name="lucideCheckCircle2" size="18" /></span>
          <div><small>Activas</small><strong>{{ activas() }}</strong></div>
        </div>
        <div>
          <span class="is-gold"><app-icon name="lucidePackage" size="18" /></span>
          <div><small>Productos</small><strong>{{ productos().length }}</strong></div>
        </div>
      </div>

      @if (categorias().length === 0) {
        <div class="admin-panel admin-empty">
          <app-icon name="lucideTags" size="30" />
          <p>Aún no hay categorías. Crea la primera para empezar.</p>
        </div>
      } @else {
        <div class="category-grid">
          @for (categoria of ordenadas(); track categoria.id) {
            <article class="category-card" [class.is-inactive]="!categoria.activo">
              <div class="category-card__media">
                @if (categoria.imagenUrl) {
                  <img
                    [src]="categoria.imagenUrl"
                    [alt]="categoria.nombre"
                    appImageFallback="/img/fallback-food.svg"
                  />
                } @else {
                  <span class="category-card__placeholder">
                    <app-icon [name]="categoria.icono || 'lucideUtensilsCrossed'" size="26" />
                  </span>
                }
                <span class="category-card__order">#{{ categoria.orden }}</span>
                @if (!categoria.activo) {
                  <span class="category-card__inactive">Inactiva</span>
                }
              </div>

              <div class="category-card__body">
                <div class="category-card__title">
                  <h2>{{ categoria.nombre }}</h2>
                  <span class="category-card__count">{{ conteo(categoria.id) }} prod.</span>
                </div>
                <p>{{ categoria.descripcion || 'Sin descripción.' }}</p>
                <code>/{{ categoria.slug }}</code>

                <div class="category-card__foot">
                  <label class="admin-toggle" [attr.aria-label]="categoria.activo ? 'Desactivar' : 'Activar'">
                    <input
                      type="checkbox"
                      [checked]="categoria.activo"
                      (change)="toggleActivo(categoria)"
                    />
                    <span></span>
                  </label>
                  <span class="category-card__state">
                    {{ categoria.activo ? 'Visible en la carta' : 'Oculta' }}
                  </span>
                  <div class="cell-actions">
                    <button
                      type="button"
                      aria-label="Editar categoría"
                      title="Editar"
                      (click)="editar(categoria)"
                    >
                      <app-icon name="lucidePencil" size="14" />
                    </button>
                    <button
                      type="button"
                      class="is-danger"
                      aria-label="Eliminar categoría"
                      title="Eliminar"
                      (click)="confirmarEliminar.set(categoria)"
                    >
                      <app-icon name="lucideTrash2" size="14" />
                    </button>
                  </div>
                </div>
              </div>
            </article>
          }
        </div>
      }
    </div>

    <app-modal
      [open]="formOpen()"
      [eyebrow]="form().id > 0 ? 'Editar categoría' : 'Nueva categoría'"
      [title]="form().id > 0 ? form().nombre : 'Nueva sección de la carta'"
      (closed)="cerrarForm()"
    >
      <form class="admin-form" (submit)="guardar($event)">
        <label class="field">
          <span class="field-label">Nombre *</span>
          <input
            class="input"
            type="text"
            [value]="form().nombre"
            (input)="setCampo('nombre', $any($event.target).value)"
            placeholder="Ej. Combos familiares"
          />
        </label>

        <label class="field">
          <span class="field-label">Descripción</span>
          <textarea
            class="textarea"
            rows="2"
            [value]="form().descripcion"
            (input)="setCampo('descripcion', $any($event.target).value)"
            placeholder="Una breve descripción para la carta"
          ></textarea>
        </label>

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
            <span class="field-label">Ícono</span>
            <select
              class="input"
              [value]="form().icono"
              (change)="setCampo('icono', $any($event.target).value)"
            >
              @for (icono of iconos; track icono.value) {
                <option [value]="icono.value">{{ icono.label }}</option>
              }
            </select>
          </label>
        </div>

        <div class="form-grid">
          <label class="field">
            <span class="field-label">Orden en la carta</span>
            <input
              class="input"
              type="number"
              min="0"
              [value]="form().orden"
              (input)="setNumero('orden', $any($event.target).value)"
            />
          </label>
          <label class="admin-form__check">
            <input
              type="checkbox"
              [checked]="form().activo"
              (change)="setBoolean('activo', $any($event.target).checked)"
            />
            Visible para clientes
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
              <p>{{ form().nombre || 'Categoría sin nombre' }}</p>
            </div>
          </div>
        }

        <div class="admin-note">
          <app-icon name="lucideInfo" size="14" />
          <p>
            El enlace público se genera automáticamente a partir del nombre:
            <strong>/{{ slugPreview() }}</strong>.
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
              Guardar categoría
            }
          </button>
        </div>
      </form>
    </app-modal>

    <app-modal
      [open]="confirmarEliminar() !== null"
      eyebrow="Eliminar categoría"
      title="¿Ocultar esta categoría?"
      size="sm"
      (closed)="confirmarEliminar.set(null)"
    >
      @if (confirmarEliminar(); as categoria) {
        <p class="confirm-text">
          <strong>{{ categoria.nombre }}</strong> dejará de mostrarse en la carta.
          No se puede eliminar si todavía tiene productos activos.
        </p>
        <div class="admin-form__actions">
          <button type="button" class="btn btn--ghost btn--sm" (click)="confirmarEliminar.set(null)">
            Cancelar
          </button>
          <button type="button" class="btn btn--danger btn--sm" (click)="eliminar(categoria)">
            Sí, ocultar
          </button>
        </div>
      }
    </app-modal>
  `,
  styles: [
    `
      .category-stats {
        display: grid;
        grid-template-columns: repeat(3, 1fr);
        gap: 10px;
      }

      .category-stats > div {
        display: flex;
        align-items: center;
        gap: 10px;
        padding: 12px 14px;
        border: 1px solid rgba(10, 10, 11, 0.08);
        border-radius: 12px;
        background: var(--white);
      }

      .category-stats > div > span {
        display: grid;
        place-items: center;
        width: 34px;
        height: 34px;
        border-radius: 9px;
        background: var(--cream-2);
        color: var(--ink);
      }

      .category-stats > div > span.is-green {
        background: var(--success-soft);
        color: var(--success);
      }

      .category-stats > div > span.is-gold {
        background: var(--gold-soft);
        color: var(--gold-dark);
      }

      .category-stats small {
        display: block;
        color: var(--muted-2);
        font-size: 8px;
        font-weight: 900;
        letter-spacing: 0.08em;
        text-transform: uppercase;
      }

      .category-stats strong {
        font-family: var(--font-display);
        font-size: 20px;
        font-weight: 600;
        line-height: 1.1;
      }

      .category-grid {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(270px, 1fr));
        gap: 12px;
      }

      .category-card {
        border: 1px solid rgba(10, 10, 11, 0.08);
        border-radius: 14px;
        background: var(--white);
        box-shadow: 0 8px 22px rgba(10, 10, 11, 0.045);
        overflow: hidden;
        transition: var(--transition);
      }

      .category-card:hover {
        transform: translateY(-2px);
        box-shadow: 0 14px 30px rgba(10, 10, 11, 0.08);
      }

      .category-card.is-inactive {
        opacity: 0.68;
      }

      .category-card__media {
        position: relative;
        height: 112px;
        background: var(--ink);
      }

      .category-card__media img {
        width: 100%;
        height: 100%;
        object-fit: cover;
        opacity: 0.82;
      }

      .category-card__placeholder {
        display: grid;
        place-items: center;
        height: 100%;
        color: var(--gold);
        background:
          radial-gradient(circle at 80% 10%, rgba(232, 181, 77, 0.2), transparent 40%),
          var(--ink);
      }

      .category-card__order,
      .category-card__inactive {
        position: absolute;
        top: 8px;
        padding: 3px 7px;
        border-radius: var(--radius-pill);
        font-size: 8px;
        font-weight: 900;
      }

      .category-card__order {
        left: 8px;
        background: rgba(255, 248, 238, 0.9);
        color: var(--ink);
      }

      .category-card__inactive {
        right: 8px;
        background: var(--danger);
        color: var(--white);
      }

      .category-card__body {
        padding: 12px;
      }

      .category-card__title {
        display: flex;
        align-items: flex-start;
        justify-content: space-between;
        gap: 8px;
      }

      .category-card__title h2 {
        font-family: var(--font-display);
        font-size: 18px;
        font-weight: 600;
        letter-spacing: -0.02em;
      }

      .category-card__count {
        flex: none;
        color: var(--muted-2);
        font-size: 8px;
        font-weight: 800;
      }

      .category-card__body > p {
        display: -webkit-box;
        overflow: hidden;
        -webkit-line-clamp: 2;
        -webkit-box-orient: vertical;
        margin: 4px 0 6px;
        min-height: 28px;
        color: var(--muted);
        font-size: 9px;
        line-height: 1.55;
      }

      .category-card__body code {
        display: inline-block;
        padding: 2px 6px;
        border-radius: 5px;
        background: var(--cream-2);
        color: var(--muted-2);
        font-size: 8px;
      }

      .category-card__foot {
        display: flex;
        align-items: center;
        gap: 7px;
        margin-top: 10px;
        padding-top: 9px;
        border-top: 1px solid var(--line);
      }

      .category-card__state {
        flex: 1;
        color: var(--muted-2);
        font-size: 8px;
        font-weight: 700;
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

      @media (max-width: 640px) {
        .category-stats {
          grid-template-columns: 1fr;
        }
      }
    `,
  ],
})
export class AdminCategoriesPageComponent {
  private readonly catalog = inject(CatalogService);
  private readonly toast = inject(ToastService);

  readonly categorias = this.catalog.categorias;
  readonly productos = this.catalog.productos;
  readonly iconos = ICONOS;

  readonly formOpen = signal(false);
  readonly form = signal<CategoriaProducto>(categoriaVacia(0));
  readonly guardando = signal(false);
  readonly confirmarEliminar = signal<CategoriaProducto | null>(null);

  readonly ordenadas = computed(() =>
    [...this.categorias()].sort((a, b) => a.orden - b.orden),
  );

  readonly activas = computed(
    () => this.categorias().filter((categoria) => categoria.activo).length,
  );

  readonly slugPreview = computed(
    () => slugify(this.form().nombre) || 'nueva-categoria',
  );

  nueva(): void {
    const orden = Math.max(0, ...this.categorias().map((categoria) => categoria.orden)) + 1;
    this.form.set(categoriaVacia(orden));
    this.formOpen.set(true);
  }

  editar(categoria: CategoriaProducto): void {
    this.form.set({ ...categoria });
    this.formOpen.set(true);
  }

  cerrarForm(): void {
    this.formOpen.set(false);
  }

  setCampo(
    campo: 'nombre' | 'descripcion' | 'imagenUrl' | 'icono',
    value: string,
  ): void {
    this.form.update((categoria) => ({ ...categoria, [campo]: value }));
  }

  setNumero(campo: 'orden', value: string): void {
    this.form.update((categoria) => ({
      ...categoria,
      [campo]: Math.max(0, Math.trunc(Number(value) || 0)),
    }));
  }

  setBoolean(campo: 'activo', value: boolean): void {
    this.form.update((categoria) => ({ ...categoria, [campo]: value }));
  }

  conteo(categoriaId: number): number {
    return this.productos().filter(
      (producto) => producto.categoriaId === categoriaId && producto.activo,
    ).length;
  }

  async guardar(event?: Event): Promise<void> {
    event?.preventDefault();
    const form = this.form();
    if (form.nombre.trim().length < 2) {
      this.toast.warning('Ingresa el nombre de la categoría.');
      return;
    }
    const categoria: CategoriaProducto = {
      ...form,
      nombre: form.nombre.trim(),
      descripcion: form.descripcion.trim(),
      imagenUrl: form.imagenUrl.trim(),
      slug: slugify(form.nombre),
    };
    this.guardando.set(true);
    try {
      await this.catalog.guardarCategoria(categoria);
      this.toast.success(
        form.id > 0 ? 'Categoría actualizada.' : 'Categoría creada.',
      );
      this.formOpen.set(false);
    } catch (error) {
      this.toast.error(
        error instanceof Error ? error.message : 'No pudimos guardar la categoría.',
      );
    } finally {
      this.guardando.set(false);
    }
  }

  async toggleActivo(categoria: CategoriaProducto): Promise<void> {
    try {
      await this.catalog.guardarCategoria({
        ...categoria,
        activo: !categoria.activo,
      });
      this.toast.success(
        categoria.activo ? 'Categoría ocultada.' : 'Categoría visible.',
      );
    } catch (error) {
      this.toast.error(
        error instanceof Error ? error.message : 'No pudimos actualizar la categoría.',
      );
    }
  }

  async eliminar(categoria: CategoriaProducto): Promise<void> {
    try {
      await this.catalog.eliminarCategoria(categoria.id);
      this.confirmarEliminar.set(null);
      this.toast.success('Categoría ocultada de la carta.');
    } catch (error) {
      this.toast.error(
        error instanceof Error ? error.message : 'No pudimos eliminar la categoría.',
      );
    }
  }
}
