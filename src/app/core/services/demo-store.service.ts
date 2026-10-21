import { Injectable, computed, effect, signal } from '@angular/core';
import {
  CategoriaProducto,
  ConfigPuntos,
  ConfigWeb,
  CrearCuentaInput,
  CrearPedidoInput,
  CrearReservaInput,
  CuentaDemo,
  EstadoMesa,
  EstadoReserva,
  Mesa,
  Pedido,
  Perfil,
  Producto,
  Reserva,
  TransaccionPuntos,
} from '../models';
import {
  DEMO_CATEGORIAS,
  DEMO_CONFIG_PUNTOS,
  DEMO_CONFIG_WEB,
  DEMO_CUENTAS,
  DEMO_MESAS,
  DEMO_PEDIDOS,
  DEMO_PRODUCTOS,
  DEMO_RESERVAS,
  DEMO_TRANSACCIONES,
} from '../../data/demo-data';
import {
  descuentoPorPuntos,
  maxPuntosCanjeables,
  normalizarPuntos,
  puntosGanados,
} from '../utils/points';
import { normalizePhone, uid } from '../utils/format';

const KEYS = {
  categorias: 'dp_categorias_v1',
  productos: 'dp_productos_v1',
  pedidos: 'dp_pedidos_v1',
  cuentas: 'dp_cuentas_v1',
  transacciones: 'dp_transacciones_v1',
  configWeb: 'dp_config_web_v1',
  configPuntos: 'dp_config_puntos_v1',
  mesas: 'dp_mesas_v1',
  reservas: 'dp_reservas_v1',
  session: 'dp_session_v1',
} as const;

function load<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

function save<T>(key: string, value: T): void {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // El almacenamiento local puede estar lleno o deshabilitado.
  }
}

function toPerfil(cuenta: CuentaDemo): Perfil {
  const { password: _password, ...perfil } = cuenta;
  return perfil;
}

@Injectable({ providedIn: 'root' })
export class DemoStoreService {
  private readonly _categorias = signal<CategoriaProducto[]>(
    load(KEYS.categorias, DEMO_CATEGORIAS),
  );
  private readonly _productos = signal<Producto[]>(load(KEYS.productos, DEMO_PRODUCTOS));
  private readonly _pedidos = signal<Pedido[]>(load(KEYS.pedidos, DEMO_PEDIDOS));
  private readonly _cuentas = signal<CuentaDemo[]>(load(KEYS.cuentas, DEMO_CUENTAS));
  private readonly _transacciones = signal<TransaccionPuntos[]>(
    load(KEYS.transacciones, DEMO_TRANSACCIONES),
  );
  private readonly _configWeb = signal<ConfigWeb>(load(KEYS.configWeb, DEMO_CONFIG_WEB));
  private readonly _configPuntos = signal<ConfigPuntos>(
    load(KEYS.configPuntos, DEMO_CONFIG_PUNTOS),
  );
  private readonly _mesas = signal<Mesa[]>(load(KEYS.mesas, DEMO_MESAS));
  private readonly _reservas = signal<Reserva[]>(load(KEYS.reservas, DEMO_RESERVAS));
  private readonly _session = signal<string | null>(load(KEYS.session, null));

  readonly categorias = this._categorias.asReadonly();
  readonly productos = this._productos.asReadonly();
  readonly pedidos = this._pedidos.asReadonly();
  readonly transacciones = this._transacciones.asReadonly();
  readonly configWeb = this._configWeb.asReadonly();
  readonly configPuntos = this._configPuntos.asReadonly();
  readonly mesas = this._mesas.asReadonly();
  readonly reservas = this._reservas.asReadonly();
  readonly session = this._session.asReadonly();
  readonly isDemo = signal(true);

  readonly perfiles = computed<Perfil[]>(() => this._cuentas().map(toPerfil));

  readonly perfilActual = computed<Perfil | null>(() => {
    const id = this._session();
    if (!id) return null;
    return this.perfiles().find((perfil) => perfil.id === id) ?? null;
  });

  readonly pedidosOrdenados = computed(() =>
    [...this._pedidos()].sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
    ),
  );

  readonly transaccionesOrdenadas = computed(() =>
    [...this._transacciones()].sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
    ),
  );

  readonly reservasOrdenadas = computed(() =>
    [...this._reservas()].sort((a, b) =>
      `${a.fecha} ${a.hora}`.localeCompare(`${b.fecha} ${b.hora}`),
    ),
  );

  constructor() {
    effect(() => save(KEYS.categorias, this._categorias()));
    effect(() => save(KEYS.productos, this._productos()));
    effect(() => save(KEYS.pedidos, this._pedidos()));
    effect(() => save(KEYS.cuentas, this._cuentas()));
    effect(() => save(KEYS.transacciones, this._transacciones()));
    effect(() => save(KEYS.configWeb, this._configWeb()));
    effect(() => save(KEYS.configPuntos, this._configPuntos()));
    effect(() => save(KEYS.mesas, this._mesas()));
    effect(() => save(KEYS.reservas, this._reservas()));
    effect(() => save(KEYS.session, this._session()));
  }

  login(email: string, password: string): Perfil {
    const normalized = email.trim().toLowerCase();
    const cuenta = this._cuentas().find(
      (item) => item.email.toLowerCase() === normalized,
    );
    if (!cuenta) {
      throw new Error('No encontramos una cuenta con ese correo.');
    }
    if (cuenta.password !== password) {
      throw new Error('La contraseña no es correcta. Inténtalo de nuevo.');
    }
    this._session.set(cuenta.id);
    return toPerfil(cuenta);
  }

  register(input: CrearCuentaInput): Perfil {
    const email = input.email.trim().toLowerCase();
    if (this._cuentas().some((cuenta) => cuenta.email.toLowerCase() === email)) {
      throw new Error('Ya existe una cuenta con ese correo. Inicia sesión.');
    }
    const clienteId = Math.max(0, ...this._cuentas().map((cuenta) => cuenta.clienteId)) + 1;
    const perfil: CuentaDemo = {
      id: uid('u'),
      clienteId,
      nombre: input.nombre.trim(),
      email,
      telefono: normalizePhone(input.telefono),
      rol: 'cliente',
      puntos: 50,
      createdAt: new Date().toISOString(),
      password: input.password,
    };
    this._cuentas.update((cuentas) => [...cuentas, perfil]);
    this._transacciones.update((items) => [
      {
        id: uid('t'),
        perfilId: perfil.id,
        tipo: 'bienvenida',
        puntos: 50,
        descripcion: 'Bono de bienvenida',
        createdAt: new Date().toISOString(),
      },
      ...items,
    ]);
    this._session.set(perfil.id);
    return toPerfil(perfil);
  }

  logout(): void {
    this._session.set(null);
  }

  actualizarPerfil(nombre: string, telefono: string): Perfil {
    const id = this._session();
    if (!id) {
      throw new Error('Necesitas iniciar sesión.');
    }
    let actualizado: CuentaDemo | null = null;
    this._cuentas.update((cuentas) =>
      cuentas.map((cuenta) => {
        if (cuenta.id !== id) return cuenta;
        actualizado = {
          ...cuenta,
          nombre: nombre.trim(),
          telefono: normalizePhone(telefono),
        };
        return actualizado;
      }),
    );
    if (!actualizado) {
      throw new Error('No encontramos tu perfil.');
    }
    return toPerfil(actualizado);
  }

  cambiarRol(perfilId: string, rol: 'cliente' | 'admin'): void {
    if (perfilId === this._session() && rol !== 'admin') {
      throw new Error('No puedes quitarte el rol de administrador a ti mismo.');
    }
    this._cuentas.update((cuentas) =>
      cuentas.map((cuenta) => (cuenta.id === perfilId ? { ...cuenta, rol } : cuenta)),
    );
  }

  ajustarPuntos(perfilId: string, puntos: number, motivo: string): void {
    const cantidad = Math.trunc(puntos);
    if (!Number.isFinite(cantidad) || cantidad === 0) {
      throw new Error('Ingresa una cantidad de puntos distinta de cero.');
    }
    if (!motivo.trim()) {
      throw new Error('El motivo del ajuste es obligatorio.');
    }
    this._cuentas.update((cuentas) =>
      cuentas.map((cuenta) =>
        cuenta.id === perfilId
          ? { ...cuenta, puntos: Math.max(0, cuenta.puntos + cantidad) }
          : cuenta,
      ),
    );
    this._transacciones.update((items) => [
      {
        id: uid('t'),
        perfilId,
        tipo: 'ajuste',
        puntos: cantidad,
        descripcion: motivo.trim(),
        createdAt: new Date().toISOString(),
      },
      ...items,
    ]);
  }

  guardarProducto(producto: Producto): Producto {
    const existente = this._productos().find((item) => item.id === producto.id);
    if (existente) {
      this._productos.update((items) =>
        items.map((item) => (item.id === producto.id ? producto : item)),
      );
      return producto;
    }
    const id = Math.max(0, ...this._productos().map((item) => item.id)) + 1;
    const nuevo = { ...producto, id };
    this._productos.update((items) => [nuevo, ...items]);
    return nuevo;
  }

  eliminarProducto(id: number): void {
    this._productos.update((items) =>
      items.map((item) => (item.id === id ? { ...item, activo: false } : item)),
    );
  }

  guardarCategoria(categoria: CategoriaProducto): CategoriaProducto {
    const existente = this._categorias().find((item) => item.id === categoria.id);
    if (existente) {
      this._categorias.update((items) =>
        items.map((item) => (item.id === categoria.id ? categoria : item)),
      );
      this._productos.update((items) =>
        items.map((producto) =>
          producto.categoriaId === categoria.id
            ? {
                ...producto,
                categoriaSlug: categoria.slug,
                categoriaNombre: categoria.nombre,
              }
            : producto,
        ),
      );
      return categoria;
    }
    const id = Math.max(0, ...this._categorias().map((item) => item.id)) + 1;
    const nueva = { ...categoria, id };
    this._categorias.update((items) => [...items, nueva]);
    return nueva;
  }

  eliminarCategoria(id: number): void {
    const tieneProductos = this._productos().some(
      (producto) => producto.categoriaId === id && producto.activo,
    );
    if (tieneProductos) {
      throw new Error('No puedes eliminar una categoría que todavía tiene productos activos.');
    }
    this._categorias.update((items) =>
      items.map((item) => (item.id === id ? { ...item, activo: false } : item)),
    );
  }

  crearPedido(input: CrearPedidoInput): Pedido {
    const perfil = this.perfilActual();
    if (!perfil) {
      throw new Error('Necesitas iniciar sesión para confirmar tu pedido.');
    }
    if (!input.items.length) {
      throw new Error('Tu carrito está vacío.');
    }

    const configWeb = this._configWeb();
    const configPuntos = this._configPuntos();
    const items = input.items.map((item) => {
      const producto = this._productos().find((p) => p.id === item.productoId);
      if (!producto || !producto.activo) {
        throw new Error('Uno de los productos ya no está disponible.');
      }
      if (item.cantidad <= 0) {
        throw new Error('Las cantidades deben ser mayores que cero.');
      }
      return {
        productoId: producto.id,
        nombre: producto.nombre,
        precioUnitario: producto.precio,
        cantidad: item.cantidad,
        imagenUrl: producto.imagenUrl,
        nota: item.nota,
      };
    });

    const subtotal = Number(
      items.reduce((acc, item) => acc + item.precioUnitario * item.cantidad, 0).toFixed(2),
    );

    if (subtotal < configWeb.pedidoMinimo) {
      throw new Error(
        `El pedido mínimo es de S/ ${configWeb.pedidoMinimo.toFixed(2)}. Agrega un producto más.`,
      );
    }

    const telefono = normalizePhone(input.clienteTelefono);
    if (telefono.length !== 9) {
      throw new Error('Ingresa un teléfono de 9 dígitos.');
    }
    if (input.tipoEntrega === 'delivery' && !input.direccion?.trim()) {
      throw new Error('Ingresa la dirección de entrega.');
    }

    const puntosSolicitados = normalizarPuntos(input.puntosUsados, configPuntos);
    const maxPuntos = maxPuntosCanjeables(subtotal, perfil.puntos, configPuntos);
    if (puntosSolicitados > maxPuntos) {
      throw new Error('No puedes canjear más puntos de los permitidos para este pedido.');
    }
    const descuento = descuentoPorPuntos(puntosSolicitados, configPuntos);
    const costoDelivery =
      input.tipoEntrega === 'delivery' && subtotal < configWeb.freeDeliveryFrom
        ? configWeb.deliveryFee
        : 0;
    const total = Number(Math.max(0, subtotal - descuento + costoDelivery).toFixed(2));
    const ganados = puntosGanados(subtotal, descuento, configPuntos);

    const ahora = new Date();
    const pedido: Pedido = {
      id: uid('p'),
      codigo: this.generarCodigo(ahora),
      perfilId: perfil.id,
      clienteNombre: perfil.nombre,
      clienteEmail: perfil.email,
      clienteTelefono: telefono,
      tipoEntrega: input.tipoEntrega,
      direccion: input.tipoEntrega === 'delivery' ? input.direccion?.trim() : undefined,
      referencia: input.tipoEntrega === 'delivery' ? input.referencia?.trim() : undefined,
      distrito: input.tipoEntrega === 'delivery' ? input.distrito?.trim() : undefined,
      metodoPago: input.metodoPago,
      estado: 'confirmado',
      items,
      subtotal,
      descuentoPuntos: descuento,
      costoDelivery,
      total,
      puntosUsados: puntosSolicitados,
      puntosGanados: ganados,
      notas: input.notas?.trim(),
      createdAt: ahora.toISOString(),
      updatedAt: ahora.toISOString(),
      fEntregaEstimada: new Date(
        ahora.getTime() + (input.tipoEntrega === 'delivery' ? 45 : 20) * 60_000,
      ).toISOString(),
    };

    this._pedidos.update((pedidos) => [pedido, ...pedidos]);
    this._cuentas.update((cuentas) =>
      cuentas.map((cuenta) =>
        cuenta.id === perfil.id
          ? {
              ...cuenta,
              puntos: Math.max(0, cuenta.puntos - puntosSolicitados + ganados),
            }
          : cuenta,
      ),
    );

    const movimientos: TransaccionPuntos[] = [];
    if (puntosSolicitados > 0) {
      movimientos.push({
        id: uid('t'),
        perfilId: perfil.id,
        pedidoId: pedido.id,
        tipo: 'canjeado',
        puntos: -puntosSolicitados,
        descripcion: `Canje de ${puntosSolicitados} puntos en ${pedido.codigo}`,
        createdAt: ahora.toISOString(),
      });
    }
    if (ganados > 0) {
      movimientos.push({
        id: uid('t'),
        perfilId: perfil.id,
        pedidoId: pedido.id,
        tipo: 'ganado',
        puntos: ganados,
        descripcion: `Puntos por pedido ${pedido.codigo}`,
        createdAt: ahora.toISOString(),
      });
    }
    if (movimientos.length) {
      this._transacciones.update((items) => [...movimientos, ...items]);
    }

    return pedido;
  }

  actualizarEstadoPedido(pedidoId: string, estado: Pedido['estado']): Pedido {
    const pedido = this._pedidos().find((item) => item.id === pedidoId);
    if (!pedido) {
      throw new Error('No encontramos el pedido.');
    }
    if (pedido.estado === estado) {
      return pedido;
    }
    const anterior = pedido.estado;
    const ahora = new Date().toISOString();
    const actualizado: Pedido = { ...pedido, estado, updatedAt: ahora };

    if (estado === 'cancelado' && anterior !== 'cancelado') {
      this._cuentas.update((cuentas) =>
        cuentas.map((cuenta) =>
          cuenta.id === pedido.perfilId
            ? {
                ...cuenta,
                puntos: Math.max(
                  0,
                  cuenta.puntos + pedido.puntosUsados - pedido.puntosGanados,
                ),
              }
            : cuenta,
        ),
      );
      const movimientos: TransaccionPuntos[] = [];
      if (pedido.puntosUsados > 0) {
        movimientos.push({
          id: uid('t'),
          perfilId: pedido.perfilId,
          pedidoId: pedido.id,
          tipo: 'ajuste',
          puntos: pedido.puntosUsados,
          descripcion: `Devolución de puntos canjeados en ${pedido.codigo}`,
          createdAt: ahora,
        });
      }
      if (pedido.puntosGanados > 0) {
        movimientos.push({
          id: uid('t'),
          perfilId: pedido.perfilId,
          pedidoId: pedido.id,
          tipo: 'ajuste',
          puntos: -pedido.puntosGanados,
          descripcion: `Reversión de puntos ganados en ${pedido.codigo}`,
          createdAt: ahora,
        });
      }
      if (movimientos.length) {
        this._transacciones.update((items) => [...movimientos, ...items]);
      }
    }

    this._pedidos.update((pedidos) =>
      pedidos.map((item) => (item.id === pedidoId ? actualizado : item)),
    );
    return actualizado;
  }

  obtenerPedidoPorCodigo(codigo: string): Pedido | null {
    const normalized = codigo.trim().toUpperCase();
    return (
      this._pedidos().find((pedido) => pedido.codigo.toUpperCase() === normalized) ?? null
    );
  }

  pedidosDePerfil(perfilId: string): Pedido[] {
    return this.pedidosOrdenados().filter((pedido) => pedido.perfilId === perfilId);
  }

  transaccionesDePerfil(perfilId: string): TransaccionPuntos[] {
    return this.transaccionesOrdenadas().filter((item) => item.perfilId === perfilId);
  }

  guardarMesa(mesa: Mesa): Mesa {
    if (!mesa.numero.trim()) {
      throw new Error('El número o nombre de la mesa es obligatorio.');
    }
    if (mesa.capacidad < 1 || mesa.capacidad > 20) {
      throw new Error('La capacidad debe estar entre 1 y 20 personas.');
    }
    const existente = this._mesas().find((item) => item.id === mesa.id);
    if (existente) {
      this._mesas.update((items) =>
        items.map((item) => (item.id === mesa.id ? mesa : item)),
      );
      return mesa;
    }
    const id = Math.max(0, ...this._mesas().map((item) => item.id)) + 1;
    const nueva: Mesa = { ...mesa, id, activo: true };
    this._mesas.update((items) => [...items, nueva]);
    return nueva;
  }

  eliminarMesa(id: number): void {
    const reservada = this._reservas().some(
      (reserva) =>
        reserva.mesaId === id &&
        (reserva.estado === 'pendiente' || reserva.estado === 'confirmada'),
    );
    if (reservada) {
      throw new Error('La mesa tiene reservas activas. Reasígnalas antes de eliminarla.');
    }
    this._mesas.update((items) =>
      items.map((item) =>
        item.id === id
          ? { ...item, activo: false, estado: 'fuera_servicio' }
          : item,
      ),
    );
  }

  cambiarEstadoMesa(id: number, estado: EstadoMesa): Mesa {
    const mesa = this._mesas().find((item) => item.id === id);
    if (!mesa) {
      throw new Error('No encontramos la mesa.');
    }
    if (!mesa.activo) {
      throw new Error('La mesa está fuera de servicio.');
    }
    const actualizada: Mesa = { ...mesa, estado };
    this._mesas.update((items) =>
      items.map((item) => (item.id === id ? actualizada : item)),
    );
    return actualizada;
  }

  crearReserva(input: CrearReservaInput): Reserva {
    const perfil = this.perfilActual();
    if (!perfil) {
      throw new Error('Necesitas iniciar sesión para reservar una mesa.');
    }
    const nombre = input.clienteNombre.trim();
    if (!nombre) {
      throw new Error('Ingresa el nombre de la persona que reserva.');
    }
    const telefono = normalizePhone(input.clienteTelefono);
    if (telefono.length !== 9) {
      throw new Error('Ingresa un teléfono de 9 dígitos.');
    }
    if (!input.fecha || !input.hora) {
      throw new Error('Selecciona la fecha y la hora de tu reserva.');
    }
    if (input.personas < 1 || input.personas > 12) {
      throw new Error('La reserva admite entre 1 y 12 personas.');
    }
    const cuando = new Date(`${input.fecha}T${input.hora}:00`);
    if (Number.isNaN(cuando.getTime()) || cuando.getTime() < Date.now() - 3_600_000) {
      throw new Error('Selecciona una fecha y hora futura.');
    }
    if (input.hora < '12:00' || input.hora > '22:30') {
      throw new Error('Las reservas se reciben entre las 12:00 y las 22:30.');
    }
    const ocupadas = this._reservas().filter(
      (reserva) =>
        reserva.fecha === input.fecha &&
        reserva.hora === input.hora &&
        reserva.ambiente === input.ambiente &&
        (reserva.estado === 'pendiente' || reserva.estado === 'confirmada'),
    ).length;
    const capacidad = this._mesas()
      .filter(
        (mesa) => mesa.ambiente === input.ambiente && mesa.activo && mesa.estado !== 'fuera_servicio',
      )
      .reduce((total, mesa) => total + mesa.capacidad, 0);
    if (ocupadas >= 3 && capacidad < input.personas) {
      throw new Error('No queda espacio en ese ambiente para la hora elegida.');
    }
    const ahora = new Date();
    const yy = String(ahora.getFullYear()).slice(-2);
    const mm = String(ahora.getMonth() + 1).padStart(2, '0');
    const dd = String(ahora.getDate()).padStart(2, '0');
    const prefijo = `RES-${yy}${mm}${dd}-`;
    const delDia = this._reservas().filter((reserva) => reserva.codigo.startsWith(prefijo));
    const reserva: Reserva = {
      id: uid('r'),
      codigo: `${prefijo}${String(delDia.length + 1).padStart(4, '0')}`,
      perfilId: perfil.id,
      clienteNombre: nombre,
      clienteTelefono: telefono,
      fecha: input.fecha,
      hora: input.hora,
      personas: input.personas,
      ambiente: input.ambiente,
      notas: input.notas?.trim(),
      estado: 'pendiente',
      createdAt: ahora.toISOString(),
    };
    this._reservas.update((items) => [reserva, ...items]);
    return reserva;
  }

  actualizarEstadoReserva(id: string, estado: EstadoReserva): Reserva {
    const reserva = this._reservas().find((item) => item.id === id);
    if (!reserva) {
      throw new Error('No encontramos la reserva.');
    }
    const actualizada: Reserva = { ...reserva, estado };
    this._reservas.update((items) =>
      items.map((item) => (item.id === id ? actualizada : item)),
    );
    if (reserva.mesaId) {
      if (estado === 'cancelada' || estado === 'atendida') {
        this._mesas.update((items) =>
          items.map((mesa) =>
            mesa.id === reserva.mesaId && mesa.estado === 'reservada'
              ? { ...mesa, estado: 'libre' }
              : mesa,
          ),
        );
      }
      if (estado === 'confirmada') {
        this._mesas.update((items) =>
          items.map((mesa) =>
            mesa.id === reserva.mesaId && mesa.estado === 'libre'
              ? { ...mesa, estado: 'reservada' }
              : mesa,
          ),
        );
      }
    }
    return actualizada;
  }

  asignarMesaReserva(id: string, mesaId: number | null): Reserva {
    const reserva = this._reservas().find((item) => item.id === id);
    if (!reserva) {
      throw new Error('No encontramos la reserva.');
    }
    if (mesaId !== null) {
      const mesa = this._mesas().find((item) => item.id === mesaId);
      if (!mesa || !mesa.activo) {
        throw new Error('La mesa seleccionada no está disponible.');
      }
      if (mesa.estado === 'ocupada' || mesa.estado === 'fuera_servicio') {
        throw new Error('La mesa seleccionada no está disponible.');
      }
      if (mesa.capacidad < reserva.personas) {
        throw new Error('La mesa no tiene capacidad suficiente para la reserva.');
      }
    }
    const anterior = reserva.mesaId;
    const actualizada: Reserva = { ...reserva, mesaId: mesaId ?? undefined };
    this._reservas.update((items) =>
      items.map((item) => (item.id === id ? actualizada : item)),
    );
    this._mesas.update((items) =>
      items.map((mesa) => {
        if (anterior && mesa.id === anterior && mesa.estado === 'reservada') {
          return { ...mesa, estado: 'libre' };
        }
        if (mesaId && mesa.id === mesaId) {
          return {
            ...mesa,
            estado: reserva.estado === 'confirmada' ? 'reservada' : mesa.estado,
          };
        }
        return mesa;
      }),
    );
    return actualizada;
  }

  guardarConfigWeb(config: ConfigWeb): void {
    this._configWeb.set(config);
  }

  guardarConfigPuntos(config: ConfigPuntos): void {
    this._configPuntos.set(config);
  }

  reiniciarDemo(): void {
    Object.values(KEYS).forEach((key) => {
      try {
        localStorage.removeItem(key);
      } catch {
        // Sin acción.
      }
    });
    location.reload();
  }

  private generarCodigo(fecha: Date): string {
    const yy = String(fecha.getFullYear()).slice(-2);
    const mm = String(fecha.getMonth() + 1).padStart(2, '0');
    const dd = String(fecha.getDate()).padStart(2, '0');
    const prefix = `WEB-${yy}${mm}${dd}-`;
    const delDia = this._pedidos().filter((pedido) => pedido.codigo.startsWith(prefix));
    const numero = String(delDia.length + 1).padStart(4, '0');
    return `${prefix}${numero}`;
  }
}
