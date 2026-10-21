import { computed, inject, Injectable, signal } from '@angular/core';
import {
  CrearCuentaInput,
  Perfil,
  RegisterResult,
  Rol,
} from '../models';
import { DemoStoreService } from './demo-store.service';
import { SupabaseService } from './supabase.service';
import { environment } from '../../../environments/environment';
import { normalizePhone } from '../utils/format';

function mapPerfil(row: Record<string, unknown>): Perfil {
  const rol = String(row['rol'] ?? 'cliente').toLowerCase() === 'admin' ? 'admin' : 'cliente';
  return {
    id: String(row['id'] ?? ''),
    clienteId: Number(row['id_cliente'] ?? 0),
    nombre: String(row['nombre'] ?? 'Cliente'),
    email: String(row['email'] ?? ''),
    telefono: normalizePhone(String(row['telefono'] ?? '')),
    rol,
    puntos: Number(row['puntos'] ?? 0),
    createdAt: String(
      row['creado_en'] ?? row['created_at'] ?? new Date().toISOString(),
    ),
  };
}

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly demo = inject(DemoStoreService);
  private readonly supabase = inject(SupabaseService);

  readonly demoMode = environment.useDemoFallback;
  readonly loading = signal(false);
  readonly initialized = signal(false);

  private readonly remotePerfil = signal<Perfil | null>(null);
  private readonly remotePerfiles = signal<Perfil[]>([]);
  private resolveReady!: () => void;
  private readonly ready = new Promise<void>((resolve) => {
    this.resolveReady = resolve;
  });

  readonly perfil = computed<Perfil | null>(() =>
    this.demoMode ? this.demo.perfilActual() : this.remotePerfil(),
  );
  readonly isLoggedIn = computed(() => this.perfil() !== null);
  readonly isAdmin = computed(() => this.perfil()?.rol === 'admin');
  readonly perfiles = computed<Perfil[]>(() =>
    this.demoMode ? this.demo.perfiles() : this.remotePerfiles(),
  );

  constructor() {
    void this.init();
  }

  async ensureInitialized(): Promise<void> {
    return this.ready;
  }

  private async init(): Promise<void> {
    if (this.demoMode) {
      this.initialized.set(true);
      this.resolveReady();
      return;
    }
    try {
      const { data } = await this.supabase.client.auth.getSession();
      if (data.session?.user) {
        await this.cargarPerfilRemoto(data.session.user.id);
      }
      this.supabase.client.auth.onAuthStateChange((_event, session) => {
        if (session?.user) {
          void this.cargarPerfilRemoto(session.user.id);
        } else {
          this.remotePerfil.set(null);
        }
      });
    } finally {
      this.initialized.set(true);
      this.resolveReady();
    }
  }

  async login(email: string, password: string): Promise<Perfil> {
    this.loading.set(true);
    try {
      if (this.demoMode) {
        return this.demo.login(email, password);
      }
      const { data, error } = await this.supabase.client.auth.signInWithPassword({
        email: email.trim(),
        password,
      });
      if (error) {
        throw new Error(this.supabase.errorMessage(error));
      }
      if (!data.user) {
        throw new Error('No pudimos iniciar sesión. Inténtalo de nuevo.');
      }
      const perfil = await this.cargarPerfilRemoto(data.user.id);
      if (!perfil) {
        throw new Error('No encontramos tu perfil. Contacta con la pollería.');
      }
      return perfil;
    } finally {
      this.loading.set(false);
    }
  }

  async register(input: CrearCuentaInput): Promise<RegisterResult> {
    this.loading.set(true);
    try {
      if (this.demoMode) {
        return {
          perfil: this.demo.register(input),
          requiresConfirmation: false,
        };
      }
      const { data, error } = await this.supabase.client.auth.signUp({
        email: input.email.trim(),
        password: input.password,
        options: {
          data: {
            nombre: input.nombre.trim(),
            telefono: normalizePhone(input.telefono),
          },
        },
      });
      if (error) {
        throw new Error(this.supabase.errorMessage(error));
      }
      if (!data.session?.user) {
        return {
          perfil: null,
          requiresConfirmation: true,
          message:
            'Te enviamos un correo para confirmar tu cuenta. Después de confirmarlo, inicia sesión.',
        };
      }
      const perfil = await this.cargarPerfilRemoto(data.session.user.id);
      return { perfil, requiresConfirmation: false };
    } finally {
      this.loading.set(false);
    }
  }

  async logout(): Promise<void> {
    if (this.demoMode) {
      this.demo.logout();
      return;
    }
    await this.supabase.client.auth.signOut();
    this.remotePerfil.set(null);
  }

  async actualizarPerfil(nombre: string, telefono: string): Promise<Perfil> {
    if (this.demoMode) {
      return this.demo.actualizarPerfil(nombre, telefono);
    }
    const { error } = await this.supabase.client.rpc('sp_web_actualizar_perfil', {
      p_nombre: nombre.trim(),
      p_telefono: normalizePhone(telefono),
    });
    if (error) {
      throw new Error(this.supabase.errorMessage(error));
    }
    const actual = this.remotePerfil();
    if (!actual) {
      throw new Error('Necesitas iniciar sesión.');
    }
    const actualizado: Perfil = {
      ...actual,
      nombre: nombre.trim(),
      telefono: normalizePhone(telefono),
    };
    this.remotePerfil.set(actualizado);
    return actualizado;
  }

  async listarPerfiles(): Promise<Perfil[]> {
    if (this.demoMode) {
      return this.demo.perfiles();
    }
    const { data, error } = await this.supabase.client
      .from('perfiles')
      .select('*')
      .order('nombre', { ascending: true });
    if (error) {
      throw new Error(this.supabase.errorMessage(error));
    }
    const perfiles = (data ?? []).map((row) => mapPerfil(row as Record<string, unknown>));
    this.remotePerfiles.set(perfiles);
    return perfiles;
  }

  async cambiarRol(perfilId: string, rol: Rol): Promise<void> {
    if (this.demoMode) {
      this.demo.cambiarRol(perfilId, rol);
      return;
    }
    const { error } = await this.supabase.client.rpc('sp_admin_cambiar_rol', {
      p_id: perfilId,
      p_rol: rol,
    });
    if (error) {
      throw new Error(this.supabase.errorMessage(error));
    }
    await this.listarPerfiles();
  }

  async ajustarPuntos(perfilId: string, puntos: number, motivo: string): Promise<void> {
    if (this.demoMode) {
      this.demo.ajustarPuntos(perfilId, puntos, motivo);
      return;
    }
    const { error } = await this.supabase.client.rpc('sp_admin_ajustar_puntos', {
      p_id: perfilId,
      p_puntos: puntos,
      p_motivo: motivo,
    });
    if (error) {
      throw new Error(this.supabase.errorMessage(error));
    }
    await this.listarPerfiles();
  }

  private async cargarPerfilRemoto(userId: string): Promise<Perfil | null> {
    const { data, error } = await this.supabase.client
      .from('perfiles')
      .select('*')
      .eq('id', userId)
      .maybeSingle();
    if (error) {
      throw new Error(this.supabase.errorMessage(error));
    }
    if (data) {
      const perfil = mapPerfil(data as Record<string, unknown>);
      this.remotePerfil.set(perfil);
      return perfil;
    }
    const { data: userData } = await this.supabase.client.auth.getUser();
    if (!userData.user) {
      this.remotePerfil.set(null);
      return null;
    }
    const metadata = userData.user.user_metadata as Record<string, unknown> | undefined;
    const perfil: Perfil = {
      id: userData.user.id,
      clienteId: 0,
      nombre: String(metadata?.['nombre'] ?? userData.user.email?.split('@')[0] ?? 'Cliente'),
      email: userData.user.email ?? '',
      telefono: normalizePhone(String(metadata?.['telefono'] ?? '')),
      rol: 'cliente',
      puntos: 0,
      createdAt: userData.user.created_at ?? new Date().toISOString(),
    };
    this.remotePerfil.set(perfil);
    return perfil;
  }
}
