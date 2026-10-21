import { EstadoPedido, MetodoPago, TipoEntrega } from '../models';

export const ESTADOS_PEDIDO: Record<EstadoPedido, {
  label: string;
  descripcion: string;
  icono: string;
  color: string;
  orden: number;
}> = {
  pendiente: {
    label: 'Pendiente',
    descripcion: 'Recibimos tu pedido y lo estamos revisando.',
    icono: 'lucideClock',
    color: '#C47A12',
    orden: 1,
  },
  confirmado: {
    label: 'Confirmado',
    descripcion: 'Tu pedido fue confirmado y pasa a cocina.',
    icono: 'lucideCheckCircle2',
    color: '#1F7A4D',
    orden: 2,
  },
  en_preparacion: {
    label: 'En preparación',
    descripcion: 'Estamos cocinando tu pedido con todo el cuidado.',
    icono: 'lucideChefHat',
    color: '#C8102E',
    orden: 3,
  },
  en_camino: {
    label: 'En camino',
    descripcion: 'Tu pedido va en camino. Llega pronto.',
    icono: 'lucideTruck',
    color: '#2563EB',
    orden: 4,
  },
  listo: {
    label: 'Listo para recoger',
    descripcion: 'Tu pedido está listo. Te esperamos en la pollería.',
    icono: 'lucidePackageCheck',
    color: '#1F7A4D',
    orden: 4,
  },
  entregado: {
    label: 'Entregado',
    descripcion: 'Pedido entregado. ¡Buen provecho!',
    icono: 'lucideCheckCircle2',
    color: '#1F7A4D',
    orden: 5,
  },
  cancelado: {
    label: 'Cancelado',
    descripcion: 'Este pedido fue cancelado.',
    icono: 'lucideXCircle',
    color: '#B42318',
    orden: 0,
  },
};

export const ESTADOS_TIMELINE_DELIVERY: EstadoPedido[] = [
  'pendiente',
  'confirmado',
  'en_preparacion',
  'en_camino',
  'entregado',
];

export const ESTADOS_TIMELINE_RECOJO: EstadoPedido[] = [
  'pendiente',
  'confirmado',
  'en_preparacion',
  'listo',
  'entregado',
];

export function timelineFor(tipoEntrega: TipoEntrega): EstadoPedido[] {
  return tipoEntrega === 'delivery' ? ESTADOS_TIMELINE_DELIVERY : ESTADOS_TIMELINE_RECOJO;
}

export function siguienteEstado(
  estado: EstadoPedido,
  tipoEntrega: TipoEntrega,
): EstadoPedido | null {
  const timeline = timelineFor(tipoEntrega);
  const index = timeline.indexOf(estado);
  if (index < 0 || index >= timeline.length - 1) {
    return null;
  }
  return timeline[index + 1];
}

export const METODOS_PAGO: { value: MetodoPago; label: string; icono: string; detalle: string }[] = [
  {
    value: 'efectivo',
    label: 'Efectivo',
    icono: 'lucideBanknote',
    detalle: 'Paga al recibir tu pedido',
  },
  {
    value: 'yape',
    label: 'Yape',
    icono: 'lucideSmartphone',
    detalle: 'Escanea el QR al confirmar',
  },
  {
    value: 'plin',
    label: 'Plin',
    icono: 'lucideSmartphone',
    detalle: 'Escanea el QR al confirmar',
  },
  {
    value: 'tarjeta',
    label: 'Tarjeta',
    icono: 'lucideCreditCard',
    detalle: 'Pago simulado de demostración',
  },
];

export const TIPOS_ENTREGA: { value: TipoEntrega; label: string; icono: string; detalle: string }[] = [
  {
    value: 'delivery',
    label: 'Delivery',
    icono: 'lucideTruck',
    detalle: 'Llevamos tu pedido a tu puerta',
  },
  {
    value: 'recojo',
    label: 'Recojo',
    icono: 'lucideShoppingBag',
    detalle: 'Recógelo en Av. Los Maestros 100',
  },
];

export function metodoPagoLabel(metodo: MetodoPago): string {
  return METODOS_PAGO.find((item) => item.value === metodo)?.label ?? metodo;
}

export function tipoEntregaLabel(tipo: TipoEntrega): string {
  return TIPOS_ENTREGA.find((item) => item.value === tipo)?.label ?? tipo;
}

export function estadoLabel(estado: EstadoPedido): string {
  return ESTADOS_PEDIDO[estado]?.label ?? estado;
}

export function estadoInfo(estado: EstadoPedido) {
  return ESTADOS_PEDIDO[estado] ?? ESTADOS_PEDIDO.pendiente;
}
