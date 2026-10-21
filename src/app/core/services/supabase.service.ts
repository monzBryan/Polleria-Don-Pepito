import { Injectable } from '@angular/core';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { environment } from '../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class SupabaseService {
  readonly client: SupabaseClient;
  readonly isConfigured: boolean;

  constructor() {
    this.isConfigured = Boolean(environment.supabaseUrl && environment.supabaseAnonKey);
    this.client = createClient(environment.supabaseUrl, environment.supabaseAnonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
      },
    });
  }

  errorMessage(error: unknown): string {
    if (!error) {
      return 'Ocurrió un error inesperado. Inténtalo de nuevo.';
    }
    if (typeof error === 'string') {
      return error;
    }
    const value = error as {
      message?: string;
      code?: string;
      error_description?: string;
    };
    const message = value.message ?? value.error_description ?? '';
    const code = value.code ?? '';

    if (code === '42P01' || /relation .* does not exist/i.test(message)) {
      return 'La base de datos todavía no está configurada. Estamos mostrando datos de demostración.';
    }
    if (/invalid login credentials/i.test(message)) {
      return 'Correo o contraseña incorrectos.';
    }
    if (/email not confirmed/i.test(message)) {
      return 'Confirma tu correo antes de iniciar sesión. Revisa tu bandeja de entrada.';
    }
    if (/user already registered/i.test(message)) {
      return 'Ya existe una cuenta con ese correo.';
    }
    if (/failed to fetch|networkerror|load failed/i.test(message)) {
      return 'No pudimos conectar con el servidor. Revisa tu conexión e inténtalo de nuevo.';
    }
    if (/duplicate key/i.test(message)) {
      return 'Ese registro ya existe. Revisa los datos e inténtalo de nuevo.';
    }
    if (/row-level security|permission denied/i.test(message)) {
      return 'No tienes permisos para realizar esta acción.';
    }
    return message || 'Ocurrió un error inesperado. Inténtalo de nuevo.';
  }
}
