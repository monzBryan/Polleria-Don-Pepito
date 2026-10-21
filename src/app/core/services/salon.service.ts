import { computed, inject, Injectable } from '@angular/core';
import {
  CrearReservaInput,
  EstadoMesa,
  EstadoReserva,
  Mesa,
  Reserva,
} from '../models';
import { environment } from '../../../environments/environment';
import { uid } from '../utils/format';
import { DemoStoreService } from './demo-store.service';
import { SupabaseService } from './supabase.service';

@Injectable({ providedIn: 'root' })
export class SalonService {
  private readonly demo = inject(DemoStoreService);
  private readonly supabase = inject(SupabaseService);

  readonly mesas = computed(() =>
    [...this.demo.mesas()].sort((a, b) =>
      `${a.ambiente}-${a.numero}`.localeCompare(`${b.ambiente}-${b.numero}`),
    ),
  );

  readonly mesasActivas = computed(() => this.mesas().filter((mesa) => mesa.activo));

  readonly reservas = this.demo.reservasOrdenadas;

  readonly reservasActivas = computed(() =>
    this.reservas().filter(
      (reserva) => reserva.estado === 'pendiente' || reserva.estado === 'confirmada',
    ),
  );

  readonly mesasLibres = computed(
    () => this.mesasActivas().filter((mesa) => mesa.estado === 'libre').length,
  );

  mesasDeAmbiente(ambiente: Mesa['ambiente']): Mesa[] {
    return this.mesasActivas().filter((mesa) => mesa.ambiente === ambiente);
  }

  disponibilidad(ambiente: Mesa['ambiente']): number {
    return this.mesasDeAmbiente(ambiente)
      .filter((mesa) => mesa.estado === 'libre')
      .reduce((total, mesa) => total + mesa.capacidad, 0);
  }

  guardarMesa(mesa: Mesa): Mesa {
    return this.demo.guardarMesa(mesa);
  }

  eliminarMesa(id: number): void {
    this.demo.eliminarMesa(id);
  }

  cambiarEstadoMesa(id: number, estado: EstadoMesa): Mesa {
    return this.demo.cambiarEstadoMesa(id, estado);
  }

  async crearReserva(input: CrearReservaInput): Promise<Reserva> {
    if (environment.useDemoFallback) {
      return this.demo.crearReserva(input);
    }
    const { data, error } = await this.supabase.client.rpc('sp_web_crear_reserva', {
      p_nombre: input.clienteNombre.trim(),
      p_telefono: input.clienteTelefono.trim(),
      p_fecha: `${input.fecha}T${input.hora}:00`,
      p_personas: input.personas,
      p_ambiente: input.ambiente,
      p_notas: input.notas?.trim() ?? '',
    });
    if (error) {
      throw new Error(this.supabase.errorMessage(error));
    }
    const row = (data ?? {}) as Record<string, unknown>;
    return {
      id: String(row['id'] ?? uid('r')),
      codigo: String(row['codigo'] ?? row['codigo_reserva'] ?? ''),
      clienteNombre: input.clienteNombre.trim(),
      clienteTelefono: input.clienteTelefono.trim(),
      fecha: input.fecha,
      hora: input.hora,
      personas: input.personas,
      ambiente: input.ambiente,
      notas: input.notas?.trim(),
      estado: 'pendiente',
      createdAt: new Date().toISOString(),
    };
  }

  actualizarEstadoReserva(id: string, estado: EstadoReserva): Reserva {
    return this.demo.actualizarEstadoReserva(id, estado);
  }

  asignarMesa(id: string, mesaId: number | null): Reserva {
    return this.demo.asignarMesaReserva(id, mesaId);
  }
}
