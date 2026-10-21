export type AmbienteMesa = 'salon' | 'terraza' | 'vip';

export type EstadoMesa =
  | 'libre'
  | 'ocupada'
  | 'reservada'
  | 'por_cobrar'
  | 'fuera_servicio';

export type TipoMesa = 'estandar' | 'familiar' | 'box' | 'barra';

export type EstadoReserva = 'pendiente' | 'confirmada' | 'atendida' | 'cancelada';

export interface Mesa {
  id: number;
  numero: string;
  ambiente: AmbienteMesa;
  tipo: TipoMesa;
  capacidad: number;
  detalle: string;
  estado: EstadoMesa;
  activo: boolean;
}

export interface Reserva {
  id: string;
  codigo: string;
  perfilId?: string;
  clienteNombre: string;
  clienteTelefono: string;
  fecha: string;
  hora: string;
  personas: number;
  ambiente: AmbienteMesa;
  notas?: string;
  estado: EstadoReserva;
  mesaId?: number;
  createdAt: string;
}

export interface CrearReservaInput {
  clienteNombre: string;
  clienteTelefono: string;
  fecha: string;
  hora: string;
  personas: number;
  ambiente: AmbienteMesa;
  notas?: string;
}

export interface AmbienteInfo {
  id: AmbienteMesa;
  label: string;
  descripcion: string;
  icono: string;
}

export interface EstadoMesaInfo {
  label: string;
  color: string;
  descripcion: string;
}

export interface EstadoReservaInfo {
  label: string;
  color: string;
  descripcion: string;
}

export interface TipoMesaInfo {
  label: string;
  descripcion: string;
}

export const AMBIENTES: AmbienteInfo[] = [
  {
    id: 'salon',
    label: 'Salón principal',
    descripcion: 'Mesas cómodas junto a la brasa, ideal para familias.',
    icono: 'lucideUtensilsCrossed',
  },
  {
    id: 'terraza',
    label: 'Terraza',
    descripcion: 'Al aire libre, con vista al jardín y música suave.',
    icono: 'lucideSun',
  },
  {
    id: 'vip',
    label: 'Sala VIP',
    descripcion: 'Espacio reservado para celebraciones y reuniones.',
    icono: 'lucideCrown',
  },
];

export const ESTADOS_MESA: Record<EstadoMesa, EstadoMesaInfo> = {
  libre: {
    label: 'Libre',
    color: '#2F8F5B',
    descripcion: 'Disponible para recibir clientes.',
  },
  ocupada: {
    label: 'Ocupada',
    color: '#C8102E',
    descripcion: 'Clientes sentados y atendiendo.',
  },
  reservada: {
    label: 'Reservada',
    color: '#B8860B',
    descripcion: 'Separada para una reserva.',
  },
  por_cobrar: {
    label: 'Por cobrar',
    color: '#2563A8',
    descripcion: 'Consumo terminado, pendiente de pago.',
  },
  fuera_servicio: {
    label: 'Fuera de servicio',
    color: '#6B7280',
    descripcion: 'No disponible por mantenimiento.',
  },
};

export const ESTADOS_RESERVA: Record<EstadoReserva, EstadoReservaInfo> = {
  pendiente: {
    label: 'Pendiente',
    color: '#B8860B',
    descripcion: 'Esperando confirmación del equipo.',
  },
  confirmada: {
    label: 'Confirmada',
    color: '#2F8F5B',
    descripcion: 'Mesa separada y confirmada.',
  },
  atendida: {
    label: 'Atendida',
    color: '#6B7280',
    descripcion: 'El cliente ya fue recibido.',
  },
  cancelada: {
    label: 'Cancelada',
    color: '#C8102E',
    descripcion: 'La reserva fue anulada.',
  },
};

export const TIPOS_MESA: Record<TipoMesa, TipoMesaInfo> = {
  estandar: {
    label: 'Estándar',
    descripcion: 'Mesa cuadrada para dos o cuatro personas.',
  },
  familiar: {
    label: 'Familiar',
    descripcion: 'Mesa amplia para grupos de hasta ocho.',
  },
  box: {
    label: 'Box',
    descripcion: 'Espacio privado y semicircular.',
  },
  barra: {
    label: 'Barra',
    descripcion: 'Asientos altos junto a la barra.',
  },
};
