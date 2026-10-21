import { computed, inject, Injectable, signal } from '@angular/core';
import {
  CrearPedidoInput,
  EstadoPedido,
  MetodoPago,
  Pedido,
  PedidoItem,
  TipoEntrega,
} from '../models';
import { DemoStoreService } from './demo-store.service';
import { SupabaseService } from './supabase.service';
import { CatalogService } from './catalog.service';
import { environment } from '../../../environments/environment';
import { normalizePhone } from '../utils/format';

function normalizar(value: unknown): string {
  return String(value ?? '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/\s+/g, '_');
}

function mapEstado(value: unknown): EstadoPedido {
  const raw = normalizar(value);
  if (raw.includes('cancel')) return 'cancelado';
  if (raw.includes('entreg')) return 'entregado';
  if (raw.includes('camino') || raw.includes('repart')) return 'en_camino';
  if (raw.includes('prepar') || raw.includes('cocina')) return 'en_preparacion';
  if (raw.includes('listo')) return 'listo';
  if (raw.includes('confirm') || raw.includes('recib')) return 'confirmado';
  return 'pendiente';
}

function mapTipoEntrega(value: unknown): TipoEntrega {
  const raw = normalizar(value);
  if (raw.includes('delivery') || raw.includes('domicilio')) return 'delivery';
  return 'recojo';
}

function mapMetodoPago(value: unknown): MetodoPago {
  const raw = normalizar(value);
  if (raw.includes('yape')) return 'yape';
  if (raw.includes('plin')) return 'plin';
  if (raw.includes('tarjeta') || raw.includes('visa') || raw.includes('pos')) return 'tarjeta';
  return 'efectivo';
}

function field(row: Record<string, unknown>, keys: string[]): unknown {
  for (const key of keys) {
    const value = row[key];
    if (value !== undefined && value !== null && value !== '') return value;
  }
  return undefined;
}

function asRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === 'object' ? (value as Record<string, unknown>) : {};
}

function mapItem(
  row: Record<string, unknown>,
  productos: { id: number; nombre: string; imagenUrl: string }[],
): PedidoItem {
  const productoId = Number(field(row, ['id_producto', 'producto_id']) ?? 0);
  const producto = productos.find((item) => item.id === productoId);
  const nested = asRecord(row['producto']);
  return {
    productoId,
    nombre:
      String(field(row, ['n_producto', 'nombre']) ?? '') ||
      String(nested['n_producto'] ?? nested['nombre'] ?? producto?.nombre ?? 'Producto'),
    precioUnitario: Number(field(row, ['precio_unitario', 'precio']) ?? 0),
    cantidad: Number(field(row, ['cantidad']) ?? 1),
    imagenUrl:
      String(field(row, ['imagen', 'imagen_url']) ?? '') ||
      String(nested['imagen'] ?? producto?.imagenUrl ?? ''),
    nota: String(field(row, ['nota_cocina', 'nota']) ?? '') || undefined,
  };
}

function mapPedido(
  row: Record<string, unknown>,
  detalles: Record<string, unknown>[],
  productos: { id: number; nombre: string; imagenUrl: string }[],
): Pedido {
  const nestedEstado = asRecord(row['estado_pedido']);
  const nestedTipo = asRecord(row['tipo_pedido']);
  const nestedPago = asRecord(row['metodo_pago']);
  const id = String(field(row, ['id_pedido', 'id']) ?? '');
  const items = detalles
    .filter((detalle) => String(field(detalle, ['id_pedido']) ?? '') === id)
    .map((detalle) => mapItem(detalle, productos));
  const createdAt = String(
    field(row, ['f_pedido', 'created_at', 'creado_en']) ?? new Date().toISOString(),
  );
  return {
    id,
    codigo: String(
      field(row, ['codigo_seguimiento', 'codigo', 'numero_pedido']) ?? id,
    ),
    perfilId: String(
      field(row, ['id_perfil', 'uuid_auth', 'id_cliente']) ?? '',
    ),
    clienteNombre: String(
      field(row, ['cliente_nombre', 'nombre_cliente']) ??
        asRecord(row['cliente'])['nombre'] ??
        'Cliente',
    ),
    clienteEmail: String(field(row, ['cliente_email', 'email']) ?? ''),
    clienteTelefono: normalizePhone(
      String(field(row, ['telefono_contacto', 'cliente_telefono', 'telefono']) ?? ''),
    ),
    tipoEntrega: mapTipoEntrega(
      field(row, ['tipo_entrega', 'tipo_pedido']) ?? nestedTipo['n_tipopedido'],
    ),
    direccion:
      String(field(row, ['direccion_entrega', 'direccion']) ?? '') || undefined,
    referencia: String(field(row, ['referencia']) ?? '') || undefined,
    distrito: String(field(row, ['distrito']) ?? '') || undefined,
    metodoPago: mapMetodoPago(
      field(row, ['metodo_pago', 'n_metodopago']) ?? nestedPago['n_metodopago'],
    ),
    estado: mapEstado(
      field(row, ['estado', 'nom_estado']) ??
        nestedEstado['descripcion'] ??
        nestedEstado['n_estado'],
    ),
    items,
    subtotal: Number(field(row, ['subtotal']) ?? 0),
    descuentoPuntos: Number(field(row, ['descuento', 'descuento_puntos']) ?? 0),
    costoDelivery: Number(field(row, ['costo_envio', 'costo_delivery']) ?? 0),
    total: Number(field(row, ['total']) ?? 0),
    puntosUsados: Number(field(row, ['puntos_usados']) ?? 0),
    puntosGanados: Number(field(row, ['puntos_ganados']) ?? 0),
    notas: String(field(row, ['observacion', 'notas']) ?? '') || undefined,
    createdAt,
    updatedAt: String(field(row, ['f_modificacion', 'updated_at']) ?? createdAt),
    fEntregaEstimada:
      String(field(row, ['f_entrega_estimada', 'f_entrega']) ?? '') || undefined,
  };
}

@Injectable({ providedIn: 'root' })
export class OrderService {
  private readonly demo = inject(DemoStoreService);
  private readonly supabase = inject(SupabaseService);
  private readonly catalog = inject(CatalogService);

  private readonly remotePedidos = signal<Pedido[]>([]);
  private readonly fallbackActivo = signal(false);
  readonly loading = signal(false);
  readonly integrationStatus = signal<'demo' | 'connected' | 'pending'>('demo');
  readonly modoDemo = computed(
    () => environment.useDemoFallback || this.fallbackActivo(),
  );

  readonly pedidos = computed<Pedido[]>(() =>
    this.modoDemo()
      ? this.demo.pedidosOrdenados()
      : [...this.remotePedidos()].sort(
          (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
        ),
  );

  constructor() {
    if (!environment.useDemoFallback) {
      void this.cargarRemoto();
    }
  }

  async cargarRemoto(): Promise<void> {
    this.loading.set(true);
    try {
      const [pedidosResult, detallesResult] = await Promise.all([
        this.supabase.client
          .from('pedido')
          .select('*')
          .order('f_pedido', { ascending: false })
          .limit(400),
        this.supabase.client.from('detalle_pedido').select('*').limit(4000),
      ]);
      if (pedidosResult.error || detallesResult.error) {
        throw pedidosResult.error ?? detallesResult.error;
      }
      const productos = this.catalog.productos().map((producto) => ({
        id: producto.id,
        nombre: producto.nombre,
        imagenUrl: producto.imagenUrl,
      }));
      const detalles = (detallesResult.data ?? []).map((row) =>
        row as Record<string, unknown>,
      );
      const pedidos = (pedidosResult.data ?? []).map((row) =>
        mapPedido(row as Record<string, unknown>, detalles, productos),
      );
      this.remotePedidos.set(pedidos);
      this.fallbackActivo.set(false);
      this.integrationStatus.set('connected');
    } catch {
      this.fallbackActivo.set(true);
      this.integrationStatus.set('pending');
    } finally {
      this.loading.set(false);
    }
  }

  async crearPedido(input: CrearPedidoInput): Promise<Pedido> {
    if (this.modoDemo()) {
      return this.demo.crearPedido(input);
    }
    const { data, error } = await this.supabase.client.rpc('sp_web_crear_pedido', {
      p_items: input.items.map((item) => ({
        id_producto: item.productoId,
        cantidad: item.cantidad,
        nota: item.nota ?? null,
      })),
      p_tipo_entrega: input.tipoEntrega,
      p_metodo_pago: input.metodoPago,
      p_direccion: input.direccion ?? null,
      p_referencia: input.referencia ?? null,
      p_distrito: input.distrito ?? null,
      p_telefono: normalizePhone(input.clienteTelefono),
      p_notas: input.notas ?? null,
      p_puntos_usados: input.puntosUsados,
    });
    if (error) {
      throw new Error(this.supabase.errorMessage(error));
    }
    const raw = Array.isArray(data) ? data[0] : data;
    const record = asRecord(raw);
    if (record['pedido']) {
      const pedido = mapPedido(
        asRecord(record['pedido']),
        (record['detalles'] as Record<string, unknown>[] | undefined) ?? [],
        this.catalog.productos(),
      );
      if (pedido.codigo) return pedido;
    }
    if (record['id_pedido'] || record['codigo_seguimiento']) {
      return mapPedido(record, [], this.catalog.productos());
    }
    await this.cargarRemoto();
    const codigo = typeof raw === 'string' ? raw : String(record['codigo'] ?? '');
    const encontrado = codigo
      ? this.remotePedidos().find((pedido) => pedido.codigo === codigo)
      : undefined;
    if (encontrado) return encontrado;
    return this.pedidoLocal(input, codigo);
  }

  async actualizarEstado(pedidoId: string, estado: EstadoPedido): Promise<Pedido | undefined> {
    if (this.modoDemo()) {
      return this.demo.actualizarEstadoPedido(pedidoId, estado);
    }
    const { error } = await this.supabase.client.rpc(
      'sp_web_actualizar_estado_pedido',
      {
        p_id_pedido: Number(pedidoId) || pedidoId,
        p_estado: estado,
      },
    );
    if (error) {
      throw new Error(this.supabase.errorMessage(error));
    }
    await this.cargarRemoto();
    return this.remotePedidos().find((pedido) => pedido.id === pedidoId);
  }

  async obtenerPorCodigo(codigo: string): Promise<Pedido | null> {
    if (this.modoDemo()) {
      return this.demo.obtenerPedidoPorCodigo(codigo);
    }
    const normalized = codigo.trim();
    const enMemoria = this.remotePedidos().find(
      (pedido) => pedido.codigo.toLowerCase() === normalized.toLowerCase(),
    );
    if (enMemoria) return enMemoria;
    const { data, error } = await this.supabase.client
      .from('pedido')
      .select('*')
      .or(`codigo_seguimiento.eq.${normalized},numero_pedido.eq.${normalized}`)
      .limit(1)
      .maybeSingle();
    if (error || !data) return null;
    const { data: detalles } = await this.supabase.client
      .from('detalle_pedido')
      .select('*')
      .eq('id_pedido', (data as Record<string, unknown>)['id_pedido']);
    return mapPedido(
      data as Record<string, unknown>,
      (detalles ?? []) as Record<string, unknown>[],
      this.catalog.productos(),
    );
  }

  pedidosDePerfil(perfilId: string): Pedido[] {
    if (this.modoDemo()) {
      return this.demo.pedidosDePerfil(perfilId);
    }
    return this.remotePedidos().filter((pedido) => pedido.perfilId === perfilId);
  }

  private pedidoLocal(input: CrearPedidoInput, codigo: string): Pedido {
    const ahora = new Date().toISOString();
    const productos = this.catalog.productos();
    const items: PedidoItem[] = input.items.map((item) => {
      const producto = productos.find((entry) => entry.id === item.productoId);
      return {
        productoId: item.productoId,
        nombre: producto?.nombre ?? 'Producto',
        precioUnitario: producto?.precio ?? 0,
        cantidad: item.cantidad,
        imagenUrl: producto?.imagenUrl ?? '',
        nota: item.nota,
      };
    });
    const subtotal = items.reduce(
      (total, item) => total + item.precioUnitario * item.cantidad,
      0,
    );
    return {
      id: codigo || `web-${Date.now()}`,
      codigo: codigo || `WEB-${Date.now()}`,
      perfilId: input.perfilId,
      clienteNombre: input.clienteNombre,
      clienteEmail: input.clienteEmail,
      clienteTelefono: input.clienteTelefono,
      tipoEntrega: input.tipoEntrega,
      direccion: input.direccion,
      referencia: input.referencia,
      distrito: input.distrito,
      metodoPago: input.metodoPago,
      estado: 'confirmado',
      items,
      subtotal,
      descuentoPuntos: 0,
      costoDelivery: 0,
      total: subtotal,
      puntosUsados: input.puntosUsados,
      puntosGanados: 0,
      notas: input.notas,
      createdAt: ahora,
      updatedAt: ahora,
    };
  }
}
