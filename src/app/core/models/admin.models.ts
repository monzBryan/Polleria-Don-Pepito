import { Pedido } from './pedido.models';

export interface VentaDia {
  label: string;
  fecha: string;
  total: number;
  pedidos: number;
}

export interface TopProducto {
  nombre: string;
  cantidad: number;
  total: number;
  imagenUrl: string;
}

export interface EstadoStat {
  estado: string;
  label: string;
  cantidad: number;
  color: string;
}

export interface DashboardData {
  ventasHoy: number;
  pedidosHoy: number;
  ticketPromedio: number;
  puntosEmitidos: number;
  ventasSemana: VentaDia[];
  estados: EstadoStat[];
  topProductos: TopProducto[];
  ultimosPedidos: Pedido[];
}

export interface UsuarioAdminRow {
  id: string;
  nombre: string;
  email: string;
  telefono: string;
  rol: 'cliente' | 'admin';
  puntos: number;
  pedidos: number;
  totalGastado: number;
  createdAt: string;
}
