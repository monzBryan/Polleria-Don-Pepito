import { computed, inject, Injectable } from '@angular/core';
import {
  DashboardData,
  EstadoStat,
  TopProducto,
  UsuarioAdminRow,
  VentaDia,
} from '../models';
import { OrderService } from './order.service';
import { AuthService } from './auth.service';
import { ESTADOS_PEDIDO } from '../utils/order-status';

const DIAS = ['dom', 'lun', 'mar', 'mié', 'jue', 'vie', 'sáb'];

function mismoDia(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

function inicioDia(fecha: Date): Date {
  const copy = new Date(fecha);
  copy.setHours(0, 0, 0, 0);
  return copy;
}

function isoDia(fecha: Date): string {
  const year = fecha.getFullYear();
  const month = String(fecha.getMonth() + 1).padStart(2, '0');
  const day = String(fecha.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

@Injectable({ providedIn: 'root' })
export class DashboardService {
  private readonly orders = inject(OrderService);
  private readonly auth = inject(AuthService);

  readonly data = computed<DashboardData>(() => {
    const pedidos = this.orders.pedidos();
    const hoy = new Date();
    const validos = pedidos.filter((pedido) => pedido.estado !== 'cancelado');
    const deHoy = validos.filter((pedido) =>
      mismoDia(new Date(pedido.createdAt), hoy),
    );

    const ventasHoy = deHoy.reduce((total, pedido) => total + pedido.total, 0);
    const pedidosHoy = deHoy.length;
    const ticketPromedio = pedidosHoy ? ventasHoy / pedidosHoy : 0;
    const puntosEmitidos = deHoy.reduce(
      (total, pedido) => total + pedido.puntosGanados,
      0,
    );

    return {
      ventasHoy: Number(ventasHoy.toFixed(2)),
      pedidosHoy,
      ticketPromedio: Number(ticketPromedio.toFixed(2)),
      puntosEmitidos,
      ventasSemana: this.ventasSemana(validos, hoy),
      estados: this.estados(pedidos),
      topProductos: this.topProductos(validos),
      ultimosPedidos: pedidos.slice(0, 6),
    };
  });

  readonly usuarios = computed<UsuarioAdminRow[]>(() => {
    const perfiles = this.auth.perfiles();
    const pedidos = this.orders.pedidos();
    return perfiles
      .map((perfil) => {
        const propios = pedidos.filter(
          (pedido) => pedido.perfilId === perfil.id && pedido.estado !== 'cancelado',
        );
        return {
          id: perfil.id,
          nombre: perfil.nombre,
          email: perfil.email,
          telefono: perfil.telefono,
          rol: perfil.rol,
          puntos: perfil.puntos,
          pedidos: propios.length,
          totalGastado: Number(
            propios.reduce((total, pedido) => total + pedido.total, 0).toFixed(2),
          ),
          createdAt: perfil.createdAt,
        } satisfies UsuarioAdminRow;
      })
      .sort((a, b) => b.totalGastado - a.totalGastado);
  });

  private ventasSemana(
    pedidos: DashboardData['ultimosPedidos'],
    hoy: Date,
  ): VentaDia[] {
    const dias: VentaDia[] = [];
    for (let index = 6; index >= 0; index--) {
      const fecha = inicioDia(hoy);
      fecha.setDate(fecha.getDate() - index);
      const delDia = pedidos.filter((pedido) =>
        mismoDia(new Date(pedido.createdAt), fecha),
      );
      dias.push({
        label: DIAS[fecha.getDay()],
        fecha: isoDia(fecha),
        total: Number(
          delDia.reduce((total, pedido) => total + pedido.total, 0).toFixed(2),
        ),
        pedidos: delDia.length,
      });
    }
    return dias;
  }

  private estados(pedidos: DashboardData['ultimosPedidos']): EstadoStat[] {
    return (Object.keys(ESTADOS_PEDIDO) as (keyof typeof ESTADOS_PEDIDO)[]).map(
      (estado) => {
        const info = ESTADOS_PEDIDO[estado];
        return {
          estado,
          label: info.label,
          cantidad: pedidos.filter((pedido) => pedido.estado === estado).length,
          color: info.color,
        };
      },
    );
  }

  private topProductos(pedidos: DashboardData['ultimosPedidos']): TopProducto[] {
    const mapa = new Map<string, TopProducto>();
    for (const pedido of pedidos) {
      for (const item of pedido.items) {
        const actual = mapa.get(item.nombre) ?? {
          nombre: item.nombre,
          cantidad: 0,
          total: 0,
          imagenUrl: item.imagenUrl,
        };
        actual.cantidad += item.cantidad;
        actual.total = Number(
          (actual.total + item.precioUnitario * item.cantidad).toFixed(2),
        );
        mapa.set(item.nombre, actual);
      }
    }
    return [...mapa.values()].sort((a, b) => b.cantidad - a.cantidad).slice(0, 5);
  }
}
