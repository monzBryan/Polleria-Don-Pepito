export type Rol = 'cliente' | 'admin';

export interface Perfil {
  id: string;
  clienteId: number;
  nombre: string;
  email: string;
  telefono: string;
  rol: Rol;
  puntos: number;
  createdAt: string;
}

export interface CuentaDemo extends Perfil {
  password: string;
}

export type TipoTransaccion = 'ganado' | 'canjeado' | 'ajuste' | 'bienvenida';

export interface TransaccionPuntos {
  id: string;
  perfilId: string;
  pedidoId?: string;
  tipo: TipoTransaccion;
  puntos: number;
  descripcion: string;
  createdAt: string;
}

export interface CrearCuentaInput {
  nombre: string;
  email: string;
  telefono: string;
  password: string;
}

export interface CredencialesInput {
  email: string;
  password: string;
}

export interface RegisterResult {
  perfil: Perfil | null;
  requiresConfirmation: boolean;
  message?: string;
}
