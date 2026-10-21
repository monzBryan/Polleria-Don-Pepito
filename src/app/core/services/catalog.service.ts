import { computed, inject, Injectable, signal } from '@angular/core';
import { CategoriaProducto, Producto } from '../models';
import { DemoStoreService } from './demo-store.service';
import { SupabaseService } from './supabase.service';
import { environment } from '../../../environments/environment';
import { slugify } from '../utils/format';

function valueOf(row: Record<string, unknown>, keys: string[]): unknown {
  for (const key of keys) {
    const value = row[key];
    if (value !== undefined && value !== null && value !== '') {
      return value;
    }
  }
  return undefined;
}

function textOf(row: Record<string, unknown>, keys: string[], fallback = ''): string {
  const value = valueOf(row, keys);
  return value === undefined ? fallback : String(value);
}

function numberOf(row: Record<string, unknown>, keys: string[], fallback = 0): number {
  const value = Number(valueOf(row, keys));
  return Number.isFinite(value) ? value : fallback;
}

function boolOf(row: Record<string, unknown>, keys: string[], fallback = false): boolean {
  const value = valueOf(row, keys);
  if (value === undefined) return fallback;
  if (typeof value === 'boolean') return value;
  const normalized = String(value).toUpperCase();
  return normalized === 'S' || normalized === 'A' || normalized === 'TRUE' || normalized === '1';
}

function mapCategoria(row: Record<string, unknown>): CategoriaProducto {
  const nombre = textOf(row, ['n_categoriaproducto', 'nombre', 'categoria'], 'Categoría');
  return {
    id: numberOf(row, ['id_categoriaproducto', 'id_categoria', 'id'], 0),
    slug: slugify(textOf(row, ['slug'], nombre)),
    nombre,
    descripcion: textOf(row, ['descripcion', 'detalle'], ''),
    imagenUrl: textOf(row, ['imagen', 'imagen_url'], ''),
    icono: textOf(row, ['icono'], 'lucideUtensils'),
    orden: numberOf(row, ['orden_carta', 'orden'], 0),
    activo: boolOf(row, ['activo'], textOf(row, ['estado'], 'A').toUpperCase() !== 'I'),
  };
}

function mapProducto(
  row: Record<string, unknown>,
  categorias: CategoriaProducto[],
): Producto {
  const categoriaId = numberOf(
    row,
    ['id_categoriaproducto', 'id_categoria', 'categoria_id'],
    0,
  );
  const categoria = categorias.find((item) => item.id === categoriaId);
  const estado = textOf(row, ['estado'], 'A').toUpperCase();
  const disponible = textOf(row, ['disponible'], 'S').toUpperCase();
  const activo = boolOf(row, ['activo'], estado === 'A' && disponible === 'S');
  return {
    id: numberOf(row, ['id_producto', 'id'], 0),
    codigo: textOf(row, ['codigo'], ''),
    categoriaId,
    categoriaSlug: categoria?.slug ?? 'otros',
    categoriaNombre: categoria?.nombre ?? 'Otros',
    nombre: textOf(row, ['n_producto', 'nombre'], 'Producto'),
    descripcion: textOf(row, ['detalle', 'descripcion'], ''),
    precio: numberOf(row, ['precio'], 0),
    precioAnterior: numberOf(row, ['precio_anterior'], 0) || undefined,
    porcentajeDescuento: numberOf(row, ['porcentaje_descuento'], 0) || undefined,
    imagenUrl: textOf(row, ['imagen', 'imagen_url'], ''),
    activo,
    destacado: boolOf(row, ['destacado'], false),
    esNuevo: boolOf(row, ['es_nuevo'], false),
    nivelPicante: numberOf(row, ['nivel_picante'], 0),
    tiempoPreparacion: numberOf(row, ['tiempo_preparacion'], 15),
    ventas: numberOf(row, ['ventas', 'total_vendido'], 0),
    etiquetas: Array.isArray(row['etiquetas'])
      ? (row['etiquetas'] as unknown[]).map(String)
      : [],
  };
}

@Injectable({ providedIn: 'root' })
export class CatalogService {
  private readonly demo = inject(DemoStoreService);
  private readonly supabase = inject(SupabaseService);

  private readonly remoteCategorias = signal<CategoriaProducto[]>([]);
  private readonly remoteProductos = signal<Producto[]>([]);
  private readonly fallbackActivo = signal(false);

  readonly loading = signal(false);
  readonly integrationStatus = signal<'demo' | 'connected' | 'pending'>('demo');
  readonly modoDemo = computed(
    () => environment.useDemoFallback || this.fallbackActivo(),
  );

  readonly categorias = computed(() =>
    this.modoDemo() ? this.demo.categorias() : this.remoteCategorias(),
  );

  readonly productos = computed(() =>
    this.modoDemo() ? this.demo.productos() : this.remoteProductos(),
  );

  readonly categoriasActivas = computed(() =>
    [...this.categorias()]
      .filter((categoria) => categoria.activo)
      .sort((a, b) => a.orden - b.orden),
  );

  readonly productosActivos = computed(() =>
    [...this.productos()]
      .filter((producto) => producto.activo)
      .sort((a, b) => b.ventas - a.ventas),
  );

  readonly destacados = computed(() =>
    this.productosActivos().filter((producto) => producto.destacado).slice(0, 8),
  );

  constructor() {
    if (!environment.useDemoFallback) {
      void this.cargarRemoto();
    }
  }

  async cargarRemoto(): Promise<void> {
    this.loading.set(true);
    try {
      const [categoriasResult, productosResult] = await Promise.all([
        this.supabase.client
          .from('categoria_producto')
          .select('*')
          .order('orden_carta', { ascending: true }),
        this.supabase.client
          .from('producto')
          .select('*')
          .order('n_producto', { ascending: true }),
      ]);

      if (categoriasResult.error || productosResult.error) {
        throw categoriasResult.error ?? productosResult.error;
      }

      const categorias = (categoriasResult.data ?? []).map((row) =>
        mapCategoria(row as Record<string, unknown>),
      );
      const productos = (productosResult.data ?? []).map((row) =>
        mapProducto(row as Record<string, unknown>, categorias),
      );
      this.remoteCategorias.set(categorias);
      this.remoteProductos.set(productos);
      this.fallbackActivo.set(false);
      this.integrationStatus.set('connected');
    } catch {
      this.fallbackActivo.set(true);
      this.integrationStatus.set('pending');
    } finally {
      this.loading.set(false);
    }
  }

  categoriaPorSlug(slug: string): CategoriaProducto | undefined {
    return this.categoriasActivas().find((categoria) => categoria.slug === slug);
  }

  productosPorCategoria(slug: string): Producto[] {
    if (slug === 'todos') return this.productosActivos();
    return this.productosActivos().filter((producto) => producto.categoriaSlug === slug);
  }

  buscar(term: string): Producto[] {
    const query = term.trim().toLowerCase();
    if (!query) return this.productosActivos();
    return this.productosActivos().filter((producto) =>
      `${producto.nombre} ${producto.descripcion} ${producto.categoriaNombre}`
        .toLowerCase()
        .includes(query),
    );
  }

  async guardarProducto(producto: Producto): Promise<Producto> {
    if (this.modoDemo()) {
      return this.demo.guardarProducto(producto);
    }
    const payload = {
      id_categoriaproducto: producto.categoriaId,
      id_unidad: 1,
      codigo: producto.codigo || null,
      n_producto: producto.nombre,
      detalle: producto.descripcion,
      precio: producto.precio,
      precio_anterior: producto.precioAnterior ?? null,
      porcentaje_descuento: producto.porcentajeDescuento ?? 0,
      imagen: producto.imagenUrl,
      destacado: producto.destacado ? 'S' : 'N',
      es_nuevo: producto.esNuevo ? 'S' : 'N',
      nivel_picante: producto.nivelPicante,
      tiempo_preparacion: producto.tiempoPreparacion,
      disponible: producto.activo ? 'S' : 'N',
      estado: producto.activo ? 'A' : 'I',
    };
    const query =
      producto.id > 0
        ? this.supabase.client
            .from('producto')
            .update(payload)
            .eq('id_producto', producto.id)
        : this.supabase.client.from('producto').insert(payload);
    const { error } = await query;
    if (error) {
      throw new Error(this.supabase.errorMessage(error));
    }
    await this.cargarRemoto();
    return producto;
  }

  async eliminarProducto(id: number): Promise<void> {
    if (this.modoDemo()) {
      this.demo.eliminarProducto(id);
      return;
    }
    const { error } = await this.supabase.client
      .from('producto')
      .update({ estado: 'I', disponible: 'N' })
      .eq('id_producto', id);
    if (error) {
      throw new Error(this.supabase.errorMessage(error));
    }
    await this.cargarRemoto();
  }

  async guardarCategoria(categoria: CategoriaProducto): Promise<CategoriaProducto> {
    if (this.modoDemo()) {
      return this.demo.guardarCategoria(categoria);
    }
    const payload = {
      n_categoriaproducto: categoria.nombre,
      descripcion: categoria.descripcion,
      imagen: categoria.imagenUrl,
      icono: categoria.icono,
      orden_carta: categoria.orden,
      estado: categoria.activo ? 'A' : 'I',
    };
    const query =
      categoria.id > 0
        ? this.supabase.client
            .from('categoria_producto')
            .update(payload)
            .eq('id_categoriaproducto', categoria.id)
        : this.supabase.client.from('categoria_producto').insert(payload);
    const { error } = await query;
    if (error) {
      throw new Error(this.supabase.errorMessage(error));
    }
    await this.cargarRemoto();
    return categoria;
  }

  async eliminarCategoria(id: number): Promise<void> {
    if (this.modoDemo()) {
      this.demo.eliminarCategoria(id);
      return;
    }
    const { error } = await this.supabase.client
      .from('categoria_producto')
      .update({ estado: 'I' })
      .eq('id_categoriaproducto', id);
    if (error) {
      throw new Error(this.supabase.errorMessage(error));
    }
    await this.cargarRemoto();
  }
}
