export type EstadoPedido =
  | 'pendiente'
  | 'confirmado'
  | 'en_preparacion'
  | 'en_camino'
  | 'listo'
  | 'entregado'
  | 'cancelado';

export type TipoEntrega = 'delivery' | 'recojo';

export type MetodoPago = 'efectivo' | 'yape' | 'plin' | 'tarjeta';

export interface PedidoItem {
  productoId: number;
  nombre: string;
  precioUnitario: number;
  cantidad: number;
  imagenUrl: string;
  nota?: string;
}

export interface Pedido {
  id: string;
  codigo: string;
  perfilId: string;
  clienteNombre: string;
  clienteEmail: string;
  clienteTelefono: string;
  tipoEntrega: TipoEntrega;
  direccion?: string;
  referencia?: string;
  distrito?: string;
  metodoPago: MetodoPago;
  estado: EstadoPedido;
  items: PedidoItem[];
  subtotal: number;
  descuentoPuntos: number;
  costoDelivery: number;
  total: number;
  puntosUsados: number;
  puntosGanados: number;
  notas?: string;
  createdAt: string;
  updatedAt: string;
  fEntregaEstimada?: string;
}

export interface CrearPedidoInput {
  perfilId: string;
  clienteNombre: string;
  clienteEmail: string;
  clienteTelefono: string;
  tipoEntrega: TipoEntrega;
  direccion?: string;
  referencia?: string;
  distrito?: string;
  metodoPago: MetodoPago;
  notas?: string;
  items: { productoId: number; cantidad: number; nota?: string }[];
  puntosUsados: number;
}

export interface CarritoItem {
  producto: import('./catalogo.models').Producto;
  cantidad: number;
  nota?: string;
}

export interface ResumenPedido {
  subtotal: number;
  costoDelivery: number;
  descuentoPuntos: number;
  total: number;
  puntosGanados: number;
  puntosUsados: number;
  maxPuntosCanjeables: number;
}

export interface EstadoPedidoInfo {
  estado: EstadoPedido;
  label: string;
  descripcion: string;
  icono: string;
  color: string;
  orden: number;
}
